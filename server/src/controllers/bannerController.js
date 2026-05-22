// ============================================================
// FILE: server/src/controllers/bannerController.js
// ============================================================

import {
  PromoBanner,
  RushDeal,
} from "../models/Banners.js";

import MenuItem from "../models/MenuItem.js";

// ============================================================
// PROMO BANNERS
// ============================================================

// ------------------------------------------------------------
// GET ACTIVE PROMO BANNERS
// ------------------------------------------------------------

export const getPromoBanners =
async (req, res) => {

  try {

    const banners =
      await PromoBanner
        .find({
          isActive: true,
        })
        .sort({
          sortOrder: 1,
          createdAt: -1,
        });

    res.json({
      success: true,
      data: banners,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch promo banners",
    });
  }
};

// ------------------------------------------------------------
// CREATE PROMO BANNER
// ------------------------------------------------------------

export const createPromoBanner =
async (req, res) => {

  try {

    const {
      title,
      image,
      sortOrder,
    } = req.body;

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!title?.trim()) {

      return res.status(400).json({
        success: false,
        message: "Banner title is required",
      });
    }

    // Must have either:
    // - image URL
    // OR
    // - uploaded image

    if (
      !image?.trim() &&
      !req.file
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Please provide image URL or upload an image",
      });
    }

    const banner =
      new PromoBanner({

        title: title.trim(),

        image:
          image || "",

        sortOrder:
          Number(sortOrder) || 0,
      });

    // uploaded image
    if (req.file) {

      banner.imageFile = {

        data:
          req.file.buffer,

        contentType:
          req.file.mimetype,
      };
    }

    await banner.save();

    res.status(201).json({
      success: true,
      data: banner,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Failed to create banner",
    });
  }
};
// ------------------------------------------------------------
// UPDATE PROMO BANNER
// ------------------------------------------------------------

export const updatePromoBanner =
async (req, res) => {

  try {

    const banner =
      await PromoBanner.findById(
        req.params.id
      );

    if (!banner) {

      return res.status(404).json({
        success: false,
        message:
          "Banner not found",
      });
    }

    const {
      title,
      image,
      link,
      isActive,
      sortOrder,
    } = req.body;

    if (title !== undefined)
      banner.title = title;

    if (image !== undefined)
      banner.image = image;

    if (link !== undefined)
      banner.link = link;

    if (isActive !== undefined)
      banner.isActive = isActive;

    if (sortOrder !== undefined)
      banner.sortOrder =
        Number(sortOrder);

    // uploaded image override
    if (req.file) {

      banner.imageFile = {

        data:
          req.file.buffer,

        contentType:
          req.file.mimetype,
      };
    }

    await banner.save();

    res.json({
      success: true,
      data: banner,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Failed to update banner",
    });
  }
};

// ------------------------------------------------------------
// DELETE PROMO BANNER
// ------------------------------------------------------------

export const deletePromoBanner =
async (req, res) => {

  try {

    const banner =
      await PromoBanner.findById(
        req.params.id
      );

    if (!banner) {

      return res.status(404).json({
        success: false,
        message:
          "Banner not found",
      });
    }

    await banner.deleteOne();

    res.json({
      success: true,
      message:
        "Banner deleted",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Failed to delete banner",
    });
  }
};

// ------------------------------------------------------------
// GET PROMO BANNER IMAGE
// ------------------------------------------------------------

export const getPromoBannerImage =
async (req, res) => {

  try {

    const banner =
      await PromoBanner.findById(
        req.params.id
      );

    if (
      !banner?.imageFile?.data
    ) {

      return res
        .status(404)
        .send("No image");
    }

    res.set(
      "Content-Type",
      banner.imageFile.contentType
    );

    res.send(
      banner.imageFile.data
    );

  } catch (err) {

    console.error(err);

    res.status(500).send(
      "Failed to fetch image"
    );
  }
};

// ============================================================
// RUSH DEALS
// ============================================================

// ------------------------------------------------------------
// GET ACTIVE RUSH DEALS
// ------------------------------------------------------------

export const getRushDeals =
async (req, res) => {

  try {

    const deals =
      await RushDeal
        .find({

          isActive: true,

          $or: [
            {
              endsAt: null,
            },
            {
              endsAt: {
                $gt: new Date(),
              },
            },
          ],
        })

        .populate(
          "menuItem"
        )

        .sort({
          sortOrder: 1,
          createdAt: -1,
        });

    res.json({
      success: true,
      data: deals,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch rush deals",
    });
  }
};

// ------------------------------------------------------------
// CREATE RUSH DEAL
// ------------------------------------------------------------

export const createRushDeal =
async (req, res) => {

  try {

    const {

      restaurant_id,

      menuItem,

      discountPrice,

      discountPercent,

      startsAt,

      endsAt,

      sortOrder,

    } = req.body;

    const item =
      await MenuItem.findById(
        menuItem
      );

    if (!item) {

      return res.status(404).json({
        success: false,
        message:
          "Menu item not found",
      });
    }

    const deal =
      new RushDeal({

        restaurant_id,

        menuItem,

        itemName:
          item.name,

        oldPrice:
          item.price,

        discountPrice:
          Number(discountPrice) || 0,

        discountPercent:
          Number(discountPercent) || 0,

        startsAt:
          startsAt || null,

        endsAt:
          endsAt || null,

        sortOrder:
          Number(sortOrder) || 0,
      });

    await deal.save();

    res.status(201).json({
      success: true,
      data: deal,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Failed to create rush deal",
    });
  }
};

// ------------------------------------------------------------
// UPDATE RUSH DEAL
// ------------------------------------------------------------

export const updateRushDeal =
async (req, res) => {

  try {

    const deal =
      await RushDeal.findById(
        req.params.id
      );

    if (!deal) {

      return res.status(404).json({
        success: false,
        message:
          "Rush deal not found",
      });
    }

    const {

      discountPrice,

      discountPercent,

      startsAt,

      endsAt,

      isActive,

      sortOrder,

    } = req.body;

    if (discountPrice !== undefined)
      deal.discountPrice =
        Number(discountPrice);

    if (discountPercent !== undefined)
      deal.discountPercent =
        Number(discountPercent);

    if (startsAt !== undefined)
      deal.startsAt =
        startsAt;

    if (endsAt !== undefined)
      deal.endsAt =
        endsAt;

    if (isActive !== undefined)
      deal.isActive =
        isActive;

    if (sortOrder !== undefined)
      deal.sortOrder =
        Number(sortOrder);

    await deal.save();

    res.json({
      success: true,
      data: deal,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Failed to update rush deal",
    });
  }
};

// ------------------------------------------------------------
// DELETE RUSH DEAL
// ------------------------------------------------------------

export const deleteRushDeal =
async (req, res) => {

  try {

    const deal =
      await RushDeal.findById(
        req.params.id
      );

    if (!deal) {

      return res.status(404).json({
        success: false,
        message:
          "Rush deal not found",
      });
    }

    await deal.deleteOne();

    res.json({
      success: true,
      message:
        "Rush deal deleted",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Failed to delete rush deal",
    });
  }
};
