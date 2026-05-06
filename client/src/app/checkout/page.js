"use client";

import { useSelector, useDispatch } from "react-redux";
import { selectCartItems, selectCartTotal, addToCart, removeFromCart, clearCart, decreaseQty } from "../../store/slices/cartSlice";
import { useRouter } from "next/navigation";
import api from "../../lib/axios";
import { useEffect, useState } from "react";

const BASE_URL = "http://localhost:5010";

const getItemImg = (item) => {
  if (item.image) return item.image;
  if (item.restaurant_id && item.name) {
    const formatted = item.name.trim().replace(/\s+/g, "_");
    return `${BASE_URL}/images/${item.restaurant_id}_${formatted}.jpg`;
  }
  return null;
};

const IconBox = ({ emoji, bg }) => (
  <div
    className={`${bg} rounded-xl flex-shrink-0`}
    style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}
  >
    {emoji}
  </div>
);

export default function CheckoutPage() {
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const dispatch = useDispatch();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const res = await api.post("/orders", {
        items: items.map((item) => ({ menu_item_id: item.menu_item_id, quantity: item.quantity })),
        total_amount: total + 40,
      });
      dispatch(clearCart());
      router.push(`/orders/${res.data.data._id}`);
    } catch (err) {
      console.error("ORDER ERROR:", err.response?.data || err.message);
      setLoading(false);
    }
  };

  if (!mounted) return null;

  /* EMPTY CART */
  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center">

  <div className="w-full max-w-md mx-auto ">
    
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-10 text-center">

      <div className="text-6xl mb-4">🛒</div>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        Your cart is empty
      </h2>

      <p className="text-sm text-slate-500 mb-6">
        Looks like you haven't added anything yet.
      </p>

      <button
        onClick={() => router.push("/")}
        className="px-6 py-3 bg-green-500 text-white text-sm font-semibold rounded-xl shadow-md active:scale-95"
      >
        Browse Restaurants
      </button>

    </div>

  </div>

</div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* ✅ HEADER — icon left, text left, all in a row */}
        <div className="flex items-center gap-3 mb-6">
          <div className=" text-Start">
            <h1 className="text-2xl font-bold text-slate-800 ">Checkout</h1>
            <p className="text-sm text-slate-400 mt-0.5">Review your order and confirm</p>
          </div>
          <span style={{ fontSize: 42 }}>🛒</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* CART ITEMS */}
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              {/* ✅ Cart heading row */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 20 }}>🛍️</span>
                  <h2 className="text-lg font-semibold text-slate-800">Your Cart</h2>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const imgSrc = getItemImg(item);
                  return (
                    <div key={item.menu_item_id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">

                      {/* IMAGE */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={item.name}
                            onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🍽️</div>
                        )}
                      </div>

                      {/* INFO */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                        <p className="text-sm text-slate-400 mt-0.5">₹{item.price} each</p>
                      </div>

                      {/* STEPPER */}
                    <div className="flex items-center  rounded-xl p-1.5 flex-shrink-0 shadow-inner">

  {/* MINUS */}
  <button
    onClick={() => dispatch(decreaseQty(item.menu_item_id))}
    className="w-8 h-8 rounded-lg bg-white text-slate-700 font-bold 
               shadow-md border border-slate-200 
               active:scale-95 active:shadow-sm 
               transition-all duration-150"
    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
  >
    −
  </button>

  {/* QTY */}
  <span className="w-8 text-center font-semibold text-slate-800 text-sm">
    {item.quantity}
  </span>

  {/* PLUS */}
  <button
    onClick={() => dispatch(addToCart(item))}
    className="w-8 h-8 rounded-lg bg-white text-slate-700 font-bold 
               shadow-md border border-slate-200 
               active:scale-95 active:shadow-sm 
               transition-all duration-150"
    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
  >
    +
  </button>

</div>

                      {/* PRICE */}
                      <p className="font-bold text-slate-800 min-w-[60px] text-right flex-shrink-0">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DELIVERY ADDRESS */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span style={{ fontSize: 20 }}>📍</span>
                <h2 className="text-lg font-semibold text-slate-800">Delivery Address</h2>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <IconBox emoji="🏠" bg="bg-green-100" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">Home</p>
                  <p className="text-sm text-slate-500 mt-0.5">Default delivery location</p>
                </div>
                <button className="text-sm text-green-600 hover:text-green-700 font-semibold flex-shrink-0">Change</button>
              </div>
            </div>

          </div>

          {/* ORDER SUMMARY */}
          <div className="lg:col-span-1  ">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 lg:sticky lg:top-20">

              {/* ✅ Summary heading — icon left, text left */}
              <div className="flex items-center gap-2 mb-5">
                <span style={{ fontSize: 20 }}>🧾</span>
                <h2 className="text-lg font-semibold text-slate-800">Order Summary</h2>
              </div>

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

              <div className="border-t border-dashed border-slate-200 my-4"></div>

              <div className="flex items-center justify-between mb-5">
                <span className="text-base font-semibold text-slate-800">Total</span>
                <span className="text-2xl font-bold text-slate-800">₹{total + 40}</span>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl mb-5">
                <span style={{ fontSize: 18, flexShrink: 0 }}>🎉</span>
                <p className="text-xs text-green-700 font-medium">You're saving ₹20 on this order!</p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3.5 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 p-10 text-white font-semibold rounded-xl transition shadow-md shadow-green-200 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin "></span>
                    Placing Order...
                  </>
                ) : (
                  <>Place Order <span>→</span></>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 mt-4">🔒 Secure & encrypted checkout</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}