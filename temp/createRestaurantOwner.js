// server/src/utils/createRestaurantOwner.js

import bcrypt from "bcrypt";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";

export default createRestaurantOwners = async () => {
  try {
    const restaurants = await Restaurant.find();

    for (const restaurant of restaurants) {
      const loginId =
        restaurant.restaurant_id ||
        restaurant._id.toString();

      const rawPassword = restaurant.name.replace(/\s+/g, "_");

      const existing = await User.findOne({
        email: loginId,
      });

      const hashed = await bcrypt.hash(rawPassword, 10);

      if (existing) {
        await User.updateOne(
          { _id: existing._id },
          {
            $set: {
              password: hashed,
              role: "restaurant",
              restaurant_id: loginId,
            },
          }
        );

        console.log(
          `Updated owner: ${loginId} / ${rawPassword}`
        );

        continue;
      }

      await User.create({
        name: `${restaurant.name} Owner`,
        email: loginId,
        password: hashed,
        role: "restaurant",
        restaurant_id: loginId,
      });

      console.log(
        `Created owner: ${loginId} / ${rawPassword}`
      );
    }

    console.log("Restaurant owners synced");
  } catch (err) {
    console.error("Owner creation error:", err);
  }
};