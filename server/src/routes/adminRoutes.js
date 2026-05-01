// routes/adminRoutes.js

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/test", protect, adminOnly, (req, res) => {
  res.json({ message: "Admin access granted" });
});

export default router;