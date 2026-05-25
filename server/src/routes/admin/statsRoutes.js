// ============================================================
// FILE: server/src/routes/admin/statsRoutes.js
// ============================================================

import express from "express";
import {
  overview,
  revenueChart,
  ordersChart,
  orderStatus,
  topRestaurants,
  topItems,
  userGrowth,
  orderStats,
  getOrderData,
  usersList,
  usersSummary,
  restaurantsList,
} from "../../controllers/admin/adminStatsController.js";
import { protect } from "../../middleware/authMiddleware.js";
import { requirePermission } from "../../middleware/permissionMiddleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router();

// All stats routes require ANALYTICS_VIEW.
// protect + requirePermission replaces the old protect + adminOnly pattern.
// Apply once at router level so every route below inherits it.
router.use(protect, requirePermission(PERMISSIONS.ANALYTICS_VIEW));

router.get("/overview",         overview);
router.get("/revenue",          revenueChart);
router.get("/orders",           ordersChart);
router.get("/status",           orderStatus);
router.get("/top-restaurants",  topRestaurants);
router.get("/top-items",        topItems);
router.get("/users-growth",     userGrowth);
router.get("/orders-summary",   orderStats);
router.get("/get-orderData",    getOrderData);
router.get("/users-summary",    usersSummary);
router.get("/users-list",       usersList);
router.get("/restaurants-list", restaurantsList);

export default router;