// ============================================================
// FILE: server/src/modules/ai/tools/users.tools.js
// ============================================================

import User from "../../../models/User.js"; // ← adjust if needed

export async function getUserGrowth({ range = "30d" } = {}) {
  const days = parseInt(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const daily = await User.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        newUsers: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const total = daily.reduce((sum, d) => sum + d.newUsers, 0);
  return { period: range, totalNewUsers: total, dailyBreakdown: daily };
}