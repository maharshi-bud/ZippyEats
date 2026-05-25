// ============================================================
// FILE: server/src/routes/admin/orderRoutes.js
// ============================================================

import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { requirePermission } from "../../middleware/permissionMiddleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import {
  getOrderById,
  updateOrderStatus,
} from "../../controllers/admin/orderController.js";

const router = express.Router();

router.get(
  "/:id",
  protect, requirePermission(PERMISSIONS.ORDERS_VIEW_ALL),
  getOrderById
);

router.put(
  "/:id/status",
  protect, requirePermission(PERMISSIONS.ORDERS_EDIT_STATUS),
  updateOrderStatus
);

export default router;