import mongoose from "mongoose";
import MenuItem from "../models/MenuItem.js";
import {
  DEFAULT_SHELF_LIMIT,
  filterQuickBites,
  orderRecentlyViewed,
  sortTopRatedItems,
} from "../utils/menuShelfUtils.js";


// 🔹 GET all
export const getAllMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find().lean();

    res.json({
      success: true,
      data: items
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// 🔹 GET by restaurant
export const getMenuItemsByRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const items = await MenuItem.find({
      restaurant_id: id // 🔥 string match (your DB)
    }).lean();

    res.json({
      success: true,
      data: items
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// 🔥 GET popular (random)
export const getPopularItems = async (req, res) => {
  try {
    const items = await MenuItem.aggregate([
      { $sample: { size: 7 } }
    ]);

    res.json({
      success: true,
      data: items
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getPeopleAlsoLikeItems = async (req, res) => {
  try {
    const items = await MenuItem.aggregate([
      { $sample: { size: DEFAULT_SHELF_LIMIT } }
    ]);

    res.json({
      success: true,
      data: items
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getTopRatedItems = async (req, res) => {
  try {
    const items = await MenuItem.find().lean();

    res.json({
      success: true,
      data: sortTopRatedItems(items).slice(0, DEFAULT_SHELF_LIMIT)
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getQuickBites = async (req, res) => {
  try {
    const items = await MenuItem.find({
      price: { $lte: 200 }
    })
      .limit(DEFAULT_SHELF_LIMIT)
      .lean();

    res.json({
      success: true,
      data: filterQuickBites(items)
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getRecentlyViewedItems = async (req, res) => {
  try {
    const ids = String(req.query.ids || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, DEFAULT_SHELF_LIMIT);
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (!validIds.length) {
      return res.json({
        success: true,
        data: []
      });
    }

    const items = await MenuItem.find({
      _id: { $in: validIds }
    }).lean();

    res.json({
      success: true,
      data: orderRecentlyViewed(items, validIds)
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 🔐 CREATE
export const createMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
