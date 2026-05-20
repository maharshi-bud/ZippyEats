"use client";

import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import api from "../../lib/axios";
import { useRouter } from "next/navigation";
import { startRouteLoader } from "../../lib/routeLoading";
import AddressManager from "../../components/AddressManager";
import ReviewModal from "../../components/ReviewModal";

export default function ProfilePage() {
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [zipCoins, setZipCoins] = useState(0);
  const [reviewableCount, setReviewableCount] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, profileRes, statsRes, reviewableRes, coinsRes] = await Promise.all([
          api.get("/orders/my"),
          api.get("/users/me"),
          api.get("/users/stats"),
          api.get("/reviews/reviewable"),
          api.get("/users/me/coins"),
        ]);

        setOrders(ordersRes.data.data);
        setProfile(profileRes.data.data);
        setStats(statsRes.data.data);
        setReviewableCount(reviewableRes.data.data?.length || 0);
        setZipCoins(coinsRes.data.data?.zipCoins || 0);

        // Load profile pic
        try {
          const token = localStorage.getItem("token");
          const picRes = await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5010"}/api/users/me/profile-pic`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (picRes.ok) {
            const blob = await picRes.blob();
            setProfilePicUrl(URL.createObjectURL(blob));
          }
        } catch {
          // no pic — use initial
        }
      } catch (err) {
        console.error("Profile Error:", err);
      }
    };

    fetchData();
  }, []);

  async function handlePicUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    setProfilePicUrl(URL.createObjectURL(file));
    setUploadingPic(true);

    try {
      const formData = new FormData();
      formData.append("pic", file);
      await api.post("/users/me/profile-pic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (err) {
      console.error("Pic upload failed:", err);
    } finally {
      setUploadingPic(false);
    }
  }

  return (
    <>
      <Head>
        <title>{profile ? `${profile.name} — ZippyEats` : "My Profile — ZippyEats"}</title>
      </Head>

      <div className="min-h-screen bg-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-10">

          {/* ── HEADER ──────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 mb-10 shadow">
            <div className="flex items-center gap-5 justify-center flex-col sm:flex-row">

              {/* Profile Pic */}
              <div className="relative group">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden bg-green-500 flex items-center justify-center text-2xl font-bold text-white cursor-pointer border-4 border-white/20 shadow-lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profilePicUrl ? (
                    <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profile?.name?.[0] || "U"
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-white text-slate-800 rounded-full w-7 h-7 flex items-center justify-center text-xs shadow hover:bg-slate-100 transition"
                  title="Change photo"
                >
                  {uploadingPic ? "⏳" : "📷"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePicUpload}
                />
              </div>

              {/* Name + Email */}
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-semibold">{profile?.name || "User"}</h1>
                <p className="text-sm text-slate-300">{profile?.email}</p>
              </div>
            </div>
          </div>

          {/* ── STATS + ZIPCOINS ────────────────────────────── */}
          <div className="grid md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Total Orders</p>
              <h2 className="text-2xl font-bold mt-2 text-slate-900">{stats?.totalOrders || 0}</h2>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Most Bought</p>
              <h2 className="text-lg font-semibold mt-2 text-slate-800">{stats?.mostBoughtItem || "—"}</h2>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Favorite Restaurant</p>
              <h2 className="text-lg font-semibold mt-2 text-slate-800">{stats?.favoriteRestaurant || "—"}</h2>
            </div>

            {/* ZipCoins Card */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-2xl shadow hover:shadow-md transition text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🪙</span>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-90">ZipCoins</p>
              </div>
              <h2 className="text-3xl font-bold mt-1">{zipCoins.toLocaleString()}</h2>
              <p className="text-xs opacity-80 mt-1">Worth ₹{zipCoins.toLocaleString()} at checkout</p>
            </div>
          </div>

          {/* ── HOW ZIPCOINS WORK ────────────────────────────── */}
          {zipCoins > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-10 flex items-center gap-4">
              <span className="text-3xl">🪙</span>
              <div>
                <p className="font-semibold text-amber-800">
                  You have {zipCoins} ZipCoins — worth ₹{zipCoins} off your next order!
                </p>
                <p className="text-sm text-amber-600 mt-0.5">
                  Use them at checkout. 1 ZipCoin = ₹1 discount.
                </p>
              </div>
            </div>
          )}

          {/* ── REVIEW PROMPT ────────────────────────────────── */}
          {reviewableCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-10 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-amber-800">
                  ⭐ You have {reviewableCount} item{reviewableCount > 1 ? "s" : ""} to review!
                </p>
                <p className="text-sm text-amber-600 mt-0.5">
                  Share your experience and help others discover great food.
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition flex-shrink-0"
              >
                Rate now
              </button>
            </div>
          )}

          {/* ── ADDRESSES ───────────────────────────────────── */}
          <AddressManager />

          {/* ── ORDER HISTORY ───────────────────────────────── */}
          <div className="flex items-center justify-between mb-4 mt-10">
            <h2 className="text-xl font-semibold text-slate-800">Order History</h2>
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
                  onClick={() => { startRouteLoader(); router.push(`/orders/${order._id}`); }}
                  className="bg-white rounded-2xl shadow hover:shadow-md transition overflow-hidden cursor-pointer"
                >
                  <div className="flex justify-between items-center px-5 py-3 border-b bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">Order ID: {order._id.slice(-8)}</span>
                      {order.coins_used > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          🪙 {order.coins_used} coins used
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      order.status === "delivered" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="space-y-2 text-sm text-slate-700">
                      {order.items.map((item) => (
                        <div key={item._id} className="flex justify-between">
                          <span>{item.menu_item_id?.name}</span>
                          <span className="text-slate-500">× {item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t">
                      <span className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <div className="text-right">
                        {order.coins_discount > 0 && (
                          <p className="text-xs text-amber-600">🪙 -₹{order.coins_discount} coins</p>
                        )}
                        <span className="text-lg font-bold text-slate-900">₹{order.total_amount}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); startRouteLoader(); router.push(`/orders/${order._id}`); }}
                        className="text-sm px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition"
                      >
                        {order.status === "delivered" ? "View Details →" : "Track Order →"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showReviewModal && (
        <ReviewModal onClose={() => { setShowReviewModal(false); setReviewableCount(0); }} />
      )}
    </>
  );
}