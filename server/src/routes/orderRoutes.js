import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";



const router = express.Router();

router.post("/orders", protect, createOrder);
router.get("/orders/my", protect, getMyOrders);
router.get("/orders/:id", protect, getOrderById);

export default router;





