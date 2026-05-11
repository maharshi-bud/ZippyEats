"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  decreaseQty,
  selectCartItems,
} from "../../../store/slices/cartSlice";
import { selectLocation } from "../../../store/slices/locationSlice";
import {
  resolveItemImage,
  handleImgError,
} from "../../../lib/imageUtils";

export default function RestaurantPage({ params }) {
  const [data, setData] = useState(null);
  const [openCuisines, setOpenCuisines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const deliveryAddress = useSelector(selectLocation);

  // Filter state
  const [vegOnly, setVegOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);

  // Toggle handlers
  const handleVegToggle = () => {
    setVegOnly((prev) => {
      const next = !prev;
      if (next) setNonVegOnly(false);
      return next;
    });
  };

  const handleNonVegToggle = () => {
    setNonVegOnly((prev) => {
      const next = !prev;
      if (next) setVegOnly(false);
      return next;
    });
  };

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

  // Filter menu items based on search and veg/non-veg filters
  const getFilteredMenu = () => {
    if (!data?.menu) return [];

    return data.menu.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.cuisine?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesVegFilter =
        (!vegOnly && !nonVegOnly) ||
        (vegOnly && item.veg) ||
        (nonVegOnly && !item.veg);

      return matchesSearch && matchesVegFilter;
    });
  };

  // Group filtered items by cuisine
  const grouped = getFilteredMenu().reduce((acc, item) => {
    if (!acc[item.cuisine]) acc[item.cuisine] = [];
    acc[item.cuisine].push(item);
    return acc;
  }, {});

  // ✅ Calculate ONE global Bestseller + ONE global Top Rated across the WHOLE menu
  const allItems = Object.values(grouped).flat();

  let globalBestSellerId = null;
  let maxReviews = 0;
  allItems.forEach((item) => {
    const reviews = item.totalReviews || 0;
    if (reviews > maxReviews) {
      maxReviews = reviews;
      globalBestSellerId = item._id;
    }
  });

  let globalTopRatedId = null;
  let maxRating = 0;
  allItems.forEach((item) => {
    const rating = item.rating || 0;
    if (rating > maxRating && item._id !== globalBestSellerId) {
      maxRating = rating;
      globalTopRatedId = item._id;
    }
  });

  // Open all by default
  useEffect(() => {
    if (data?.menu) {
      const cuisines = [...new Set(data.menu.map((item) => item.cuisine))];
      setOpenCuisines(cuisines);
    }
  }, [data]);

  const toggleCuisine = (cuisine) => {
    setOpenCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  if (!data) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 bg-slate-100 min-h-screen">

      {/* BREADCRUMB */}
      <nav className="text-xs text-slate-400 mb-7">
        <span className="hover:text-slate-600 cursor-pointer">Home</span>
        <span>/</span>
        <span className="hover:text-slate-600 cursor-pointer">Ahmedabad</span>
        <span>/</span>
        <span className="text-slate-600 font-medium truncate">{data.name}</span>
      </nav>

      {/* RESTAURANT NAME */}
      <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-5">
        {data.name}
      </h1>

      {/* INFO CARD */}
      <div className="bg-gradient-to-b from-white to-b via-slate-100 to-slate-200 
      rounded-b-[36px] px-4 py-4 shadow-inner mb-8">
        <div className="bg-white rounded-2xl p-6 mb-0 
        border border-[rgba(2,6,12,0.15)] 
        shadow-[0_8px_16px_rgba(0,0,0,0.04)]">

          {/* ROW 1 */}
          <div className="flex flex-wrap items-start justify-start gap-2 text-left">
            <div className="flex items-left gap-2 mb-3">
              <div className="flex items-left gap-1.5 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                <span>★</span>
                <span>{data.rating || "4.2"}</span>
              </div>
              <span className="text-sm text-slate-500">
                ({data.totalReviews || "120"}+ ratings)
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-sm text-slate-500">
                ₹{data.avg_price_for_two || "300"} for two
              </span>
            </div>
          </div>

          {/* ROW 2 */}
          <div className="flex flex-wrap items-center justify-start gap-2 mb-0 text-left">
            <div className="flex items-center gap-1.5 mb-4">
              {data.cuisines?.map((c, i) => (
                <span key={c}>
                  <span className="text-sm text-orange-500 font-bold cursor-pointer hover:underline">
                    {c}
                  </span>
                  {i < data.cuisines.length - 1 && (
                    <span className="text-slate-300 ml-1.5">,</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* DIVIDER */}
          <div className="border-t border-dashed border-slate-200 mb-4" />

          {/* ROW 3 */}
          <div className="flex flex-wrap items-center justify-start gap-2 mb-0 text-left">
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-start gap-0.5 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <div className="w-px h-4 bg-slate-300" />
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                </div>
                <div className="flex flex-col items-start gap-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-bold text-slate-700">Outlet</span>
                    <span className="text-sm text-slate-500">
                      {deliveryAddress || "Gandhinagar"}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 self-start text-left">
                    {data.delivery_time || "30"}–{(data.delivery_time || 10) + 10} mins
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* DEALS FOR YOU */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-slate-900">Deals for you</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const el = document.getElementById("deals-scroll");
                if (!el || !el.firstElementChild) return;
                const card = el.firstElementChild;
                const cardWidth = card.getBoundingClientRect().width;
                const gap = parseFloat(window.getComputedStyle(el).gap) || 16;
                el.scrollBy({ left: -(cardWidth + gap), behavior: "smooth" });
              }}
              className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 shadow-sm
                         grid place-items-center text-slate-600 text-lg
                         hover:bg-slate-200 active:scale-95 transition"
            >
              <span className="block leading-none -mt-px">‹</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById("deals-scroll");
                if (!el || !el.firstElementChild) return;
                const card = el.firstElementChild;
                const cardWidth = card.getBoundingClientRect().width;
                const gap = parseFloat(window.getComputedStyle(el).gap) || 16;
                el.scrollBy({ left: cardWidth + gap, behavior: "smooth" });
              }}
              className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 shadow-sm
                         grid place-items-center text-slate-600 text-lg
                         hover:bg-slate-200 active:scale-95 transition"
            >
              <span className="block leading-none -mt-px">›</span>
            </button>
          </div>
        </div>

        <div
          id="deals-scroll"
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory
                     [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* DEAL 1 */}
          <div className="flex-shrink-0 w-[320px] snap-start flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="grid place-items-center w-14 h-14 rounded-xl bg-blue-50 flex-shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="3" stroke="#3b82f6" strokeWidth="1.5" />
                <path d="M2 10h20" stroke="#3b82f6" strokeWidth="1.5" />
                <path d="M6 14h4" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-slate-800 leading-tight">20% off up to ₹120</p>
              <p className="mt-1 text-xs text-slate-400 leading-snug">
                Use code <span className="font-semibold text-blue-500">HDFCFEST</span>
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                On orders above ₹249 with HDFC Bank cards
              </p>
            </div>
          </div>

          {/* DEAL 2 */}
          <div className="flex-shrink-0 w-[320px] h-[height107.85px] snap-start flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="grid place-items-center w-14 h-14 rounded-xl bg-orange-50 flex-shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-slate-800 leading-tight">Flat ₹150 off</p>
              <p className="mt-1 text-xs text-slate-400 leading-snug">
                Use code <span className="font-semibold text-orange-500">TRYNEW</span>
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">On your first order above ₹349</p>
            </div>
          </div>

          {/* DEAL 3 */}
          <div className="flex-shrink-0 w-[320px] snap-start flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="grid place-items-center w-14 h-14 rounded-xl bg-green-50 flex-shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="9" r="2" stroke="#22c55e" strokeWidth="1.5" />
                <circle cx="15" cy="15" r="2" stroke="#22c55e" strokeWidth="1.5" />
                <path d="M7.5 16.5l9-9" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="2" y="2" width="20" height="20" rx="4" stroke="#22c55e" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-slate-800 leading-tight">60% off up to ₹100</p>
              <p className="mt-1 text-xs text-slate-400 leading-snug">
                Use code <span className="font-semibold text-green-500">ZIPPY60</span>
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                On orders above ₹199. No minimum for Zippy One
              </p>
            </div>
          </div>

          {/* DEAL 4 */}
          <div className="flex-shrink-0 w-[320px] snap-start flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="grid place-items-center w-14 h-14 rounded-xl bg-purple-50 flex-shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="3" stroke="#8b5cf6" strokeWidth="1.5" />
                <path d="M2 10h20" stroke="#8b5cf6" strokeWidth="1.5" />
                <circle cx="17" cy="14" r="1.5" stroke="#8b5cf6" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-slate-800 leading-tight">15% off up to ₹200</p>
              <p className="mt-1 text-xs text-slate-400 leading-snug">
                Use code <span className="font-semibold text-purple-500">AXISCC</span>
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                On orders above ₹499 with Axis credit cards
              </p>
            </div>
          </div>

          {/* DEAL 5 */}
          <div className="flex-shrink-0 w-[320px] snap-start flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="grid place-items-center w-14 h-14 rounded-xl bg-red-50 flex-shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-slate-800 leading-tight">Free delivery</p>
              <p className="mt-1 text-xs text-slate-400 leading-snug">
                Use code <span className="font-semibold text-red-500">FREEDEL</span>
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Free delivery on your next 3 orders above ₹199
              </p>
            </div>
          </div>

          {/* DEAL 6 */}
          <div className="flex-shrink-0 w-[320px] snap-start flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="grid place-items-center w-14 h-14 rounded-xl bg-amber-50 flex-shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="3" stroke="#f59e0b" strokeWidth="1.5" />
                <path d="M2 10h20" stroke="#f59e0b" strokeWidth="1.5" />
                <path d="M6 14h2" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10 14h4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-slate-800 leading-tight">₹75 cashback</p>
              <p className="mt-1 text-xs text-slate-400 leading-snug">
                Use code <span className="font-semibold text-amber-500">ICICICB</span>
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Pay with ICICI Bank debit card on orders ₹399+
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MENU HEADING */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex-1 h-px bg-slate-300"></div>
        <h2 className="px-6 text-2xl font-extrabold text-slate-800 tracking-wide">MENU</h2>
        <div className="flex-1 h-px bg-slate-300"></div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mb-0">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search for dishes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-10 py-4 bg-white rounded-2xl border border-slate-200 
                     shadow-sm text-slate-700 placeholder-slate-400
                     focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent
                     transition duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* VEG / NON-VEG FILTERS */}
      <div className="mb-6 px-6 py-4 rounded-2xl">
        <div className="flex items-center gap-6 flex-wrap" style={{ justifyContent: "start" }}>
          <label className="veg-switch veg flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox"
              checked={vegOnly}
              onChange={handleVegToggle}
            />
            <div className="slider" />
          </label>

          <label className="veg-switch nonveg flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox"
              checked={nonVegOnly}
              onChange={handleNonVegToggle}
            />
            <div className="slider" />
          </label>
        </div>
      </div>

      {/* SEARCH RESULTS INFO */}
      {searchQuery && (
        <div className="mb-4 px-2">
          <p className="text-sm text-slate-500">
            {Object.values(grouped).flat().length} results for "{searchQuery}"
          </p>
        </div>
      )}

      {/* NO RESULTS MESSAGE */}
      {Object.keys(grouped).length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full grid place-items-center">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No items found</h3>
          <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* MENU ITEMS */}
      {Object.entries(grouped).map(([cuisine, items]) => {
        const  isOpen = openCuisines.includes(cuisine);

        return (
          <div key={cuisine} className="mb-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

              {/* HEADER */}
              <button
                onClick={() => toggleCuisine(cuisine)}
                className={`w-full flex justify-between items-center px-6 py-4 
                           hover:shadow-s transition-shadow duration-200 
                            ${open ? "border-b border-slate-200" : ""}`}
              >
                <span className="text-lg font-bold text-slate-800">
                  {cuisine}{" "}
                  <span className="text-slate-400 text-sm font-normal">
                    ({items.length})
                  </span>
                </span>
                <span className="text-2xl font-semibold text-slate-600">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {/* ANIMATED CONTENT */}
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  isOpen ? "max-h-[5000px] opacity-100 mt-3" : "max-h-0 opacity-0"
                }`}
              >
                {items.map((item, index) => {
                  const isBestSeller = item._id === globalBestSellerId;
                  const isTopRated = item._id === globalTopRatedId;
                  const isLast = index === items.length - 1;

                  return (
                    <div
                      key={item._id}
                      onClick={() => rememberViewedItem(item._id)}
                      className={`flex items-start justify-between gap-6 px-6 py-3 hover:bg-slate-50/50
                                  transition-colors duration-200 cursor-pointer group
                                  ${!isLast ? "border-b border-slate-200" : ""}`}
                    >
                      {/* LEFT — DETAILS */}
                      <div className="flex-1 min-w-0  text-left">

                        {/* VEG/NON-VEG + BADGES */}
                        <div className="flex items-center gap-2 mb-2">
                          {item.veg ? (
                            <div className="w-[18px] h-[18px] border-[1.5px] border-green-700 grid place-items-center rounded-sm flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-green-700" />
                            </div>
                          ) : (
                            <div className="w-[18px] h-[18px] border-[1.5px] border-red-700 grid place-items-center rounded-sm flex-shrink-0">
                              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-700" />
                            </div>
                          )}

                          {isBestSeller && (
                            <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                  fill="#f59e0b"
                                  stroke="#f59e0b"
                                  strokeWidth="1.5"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span className="text-[12px] font-bold text-amber-700 uppercase tracking-wide leading-none">
                                Bestseller
                              </span>
                            </div>
                          )}

                          {isTopRated && (
                            <div className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M12 15l-3.09 1.62.59-3.45L7 10.74l3.46-.5L12 7l1.54 3.24 3.46.5-2.5 2.43.59 3.45L12 15z"
                                  fill="#3b82f6"
                                  stroke="#3b82f6"
                                  strokeWidth="1.5"
                                  strokeLinejoin="round"
                                />
                                <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.5" fill="none" />
                              </svg>
                              <span className="text-[12px] font-bold text-blue-700 uppercase tracking-wide leading-none">
                                Top Rated
                              </span>
                            </div>
                          )}
                        </div>

                        {/* NAME */}
                        <h3 className="text-base font-bold text-slate-900 leading-tight mb-1">
                          {item.name}
                        </h3>

                        {/* PRICE */}
                        <p className="text-[15px] font-semibold text-slate-800 mb-1.5">
                          ₹{item.price}
                        </p>

                        {/* RATING */}
                        {item.rating && (
                          <div className="inline-flex items-center gap-1 mb-2">
                            <span className="text-green-700 text-sm leading-none">★</span>
                            <span className="text-sm font-bold text-green-700 leading-none">
                              {item.rating}
                            </span>
                            <span className="text-xs text-slate-400 leading-none ml-0.5">
                              ({item.totalReviews || 0})
                            </span>
                          </div>
                        )}

                        {/* DESCRIPTION */}
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                          {item.description || "Popular item — try it now!"}
                        </p>
                      </div>

                      {/* RIGHT — IMAGE + ADD BUTTON */}
                      <div className="flex-shrink-0 w-[150px] flex flex-col items-center">
                        <div className="relative w-[150px] pb-5">
                          <div className="h-[140px] w-[150px] rounded-2xl overflow-hidden bg-slate-100">
                            <img
                              src={resolveItemImage(item)}
                              onError={handleImgError}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[110px]">
                            {getQty(item._id) === 0 ? (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  rememberViewedItem(item._id);
                                  dispatch(
                                    addToCart({
                                      menu_item_id: item._id,
                                      name: item.name,
                                      price: item.price,
                                      restaurant_id: item.restaurant_id,
                                      image: item.image,
                                    })
                                  );
                                }}
                                className="w-full h-10 bg-white text-green-600 text-sm font-extrabold rounded-lg
                                           shadow-md border border-slate-200 uppercase tracking-wide
                                           hover:bg-green-50 hover:border-green-300 hover:shadow-lg
                                           active:scale-95 transition-all duration-200"
                              >
                                ADD
                              </button>
                            ) : (
                              <div className="w-full h-10 bg-white text-green-600 rounded-lg shadow-md border border-slate-200
                                              grid grid-cols-3 place-items-center font-extrabold">
                                <button
                                  className="w-full h-full grid place-items-center text-lg hover:bg-green-50 rounded-l-lg
                                             transition-colors duration-150"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    rememberViewedItem(item._id);
                                    dispatch(decreaseQty(item._id));
                                  }}
                                >
                                  <span className="block leading-none">−</span>
                                </button>
                                <span className="text-sm">{getQty(item._id)}</span>
                                <button
                                  className="w-full h-full grid place-items-center text-lg hover:bg-green-50 rounded-r-lg
                                             transition-colors duration-150"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    rememberViewedItem(item._id);
                                    dispatch(
                                      addToCart({
                                        menu_item_id: item._id,
                                        name: item.name,
                                        price: item.price,
                                        restaurant_id: item.restaurant_id,
                                        image: item.image,
                                      })
                                    );
                                  }}
                                >
                                  <span className="block leading-none">+</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-1">Customisable</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}