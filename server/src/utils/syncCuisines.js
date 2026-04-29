import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";

export const syncRestaurantCuisines = async () => {
  const restaurants = await Restaurant.find();

  for (const r of restaurants) {
    const cuisines = await MenuItem.distinct("cuisine", {
      restaurant_id: r._id.toString()
    });

    await Restaurant.findByIdAndUpdate(r._id, {
      cuisines
    });
  }

  console.log("✅ Cuisines synced");
};