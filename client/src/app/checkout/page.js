"use client";

import { useSelector, useDispatch } from "react-redux";
import {
  selectCartItems,
  selectCartTotal,
  addToCart,
  removeFromCart,
  clearCart,
} from "../../store/slices/cartSlice";
import { useRouter } from "next/navigation";
import api from "../../lib/axios";
import { useEffect, useState } from "react";
import { resolveItemImage, handleImgError } from "../../lib/imageUtils";

export default function CheckoutPage() {
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const dispatch = useDispatch();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  // const imgSrc = ;
  const getItemImg = (restaurantId, name) => {
  if (!restaurantId || !name) return null;
  const formatted = name.trim().replace(/\s+/g, "_");
  return `${BASE_URL}/images/${restaurantId}_${formatted}.jpg`;
};
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const formattedItems = items.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
      }));

      const res = await api.post("/orders", {
        items: formattedItems,
        total_amount: total + 40,
      });

      const orderId = res.data.data._id;
      dispatch(clearCart());
      router.push(`/orders/${orderId}`);
    } catch (err) {
      console.error("ORDER ERROR:", err.response?.data || err.message);
      setLoading(false);
    }
  };

  if (!mounted) return null;

  /* ───────── EMPTY CART ───────── */
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center max-w-md">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Your cart is empty
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Looks like you haven't added anything yet. Let's find something delicious!
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition shadow-md shadow-green-200"
          >
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  /* ───────── CHECKOUT PAGE ───────── */
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-left">
      <div className="max-w-6xl mx-auto">

        {/* HEADER — ✅ justify-start + text-left */}
        <div className="flex items-center justify-start gap-3 mb-6 text-left">
          <span className="text-4xl">🛒</span>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-slate-800 text-right">Checkout</h1>
            <p className="text-sm text-slate-400 mt-0.5 text-right">
              Review your order and confirm
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ───── CART ITEMS (LEFT) ───── */}
          <div className="lg:col-span-2 space-y-6">

            {/* CART CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left">
              {/* HEADER ROW — ✅ explicit justify-between to anchor sides */}
              <div className="flex items-center justify-between gap-2 mb-5">
                <div className="flex items-center justify-start gap-2">
                  <span className="text-xl">🛍️</span>
                  <h2 className="text-lg font-semibold text-slate-800 text-left">
                    Your Cart
                  </h2>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>

              {/* ITEMS LIST */}
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div
                    key={item.menu_item_id}
                    className="flex items-center justify-start gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    {/* IMAGE */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                     {/* <img
  src={getItemImg(restaurantId, item.menu_item_id.name)}
  alt={item.name}
  onError={handleImgError}
  className="w-full h-full object-cover"
/> */}


<img  
         src={resolveItemImage({
  restaurant_id: item.restaurant_id || item.menu_item_id,
  name: item.name,
  image: item.image
})}
          onError={handleImgError}
          alt={item.name}
            // className="w-full h-full object-cover"

          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
                    </div>

                    {/* INFO */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-slate-800 truncate text-left">
                        {item.name}
                      </p>
                      <p className="text-sm text-slate-400 mt-0.5 text-left">
                        ₹{item.price} each
                      </p>
                    </div>

                    {/* QUANTITY */}
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 flex-shrink-0">
                      <button
                        onClick={() =>
                          dispatch(removeFromCart(item.menu_item_id))
                        }
                        className="w-8 h-8 rounded-lg bg-white hover:bg-red-50 hover:text-red-600 text-slate-600 font-bold transition flex items-center justify-center shadow-sm"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-semibold text-slate-800 text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => dispatch(addToCart(item))}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-green-50 hover:text-green-600 text-slate-600 font-bold transition flex items-center justify-center shadow-sm"
                      >
                        +
                      </button>
                    </div>

                    {/* PRICE */}
                    <div className="text-right min-w-[70px] flex-shrink-0">
                      <p className="font-bold text-slate-800">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DELIVERY ADDRESS CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left">
              <div className="flex items-center justify-start gap-2 mb-4">
                <span className="text-xl">📍</span>
                <h2 className="text-lg font-semibold text-slate-800 text-left">
                  Delivery Address
                </h2>
              </div>

              <div className="flex items-center justify-start gap-3 p-4 bg-slate-50 rounded-xl">
                <span className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-lg flex-shrink-0">
                  🏠
                </span>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-slate-800 text-left">Home</p>
                  <p className="text-sm text-slate-500 mt-0.5 text-left">
                    Default delivery location
                  </p>
                </div>
                <button className="text-sm text-green-600 hover:text-green-700 font-semibold flex-shrink-0">
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* ───── ORDER SUMMARY (RIGHT) ───── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:sticky lg:top-6 text-left">

              {/* HEADER */}
              <div className="flex items-center justify-start gap-2 mb-5">
                <span className="text-xl">🧾</span>
                <h2 className="text-lg font-semibold text-slate-800 text-left">
                  Order Summary
                </h2>
              </div>

              {/* PRICE BREAKDOWN */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-800">₹{total}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Delivery Fee</span>
                  <span className="font-semibold text-slate-800">₹40</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Taxes & Charges</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="border-t border-dashed border-slate-200 my-4"></div>

              {/* TOTAL */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-base font-semibold text-slate-800">
                  Total
                </span>
                <span className="text-2xl font-bold text-slate-800">
                  ₹{total + 40}
                </span>
              </div>

              {/* SAVINGS BADGE */}
              <div className="flex items-center justify-start gap-2 p-3 bg-green-50 border border-green-100 rounded-xl mb-5">
                <span className="text-lg flex-shrink-0">🎉</span>
                <p className="text-xs text-green-700 font-medium text-left">
                  You're saving ₹20 on this order!
                </p>
              </div>

              {/* CHECKOUT BUTTON */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3.5 p-9 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white font-semibold rounded-xl transition shadow-md shadow-green-200 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order
                    <span>→</span>
                  </>
                )}
              </button>

              {/* SECURE NOTE */}
              <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
                <span>🔒 Secure & encrypted checkout</span> 
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}