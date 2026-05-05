"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import Card from "../../../components/ui/Card";
import Loader from "../../../components/ui/Loader";

const safe = (v: any) => Number(v) || 0;

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState("totalRevenue");
  const [order, setOrder] = useState("desc");
  const [activeFilter, setActiveFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/admin/stats/restaurants-list", {
          params: { sortBy, order, active: activeFilter },
        });

        setRestaurants(res.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load restaurants");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sortBy, order, activeFilter]);

  // ✅ HANDLE STATES FIRST
  if (loading) return <Loader />;

  if (error)
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
        {error}
      </div>
    );

  // ✅ Correct aggregations
  const totalRevenue = restaurants.reduce(
    (a, r) => a + safe(r.totalRevenue),
    0
  );

  const totalItems = restaurants.reduce(
    (a, r) => a + safe(r.totalItemsSold),
    0
  );

  const activeCount = restaurants.filter((r) => r.isActive).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Restaurants</h1>

      {/* CARDS */}
      <div className="grid grid-cols-3 gap-6">
        <Card title="Total Revenue" value={`₹${totalRevenue}`} />
        <Card title="Items Sold" value={totalItems} />
        <Card title="Active Restaurants" value={activeCount} />
      </div>

      {/* FILTERS */}
      <div className="flex gap-4">
        <select
          className="border px-3 py-2 rounded-lg"
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="totalRevenue">Revenue</option>
          <option value="totalItemsSold">Items Sold</option>
        </select>

        <select
          className="border px-3 py-2 rounded-lg"
          onChange={(e) => setOrder(e.target.value)}
        >
          <option value="desc">High → Low</option>
          <option value="asc">Low → High</option>
        </select>

        <select
          className="border px-3 py-2 rounded-lg"
          onChange={(e) => setActiveFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="p-3 text-left">Restaurant</th>
              <th className="p-3 text-left">Revenue</th>
              <th className="p-3 text-left">Items Sold</th>
              <th className="p-3 text-left">Avg Item</th>
              <th className="p-3 text-left">Top Dish</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {restaurants.map((r) => (
              <tr key={r._id} className="border-t hover:bg-emerald-50">
                <td className="p-3 font-medium">{r.name}</td>

                <td className="p-3 text-emerald-600 font-semibold">
                  ₹{safe(r.totalRevenue)}
                </td>

                <td className="p-3">{safe(r.totalItemsSold)}</td>

                <td className="p-3">₹{safe(r.avgItemValue)}</td>

                <td className="p-3">{r.topDish || "-"}</td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      r.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {restaurants.length === 0 && (
          <div className="p-6 text-center text-zinc-500">
            No restaurants found
          </div>
        )}
      </div>
    </div>
  );
}