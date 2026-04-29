import express from "express";
import {
  getAllMenuItems,
  getMenuItemsByRestaurant,
  getPopularItems,
  createMenuItem
} from "../controllers/menuController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


// 🔹 GET all menu items (optional - debug/admin)
router.get("/", getAllMenuItems);


// 🔹 GET menu by restaurant ID
router.get("/restaurant/:id", getMenuItemsByRestaurant);


// 🔥 GET popular (random 5 dishes)
router.get("/popular", getPopularItems);


// 🔐 POST create menu item (admin only)
router.post("/", protect, createMenuItem);


export default router;