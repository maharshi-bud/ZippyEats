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
  try {
    const data = await Order.aggregate([
      // 1. unwind items
      { $unwind: "$items" },

      // 2. join menu item
      {
        $lookup: {
          from: "menuitems",
          localField: "items.menu_item_id",
          foreignField: "_id",
          as: "menuItem",
        },
      },
      {
        $unwind: {
          path: "$menuItem",
          preserveNullAndEmptyArrays: false,
        },
      },

      // 3. join restaurant
      {
        $lookup: {
          from: "restaurants",
          localField: "menuItem.restaurant_id",
          foreignField: "_id",
          as: "restaurant",
        },
      },
      { $unwind: "$restaurant" },

      // 4. safe fields
      {
        $addFields: {
          qty: { $ifNull: ["$items.quantity", 0] },
          price: { $ifNull: ["$menuItem.price", 0] },
        },
      },

      // 5. correct revenue
      {
        $addFields: {
          itemRevenue: { $multiply: ["$qty", "$price"] },
        },
      },

      // 6. group by restaurant
      {
        $group: {
          _id: "$restaurant._id",
          name: { $first: "$restaurant.name" },

          total: { $sum: "$itemRevenue" }, // ✅ FIXED
          itemsSold: { $sum: "$qty" },
        },
      },

      // 7. sort + limit
      { $sort: { total: -1 } },
      { $limit: 5 },

      // 8. final shape
      {
        $project: {
          _id: "$name",
          total: { $round: ["$total", 0] },
          itemsSold: 1,
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    console.error("Top restaurants error:", err);
    res.status(500).json({ message: "Failed to fetch top restaurants" });
  }
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


// server/src/controllers/admin/adminStatsController.js

export const orderStats = async (req, res) => {
  const data = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const total = await Order.countDocuments();

  const result = {
    total,
    placed: 0,
    delivered: 0,
    cancelled: 0,
  };

  data.forEach((d) => {
    result[d._id] = d.count;
  });

  res.json(result);
};

export const getOrderData = async (req, res) => {
  try {
    const { status, sort = "desc" } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const query = {};
    if (status) query.status = status;

    const sortDirection = sort === "asc" ? 1 : -1;

    const [result] = await Order.aggregate([
      { $match: query },
      {
        $facet: {
          orders: [
            { $sort: { createdAt: sortDirection } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user",
              },
            },
            {
              $lookup: {
                from: "menuitems",
                localField: "items.menu_item_id",
                foreignField: "_id",
                as: "menuItems",
              },
            },
            {
              $lookup: {
                from: "restaurants",
                localField: "menuItems.restaurant_id",
                foreignField: "_id",
                as: "restaurants",
              },
            },
            {
              $addFields: {
                user_id: {
                  $let: {
                    vars: { user: { $first: "$user" } },
                    in: {
                      _id: "$$user._id",
                      name: "$$user.name",
                    },
                  },
                },
                restaurant: {
                  $let: {
                    vars: { restaurant: { $first: "$restaurants" } },
                    in: {
                      _id: "$$restaurant._id",
                      name: "$$restaurant.name",
                    },
                  },
                },
              },
            },
            {
              $project: {
                user: 0,
                menuItems: 0,
                restaurants: 0,
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);

    res.json({
      orders: result?.orders || [],
      total: result?.total?.[0]?.count || 0,
    });
  } catch (err) {
    console.error("GET ADMIN ORDERS ERROR:", err.message);

    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};




// server/src/controllers/admin/adminStatsController.js

export const usersSummary = async (req, res) => {
  const totalUsers = await User.countDocuments();

  const newUsers = await User.countDocuments({
    createdAt: {
      $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  const orders = await Order.find();

  const totalSpent = orders.reduce((acc, o) => acc + o.total_amount, 0);
  const avgTicket = orders.length ? totalSpent / orders.length : 0;

  res.json({
    totalUsers,
    newUsers,
    avgTicket: Math.round(avgTicket),
  });
};


// server/src/controllers/admin/adminStatsController.js

export const usersList = async (req, res) => {
  try {
    const { sortBy = "totalSpent", order = "desc", active } = req.query;

    const data = await User.aggregate([
      // 1. Join orders
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "user_id",
          as: "orders",
        },
      },

      // 2. Active users (last 7 days)
      {
        $addFields: {
          recentOrders: {
            $filter: {
              input: "$orders",
              as: "o",
              cond: {
                $gte: [
                  "$$o.createdAt",
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                ],
              },
            },
          },
        },
      },

      {
        $addFields: {
          isActive: {
            $cond: [{ $gt: [{ $size: "$recentOrders" }, 0] }, true, false],
          },
        },
      },

      // 3. Flatten orders
      { $unwind: { path: "$orders", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$orders.items", preserveNullAndEmptyArrays: true } },

      // 4. Join menu items
      {
        $lookup: {
          from: "menuitems",
          localField: "orders.items.menu_item_id",
          foreignField: "_id",
          as: "menuItem",
        },
      },
      { $unwind: { path: "$menuItem", preserveNullAndEmptyArrays: true } },

      // 5. Join restaurants
      {
        $lookup: {
          from: "restaurants",
          localField: "menuItem.restaurant_id",
          foreignField: "_id",
          as: "restaurant",
        },
      },
      { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: true } },

      // 6. Group user data
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          email: { $first: "$email" },
          isActive: { $first: "$isActive" },

          totalSpent: { $sum: "$orders.total_amount" },
          avgTicket: { $avg: "$orders.total_amount" },

          restaurantStats: {
            $push: {
              name: "$restaurant.name",
              amount: "$orders.total_amount",
            },
          },

          dishStats: {
            $push: {
              name: "$menuItem.name",
              qty: "$orders.items.quantity",
            },
          },
        },
      },

      // 7. Favorite restaurant
      {
        $addFields: {
          favRestaurant: {
            $let: {
              vars: {
                sorted: {
                  $sortArray: {
                    input: "$restaurantStats",
                    sortBy: { amount: -1 },
                  },
                },
              },
              in: { $arrayElemAt: ["$$sorted.name", 0] },
            },
          },
        },
      },

      // 8. Favorite dish (correct logic)
      {
        $addFields: {
          favDish: {
            $let: {
              vars: {
                sorted: {
                  $sortArray: {
                    input: "$dishStats",
                    sortBy: { qty: -1 },
                  },
                },
              },
              in: { $arrayElemAt: ["$$sorted.name", 0] },
            },
          },
        },
      },

      // 9. Filter (active/inactive)
      ...(active === "true"
        ? [{ $match: { isActive: true } }]
        : active === "false"
        ? [{ $match: { isActive: false } }]
        : []),

      // 10. Sorting
      {
        $sort: {
          [sortBy]: order === "asc" ? 1 : -1,
        },
      },

      // 11. Final output
      {
        $project: {
          name: 1,
          email: 1,
          totalSpent: 1,
          avgTicket: { $round: ["$avgTicket", 0] },
          favRestaurant: 1,
          favDish: 1,
          isActive: 1,
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};




export const restaurantsList = async (req, res) => {
  try {
    const { sortBy = "totalRevenue", order = "desc", active } = req.query;

    const data = await Order.aggregate([
      // 1. unwind items
      { $unwind: "$items" },

      // 2. join menu item
      {
        $lookup: {
          from: "menuitems",
          localField: "items.menu_item_id",
          foreignField: "_id",
          as: "menuItem",
        },
      },
      {
        $unwind: {
          path: "$menuItem",
          preserveNullAndEmptyArrays: false,
        },
      },

      // 3. join restaurant
      {
        $lookup: {
          from: "restaurants",
          localField: "menuItem.restaurant_id",
          foreignField: "_id",
          as: "restaurant",
        },
      },
      { $unwind: "$restaurant" },

      // 4. safe item revenue
      {
        $addFields: {
          qty: { $ifNull: ["$items.quantity", 0] },
          price: { $ifNull: ["$menuItem.price", 0] },
        },
      },
      {
        $addFields: {
          itemRevenue: { $multiply: ["$qty", "$price"] },
        },
      },

      // 5. group by restaurant + dish
      {
        $group: {
          _id: {
            restaurantId: "$restaurant._id",
            dish: "$menuItem.name",
          },
          name: { $first: "$restaurant.name" },

          totalRevenue: { $sum: "$itemRevenue" },
          totalItemsSold: { $sum: "$qty" },

          lastOrder: { $max: "$createdAt" },
        },
      },

      // 6. regroup to restaurant level
      {
        $group: {
          _id: "$_id.restaurantId",
          name: { $first: "$name" },

          totalRevenue: { $sum: "$totalRevenue" },
          totalItemsSold: { $sum: "$totalItemsSold" },

          dishes: {
            $push: {
              name: "$_id.dish",
              qty: "$totalItemsSold",
            },
          },

          lastOrder: { $max: "$lastOrder" },
        },
      },

      // 7. compute top dish WITHOUT $sortArray
      {
        $addFields: {
          topDish: {
            $reduce: {
              input: "$dishes",
              initialValue: { name: "", qty: 0 },
              in: {
                $cond: [
                  { $gt: ["$$this.qty", "$$value.qty"] },
                  "$$this",
                  "$$value",
                ],
              },
            },
          },
        },
      },

      // 8. extract only name
      {
        $addFields: {
          topDish: "$topDish.name",
        },
      },

      // 9. active logic
      {
        $addFields: {
          isActive: {
            $gte: [
              "$lastOrder",
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            ],
          },
        },
      },

      // 10. filter
      ...(active === "true"
        ? [{ $match: { isActive: true } }]
        : active === "false"
        ? [{ $match: { isActive: false } }]
        : []),

      // 11. sort
      {
        $sort: {
          [sortBy]: order === "asc" ? 1 : -1,
        },
      },

      // 12. final shape
      {
        $project: {
          name: 1,
          totalRevenue: { $round: ["$totalRevenue", 0] },
          totalItemsSold: 1,
          avgItemValue: {
            $round: [
              {
                $cond: [
                  { $eq: ["$totalItemsSold", 0] },
                  0,
                  { $divide: ["$totalRevenue", "$totalItemsSold"] },
                ],
              },
              0,
            ],
          },
          topDish: 1,
          isActive: 1,
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    console.error("Restaurant error:", err);
    res.status(500).json({ message: "Failed to fetch restaurants" });
  }
};