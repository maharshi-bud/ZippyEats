import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    restaurant_id: {
      type: String, // keeping your current design
      required: true
    },

    name: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    description: {
      type: String
    },

    // 🔥 NEW FIELD
    cuisine: {
      type: String,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", menuItemSchema);