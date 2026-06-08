"use client";

import { useEffect, useState, useRef } from "react";
import {
  ClipboardList,
  CheckCircle2,
  ChefHat,
  Bike,
  PackageCheck,
  ReceiptText,
  Clock3,
  Hash,
  IndianRupee,
  UtensilsCrossed,
  Printer,
  MapPin,
  Phone,
  Calendar,
  Store,
} from "lucide-react";
import axios from "../../../lib/axios";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { resolveItemImage, handleImgError } from "../../../lib/imageUtils";
import { getSocket } from "../../../lib/socket";
import SupportWidget from "../../../components/SupportWidget";
import { useSelector } from "react-redux";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  { key: "placed", label: "Placed", icon: ClipboardList },
  { key: "accepted", label: "Accepted", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "out_for_delivery", label: "Out For Delivery", icon: Bike },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
];

const IconCircle = ({ icon: Icon, bg }) => (
  <div
    className={`${bg} rounded-xl flex-shrink-0`}
    style={{
      width: 36,
      height: 36,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Icon size={18} className="text-slate-700" />
  </div>
);

export default function OrderPage({ params }) {
  const { user, token } = useSelector((state) => state.auth);
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);

  const lineRefs = useRef([]);

  // Animation refs
  const headerRef = useRef(null);
  const trackerRef = useRef(null);
  const orderDetailsRef = useRef(null);
  const itemsCardRef = useRef(null);
  const addressCardRef = useRef(null);
  const summaryRef = useRef(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await axios.get(`/orders/${params.id}`);
      setOrder(res.data.data);
    };
    fetchOrder();

    const currentToken = token || localStorage.getItem("token");
    const socket = getSocket();

    if (currentToken) {
      try {
        const payload = JSON.parse(atob(currentToken.split(".")[1]));
        socket.emit("join", { userId: payload.id, role: payload.role });
      } catch (err) {
        console.error("Socket join failed:", err.message);
      }
    }

    const handleStatusUpdate = (payload) => {
      if (String(payload.orderId) !== params.id) return;
      setOrder((current) =>
        current
          ? { ...current, status: payload.status, updatedAt: payload.updatedAt }
          : current
      );
    };

    socket.on("orderStatusUpdate", handleStatusUpdate);
    return () => socket.off("orderStatusUpdate", handleStatusUpdate);
  }, [params.id, token]);

  // ── GSAP: progress line animation ──────────────────────────────────────────
  useEffect(() => {
    if (!order) return;
    const currentIndex = steps.findIndex((s) => s.key === order.status);
    lineRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, {
        width: i < currentIndex ? "100%" : i === currentIndex ? "55%" : "0%",
        duration: 0.8,
        ease: "power2.out",
      });
    });
  }, [order]);

  // ── GSAP: entry + scroll-triggered animations (runs after order loads) ─────
  useEffect(() => {
    if (!order) return;

    const ctx = gsap.context(() => {
      // 1. Header — immediate entry (fade + slide down)
      gsap.from(headerRef.current, {
        y: -30,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      });

      // 2. Status tracker — fade + slide up, short delay after header
      gsap.from(trackerRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        delay: 0.2,
        ease: "power3.out",
      });

      // 3. Three cards in the grid — staggered scroll-triggered
      const scrollCards = [
        orderDetailsRef.current,
        itemsCardRef.current,
        addressCardRef.current,
        summaryRef.current,
      ].filter(Boolean);

      scrollCards.forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            once: true,
          },
          y: 50,
          opacity: 0,
          duration: 0.6,
          delay: i * 0.15,
          ease: "power3.out",
        });
      });
    });

    return () => ctx.revert();
  }, [order]);

  if (!order)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );

  const currentIndex = steps.findIndex((s) => s.key === order.status);
  const copyId = () => {
    navigator.clipboard.writeText(params.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const restaurantId = order.restaurant_id;

  const itemsTotal = order.subtotal || 0;
  const deliveryFee = order.delivery_fee || 0;
  const taxAmount = order.tax_amount || 0;
  const couponDiscount = order.coupon_discount || 0;
  const coinsDiscount = order.coins_discount || 0;
  const finalTotal = order.total_amount || 0;

  return (
    <div className="relative min-h-screen bg-[#f0f4f7]">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <div ref={headerRef} className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-3 shadow-lg">
              <PackageCheck size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-[0px]">
                Order Tracking
              </h1>
              <p className="text-sm text-slate-500 mt-0">
                Track your order in real-time
              </p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition shadow-md hover:shadow-lg"
          >
            <Printer size={16} />
            Print Bill
          </button>
        </div>

        {/* ── STATUS TRACKER ─────────────────────────────────────────────────── */}
        <div
          ref={trackerRef}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 mb-8"
        >
          <div className="flex items-start">
            {steps.map((step, index) => {
              const done = index <= currentIndex;
              const isActive = index === currentIndex;
              const isLast = index === steps.length - 1;
              return (
                <div
                  key={step.key}
                  className="flex items-start flex-1 last:flex-none"
                >
                  <div className="flex flex-col items-center w-24 flex-shrink-0">
                    {/* Step circle — pulse ring on the active step */}
                    <div className="relative flex items-center justify-center">
                      {isActive && (
                        <>
                          {/* Outer pulse ring */}
                          <span
                            className="absolute rounded-full animate-ping"
                            style={{
                              width: 68,
                              height: 68,
                              background: "rgba(34,197,94,0.25)",
                              // background: "rgb(34, 197, 94)",
                              animationDuration: "1.4s",
                              right: -6,
                              
                            }}
                          />
                          {/* Inner steady halo */}
                          
                        </>
                      )}
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          zIndex: 1,
                        }}
                        className={`rounded-full border-4 transition-all duration-500 shadow-md ${
                          done
                            ? "bg-green-500 border-green-500 text-white shadow-green-200"
                            : "bg-white border-slate-300 text-slate-400"
                        }`}
                      >
                        <step.icon size={24} strokeWidth={2.5} />
                      </div>
                    </div>

                    <p
                      className={`text-sm mt-3 font-bold text-center leading-tight ${
                        done ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p
                      className={`text-xs mt-1.5 text-center font-medium ${
                        done ? "text-green-600" : "text-slate-300"
                      }`}
                    >
                      {index < currentIndex
                        ? new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : index === currentIndex
                        ? "In Progress"
                        : "Pending"}
                    </p>
                  </div>

                  {!isLast && (
                    <div className="relative flex-1 h-3 bg-slate-200 mx-3 mt-7 rounded-full overflow-hidden shadow-inner">
                      <div
                        ref={(el) => (lineRefs.current[index] = el)}
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width:
                            index < currentIndex
                              ? "100%"
                              : index === currentIndex
                              ? "60%"
                              : "0%",
                        }}
                      >
                        {index === currentIndex && (
                          <div className="absolute top-0 left-[-40%] h-full w-[40%] bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[loadingFlow_1.3s_linear_infinite]" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3-COLUMN GRID ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">

          {/* LEFT: ORDER DETAILS */}
          <div className="lg:col-span-2 space-y-6">

            {/* ORDER DETAILS CARD */}
            <div
              ref={orderDetailsRef}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                <ReceiptText size={32} className="ml-[15px]" />
                <p className="text-left">Order Details</p>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                  <IconCircle icon={Store} bg="bg-blue-100" />
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">Restaurant</p>
                    <p className="font-semibold text-slate-900 text-sm">{order.restaurant_name}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                  <IconCircle icon={Hash} bg="bg-purple-100" />
                  <div className="text-right min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Order ID</p>
                    <div className="flex items-center justify-end gap-2">
                      <p className="font-mono text-slate-700 text-xs truncate">{params.id.slice(-12)}</p>
                      <button onClick={copyId} className="text-slate-400 hover:text-slate-700 transition shrink-0">
                        {copied ? "✓" : "⧉"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                  <IconCircle icon={Calendar} bg="bg-green-100" />
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">Order Date</p>
                    <p className="font-semibold text-slate-900 text-sm">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                  <IconCircle icon={Clock3} bg="bg-orange-100" />
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">Order Time</p>
                    <p className="font-semibold text-slate-900 text-sm">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Current Status</span>
                  <span
                    className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                      order.status === "delivered"
                        ? "bg-green-100 text-green-700 border-2 border-green-300"
                        : order.status === "cancelled"
                        ? "bg-red-100 text-red-700 border-2 border-red-300"
                        : "bg-blue-100 text-blue-700 border-2 border-blue-300"
                    }`}
                  >
                    {order.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* ITEMS CARD */}
            <div
              ref={itemsCardRef}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex gap-2">
                <UtensilsCrossed size={22} />
                <div className="flex align-end gap-2">
                  <p className="text-end mb-1">Order Items</p>
                  <span className="ml-auto text-sm font-normal text-slate-500 bottom-1">
                    {order.items?.length || 0} {order.items?.length === 1 ? "item" : "items"}
                  </span>
                </div>
              </h2>
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                {order.items.map((item, i) => {
                  const itemId =
                    typeof item.menu_item_id === "object"
                      ? item.menu_item_id._id
                      : item.menu_item_id;
                  const itemName =
                    item.name ||
                    (typeof item.menu_item_id === "object"
                      ? item.menu_item_id.name
                      : "Unknown");
                  const itemPrice = item.price || 0;
                  const itemImage = item.image || null;
                  return (
                    <div
                      key={itemId}
                      className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition shadow-sm"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 shadow-md">
                        <img
                          src={resolveItemImage({
                            image: itemImage,
                            restaurant_id: restaurantId,
                            name: itemName,
                          })}
                          alt={itemName}
                          className="w-full h-full object-cover"
                          onError={handleImgError}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{itemName}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Qty: {item.quantity} × ₹{itemPrice}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-slate-900 text-base">
                          ₹{itemPrice * item.quantity}
                        </p>
                        {item.veg !== undefined && (
                          <p className="text-base mt-1">{item.veg ? "🟢" : "🔴"}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DELIVERY ADDRESS */}
            <div
              ref={addressCardRef}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin size={22} />
                Delivery Address
              </h2>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-left">
                <p className="font-bold text-slate-900 text-base">
                  {order.delivery_address?.full_name}
                </p>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone size={16} className="text-slate-500 flex-shrink-0" />
                  <span className="font-medium">{order.delivery_address?.phone}</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {order.delivery_address?.address_line}
                </p>
                <p className="text-slate-600 text-sm">
                  {order.delivery_address?.city}, {order.delivery_address?.state}{" "}
                  {order.delivery_address?.pincode}
                </p>
                <p className="text-slate-500 text-xs">India</p>
              </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="lg:col-span-1">
            <div
              ref={summaryRef}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 lg:sticky lg:top-20"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                <IndianRupee size={22} />
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Items Total</span>
                  <span className="font-bold text-slate-900">₹{itemsTotal}</span>
                </div>

                <div className="flex justify-between py-2.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Delivery Fee</span>
                  <span className="font-bold text-slate-900">₹{deliveryFee}</span>
                </div>

                {taxAmount > 0 && (
                  <div className="flex justify-between py-2.5 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Tax & Charges</span>
                    <span className="font-bold text-slate-900">₹{taxAmount}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between py-2.5 border-b border-green-300 bg-green-100 px-3 rounded-lg">
                    <span className="text-green-700 font-semibold">🎟 Coupon Discount</span>
                    <span className="font-bold text-green-700">-₹{couponDiscount}</span>
                  </div>
                )}

                {coinsDiscount > 0 && (
                  <div className="flex justify-between py-2.5 border-b border-amber-300 bg-amber-100 px-3 rounded-lg">
                    <span className="text-amber-700 font-semibold">🪙 Coins Discount</span>
                    <span className="font-bold text-amber-700">-₹{coinsDiscount}</span>
                  </div>
                )}

                <div className="flex justify-between py-2 mt-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white px-3 rounded-xl shadow-xl">
                  <span className="text-base font-bold">Total Paid</span>
                  <span className="text-xl font-bold">₹{finalTotal}</span>
                </div>

                <div className="flex justify-between py-3 mt-4 border-t border-slate-200 pt-4">
                  <span className="text-slate-600 font-medium">Payment Method</span>
                  <span className="font-bold capitalize text-slate-900">
                    {order.payment_method}
                  </span>
                </div>

                <div className="flex justify-between py-3">
                  <span className="text-slate-600 font-medium">Payment Status</span>
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                      order.payment_status === "paid"
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                    }`}
                  >
                    {order.payment_status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SupportWidget
          orderId={params.id}
          userId={
            user?._id ||
            JSON.parse(
              atob((token || localStorage.getItem("token")).split(".")[1])
            ).id
          }
          token={token || localStorage.getItem("token")}
        />
      </div>
    </div>
  );
}