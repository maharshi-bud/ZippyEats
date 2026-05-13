import express from "express";
import { handleAdminQuery } from "./ai.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { adminOnly } from "../../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/query", protect, adminOnly, handleAdminQuery);

export default router;