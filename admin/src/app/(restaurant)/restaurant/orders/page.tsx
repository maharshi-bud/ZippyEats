"use client";

import { useEffect, useState } from "react";

import api from "../../../../lib/api";

import {
  Clock3,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";

const statusColors: any = {
  accepted:
    "bg-blue-100 text-blue-700 border-blue-200",

  preparing:
    "bg-yellow-100 text-yellow-700 border-yellow-200",

  out_for_delivery:
    "bg-purple-100 text-purple-700 border-purple-200",

  delivered:
    "bg-green-100 text-green-700 border-green-200",

  cancelled:
    "bg-red-100 text-red-700 border-red-200",
};

export default function OrdersPage() {
  const [orders, setOrders] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showCompleted, setShowCompleted] =
    useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const res = await api.get(
        "/restaurant-owner/orders"
      );

      setOrders(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (
    orderId: string,
    status: string
  ) => {
    try {
      await api.patch(
        `/restaurant-owner/orders/${orderId}/status`,
        {
          status,
        }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status,
              }
            : order
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  const ongoingOrders =
    orders.filter(
      (o) =>
        o.status !==
          "delivered" &&
        o.status !==
          "cancelled"
    );

  const completedOrders =
    orders.filter(
      (o) =>
        o.status ===
          "delivered" ||
        o.status ===
          "cancelled"
    );

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-2xl font-semibold">
        Loading Orders...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}

      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Orders Panel
        </h1>

        <p className="mt-2 text-gray-500">
          Manage and track restaurant
          orders
        </p>
      </div>

      {/* ONGOING */}

      <div>
        <div className="mb-5 flex items-center gap-3">
          <Clock3 className="text-orange-500" />

          <h2 className="text-2xl font-semibold text-gray-900">
            Ongoing Orders
          </h2>

          <div className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-600">
            {
              ongoingOrders.length
            }
          </div>
        </div>

        <div className="grid gap-4">
          {ongoingOrders.length ===
          0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-gray-500 shadow-sm">
              No ongoing orders
            </div>
          ) : (
            ongoingOrders.map(
              (order) => (
                <div
                  key={order._id}
                  className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    {/* LEFT */}

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900">
                          Order #
                          {String(
                            order._id
                          ).slice(
                            -6
                          )}
                        </h2>

                        <span
                          className={`rounded-full border px-3 py-1 text-sm font-medium ${
                            statusColors[
                              order
                                .status
                            ]
                          }`}
                        >
                          {
                            order.status
                          }
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500">
                        <p>
                          Customer:
                          <span className="ml-2 font-medium text-gray-800">
                            {
                              order.customer_name ||
                              "Customer"
                            }
                          </span>
                        </p>

                        <p>
                          Items:
                          <span className="ml-2 font-medium text-gray-800">
                            {
                              order
                                .items
                                ?.length
                            }
                          </span>
                        </p>

                        <p>
                          Time:
                          <span className="ml-2 font-medium text-gray-800">
                            {new Date(
                              order.createdAt
                            ).toLocaleTimeString()}
                          </span>
                        </p>
                      </div>

                      {/* ITEMS */}

                      <div className="flex flex-wrap gap-2">
                        {order.items?.map(
                          (
                            item: any,
                            i: number
                          ) => (
                            <div
                              key={
                                i
                              }
                              className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700"
                            >
                              {
                                item
                                  ?.menu_item_id
                                  ?.name
                              }{" "}
                              ×{" "}
                              {
                                item.quantity
                              }
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* RIGHT */}

                    <div className="flex flex-col items-start gap-4 xl:items-end">
                      <h3 className="text-3xl font-bold text-green-600">
                        ₹
                        {
                          order.total_amount
                        }
                      </h3>

                     <select
  value={order.status}
  onChange={(e) =>
    updateStatus(
      order._id,
      e.target.value
    )
  }
  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black font-medium shadow-sm outline-none transition focus:border-green-500"
>
  {/* CURRENT STATUS */}

  <option value={order.status}>
    {order.status}
  </option>

  {/* NEXT STEP */}

  {order.status === "placed" && (
    <option value="accepted">
      accepted
    </option>
  )}

  {order.status === "accepted" && (
    <option value="preparing">
      preparing
    </option>
  )}

  {order.status ===
    "preparing" && (
    <option value="out_for_delivery">
      out_for_delivery
    </option>
  )}

  {/* CANCEL */}

  {order.status !==
    "cancelled" && (
    <option value="cancelled">
      cancelled
    </option>
  )}
</select>
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>

      {/* COMPLETED */}

      <div className="rounded-2xl border bg-white shadow-sm">
        <button
          onClick={() =>
            setShowCompleted(
              !showCompleted
            )
          }
          className="flex w-full items-center justify-between p-6"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green-600" />

            <h2 className="text-2xl font-semibold text-gray-900">
              Completed Orders
            </h2>

            <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
              {
                completedOrders.length
              }
            </div>
          </div>

          {showCompleted ? (
            <ChevronUp />
          ) : (
            <ChevronDown />
          )}
        </button>

        {showCompleted && (
          <div className="space-y-3 border-t p-5">
            {completedOrders.length ===
            0 ? (
              <div className="py-6 text-center text-gray-500">
                No completed orders
              </div>
            ) : (
              completedOrders.map(
                (order) => (
                  <div
                    key={
                      order._id
                    }
                    className="flex flex-col gap-4 rounded-xl bg-gray-50 p-4 xl:flex-row xl:items-center xl:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-900">
                          Order #
                          {String(
                            order._id
                          ).slice(
                            -6
                          )}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${
                            statusColors[
                              order
                                .status
                            ]
                          }`}
                        >
                          {
                            order.status
                          }
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {
                          order
                            .items
                            ?.length
                        }{" "}
                        items
                      </p>
                    </div>

                    <div className="text-right">
                      <h3 className="text-xl font-bold text-green-600">
                        ₹
                        {
                          order.total_amount
                        }
                      </h3>

                      <p className="text-sm text-gray-500">
                        {new Date(
                          order.updatedAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}