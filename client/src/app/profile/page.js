"use client";

import { useEffect, useState } from "react";
import api from "../../lib/axios";
import { useRouter } from "next/navigation";
import { startRouteLoader } from "../../lib/routeLoading";

export default function ProfilePage() {
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, profileRes, statsRes] = await Promise.all([
          api.get("/orders/my"),
          api.get("/users/me"),
          api.get("/users/stats"),
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
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* 🔥 HEADER */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 mb-10 shadow">
          <div className="flex items-center gap-5 justify-center">

            {/* Avatar */}
            <div className="rounded-full bg-green-500 text-white text-2xl font-bold shadow-lg px-4 py-[8px] text-center">
              {profile?.name?.[0] || "U"}
            </div>

            {/* Info */}
            <div>
              <h1 className="text-2xl font-semibold text-right">
                {profile?.name || "User"}
              </h1>

              <p className="text-sm text-slate-300 text-right">
                {profile?.email}
              </p>
            </div>

          </div>
        </div>

        {/* 🔥 STATS */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition">
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              Total Orders
            </p>
            <h2 className="text-2xl font-bold mt-2 text-slate-900">
              {stats?.totalOrders || 0}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition">
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              Most Bought
            </p>
            <h2 className="text-lg font-semibold mt-2 text-slate-800">
              {stats?.mostBoughtItem || "—"}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition">
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              Favorite Restaurant
            </p>
            <h2 className="text-lg font-semibold mt-2 text-slate-800">
              {stats?.favoriteRestaurant || "—"}
            </h2>
          </div>
        </div>

        {/* 🔥 ORDER HISTORY */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">
             Order History
          </h2>
        </div>

        <div className="space-y-5">

          {orders.length === 0 ? (
            <div className="bg-white p-8 rounded-xl text-center text-slate-400 shadow">
              No orders yet
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                onClick={() => {
                  startRouteLoader();
                  router.push(`/orders/${order._id}`);
                }}
                className="bg-white rounded-2xl shadow hover:shadow-md transition overflow-hidden cursor-pointer"
              >

                {/* HEADER */}
                <div className="flex justify-between items-center px-5 py-3 border-b bg-slate-50">
                  <span className="text-xs text-slate-500">
                    Order ID: {order._id.slice(-8)}
                  </span>

                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      order.status === "delivered"
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* BODY */}
                <div className="p-5">

                  {/* ITEMS */}
                  <div className="space-y-2 text-sm text-slate-700">
                    {order.items.map((item) => (
                      <div
                        key={item._id}
                        className="flex justify-between"
                      >
                        <span>
                          {item.menu_item_id?.name}
                        </span>
                        <span className="text-slate-500">
                          × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* FOOTER */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t">

                    <span className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>

                    <span className="text-lg font-bold text-slate-900">
                      ₹{order.total_amount}
                    </span>

                  </div>

                  {/* 🔥 CTA BUTTON */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRouteLoader();
                        router.push(`/orders/${order._id}`);
                      }}
                      className="text-sm px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition"
                    >
                      {order.status === "delivered"
                        ? "View Details →"
                        : "Track Order →"}
                    </button>
                  </div>

                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}
