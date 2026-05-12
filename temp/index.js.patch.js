// ── ADD THESE TWO IMPORTS near the other route imports ──────────────────────
import reviewRoutes from "./routes/reviewRoutes.js";

// ── ADD THESE TWO LINES near the other app.use() calls ─────────────────────
app.use("/api/reviews", reviewRoutes);

// That's it. userRoutes already covers /api/users — the new address sub-routes
// are added to the same router in userRoutes.js so they mount automatically.
//
// Full updated server/src/index.js route block should look like:
//   app.use("/api", orderRoutes);
//   app.use("/api/test", testRoutes);
//   app.use("/api/admin/stats", protect, adminOnly, adminStatsRoutes);
//   app.use("/api/auth", authRoutes);
//   app.use("/api/menu", menuRoutes);
//   app.use("/api", restaurantRoutes);
//   app.use("/api/users", userRoutes);        ← already there
//   app.use("/api/search", searchRoutes);
//   app.use("/api/admin/orders", adminOrderRoutes);
//   app.use("/api/reviews", reviewRoutes);    ← ADD THIS
