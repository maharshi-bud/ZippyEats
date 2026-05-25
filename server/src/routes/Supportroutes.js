// ============================================================
// FILE: server/src/routes/Supportroutes.js
// ============================================================

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { PERMISSIONS } from "../constants/permissions.js";
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
  protect, requirePermission(PERMISSIONS.SUPPORT_CREATE),
  createTicket
);

router.get(
  "/tickets",
  protect, requirePermission(PERMISSIONS.SUPPORT_VIEW_OWN),
  getTickets
);

router.get(
  "/tickets/:id",
  protect, requirePermission(PERMISSIONS.SUPPORT_VIEW_OWN),
  getTicketById
);

router.get(
  "/tickets/:id/messages",
  protect, requirePermission(PERMISSIONS.SUPPORT_VIEW_OWN),
  getMessages
);

router.post(
  "/tickets/:id/message",
  protect, requirePermission(PERMISSIONS.SUPPORT_REPLY),
  sendMessage
);

// ── Admin-level actions ───────────────────────────────────────
router.patch(
  "/tickets/:id/status",
  protect, requirePermission(PERMISSIONS.SUPPORT_EDIT_STATUS),
  updateStatus
);

router.patch(
  "/tickets/:id/resolve",
  protect, requirePermission(PERMISSIONS.SUPPORT_RESOLVE),
  resolveTicket
);

// Refund is its own permission — more sensitive than a status change
router.post(
  "/tickets/:id/refund",
  protect, requirePermission(PERMISSIONS.SUPPORT_REFUND),
  processRefund
);

router.patch(
  "/tickets/:id/note",
  protect, requirePermission(PERMISSIONS.SUPPORT_ADD_NOTE),
  addNote
);

router.post(
  "/tickets/:id/system-message",
  protect, requirePermission(PERMISSIONS.SUPPORT_SYS_MSG),
  sendSystemMessage
);

// Editing order items requires both support AND order permissions
router.patch(
  "/tickets/:id/edit-order",
  protect, requirePermission(PERMISSIONS.SUPPORT_EDIT_ORDER, PERMISSIONS.ORDERS_EDIT_ITEMS),
  editOrder
);

export default router;