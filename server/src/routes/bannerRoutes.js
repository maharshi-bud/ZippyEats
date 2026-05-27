// ============================================================
// FILE: server/src/routes/bannerRoutes.js
// ============================================================
// FIX: was using adminOnly — replaced with requirePermission
// so RBAC roles (not just admin) can manage banners based
// on their "banners" resource permissions.
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
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { upload } from "../config/multer.js";

const router = express.Router();

// ============================================================
// PROMO BANNERS
// ============================================================

// ── PUBLIC — client reads active banners, no auth ────────────
router.get("/banners", getPromoBanners);
router.get("/banners/image/:id", getPromoBannerImage);

// ── ADMIN GET ALL (including inactive) ───────────────────────
router.get(
  "/admin/banners",
  protect,
  requirePermission("banners", "view"),
  async (req, res) => {
    try {
      const { PromoBanner } = await import("../models/Banners.js");
      const banners = await PromoBanner.find().sort({ sortOrder: 1, createdAt: -1 });
      res.json({ success: true, data: banners });
    } catch (err) {
      console.error("[banners] admin GET error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// ── CREATE ────────────────────────────────────────────────────
router.post(
  "/admin/banners",
  protect,
  requirePermission("banners", "add"),
  upload.single("imageFile"),
  createPromoBanner
);

// ── UPDATE (edit + toggle isActive) ──────────────────────────
router.put(
  "/admin/banners/:id",
  protect,
  requirePermission("banners", "edit"),
  upload.single("imageFile"),
  updatePromoBanner
);

// ── DELETE ────────────────────────────────────────────────────
router.delete(
  "/admin/banners/:id",
  protect,
  requirePermission("banners", "delete"),
  deletePromoBanner
);

// ============================================================
// RUSH DEALS
// ============================================================

// ── PUBLIC ───────────────────────────────────────────────────
router.get("/rush-deals", getRushDeals);

// ── ADMIN GET ALL (including inactive + expired) ─────────────
router.get(
  "/admin/rush-deals",
  protect,
  requirePermission("banners", "view"),
  async (req, res) => {
    try {
      const { RushDeal } = await import("../models/Banners.js");
      const deals = await RushDeal.find()
        .populate("menuItem")
        .sort({ sortOrder: 1, createdAt: -1 });
      res.json({ success: true, data: deals });
    } catch (err) {
      console.error("[rush-deals] admin GET error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// ── CREATE ────────────────────────────────────────────────────
router.post(
  "/admin/rush-deals",
  protect,
  requirePermission("banners", "add"),
  createRushDeal
);

// ── UPDATE (edit + toggle isActive) ──────────────────────────
router.put(
  "/admin/rush-deals/:id",
  protect,
  requirePermission("banners", "edit"),
  updateRushDeal
);

// ── DELETE ────────────────────────────────────────────────────
router.delete(
  "/admin/rush-deals/:id",
  protect,
  requirePermission("banners", "delete"),
  deleteRushDeal
);

export default router;