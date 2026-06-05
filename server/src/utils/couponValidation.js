// ============================================================
// FILE: server/src/utils/couponValidation.js
// ── Pure validation functions for coupon eligibility.
// ── Each function returns { valid: Boolean, reason?: String }
// ── validateCoupon() runs them all in sequence.
// ============================================================

import Order from "../models/Order.js";

// ─────────────────────────────────────────────────────────────
// Types (JSDoc for IDE support — no TypeScript required)
// ─────────────────────────────────────────────────────────────
/**
 * @typedef {Object} CartContext
 * @property {string}   user_id
 * @property {string}   restaurant_id
 * @property {string[]} cuisines         - Cuisines of items in cart
 * @property {Array<{ item_id: string, qty: number, price: number }>} items
 * @property {number}   subtotal         - Pre-discount cart total (₹)
 * @property {string}   city
 * @property {string}   payment_method   - "cod" | "upi" | "card"
 * @property {string}   platform         - "web" | "android" | "ios"
 */

/**
 * @typedef {{ valid: boolean, reason?: string }} ValidationResult
 */

// ─────────────────────────────────────────────────────────────
// 1. Active + date window
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @returns {ValidationResult}
 */
export function validateActive(coupon) {
  if (!coupon.is_active) {
    return { valid: false, reason: "This coupon is no longer active." };
  }
  if (!coupon.isWithinDateWindow()) {
    const now = new Date();
    if (coupon.validity.start_date && now < coupon.validity.start_date) {
      return { valid: false, reason: "This coupon is not yet valid." };
    }
    return { valid: false, reason: "This coupon has expired." };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 2. Day-of-week restriction
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @param {string} [timezone]
 * @returns {ValidationResult}
 */
export function validateDayOfWeek(coupon, timezone = "Asia/Kolkata") {
  const { days_allowed } = coupon.validity;
  if (!days_allowed || days_allowed.length === 0) return { valid: true };

  // Get current day in the coupon's timezone
  const nowInTz = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: timezone,
  });
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const currentDay = dayMap[nowInTz];

  if (!days_allowed.includes(currentDay)) {
    return { valid: false, reason: "This coupon is not valid today." };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 3. Time-range restriction
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @returns {ValidationResult}
 */
export function validateTimeRange(coupon) {
  const { time_ranges, timezone } = coupon.validity;
  if (!time_ranges || time_ranges.length === 0) return { valid: true };

  const nowStr = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone || "Asia/Kolkata",
  }); // "HH:MM"

  const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const nowMins = toMinutes(nowStr);
  const inRange = time_ranges.some(({ start, end }) => {
    const s = toMinutes(start);
    const e = toMinutes(end);
    return nowMins >= s && nowMins <= e;
  });

  if (!inRange) {
    return { valid: false, reason: "This coupon is only valid during specific time windows." };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 4. Restaurant targeting
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {ValidationResult}
 */
export function validateRestaurantTarget(coupon, cart) {
  const { restaurants } = coupon.targeting;
  if (!restaurants || restaurants.length === 0) return { valid: true };

  if (!restaurants.includes(cart.restaurant_id)) {
    return {
      valid: false,
      reason: "This coupon is not valid for this restaurant.",
    };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 5. Cuisine targeting
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {ValidationResult}
 */
export function validateCuisineTarget(coupon, cart) {
  const { cuisines } = coupon.targeting;
  if (!cuisines || cuisines.length === 0) return { valid: true };

  const cartCuisines = cart.cuisines || [];
  const hasMatch = cuisines.some((c) => cartCuisines.includes(c));
  if (!hasMatch) {
    return {
      valid: false,
      reason: `This coupon applies only to ${cuisines.join(", ")} cuisine.`,
    };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 6. City targeting
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {ValidationResult}
 */
export function validateCityTarget(coupon, cart) {
  const { cities } = coupon.targeting;
  if (!cities || cities.length === 0) return { valid: true };

  if (!cities.map((c) => c.toLowerCase()).includes(cart.city?.toLowerCase())) {
    return {
      valid: false,
      reason: `This coupon is only valid in: ${cities.join(", ")}.`,
    };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 7. User-specific targeting
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {ValidationResult}
 */
export function validateUserTarget(coupon, cart) {
  const { user_ids } = coupon.targeting;
  if (!user_ids || user_ids.length === 0) return { valid: true };

  const allowed = user_ids.map((id) => id.toString());
  if (!allowed.includes(cart.user_id?.toString())) {
    return { valid: false, reason: "This coupon is not available for your account." };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 8. Order amount gates
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {ValidationResult}
 */
export function validateOrderAmount(coupon, cart) {
  const { min_order_amount, max_order_amount } = coupon.conditions;

  if (min_order_amount !== null && cart.subtotal < min_order_amount) {
    return {
      valid: false,
      reason: `Add ₹${(min_order_amount - cart.subtotal).toFixed(0)} more to use this coupon.`,
    };
  }

  if (max_order_amount !== null && cart.subtotal > max_order_amount) {
    return {
      valid: false,
      reason: `This coupon is valid only on orders up to ₹${max_order_amount}.`,
    };
  }

  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 9. Item count gate
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {ValidationResult}
 */
export function validateItemCount(coupon, cart) {
  const { min_items } = coupon.conditions;
  if (min_items === null) return { valid: true };

  const totalQty = cart.items.reduce((sum, i) => sum + i.qty, 0);
  if (totalQty < min_items) {
    return {
      valid: false,
      reason: `Add at least ${min_items} item(s) to your cart to use this coupon.`,
    };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 10. Payment method restriction
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {ValidationResult}
 */
export function validatePaymentMethod(coupon, cart) {
  const { payment_methods } = coupon.conditions;
  if (!payment_methods || payment_methods.length === 0) return { valid: true };

  if (!payment_methods.includes(cart.payment_method)) {
    return {
      valid: false,
      reason: `This coupon is valid only for: ${payment_methods.join(", ")} payments.`,
    };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 11. Platform restriction
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {ValidationResult}
 */
export function validatePlatform(coupon, cart) {
  const { allowed_platforms } = coupon.conditions;
  if (!allowed_platforms || allowed_platforms.length === 0) return { valid: true };

  if (!allowed_platforms.includes(cart.platform)) {
    return {
      valid: false,
      reason: `This coupon is only available on: ${allowed_platforms.join(", ")}.`,
    };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 12. Order number / history gate  (DB hit)
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {Promise<ValidationResult>}
 */
export async function validateOrderHistory(coupon, cart) {
  const { first_order, second_order, order_number } = coupon.conditions;

  // Early exit if no order-history condition is set
  const needsCheck = first_order || second_order || order_number?.min !== null || order_number?.max !== null;
  if (!needsCheck) return { valid: true };

  // Count completed orders for this user
  const completedCount = await Order.countDocuments({
    user_id: cart.user_id,
    status: "delivered",
  });

  if (first_order && completedCount > 0) {
    return { valid: false, reason: "This coupon is valid only on your first order." };
  }

  if (second_order && completedCount !== 1) {
    return { valid: false, reason: "This coupon is valid only on your second order." };
  }

  if (order_number) {
    // current order will be completedCount + 1
    const nextOrderNum = completedCount + 1;
    if (order_number.min !== null && nextOrderNum < order_number.min) {
      return { valid: false, reason: `This coupon is valid from your ${order_number.min} order onwards.` };
    }
    if (order_number.max !== null && nextOrderNum > order_number.max) {
      return { valid: false, reason: "This coupon is no longer applicable to your account." };
    }
  }

  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 13. Restaurant spend gate  (DB hit)
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {Promise<ValidationResult>}
 */
export async function validateRestaurantSpend(coupon, cart) {
  const { min_restaurant_spend } = coupon.conditions;
  if (min_restaurant_spend === null) return { valid: true };

  const { restaurants } = coupon.targeting;
  const targetRestaurantId = restaurants?.[0] || cart.restaurant_id;

  const agg = await Order.aggregate([
    {
      $match: {
        user_id: cart.user_id,
        restaurant_id: targetRestaurantId,
        status: "delivered",
      },
    },
    { $group: { _id: null, total: { $sum: "$total_amount" } } },
  ]);

  const totalSpent = agg[0]?.total || 0;
  if (totalSpent < min_restaurant_spend) {
    return {
      valid: false,
      reason: `You need to spend ₹${min_restaurant_spend} at this restaurant to unlock this offer.`,
    };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 14. Required items in cart
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {ValidationResult}
 */
export function validateRequiredItems(coupon, cart) {
  const { requires_items } = coupon.conditions;
  if (!requires_items || requires_items.length === 0) return { valid: true };

  const cartItemMap = new Map(
    cart.items.map((i) => [i.item_id.toString(), i.qty])
  );

  for (const req of requires_items) {
    const cartQty = cartItemMap.get(req.item_id.toString()) || 0;
    if (cartQty < req.qty) {
      return {
        valid: false,
        reason: "Your cart doesn't include the required items for this coupon.",
      };
    }
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 15. Buy X Get Y condition
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {ValidationResult}
 */
export const validateBuyXGetY = (coupon, cart) => {
  if (coupon.reward_type !== 'bxgy' || !coupon.bxgy_config) {
    return { valid: true };
  }

  const { trigger_item_id, trigger_quantity, reward_item_id } = coupon.bxgy_config;

  // Check if trigger item exists with sufficient quantity
  const triggerItems = cart.items.filter(
    item => item.item_id?.toString?.() === trigger_item_id?.toString?.()
  );

  const totalTrigger = triggerItems.reduce((sum, item) => sum + item.quantity, 0);
  console.log(totalTrigger, trigger_quantity );
  if (totalTrigger < trigger_quantity) {
    return {
      valid: false,
      reason: `Need at least ${trigger_quantity} unit(s) of trigger item for this offer`,
    };
  }

  return { valid: true };
};

export const calculateBXGYRewards = (coupon, cart) => {
  if (coupon.reward_type !== 'bxgy' || !coupon.bxgy_config) {
    return { rewards: [], valid: true };
  }

  const { trigger_item_id, trigger_quantity, reward_item_id, reward_quantity, max_applications } = coupon.bxgy_config;

  const triggerCount = cart.items
    .filter(item => item.item_id?.toString?.() === trigger_item_id?.toString?.() && !item.isRewardItem)
    .reduce((sum, item) => sum + item.quantity, 0);

  const applicationsEarned = Math.floor(triggerCount / trigger_quantity);
  const applicationsAllowed = Math.min(applicationsEarned, max_applications);
  const totalRewardQuantity = applicationsAllowed * reward_quantity;

  return {
    valid: true,
    rewards: [
      {
        item_id: reward_item_id,
        quantity: totalRewardQuantity,
        price: 0,
        isRewardItem: true,
      },
    ],
  };
};

// ─────────────────────────────────────────────────────────────
// 16. Per-user usage limit  (DB hit)
// ─────────────────────────────────────────────────────────────

/**
 * Check how many times this user has already used this coupon.
 * Requires a CouponUsage model (lightweight — see note below).
 * Falls back gracefully if model isn't set up yet.
 *
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {Promise<ValidationResult>}
 */
export async function validatePerUserLimit(coupon, cart) {
  const { usage_per_user } = coupon.limits;
  if (!usage_per_user) return { valid: true };

  // Dynamically import to avoid circular dependency
  let CouponUsage;
  try {
    const mod = await import("../models/CouponUsage.js");
    CouponUsage = mod.default;
  } catch {
    // CouponUsage model not yet created — skip check
    return { valid: true };
  }

  const usedCount = await CouponUsage.countDocuments({
    coupon_id: coupon._id,
    user_id:   cart.user_id,
  });

  if (usedCount >= usage_per_user) {
    return {
      valid: false,
      reason: `You've already used this coupon ${usage_per_user} time(s).`,
    };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 17. Global usage cap
// ─────────────────────────────────────────────────────────────

/**
 * @param {import('../models/Coupon').default} coupon
 * @returns {ValidationResult}
 */
export function validateGlobalUsageLimit(coupon) {
  if (coupon.isUsageLimitReached()) {
    return { valid: false, reason: "This coupon has reached its usage limit." };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// MASTER VALIDATOR
// ─────────────────────────────────────────────────────────────

/**
 * Run all eligibility checks for a given coupon + cart.
 * Returns the first failure found, or { valid: true } if all pass.
 *
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {Promise<ValidationResult>}
 */
export async function validateCoupon(coupon, cart) {
  // ── Synchronous checks (fast path) ────────────────────────
  const syncChecks = [
    () => validateActive(coupon),
    () => validateDayOfWeek(coupon, coupon.validity.timezone),
    () => validateTimeRange(coupon),
    () => validateGlobalUsageLimit(coupon),
    () => validateRestaurantTarget(coupon, cart),
    () => validateCuisineTarget(coupon, cart),
    () => validateCityTarget(coupon, cart),
    () => validateUserTarget(coupon, cart),
    () => validateOrderAmount(coupon, cart),
    () => validateItemCount(coupon, cart),
    () => validatePaymentMethod(coupon, cart),
    () => validatePlatform(coupon, cart),
    () => validateRequiredItems(coupon, cart),
    () => validateBuyXGetY(coupon, cart),
  ];

  for (const check of syncChecks) {
    const result = check();
    if (!result.valid) return result;
  }

  // ── Async checks (DB hits — run in parallel for speed) ────
  const [orderHistoryResult, restaurantSpendResult, perUserLimitResult] =
    await Promise.all([
      validateOrderHistory(coupon, cart),
      validateRestaurantSpend(coupon, cart),
      validatePerUserLimit(coupon, cart),
    ]);

  for (const result of [orderHistoryResult, restaurantSpendResult, perUserLimitResult]) {
    if (!result.valid) return result;
  }

  return { valid: true };
}