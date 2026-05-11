import express from "express";

import {
  getOrderById,
  updateOrderStatus,
} from "../../controllers/admin/orderController.js";

const router = express.Router();

router.get("/:id", getOrderById);

router.put("/:id/status", updateOrderStatus);
// router.put("/:id/status", updateOrderStatus);
export default router;