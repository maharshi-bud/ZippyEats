import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { adminOnly } from "../../middleware/adminMiddleware.js";
import {
  getOrderById,
  updateOrderStatus,
} from "../../controllers/admin/orderController.js";

const router = express.Router();

router.get("/:id", protect, adminOnly, getOrderById);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

export default router;