// ============================================================
// FILE: server/src/routes/admin/couponRoutes.js
// ── Admin coupon management routes.
// ── All routes: protect + coupon resource permission.
// ── Mount in routes/admin/index.js:
//      import couponRoutes from "./couponRoutes.js";
//      router.use("/", couponRoutes);
// ============================================================

import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { requirePermission } from "../../middleware/permissionMiddleware.js";
import {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponUsage,
} from "../../controllers/admin/couponController.js";

const router = express.Router();

// All admin coupon routes require authentication
router.use(protect);

// ── List & detail ─────────────────────────────────────────────
router.get(
  "/coupons",
  requirePermission("coupons", "view"),
  getCoupons
);

router.get(
  "/coupons/:id",
  requirePermission("coupons", "view"),
  getCouponById
);

router.get(
  "/coupons/:id/usage",
  requirePermission("coupons", "view"),
  getCouponUsage
);

// ── Create ────────────────────────────────────────────────────
router.post(
  "/coupons",
  requirePermission("coupons", "add"),
  createCoupon
);

// ── Update ────────────────────────────────────────────────────
router.put(
  "/coupons/:id",
  requirePermission("coupons", "edit"),
  updateCoupon
);

// ── Toggle active/inactive ────────────────────────────────────
router.patch(
  "/coupons/:id/toggle",
  requirePermission("coupons", "edit"),
  toggleCouponStatus
);

// ── Delete ────────────────────────────────────────────────────
router.delete(
  "/coupons/:id",
  requirePermission("coupons", "delete"),
  deleteCoupon
);

export default router;