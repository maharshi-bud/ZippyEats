"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import Card from "../../../components/ui/Card";
import Loader from "../../../components/ui/Loader";

const safe = (v: any) => Number(v) || 0;

export default function UsersPage() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  const [sortBy, setSortBy] = useState("totalSpent");
  const [order, setOrder] = useState("desc");
  const [activeFilter, setActiveFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [statsRes, usersRes] = await Promise.all([
          api.get("/admin/stats/users-summary"),
          api.get("/admin/stats/users-list", {
            params: { sortBy, order, active: activeFilter },
          }),
        ]);

        setStats(statsRes.data);
        setUsers(usersRes.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sortBy, order, activeFilter]);

  // ✅ HANDLE STATES FIRST
  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader />
      </div>
    );

  if (error)
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
        {error}
      </div>
    );

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Users</h1>

      {/* CARDS */}
      <div className="grid grid-cols-3 gap-6">
        <Card title="Total Users" value={safe(stats.totalUsers)} />
        <Card title="New (7 days)" value={safe(stats.newUsers)} />
        <Card title="Avg Ticket" value={`₹${safe(stats.avgTicket)}`} />
      </div>

      {/* FILTERS */}
      <div className="flex gap-4">
        <select
          className="border px-3 py-2 rounded-lg"
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="totalSpent">Total Spent</option>
          <option value="avgTicket">Avg Ticket</option>
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
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Total Spent</th>
              <th className="p-3 text-left">Avg Ticket</th>
              <th className="p-3 text-left">Fav Restaurant</th>
              <th className="p-3 text-left">Fav Dish</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t hover:bg-emerald-50">
                <td className="p-3 font-medium">{u.name}</td>

                <td className="p-3 text-zinc-500">{u.email}</td>

                <td className="p-3 text-emerald-600 font-semibold">
                  ₹{safe(u.totalSpent)}
                </td>

                <td className="p-3">₹{safe(u.avgTicket)}</td>

                <td className="p-3">{u.favRestaurant || "-"}</td>

                <td className="p-3">{u.favDish || "-"}</td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      u.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-6 text-center text-zinc-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}