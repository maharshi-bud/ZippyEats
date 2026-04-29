import MenuItem from "../models/MenuItem.js";


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