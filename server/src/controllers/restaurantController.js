import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

// GET /restaurants
export const getRestaurants = async (req, res, next) => {
  try {
    const { cuisine } = req.query;

    let filter = {};

    // 🔥 filter by cuisine (via menu items)
    if (cuisine) {
      const restaurantIds = await MenuItem.distinct("restaurant_id", {
        cuisine
      });

      filter._id = { $in: restaurantIds };
    }

    const restaurants = await Restaurant.find(filter).lean();

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

    // if (!mongoose.Types.ObjectId.isValid(id)) {
    //   return res.status(400).json({ message: "Invalid ID" });
    // }

    const restaurant = await Restaurant.findById(id).lean();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // 🔥 fetch menu
    const menu = await MenuItem.find({
      restaurant_id: id
    }).lean();

    // 🔥 derive cuisines (no need for sync script)
    const cuisines = [...new Set(menu.map((m) => m.cuisine))];

    res.json({
      success: true,
      data: {
        ...restaurant,
        cuisines,
        menu
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};