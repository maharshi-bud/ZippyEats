import express from "express";
import { createOrder } from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { getOrderById } from "../controllers/orderController.js";



const router = express.Router();

router.post("/orders", protect, createOrder);
router.get("/orders/:id", protect, getOrderById);

export default router;