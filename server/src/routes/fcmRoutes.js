// ============================================================
// FILE: server/src/routes/fcmRoutes.js
// ============================================================

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import admin from "firebase-admin";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();
const ADMIN_TOPICS = ["admin_orders", "admin_support"];
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
// router.delete("/token", protect, async (req, res) => {
//   try {
//     await User.findByIdAndUpdate(req.user._id || req.user.id, { fcmToken: null });
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });
router.delete("/token", protect, async (req, res) => {
  try {
      console.log("[FCM DELETE] req.user:", req.user);  // add this

    const userId = req.user.id;
    const userRole = req.user.role; // ← from JWT via protect, no DB query needed
 
    // Get current FCM token from DB before clearing it
    const user = await User.findById(userId).select("fcmToken");
 
    const fcmToken = user?.fcmToken;
 
    // Unsubscribe from admin topics BEFORE clearing token from DB
    // role comes from req.user (JWT) — no need to select it from DB
    if (fcmToken && userRole === "admin") {
      await Promise.allSettled(
        ADMIN_TOPICS.map((topic) =>
          admin.messaging()
            .unsubscribeFromTopic([fcmToken], topic)
            .then(() => console.log(`[FCM] Unsubscribed ${userId} from ${topic}`))
            .catch((err) => console.warn(`[FCM] Unsub ${topic} failed:`, err.message))
        )
      );
    }
 
    // Always clear token from DB regardless of role
    await User.findByIdAndUpdate(userId, { fcmToken: null });
 
    console.log("[FCM] Token cleared for user:", userId, "role:", userRole);
    res.json({ success: true });
  } catch (err) {
    console.error("[FCM Route] /token DELETE error:", err);
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
