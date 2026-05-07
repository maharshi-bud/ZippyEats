"use client";

import { useEffect, useState, useRef } from "react";
import axios from "../../../lib/axios";
import gsap from "gsap";
import { resolveItemImage, handleImgError } from "../../../lib/imageUtils";
const BASE_URL = "http://localhost:5010";

const steps = [
  { key: "placed",           label: "Placed",           icon: "📋" },
  { key: "accepted",         label: "Accepted",         icon: "✅" },
  { key: "preparing",        label: "Preparing",        icon: "🍳" },
  { key: "out_for_delivery", label: "Out For Delivery", icon: "🛵" },
  { key: "delivered",        label: "Delivered",        icon: "📦" },
];

const statusMessages = {
  placed:           { text: "Your order has been placed!",          sub: "Waiting for the restaurant to accept." },
  accepted:         { text: "Restaurant accepted your order!",      sub: "They'll start preparing it soon." },
  preparing:        { text: "Your order is now being prepared.",     sub: "We'll update you when it's on the way." },
  out_for_delivery: { text: "Your order is out for delivery!",      sub: "Your rider is on the way." },
  delivered:        { text: "Order delivered! Enjoy your meal 🎉",  sub: "Thanks for ordering with ZippyEats." },
};

// Icon circle — consistent padding approach so emoji always centers
const IconCircle = ({ emoji, bg }) => (
  <div className={`${bg} rounded-xl flex-shrink-0`} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
    {emoji}
  </div>
);



export default function OrderPage({ params }) {
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const lineRefs = useRef([]);

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await axios.get(`/orders/${params.id}`);
      setOrder(res.data.data);
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 4000);
    return () => clearInterval(interval);
  }, [params.id]);

  useEffect(() => {
    if (!order) return;
    const currentIndex = steps.findIndex(s => s.key === order.status);
    lineRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, { width: i < currentIndex ? "100%" : "0%", duration: 0.6, ease: "power2.out" });
    });
  }, [order]);

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>
  );

  const currentIndex = steps.findIndex(s => s.key === order.status);
  const msg = statusMessages[order.status] || statusMessages.placed;
  const copyId = () => { navigator.clipboard.writeText(params.id); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  // restaurant_id lives on the ORDER, not the populated menu item
  const restaurantId = order.restaurant_id;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">📦</span>
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-0">Order Tracking</h1>
            <p className="text-sm text-slate-400 ">Track your order in real-time</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm rounded-xl hover:bg-slate-700 transition">
          🖨️ Print Bill
        </button>
      </div>

      {/* PROGRESS TRACKER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-start">
          {steps.map((step, index) => {
            const done = index <= currentIndex;
            const isLast = index === steps.length - 1;
            return (
              <div key={step.key} className="flex items-start flex-1 last:flex-none">
                <div className="flex flex-col items-center w-16 flex-shrink-0">
                  <div
                    style={{ width: 48, height: 48, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}
                    className={`rounded-full border-2 transition-all duration-500 ${done ? "bg-green-500 border-green-500 text-white shadow-md shadow-black-200" : "bg-white border-slate-200 text-slate-400"}`}
                  >
                    {step.icon}
                  </div>
                  <p className={`text-xs mt-2 font-medium text-center ${done ? "text-slate-800" : "text-slate-400"}`}>{step.label}</p>
                  <p className={`text-[10px] mt-0.5 text-center ${done ? "text-green-500" : "text-slate-300"}`}>
                    {index < currentIndex
                      ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : index === currentIndex ? "Now" : "Upcoming"}
                  </p>
                </div>
                {!isLast && (
                  <div className="flex-1 h-1 bg-slate-100 mx-1 mt-6 rounded-full overflow-hidden">
                    <div ref={el => (lineRefs.current[index] = el)} className="h-full bg-green-500 rounded-full" style={{ width: index < currentIndex ? "100%" : "0%" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2 COL GRID */}
      
{/* 2 COL GRID — Fixed height, scrollable items */}
{/* <div className="grid md:grid-cols-2 gap-6 mb-6"> */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

  {/* ORDER DETAILS — fixed height */}
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left flex flex-col"
       style={{ height: 500 }}>

    <div className="flex items-center gap-2 mb-5">
      <span className="text-4xl leading-none ml-[6px]">🧾</span>
      <h2 className="text-3xl font-semibold text-slate-800 leading-none m-2 mr-[2px]">
        Order Details
      </h2>
    </div>

    <div className="space-y-3 w-full flex-1">
      <div className="flex items-center gap-3 w-full p-4 bg-slate-50 rounded-xl mx-1">
        <IconCircle emoji="🟢" bg="bg-green-100" />
        <span className="text-sm text-slate-500 flex-1">Status</span>
        <span className="text-sm font-semibold px-3 py-1 bg-green-100 text-green-700 rounded-lg capitalize">
          {order.status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl mx-1">
        <IconCircle emoji="₹" bg="bg-blue-100" />
        <span className="text-sm text-slate-500 flex-1">Total Amount</span>
        <span className="text-sm font-bold text-slate-800">₹{order.total_amount}</span>
      </div>

      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl mx-1">
        <IconCircle emoji="📦" bg="bg-indigo-100" />
        <span className="text-sm text-slate-500 flex-1">Number of items</span>
        <span className="text-sm font-bold text-slate-800">
          {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
        </span>
      </div>

      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl mx-1">
        <IconCircle emoji="🕐" bg="bg-orange-100" />
        <span className="text-sm text-slate-500 flex-1">ETA</span>
        <span className="text-sm font-bold text-slate-800">
          {new Date(order.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl mx-1">
        <IconCircle emoji="#" bg="bg-purple-100" />
        <span className="text-sm text-slate-500 flex-1">Order ID</span>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs text-slate-600 truncate max-w-[120px]">{params.id}</span>
          <button onClick={copyId} className="text-slate-400 hover:text-slate-700 text-xs flex-shrink-0">
            {copied ? "✓" : "⧉"}
          </button>
        </div>
      </div>
    </div>
  </div>

  {/* ITEMS — same fixed height, scrollable content */}
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left flex flex-col"
       style={{ height: 500 }}>

    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 36 }}> 🍽️  </span>
        {/* <h2 className="text-lg font-semibold text-slate-800"> */}
      <h2 className="text-3xl font-semibold text-slate-800 leading-none m-2 mr-[2px]">
Dishes</h2>
      </div>
      {/* <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 rounded-full">
        {order.items?.length || 0} {order.items?.length === 1 ? "item" : "items"}
      </span> */}
    </div>

    {/* ✅ Scrollable items container */}
    {/* <div className="flex-1 overflow-y-auto space-y-2 pr-1
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-slate-200
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    hover:[&::-webkit-scrollbar-thumb]:bg-slate-300"> */}
      <div className="flex-1 w-full overflow-y-auto max-h-[500px]">

      {order.items.map((item) => {
        const itemId =
          typeof item.menu_item_id === "object"
            ? item.menu_item_id._id
            : item.menu_item_id;

        const itemName =
          item.name ||
          (typeof item.menu_item_id === "object"
            ? item.menu_item_id.name
            : "Unknown");

        const itemPrice =
          item.price ||
          (typeof item.menu_item_id === "object"
            ? item.menu_item_id.price
            : 0);

        const itemImage =
          item.image ||
          (typeof item.menu_item_id === "object"
            ? item.menu_item_id.image
            : null);

        return (
          <div
            key={itemId}
            className="flex items-center gap-3 p-3 mx-1 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
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
              <p className="font-medium text-slate-800 text-sm truncate">
                {itemName}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Qty: {item.quantity}
              </p>
            </div>
            <p className="font-semibold text-slate-800 text-sm flex-shrink-0">
              ₹{itemPrice * item.quantity}
            </p>
          </div>
        );
      })}
    </div>
  </div>
</div>

      {/* STATUS BANNER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div style={{ width: 48, height: 48, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center" }} className="rounded-full bg-green-100 flex-shrink-0">
            🛵
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-800">{msg.text}</p>
            <p className="text-sm text-slate-400 mt-0.5">{msg.sub}</p>
          </div>
        </div>
        <svg width="80" height="60" viewBox="0 0 80 50" fill="none" className="opacity-20 hidden sm:block">
          <ellipse cx="20" cy="40" rx="10" ry="10" stroke="#16a34a" strokeWidth="3"/>
          <ellipse cx="60" cy="40" rx="10" ry="10" stroke="#16a34a" strokeWidth="3"/>
          <path d="M10 40 L30 20 L50 20 L70 40" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="38" cy="12" r="8" stroke="#16a34a" strokeWidth="2"/>
        </svg>
      </div>

    </div>
  );
}