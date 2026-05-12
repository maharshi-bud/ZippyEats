// server/src/controllers/restaurantOwnerController.js

import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import User from "../models/User.js";
import Review from "../models/Review.js";

import { updateOrderStatus } from "../services/orderEngine.js";

// ======================================================
// GET MY ORDERS
// ======================================================

export const getMyOrders = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant_id;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "No restaurant linked to this account",
      });
    }

    const orders = await Order.find({
      restaurant_id: restaurantId,
    })
      .populate("user_id", "name email")
      .populate("items.menu_item_id")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================================================
// UPDATE ORDER STATUS
// ======================================================

export const updateMyOrderStatus = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant_id;

    const { id } = req.params;

    const { status } = req.body;

    const validStatuses = [
      "accepted",
      "preparing",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.restaurant_id !== restaurantId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const updated = await updateOrderStatus(
      id,
      status,
      "restaurant"
    );

    res.json({
      success: true,
      order: updated,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// ======================================================
// GET MENU
// ======================================================

export const getMyMenu = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant_id;

    const items = await MenuItem.find({
      restaurant_id: restaurantId,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================================================
// CREATE MENU ITEM
// ======================================================

export const createMenuItem = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant_id;

    const {
      name,
      price,
      description,
      cuisine,
      veg,
      image,
    } = req.body;

    if (!name || !price || !cuisine) {
      return res.status(400).json({
        success: false,
        message:
          "name, price and cuisine are required",
      });
    }

    const item = await MenuItem.create({
      restaurant_id: restaurantId,
      name,
      price,
      description: description || "",
      cuisine,
      veg: veg ?? true,
      image: image || "",
    });

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (err) {
    console.log(err);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// UPDATE MENU ITEM
// ======================================================

export const updateMenuItem = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant_id;

    const { itemId } = req.params;

    const item = await MenuItem.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (item.restaurant_id !== restaurantId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const allowedFields = [
      "name",
      "price",
      "description",
      "cuisine",
      "veg",
      "image",
      "rating",
      "totalReviews",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    await item.save();

    res.json({
      success: true,
      data: item,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// DELETE MENU ITEM
// ======================================================

export const deleteMenuItem = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant_id;

    const { itemId } = req.params;

    const item = await MenuItem.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (item.restaurant_id !== restaurantId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: "Menu item deleted",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================================================
// RESTAURANT DASHBOARD
// ======================================================

export const getRestaurantDashboard =
  async (req, res) => {
    try {
      const user = await User.findById(
        req.user.id
      );

      const restaurantId = user.email;

      const range =
        req.query.range || "daily";

      const now = new Date();

      let dateFilter = {};

      // =====================================
      // DATE FILTER
      // =====================================

      if (range === "daily") {
        const start = new Date();

        start.setHours(0, 0, 0, 0);

        dateFilter = {
          createdAt: {
            $gte: start,
          },
        };
      }

      if (range === "monthly") {
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

        dateFilter = {
          createdAt: {
            $gte: start,
          },
        };
      }

      // =====================================
      // FETCH ORDERS
      // =====================================

      const orders = await Order.find({
        restaurant_id: restaurantId,
        ...dateFilter,
      }).populate("items.menu_item_id");

      // =====================================
      // BASIC STATS
      // =====================================

      const totalOrders = orders.length;

      const revenue = orders.reduce(
        (acc, order) =>
          acc + (order.total_amount || 0),
        0
      );

      const avgOrderAmount =
        totalOrders > 0
          ? Math.round(
              revenue / totalOrders
            )
          : 0;

      // =====================================
      // BEST SELLER
      // =====================================

      const itemMap = {};

      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (!item.menu_item_id)
            return;

          const id =
            item.menu_item_id._id.toString();

          if (!itemMap[id]) {
            itemMap[id] = {
              name:
                item.menu_item_id.name,
              quantity: 0,
            };
          }

          itemMap[id].quantity +=
            item.quantity;
        });
      });

      let bestSeller = null;

      Object.values(itemMap).forEach(
        (item) => {
          if (
            !bestSeller ||
            item.quantity >
              bestSeller.quantity
          ) {
            bestSeller = item;
          }
        }
      );

      // =====================================
      // ORDER STATUS
      // =====================================

      const statusCounts = {
        accepted: 0,
        preparing: 0,
        out_for_delivery: 0,
        delivered: 0,
        cancelled: 0,
      };

      orders.forEach((order) => {
        if (
          statusCounts[order.status] !==
          undefined
        ) {
          statusCounts[
            order.status
          ]++;
        }
      });

      const orderStatus = [
        {
          name: "Accepted",
          value:
            statusCounts.accepted,
        },
        {
          name: "Preparing",
          value:
            statusCounts.preparing,
        },
        {
          name: "Out",
          value:
            statusCounts.out_for_delivery,
        },
        {
          name: "Delivered",
          value:
            statusCounts.delivered,
        },
        {
          name: "Cancelled",
          value:
            statusCounts.cancelled,
        },
      ];

      // =====================================
      // REVENUE TREND
      // =====================================

      let revenueTrend = [];

      // DAILY → HOURS

      if (range === "daily") {
        revenueTrend =
          await Order.aggregate([
            {
              $match: {
                restaurant_id:
                  restaurantId,
                ...dateFilter,
              },
            },
            {
              $group: {
                _id: {
                  $hour:
                    "$createdAt",
                },
                revenue: {
                  $sum:
                    "$total_amount",
                },
              },
            },
            {
              $sort: { _id: 1 },
            },
          ]);

        revenueTrend = revenueTrend.map(
          (item) => ({
            label: `${item._id}:00`,
            revenue:
              item.revenue,
          })
        );
      }

      // MONTHLY → DAYS

      if (range === "monthly") {
        revenueTrend =
          await Order.aggregate([
            {
              $match: {
                restaurant_id:
                  restaurantId,
                ...dateFilter,
              },
            },
            {
              $group: {
                _id: {
                  $dayOfMonth:
                    "$createdAt",
                },
                revenue: {
                  $sum:
                    "$total_amount",
                },
              },
            },
            {
              $sort: { _id: 1 },
            },
          ]);

        revenueTrend = revenueTrend.map(
          (item) => ({
            label: `Day ${item._id}`,
            revenue:
              item.revenue,
          })
        );
      }

      // ALL → MONTHS

      if (range === "all") {
        revenueTrend =
          await Order.aggregate([
            {
              $match: {
                restaurant_id:
                  restaurantId,
              },
            },
            {
              $group: {
                _id: {
                  $month:
                    "$createdAt",
                },
                revenue: {
                  $sum:
                    "$total_amount",
                },
              },
            },
            {
              $sort: { _id: 1 },
            },
          ]);

        revenueTrend = revenueTrend.map(
          (item) => ({
            label: `Month ${item._id}`,
            revenue:
              item.revenue,
          })
        );
      }

      // =====================================
      // PEAK HOURS
      // =====================================

      const peakHours =
        await Order.aggregate([
          {
            $match: {
              restaurant_id:
                restaurantId,
              ...dateFilter,
            },
          },
          {
            $group: {
              _id: {
                $hour:
                  "$createdAt",
              },
              orders: {
                $sum: 1,
              },
            },
          },
          {
            $sort: { _id: 1 },
          },
        ]);

      const formattedPeakHours =
        peakHours.map((item) => ({
          time: `${item._id}:00`,
          orders: item.orders,
        }));

      // =====================================
      // RATINGS
      // =====================================

      const reviews =
        await Review.find({
          restaurant_id:
            restaurantId,
        });

      const ratingMap = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      reviews.forEach((review) => {
        ratingMap[review.rating]++;
      });

      const ratingsDistribution = [
        {
          stars: "5★",
          count: ratingMap[5],
        },
        {
          stars: "4★",
          count: ratingMap[4],
        },
        {
          stars: "3★",
          count: ratingMap[3],
        },
        {
          stars: "2★",
          count: ratingMap[2],
        },
        {
          stars: "1★",
          count: ratingMap[1],
        },
      ];

      const avgRating =
        reviews.length
          ? (
              reviews.reduce(
                (acc, review) =>
                  acc +
                  review.rating,
                0
              ) / reviews.length
            ).toFixed(1)
          : 0;

      // =====================================
      // RESPONSE
      // =====================================

      res.json({
        success: true,

        data: {
          stats: {
            totalOrders,
            revenue,
            avgOrderAmount,
            bestSeller,
            avgRating,
          },

          orderStatus,

          revenueTrend,

          peakHours:
            formattedPeakHours,

          ratingsDistribution,
        },
      });
    } catch (err) {
      console.log(err);

      res.status(500).json({
        success: false,
        message:
          err.message ||
          "Dashboard fetch failed",
      });
    }
  };