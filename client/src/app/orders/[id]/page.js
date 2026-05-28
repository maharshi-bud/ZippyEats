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
  CircleDot,
} from "lucide-react";
import axios from "../../../lib/axios";
import gsap from "gsap";
import { resolveItemImage, handleImgError } from "../../../lib/imageUtils";
import { getSocket } from "../../../lib/socket";
  import SupportWidget from "../../../components/SupportWidget";

import { useSelector } from "react-redux";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5010";

// const steps = [
//   { key: "placed",           label: "Placed",           icon: "📋" },
//   { key: "accepted",         label: "Accepted",         icon: "✅" },
//   { key: "preparing",        label: "Preparing",        icon: "🍳" },
//   { key: "out_for_delivery", label: "Out For Delivery", icon: "🛵" },
//   { key: "delivered",        label: "Delivered",        icon: "📦" },
// ];


const steps = [
  {
    key: "placed",
    label: "Placed",
    icon: ClipboardList,
  },
  {
    key: "accepted",
    label: "Accepted",
    icon: CheckCircle2,
  },
  {
    key: "preparing",
    label: "Preparing",
    icon: ChefHat,
  },
  {
    key: "out_for_delivery",
    label: "Out For Delivery",
    icon: Bike,
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: PackageCheck,
  },
];  


const statusMessages = {
  placed:           { text: "Your order has been placed!",          sub: "Waiting for the restaurant to accept." },
  accepted:         { text: "Restaurant accepted your order!",      sub: "They'll start preparing it soon." },
  preparing:        { text: "Your order is now being prepared.",     sub: "We'll update you when it's on the way." },
  out_for_delivery: { text: "Your order is out for delivery!",      sub: "Your rider is on the way." },
  delivered:        { text: "Order delivered! Enjoy your meal 🎉",  sub: "Thanks for ordering with ZippyEats." },
};
// const { user, token } = useSelector((state) => state.auth);
// Icon circle — consistent padding approach so emoji always centers
// const IconCircle = ({ emoji, bg }) => (
const IconCircle = ({
  icon: Icon,
  bg,
}) => (
<div className={`${bg} rounded-xl flex-shrink-0`} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
    {/* {emoji} */}
    <Icon
  size={18}
  className="text-slate-700"
/>
  </div>
);



export default function OrderPage({ params }) {
const { user, token } = useSelector((state) => state.auth);

  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const lineRefs = useRef([]);
    // const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await axios.get(`/orders/${params.id}`);
      setOrder(res.data.data);
    };

    fetchOrder();

    const token = localStorage.getItem("token");
    const socket = getSocket();

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        socket.emit("join", { userId: payload.id, role: payload.role });
      } catch (err) {
        console.error("Socket join failed:", err.message);
      }
    }

    const handleStatusUpdate = (payload) => {
      if (String(payload.orderId) !== params.id) return;

      setOrder((current) =>
        current
          ? {
              ...current,
              status: payload.status,
              updatedAt: payload.updatedAt,
            }
          : current
      );
    };

    socket.on("orderStatusUpdate", handleStatusUpdate);

    return () => {
      socket.off("orderStatusUpdate", handleStatusUpdate);
    };
  }, [params.id]);

  useEffect(() => {
    if (!order) return;
    const currentIndex = steps.findIndex(s => s.key === order.status);
    lineRefs.current.forEach((el, i) => {
      if (!el) return;
      // gsap.to(el, { width: i < currentIndex ? "100%" : "0%", duration: 0.6, ease: "power2.out" });
      gsap.to(el, {

  width:
    i < currentIndex
      ? "100%"
      : i === currentIndex
      ? "55%"
      : "0%",

  duration: 0.8,

  ease: "power2.out",
});
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
<div className="
   relative
  
  min-h-screen
  bg-[#f0f4f7]">
      <div className="  max-w-5xl
  mx-auto
  px-4
  py-8
  min-h-screen
  backdrop-blur-[2px]">

      {/* HEADER */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* <span className="text-4xl">📦</span> */}
          <div className="rounded-2xl bg-green-100 p-3">
  <PackageCheck
    size={32}
    className="text-green-600"
  />
</div>
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-0">Order Tracking</h1>
            <p className="text-sm text-slate-400 ">Track your order in real-time</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm rounded-xl hover:bg-slate-700 transition">
        <>
  <Printer
    size={16}
    className="mr-1"
  />
  Print Bill
</>
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
                    {/* {step.icon} */}
                    <step.icon size={22} />
                  </div>
                  <p className={`text-xs mt-2 font-medium text-center ${done ? "text-slate-800" : "text-slate-400"}`}>{step.label}</p>
                  <p className={`text-[10px] mt-0.5 text-center ${done ? "text-green-500" : "text-slate-300"}`}>
                    {index < currentIndex
                      ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : index === currentIndex ? "Now" : "Upcoming"}
                  </p>
                </div>
{!isLast && (

  <div className="
    relative
    flex-1
    h-1.5
    bg-slate-200
    mx-2
    mt-6
    rounded-full
    overflow-hidden
  ">

    {/* COMPLETED LINE */}

    <div

      ref={(el) =>
        (lineRefs.current[index] = el)
      }

      className="
        h-full
        bg-green-500
        rounded-full
        relative
        overflow-hidden
      "

      style={{
        width:
          index < currentIndex
            ? "100%"
            : index === currentIndex
            ? "60%"
            : "0%",
      }}
    >

      {/* MOVING LOADER EFFECT */}

      {index === currentIndex && (

        <div className="
          absolute
          top-0
          left-[-40%]

          h-full
          w-[40%]

          bg-gradient-to-r
          from-transparent
          via-white/80
          to-transparent

          animate-[loadingFlow_1.3s_linear_infinite]
        " />

      )}

    </div>
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
 {/* ORDER DETAILS — fixed height */}
<div
  className="
    bg-white
    rounded-2xl
    shadow-xl
    border
    border-slate-200
    p-6
    text-left
    flex
    flex-col
  "
  style={{ height: 500 }}
>

  {/* HEADER */}

  <div className="flex items-center gap-3 mb-6">

    <div className="
      rounded-2xl
      bg-slate-200
      p-3
    ">
      <ReceiptText
        size={30}
        className="text-slate-700"
      />
    </div>

    <div>

      <h2 className="
        text-3xl
        font-semibold
        text-slate-800
        leading-none
      ">
        Order Details
      </h2>

      <p className="
        mt-1
        text-sm
        text-slate-400
      ">
        Live order information
      </p>

    </div>

  </div>

  {/* DETAILS */}

  <div className="
    space-y-3
    w-full
    flex-1
  ">

    {/* STATUS */}

    <div className="
      flex
      items-center
      gap-3
      w-full
      p-4
      bg-slate-50
      rounded-xl
      transition
      hover:bg-slate-100
    ">

      <IconCircle
        icon={CircleDot}
        bg="bg-green-100"
      />

      <span className="
        text-sm
        text-slate-500
        flex-1
      ">
        Status
      </span>

      <span className="
        text-sm
        font-semibold
        px-3
        py-1
        bg-green-100
        text-green-700
        rounded-lg
        capitalize
      ">
        {order.status.replaceAll("_", " ")}
      </span>

    </div>

    {/* TOTAL */}

    <div className="
      flex
      items-center
      gap-3
      p-4
      bg-slate-50
      rounded-xl
      transition
      hover:bg-slate-100
    ">

      <IconCircle
        icon={IndianRupee}
        bg="bg-blue-100"
      />

      <span className="
        text-sm
        text-slate-500
        flex-1
      ">
        Total Amount
      </span>

      <span className="
        text-sm
        font-bold
        text-slate-800
      ">
        ₹{order.total_amount}
      </span>

    </div>

    {/* ITEMS */}

    <div className="
      flex
      items-center
      gap-3
      p-4
      bg-slate-50
      rounded-xl
      transition
      hover:bg-slate-100
    ">

      <IconCircle
        icon={PackageCheck}
        bg="bg-indigo-100"
      />

      <span className="
        text-sm
        text-slate-500
        flex-1
      ">
        Number of Items
      </span>

      <span className="
        text-sm
        font-bold
        text-slate-800
      ">

        {
          order.items?.reduce(
            (sum, item) =>
              sum + item.quantity,
            0
          ) || 0
        }

      </span>

    </div>

    {/* ETA */}

    <div className="
      flex
      items-center
      gap-3
      p-4
      bg-slate-50
      rounded-xl
      transition
      hover:bg-slate-100
    ">

      <IconCircle
        icon={Clock3}
        bg="bg-orange-100"
      />

      <span className="
        text-sm
        text-slate-500
        flex-1
      ">
        ETA
      </span>

      <span className="
        text-sm
        font-bold
        text-slate-800
      ">

        {new Date(order.eta)
          .toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )}

      </span>

    </div>

    {/* ORDER ID */}

    <div className="
      flex
      items-center
      gap-3
      p-4
      bg-slate-50
      rounded-xl
      transition
      hover:bg-slate-100
    ">

      <IconCircle
        icon={Hash}
        bg="bg-purple-100"
      />

      <span className="
        text-sm
        text-slate-500
        flex-1
      ">
        Order ID
      </span>

      <div className="
        flex
        items-center
        gap-2
        min-w-0
      ">

        <span className="
          font-mono
          text-xs
          text-slate-600
          truncate
          max-w-[120px]
        ">
          {params.id}
        </span>

        <button

          onClick={copyId}

          className="
            text-slate-400
            hover:text-slate-700
            text-xs
            flex-shrink-0
            transition
          "
        >

          {copied ? "✓" : "⧉"}

        </button>

      </div>

    </div>

  </div>

</div>

  {/* ITEMS — same fixed height, scrollable content */}
  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-left flex flex-col"
       style={{ height: 500 }}>

    <div className="flex items-center  justify-between mb-5">
      <div className="flex items-center gap-2">
        {/* <span style={{ fontSize: 36 }}> 🍽️  </span> */}
        <div className="rounded-2xl bg-orange-100 p-3">
  <UtensilsCrossed
    size={28}
    className="text-orange-600"
  />
</div>
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
      <div className="bg-white rounded-2xl shadow-xl mt-3 border border-slate-200 p-5 flex items-center justify-between">
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
          {/* <SupportWidget
    orderId={params.id}
    // userId={params.user_id}// user_id
    userId={user._id}
    token={token}
  />
  */}
  <SupportWidget
    orderId={params.id}
    userId={
      user?._id ||
      JSON.parse(
        atob(
          (
            token ||
            localStorage.getItem("token")
          ).split(".")[1]
        )
      ).id
    }
    token={
      token ||
      localStorage.getItem("token")
    }
  />
    </div>
    </div>
  );
}
