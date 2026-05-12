import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { restaurantOnly } from "../middleware/restaurantMiddleware.js";
import {
  getMyOrders,
  updateMyOrderStatus,
  getMyMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/restaurantOwnerController.js";



import {
  getRestaurantDashboard,
} from "../controllers/restaurantOwnerController.js";

import restaurantMiddleware from "../middleware/restaurantMiddleware.js";

const router = express.Router();

// All routes require a logged-in restaurant owner
router.use(protect, restaurantOnly);

// Orders
router.get("/orders", getMyOrders);
router.patch("/orders/:id/status", updateMyOrderStatus);

// Menu
router.get("/menu", getMyMenu);
router.post("/menu", createMenuItem);
router.put("/menu/:itemId", updateMenuItem);
router.delete("/menu/:itemId", deleteMenuItem);
router.get(
  "/dashboard",
  protect,
  restaurantMiddleware,
  getRestaurantDashboard
);
export default router;
