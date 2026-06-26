"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/api";
import { AxiosError } from "axios";
import CustomSelect from "../../../components/ui/CustomSelect";

// ==========================================
// TYPES
// ==========================================
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
}

interface DeliveryAddress {
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
}

interface OrderDetails {
  _id: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  coupon_discount: number;
  coins_discount: number;
  tax_amount: number;
  total_amount: number;
  eta: string;
  instructions: string;
  cancellation_reason: string;
  createdAt: string;
  delivery_address: DeliveryAddress | string;
  items: OrderItem[];
  user?: { name: string; email: string };
  restaurant?: { name: string };
}

interface ApiErrorBody {
  message?: string;
}

// ==========================================
// HELPERS
// ==========================================
const statusStyles: Record<string, string> = {
  placed: "bg-slate-100 text-slate-700 border-slate-200",
  accepted: "bg-blue-50 text-blue-700 border-blue-200",
  preparing: "bg-amber-50 text-amber-700 border-amber-200",
  out_for_delivery: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const formatStatus = (s: string) => s.replace(/_/g, " ");

// ==========================================
// COMPONENT
// ==========================================
export default function OrderDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit states
  const [isUpdating, setIsUpdating] = useState(false);
  const [editModal, setEditModal] = useState<
    "status" | "payment" | "address" | "eta" | "financials" | "cancel" | null
  >(null);

  // Form states
  const [editData, setEditData] = useState<any>({});

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/orders/${id}`);
      setOrder(res.data);
    } catch (err: unknown) {
      const apiError = err as AxiosError<ApiErrorBody>;
      setError(apiError.response?.data?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      void fetchOrder();
    }
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    try {
      setIsUpdating(true);
      const res = await api.put(`/admin/orders/${order._id}`, editData);
      setOrder(res.data.order);
      setEditModal(null);
    } catch (err: unknown) {
      const apiError = err as AxiosError<ApiErrorBody>;
      alert(apiError.response?.data?.message || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  // Pre-fill edit data when opening a modal
  const openModal = (type: typeof editModal) => {
    if (!order) return;
    setEditModal(type);
    switch (type) {
      case "status":
        setEditData({ status: order.status });
        break;
      case "payment":
        setEditData({ payment_status: order.payment_status });
        break;
      case "address":
        setEditData({
          delivery_address: typeof order.delivery_address === "object" ? { ...order.delivery_address } : {},
        });
        break;
      case "eta":
        setEditData({
          eta: order.eta ? new Date(order.eta).toISOString().slice(0, 16) : "",
          instructions: order.instructions || "",
        });
        break;
      case "financials":
        setEditData({
          delivery_fee: order.delivery_fee,
          coupon_discount: order.coupon_discount || 0,
        });
        break;
      case "cancel":
        setEditData({
          status: "cancelled",
          cancellation_reason: order.cancellation_reason || "",
        });
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-[10vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        {error || "Order not found"}
      </div>
    );
  }

  const address = typeof order.delivery_address === "object" ? order.delivery_address : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Order #{order._id.slice(-8)}
            </h1>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusStyles[order.status] || statusStyles.placed}`}>
              {formatStatus(order.status)}
            </span>
          </div>
          <p className="mt-2 pl-12 text-sm text-slate-500">
            Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "Unknown"}
          </p>
        </div>

        <div className="flex gap-3">
          {order.status !== "cancelled" && order.status !== "delivered" && (
            <button
              onClick={() => openModal("cancel")}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              Cancel Order
            </button>
          )}
          <button
            onClick={() => openModal("status")}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            Update Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* LEFT COLUMN: Items & Pricing */}
        <div className="space-y-6 lg:col-span-2">

          {/* ITEMS */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Items</h2>
            <div className="divide-y divide-slate-100">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-sm text-slate-500">Qty: {item.quantity} × ₹{item.price}</p>
                  </div>
                  <p className="font-semibold text-slate-900">₹{item.total || (item.price * item.quantity)}</p>
                </div>
              ))}
              {(!order.items || order.items.length === 0) && (
                <p className="py-4 text-sm text-slate-500">No items found</p>
              )}
            </div>
          </div>

          {/* COST BREAKDOWN */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Payment Summary</h2>
              <button onClick={() => openModal("financials")} className="text-sm text-emerald-600 hover:underline">
                Edit Fees
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span>₹{order.delivery_fee}</span>
              </div>
              {(order.coupon_discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount</span>
                  <span>-₹{order.coupon_discount}</span>
                </div>
              )}
              {(order.coins_discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>ZipCoins Discount</span>
                  <span>-₹{order.coins_discount}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                <span>Total</span>
                <span>₹{order.total_amount}</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Info & Controls */}
        <div className="space-y-6">

          {/* PAYMENT STATUS */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Payment Status</h2>
              <button onClick={() => openModal("payment")} className="text-xs text-emerald-600 hover:underline">Edit</button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Method</p>
                <p className="font-semibold text-slate-800 uppercase">{order.payment_method}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                <p className={`font-semibold capitalize ${order.payment_status === "paid" ? "text-emerald-600" :
                  order.payment_status === "failed" ? "text-red-600" : "text-amber-600"
                  }`}>
                  {order.payment_status || "pending"}
                </p>
              </div>
            </div>
          </div>

          {/* CUSTOMER INFO */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900">Customer Details</h2>
              <button onClick={() => openModal("address")} className="text-xs text-emerald-600 hover:underline">Edit</button>
            </div>
            {address ? (
              <div className="space-y-1 text-sm text-slate-700">
                <p className="font-semibold">{address.full_name || order.user?.name || "Customer"}</p>
                <p>{address.phone || "No phone"}</p>
                <p className="mt-2 text-slate-500">{address.address_line}</p>
                <p className="text-slate-500">{address.city}{address.state ? `, ${address.state}` : ""}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No address provided</p>
            )}
          </div>

          {/* FULFILLMENT / ETA */}
          <div className="rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900">Fulfillment</h2>
              <button onClick={() => openModal("eta")} className="text-xs text-emerald-600 hover:underline">Edit</button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">ETA</p>
                <p className="font-medium text-slate-800">{order.eta ? new Date(order.eta).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "Not set"}</p>
              </div>
              {order.instructions && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Instructions</p>
                  <p className="font-medium text-slate-800 rounded bg-slate-50 p-2 mt-1">{order.instructions}</p>
                </div>
              )}
              {order.status === "cancelled" && order.cancellation_reason && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-red-500 uppercase tracking-wider">Cancellation Reason</p>
                  <p className="font-medium text-red-700 mt-1">{order.cancellation_reason}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ================= MODALS ================= */}
      {editModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-slate-900 capitalize">
              Edit {editModal}
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4">

              {/* STATUS MODAL */}
              {editModal === "status" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Order Status</label>
                  <CustomSelect
                    className="w-full"
                    value={editData.status || ""}
                    onChange={val => setEditData({ ...editData, status: val })}
                    options={[
                      { value: "placed", label: "Placed" },
                      { value: "accepted", label: "Accepted" },
                      { value: "preparing", label: "Preparing" },
                      { value: "out_for_delivery", label: "Out for Delivery" },
                      { value: "delivered", label: "Delivered" },
                      { value: "cancelled", label: "Cancelled" },
                    ]}
                  />
                </div>
              )}

              {/* PAYMENT MODAL */}
              {editModal === "payment" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Payment Status</label>
                  <CustomSelect
                    className="w-full"
                    value={editData.payment_status || ""}
                    onChange={val => setEditData({ ...editData, payment_status: val })}
                    options={[
                      { value: "pending", label: "Pending" },
                      { value: "paid", label: "Paid" },
                      { value: "failed", label: "Failed" },
                    ]}
                  />
                </div>
              )}

              {/* CANCEL MODAL */}
              {editModal === "cancel" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Cancellation Reason</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                    placeholder="e.g. Items out of stock"
                    value={editData.cancellation_reason || ""}
                    onChange={e => setEditData({ ...editData, cancellation_reason: e.target.value })}
                  />
                </div>
              )}

              {/* FINANCIALS MODAL */}
              {editModal === "financials" && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Delivery Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                      value={editData.delivery_fee ?? 0}
                      onChange={e => setEditData({ ...editData, delivery_fee: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Coupon Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                      value={editData.coupon_discount ?? 0}
                      onChange={e => setEditData({ ...editData, coupon_discount: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-slate-500">Total amount will be automatically recalculated.</p>
                </div>
              )}

              {/* ETA / INSTRUCTIONS MODAL */}
              {editModal === "eta" && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">ETA</label>
                    <input
                      type="datetime-local"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                      value={editData.eta || ""}
                      onChange={e => setEditData({ ...editData, eta: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Instructions / Notes</label>
                    <textarea
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                      value={editData.instructions || ""}
                      onChange={e => setEditData({ ...editData, instructions: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* ADDRESS MODAL */}
              {editModal === "address" && (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1 pb-1">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                      value={editData.delivery_address?.full_name || ""}
                      onChange={e => setEditData({ ...editData, delivery_address: { ...editData.delivery_address, full_name: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                      value={editData.delivery_address?.phone || ""}
                      onChange={e => setEditData({ ...editData, delivery_address: { ...editData.delivery_address, phone: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Address Line</label>
                    <textarea
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                      value={editData.delivery_address?.address_line || ""}
                      onChange={e => setEditData({ ...editData, delivery_address: { ...editData.delivery_address, address_line: e.target.value } })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                        value={editData.delivery_address?.city || ""}
                        onChange={e => setEditData({ ...editData, delivery_address: { ...editData.delivery_address, city: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Pincode</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                        value={editData.delivery_address?.pincode || ""}
                        onChange={e => setEditData({ ...editData, delivery_address: { ...editData.delivery_address, pincode: e.target.value } })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}