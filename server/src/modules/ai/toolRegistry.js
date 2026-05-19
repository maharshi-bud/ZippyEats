// ============================================================
// FILE: server/src/modules/ai/toolRegistry.js
// ============================================================

import {
  getRevenueStats,
  getPeakHours,
  getCancellationStats,
  getOrderStatusBreakdown,
} from "./tools/orders.tools.js";

import {
  getTopRestaurants,
  getUnderperformingRestaurants,
} from "./tools/restaurants.tools.js";

import { getUserGrowth } from "./tools/users.tools.js";

import {
  getAvgDeliveryTime,
  getTopItems,
  getRevenueByRestaurant,
  getRepeatCustomers,
  getPaymentMethodBreakdown,
  getDeliveryFeeRevenue,
  getDailyOrderVolume,
  getNewVsReturningUsers,
  getTopCustomers,
  getLowRatedRestaurants,
} from "./tools/analytics.tools.js";

// ✅ Add new tools here — AI will automatically have access to them
export const toolRegistry = {
  // existing
  getRevenueStats,
  getPeakHours,
  getCancellationStats,
  getOrderStatusBreakdown,
  getTopRestaurants,
  getUnderperformingRestaurants,
  getUserGrowth,

  // analytics.tools.js
  getAvgDeliveryTime,
  getTopItems,
  getRevenueByRestaurant,
  getRepeatCustomers,
  getPaymentMethodBreakdown,
  getDeliveryFeeRevenue,
  getDailyOrderVolume,
  getNewVsReturningUsers,
  getTopCustomers,
  getLowRatedRestaurants,
};