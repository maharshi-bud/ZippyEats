// ============================================================
// FILE: server/src/modules/ai/tools/users.tools.js
// ============================================================
import User from "../../../models/User.js";
import Order from "../../../models/Order.js";
import { resolveDateRange } from "./dateUtils.js";

export async function getUserGrowth(args = {}) {
  const { startDate, endDate, label } = resolveDateRange(args);

  const daily = await User.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        newUsers: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const total = daily.reduce((sum, d) => sum + d.newUsers, 0);
  return { period: label, totalNewUsers: total, dailyBreakdown: daily };
}