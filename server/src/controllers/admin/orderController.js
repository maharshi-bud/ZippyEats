import mongoose from "mongoose";

import Order from "../../models/Order.js";
import User from "../../models/User.js";
import MenuItem from "../../models/MenuItem.js";
import Restaurant from "../../models/Restaurant.js";
import { updateOrderStatus as updateScheduledOrderStatus } from "../../services/orderEngine.js";
import Coupon from "../../models/Coupon.js";  // ← ADD THIS
import CouponUsage from "../../models/CouponUsage.js";  // ← ADD THIS
 import {
  notifyOrderCreated,
  notifyOrderStatusChanged,
  notifyOrderCancelled,
} from "../../services/fcmService.js";
import { validateCoupon, calculateBXGYRewards } from "../../utils/couponValidation.js";  // ← ADD THIS


export const createOrder = async (req, res) => {
  try {
    const { cart, coupon, deliveryAddress } = req.body;
    const userId = req.user._id;

    // Validate coupon if provided
    let discount = 0;
    let finalCart = [...cart];

    if (coupon?.code) {
      const couponDoc = await Coupon.findByCode(coupon.code);
      if (!couponDoc) {
        return res.status(400).json({ error: "Invalid coupon code" });
      }

      const validationResult = await validateCoupon(couponDoc, { items: cart });
      if (!validationResult.valid) {
        return res.status(400).json({ error: validationResult.reason });
      }

      // Handle BXGY coupon
      if (couponDoc.reward.type === "bxgy" && couponDoc.bxgy_config) {
        const bxgyResult = calculateBXGYRewards(couponDoc, { items: cart });
        if (bxgyResult.valid && bxgyResult.rewards.length > 0) {
          // Add rewards to cart
          for (const reward of bxgyResult.rewards) {
            finalCart.push({
              menu_item_id: reward.item_id,
              quantity: reward.quantity,
              price: 0,
              originalPrice: reward.originalPrice,
              isRewardItem: true,
            });
          }
          discount = bxgyResult.rewards.reduce(
            (sum, r) => sum + (r.originalPrice * r.quantity),
            0
          );
        }
      } else {
        // Regular coupon discount
        discount = couponDoc.reward.value || 0;
      }
    }

    // Calculate totals
    const subtotal = finalCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 40;
    const total = subtotal + deliveryFee - discount;

    // Create order
    const order = new Order({
      user_id: userId,
      items: finalCart,
      subtotal,
      discount,
      delivery_fee: deliveryFee,
      total_amount: total,
      delivery_address: deliveryAddress,
      payment_method: req.body.paymentMethod || "cod",
      status: "placed",
      coupon_code: coupon?.code,
      coupon_type: coupon?.reward?.type,
      bxgy_rewards: coupon?.reward?.type === "bxgy" ? finalCart.filter(i => i.isRewardItem) : null,
    });

    await order.save();

    // Mark coupon as used
    if (coupon?.code) {
      await CouponUsage.create({
        coupon_code: coupon.code,
        user_id: userId,
        order_id: order._id,
      });
    }

    res.json({
      success: true,
      orderId: order._id,
      total: total,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // validate mongo id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // USER
    const user = await User.findById(order.user_id)
      .select("name email");

    // ITEMS
    const items = await Promise.all(
      order.items.map(async (item) => {
        const menuItem = await MenuItem.findById(
          item.menu_item_id
        ).lean();

        if (!menuItem) {
          return {
            quantity: item.quantity,
            price: 0,
            name: "Deleted Item",
          };
        }

        return {
          quantity: item.quantity,
          price: menuItem.price,
          name: menuItem.name,
          image: menuItem.image,
          total: menuItem.price * item.quantity,
        };
      })
    );

    // RESTAURANT (first item)
    let restaurant = null;

    if (order.items?.length > 0) {
      const firstMenuItem = await MenuItem.findById(
        order.items[0].menu_item_id
      );

      if (firstMenuItem?.restaurant_id) {
        restaurant = await Restaurant.findById(
          firstMenuItem.restaurant_id
        ).select("name");
      }
    }

    res.json({
      ...order,

      user,

      restaurant,

      items,

      address:
        order.delivery_address ||
        order.address ||
        "No address",

      payment_method:
        order.payment_method || "Online",

      total_amount:
        order.total_amount || 0,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch order",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "placed",
      "accepted",
      "preparing",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    // ❌ Invalid status
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    // 🔥 ADMIN OVERRIDE ENABLED HERE
    const updatedOrder =
      await updateScheduledOrderStatus(
        id,
        status,
        "admin"
      );

    res.json({
      success: true,
      order: updatedOrder,
    });







  } catch (err) {

    console.error(err);

    if (err.message === "Order not found") {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (err.message === "Invalid status transition") {
      return res.status(400).json({
        message: err.message,
      });
    }

    res.status(500).json({
      message: "Failed to update order",
    });

  }
};

export const updateOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      payment_status,
      delivery_address,
      eta,
      cancellation_reason,
      instructions,
      delivery_fee,
      coupon_discount,
    } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 1. Update basic scalar fields
    if (payment_status) order.payment_status = payment_status;
    if (eta) order.eta = new Date(eta);
    if (cancellation_reason !== undefined) order.cancellation_reason = cancellation_reason;
    if (instructions !== undefined) order.instructions = instructions;

    // 2. Update numeric fields safely
    if (delivery_fee !== undefined) order.delivery_fee = Number(delivery_fee);
    if (coupon_discount !== undefined) order.coupon_discount = Number(coupon_discount);

    // 3. Update delivery address (merge objects)
    if (delivery_address) {
      order.delivery_address = {
        ...order.delivery_address,
        ...delivery_address,
      };
    }

    // 4. Recalculate total amount if financials changed
    if (delivery_fee !== undefined || coupon_discount !== undefined) {
      order.total_amount =
        order.subtotal +
        order.delivery_fee -
        order.coupon_discount -
        (order.coins_discount || 0) +
        (order.tax_amount || 0);
    }

    order._updatedByAdmin = true;
    await order.save();

    // 5. Handle Status Update via the Engine (if status changed)
    let finalOrder = order;
    if (status && status !== order.status) {
      finalOrder = await updateScheduledOrderStatus(id, status, "admin");
    }

    res.json({
      success: true,
      order: finalOrder,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to update order details",
    });
  }
};
