"use client";

import { useEffect, useState } from "react";
import api from "../../lib/axios";

export default function ProfilePage() {
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, profileRes, statsRes] = await Promise.all([
          api.get("/orders/my"),
          api.get("/users/me"),
          api.get("/users/stats")
        ]);

        setOrders(ordersRes.data.data);
        setProfile(profileRes.data.data);
        setStats(statsRes.data.data);
      } catch (err) {
        console.error("Profile Error:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">

      {/* 🔥 HEADER */}
      <h1 className="text-2xl font-bold mb-2">👤 My Profile</h1>

      {profile && (
        <p className="text-slate-500 mb-6">
          {profile.name} • {profile.email}
        </p>
      )}

      {/* 🔥 STATS */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">

        <div className="bg-white p-5 rounded-xl shadow border">
          <p className="text-sm text-slate-500">Total Orders</p>
          <h2 className="text-xl font-bold">
            {stats?.totalOrders || 0}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border">
          <p className="text-sm text-slate-500">Most Bought Item</p>
          <h2 className="text-lg font-semibold">
            {stats?.mostBoughtItem || "—"}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border">
          <p className="text-sm text-slate-500">Favorite Restaurant</p>
          <h2 className="text-lg font-semibold">
            {stats?.favoriteRestaurant || "-"}
          </h2>
        </div>

      </div>

      {/* 🔥 ORDER HISTORY */}
      <h2 className="text-lg font-semibold mb-4">
        🧾 Order History
      </h2>

      <div className="space-y-4">

        {orders.length === 0 ? (
          <p className="text-slate-500">No orders yet</p>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="bg-white p-5 rounded-xl shadow border"
            >
              <div className="flex justify-between mb-3">
                <span className="text-sm text-slate-500">
                  Order ID: {order._id}
                </span>

                <span className="text-sm font-semibold capitalize text-green-600">
                  {order.status}
                </span>
              </div>

              <div className="text-sm text-slate-600">
                {order.items.map((item) => (
                    
                    

                  <div key={item._id}>
                    {item.menu_item_id?.name} × {item.quantity}
                  </div>
                ))}
              </div>

              <div className="mt-3 font-semibold">
                ₹{order.total_amount}
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
}
