"use client";

import { useEffect, useState, useRef } from "react";
import api from "../lib/axios";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, decreaseQty } from "../store/slices/cartSlice";
import { resolveItemImage, handleImgError } from "../lib/imageUtils";

const CARD_W = 200; // 180px card + 20px gap

export default function PopularBar() {
  const [items, setItems] = useState([]);
  const dispatch = useDispatch();
  const cart = useSelector((s) => s.cart.items);
  const trackRef = useRef(null);
  const timerRef = useRef(null);
  const isPaused = useRef(false);

  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("recentlyViewedItems") || "[]");

    if (!ids.length) {
      setItems([]);
      return;
    }

    api.get("/menu/recently-viewed", {
      params: { ids: ids.join(",") },
    })
      .then((res) => setItems(res.data.data || []))
      .catch(console.error);
  }, []);

  // set start position to middle copy once items load
  useEffect(() => {
    if (!items.length || !trackRef.current) return;
    const el = trackRef.current;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = items.length * CARD_W; // start at middle copy
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

      // ✅ if we've entered the 3rd copy — jump invisibly back to middle
      if (el.scrollLeft >= items.length * 2 * CARD_W) {
        setTimeout(() => {
          if (!trackRef.current) return;
          trackRef.current.style.scrollBehavior = "auto";  // no animation
          trackRef.current.scrollLeft = items.length * CARD_W;
          // re-enable smooth after the jump settles
          requestAnimationFrame(() => {
            if (trackRef.current)
              trackRef.current.style.scrollBehavior = "smooth";
          });
        }, 400); // wait for smooth scroll to finish first
      }
    }, 4000);

    return () => clearInterval(timerRef.current);
  }, [items.length]);

  const manualScroll = (dir) => {
    if (!trackRef.current || !items.length) return;
    const el = trackRef.current;

    el.style.scrollBehavior = "smooth";
    el.scrollLeft += dir * CARD_W;

    // wrap forward
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
    // wrap backward
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

  // triple items for seamless loop: [copy1][copy2][copy3]
  const looped = items.length ? [...items, ...items, ...items] : [];

  return (
    <div className="p-5 pb-3">

      {/* header */}
      <div className="flex items-center justify-between ml-[2%] mb-2">
        <h2 className="text-2xl font-extrabold text-slate-900">
🕐 Recently Viewed       </h2>
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
        className="flex gap-5 overflow-x-auto pt-2.5
                   [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {looped.map((item, i) => {
          const inCart = cart.find((c) => c.menu_item_id === item._id);
          return (
            <div key={`${item._id}-${i}`} className="flex-shrink-0 min-w-[180px] mb-2.5 bg-transparent">

              {/* image + floating button */}
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
                <div className="absolute -bottom-4 right-px">
                  {!inCart ? (
                    <button
                      onClick={() => dispatch(addToCart({ menu_item_id: item._id, name: item.name, price: item.price }))}
                      className="h-[30px] px-3 bg-gray-900 text-white text-base rounded-md
                                 cursor-pointer hover:bg-gray-800 transition-colors duration-200
                                 flex items-center justify-center"
                      style={{ lineHeight: 1 }}
                    >Add</button>
                  ) : (
                    <div className="h-[30px] min-w-[78px] bg-gray-900 text-white rounded-md
                                    flex items-center justify-between px-2">
                      <button
                        onClick={() => dispatch(decreaseQty(item._id))}
                        className="flex items-center justify-center text-white text-base
                                   hover:opacity-70 cursor-pointer bg-transparent border-none"
                        style={{ width: 20, height: 20, lineHeight: 1 }}
                      >-</button>
                      <span className="text-base text-center w-5">{inCart.quantity}</span>
                      <button
                        onClick={() => dispatch(addToCart({ menu_item_id: item._id, name: item.name, price: item.price }))}
                        className="flex items-center justify-center text-white text-base
                                   hover:opacity-70 cursor-pointer bg-transparent border-none"
                        style={{ width: 20, height: 20, lineHeight: 1 }}
                      >+</button>
                    </div>
                  )}
                </div>
              </div>

              {/* info */}
              <div className="mt-6 px-0.5">
                <h3 className="text-sm font-semibold text-slate-800 truncate">{item.name}</h3>
                <p className="text-[13px] text-[#555] mt-0.5">₹{item.price}</p>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
