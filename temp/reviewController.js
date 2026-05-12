import mongoose from "mongoose";
import Review from "../models/Review.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";

// POST /reviews  — submit a review for a delivered order item
export const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_id, menu_item_id, rating, comment } = req.body;

    if (!order_id || !menu_item_id || !rating) {
      return res.status(400).json({ message: "order_id, menu_item_id, and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Verify the order belongs to this user and is delivered
    const order = await Order.findById(order_id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user_id.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    if (order.status !== "delivered") {
      return res.status(400).json({ message: "You can only review delivered orders" });
    }

    // Verify the item is actually in the order
    const itemInOrder = order.items.find(
      (i) => i.menu_item_id.toString() === menu_item_id
    );
    if (!itemInOrder) {
      return res.status(400).json({ message: "Item not found in this order" });
    }

    // Create review (unique index prevents duplicates)
    const review = await Review.create({
      user_id: userId,
      menu_item_id,
      order_id,
      rating,
      comment: comment?.trim() || "",
    });

    // Recalculate item's rating and totalReviews
    const agg = await Review.aggregate([
      { $match: { menu_item_id: new mongoose.Types.ObjectId(menu_item_id) } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    if (agg.length > 0) {
      await MenuItem.findByIdAndUpdate(menu_item_id, {
        rating: Math.round(agg[0].avg * 10) / 10,
        totalReviews: agg[0].count,
      });
    }

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "You have already reviewed this item for this order" });
    }
    console.error("REVIEW ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /reviews/item/:menuItemId  — get all reviews for a menu item
export const getReviewsForItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({ message: "Invalid menu item ID" });
    }

    const reviews = await Review.find({ menu_item_id: menuItemId })
      .populate("user_id", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /reviews/reviewable — get delivered orders with items the user hasn't reviewed yet
export const getReviewableItems = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ user_id: userId, status: "delivered" }).lean();

    // Find all reviews this user has already written
    const existingReviews = await Review.find({ user_id: userId }).lean();
    const reviewedKeys = new Set(
      existingReviews.map((r) => `${r.order_id}_${r.menu_item_id}`)
    );

    const reviewable = [];

    for (const order of orders) {
      for (const item of order.items) {
        const key = `${order._id}_${item.menu_item_id}`;
        if (!reviewedKeys.has(key)) {
          reviewable.push({
            order_id: order._id,
            order_date: order.createdAt,
            menu_item_id: item.menu_item_id,
            name: item.name,
            image: item.image || null,
            price: item.price,
          });
        }
      }
    }

    res.json({ success: true, data: reviewable });
  } catch (err) {
    console.error("REVIEWABLE ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
