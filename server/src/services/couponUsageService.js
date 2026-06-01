import Coupon from "../models/Coupon.js";
import CouponUsage from "../models/CouponUsage.js";

export const createCouponUsage = async ({
  couponId,
  userId,
  orderId,
  discountAmount = 0,
  cashbackAmount = 0,
  rewardType = "",
}) => {

  if (!couponId) {
    console.log("[CouponUsage] No couponId provided, skipping");
    return;
  }

  try {
    console.log("[CouponUsage] Creating usage record:", {
      couponId,
      userId,
      orderId,
      discountAmount,
      cashbackAmount,
      rewardType,
    });

    // ─────────────────────────────────────────
    // Create usage history row
    // ─────────────────────────────────────────

    const usage = await CouponUsage.create({
      coupon_id: couponId,
      user_id: userId,
      order_id: orderId,
      discount_amount: discountAmount,
      cashback_amount: cashbackAmount,
      reward_type: rewardType,
    });

    console.log("[CouponUsage] Usage record created:", usage._id);

    // ─────────────────────────────────────────
    // Increment coupon usage counter
    // ─────────────────────────────────────────

    const updated = await Coupon.findByIdAndUpdate(
      couponId,
      {
        $inc: {
          "limits.current_usage_count": 1,
        },
      },
      { new: true }
    );

    console.log("[CouponUsage] Coupon usage count updated:", {
      coupon_id: couponId,
      new_count: updated?.limits?.current_usage_count,
    });

    return usage;
  } catch (err) {
    console.error("[CouponUsage] Error creating usage:", err.message);
    throw err;
  }
};
