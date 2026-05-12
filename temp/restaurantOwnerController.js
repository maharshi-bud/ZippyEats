// server/src/controllers/restaurantOwnerController.js
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import User from "../models/User.js";
import { updateOrderStatus } from "../services/orderEngine.js";

// GET /restaurant-owner/orders
// Returns active + recent orders for the owner's restaurant
export const getMyOrders = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant_id;

    if (!restaurantId) {
      return res.status(400).json({ message: "No restaurant linked to this account" });
    }

    const orders = await Order.find({ restaurant_id: restaurantId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /restaurant-owner/orders/:id/status
export const updateMyOrderStatus = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant_id;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["accepted", "preparing", "out_for_delivery", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status for restaurant" });
    }

    // Verify the order belongs to this restaurant
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.restaurant_id !== restaurantId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await updateOrderStatus(id, status, "restaurant");
    res.json({ success: true, order: updated });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// GET /restaurant-owner/menu
export const getMyMenu = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant_id;
    const items = await MenuItem.find({ restaurant_id: restaurantId }).lean();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /restaurant-owner/menu
export const createMenuItem = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant_id;
    const { name, price, description, cuisine, veg } = req.body;

    if (!name || !price || !cuisine) {
      return res.status(400).json({ message: "name, price, and cuisine are required" });
    }

    const item = await MenuItem.create({
      restaurant_id: restaurantId,
      name,
      price,
      description: description || "",
      cuisine,
      veg: veg ?? true,
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /restaurant-owner/menu/:itemId
export const updateMenuItem = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant_id;
    const { itemId } = req.params;

    const item = await MenuItem.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.restaurant_id !== restaurantId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const allowed = ["name", "price", "description", "cuisine", "veg"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) item[field] = req.body[field];
    });

    await item.save();
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /restaurant-owner/menu/:itemId
export const deleteMenuItem = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant_id;
    const { itemId } = req.params;

    const item = await MenuItem.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.restaurant_id !== restaurantId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await item.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
