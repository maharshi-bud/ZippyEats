// ============================================================
// FILE: server/src/controllers/supportController.js
// ============================================================

import SupportTicket from "../models/SupportTicket.js";
import SupportMessage from "../models/SupportMessage.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { getIO } from "../lib/socket.js";

import {
  notifyNewTicket,
  notifyTicketUrgent,
  notifyTicketStatusChanged,
  notifyRefundIssued,
} from "../services/fcmService.js";



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



      
  try {
  const user = await User.findById(userId);
  await notifyNewTicket({
    ticketId: ticket._id.toString(),
    ticketNo: ticket.ticketId,
    category: ticket.category,
    userName: user?.name || "A user",
  });
  if (["urgent", "high"].includes(ticket.priority)) {
    await notifyTicketUrgent({
      ticketId: ticket._id.toString(),
      ticketNo: ticket.ticketId,
      category: ticket.category,
    });
  }
} catch (fcmErr) {
  console.error("FCM FAILED (non-fatal):", fcmErr.message);
}

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
    if (isAdmin) {
      io.to(`user:${ticket.userId.toString()}`).emit("message:new", populated);
    }
    io.to("admin_support").emit("ticket:message", { ticketId: ticket._id, message: populated });

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

// ============================================================
// FILE: server/src/controllers/supportController.js
// CHANGE: Only the updateStatus function — replace it
// ============================================================

// ── PATCH /api/support/tickets/:id/status ─────────────────
export async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = status;
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

    const io = getIO();
    console.log("[Support] Emitting to room:", `user:${ticket.userId.toString()}`);
    io.to(`user:${ticket.userId.toString()}`).emit("ticket:status", {
      ticketId: ticket._id.toString(),
      status,
      message:
        status === "active"
          ? "Support staff joined the chat"
          : `Ticket status updated: ${status}`,
    });


   // ✅ Fix
try {
  const user = await User.findById(ticket.userId);
  await notifyTicketStatusChanged({
    userFcmToken: user?.fcmToken,
    status,
    ticketNo: ticket.ticketId,
    ticketId: ticket._id.toString(),
    orderId: ticket.orderId?.toString(),
  });
} catch (fcmErr) {
  console.error("FCM FAILED (non-fatal):", fcmErr.message);
}

res.json(populated); // always reached



    // res.json(populated);
  } catch (err) {
    console.error("[Support] updateStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
} 


// ── PATCH /api/support/tickets/:id/edit-order ─────────────
// Allows support staff to edit order details
export async function editOrder(req, res) {
  try {
    const ticket = await SupportTicket.findById(req.params.id).populate("orderId");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
 
    const order = await Order.findById(ticket.orderId._id);
    if (!order) return res.status(404).json({ message: "Order not found" });
 
    const { field, value, reason } = req.body;
    // field: "delivery_address.full_name" | "delivery_address.phone" |
    //        "delivery_address.address_line" | "delivery_address.city" |
    //        "delivery_address.pincode" | "items" (full items array)
 
    const allowedFields = [
      "delivery_address.full_name",
      "delivery_address.phone",
      "delivery_address.address_line",
      "delivery_address.city",
      "delivery_address.state",
      "delivery_address.pincode",
      "items",
    ];
 
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ message: `Field "${field}" is not editable` });
    }
 
    // Apply the change using dot notation
    if (field.startsWith("delivery_address.")) {
      const key = field.split(".")[1];
      order.delivery_address[key] = value;
    } else if (field === "items") {
      // value should be array of { menu_item_id, name, quantity, price, veg, image }
      if (!Array.isArray(value) || value.length === 0) {
        return res.status(400).json({ message: "Items must be a non-empty array" });
      }
      order.items = value;
 
      // Recalculate totals
      const subtotal = value.reduce((sum, item) => sum + item.price * item.quantity, 0);
      order.subtotal = subtotal;
      order.tax_amount = parseFloat((subtotal * 0.05).toFixed(2));
      order.total_amount = subtotal + order.delivery_fee + order.tax_amount;
    }
 
    order._updatedByAdmin = true;
    await order.save();
 
    // Log the action on the ticket
    const changeLabel = field === "items"
      ? `Items updated`
      : `${field.replace("delivery_address.", "").replace(/_/g, " ")} changed to "${value}"`;
 
    ticket.actionLog.push({
      action: `Order edit — ${changeLabel}. Reason: ${reason || "Support action"}`,
      performedBy: req.user._id,
    });
    await ticket.save();
 
    // System message in chat
    const msg = await SupportMessage.create({
      ticketId: ticket._id,
      senderType: "system",
      message: `✏️ Order updated by support: ${changeLabel}.${reason ? ` Reason: ${reason}` : ""}`,
    });
 
    const io = getIO();
    io.to(`support:${ticket._id}`).emit("message:new", msg);
    io.to(`user:${ticket.userId.toString()}`).emit("message:new", msg);
 
    res.json({ success: true, order, message: msg });
  } catch (err) {
    console.error("[Support] editOrder error:", err);
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


// ── POST /api/support/tickets/:id/system-message ──────────
export async function sendSystemMessage(req, res) {
  try {
    const { message } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const msg = await SupportMessage.create({
      ticketId: ticket._id,
      senderType: "system",
      message,
    });

    const io = getIO();
    io.to(`support:${ticket._id}`).emit("message:new", msg);

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}



// ── POST /api/support/tickets/:id/refund ──────────────────
// working  export async function processRefund(req, res) {
//   try {
//     const { refundType, amount, reason } = req.body;
//     // refundType: "full" | "partial" | "item"
//     const ticket = await SupportTicket.findById(req.params.id).populate("orderId");
//     if (!ticket) return res.status(404).json({ message: "Ticket not found" });

//     let refundAmount = amount;
//     if (refundType === "full") refundAmount = ticket.orderId.total_amount;

//     ticket.refundAmount = (ticket.refundAmount || 0) + refundAmount;
//     ticket.actionLog.push({
//       action: `Refund processed: ₹${refundAmount} (${refundType})`,
//       performedBy: req.user._id,
//       meta: { refundType, amount: refundAmount, reason },
//     });

//     await ticket.save();

//     const msg = await SupportMessage.create({
//       ticketId: ticket._id,
//       senderType: "system",
//       message: `Refund of Rs.${refundAmount} processed (${refundType}). Reason: ${reason || "Not provided"}`,
//     });

//     const populatedTicket = await SupportTicket.findById(ticket._id)
//       .populate("userId", "name email")
//       .populate("orderId");

//     const refundPayload = {
//       ticketId: ticket._id.toString(),
//       ticket: populatedTicket,
//       message: msg,
//       refundAmount,
//       refundType,
//     };

//     const io = getIO();
//     io.to(`support:${ticket._id}`).emit("message:new", msg);
//     io.to(`user:${ticket.userId.toString()}`).emit("message:new", msg);
//     io.to(`user:${ticket.userId.toString()}`).emit("ticket:refund", refundPayload);
//     io.to("admin_support").emit("ticket:message", { ticketId: ticket._id.toString(), message: msg });
//     emitTicketUpdate(populatedTicket);

//     return res.json({ success: true, refundAmount, message: msg, ticket: populatedTicket });
//     {

//     // System message
//     // await SupportMessage.create({
//     //   ticketId: ticket._id,
//     //   senderType: "system",
//     //   message: `💰 Refund of ₹${refundAmount} processed (${refundType}). Reason: ${reason}`,
//     // });
// const msg = await SupportMessage.create({
//   ticketId: ticket._id,

//   senderType: "system",

//   message:
//     `💰 Refund of ₹${refundAmount} processed (${refundType}). Reason: ${reason}`,
// });


//     // const io = getIO();
//     // io.to(`support:${ticket._id}`).emit("ticket:refund", { refundAmount, refundType });
//     // io.to(`user:${ticket.userId}`).emit("ticket:refund", { refundAmount, refundType });

// const io = getIO();
// io.to(`support:${ticket._id}`).emit("message:new", msg);
// io.to(`user:${ticket.userId.toString()}`).emit("ticket:refund", { refundAmount, refundType });

//     res.json({ success: true, refundAmount });
//     }
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// } working 


// ============================================================
// FILE: server/src/controllers/supportController.js
// REPLACE your processRefund with this clean version
// ============================================================

export async function processRefund(req, res) {
  try {
    const { refundType, amount, reason } = req.body;
    const ticket = await SupportTicket.findById(req.params.id).populate("orderId");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    let refundAmount = Number(amount);
    if (refundType === "full") refundAmount = ticket.orderId.total_amount;

    ticket.refundAmount = (ticket.refundAmount || 0) + refundAmount;
    ticket.actionLog.push({
      action: `Refund processed: ₹${refundAmount} (${refundType})`,
      performedBy: req.user._id,
      meta: { refundType, amount: refundAmount, reason },
    });
    await ticket.save();

    const msg = await SupportMessage.create({
      ticketId: ticket._id,
      senderType: "system",
      message: `💰 Refund of ₹${refundAmount} processed (${refundType}). Reason: ${reason || "Not provided"}`,
    });

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("userId", "name email")
      .populate("orderId");

    const io = getIO();
    io.to(`support:${ticket._id}`).emit("message:new", msg);
    io.to(`user:${ticket.userId.toString()}`).emit("message:new", msg);
    io.to(`user:${ticket.userId.toString()}`).emit("ticket:refund", { refundAmount, refundType });
    io.to("admin_support").emit("ticket:message", { ticketId: ticket._id.toString(), message: msg });
    emitTicketUpdate(populatedTicket);


try {
  const user = await User.findById(ticket.userId);
  await notifyRefundIssued({
    userFcmToken: user?.fcmToken,
    amount: refundAmount,
    // orderId: ticket.orderId.toString(),
    orderId: ticket.orderId._id.toString(),

  });
} catch (fcmErr) {
  console.error("FCM FAILED (non-fatal):", fcmErr.message);
}

    return res.json({ success: true, refundAmount, message: msg, ticket: populatedTicket });
  } catch (err) {
    console.error("[Support] processRefund error:", err);
    res.status(500).json({ message: "Server error" });
  }
}


// ============================================================
// FILE: server/src/routes/supportRoutes.js
// ADD these 2 lines
// ============================================================

// Add to imports:
// import { ..., editOrder } from "../controllers/supportController.js";

// Add route:
// router.patch("/tickets/:id/edit-order", protect, adminOnly, editOrder);

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
