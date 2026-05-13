// ============================================================
// FILE: server/src/modules/ai/tools/orders.tools.js
// ============================================================
// ⚠️  Adjust the import path to match YOUR Order model location
// ============================================================

import Order from "../../orders/order.model.js";

/**
 * Get total revenue + daily breakdown for a given range
 * @param {Object} args
 * @param {"7d"|"30d"|"90d"} args.range
 */
export async function getRevenueStats({ range = "30d" } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const daily = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: "delivered" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
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

/**
 * Get peak order hours (busiest times of day)
 * @param {Object} args
 * @param {number} args.days
 */
export async function getPeakHours({ days = 7 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        orderCount: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { orderCount: -1 } },
    {
      $project: {
        hour: "$_id",
        orderCount: 1,
        revenue: 1,
        label: {
          $concat: [
            { $toString: "$_id" },
            ":00"
          ]
        }
      }
    }
  ]);

  return { days, peakHours: result };
}

/**
 * Get cancellation count + rate
 * @param {Object} args
 * @param {"7d"|"30d"} args.range
 */
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

/**
 * Get order status breakdown (delivered / cancelled / pending / processing)
 * @param {Object} args
 * @param {"7d"|"30d"} args.range
 */
export async function getOrderStatusBreakdown({ range = "30d" } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  return { period: range, breakdown: result };
}
