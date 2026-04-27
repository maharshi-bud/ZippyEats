import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", menuItemSchema);