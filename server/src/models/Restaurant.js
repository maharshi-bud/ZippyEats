import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    delivery_time: {
      type: Number,
      required: true
    },
    cuisines: {
      type: [String],
      default: []
    }
  },
   
  
  { timestamps: true }
);

export default mongoose.model("Restaurant", restaurantSchema);
