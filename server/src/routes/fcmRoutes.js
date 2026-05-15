// ============================================================
// FILE: server/src/routes/fcmRoutes.js
// ============================================================

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// POST /api/fcm/token  — save FCM token for logged-in user
router.post("/token", protect, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token required" });

    await User.findByIdAndUpdate(req.user._id, { fcmToken: token });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/fcm/token — remove on logout
router.delete("/token", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { fcmToken: "" } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
