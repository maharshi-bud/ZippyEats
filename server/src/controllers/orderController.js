import mongoose from "mongoose";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";



// POST /orders
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userId = req.user?.id;
    const { items } = req.body || {};

    // ❌ Validate user
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // ❌ Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      });
    }

    // 🔒 Convert IDs properly
    const menuIds = items.map((i) => {
      if (!mongoose.Types.ObjectId.isValid(i.menu_item_id)) {
        throw new Error("Invalid menu_item_id");
      }
      return new mongoose.Types.ObjectId(i.menu_item_id);
    });

    // 🔒 Fetch real menu items
    const menuItems = await MenuItem.find({
      _id: { $in: menuIds }
    }).session(session);

    if (menuItems.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu items"
      });
    }

    // 🧮 Calculate total
    let total = 0;

    const orderItems = items.map((item) => {
      const menu = menuItems.find(
        (m) => m._id.toString() === item.menu_item_id
      );

      if (!menu) {
        throw new Error("Menu item mismatch");
      }

      const price = menu.price;
      total += price * item.quantity;

      return {
        menu_item_id: menu._id,
        quantity: item.quantity,
        price
      };
    });

    // ⏱️ Time logic
    const now = new Date();
    const timeoutMinutes = parseInt(process.env.ORDER_TIMEOUT_MIN) || 5;

    const timeout_at = new Date(now.getTime() + timeoutMinutes * 60000);
    const eta = new Date(now.getTime() + 30 * 60000);

    // 🧾 Create order
    const order = await Order.create(
      [
        {
          user_id: userId,
          items: orderItems,
          total_amount: total,
          status: "placed",
          timeout_at,
          eta
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      data: order[0]
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("ORDER ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: err.message || "Order creation failed"
    });
  }
};




export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // ❌ validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    // 🔍 fetch order
    const order = await Order.findById(id)
      .populate("items.menu_item_id", "name price")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // 🔒 ensure ownership
    if (order.user_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

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