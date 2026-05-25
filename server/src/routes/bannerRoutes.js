// ============================================================
// FILE: server/src/routes/bannerRoutes.js
// ============================================================
// NOTE: The original file was binary/unreadable in the repo dump.
// Reconstructed from bannerController.js exports and the API
// calls observed in admin/src/app/(admin)/banners/page.jsx.
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
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── PROMO BANNERS ─────────────────────────────────────────────

// Public — anyone can see active banners (client homepage)
router.get("/banners", getPromoBanners);
router.get("/banners/:id/image", getPromoBannerImage);

// Admin — write operations
router.post(
  "/admin/banners",
  protect, requirePermission("banners", "add"),
  upload.single("image"),
  createPromoBanner
);

router.put(
  "/admin/banners/:id",
  protect, requirePermission("banners", "edit"),
  upload.single("image"),
  updatePromoBanner
);

router.delete(
  "/admin/banners/:id",
  protect, requirePermission("banners", "delete"),
  deletePromoBanner
);

// Admin — read (the admin UI fetches all banners, not just active ones)
router.get(
  "/admin/banners",
  protect, requirePermission("banners", "view"),
  getPromoBanners
);

// ── RUSH DEALS ────────────────────────────────────────────────

// Public
router.get("/rush-deals", getRushDeals);

// Admin — write operations
router.post(
  "/admin/rush-deals",
  protect, requirePermission("queries", "add"),
  createRushDeal
);

router.put(
  "/admin/rush-deals/:id",
  protect, requirePermission("queries", "edit"),
  updateRushDeal
);

router.delete(
  "/admin/rush-deals/:id",
  protect, requirePermission("queries", "delete"),
  deleteRushDeal
);

// Admin — read
router.get(
  "/admin/rush-deals",
  protect, requirePermission("queries", "view"),
  getRushDeals
);

export default router;