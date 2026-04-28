import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

// GET /restaurants
export const getRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find().lean();

    res.json({
      success: true,
      data: restaurants
    });
  } catch (err) {
    next(err);
  }
};

// GET /restaurant/:id
export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    // validate id format (optional but safe)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // get restaurant
    const restaurant = await Restaurant.findById(id).lean();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // 🔥 string-based query (matches your DB)
    const menu = await MenuItem.find({
      restaurant_id: id
    }).lean();

    console.log("Restaurant ID:", id);
    console.log("Menu found:", menu);

    res.json({
      success: true,
      data: {
        ...restaurant,
        menu
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};