// ============================================================
// FILE: server/src/modules/ai/ai.routes.js
// ============================================================
// ⚠️  Replace `verifyAdmin` with YOUR actual admin auth middleware
// ============================================================

import express from "express";
import { handleAdminQuery } from "./ai.controller.js";
import { verifyAdmin } from "../../middleware/authMiddleware.js"; // ← adjust this path

const router = express.Router();

// POST /api/ai/query
router.post("/query", verifyAdmin, handleAdminQuery);

export default router;


// ============================================================
// Then in your main app.js / server.js, register it like this:
// ============================================================
//
//   import aiRoutes from "./modules/ai/ai.routes.js";
//   app.use("/api/ai", aiRoutes);
//
// ============================================================
