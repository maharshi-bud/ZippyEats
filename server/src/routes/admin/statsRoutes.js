import express from "express";
import {
  overview,
  revenueChart,
  ordersChart,
  orderStatus,
  topRestaurants,
  topItems,
  userGrowth,
} from "../../controllers/admin/adminStatsController.js";

const router = express.Router();

router.get("/overview", overview);
router.get("/revenue", revenueChart);
router.get("/orders", ordersChart);
router.get("/status", orderStatus);
router.get("/top-restaurants", topRestaurants);
router.get("/top-items", topItems);
router.get("/users-growth", userGrowth);

export default router;
