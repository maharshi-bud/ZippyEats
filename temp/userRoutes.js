import express from "express";
import {
  getProfile,
  getUserStats,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Profile & stats
router.get("/me", protect, getProfile);
router.get("/stats", protect, getUserStats);

// Address management
router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.put("/addresses/:addressId", protect, updateAddress);
router.delete("/addresses/:addressId", protect, deleteAddress);
router.patch("/addresses/:addressId/default", protect, setDefaultAddress);

export default router;
