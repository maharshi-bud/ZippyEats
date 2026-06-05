// ============================================================
// FILE: server/src/controllers/admin/couponController.js
// ── Admin CRUD for coupons.
// ── All routes require coupon resource permissions.
// ============================================================

import Coupon      from "../../models/Coupon.js";
import CouponUsage from "../../models/CouponUsage.js";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Sanitize and build the coupon payload from request body.
 * Used by both createCoupon and updat
 * eCoupon.
 */
function buildCouponPayload(body) {
  const {
    code, title, description, type,
    visibility, validity, targeting,
    conditions, reward, limits, stacking,
    isActive, is_active, disabled,
  } = body;

  // ── Handle visibility ──────────────────────────────────────
  let normalizedVisibility = visibility ? { ...visibility } : {};
  if (conditions?.first_order) {
    normalizedVisibility.first_order_only = true;
  }

  // ── Handle conditions (keep ALL sub-fields) ────────────────
  const normalizedConditions = conditions ? {
    // Order amount gates
    min_order_amount: conditions.min_order_amount ?? null,
    max_order_amount: conditions.max_order_amount ?? null,
    
    // Item count
    min_items: conditions.min_items ?? null,
    
    // Order history
    first_order: Boolean(conditions.first_order ?? false),
    second_order: Boolean(conditions.second_order ?? false),
    order_number: conditions.order_number ?? null,
    
    // Restaurant spend
    min_restaurant_spend: conditions.min_restaurant_spend ?? null,
    
    // Restrictions
    payment_methods: Array.isArray(conditions.payment_methods) 
      ? conditions.payment_methods 
      : [],
    allowed_platforms: Array.isArray(conditions.allowed_platforms)
      ? conditions.allowed_platforms
      : [],
    
    // Complex conditions
    requires_items: Array.isArray(conditions.requires_items)
      ? conditions.requires_items
      : [],
    buy_x_get_y: conditions.buy_x_get_y ?? null,
  } : {};

  // ── Handle validity (keep ALL sub-fields) ──────────────────
  const normalizedValidity = validity ? {
    start_date: validity.start_date ?? null,
    end_date: validity.end_date ?? null,
    timezone: validity.timezone ?? "Asia/Kolkata",
    days_allowed: Array.isArray(validity.days_allowed)
      ? validity.days_allowed
      : [],
    time_ranges: Array.isArray(validity.time_ranges)
      ? validity.time_ranges
      : [],
  } : {};

  // ── Handle targeting ──────────────────────────────────────
  const normalizedTargeting = targeting ? {
    restaurants: Array.isArray(targeting.restaurants)
      ? targeting.restaurants
      : [],
    cuisines: Array.isArray(targeting.cuisines)
      ? targeting.cuisines
      : [],
    menu_items: Array.isArray(targeting.menu_items)
      ? targeting.menu_items
      : [],
    cities: Array.isArray(targeting.cities)
      ? targeting.cities
      : [],
    user_ids: Array.isArray(targeting.user_ids)
      ? targeting.user_ids
      : [],
  } : {};

  // ── Handle limits ──────────────────────────────────────────
  const normalizedLimits = limits ? {
    total_usage_limit: limits.total_usage_limit ?? null,
    usage_per_user: limits.usage_per_user ?? 1,
    current_usage_count: limits.current_usage_count ?? 0,
  } : {};

  // ── Handle stacking ────────────────────────────────────────
  const normalizedStacking = stacking ? {
    can_combine: Boolean(stacking.can_combine ?? false),
    excludes: Array.isArray(stacking.excludes)
      ? stacking.excludes
      : [],
  } : {};

  // ── Normalize is_active ────────────────────────────────────
  let normalizedIsActive = true;
  if (is_active !== undefined) {
    normalizedIsActive = Boolean(is_active);
  } else if (isActive !== undefined) {
    normalizedIsActive = Boolean(isActive);
  } else if (disabled !== undefined) {
    normalizedIsActive = !Boolean(disabled);
  }

  return {
    ...(code && { code: code.trim().toUpperCase() }),
    ...(title && { title: title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(type && { type }),
    ...(normalizedIsActive !== undefined && { is_active: normalizedIsActive }),
    ...(Object.keys(normalizedVisibility).length > 0 && { visibility: normalizedVisibility }),
    ...(Object.keys(normalizedValidity).length > 0 && { validity: normalizedValidity }),
    ...(Object.keys(normalizedTargeting).length > 0 && { targeting: normalizedTargeting }),
    ...(Object.keys(normalizedConditions).length > 0 && { conditions: normalizedConditions }),
    ...(reward && { reward }),
    ...(Object.keys(normalizedLimits).length > 0 && { limits: normalizedLimits }),
    ...(Object.keys(normalizedStacking).length > 0 && { stacking: normalizedStacking }),
  };
}
/**
 * Validate the reward sub-document before save.
 * Returns an error string or null.
 */
function validateRewardPayload(reward) {
  if (!reward?.type) return "reward.type is required.";

  const validTypes = ["flat", "percentage", "free_delivery", "free_item", "cashback", "bogo" , "bxgy"];
  if (!validTypes.includes(reward.type)) {
    return `reward.type must be one of: ${validTypes.join(", ")}.`;
  }

  if (["flat", "percentage"].includes(reward.type) && !reward.value && reward.value !== 0) {
    return `reward.value is required for type "${reward.type}".`;
  }

  if (reward.type === "percentage" && (reward.value < 0 || reward.value > 100)) {
    return "reward.value (percentage) must be between 0 and 100.";
  }

  if (reward.type === "free_item" && !reward.free_item) {
    return "reward.free_item (item ObjectId) is required for type 'free_item'.";
  }

  if (reward.type === "cashback" && !reward.cashback_amount && reward.cashback_amount !== 0) {
    return "reward.cashback_amount is required for type 'cashback'.";
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// GET /api/admin/coupons
// ─────────────────────────────────────────────────────────────
// List all coupons with optional filters.
// Query: ?type=coupon&is_active=true&search=SAVE50&page=1&limit=20
//
export const getCoupons = async (req, res) => {
  try {
    const {
      type, is_active, search,
      page = 1, limit = 20,
    } = req.query;

    const query = {};
    if (type)      query.type      = type;
    if (is_active !== undefined) query.is_active = is_active === "true";
    if (search)    query.code      = { $regex: search.toUpperCase(), $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Coupon.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: coupons,
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("[AdminCoupon] getCoupons:", err);
    res.status(500).json({ message: "Failed to fetch coupons." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/coupons/:id
// ─────────────────────────────────────────────────────────────

export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id).lean();
    if (!coupon) return res.status(404).json({ message: "Coupon not found." });

    return res.json({ success: true, data: coupon });
  } catch (err) {
    console.error("[AdminCoupon] getCouponById:", err);
    res.status(500).json({ message: "Failed to fetch coupon." });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/admin/coupons
// ─────────────────────────────────────────────────────────────

export const createCoupon = async (req, res) => {
  try {
    const { code, title, reward } = req.body;

    // ── Required field guards ─────────────────────────────────
    if (!code?.trim()) {
      return res.status(400).json({ message: "code is required." });
    }
    if (!title?.trim()) {
      return res.status(400).json({ message: "title is required." });
    }

    const rewardError = validateRewardPayload(reward);
    if (rewardError) {
      return res.status(400).json({ message: rewardError });
    }

    // ── Duplicate code check ──────────────────────────────────
    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({ message: `Coupon code "${code.toUpperCase()}" already exists.` });
    }

    // ── Build + create ────────────────────────────────────────
    const payload = buildCouponPayload(req.body);
    payload.created_by = req.user.id;

    const coupon = await Coupon.create(payload);

    return res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    console.error("[AdminCoupon] createCoupon:", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Coupon code already exists." });
    }
    res.status(500).json({ message: "Failed to create coupon.", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/coupons/:id
// ─────────────────────────────────────────────────────────────

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found." });

    // Validate reward if being updated
    if (req.body.reward) {
      const rewardError = validateRewardPayload(req.body.reward);
      if (rewardError) {
        return res.status(400).json({ message: rewardError });
      }
    }

    // Prevent changing the code to one that already exists
    if (req.body.code) {
      const newCode = req.body.code.trim().toUpperCase();
      if (newCode !== coupon.code) {
        const conflict = await Coupon.findOne({ code: newCode });
        if (conflict) {
          return res.status(409).json({ message: `Code "${newCode}" is already in use.` });
        }
      }
    }

    const updates = buildCouponPayload(req.body);
    updates.updated_by = req.user.id;

    // Use $set to support partial nested updates
    const updated = await Coupon.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("[AdminCoupon] updateCoupon:", err);
    res.status(500).json({ message: "Failed to update coupon.", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/coupons/:id/toggle
// ─────────────────────────────────────────────────────────────
// Activate or deactivate a coupon.

export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found." });

    coupon.is_active  = !coupon.is_active;
    coupon.updated_by = req.user.id;
    await coupon.save();

    return res.json({
      success: true,
      data: { is_active: coupon.is_active },
      message: `Coupon ${coupon.is_active ? "activated" : "deactivated"}.`,
    });
  } catch (err) {
    console.error("[AdminCoupon] toggleCouponStatus:", err);
    res.status(500).json({ message: "Failed to toggle coupon status." });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/coupons/:id
// ─────────────────────────────────────────────────────────────
// Hard delete. Will fail if coupon has been used (preserve history).

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found." });

    // Protect used coupons from deletion (preserve analytics + order history)
    if (coupon.analytics.total_used > 0) {
      return res.status(400).json({
        message: `Cannot delete — this coupon has been used ${coupon.analytics.total_used} time(s). Deactivate it instead.`,
      });
    }

    await coupon.deleteOne();
    return res.json({ success: true, message: "Coupon deleted." });
  } catch (err) {
    console.error("[AdminCoupon] deleteCoupon:", err);
    res.status(500).json({ message: "Failed to delete coupon." });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/coupons/:id/usage
// ─────────────────────────────────────────────────────────────
// Usage history for a single coupon.
// Query: ?page=1&limit=20

export const getCouponUsage = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id).select("code title analytics").lean();
    if (!coupon) return res.status(404).json({ message: "Coupon not found." });

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [usages, total] = await Promise.all([
      CouponUsage.find({ coupon_id: req.params.id })
        .populate("user_id", "name email")
        .populate("order_id", "total_amount createdAt status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CouponUsage.countDocuments({ coupon_id: req.params.id }),
    ]);

    return res.json({
      success: true,
      data: {
        coupon,
        usages,
        pagination: {
          total,
          page:  Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    console.error("[AdminCoupon] getCouponUsage:", err);
    res.status(500).json({ message: "Failed to fetch coupon usage." });
  }
};
