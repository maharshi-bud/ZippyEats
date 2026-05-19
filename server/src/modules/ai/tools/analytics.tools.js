// ============================================================
// FILE: server/src/modules/ai/tools/analytics.tools.js
// ============================================================

import Order from "../../../models/Order.js";
import User from "../../../models/User.js";

// ── 1. Average Delivery Time ─────────────────────────────
export async function getAvgDeliveryTime({ range = "30d" } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: since },
        status: "delivered",
        delivered_at: { $exists: true, $ne: null },
      },
    },
    {
      $addFields: {
        deliveryMinutes: {
          $divide: [
            { $subtract: ["$delivered_at", "$createdAt"] },
            60000, // ms to minutes
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgMinutes: { $avg: "$deliveryMinutes" },
        minMinutes: { $min: "$deliveryMinutes" },
        maxMinutes: { $max: "$deliveryMinutes" },
        totalDelivered: { $sum: 1 },
      },
    },
  ]);

  if (!result.length) return { period: range, avgMinutes: 0, message: "No delivered orders found" };

  const r = result[0];
  return {
    period: range,
    avgDeliveryTime: `${Math.round(r.avgMinutes)} minutes`,
    fastestDelivery: `${Math.round(r.minMinutes)} minutes`,
    slowestDelivery: `${Math.round(r.maxMinutes)} minutes`,
    totalDelivered: r.totalDelivered,
  };
}

// ── 2. Top Menu Items ────────────────────────────────────
export async function getTopItems({ limit = 10, range = "30d" } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: "delivered" } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit },
    {
      $project: {
        name: "$_id",
        totalQuantity: 1,
        totalRevenue: 1,
        orderCount: 1,
      },
    },
  ]);

  return { period: range, topItems: result };
}

// ── 3. Revenue by Restaurant ─────────────────────────────
export async function getRevenueByRestaurant({ range = "30d", limit = 10 } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: "delivered" } },
    {
      $group: {
        _id: "$restaurant_id",
        restaurantName: { $first: "$restaurant_name" },
        totalRevenue: { $sum: "$total_amount" },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: "$total_amount" },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $project: {
        name: "$restaurantName",
        totalRevenue: 1,
        totalOrders: 1,
        avgOrderValue: { $round: ["$avgOrderValue", 2] },
      },
    },
  ]);

  return { period: range, revenueByRestaurant: result };
}

// ── 4. Repeat Customers ──────────────────────────────────
export async function getRepeatCustomers({ range = "30d", minOrders = 2 } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$user_id",
        orderCount: { $sum: 1 },
        totalSpent: { $sum: "$total_amount" },
      },
    },
    { $match: { orderCount: { $gte: Number(minOrders) } } },
    { $sort: { orderCount: -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $project: {
        name: { $arrayElemAt: ["$user.name", 0] },
        email: { $arrayElemAt: ["$user.email", 0] },
        orderCount: 1,
        totalSpent: 1,
      },
    },
  ]);

  const totalRepeat = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: "$user_id", orderCount: { $sum: 1 } } },
    { $match: { orderCount: { $gte: Number(minOrders) } } },
    { $count: "total" },
  ]);

  return {
    period: range,
    minOrders,
    totalRepeatCustomers: totalRepeat[0]?.total || 0,
    topRepeatCustomers: result,
  };
}

// ── 5. Payment Method Breakdown ──────────────────────────
export async function getPaymentMethodBreakdown({ range = "30d" } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$payment_method",
        count: { $sum: 1 },
        revenue: { $sum: "$total_amount" },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const total = result.reduce((sum, r) => sum + r.count, 0);
  const breakdown = result.map((r) => ({
    method: r._id || "unknown",
    count: r.count,
    revenue: r.revenue,
    percentage: `${((r.count / total) * 100).toFixed(1)}%`,
  }));

  return { period: range, totalOrders: total, paymentBreakdown: breakdown };
}

// ── 6. Delivery Fee Revenue ──────────────────────────────
export async function getDeliveryFeeRevenue({ range = "30d" } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: "delivered" } },
    {
      $group: {
        _id: null,
        totalDeliveryFee: { $sum: "$delivery_fee" },
        totalRevenue: { $sum: "$total_amount" },
        totalOrders: { $sum: 1 },
        avgDeliveryFee: { $avg: "$delivery_fee" },
      },
    },
  ]);

  if (!result.length) return { period: range, totalDeliveryFee: 0 };

  const r = result[0];
  return {
    period: range,
    totalDeliveryFeeRevenue: r.totalDeliveryFee,
    avgDeliveryFee: Math.round(r.avgDeliveryFee),
    deliveryFeeAsPercentOfRevenue: `${((r.totalDeliveryFee / r.totalRevenue) * 100).toFixed(1)}%`,
    totalOrders: r.totalOrders,
  };
}

// ── 7. Daily Order Volume ────────────────────────────────
export async function getDailyOrderVolume({ range = "30d" } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalOrders: { $sum: 1 },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
        },
        revenue: { $sum: "$total_amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const avgDaily = result.length
    ? Math.round(result.reduce((s, d) => s + d.totalOrders, 0) / result.length)
    : 0;

  return { period: range, avgDailyOrders: avgDaily, dailyVolume: result };
}

// ── 8. New vs Returning Users ────────────────────────────
export async function getNewVsReturningUsers({ range = "30d" } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Users who placed their first order in this range
  const allOrdersInRange = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: "$user_id" } },
  ]);

  const userIds = allOrdersInRange.map((o) => o._id);

  // Of those users, which ones had orders BEFORE this range
  const returningUsers = await Order.aggregate([
    {
      $match: {
        user_id: { $in: userIds },
        createdAt: { $lt: since },
      },
    },
    { $group: { _id: "$user_id" } },
    { $count: "total" },
  ]);

  const totalActive = userIds.length;
  const returning = returningUsers[0]?.total || 0;
  const newUsers = totalActive - returning;

  return {
    period: range,
    totalActiveUsers: totalActive,
    newUsers,
    returningUsers: returning,
    newUserPercentage: `${((newUsers / totalActive) * 100).toFixed(1)}%`,
    returningUserPercentage: `${((returning / totalActive) * 100).toFixed(1)}%`,
  };
}

// ── 9. Top Customers ─────────────────────────────────────
export async function getTopCustomers({ limit = 10, range = "30d" } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: "delivered" } },
    {
      $group: {
        _id: "$user_id",
        totalSpent: { $sum: "$total_amount" },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: "$total_amount" },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $project: {
        name: { $arrayElemAt: ["$user.name", 0] },
        email: { $arrayElemAt: ["$user.email", 0] },
        totalSpent: 1,
        orderCount: 1,
        avgOrderValue: { $round: ["$avgOrderValue", 2] },
      },
    },
  ]);

  return { period: range, topCustomers: result };
}

// ── 10. Low Rated / High Cancellation Restaurants ────────
export async function getLowRatedRestaurants({ limit = 5, range = "30d" } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$restaurant_id",
        restaurantName: { $first: "$restaurant_name" },
        totalOrders: { $sum: 1 },
        cancellations: {
          $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
        },
        delivered: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
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
    { $match: { totalOrders: { $gte: 5 } } }, // only restaurants with enough data
    { $sort: { cancellationRate: -1 } },
    { $limit: limit },
    {
      $project: {
        name: "$restaurantName",
        totalOrders: 1,
        cancellations: 1,
        delivered: 1,
        cancellationRate: {
          $concat: [
            {
              $toString: {
                $round: [{ $multiply: ["$cancellationRate", 100] }, 1],
              },
            },
            "%",
          ],
        },
      },
    },
  ]);

  return { period: range, lowRatedRestaurants: result };
}