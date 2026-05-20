// ============================================================
// FILE: server/src/modules/ai/tools/orders.tools.js
// ============================================================
import Order from "../../../models/Order.js";
import { resolveDateRange } from "./dateUtils.js";

export async function getRevenueStats(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);

  const daily = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: "delivered" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$total_amount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalRevenue = daily.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders  = daily.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

  return { period: label, totalRevenue, totalOrders, avgOrderValue, dailyBreakdown: daily };
}

export async function getPeakHours(args = {}) {
  const { startDate, endDate, label } = resolveDateRange({ range: `${args.days || 7}d`, ...args });

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        orderCount: { $sum: 1 },
        revenue: { $sum: "$total_amount" },
      },
    },
    { $sort: { orderCount: -1 } },
    {
      $project: {
        hour: "$_id",
        orderCount: 1,
        revenue: 1,
        label: { $concat: [{ $toString: "$_id" }, ":00"] },
      },
    },
  ]);

  return { period: label, peakHours: result };
}

export async function getCancellationStats(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);

  const [cancelled, total] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: startDate, $lte: endDate }, status: "cancelled" }),
    Order.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
  ]);

  const rate = total > 0 ? ((cancelled / total) * 100).toFixed(2) : "0.00";
  return { period: label, cancelled, total, cancellationRate: `${rate}%` };
}

export async function getOrderStatusBreakdown(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        revenue: { $sum: "$total_amount" },
      },
    },
  ]);

  return { period: label, breakdown: result };
}