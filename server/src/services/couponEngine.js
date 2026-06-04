// ============================================================
// FILE: server/src/services/couponEngine.js
// ── Reward calculation engine.
// ── Takes a validated coupon + cart → returns a RewardResult.
// ── Never touches the DB — pure calculation layer.
// ============================================================

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} RewardResult
 * @property {number}       discount_amount     - ₹ deducted from subtotal
 * @property {number}       cashback_amount     - ₹ credited after delivery
 * @property {boolean}      free_delivery       - Whether delivery fee is waived
 * @property {string|null}  free_item_id        - ObjectId string of free item, if any
 * @property {number}       free_item_qty       - Quantity of free item
 * @property {string}       reward_label        - Human-readable reward description
 * @property {string}       reward_type         - Mirror of coupon.reward.type
 * @property {Object}       breakdown           - Detailed calculation steps for receipt
 */

/**
 * @typedef {Object} CartContext
 * @property {number}   subtotal
 * @property {number}   delivery_fee
 * @property {Array<{ item_id: string, qty: number, price: number }>} items
 */

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const round2 = (n) => Math.round(n * 100) / 100;

function baseResult(type) {
  return {
    discount_amount:  0,
    cashback_amount:  0,
    free_delivery:    false,
    free_item_id:     null,
    free_item_qty:    0,
    reward_label:     "",
    reward_type:      type,
    breakdown:        {},
  };
}

// ─────────────────────────────────────────────────────────────
// Calculators — one per reward.type
// ─────────────────────────────────────────────────────────────

/**
 * flat — fixed ₹ off
 */
function calcFlat(reward, cart) {
  const result = baseResult("flat");
  const discount = Math.min(reward.value, cart.subtotal); // never exceed cart total
  result.discount_amount = round2(discount);
  result.reward_label    = `₹${discount} off`;
  result.breakdown       = {
    type:       "flat",
    value:      reward.value,
    applied_on: cart.subtotal,
    discount:   result.discount_amount,
  };
  return result;
}

/**
 * percentage — % off, with optional cap
 */
function calcPercentage(reward, cart) {
  const result = baseResult("percentage");
  const raw = round2((reward.value / 100) * cart.subtotal);
  const discount = reward.max_discount !== null
    ? Math.min(raw, reward.max_discount)
    : raw;

  result.discount_amount = round2(Math.min(discount, cart.subtotal));
  result.reward_label    = reward.max_discount !== null
    ? `${reward.value}% off (up to ₹${reward.max_discount})`
    : `${reward.value}% off`;
  result.breakdown       = {
    type:        "percentage",
    percent:     reward.value,
    raw_discount: raw,
    cap:         reward.max_discount,
    applied_on:  cart.subtotal,
    discount:    result.discount_amount,
  };
  return result;
}

/**
 * free_delivery — waive delivery fee
 */
function calcFreeDelivery(reward, cart) {
  const result = baseResult("free_delivery");
  result.free_delivery   = true;
  result.discount_amount = round2(cart.delivery_fee); // show as discount for UI
  result.reward_label    = "Free delivery!";
  result.breakdown       = {
    type:         "free_delivery",
    delivery_fee: cart.delivery_fee,
  };
  return result;
}

/**
 * free_item — add a specific item to cart for free
 */
function calcFreeItem(reward) {
  const result = baseResult("free_item");
  result.free_item_id  = reward.free_item?.toString() || null;
  result.free_item_qty = 1;
  result.reward_label  = "Free item added to your order!";
  result.breakdown     = {
    type:      "free_item",
    item_id:   result.free_item_id,
    item_qty:  1,
  };
  return result;
}

/**
 * cashback — credited after delivery (not an immediate discount)
 */
function calcCashback(reward, cart) {
  const result = baseResult("cashback");
  const cb = reward.cashback_amount ?? reward.value ?? 0;
  result.cashback_amount = round2(cb);
  result.reward_label    = `₹${cb} cashback after delivery`;
  result.breakdown       = {
    type:            "cashback",
    cashback_amount: cb,
    note:            "Credited to wallet after order is delivered",
  };
  return result;
}

/**
 * bogo — Buy One Get One (free item from buy_x_get_y condition)
 */
function calcBogo(reward, coupon, cart) {
  const result = baseResult("bogo");
  const bxgy = coupon.conditions?.buy_x_get_y;

  if (bxgy) {
    // Support both existing and guide-convention fields
    result.free_item_id  = bxgy.free_item?.toString() || bxgy.get_item?.toString() || null;
    result.free_item_qty = bxgy.free_qty || bxgy.get_qty || 1;

    // Find the price of the buy item from cart to compute ₹ discount shown
    const buyItem = cart.items.find((i) => i.item_id.toString() === bxgy.buy_item?.toString());
    if (buyItem) {
      result.discount_amount = round2(buyItem.price * result.free_item_qty);
    }
  } else if (reward.free_item) {
    // Fallback: free_item in reward itself
    result.free_item_id  = reward.free_item.toString();
    result.free_item_qty = 1;
  }

  result.reward_label = `Buy ${bxgy?.buy_qty || 1} get ${result.free_item_qty} free!`;
  result.breakdown    = {
    type:        "bogo",
    buy_item:    bxgy?.buy_item?.toString(),
    buy_qty:     bxgy?.buy_qty,
    free_item:   result.free_item_id,
    free_qty:    result.free_item_qty,
    discount:    result.discount_amount,
  };
  return result;
}

// ─────────────────────────────────────────────────────────────
// MASTER ENGINE
// ─────────────────────────────────────────────────────────────

/**
 * Calculate the reward for a validated coupon.
 * Call this ONLY after validateCoupon() returns { valid: true }.
 *
 * @param {import('../models/Coupon').default} coupon
 * @param {CartContext} cart
 * @returns {RewardResult}
 */
export function calculateReward(coupon, cart) {
  const { reward } = coupon;

  switch (reward.type) {
    case "flat":
      return calcFlat(reward, cart);

    case "percentage":
      return calcPercentage(reward, cart);

    case "free_delivery":
      return calcFreeDelivery(reward, cart);

    case "free_item":
      return calcFreeItem(reward);

    case "cashback":
      return calcCashback(reward, cart);

    case "bogo":
      return calcBogo(reward, coupon, cart);

    default:
      throw new Error(`[CouponEngine] Unknown reward type: "${reward.type}"`);
  }
}

/**
 * Convenience: compute the final totals after applying a reward.
 *
 * @param {CartContext} cart
 * @param {RewardResult} rewardResult
 * @returns {{ subtotal_after: number, delivery_after: number, total_after: number }}
 */
export function applyRewardToCart(cart, rewardResult) {
  // Free delivery waives the entire delivery fee (discount_amount for free_delivery = fee)
  const delivery_after = rewardResult.free_delivery ? 0 : cart.delivery_fee;

  // Discount applies to subtotal (not delivery) for all non-free_delivery types
  const subtotal_discount = rewardResult.free_delivery ? 0 : rewardResult.discount_amount;
  const subtotal_after = round2(Math.max(0, cart.subtotal - subtotal_discount));

  const total_after = round2(subtotal_after + delivery_after);

  return { subtotal_after, delivery_after, total_after };
}