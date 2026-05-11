"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import api from "../../../lib/api";
import Loader from "../../../components/ui/Loader";

const STATUS = [
  "placed",
  "accepted",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refund"
];

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params.id;

  const [order, setOrder] = useState<any>(null);

  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/admin/orders/${id}`);

        setOrder(res.data);

        setStatus(res.data.status);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const updateStatus = async () => {
    try {
      setUpdating(true);

      await api.put(`/admin/orders/${id}/status`, {
        status,
      });

      setOrder((prev: any) => ({
        ...prev,
        status,
      }));

      // alert("Order updated successfully");
    } catch (err) {
      console.error(err);

      alert("Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center pt-[30vh]">
        <Loader />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-red-500 text-sm">
        Failed to load order
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">
            Order Details
          </h1>

          <p className="text-sm text-zinc-500 mt-2">
            #{order._id?.slice(-8)}
          </p>

          
        </div>
        

        {/* STATUS ACTION */}
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="border border-zinc-300 rounded-xl px-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s
                  .replaceAll("_", " ")
                  .replace(
                    /^\w/,
                    (c) => c.toUpperCase()
                  )}
              </option>
            ))}
          </select>

          <button
            onClick={updateStatus}
            disabled={updating}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-medium transition"
          >
            {updating
              ? "Updating..."
              : "Update"}
          </button>
        </div>
      </div>

      {/* TOP CARDS */}
      {/* TOP CARDS */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">

  {/* CUSTOMER */}
  <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
    <p className="text-sm text-zinc-500 mb-2">
      Customer
    </p>

    <h3 className="font-semibold text-xl text-zinc-900">
      {order.user?.name || "Unknown"}
    </h3>

    <p className="text-sm text-zinc-500 mt-2">
      {order.user?.email || "No email"}
    </p>
  </div>

  {/* PAYMENT */}
  <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
    <p className="text-sm text-zinc-500 mb-2">
      Payment
    </p>

    <h3 className="font-bold text-3xl text-emerald-600">
      ₹{order.total_amount || 0}
    </h3>

    <p className="text-sm text-zinc-500 mt-2 capitalize">
      {order.payment_method || "Online"}
    </p>
  </div>

  {/* ORDER TIME */}
  <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
    <p className="text-sm text-zinc-500 mb-2">
      Ordered At
    </p>

    <h3 className="font-semibold text-xl text-zinc-900">
      {new Date(order.createdAt).toLocaleDateString()}
    </h3>

    <p className="text-sm text-zinc-500 mt-2">
      {new Date(order.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </p>
  </div>

  {/* STATUS */}
  <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
    <p className="text-sm text-zinc-500 mb-4">
      Delivery Status
    </p>

    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
        order.status === "delivered"
          ? "bg-emerald-100 text-emerald-700"
          : order.status === "cancelled"
          ? "bg-red-100 text-red-700"
          : order.status === "out_for_delivery"
          ? "bg-blue-100 text-blue-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          order.status === "delivered"
            ? "bg-emerald-500"
            : order.status === "cancelled"
            ? "bg-red-500"
            : order.status === "out_for_delivery"
            ? "bg-blue-500"
            : "bg-yellow-500"
        }`}
      />

      {order.status
        ?.replaceAll("_", " ")
        .replace(
          /^\w/,
          (c: string) => c.toUpperCase()
        )}
    </span>
  </div>

</div>

      {/* ITEMS */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100">
          <h2 className="font-semibold text-lg text-zinc-900">
            Order Items
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="text-left p-4">
                Item
              </th>

              <th className="text-left p-4">
                Qty
              </th>

              <th className="text-left p-4">
                Price
              </th>

              <th className="text-left p-4">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {order.items?.map(
              (item: any, idx: number) => (
                <tr
                  key={idx}
                  className="border-t border-zinc-100 hover:bg-zinc-50 transition"
                >
                  <td className="p-4 font-medium text-zinc-900">
                    {item.name ||
                      "Menu Item"}
                  </td>

                  <td className="p-4 text-zinc-700">
                    {item.quantity}
                  </td>

                  <td className="p-4 text-zinc-700">
                    ₹{item.price}
                  </td>

                  <td className="p-4 font-semibold text-emerald-600">
                    ₹
                    {item.price *
                      item.quantity}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        {order.items?.length === 0 && (
          <div className="p-6 text-center text-zinc-500">
            No items found
          </div>
        )}
      </div>

      {/* ADDRESS */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <h2 className="font-semibold text-lg text-zinc-900 mb-4">
          Delivery Address
        </h2>

<div className="space-y-2 text-sm text-zinc-700">
  <p className="font-semibold text-zinc-900">
    {order.delivery_address?.full_name || "Customer"}
  </p>

  <p>
    +91 {order.delivery_address?.phone || "No phone"}
  </p>

  <div className="leading-relaxed text-zinc-600">
    <p>
      {order.delivery_address?.address_line}
    </p>

    {/* <p>
      {[
        order.delivery_address?.city,
        order.delivery_address?.state,
        order.delivery_address?.pincode,
      ]
        .filter(Boolean)
        .join(", ")}
    </p> */}

    <p>
      {/* {order.delivery_address?.country} */}
    </p>
  </div>
</div>
      </div>
    </div>
  );
}