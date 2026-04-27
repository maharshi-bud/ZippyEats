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
export const getRestaurantById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // console.log("DEBUG: Param ID:", id);
    // console.log("DEBUG: DB Name:", mongoose.connection.name);
    // console.log("DEBUG: Collection Name:", Restaurant.collection.name);

    const restaurant = await Restaurant.findOne({
      _id: id
    }).lean();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json({
      success: true,
      data: restaurant
    });
  } catch (err) {
    next(err);
  }
};
