// ============================================================
// FILE: server/src/routes/Supportroutes.js
// ============================================================

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
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

// ── Any logged-in user ────────────────────────────────────────
router.post(
  "/tickets",
  protect, requirePermission("queries", "add"),
  createTicket
);

router.get(
  "/tickets",
  protect, requirePermission("queries", "view"),
  getTickets
);

router.get(
  "/tickets/:id",
  protect, requirePermission("queries", "view"),
  getTicketById
);

router.get(
  "/tickets/:id/messages",
  protect, requirePermission("queries", "view"),
  getMessages
);

router.post(
  "/tickets/:id/message",
  protect, requirePermission("queries", "edit"),
  sendMessage
);

// ── Admin-level actions ───────────────────────────────────────
router.patch(
  "/tickets/:id/status",
  protect, requirePermission("queries", "edit"),
  updateStatus
);

router.patch(
  "/tickets/:id/resolve",
  protect, requirePermission("queries", "edit"),
  resolveTicket
);

// Refund is its own permission — more sensitive than a status change
router.post(
  "/tickets/:id/refund",
  protect, requirePermission("queries", "edit"),
  processRefund
);

router.patch(
  "/tickets/:id/note",
  protect, requirePermission("queries", "edit"),
  addNote
);

router.post(
  "/tickets/:id/system-message",
  protect, requirePermission("queries", "add"),
  sendSystemMessage
);

// Editing order items requires both support AND order permissions
router.patch(
  "/tickets/:id/edit-order",
  protect, requirePermission("orders", "edit"),
  editOrder
);

export default router;