import express from "express";
import {
  createReview,
  getReviewsForItem,
  getReviewableItems,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createReview);
router.get("/reviewable", protect, getReviewableItems);
router.get("/item/:menuItemId", getReviewsForItem);

export default router;
