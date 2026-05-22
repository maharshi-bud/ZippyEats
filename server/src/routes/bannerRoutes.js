// ============================================================
// FILE: server/src/routes/bannerRoutes.js
// ============================================================

import express from "express";
import {
  getPromoBanners,
  createPromoBanner,
  updatePromoBanner,
  deletePromoBanner,
  getPromoBannerImage,
  getRushDeals,
  createRushDeal,
  updateRushDeal,
  deleteRushDeal,
} from "../controllers/bannerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { upload } from "../config/multer.js";

const router = express.Router();

// ── PUBLIC ────────────────────────────────────────────────
router.get("/banners", getPromoBanners);
router.get("/banners/image/:id", getPromoBannerImage);
router.get("/rush-deals", getRushDeals);

// ── ADMIN ─────────────────────────────────────────────────

// GET ALL (including inactive) — for admin dashboard
router.get("/admin/banners", protect, adminOnly, async (req, res) => {
  const { PromoBanner } = await import("../models/Banners.js");
  const banners = await PromoBanner.find().sort({ sortOrder: 1, createdAt: -1 });
  res.json({ success: true, data: banners });
});

router.get("/admin/rush-deals", protect, adminOnly, async (req, res) => {
  const { RushDeal } = await import("../models/Banners.js");
  const deals = await RushDeal.find().populate("menuItem").sort({ sortOrder: 1, createdAt: -1 });
  res.json({ success: true, data: deals });
});

// CREATE
router.post("/admin/banners", protect, adminOnly, upload.single("imageFile"), createPromoBanner);
router.post("/admin/rush-deals", protect, adminOnly, createRushDeal);

// UPDATE (edit + toggle active via isActive field)
router.put("/admin/banners/:id", protect, adminOnly, upload.single("imageFile"), updatePromoBanner);
router.put("/admin/rush-deals/:id", protect, adminOnly, updateRushDeal);

// DELETE
router.delete("/admin/banners/:id", protect, adminOnly, deletePromoBanner);
router.delete("/admin/rush-deals/:id", protect, adminOnly, deleteRushDeal);

export default router;