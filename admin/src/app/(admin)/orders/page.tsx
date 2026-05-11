"use client";

import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { useRouter } from "next/navigation";

import api from "../../../lib/api";
import Card from "../../../components/ui/Card";
import Loader from "../../../components/ui/Loader";

type ApiErrorBody = {
  message?: string;
};

type OrderStats = {
  total: number;
  placed: number;
  delivered: number;
  cancelled: number;
  accepted: number;
  preparing: number;
  out_for_delivery: number;
};

type OrderRow = {
  _id: string;
  user_id?: {
    name?: string;
  };
  restaurant?: {
    name?: string;
  };
  status: string;
  total_amount: number;
  createdAt: string;
};

export default function OrdersPage() {
  const router = useRouter();

  const [stats, setStats] = useState<OrderStats | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("desc");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const [selectedStatus, setSelectedStatus] = useState("");
const [updating, setUpdating] = useState(false);

  const limit = 10;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      // setSelectedStatus(data.status);
      const statsRes = await api.get("/admin/stats/orders-summary");

      const ordersRes = await api.get("/admin/stats/get-orderData", {
        params: {
          status: status || undefined,
          sort,
          page,
          limit,
        },
      });

      setStats(statsRes.data);

      setOrders(ordersRes.data.orders || []);
      setTotal(ordersRes.data.total || 0);
    } catch (err: unknown) {
      const apiError = err as AxiosError<ApiErrorBody>;

      const message =
        apiError.response?.data?.message ||
        (err instanceof Error
          ? err.message
          : "Failed to load orders");

      setError(message);

      setStats({
        total: 0,
        placed: 0,
        delivered: 0,
        cancelled: 0,
        accepted: 0,
        preparing: 0,
        out_for_delivery: 0,
      });

      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [status, sort, page]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center pt-[30vh]">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-zinc-900">
          Orders
        </h1>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <h1 className="text-2xl font-bold text-zinc-950">
        Orders
      </h1>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <Card title="Total Orders" value={stats?.total || 0} />

        <Card
          title="In Process"
          value={
            (stats?.placed ?? 0) +
            (stats?.accepted ?? 0) +
            (stats?.preparing ?? 0) +
            (stats?.out_for_delivery ?? 0)
          }
        />

        <Card
          title="Delivered"
          value={stats?.delivered || 0}
        />

        <Card
          title="Cancelled"
          value={stats?.cancelled || 0}
        />
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-4">
        <select
          className="border border-zinc-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All Status</option>
          <option value="placed">Placed</option>
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="out_for_delivery">
            Out for delivery
          </option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          className="border border-zinc-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Restaurant</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => (
              <tr
                key={o._id}
                onClick={() =>
                  router.push(`/order/${o._id}`)
                }
                className="border-t hover:bg-zinc-50 cursor-pointer transition"
              >
                <td className="p-3 font-medium">
                  #{o._id.slice(-6)}
                </td>

                <td className="p-3">
                  {o.user_id?.name || "-"}
                </td>

                <td className="p-3">
                  {o.restaurant?.name || "-"}
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      o.status === "delivered"
                        ? "bg-emerald-100 text-emerald-700"
                        : o.status === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : o.status === "out_for_delivery"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {o.status
                      ?.replaceAll("_", " ")
                      .replace(
                        /^\w/,
                        (c) => c.toUpperCase()
                      )}
                  </span>
                </td>

                <td className="p-3 font-semibold text-emerald-600">
                  ₹{o.total_amount}
                </td>

                <td className="p-3 text-zinc-500">
                  {new Date(
                    o.createdAt
                  ).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="p-6 text-center text-zinc-500">
            No orders found
          </div>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-zinc-500">
          Page {page} of{" "}
          {Math.ceil(total / limit) || 1}
        </p>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() =>
              setPage((prev) => prev - 1)
            }
            className="px-3 py-1 border rounded hover:bg-zinc-100 disabled:opacity-50"
          >
            Prev
          </button>

          <button
            disabled={page >= total / limit}
            onClick={() =>
              setPage((prev) => prev + 1)
            }
            className="px-3 py-1 border rounded hover:bg-zinc-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}