// ============================================================
// FILE: server/src/modules/ai/tools/orders.tools.js
// ============================================================

import Order from "../../../models/Order.js"; // ← adjust if needed

export async function getRevenueStats({ range = "30d" } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const daily = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: "delivered" } },
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
  const totalOrders = daily.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

  return { period: range, totalRevenue, totalOrders, avgOrderValue, dailyBreakdown: daily };
}

export async function getPeakHours({ days = 7 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
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

  return { days, peakHours: result };
}

export async function getCancellationStats({ range = "30d" } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [cancelled, total] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: since }, status: "cancelled" }),
    Order.countDocuments({ createdAt: { $gte: since } }),
  ]);

  const rate = total > 0 ? ((cancelled / total) * 100).toFixed(2) : "0.00";
  return { period: range, cancelled, total, cancellationRate: `${rate}%` };
}

export async function getOrderStatusBreakdown({ range = "30d" } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        revenue: { $sum: "$total_amount" },
      },
    },
  ]);

  return { period: range, breakdown: result };
}