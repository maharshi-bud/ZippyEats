// ============================================================
// FILE: server/src/modules/ai/tools/restaurants.tools.js
// ============================================================

// import Order from "../../../models/Order.js";       // ← adjust if needed
// import Restaurant from "../../../models/Restaurant.js"; // ← adjust if needed

import Order from "../../../models/Order.js";
import Restaurant from "../../../models/Restaurant.js";

export async function getTopRestaurants({ limit = 5 } = {}) {
  const result = await Order.aggregate([
    { $match: { status: "delivered" } },
    {
      $group: {
        _id: "$restaurant_id",
        totalRevenue: { $sum: "$total_amount" },
        totalOrders: { $sum: 1 },
        restaurantName: { $first: "$restaurant_name" }, // ✅ using restaurant_name from order
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $project: {
        name: "$restaurantName",
        totalRevenue: 1,
        totalOrders: 1,
        avgOrderValue: {
          $round: [{ $divide: ["$totalRevenue", "$totalOrders"] }, 2],
        },
      },
    },
  ]);

  return { topRestaurants: result };
}

export async function getUnderperformingRestaurants({ limit = 5 } = {}) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: "$restaurant_id",
        restaurantName: { $first: "$restaurant_name" },
        totalRevenue: { $sum: "$total_amount" },
        totalOrders: { $sum: 1 },
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
    { $sort: { totalRevenue: 1 } }, // lowest revenue first = worst performers
    { $limit: limit },
    {
      $project: {
        name: "$restaurantName",
        totalRevenue: 1,
        totalOrders: 1,
        cancellations: 1,
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