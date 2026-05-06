"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  decreaseQty,
  selectCartItems,
} from "../../../store/slices/cartSlice";
import {
  resolveItemImage,
  handleImgError,
} from "../../../lib/imageUtils";

export default function RestaurantPage({ params }) {
  const [data, setData] = useState(null);
  const [openCuisines, setOpenCuisines] = useState([]); // ✅ multiple open
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);

  const getQty = (id) =>
    cartItems.find((i) => i.menu_item_id === id)?.quantity || 0;

  const rememberViewedItem = (itemId) => {
    if (typeof window === "undefined") return;

    try {
      const key = "recentlyViewedItems";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const next = [itemId, ...existing.filter((id) => id !== itemId)].slice(0, 15);
      localStorage.setItem(key, JSON.stringify(next));
    } catch (err) {
      console.error("Failed to save recently viewed item", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await api.get(`/restaurant/${params.id}`);
      setData(res.data.data);
    };
    fetchData();
  }, [params.id]);

  // 🔥 group
  const grouped = data?.menu?.reduce((acc, item) => {
    if (!acc[item.cuisine]) acc[item.cuisine] = [];
    acc[item.cuisine].push(item);
    return acc;
  }, {});

  // 🔥 open all by default
  useEffect(() => {
    if (grouped) {
      setOpenCuisines(Object.keys(grouped));
    }
  }, [data]);

  const toggleCuisine = (cuisine) => {
    setOpenCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  if (!data)
    return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 bg-slate-100 min-h-screen  ">

      {/* HEADER */}
<div className="relative rounded-2xl overflow-hidden mb-10 shadow-xl border border-slate-200">

  {/* 🔹 BACKGROUND */}
  <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700" />

  {/* 🔹 OVERLAY GLOW */}
  <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

  {/* 🔹 CONTENT */}
  <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-white">

    {/* ================= LEFT SIDE ================= */}
    <div className="flex flex-col gap-3">

      {/* NAME */}
      <h1 className="text-3xl mb-[2px] md:text-6xl font-bold tracking-tight">
        {data.name}
      </h1>

      {/* CUISINES */}
      <p className="text-sm text-slate-300">
        {data.cuisines?.join(" • ")}
      </p>

      {/* EXTRA INFO ROW */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">

        {/* ⭐ RATING */}
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
          <span className="text-green-400 font-semibold text-sm">
            ⭐ {data.rating || "4.2"}
          </span>
          <span className="text-xs text-slate-300">
            {data.totalReviews || "120+"} reviews
          </span>
        </div>

        {/* 🕒 DELIVERY (optional) */}
        <div className="text-xs text-slate-300 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
          ⏱ 30–40 mins
        </div>

      </div>
    </div>

    {/* ================= RIGHT SIDE ================= */}
  <div className="flex flex-col items-end gap-3">

  {/* PARTNER BADGE */}
  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-sm">
    <span className="text-xs font-medium tracking-wide">
      ⭐ Official ZippyEats Partner
    </span>
  </div>

</div>

  </div>
</div>

      {/* MENU */}
      {Object.entries(grouped).map(([cuisine, items]) => {
        const isOpen = openCuisines.includes(cuisine);

        return (
          <div key={cuisine} className="mb-6">

            {/* HEADER */}
          <button
            onClick={() => toggleCuisine(cuisine)}

          className="w-full flex justify-between items-center bg-white px-6 py-4 rounded-2xl shadow-md border border-slate-200">
              <span className="text-lg font-semibold">
                {cuisine}
              </span>
<span className="text-2xl font-semibold text-slate-600">
  {isOpen ? "−" : "+"}
</span>
            </button>

            {/* 🔥 ANIMATED CONTENT */}
           <div
  className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden transition-all duration-500 ${
    isOpen ? "max-h-[2000px] opacity-100 mt-5" : "max-h-0 opacity-0"
  }`}
>
  {items.map((item) => (
    <div
      key={item._id}
      onClick={() => rememberViewedItem(item._id)}
      className="w-full bg-white flex flex-col rounded-2xl mb-[10px] shadow-md hover:shadow-xl transition border border-slate-200 overflow-hidden"
    >
      {/* IMAGE */}
      <div className="h-44 w-full overflow-hidden group bg-slate-200 flex-shrink-0">
        <img
          src={resolveItemImage(item)}
          onError={handleImgError}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>

      {/* BODY */}
      <div className="flex flex-col flex-1 justify-between p-3 w-full" >

      {/* NAME + PRICE */}
<div className="w-full">
  <div className="flex items-start justify-between gap-2">
    <span className="text-sm font-semibold text-slate-900 leading-tight text-left">
      {item.name}
    </span>
    <span className="text-sm font-bold text-red-500 whitespace-nowrap flex-shrink-0">
      ₹{item.price}
    </span>
  </div>
  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 text-left">
    {item.description || "Popular item"}
  </p>
</div>

        <div className="h-10 mt-3">
          {getQty(item._id) === 0 ? (
            <button
              className="w-full h-full bg-sky-800 hover:bg-sky-700 text-white text-sm rounded-lg transition pr-[15px] pl-[15px]"
              onClick={(event) => {
                event.stopPropagation();
                rememberViewedItem(item._id);
                dispatch(addToCart({ menu_item_id: item._id, name: item.name, price: item.price }));
              }}
            >
              Add to cart
            </button>
          ) : (
            <div className="w-full h-full bg-sky-800 text-white rounded-lg flex items-center justify-between px-4 ">
              <button className="text-xl w-6 text-center mr-[10px] hover:opacity-70" onClick={(event) => {
                event.stopPropagation();
                rememberViewedItem(item._id);
                dispatch(decreaseQty(item._id));
              }}>−</button>
              <span className="font-semibold">{getQty(item._id)}</span>
              <button className="text-xl w-6 text-center ml-[10px] hover:opacity-70" onClick={(event) => {
                event.stopPropagation();
                rememberViewedItem(item._id);
                dispatch(addToCart({ menu_item_id: item._id, name: item.name, price: item.price }));
              }}>+</button>
            </div>
          )}
        </div>

      </div>
    </div>
  ))}
</div>
          </div>
        );
      })}
    </div>
  );
}
