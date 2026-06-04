// server/src/middleware/authMiddleware.js
// ════════════════════════════════════════════════════════════════
// Authentication middleware - verify JWT token and attach user

import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Protect route - verify JWT token and attach user to req.user
 * Usage: app.use(protect) or router.get("/route", protect, handler)
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fetch full user from DB to get latest role
    const user = await User.findById(decoded.id)
      .populate("role", "name") // Populate role with just the name
      .select("_id email role restaurant_id")
      .lean();

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ Attach to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role?.name || decoded.role, // Use DB role or fallback to token
      restaurant_id: user.restaurant_id || null,
    };

    next();
  } catch (err) {
    console.error("[Auth] Protection failed:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * Optional: Verify user is logged in (simpler, no DB hit)
 * Only validates token signature, doesn't fetch user
 */
export const protectTokenOnly = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role,
      restaurant_id: decoded.restaurant_id || null,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};