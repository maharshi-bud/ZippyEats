import mongoose from "mongoose";

// ============================================================
// PROMO BANNERS
// ============================================================
// ONLY:
// - title
// - image (url or uploaded image)
// - redirect link
// ============================================================

const promoBannerSchema =
  new mongoose.Schema(

    {

      title: {
        type: String,
        default: "",
        trim: true,
      },

      // external image URL
      image: {
        type: String,
        default: "",
        trim: true,
      },

      // uploaded image stored in MongoDB
      imageFile: {

        data: {
          type: Buffer,
          default: null,
        },

        contentType: {
          type: String,
          default: "",
        },
      },

      // redirect URL/path
      link: {
        type: String,
        default: "/",
        trim: true,
      },

      isActive: {
        type: Boolean,
        default: true,
        index: true,
      },

      sortOrder: {
        type: Number,
        default: 0,
      },

    },

    {
      timestamps: true,
    }
  );

// ============================================================
// RUSH DEALS
// ============================================================
// ONLY:
// - restaurant id
// - menu item
// - old price
// - discount price OR %
// ============================================================

const rushDealSchema =
  new mongoose.Schema(

    {

      restaurant_id: {

        type: String,

        required: true,

        index: true,
      },

      menuItem: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref: "MenuItem",

        required: true,
      },

      // item name snapshot
      itemName: {

        type: String,

        required: true,

        trim: true,
      },

      // original item price
      oldPrice: {

        type: Number,

        required: true,
      },

      // discounted final price
      discountPrice: {

        type: Number,

        default: 0,
      },

      // optional %
      discountPercent: {

        type: Number,

        default: 0,
      },

      startsAt: {

        type: Date,

        default: null,
      },

      endsAt: {

        type: Date,

        default: null,
      },

      isActive: {

        type: Boolean,

        default: true,

        index: true,
      },

      sortOrder: {

        type: Number,

        default: 0,
      },

    },

    {
      timestamps: true,
    }
  );

// ============================================================
// MODELS
// ============================================================

export const PromoBanner =

  mongoose.models.PromoBanner ||

  mongoose.model(
    "PromoBanner",
    promoBannerSchema
  );

export const RushDeal =

  mongoose.models.RushDeal ||

  mongoose.model(
    "RushDeal",
    rushDealSchema
  );

export default PromoBanner;