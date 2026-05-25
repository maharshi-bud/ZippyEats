// ============================================================
// FILE: server/src/routes/restaurantOwnerRoutes.js
// ============================================================

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { PERMISSIONS } from "../constants/permissions.js";
import {
  getMyOrders,
  updateMyOrderStatus,
  getMyMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getRestaurantDashboard,
} from "../controllers/restaurantOwnerController.js";

const router = express.Router();

// protect runs on every route in this file
router.use(protect);

// ── Dashboard ─────────────────────────────────────────────────
router.get(
  "/dashboard",
  requirePermission(PERMISSIONS.RESTAURANT_VIEW_DASH),
  getRestaurantDashboard
);

// ── Orders ────────────────────────────────────────────────────
router.get(
  "/orders",
  requirePermission(PERMISSIONS.ORDERS_VIEW_OWN),
  getMyOrders
);

router.patch(
  "/orders/:id/status",
  requirePermission(PERMISSIONS.ORDERS_EDIT_STATUS),
  updateMyOrderStatus
);

// ── Menu ──────────────────────────────────────────────────────
router.get(
  "/menu",
  requirePermission(PERMISSIONS.MENU_VIEW),
  getMyMenu
);

router.post(
  "/menu",
  requirePermission(PERMISSIONS.MENU_CREATE),
  createMenuItem
);

router.put(
  "/menu/:itemId",
  requirePermission(PERMISSIONS.MENU_EDIT),
  updateMenuItem
);

router.delete(
  "/menu/:itemId",
  requirePermission(PERMISSIONS.MENU_DELETE),
  deleteMenuItem
);

export default router;