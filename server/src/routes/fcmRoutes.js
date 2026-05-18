// ============================================================
// FILE: server/src/routes/fcmRoutes.js
// ============================================================

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import admin from "firebase-admin";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// POST /api/fcm/token  — save FCM token for logged-in user
// router.post("/token", protect, async (req, res) => {
//   try {
//     const { token } = req.body;
//     if (!token) return res.status(400).json({ message: "Token required" });
//     console.log("[FCM Route] Token saved successfully");
//     await User.findByIdAndUpdate(req.user._id, { fcmToken: token });
//         console.log("[FCM Route] Token saved successfully");
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });



router.post("/token", protect, async (req, res) => {
  try {
    const { token } = req.body;
    console.log("[FCM] req.user:", req.user);
    console.log("[FCM] token received:", token?.slice(0, 20));
    
    if (!token) return res.status(400).json({ message: "Token required" });

    const result = await User.findByIdAndUpdate(
      req.user._id || req.user.id,
      { fcmToken: token },
     { returnDocument: "after" }
      // { new: true }  // ← returns updated doc
    );
    console.log("[FCM] Updated user fcmToken:", result?.fcmToken?.slice(0, 20));
    res.json({ success: true });
  } catch (err) {
    console.error("[FCM Route] Error:", err);
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


// POST /api/fcm/subscribe-admin
router.post("/subscribe-admin", protect, adminOnly, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token required" });
    
    await admin.messaging().subscribeToTopic([token], "admin_orders");
    await admin.messaging().subscribeToTopic([token], "admin_support");

    res.json({ success: true });
  } catch (err) {
    console.error("[FCM] subscribeAdmin error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
