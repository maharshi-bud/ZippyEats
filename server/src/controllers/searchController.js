import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

export const searchAll = async (req, res) => {
  try {
    const q = req.query.q?.trim();

    if (!q) {
      return res.json({
        success: true,
        data: { restaurants: [], items: [] }
      });
    }

    const regex = new RegExp(q, "i");

    const [restaurants, items] = await Promise.all([
      Restaurant.find({ name: regex }).limit(5),
      MenuItem.find({ name: regex }).limit(5)
    ]);

    res.json({
      success: true,
      data: { restaurants, items }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Search failed" });
  }
};