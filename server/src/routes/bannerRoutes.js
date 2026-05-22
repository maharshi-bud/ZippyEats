// ============================================================
// FILE: server/src/routes/bannerRoutes.js
// ============================================================

import express from "express";

import {

  // PROMO BANNERS
  getPromoBanners,
  createPromoBanner,
  updatePromoBanner,
  deletePromoBanner,
  getPromoBannerImage,

  // RUSH DEALS
  getRushDeals,
  createRushDeal,
  updateRushDeal,
  deleteRushDeal,

} from "../controllers/bannerController.js";

import { protect }
from "../middleware/authMiddleware.js";

import { adminOnly }
from "../middleware/adminMiddleware.js";

import { upload }
from "../config/multer.js";

const router =
  express.Router();

// ============================================================
// PROMO BANNERS
// ============================================================

// ------------------------------------------------------------
// PUBLIC
// ------------------------------------------------------------

// get all active banners
router.get(
  "/banners",
  getPromoBanners
);

// get uploaded banner image from DB
router.get(
  "/banners/image/:id",
  getPromoBannerImage
);

// ------------------------------------------------------------
// ADMIN
// ------------------------------------------------------------

// create banner
router.post(

  "/admin/banners",

  protect,
  adminOnly,

  upload.single("imageFile"),

  createPromoBanner
);

// update banner
router.put(

  "/admin/banners/:id",

  protect,
  adminOnly,

  upload.single("imageFile"),

  updatePromoBanner
);

// delete banner
router.delete(

  "/admin/banners/:id",

  protect,
  adminOnly,

  deletePromoBanner
);

// ============================================================
// RUSH DEALS
// ============================================================

// ------------------------------------------------------------
// PUBLIC
// ------------------------------------------------------------

// get active rush deals
router.get(
  "/rush-deals",
  getRushDeals
);

// ------------------------------------------------------------
// ADMIN
// ------------------------------------------------------------

// create rush deal
router.post(

  "/admin/rush-deals",

  protect,
  adminOnly,

  createRushDeal
);

// update rush deal
router.put(

  "/admin/rush-deals/:id",

  protect,
  adminOnly,

  updateRushDeal
);

// delete rush deal
router.delete(

  "/admin/rush-deals/:id",

  protect,
  adminOnly,

  deleteRushDeal
);

export default router;