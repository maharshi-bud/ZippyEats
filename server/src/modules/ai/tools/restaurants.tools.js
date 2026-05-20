// ============================================================
// FILE: server/src/modules/ai/tools/restaurants.tools.js
// ============================================================
import Order from "../../../models/Order.js";
import Restaurant from "../../../models/Restaurant.js";
import { resolveDateRange } from "./dateUtils.js";

export async function getTopRestaurants(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);
  const limit = args.limit || 5;

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: "delivered" } },
    {
      $group: {
        _id: "$restaurant_id",
        totalRevenue: { $sum: "$total_amount" },
        totalOrders: { $sum: 1 },
        restaurantName: { $first: "$restaurant_name" },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $project: {
        name: "$restaurantName",
        totalRevenue: 1,
        totalOrders: 1,
        avgOrderValue: { $round: [{ $divide: ["$totalRevenue", "$totalOrders"] }, 2] },
      },
    },
  ]);

  return { period: label, topRestaurants: result };
}

export async function getUnderperformingRestaurants(args = {}) {
  const { startDate, endDate, label } = resolveDateRange({ range: "30d", ...args });
  const limit = args.limit || 5;

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
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
    { $sort: { totalRevenue: 1 } },
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

  return { period: label, underperformingRestaurants: result };
}