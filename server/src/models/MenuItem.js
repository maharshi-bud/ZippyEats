import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    restaurant_id: {
      type: String, // keeping your current design
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      index: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    description: {
      type: String,
      default: ""
    },

    // 🔥 NEW FIELD
    cuisine: {
      type: String,
      required: true,
      index: true
    },

    // ✅ NEW IMAGE FIELD
    image: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", menuItemSchema);