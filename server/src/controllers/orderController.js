import mongoose from "mongoose";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import {
  emitNewOrder,
  scheduleNextTransition,
} from "../services/orderEngine.js";
  import {
    notifyOrderCreated,
    notifyOrderStatusChanged,
    notifyOrderCancelled,
  } from "../services/fcmService.js";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";


export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userId = req.user?.id;
    const {
      items,
      restaurant_id: restaurantIdFromBody,
      restaurant_name: restaurantNameFromBody,
      delivery_address: deliveryAddressFromBody,
    } = req.body || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const menuIds = items.map((i) => {
      if (!mongoose.Types.ObjectId.isValid(i.menu_item_id)) {
        throw new Error("Invalid menu_item_id");
      }
      return new mongoose.Types.ObjectId(i.menu_item_id);
    });

    const menuItems = await MenuItem.find({
      _id: { $in: menuIds },
    }).session(session);

    if (menuItems.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu items",
      });
    }

    let total = 0;

    const orderItems = items.map((item) => {
      const menu = menuItems.find(
        (m) => m._id.toString() === item.menu_item_id
      );

      if (!menu) throw new Error("Menu item mismatch");

      const price = menu.price;
      total += price * item.quantity;

      return {
        menu_item_id: menu._id,
        quantity: item.quantity,
        name: menu.name,
        image: menu.image || null,
        veg: menu.veg ?? true,
        price,
      };
    });

    const restaurantId =
      restaurantIdFromBody || menuItems[0]?.restaurant_id || null;
    const restaurantName =
      restaurantNameFromBody || menuItems[0]?.restaurant_name || "Restaurant";
    const deliveryAddress =
      deliveryAddressFromBody || items[0]?.delivery_address || null;

    const now = new Date();
    const timeoutMinutes = parseInt(process.env.ORDER_TIMEOUT_MIN) || 5;
    const timeout_at = new Date(now.getTime() + timeoutMinutes * 60000);
    const eta = new Date(now.getTime() + 30 * 60000);
    const { useZipCoins = false } = req.body;
let coinsUsed = 0;
let coinsDiscount = 0;

if (useZipCoins) {
  const user = await User.findById(userId).select("zipCoins");
  const userCoins = user?.zipCoins || 0;
  const orderTotal = total + 40; // subtotal + delivery fee

  if (userCoins > 0) {
    // Use as many coins as needed (1 coin = ₹1)
    coinsUsed = Math.min(userCoins, orderTotal);
    coinsDiscount = coinsUsed;
  }
}
    const order = await Order.create(
      [
        {
          user_id: userId,
          restaurant_id: restaurantId,
          restaurant_name: restaurantName,
          items: orderItems,
          total_amount: total + 40,
          delivery_fee: 40,
          subtotal: total,
          status: "placed",
          timeout_at,
          eta,
          delivery_address: {
            full_name: deliveryAddress?.full_name || "Customer",
            phone: deliveryAddress?.phone || "0000000000",
            address_line:
              deliveryAddress?.address_line ||
              (typeof deliveryAddress === "string"
                ? deliveryAddress
                : "Default"),
            city: deliveryAddress?.city || "Ahmedabad",
            state: deliveryAddress?.state || "Gujarat",
            country: deliveryAddress?.country || "India",
          },
          
  total_amount: total + 40 - coinsDiscount,  // ← subtract coins discount
  coins_used: coinsUsed,                     // ← add this field to Order model too
  coins_discount: coinsDiscount,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    // Deduct coins from user
if (coinsUsed > 0) {
  await User.findByIdAndUpdate(userId, {
    $inc: { zipCoins: -coinsUsed },
  });
}

    session.endSession();

    // ✅ Emit realtime events
    emitNewOrder(order[0]);
    scheduleNextTransition(order[0]);

    // ✅ FCM — single call, isolated, non-fatal
    try {
  const createdOrder = order[0]; // ← always use order[0]

  console.log("[Order] restaurant_id:", createdOrder.restaurant_id);

  const restaurantOwner = await User.findOne({
    restaurant_id: createdOrder.restaurant_id,
    role: "restaurant",
  });

  console.log("[Order] restaurantOwner FCM:", restaurantOwner?.fcmToken?.slice(0, 20));

  await notifyOrderCreated({
    restaurantFcmToken: restaurantOwner?.fcmToken,
    restaurantName: createdOrder.restaurant_name,
    orderId: createdOrder._id.toString(),
    itemCount: createdOrder.items.length,
    total: createdOrder.total_amount,
  });
} catch (fcmErr) {
  console.error("FCM FAILED (non-fatal):", fcmErr.message);
}

    // ✅ Single return with correct variable
    return res.status(201).json({
      success: true,
      data: order[0],
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("ORDER ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: err.message || "Order creation failed",
    });
  }
};


export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findById(id)
      .populate("items.menu_item_id", "name price image")  // ✅ added image
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.user_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    // ✅ Add image to response (not saved to DB)
    order.items = order.items.map((item) => ({
      menu_item_id: item.menu_item_id?._id || item.menu_item_id,
      name: item.menu_item_id?.name || "Unknown",
      price: item.price,
      quantity: item.quantity,
      image: item.menu_item_id?.image || null
    }));

    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error("GET ORDER ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order"
    });
  }
};















export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "items.menu_item_id",
        select: "name price restaurant_id",
        populate: {
          path: "restaurant_id",
          select: "name"
        }
      })
      .lean();

    res.json({
      success: true,
      data: orders
    });
  } catch (err) {
    console.error("GET MY ORDERS ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: "Error fetching orders"
    });
  }
};


