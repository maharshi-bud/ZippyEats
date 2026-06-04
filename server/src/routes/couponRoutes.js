// ============================================================
// FILE: server/src/routes/couponRoutes.js
// ── Client-facing coupon routes (app / checkout).
// ── Mount in server/src/index.js:
//      import couponRoutes from "./routes/couponRoutes.js";
//      app.use("/api/coupons", couponRoutes);
// ============================================================

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  applyCoupon,
  redeemCoupon,
  getAutoApplyCoupons,
  getPublicCoupons,
  getCouponsAvailable,
} from "../controllers/couponController.js";

const router = express.Router();

// ── Public (no auth required) ─────────────────────────────────
// Browse available coupons on the app's coupon page
router.get("/public", getPublicCoupons);
router.get("/available", getCouponsAvailable);

// ── Auth-required ─────────────────────────────────────────────
router.use(protect);

// Validate + preview a manually entered coupon code
router.post("/apply", applyCoupon);

// Fetch auto-apply coupons eligible for the current cart
router.post("/auto", getAutoApplyCoupons);

// Record coupon usage after order is placed (called by order engine)
router.post("/redeem", redeemCoupon);

export default router;