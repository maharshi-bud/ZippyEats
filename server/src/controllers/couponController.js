// ============================================================
// FILE: server/src/controllers/couponController.js
// ── Client-facing coupon endpoints:
//   POST /api/coupons/apply   → validate + calculate reward
//   POST /api/coupons/redeem  → called by order engine after order placed
//   GET  /api/coupons/auto    → return eligible auto_apply coupons for cart
// ============================================================

import Coupon      from "../models/Coupon.js";
import CouponUsage from "../models/CouponUsage.js";
import { validateCoupon }           from "../utils/couponValidation.js";
import { calculateReward, applyRewardToCart } from "../services/couponEngine.js";

// ─────────────────────────────────────────────────────────────
// POST /api/coupons/apply
// ─────────────────────────────────────────────────────────────
// Validates a coupon code against the user's current cart.
// Does NOT place the order or record usage — just returns reward preview.
//
// Body: {
//   code: string,
//   cart: {
//     restaurant_id, cuisines, items, subtotal, delivery_fee,
//     city, payment_method, platform
//   }
// }
//
export const applyCoupon = async (req, res) => {
  try {
    const { code, cart } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({ message: "Coupon code is required." });
    }

    if (!cart || typeof cart.subtotal !== "number") {
      return res.status(400).json({ message: "Invalid cart payload." });
    }

    // ── Find coupon ───────────────────────────────────────────
    const coupon = await Coupon.findByCode(code);
    if (!coupon) {
      return res.status(404).json({ message: "Invalid or expired coupon code." });
    }

    // ── Build cart context ────────────────────────────────────
    const cartCtx = {
      user_id:        req.user.id,
      restaurant_id:  cart.restaurant_id,
      cuisines:       cart.cuisines        || [],
      items:          cart.items           || [],
      subtotal:       cart.subtotal,
      delivery_fee:   cart.delivery_fee    ?? 40,
      city:           cart.city            || "",
      payment_method: cart.payment_method  || "cod",
      platform:       cart.platform        || "web",
    };

    // ── Validate ──────────────────────────────────────────────
    const validation = await validateCoupon(coupon, cartCtx);
if (!validation.valid) {
  console.log(
    "[Coupon Validation Failed]",
    validation
  );

  return res.status(422).json({
    success: false,
    message:
      validation.reason,
    validation,
  });
}


    // ── Calculate reward ──────────────────────────────────────
    const reward  = calculateReward(coupon, cartCtx);
    const totals  = applyRewardToCart(cartCtx, reward);

    return res.json({
      success: true,
      data: {
        coupon_id:       coupon._id,
        code:            coupon.code,
        title:           coupon.title,
        reward_type:     reward.reward_type,
        reward_label:    reward.reward_label,
        discount_amount: reward.discount_amount,
        cashback_amount: reward.cashback_amount,
        free_delivery:   reward.free_delivery,
        free_item_id:    reward.free_item_id,
        free_item_qty:   reward.free_item_qty,
        totals,
        breakdown:       reward.breakdown,
      },
    });
  } catch (err) {
    console.error("[CouponCtrl] applyCoupon:", err);
    res.status(500).json({ message: "Failed to apply coupon." });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/coupons/redeem
// ─────────────────────────────────────────────────────────────
// Called by the order engine AFTER an order is successfully placed.
// Records usage + atomically increments coupon.limits.current_usage_count.
// Body: { coupon_id, order_id, discount_amount, cashback_amount, reward_type }
//
export const redeemCoupon = async (req, res) => {
  try {
    const { coupon_id, order_id, discount_amount, cashback_amount, reward_type } = req.body;

    if (!coupon_id || !order_id) {
      return res.status(400).json({ message: "coupon_id and order_id are required." });
    }

    // ── Record usage ──────────────────────────────────────────
    await CouponUsage.create({
      coupon_id,
      user_id:         req.user.id,
      order_id,
      discount_amount: discount_amount || 0,
      cashback_amount: cashback_amount || 0,
      reward_type:     reward_type     || "",
    });

    // ── Increment global counter atomically ───────────────────
    await Coupon.findByIdAndUpdate(coupon_id, {
      $inc: {
        "limits.current_usage_count": 1,
        "analytics.total_used":       1,
        "analytics.total_discount_given": discount_amount || 0,
      },
    });

    return res.json({ success: true });
  } catch (err) {
    // Duplicate usage record (race condition on double-submit) — treat as success
    if (err.code === 11000) {
      return res.json({ success: true });
    }
    console.error("[CouponCtrl] redeemCoupon:", err);
    res.status(500).json({ message: "Failed to record coupon usage." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/coupons/auto
// ─────────────────────────────────────────────────────────────
// Returns all auto_apply coupons eligible for this cart.
// Used by checkout UI to show "X coupon applied automatically".
// Query: cart context passed as query params or POST body — using POST for convenience.
// Route is GET but body is accepted via express.json().
//
export const getAutoApplyCoupons = async (req, res) => {
  try {
    const { cart } = req.body;
    if (!cart || typeof cart.subtotal !== "number") {
      return res.status(400).json({ message: "Invalid cart payload." });
    }

    const cartCtx = {
      user_id:        req.user.id,
      restaurant_id:  cart.restaurant_id,
      cuisines:       cart.cuisines        || [],
      items:          cart.items           || [],
      subtotal:       cart.subtotal,
      delivery_fee:   cart.delivery_fee    ?? 40,
      city:           cart.city            || "",
      payment_method: cart.payment_method  || "cod",
      platform:       cart.platform        || "web",
    };

    const candidates = await Coupon.findAutoApply();

    const eligible = [];
    for (const coupon of candidates) {
      const validation = await validateCoupon(coupon, cartCtx);
      if (validation.valid) {
        const reward = calculateReward(coupon, cartCtx);
        eligible.push({
          coupon_id:       coupon._id,
          code:            coupon.code,
          title:           coupon.title,
          reward_label:    reward.reward_label,
          discount_amount: reward.discount_amount,
          cashback_amount: reward.cashback_amount,
          free_delivery:   reward.free_delivery,
        });
      }
    }

    return res.json({ success: true, data: eligible });
  } catch (err) {
    console.error("[CouponCtrl] getAutoApplyCoupons:", err);
    res.status(500).json({ message: "Failed to fetch auto-apply coupons." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/coupons/public
// ─────────────────────────────────────────────────────────────
// Returns the public coupon listing shown on the app's coupon page.
// No cart context required — just shows active public coupons.
//
export const getPublicCoupons = async (req, res) => {
  try {
    const now = new Date();

    const coupons = await Coupon.find({
      is_active: true,
      "visibility.public": true,
      $or: [{ "validity.end_date": null }, { "validity.end_date": { $gte: now } }],
      $and: [
        {
          $or: [
            { "validity.start_date": null },
            { "validity.start_date": { $lte: now } },
          ],
        },
      ],
    })
      .select(
        "code title description type reward.type reward.value reward.max_discount " +
        "conditions.min_order_amount validity.end_date targeting.restaurants targeting.cuisines"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: coupons });
  } catch (err) {
    console.error("[CouponCtrl] getPublicCoupons:", err);
    res.status(500).json({ message: "Failed to fetch coupons." });
  }
};