// ============================================================
// FILE: server/src/modules/ai/tools/analytics.tools.js
// ============================================================
import Order from "../../../models/Order.js";
import User from "../../../models/User.js";
import { resolveDateRange } from "./dateUtils.js";

export async function getAvgDeliveryTime(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);

  const result = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: "delivered",
        delivered_at: { $exists: true, $ne: null },
      },
    },
    {
      $addFields: {
        deliveryMinutes: { $divide: [{ $subtract: ["$delivered_at", "$createdAt"] }, 60000] },
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

  if (!result.length) return { period: label, avgMinutes: 0, message: "No delivered orders found" };

  const r = result[0];
  return {
    period: label,
    avgDeliveryTime: `${Math.round(r.avgMinutes)} minutes`,
    fastestDelivery: `${Math.round(r.minMinutes)} minutes`,
    slowestDelivery: `${Math.round(r.maxMinutes)} minutes`,
    totalDelivered: r.totalDelivered,
  };
}

export async function getTopItems(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);
  const limit = args.limit || 10;

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: "delivered" } },
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
    { $project: { name: "$_id", totalQuantity: 1, totalRevenue: 1, orderCount: 1 } },
  ]);

  return { period: label, topItems: result };
}

export async function getRevenueByRestaurant(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);
  const limit = args.limit || 10;

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: "delivered" } },
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

  return { period: label, revenueByRestaurant: result };
}

export async function getRepeatCustomers(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);
  const minOrders = args.minOrders || 2;

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: "$user_id", orderCount: { $sum: 1 }, totalSpent: { $sum: "$total_amount" } } },
    { $match: { orderCount: { $gte: Number(minOrders) } } },
    { $sort: { orderCount: -1 } },
    { $limit: 20 },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
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
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: "$user_id", orderCount: { $sum: 1 } } },
    { $match: { orderCount: { $gte: Number(minOrders) } } },
    { $count: "total" },
  ]);

  return {
    period: label,
    minOrders,
    totalRepeatCustomers: totalRepeat[0]?.total || 0,
    topRepeatCustomers: result,
  };
}

export async function getPaymentMethodBreakdown(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: "$payment_method", count: { $sum: 1 }, revenue: { $sum: "$total_amount" } } },
    { $sort: { count: -1 } },
  ]);

  const total = result.reduce((sum, r) => sum + r.count, 0);
  const breakdown = result.map((r) => ({
    method: r._id || "unknown",
    count: r.count,
    revenue: r.revenue,
    percentage: `${((r.count / total) * 100).toFixed(1)}%`,
  }));

  return { period: label, totalOrders: total, paymentBreakdown: breakdown };
}

export async function getDeliveryFeeRevenue(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: "delivered" } },
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

  if (!result.length) return { period: label, totalDeliveryFee: 0 };

  const r = result[0];
  return {
    period: label,
    totalDeliveryFeeRevenue: r.totalDeliveryFee,
    avgDeliveryFee: Math.round(r.avgDeliveryFee),
    deliveryFeeAsPercentOfRevenue: `${((r.totalDeliveryFee / r.totalRevenue) * 100).toFixed(1)}%`,
    totalOrders: r.totalOrders,
  };
}

export async function getDailyOrderVolume(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalOrders: { $sum: 1 },
        deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        revenue: { $sum: "$total_amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const avgDaily = result.length
    ? Math.round(result.reduce((s, d) => s + d.totalOrders, 0) / result.length)
    : 0;

  return { period: label, avgDailyOrders: avgDaily, dailyVolume: result };
}

export async function getNewVsReturningUsers(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);

  const allOrdersInRange = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: "$user_id" } },
  ]);

  const userIds = allOrdersInRange.map((o) => o._id);

  const returningUsers = await Order.aggregate([
    { $match: { user_id: { $in: userIds }, createdAt: { $lt: startDate } } },
    { $group: { _id: "$user_id" } },
    { $count: "total" },
  ]);

  const totalActive = userIds.length;
  const returning   = returningUsers[0]?.total || 0;
  const newUsers    = totalActive - returning;

  return {
    period: label,
    totalActiveUsers: totalActive,
    newUsers,
    returningUsers: returning,
    newUserPercentage: totalActive ? `${((newUsers / totalActive) * 100).toFixed(1)}%` : "0%",
    returningUserPercentage: totalActive ? `${((returning / totalActive) * 100).toFixed(1)}%` : "0%",
  };
}

export async function getTopCustomers(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);
  const limit = args.limit || 10;

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: "delivered" } },
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
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
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

  return { period: label, topCustomers: result };
}

export async function getLowRatedRestaurants(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);
  const limit = args.limit || 5;

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: "$restaurant_id",
        restaurantName: { $first: "$restaurant_name" },
        totalOrders: { $sum: 1 },
        cancellations: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
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
    { $match: { totalOrders: { $gte: 5 } } },
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
            { $toString: { $round: [{ $multiply: ["$cancellationRate", 100] }, 1] } },
            "%",
          ],
        },
      },
    },
  ]);

  return { period: label, lowRatedRestaurants: result };
}