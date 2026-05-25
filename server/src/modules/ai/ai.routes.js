import express from "express";
import { handleAdminQuery } from "./ai.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { adminOnly } from "../../middleware/adminMiddleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { requirePermission } from "../../middleware/permissionMiddleware.js";
const router = express.Router();


router.post("/query", protect, adminOnly, handleAdminQuery);

router.post(
  "/query",
  protect, requirePermission(PERMISSIONS.AI_QUERY),
  handleAdminQuery
);


export default router;