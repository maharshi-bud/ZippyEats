import express from "express";
import { handleAdminQuery } from "./ai.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { adminOnly } from "../../middleware/adminMiddleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { requirePermission } from "../../middleware/permissionMiddleware.js";

const router = express.Router();

// AI chat query endpoint - requires BI (Business Intelligence) view permission
// This allows admins and any role granted bi.view permission to use chat
// router.post("/query", protect, requirePermission("bi", "view"), handleAdminQuery);


// router.post("/query", protect, adminOnly, handleAdminQuery);

// router.post(
//   "/query",
//   protect, requirePermission(PERMISSIONS.AI_QUERY),
//   handleAdminQuery
// );

router.post("/query", protect, requirePermission("bi", "edit"), handleAdminQuery);


export default router;