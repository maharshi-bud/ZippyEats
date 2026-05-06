import express from "express";
import {
  getAllMenuItems,
  getMenuItemsByRestaurant,
  getPopularItems,
  getPeopleAlsoLikeItems,
  getTopRatedItems,
  getQuickBites,
  getRecentlyViewedItems,
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

// 💡 GET people also like (popular pool, reshuffled)
router.get("/people", getPeopleAlsoLikeItems);


// ⭐ GET top rated (rating if present, then price)
router.get("/top-rated", getTopRatedItems);


// ⚡ GET quick bites (items at or below ₹200)
router.get("/quick", getQuickBites);


// 🕐 GET recently viewed items from localStorage ids
router.get("/recently-viewed", getRecentlyViewedItems);


// 🔐 POST create menu item (admin only)
router.post("/", protect, createMenuItem);


export default router;
