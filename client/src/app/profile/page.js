"use client";

import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import api from "../../lib/axios";
import { useRouter } from "next/navigation";
import { startRouteLoader } from "../../lib/routeLoading";
import AddressManager from "../../components/AddressManager";
import ReviewModal from "../../components/ReviewModal";
import gsap from "gsap";

const CrossIcon = () => (
  <svg width="26" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function ProfileGridBg() {
  const fixedRef = useRef(null);

  useEffect(() => {
    const fixedContainer = fixedRef.current;
    if (!fixedContainer) return;

    const ctx = gsap.context(() => {
      fixedContainer.querySelectorAll(".profile-grid-cross").forEach((cross, i) => {
        gsap.to(cross, {
          scale: 1.35,
          opacity: 0.22,
          duration: 3 + i * 0.25,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      fixedContainer.querySelectorAll(".profile-ambient-lens").forEach((lens, i) => {
        gsap.to(lens, {
          x: "random(-42, 42)",
          y: "random(-42, 42)",
          scale: "random(0.92, 1.12)",
          duration: 12 + i * 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 1.8,
        });
      });
    }, fixedContainer);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={fixedRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#f0f3f1]"
      style={{ width: "100vw", height: "100vh" }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 191, 99, 0.08) 1.5px, transparent 1.5px),
            linear-gradient(to bottom, rgba(0, 191, 99, 0.08) 1.5px, transparent 1.5px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      <div
        className="profile-ambient-lens absolute top-[4%] left-[-15%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-[0.22]"
        style={{ background: "radial-gradient(circle, #ffedd5 0%, transparent 70%)" }}
      />
      <div
        className="profile-ambient-lens absolute bottom-[10%] right-[-15%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-[0.24]"
        style={{ background: "radial-gradient(circle, #dcfce7 0%, transparent 70%)" }}
      />
      <div
        className="profile-ambient-lens absolute top-[35%] right-[5%] w-[50vw] h-[50vw] rounded-full blur-[130px] opacity-[0.14]"
        style={{ background: "radial-gradient(circle, #fef9c3 0%, transparent 70%)" }}
      />

      <div className="profile-grid-cross absolute left-[12%] top-[8%] text-emerald-600/15"><CrossIcon /></div>
      <div className="profile-grid-cross absolute left-[88%] top-[24%] text-emerald-600/15"><CrossIcon /></div>
      <div className="profile-grid-cross absolute left-[5%] top-[45%] text-emerald-600/15"><CrossIcon /></div>
      <div className="profile-grid-cross absolute left-[92%] top-[66%] text-emerald-600/15"><CrossIcon /></div>
      <div className="profile-grid-cross absolute left-[8%] top-[85%] text-emerald-600/15"><CrossIcon /></div>
    </div>
  );
}

export default function ProfilePage() {
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [zipCoins, setZipCoins] = useState(0);
  const [reviewableCount, setReviewableCount] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [showPicMenu, setShowPicMenu] = useState(false);

  const fileInputRef = useRef(null);
  const picMenuRef = useRef(null);
  const profileShellRef = useRef(null);
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

        setOrders(ordersRes.data.data || []);
        setProfile(profileRes.data.data);
        setStats(statsRes.data.data);
        setReviewableCount(reviewableRes.data.data?.length || 0);
        setZipCoins(coinsRes.data.data?.zipCoins || 0);

        try {
          const token = localStorage.getItem("token");
          const picRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5010"}/api/users/me/profile-pic`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (picRes.ok) {
            const blob = await picRes.blob();
            setProfilePicUrl(URL.createObjectURL(blob));
          }
        } catch {
          // No profile picture yet.
        }
      } catch (err) {
        console.error("Profile Error:", err);
      }
    };

    fetchData();
  }, []);

  // Card reveal: page-load only, each card animates once even if async data appears later.
  useEffect(() => {
    const shell = profileShellRef.current;
    if (!shell) return;

    const cards = Array.from(shell.querySelectorAll(".profile-reveal-card:not([data-profile-revealed='true'])"));
    if (!cards.length) return;

    cards.forEach((card) => {
      card.dataset.profileRevealed = "true";
    });

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        {
          autoAlpha: 0,
          y: 76,
          scale: 0.965,
          transformOrigin: "50% 100%",
          willChange: "transform, opacity",
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.78,
          stagger: 0.1,
          ease: "back.out(1.16)",
          clearProps: "willChange,transform,opacity,visibility",
        }
      );
    }, shell);

    return () => ctx.revert();
  }, [profile, stats, zipCoins, reviewableCount, orders.length]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (picMenuRef.current && !picMenuRef.current.contains(e.target)) {
        setShowPicMenu(false);
      }
    }
    if (showPicMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicMenu]);

  async function handlePicUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfilePicUrl(URL.createObjectURL(file));
    setShowPicMenu(false);
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

  async function handleRemovePic() {
    setShowPicMenu(false);
    try {
      await api.delete("/users/me/profile-pic");
      setProfilePicUrl(null);
    } catch (err) {
      console.error("Pic remove failed:", err);
    }
  }

  const glassCard = "profile-reveal-card rounded-2xl border border-white/55 bg-white/45 shadow-[0_0_40px_rgba(15,23,42,0.11),0_18px_55px_rgba(15,23,42,0.08)]";

  return (
    <>
      <Head>
        <title>{profile ? `${profile.name} — ZippyEats` : "My Profile — ZippyEats"}</title>
      </Head>

      <div className="relative min-h-screen overflow-hidden bg-[#f0f3f1] py-10">
        <ProfileGridBg />

        <div ref={profileShellRef} className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8 rounded-[36px] border border-white/30 bg-white/10 backdrop-blur-[16px] shadow-[0_0_40px_rgba(15,23,42,0.10),0_18px_55px_rgba(15,23,42,0.08)]">
          {/* Header */}
          <div className={`${glassCard} p-6 md:p-8 overflow-visible`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-7">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="relative" ref={picMenuRef}>
                  <div
                    className="relative grid h-24 w-24 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/60 bg-gradient-to-br from-emerald-500 to-green-600 text-4xl font-extrabold text-white shadow-[0_0_28px_rgba(16,185,129,0.35)]"
                    onClick={() => setShowPicMenu((v) => !v)}
                  >
                    {profilePicUrl ? (
                      <img src={profilePicUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span>{profile?.name?.[0] || "U"}</span>
                    )}
                  </div>

                  <button
                    onClick={() => setShowPicMenu((v) => !v)}
                    className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border border-white/70 bg-white text-slate-800 shadow-lg transition-colors hover:bg-emerald-50"
                    title="Change photo"
                  >
                    <span className="text-sm leading-none">{uploadingPic ? "⏳" : "📷"}</span>
                  </button>

                  {showPicMenu && (
                    <div className="absolute top-[108px] left-1/2 z-50 w-48 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
                      <button
                        onClick={() => {
                          setShowPicMenu(false);
                          fileInputRef.current?.click();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-emerald-50"
                      >
                        <span>📷</span>
                        {profilePicUrl ? "Change photo" : "Upload photo"}
                      </button>
                      {profilePicUrl && (
                        <button
                          onClick={handleRemovePic}
                          className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                        >
                          <span>🗑️</span>
                          Remove photo
                        </button>
                      )}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePicUpload}
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-700/80">
                    ZippyEats account
                  </p>
                  <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950">
                    {profile?.name || "User"}
                  </h1>
                  <p className="mt-1 text-sm font-medium text-slate-500">{profile?.email || "Signed in customer"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100/80 bg-emerald-50/70 px-5 py-4 text-center md:text-right">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700/80">Wallet value</p>
                <p className="mt-1 text-3xl font-extrabold text-emerald-700">₹{zipCoins.toLocaleString()}</p>
                <p className="text-xs font-medium text-emerald-700/70">via {zipCoins.toLocaleString()} ZipCoins</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-5">
            <div className={`${glassCard} p-6`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Total Orders</p>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-950">{stats?.totalOrders || 0}</h2>
            </div>
            <div className={`${glassCard} p-6`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Most Bought</p>
              <h2 className="mt-3 text-lg font-bold text-slate-900 line-clamp-2">{stats?.mostBoughtItem || "—"}</h2>
            </div>
            <div className={`${glassCard} p-6`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Favorite Restaurant</p>
              <h2 className="mt-3 text-lg font-bold text-slate-900 line-clamp-2">{stats?.favoriteRestaurant || "—"}</h2>
            </div>
            <div className="profile-reveal-card rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-300/90 to-orange-500/90 p-6 text-white shadow-[0_0_40px_rgba(245,158,11,0.20),0_18px_55px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl leading-none">🪙</span>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/85">ZipCoins</p>
              </div>
              <h2 className="mt-2 text-3xl font-extrabold">{zipCoins.toLocaleString()}</h2>
              <p className="mt-1 text-xs font-medium text-white/80">Worth ₹{zipCoins.toLocaleString()} at checkout</p>
            </div>
          </div>

          {zipCoins > 0 && (
            <div className="profile-reveal-card rounded-2xl border border-amber-200/80 bg-amber-50/80 p-5 shadow-[0_0_32px_rgba(245,158,11,0.12)] flex items-center gap-4">
              <span className="text-3xl">🪙</span>
              <div>
                <p className="font-bold text-amber-800">
                  You have {zipCoins} ZipCoins — worth ₹{zipCoins} off your next order!
                </p>
                <p className="text-sm font-medium text-amber-700/80 mt-0.5">
                  Use them at checkout. 1 ZipCoin = ₹1 discount.
                </p>
              </div>
            </div>
          )}

          {reviewableCount > 0 && (
            <div className="profile-reveal-card rounded-2xl border border-amber-200/80 bg-white/70 p-5 shadow-[0_0_32px_rgba(245,158,11,0.12)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-bold text-amber-800">
                  ⭐ You have {reviewableCount} item{reviewableCount > 1 ? "s" : ""} to review!
                </p>
                <p className="text-sm font-medium text-amber-700/80 mt-0.5">
                  Share your experience and help others discover great food.
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-colors flex-shrink-0 shadow-lg shadow-amber-900/10"
              >
                Rate now
              </button>
            </div>
          )}

          {/* Addresses */}
          <div className={` p-6`}>
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700/75">Saved places</p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-900">Addresses</h2>
            </div>
            <AddressManager />
          </div>

          {/* Order History */}
          <div className="profile-reveal-card flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700/75">Timeline</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Order History</h2>
            </div>
          </div>

          <div className="space-y-5 pb-10">
            {orders.length === 0 ? (
              <div className={`${glassCard} p-8 text-center text-slate-500 font-medium`}>
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
                  className="profile-reveal-card overflow-hidden cursor-pointer rounded-2xl border border-white/60 bg-white/45 shadow-[0_0_30px_rgba(15,23,42,0.08),0_14px_38px_rgba(15,23,42,0.06)] transition-colors hover:bg-white/60"
                >
                  <div className="flex justify-between items-center gap-4 px-5 py-3 border-b border-white/60 bg-white/35">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500">Order ID: {order._id.slice(-8)}</span>
                      {order.coins_used > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                          🪙 {order.coins_used} coins used
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        order.status === "delivered"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="space-y-2 text-sm text-slate-700">
                      {order.items.map((item) => (
                        <div key={item._id} className="flex justify-between gap-4">
                          <span className="font-medium">{item.menu_item_id?.name}</span>
                          <span className="text-slate-500">× {item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-dashed border-slate-200">
                      <span className="text-xs font-medium text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <div className="text-right">
                        {order.coins_discount > 0 && (
                          <p className="text-xs font-semibold text-amber-600">🪙 -₹{order.coins_discount} coins</p>
                        )}
                        <span className="text-lg font-extrabold text-slate-950">₹{order.total_amount}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRouteLoader();
                          router.push(`/orders/${order._id}`);
                        }}
                        className="text-sm px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/10"
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
