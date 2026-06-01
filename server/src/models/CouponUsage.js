// ============================================================
// FILE: server/src/models/CouponUsage.js
// ── Tracks which user used which coupon on which order.
// ── Used by couponValidation to enforce usage_per_user limits.
// ── Atomically incremented on order placement.
// ============================================================

import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const couponUsageSchema = new Schema(
  {
    coupon_id: {
      type: Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },

    user_id: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    order_id: {
      type: Types.ObjectId,
      ref: "Order",
      required: true,
    },

    // Snapshot of the discount applied (for audit/analytics)
    discount_amount:  { type: Number, default: 0 },
    cashback_amount:  { type: Number, default: 0 },
    reward_type:      { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// Fast per-user-per-coupon lookup
couponUsageSchema.index({ coupon_id: 1, user_id: 1 });

const CouponUsage = mongoose.model("CouponUsage", couponUsageSchema);
export default CouponUsage;