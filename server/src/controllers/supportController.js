// ============================================================
// FILE: server/src/controllers/supportController.js
// ============================================================

import SupportTicket from "../models/SupportTicket.js";
import SupportMessage from "../models/SupportMessage.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { getIO } from "../lib/socket.js";

// ── Helper: emit to admin room + ticket room ──────────────
function emitTicketUpdate(ticket) {
  const io = getIO();
  io.to("admin_support").emit("ticket:updated", ticket);
  io.to(`support:${ticket._id}`).emit("ticket:updated", ticket);
}

// ── POST /api/support/tickets ─────────────────────────────
export async function createTicket(req, res) {
  try {
    const { orderId, category, description } = req.body;
    const userId = req.user.id;
    // console.log(req.user)
    
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user_id.toString() !== userId.toString())
      return res.status(403).json({ message: "Not your order" });

    const ticket = await SupportTicket.create({
      userId,
      orderId,
      category,
      description: description || "",
    });
    // System message
    await SupportMessage.create({
      ticketId: ticket._id,
      senderType: "system",
      message: `Ticket created: ${ticket.ticketId} — Category: ${category.replace(/_/g, " ")}`,
    });

    const populated = await SupportTicket.findById(ticket._id)
      .populate("userId", "name email")
      .populate("orderId");

    // Notify admin room
    const io = getIO();
    io.to("admin_support").emit("ticket:new", populated);

    res.status(201).json(populated);
  } catch (err) {
    console.error("[Support] createTicket error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// ── GET /api/support/tickets (admin: all | user: own) ─────
export async function getTickets(req, res) {
  try {
    const isAdmin = req.user.role === "admin";
    const filter = isAdmin ? {} : { userId: req.user._id };

    const tickets = await SupportTicket.find(filter)
      .populate("userId", "name email")
      .populate("orderId", "total_amount status restaurant_name")
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

// ── GET /api/support/tickets/:id ──────────────────────────
export async function getTicketById(req, res) {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("orderId")
      .populate("assignedAdmin", "name");

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Check access
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && ticket.userId._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Access denied" });

    // Fetch user stats
    const [totalOrders, totalTickets] = await Promise.all([
      Order.countDocuments({ user_id: ticket.userId._id }),
      SupportTicket.countDocuments({ userId: ticket.userId._id }),
    ]);

    const totalSpent = await Order.aggregate([
      { $match: { user_id: ticket.userId._id, status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$total_amount" } } },
    ]);

    res.json({
      ticket,
      userStats: {
        totalOrders,
        totalTickets,
        totalSpent: totalSpent[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

// ── GET /api/support/tickets/:id/messages ─────────────────
export async function getMessages(req, res) {
  try {
    const messages = await SupportMessage.find({ ticketId: req.params.id })
      .populate("senderId", "name")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

// ── POST /api/support/tickets/:id/message ─────────────────
export async function sendMessage(req, res) {
  try {
    const { message, image } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const isAdmin = req.user.role === "admin";
    const senderType = isAdmin ? "admin" : "user";

    const msg = await SupportMessage.create({
      ticketId: ticket._id,
      senderType,
      senderId: req.user._id,
      message,
      image: image || null,
    });

    const populated = await SupportMessage.findById(msg._id).populate("senderId", "name");

    // Update ticket
    ticket.lastMessageAt = new Date();
    if (isAdmin) ticket.unreadUser += 1;
    else ticket.unreadAdmin += 1;
    await ticket.save();

    // Emit to ticket room
    const io = getIO();
    io.to(`support:${ticket._id}`).emit("message:new", populated);
    io.to("admin_support").emit("ticket:message", { ticketId: ticket._id, message: populated });

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

// ── PATCH /api/support/tickets/:id/status ─────────────────
export async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = status;

    // If admin joins → active
    if (status === "active" && !ticket.assignedAdmin) {
      ticket.assignedAdmin = req.user._id;
    }

    ticket.actionLog.push({
      action: `Status changed to ${status}`,
      performedBy: req.user._id,
    });

    await ticket.save();

    const populated = await SupportTicket.findById(ticket._id)
      .populate("userId", "name email")
      .populate("orderId");

    emitTicketUpdate(populated);

    // Notify user
    const io = getIO();
    io.to(`user:${ticket.userId}`).emit("ticket:status", {
      ticketId: ticket._id,
      status,
      message: status === "active" ? "Support staff joined the chat" : `Ticket status: ${status}`,
    });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

// ── PATCH /api/support/tickets/:id/resolve ────────────────
export async function resolveTicket(req, res) {
  try {
    const { resolutionSummary, resolutionType } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = "resolved";
    ticket.resolutionSummary = resolutionSummary;
    ticket.resolutionType = resolutionType;
    ticket.resolvedAt = new Date();
    ticket.actionLog.push({
      action: `Resolved: ${resolutionType}`,
      performedBy: req.user._id,
      meta: { resolutionSummary },
    });

    await ticket.save();

    // System message
    await SupportMessage.create({
      ticketId: ticket._id,
      senderType: "system",
      message: `✅ Ticket resolved. Type: ${resolutionType?.replace(/_/g, " ")}. Notes: ${resolutionSummary}`,
    });

    const populated = await SupportTicket.findById(ticket._id)
      .populate("userId", "name email")
      .populate("orderId");

    emitTicketUpdate(populated);

    const io = getIO();
    io.to(`user:${ticket.userId}`).emit("ticket:resolved", {
      ticketId: ticket._id,
      resolutionSummary,
      resolutionType,
    });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

// ── POST /api/support/tickets/:id/refund ──────────────────
export async function processRefund(req, res) {
  try {
    const { refundType, amount, reason } = req.body;
    // refundType: "full" | "partial" | "item"
    const ticket = await SupportTicket.findById(req.params.id).populate("orderId");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    let refundAmount = amount;
    if (refundType === "full") refundAmount = ticket.orderId.total_amount;

    ticket.refundAmount = (ticket.refundAmount || 0) + refundAmount;
    ticket.actionLog.push({
      action: `Refund processed: ₹${refundAmount} (${refundType})`,
      performedBy: req.user._id,
      meta: { refundType, amount: refundAmount, reason },
    });

    await ticket.save();

    // System message
    await SupportMessage.create({
      ticketId: ticket._id,
      senderType: "system",
      message: `💰 Refund of ₹${refundAmount} processed (${refundType}). Reason: ${reason}`,
    });

    const io = getIO();
    io.to(`support:${ticket._id}`).emit("ticket:refund", { refundAmount, refundType });
    io.to(`user:${ticket.userId}`).emit("ticket:refund", { refundAmount, refundType });

    res.json({ success: true, refundAmount });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

// ── PATCH /api/support/tickets/:id/note ───────────────────
export async function addNote(req, res) {
  try {
    const { note } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.internalNotes.push({ note, addedBy: req.user._id });
    await ticket.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}