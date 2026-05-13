// ============================================================
// FILE: server/src/modules/ai/tools/restaurants.tools.js
// ============================================================
// ⚠️  Adjust import paths to match YOUR model locations
// ============================================================

import Order from "../../orders/order.model.js";
import Restaurant from "../../restaurants/restaurant.model.js";

/**
 * Get top N restaurants by total revenue
 * @param {Object} args
 * @param {number} args.limit
 */
export async function getTopRestaurants({ limit = 5 } = {}) {
  const result = await Order.aggregate([
    { $match: { status: "delivered" } },
    {
      $group: {
        _id: "$restaurantId",
        totalRevenue: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "restaurants",
        localField: "_id",
        foreignField: "_id",
        as: "info",
      },
    },
    {
      $project: {
        name: { $arrayElemAt: ["$info.name", 0] },
        cuisine: { $arrayElemAt: ["$info.cuisineType", 0] },
        totalRevenue: 1,
        totalOrders: 1,
        avgRating: { $round: ["$avgRating", 1] },
      },
    },
  ]);

  return { topRestaurants: result };
}

/**
 * Get underperforming restaurants (low revenue + low rating)
 * @param {Object} args
 * @param {number} args.limit
 */
export async function getUnderperformingRestaurants({ limit = 5 } = {}) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: "$restaurantId",
        totalRevenue: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        avgRating: { $avg: "$rating" },
        cancellations: {
          $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
        },
      },
    },
    {
      $addFields: {
        cancellationRate: {
          $cond: [
            { $gt: ["$totalOrders", 0] },
            { $divide: ["$cancellations", "$totalOrders"] },
            0,
          ],
        },
      },
    },
    // Sort: lowest revenue + lowest rating = worst performers
    { $sort: { totalRevenue: 1, avgRating: 1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "restaurants",
        localField: "_id",
        foreignField: "_id",
        as: "info",
      },
    },
    {
      $project: {
        name: { $arrayElemAt: ["$info.name", 0] },
        totalRevenue: 1,
        totalOrders: 1,
        avgRating: { $round: ["$avgRating", 1] },
        cancellationRate: {
          $concat: [
            { $toString: { $round: [{ $multiply: ["$cancellationRate", 100] }, 1] } },
            "%",
          ],
        },
      },
    },
  ]);

  return { underperformingRestaurants: result };
}
