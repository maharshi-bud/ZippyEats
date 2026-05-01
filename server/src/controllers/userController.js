import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";




export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};




export const getUserStats = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user.id })
      .populate({
        path: "items.menu_item_id",
        select: "name restaurant_id"
      });

    const itemCount = {};
    const restaurantCount = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const menuItem = item.menu_item_id;
        const itemName = menuItem?.name;
        if (itemName) {
            itemCount[itemName] =
            (itemCount[itemName] || 0) + item.quantity;
        }
        
        const restaurantId = menuItem?.restaurant_id;
        
        if (restaurantId) {
            restaurantCount[restaurantId] =
            (restaurantCount[restaurantId] || 0) + item.quantity;
        }
      });
    });

    const mostBoughtItem = Object.entries(itemCount).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const favRestaurantEntry = Object.entries(restaurantCount).sort(
      (a, b) => b[1] - a[1]
    )[0];

    let favoriteRestaurant = null;

    if (favRestaurantEntry) {
      const restaurant = await Restaurant.findById(favRestaurantEntry[0])
        .select("name")
        .lean();

      favoriteRestaurant = restaurant?.name || favRestaurantEntry[0];
    }

    res.json({
      data: {
        totalOrders: orders.length,
        mostBoughtItem: mostBoughtItem?.[0] || null,
        favoriteRestaurant
      }
    }
);
  } catch (err) {
    console.error(err); // 🔥 add this for debugging
    res.status(500).json({ message: "Error fetching stats" });
  }
};  
