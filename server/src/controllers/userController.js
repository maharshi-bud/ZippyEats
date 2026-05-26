import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email addresses role");
    if (!user) return res.status(404).json({ message: "User not found" });
    console.log(user)
    res.json({
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        addresses: user.addresses,
        role: user.role ,
        // createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user.id }).populate({
      path: "items.menu_item_id",
      select: "name restaurant_id",
    });

    const itemCount = {};
    const restaurantCount = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const menuItem = item.menu_item_id;
        const itemName = menuItem?.name;
        if (itemName) itemCount[itemName] = (itemCount[itemName] || 0) + item.quantity;
        const restaurantId = menuItem?.restaurant_id;
        if (restaurantId) restaurantCount[restaurantId] = (restaurantCount[restaurantId] || 0) + item.quantity;
      });
    });

    const mostBoughtItem = Object.entries(itemCount).sort((a, b) => b[1] - a[1])[0];
    const favRestaurantEntry = Object.entries(restaurantCount).sort((a, b) => b[1] - a[1])[0];

    let favoriteRestaurant = null;
    if (favRestaurantEntry) {
      const restaurant = await Restaurant.findById(favRestaurantEntry[0]).select("name").lean();
      favoriteRestaurant = restaurant?.name || favRestaurantEntry[0];
    }

    res.json({
      data: {
        totalOrders: orders.length,
        mostBoughtItem: mostBoughtItem?.[0] || null,
        favoriteRestaurant,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching stats" });
  }
};

// ── Address management ──────────────────────────────────────────

// GET /users/addresses
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("addresses").lean();
    res.json({ success: true, data: user.addresses });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /users/addresses
export const addAddress = async (req, res) => {
  try {
    const { label, full_name, phone, address_line, city, state, pincode, is_default } = req.body;

    if (!full_name || !phone || !address_line) {
      return res.status(400).json({ message: "full_name, phone, and address_line are required" });
    }

    const user = await User.findById(req.user.id);

    // If this is the first address or is_default requested, clear other defaults
    if (is_default || user.addresses.length === 0) {
      user.addresses.forEach((a) => (a.is_default = false));
    }

    user.addresses.push({
      label: label || "Home",
      full_name,
      phone,
      address_line,
      city: city || "Ahmedabad",
      state: state || "Gujarat",
      pincode: pincode || "",
      country: "India",
      is_default: is_default || user.addresses.length === 0,
    });

    await user.save();

    res.status(201).json({ success: true, data: user.addresses });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /users/addresses/:addressId
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const updates = req.body;

    const user = await User.findById(req.user.id);
    const addr = user.addresses.id(addressId);
    if (!addr) return res.status(404).json({ message: "Address not found" });

    // If setting this one as default, clear others
    if (updates.is_default) {
      user.addresses.forEach((a) => (a.is_default = false));
    }

    Object.assign(addr, updates);
    await user.save();

    res.json({ success: true, data: user.addresses });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /users/addresses/:addressId
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);
    const addr = user.addresses.id(addressId);
    if (!addr) return res.status(404).json({ message: "Address not found" });

    addr.deleteOne();

    // If we deleted the default and there are still addresses, make first one default
    if (addr.is_default && user.addresses.length > 0) {
      user.addresses[0].is_default = true;
    }

    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /users/addresses/:addressId/default
export const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);

    user.addresses.forEach((a) => {
      a.is_default = a._id.toString() === addressId;
    });

    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── Upload profile pic ───────────────────────────────────
export async function uploadProfilePic(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    await User.findByIdAndUpdate(req.user.id, {
      profilePic: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
    });

    res.json({ success: true, message: "Profile picture updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── Ge;t profile pic ──────────────────────────────────────
export async function getProfilePic(req, res) {
  try {
    const user = await User.findById(req.user.id).select("profilePic");
    if (!user?.profilePic?.data) {
      return res.status(404).json({ message: "No profile picture" });
    }
    res.set("Content-Type", user.profilePic.contentType);
    res.send(user.profilePic.data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── Get coins balance ────────────────────────────────────
export async function getMyCoins(req, res) {
  try {
    const user = await User.findById(req.user.id).select("zipCoins");
    res.json({ success: true, data: { zipCoins: user?.zipCoins || 0 } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



export async function deleteProfilePic(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profilePic = null;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error("[User] deleteProfilePic:", err);
    res.status(500).json({ message: "Server error" });
  }
}