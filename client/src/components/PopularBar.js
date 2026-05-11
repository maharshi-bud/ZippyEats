"use client";

import { useEffect, useState, useRef } from "react";
import api from "../lib/axios";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, decreaseQty } from "../store/slices/cartSlice";
import { resolveItemImage, handleImgError } from "../lib/imageUtils";
import { useRouter } from "next/navigation";

const CARD_W = 200; // 180px card + 20px gap

export default function PopularBar() {
  const [items, setItems] = useState([]);
  const dispatch = useDispatch();
  const cart = useSelector((s) => s.cart.items);
  const router = useRouter();
  const trackRef = useRef(null);
  const timerRef = useRef(null);
  const isPaused = useRef(false);

  useEffect(() => {
    api.get("/menu/popular")
      .then((res) => setItems(res.data.data || []))
      .catch(console.error);
  }, []);

  // start at middle copy
  useEffect(() => {
    if (!items.length || !trackRef.current) return;
    const el = trackRef.current;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = items.length * CARD_W;
    el.style.scrollBehavior = "smooth";
  }, [items.length]);

  // auto-scroll every 4s
  useEffect(() => {
    if (!items.length) return;

    timerRef.current = setInterval(() => {
      if (isPaused.current || !trackRef.current) return;
      const el = trackRef.current;

      el.style.scrollBehavior = "smooth";
      el.scrollLeft += CARD_W;

      if (el.scrollLeft >= items.length * 2 * CARD_W) {
        setTimeout(() => {
          if (!trackRef.current) return;
          trackRef.current.style.scrollBehavior = "auto";
          trackRef.current.scrollLeft = items.length * CARD_W;
          requestAnimationFrame(() => {
            if (trackRef.current)
              trackRef.current.style.scrollBehavior = "smooth";
          });
        }, 400);
      }
    }, 4000);

    return () => clearInterval(timerRef.current);
  }, [items.length]);

  const manualScroll = (dir) => {
    if (!trackRef.current || !items.length) return;
    const el = trackRef.current;

    el.style.scrollBehavior = "smooth";
    el.scrollLeft += dir * CARD_W;

    if (el.scrollLeft >= items.length * 2 * CARD_W) {
      setTimeout(() => {
        if (!trackRef.current) return;
        trackRef.current.style.scrollBehavior = "auto";
        trackRef.current.scrollLeft = items.length * CARD_W;
        requestAnimationFrame(() => {
          if (trackRef.current)
            trackRef.current.style.scrollBehavior = "smooth";
        });
      }, 400);
    }
    if (el.scrollLeft <= 0) {
      setTimeout(() => {
        if (!trackRef.current) return;
        trackRef.current.style.scrollBehavior = "auto";
        trackRef.current.scrollLeft = items.length * CARD_W;
        requestAnimationFrame(() => {
          if (trackRef.current)
            trackRef.current.style.scrollBehavior = "smooth";
        });
      }, 400);
    }
  };

  // triple items for seamless loop
  const looped = items.length ? [...items, ...items, ...items] : [];

  return (
    <div className="p-5 pb-3">

      {/* header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-extrabold text-slate-900">
          🔥 Popular Near You
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => manualScroll(-1)}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm
                       grid place-items-center text-slate-600 text-lg
                       hover:bg-slate-50 transition"
          >
            <span className="block -mt-px">‹</span>
          </button>
          <button
            onClick={() => manualScroll(1)}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm
                       grid place-items-center text-slate-600 text-lg
                       hover:bg-slate-50 transition"
          >
            <span className="block -mt-px">›</span>
          </button>
        </div>
      </div>

      {/* track */}
      <div
  ref={trackRef}
  onMouseEnter={() => (isPaused.current = true)}
  onMouseLeave={() => (isPaused.current = false)}
  className="flex gap-5 overflow-x-auto pt-2.5 snap-x snap-mandatory scroll-smooth
             [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
>
        {looped.map((item, i) => {
          const inCart = cart.find((c) => c.menu_item_id === item._id);
          return (
            <div
              key={`${item._id}-${i}`}
                className="flex-shrink-0 min-w-[180px] mb-2.5 bg-transparent snap-start
"
            >

              {/* IMAGE + BUTTONS — no navigation */}
              <div className="h-40 relative rounded-xl">
                <div className="h-40 max-w-[180px] rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={resolveItemImage(item)}
                    alt={item.name}
                    onError={handleImgError}
                    className="w-full h-full object-cover block"
                  />
                </div>

                {/* add / stepper */}
                <div className="absolute -bottom-[7px] right-[-7px]">
                  {!inCart ? (
                    <button
                      onClick={() => dispatch(addToCart({
                        menu_item_id: item._id,
                        name: item.name,
                        price: item.price,
                        restaurant_id: item.restaurant_id,
                        image: item.image,
                      }))}
                      className="h-[30px] px-3 bg-gray-900 text-white text-base rounded-md
                                 cursor-pointer hover:bg-gray-800 transition-colors duration-200
                                 flex items-center justify-center"
                      style={{ lineHeight: 1 }}
                    >Add</button>
                  ) : (
                    <div className="h-[30px] min-w-[78px] bg-gray-900 text-white rounded-md
                                    grid grid-cols-3 place-items-center px-2">
                      <button
                        onClick={() => dispatch(decreaseQty(item._id))}
                        className="w-5 h-5 grid place-items-center text-white text-base
                                   hover:opacity-70 cursor-pointer bg-transparent border-none"
                      >
                        <span className="block leading-none">−</span>
                      </button>
                      <span className="text-base leading-none">{inCart.quantity}</span>
                      <button
                        onClick={() => dispatch(addToCart({
                          menu_item_id: item._id,
                          name: item.name,
                          price: item.price,
                          restaurant_id: item.restaurant_id,
                          image: item.image,
                        }))}
                        className="w-5 h-5 grid place-items-center text-white text-base
                                   hover:opacity-70 cursor-pointer bg-transparent border-none"
                      >
                        <span className="block leading-none">+</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ INFO — only this navigates */}
              <div
                className="mt-3 px-0.5 cursor-pointer"
                onClick={() => router.push(`/restaurant/${item.restaurant_id}`)}
              >
                {/* veg/non-veg + rating */}
                <div className="flex items-center gap-2 mb-1">
                  {item.veg ? (
                    <div className="w-[14px] h-[14px] border-[2px] border-green-700 grid place-items-center rounded-[4px] flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-700" />
                    </div>
                  ) : (
                    <div className="w-[14px] h-[14px] border-[2px] border-red-700 grid place-items-center rounded-[4px] flex-shrink-0">
                      <div className="w-0 h-0 border-l-[3.5px] border-r-[3.5px] border-b-[6px] border-l-transparent border-r-transparent border-b-red-700" />
                    </div>
                  )}

                  {item.rating && (
                    <div className="inline-flex items-center gap-0.5">
                      <span className="text-green-700 text-xs leading-none">★</span>
                      <span className="text-xs font-bold text-green-700 leading-none">
                        {item.rating}
                      </span>
                      {item.totalReviews ? (
                        <span className="text-[11px] text-slate-400 leading-none ml-0.5">
                          ({item.totalReviews})
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-slate-800 truncate">
                  {item.name}
                </h3>
                <p className="text-[13px] text-[#555] mt-0.5">₹{item.price}</p>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}