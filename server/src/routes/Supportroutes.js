// ============================================================
// FILE: server/src/routes/supportRoutes.js
// ============================================================

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import {
  createTicket,
  getTickets,
  getTicketById,
  getMessages,
  sendMessage,
  updateStatus,
  resolveTicket,
  processRefund,
  addNote,
  sendSystemMessage,
  editOrder,
} from "../controllers/supportController.js";

const router = express.Router();

// User + Admin
router.post("/tickets", protect, createTicket);
router.get("/tickets", protect, getTickets);
router.get("/tickets/:id", protect, getTicketById);
router.get("/tickets/:id/messages", protect, getMessages);
router.post("/tickets/:id/message", protect, sendMessage);

// Admin only
router.patch("/tickets/:id/status", protect, adminOnly, updateStatus);
router.patch("/tickets/:id/resolve", protect, adminOnly, resolveTicket);
router.post("/tickets/:id/refund", protect, adminOnly, processRefund);
router.patch("/tickets/:id/note", protect, adminOnly, addNote);
router.post("/tickets/:id/system-message", protect, adminOnly, sendSystemMessage);
router.patch("/tickets/:id/edit-order", protect, adminOnly, editOrder);

export default router;