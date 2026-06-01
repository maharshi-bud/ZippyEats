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
 * Used by both createCoupon and updateCoupon.
 */
function buildCouponPayload(body) {
  const {
    code, title, description, type,
    visibility, validity, targeting,
    conditions, reward, limits, stacking,
  } = body;

  return {
    ...(code        !== undefined && { code:        code.trim().toUpperCase() }),
    ...(title       !== undefined && { title:       title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(type        !== undefined && { type }),
    ...(visibility  !== undefined && { visibility }),
    ...(validity    !== undefined && { validity }),
    ...(targeting   !== undefined && { targeting }),
    ...(conditions  !== undefined && { conditions }),
    ...(reward      !== undefined && { reward }),
    ...(limits      !== undefined && { limits }),
    ...(stacking    !== undefined && { stacking }),
  };
}

/**
 * Validate the reward sub-document before save.
 * Returns an error string or null.
 */
function validateRewardPayload(reward) {
  if (!reward?.type) return "reward.type is required.";

  const validTypes = ["flat", "percentage", "free_delivery", "free_item", "cashback", "bogo"];
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
      { new: true, runValidators: true }
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