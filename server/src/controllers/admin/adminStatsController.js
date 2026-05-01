// server/src/controllers/admin/adminStatsController.js

import Order from "../../models/Order.js";
import User from "../../models/User.js";

export const overview = async (req, res) => {
  const revenueAgg = await Order.aggregate([
    { $group: { _id: null, total: { $sum: "$total_amount" } } },
  ]);

  const totalOrders = await Order.countDocuments();

  const newUsers = await User.countDocuments({
    createdAt: {
      $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  const avgOrder = await Order.aggregate([
    { $group: { _id: null, avg: { $avg: "$total_amount" } } },
  ]);

  res.json({
    revenue: revenueAgg[0]?.total || 0,
    orders: totalOrders,
    newUsers,
    avgOrder: avgOrder[0]?.avg || 0,
  });
};

export const revenueChart = async (req, res) => {
  const data = await Order.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        total: { $sum: "$total_amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json(data);
};

export const ordersChart = async (req, res) => {
  const data = await Order.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json(data);
};

export const orderStatus = async (req, res) => {
  const data = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        value: { $sum: 1 },
      },
    },
  ]);

  res.json(data);
};



export const topRestaurants = async (req, res) => {
  const data = await Order.aggregate([
    { $unwind: "$items" },
    {
      $lookup: {
        from: "menuitems",
        localField: "items.menu_item_id",
        foreignField: "_id",
        as: "menuItem",
      },
    },
    { $unwind: "$menuItem" },
    {
      $lookup: {
        from: "restaurants",
        localField: "menuItem.restaurant_id",
        foreignField: "_id",
        as: "restaurant",
      },
    },
    { $unwind: "$restaurant" },
    {
      $group: {
        _id: "$restaurant._id",
        name: { $first: "$restaurant.name" },
        total: { $sum: "$total_amount" },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: "$name",
        total: 1,
      },
    },
  ]);

  res.json(data);
};

export const topItems = async (req, res) => {
  const data = await Order.aggregate([
    { $unwind: "$items" },
    {
      $lookup: {
        from: "menuitems",
        localField: "items.menu_item_id",
        foreignField: "_id",
        as: "menuItem",
      },
    },
    { $unwind: "$menuItem" },
    {
      $group: {
        _id: "$menuItem._id",
        name: { $first: "$menuItem.name" },
        total: { $sum: "$items.quantity" },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: "$name",
        total: 1,
      },
    },
  ]);

  res.json(data);
};

export const userGrowth = async (req, res) => {
  const data = await User.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json(data);
};
