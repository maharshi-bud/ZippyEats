// ============================================================
// FILE: server/src/models/Coupon.js
// ── Coupon / Promo Rule Engine Schema
// ── Normalized into: Meta | Visibility | Validity | Targeting
//    | Conditions | Reward | Limits | Stacking | Analytics
// ============================================================

import mongoose from "mongoose";

const { Schema, Types } = mongoose;

// ── Sub-schemas ───────────────────────────────────────────────

const visibilitySchema = new Schema(
  {
    // Shows in public coupon listing
    public: { type: Boolean, default: true },

    // Restricted visibility flags (short-circuit on first match)
    first_order_only:   { type: Boolean, default: false },
    new_user_only:      { type: Boolean, default: false },   // account < 30 days
    premium_users_only: { type: Boolean, default: false },   // future: premium tier
  },
  { _id: false }
);

const timeRangeSchema = new Schema(
  {
    // e.g. "11:00" and "14:00" — applied in coupon's timezone
    start: { type: String, required: true }, // "HH:MM"
    end:   { type: String, required: true }, // "HH:MM"
  },
  { _id: false }
);

const validitySchema = new Schema(
  {
    start_date: { type: Date, default: null },
    end_date:   { type: Date, default: null },

    // e.g. [1, 2, 3, 4, 5] = Mon–Fri  (0 = Sunday, 6 = Saturday)
    days_allowed: {
      type: [Number],
      default: [],
      validate: [(v) => v.every((d) => d >= 0 && d <= 6), "Invalid day (0–6)"],
    },

    // Specific time windows during which coupon is valid
    time_ranges: { type: [timeRangeSchema], default: [] },

    timezone: { type: String, default: "Asia/Kolkata" },
  },
  { _id: false }
);

const targetingSchema = new Schema(
  {
    // Empty array = no restriction (applies to all)
    restaurants: { type: [String],           default: [] }, // restaurant_id strings
    cuisines:    { type: [String],           default: [] },
    menu_items:  { type: [Types.ObjectId],   ref: "MenuItem", default: [] },
    cities:      { type: [String],           default: [] },
    user_ids:    { type: [Types.ObjectId],   ref: "User",     default: [] },
  },
  { _id: false }
);

const requiresItemSchema = new Schema(
  {
    item_id: { type: Types.ObjectId, ref: "MenuItem", required: true },
    qty:     { type: Number, required: true, min: 1 },
  },
  { _id: false }
);


const buyXGetYSchema = new Schema(
  {
    buy_item: { type: Types.ObjectId, ref: "MenuItem", required: true },
    buy_qty:  { type: Number, required: true, min: 1 },
    free_item:{ type: Types.ObjectId, ref: "MenuItem", required: false }, // ← CHANGE: required: false
    free_qty: { type: Number, default: 1, min: 1 },
    // Guide-compatible aliases for alternative naming
    get_item: { type: Types.ObjectId, ref: "MenuItem", default: null },
    get_qty:  { type: Number, default: null, min: 0 },
  },
  { _id: false }
);

const orderNumberRangeSchema = new Schema(
  {
    // e.g. { min: 1, max: 1 } = first order only
    // e.g. { min: 2, max: 2 } = second order only
    // e.g. { min: 1, max: 5 } = first 5 orders
    min: { type: Number, default: null },
    max: { type: Number, default: null },
  },
  { _id: false }
);

const conditionsSchema = new Schema(
  {
    // ── Order value gates ─────────────────────────────────────
    min_order_amount: { type: Number, default: null, min: 0 },
    max_order_amount: { type: Number, default: null, min: 0 },

    // ── Cart quantity gate ────────────────────────────────────
    min_items: { type: Number, default: null, min: 0 },

    // ── Payment restriction ───────────────────────────────────
    // [] = all methods allowed
    payment_methods: {
      type: [String],
      enum: ["cod", "upi", "card"],
      default: [],
    },

    // ── Platform restriction ──────────────────────────────────
    allowed_platforms: {
      type: [String],
      enum: ["web", "android", "ios"],
      default: [],
    },

    // ── Order count gates ─────────────────────────────────────
    order_number: { type: orderNumberRangeSchema, default: null },

    // ── Convenience boolean aliases (auto-derived from order_number
    //    but stored explicitly for quick querying)
    first_order:  { type: Boolean, default: false },
    second_order: { type: Boolean, default: false },

    // ── Restaurant-spend gate ─────────────────────────────────
    // e.g. apply only if user has spent ≥ min_restaurant_spend at targeting.restaurants[0]
    min_restaurant_spend: { type: Number, default: null, min: 0 },

    // ── Required items in cart ────────────────────────────────
    requires_items: { type: [requiresItemSchema], default: [] },

    // ── Buy X Get Y condition ─────────────────────────────────
    buy_x_get_y: { type: buyXGetYSchema, default: null },
  },
  { _id: false }
);

const rewardSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["flat", "percentage", "free_delivery", "free_item", "cashback", "bogo"],
    },

    // ── flat / percentage ─────────────────────────────────────
    value: { type: Number, default: 0, min: 0 },   // ₹ or %

    // Cap for percentage discounts (e.g. max ₹200 off)
    max_discount: { type: Number, default: null, min: 0 },

    // ── free_item / bogo / buy_x_get_y ───────────────────────
    free_item: { type: Types.ObjectId, ref: "MenuItem", default: null },

    // Optional explicit Buy X Get Y reward metadata
    bxgy_reward: {
      item_id: { type: Types.ObjectId, ref: "MenuItem", default: null },
      qty:     { type: Number, default: 1, min: 1 },
    },

    // ── cashback ──────────────────────────────────────────────
    cashback_amount: { type: Number, default: null, min: 0 },

    // Message shown to user explaining what they got
    reward_label: { type: String, default: "" }, // "You saved ₹120!"
  },
  { _id: false }
);

const limitsSchema = new Schema(
  {
    // null = unlimited
    total_usage_limit:  { type: Number, default: null, min: 1 },
    usage_per_user:     { type: Number, default: 1,    min: 1 },
    current_usage_count:{ type: Number, default: 0,    min: 0 },
  },
  { _id: false }
);

const stackingSchema = new Schema(
  {
    // If false, cannot be applied alongside other coupons
    can_combine: { type: Boolean, default: false },

    // Coupon codes that cannot be used together with this one
    excludes: { type: [String], default: [] },
  },
  { _id: false }
);

const analyticsSchema = new Schema(
  {
    total_used:           { type: Number, default: 0 },
    total_discount_given: { type: Number, default: 0 },
    revenue_generated:    { type: Number, default: 0 },
  },
  { _id: false }
);

// ── Main Coupon Schema ────────────────────────────────────────

const couponSchema = new Schema(
  {
    // ── Meta ─────────────────────────────────────────────────
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // coupon   → user manually enters a code
    // auto_apply → automatically applied if eligible (no code entry needed)
    // reward     → issued as a reward (loyalty, referral, first-order gift)
    type: {
      type: String,
      required: true,
      enum: ["coupon", "auto_apply", "reward"],
      default: "coupon",
    },

    is_active: { type: Boolean, default: true, index: true },

    // ── Composed sub-documents ────────────────────────────────
    visibility: { type: visibilitySchema,   default: () => ({}) },
    validity:   { type: validitySchema,     default: () => ({}) },
    targeting:  { type: targetingSchema,    default: () => ({}) },
    conditions: { type: conditionsSchema,   default: () => ({}) },
    reward:     { type: rewardSchema,       required: true },
    limits:     { type: limitsSchema,       default: () => ({}) },
    stacking:   { type: stackingSchema,     default: () => ({}) },
    analytics:  { type: analyticsSchema,    default: () => ({}) },

    // ── Audit ─────────────────────────────────────────────────
    created_by: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    updated_by: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ── Compound indices ──────────────────────────────────────────

// Fast lookup: active + type for auto_apply scanning
couponSchema.index({ is_active: 1, type: 1 });

// Fast lookup: active + validity window for scheduled expiry
couponSchema.index({ is_active: 1, "validity.end_date": 1 });

// ── Instance helpers ──────────────────────────────────────────

/**
 * Whether this coupon is within its validity date window right now.
 * Does NOT check time ranges — use couponValidation for full check.
 */
couponSchema.methods.isWithinDateWindow = function () {
  const now = new Date();
  if (this.validity.start_date && now < this.validity.start_date) return false;
  if (this.validity.end_date   && now > this.validity.end_date)   return false;
  return true;
};

/**
 * Whether the global usage cap has been reached.
 */
couponSchema.methods.isUsageLimitReached = function () {
  if (this.limits.total_usage_limit === null) return false;
  return this.limits.current_usage_count >= this.limits.total_usage_limit;
};

// ── Static helpers ────────────────────────────────────────────

/**
 * Find an active coupon by code (case-insensitive via uppercase index).
 */
couponSchema.statics.findByCode = function (code) {
  return this.findOne({ code: code.toUpperCase().trim(), is_active: true });
};

/**
 * Find all auto_apply coupons that are currently active and within date window.
 */
couponSchema.statics.findAutoApply = function () {
  const now = new Date();
  return this.find({
    is_active: true,
    type: "auto_apply",
    $or: [
      { "validity.start_date": null },
      { "validity.start_date": { $lte: now } },
    ],
    $and: [
      {
        $or: [
          { "validity.end_date": null },
          { "validity.end_date": { $gte: now } },
        ],
      },
    ],
  });
};

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;