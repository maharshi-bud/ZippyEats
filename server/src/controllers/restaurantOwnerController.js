// server/src/controllers/restaurantOwnerController.js

import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import User from "../models/User.js";
import Review from "../models/Review.js";

import { updateOrderStatus } from "../services/orderEngine.js";

// ======================================================
// GET MY ORDERS
// ======================================================

export const getMyOrders =
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.id
        );

      const restaurantId =
        user.email;

      const allOrders =
        await Order.find()
          .sort({
            createdAt: -1,
          })
          .populate(
            "items.menu_item_id"
          );

      const restaurantOrders =
        allOrders.filter(
          (order) => {
            if (
              !order.items ||
              order.items.length === 0
            ) {
              return false;
            }

            return order.items.some(
              (item) => {
                return (
                  item.menu_item_id &&
                  item
                    .menu_item_id
                    .restaurant_id ===
                    restaurantId
                );
              }
            );
          }
        );

      res.json({
        success: true,
        data: restaurantOrders,
      });
    } catch (err) {
      console.log(err);

      res.status(500).json({
        success: false,
        message:
          err.message ||
          "Failed to fetch orders",
      });
    }
  };

// ======================================================
// UPDATE ORDER STATUS
// ======================================================

export const updateMyOrderStatus =
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.id
        );

      const restaurantId =
        user.email;

      const { id } =
        req.params;

      const { status } =
        req.body;

      const validStatuses =
        [
          "accepted",
          "preparing",
          "out_for_delivery",
          "delivered",
          "cancelled",
        ];

      if (
        !validStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid status",
        });
      }

      // =================================
      // FIND ORDER
      // =================================

      const order =
        await Order.findById(
          id
        ).populate(
          "items.menu_item_id"
        );

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      // =================================
      // CHECK RESTAURANT ACCESS
      // =================================
console.log(
  JSON.stringify(
    order.items,
    null,
    2
  )
);
      const belongsToRestaurant =
  order.items.some(
    (item) => {
      if (
        !item ||
        !item.menu_item_id
      ) {
        return false;
      }

      // populated object
      if (
        typeof item.menu_item_id ===
        "object"
      ) {
        return (
          item.menu_item_id
            .restaurant_id ===
          restaurantId
        );
      }

      return false;
    }
  );

      if (
        !belongsToRestaurant
      ) {
        return res.status(403).json({
          message:
            "Unauthorized",
        });
      }

      // =================================
      // UPDATE STATUS
      // =================================

     const updatedOrder =
        await updateOrderStatus(
          id,
          status,
          "restaurant"
        );

      res.json({
        success: true,
        order: updatedOrder,
      });    } catch (err) {
      console.log(err);

      res.status(500).json({
        success: false,
        message:
          err.message,
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
      const user =
        await User.findById(
          req.user.id
        );

      const restaurantId =
        user.email;

      const range =
        req.query.range || "daily";

      const now = new Date();

      // =================================
      // FETCH ALL ORDERS
      // =================================

      const allOrders =
        await Order.find().populate(
          "items.menu_item_id"
        );

      // =================================
      // FILTER ORDERS BY RESTAURANT
      // =================================

      const restaurantOrders =
        allOrders.filter(
          (order) => {
            if (
              !order.items ||
              order.items.length === 0
            ) {
              return false;
            }

            const firstItem =
              order.items[0];

            if (
              !firstItem.menu_item_id
            ) {
              return false;
            }

            return (
              firstItem
                .menu_item_id
                .restaurant_id ===
              restaurantId
            );
          }
        );

      // =================================
      // DATE FILTER
      // =================================

      let filteredOrders =
        restaurantOrders;

      if (range === "daily") {
        const start =
          new Date();

        start.setHours(
          0,
          0,
          0,
          0
        );

        filteredOrders =
          restaurantOrders.filter(
            (order) =>
              new Date(
                order.createdAt
              ) >= start
          );
      }

      if (range === "monthly") {
        const start =
          new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );

        filteredOrders =
          restaurantOrders.filter(
            (order) =>
              new Date(
                order.createdAt
              ) >= start
          );
      }

      // =================================
      // STATS
      // =================================

      const totalOrders =
        filteredOrders.length;

      const revenue =
        filteredOrders.reduce(
          (acc, order) =>
            acc +
            (order.total_amount ||
              0),
          0
        );

      const avgOrderAmount =
        totalOrders > 0
          ? Math.round(
              revenue /
                totalOrders
            )
          : 0;

      // =================================
      // BEST SELLER
      // =================================

      const itemMap = {};

      filteredOrders.forEach(
        (order) => {
          order.items.forEach(
            (item) => {
              if (
                !item.menu_item_id
              )
                return;

              const id =
                item.menu_item_id._id.toString();

              if (!itemMap[id]) {
                itemMap[id] = {
                  name:
                    item
                      .menu_item_id
                      .name,
                  quantity: 0,
                };
              }

              itemMap[id]
                .quantity +=
                item.quantity;
            }
          );
        }
      );

      let bestSeller =
        null;

      Object.values(
        itemMap
      ).forEach((item) => {
        if (
          !bestSeller ||
          item.quantity >
            bestSeller.quantity
        ) {
          bestSeller = item;
        }
      });

      // =================================
      // ORDER STATUS
      // =================================

      const statusCounts = {
        accepted: 0,
        preparing: 0,
        out_for_delivery: 0,
        delivered: 0,
        cancelled: 0,
      };

      filteredOrders.forEach(
        (order) => {
          if (
            statusCounts[
              order.status
            ] !== undefined
          ) {
            statusCounts[
              order.status
            ]++;
          }
        }
      );

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

      // =================================
      // REVENUE TREND
      // =================================

      const revenueMap = {};

      filteredOrders.forEach(
        (order) => {
          const date =
            new Date(
              order.createdAt
            );

          let key = "";

          if (
            range === "daily"
          ) {
            key = `${date.getHours()}:00`;
          }

          if (
            range === "monthly"
          ) {
            key = `Day ${date.getDate()}`;
          }

          if (
            range === "all"
          ) {
            key = `Month ${
              date.getMonth() + 1
            }`;
          }

          if (
            !revenueMap[key]
          ) {
            revenueMap[key] = 0;
          }

          revenueMap[key] +=
            order.total_amount ||
            0;
        }
      );

      const revenueTrend =
        Object.entries(
          revenueMap
        ).map(
          ([label, revenue]) => ({
            label,
            revenue,
          })
        );

      // =================================
      // PEAK HOURS
      // =================================

      const peakMap = {};

      filteredOrders.forEach(
        (order) => {
          const hour =
            new Date(
              order.createdAt
            ).getHours();

          const key = `${hour}:00`;

          if (!peakMap[key]) {
            peakMap[key] = 0;
          }

          peakMap[key]++;
        }
      );

      const formattedPeakHours =
        Object.entries(
          peakMap
        ).map(
          ([time, orders]) => ({
            time,
            orders,
          })
        );

      // =================================
      // RATINGS
      // =================================

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

      reviews.forEach(
        (review) => {
          ratingMap[
            review.rating
          ]++;
        }
      );

      const ratingsDistribution =
        [
          {
            stars: "5★",
            count:
              ratingMap[5],
          },
          {
            stars: "4★",
            count:
              ratingMap[4],
          },
          {
            stars: "3★",
            count:
              ratingMap[3],
          },
          {
            stars: "2★",
            count:
              ratingMap[2],
          },
          {
            stars: "1★",
            count:
              ratingMap[1],
          },
        ];

      const avgRating =
        reviews.length
          ? (
              reviews.reduce(
                (
                  acc,
                  review
                ) =>
                  acc +
                  review.rating,
                0
              ) /
              reviews.length
            ).toFixed(1)
          : 0;

      // =================================
      // RESPONSE
      // =================================

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
          err.message,
      });
    }
  };