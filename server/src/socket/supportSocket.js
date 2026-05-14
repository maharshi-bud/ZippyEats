// ============================================================
// FILE: server/src/socket/supportSocket.js
// ============================================================
// Call initSupportSocket(io) from your lib/socket.js ONCE
// ============================================================

import SupportTicket from "../models/SupportTicket.js";
import SupportMessage from "../models/SupportMessage.js";

export function initSupportSocket(io) {
  io.on("connection", (socket) => {

    // ── User joins their personal room ──────────────────
    socket.on("user:join", (userId) => {
      socket.join(`user:${userId}`);
    });

    // ── Admin joins admin support room ──────────────────
    socket.on("admin:join_support", () => {
      socket.join("admin_support");
    });

    // ── Join a specific ticket room ─────────────────────
    socket.on("support:join", (ticketId) => {
      socket.join(`support:${ticketId}`);
    });

    // ── Leave a ticket room ─────────────────────────────
    socket.on("support:leave", (ticketId) => {
      socket.leave(`support:${ticketId}`);
    });

    // ── Typing indicator ────────────────────────────────
    socket.on("support:typing", ({ ticketId, senderType }) => {
      socket.to(`support:${ticketId}`).emit("support:typing", { senderType });
    });

    socket.on("support:stop_typing", ({ ticketId, senderType }) => {
      socket.to(`support:${ticketId}`).emit("support:stop_typing", { senderType });
    });

    // ── Mark messages as read ───────────────────────────
    socket.on("support:read", async ({ ticketId, readerType }) => {
      try {
        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) return;
        if (readerType === "admin") ticket.unreadAdmin = 0;
        if (readerType === "user") ticket.unreadUser = 0;
        await ticket.save();
        io.to(`support:${ticketId}`).emit("support:read_ack", { ticketId, readerType });
      } catch (err) {
        console.error("[SupportSocket] read error:", err.message);
      }
    });
  });
}