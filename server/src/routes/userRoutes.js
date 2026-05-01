import express from "express";
import { getProfile, getUserStats } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";


const router = express.Router();

router.get("/me", protect, getProfile);
router.get("/stats", protect, getUserStats);

export default router;
