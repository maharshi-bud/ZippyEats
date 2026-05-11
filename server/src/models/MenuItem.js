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
    veg: {
  type: Boolean,
  default: true,
},

rating: {
  type: Number,
  default: 4.2,
},

totalReviews: {
  type: Number,
  default: 0,
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