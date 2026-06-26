// ============================================================
// FILE: server/src/routes/admin/orderRoutes.js
// ============================================================

import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { requirePermission } from "../../middleware/permissionMiddleware.js";
import {
  getOrderById,
  updateOrderStatus,
  updateOrderDetails,
} from "../../controllers/admin/orderController.js";

const router = express.Router();

// View order details
router.get(
  "/:id",
  protect,
  requirePermission("orders", "view"),
  getOrderById
);

// Update order status
router.put(
  "/:id/status",
  protect,
  requirePermission("orders", "edit"),
  updateOrderStatus
);
// Update multiple order details
router.put(
  "/:id",
  protect,
  requirePermission("orders", "edit"),
  updateOrderDetails
);

export default router;