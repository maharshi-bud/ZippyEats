import mongoose from "mongoose";

import Order from "../../models/Order.js";
import User from "../../models/User.js";
import MenuItem from "../../models/MenuItem.js";
import Restaurant from "../../models/Restaurant.js";

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

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status,
      },
      {
        new: true,
      }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order: updatedOrder,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to update order",
    });
  }
};