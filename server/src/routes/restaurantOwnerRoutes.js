// ============================================================
// FILE: server/src/routes/restaurantOwnerRoutes.js
// ============================================================

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
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
  requirePermission("dashboard", "view"),
  getRestaurantDashboard
);

// ── Orders ────────────────────────────────────────────────────
router.get(
  "/orders",
  requirePermission("orders", "view"),
  getMyOrders
);

router.patch(
  "/orders/:id/status",
  requirePermission("orders", "edit"),
  updateMyOrderStatus
);

// ── Menu ──────────────────────────────────────────────────────
router.get(
  "/menu",
  requirePermission("menu", "view"),
  getMyMenu
);

router.post(
  "/menu",
  requirePermission("menu", "add"),
  createMenuItem
);

router.put(
  "/menu/:itemId",
  requirePermission("menu", "edit"),
  updateMenuItem
);

router.delete(
  "/menu/:itemId",
  requirePermission("menu", "delete"),
  deleteMenuItem
);

export default router;