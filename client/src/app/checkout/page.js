// app/checkout/page.jsx
"use client";

import { useSelector, useDispatch } from "react-redux";
import {
  selectCartItems,
  selectCartTotal,
  addToCart,
  removeFromCart,
  clearCart,
  decreaseQty,
} from "../../store/slices/cartSlice";
import { selectLocation } from "../../store/slices/locationSlice";
import { useRouter } from "next/navigation";
import api from "../../lib/axios";
import { useEffect, useState } from "react";
import { startRouteLoader } from "../../lib/routeLoading";
import { resolveItemImage, handleImgError } from "../../lib/imageUtils";

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
    style={{
      width: 36,
      height: 36,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16,
    }}
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

  // ✅ Read location from Redux (same source as Navbar)
  const deliveryAddress = useSelector(selectLocation);

  useEffect(() => {
    setMounted(true);
  }, []);

const handleCheckout = async () => {
  try {
    setLoading(true);

    if (!items.length) return;

    const firstItem = items[0];

    const subtotal = total;
    const deliveryFee = 40;
    const taxAmount = 0;

    const finalTotal =
      subtotal + deliveryFee + taxAmount;

    // ✅ ETA = 35 mins
    const eta = new Date(
      Date.now() + 35 * 60 * 1000
    );

    // ✅ Auto timeout after 1 hour
    const timeoutAt = new Date(
      Date.now() + 60 * 60 * 1000
    );

    const payload = {
      // RESTAURANT
      restaurant_id:
        firstItem.restaurant_id,

      restaurant_name:
        firstItem.restaurant_name ||
        "Restaurant",

      // ITEMS SNAPSHOT
      items: items.map((item) => ({
        menu_item_id:
          item.menu_item_id,

        name: item.name,

        image: item.image,

        quantity: item.quantity,

        price: item.price,

        veg: item.veg ?? true,
      })),

      // PAYMENT
      payment_method: "cod",

      payment_status: "pending",

      // PRICE
      subtotal: subtotal,

      delivery_fee: deliveryFee,

      tax_amount: taxAmount,

      total_amount: finalTotal,

      // ADDRESS
      delivery_address: {
        full_name: "Customer",

        phone: "0000000000",

        address_line:
          deliveryAddress,

        city: "Ahmedabad",

        state: "Gujarat",

        country: "India",

        pincode: "380001",
      },

      // EXTRA
      instructions: "",

      // ETA
      eta,

      timeout_at: timeoutAt,
    };

    console.log(
      "ORDER PAYLOAD:",
      payload
    );

    const res = await api.post(
      "/orders",
      payload
    );

    dispatch(clearCart());

    startRouteLoader();

    router.push(
      `/orders/${res.data.data._id}`
    );

  } catch (err) {
    console.error(
      "ORDER ERROR:",
      err.response?.data || err.message
    );

    setLoading(false);
  }
};

  if (!mounted) return null;

  /* EMPTY CART */
  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-10 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Your cart is empty
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Looks like you haven&apos;t added anything yet.
            </p>
            <button
              onClick={() => {
                startRouteLoader();
                router.push("/");
              }}
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
        {/* ✅ HEADER */}
        <div className="flex items-center gap-3 mb-0">
          <div className="text-Start">
            <h1 className="text-5xl font-bold text-slate-800 mb-0 text-shadow-xl">Checkout</h1>
            <p className="text-sm text-slate-400 mt-0.5 mb-0 ml-1">
              Review your order and confirm
            </p>
          </div>
          <span style={{ fontSize: 56 }}>🛒</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 ">
          {/* CART ITEMS */}
          <div className="lg:col-span-2 space-y-6 ">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 shadow-l">
              {/* Cart heading row */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 20 }}>🛍️</span>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Your Cart
                  </h2>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  console.log("CHECKOUT ITEM:", item);
                  // const imgSrc = getItemImg(item);
                  return (
                    <div
                      key={item.menu_item_id}
                      className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      {/* IMAGE */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        <img
  src={item.image}
  alt={item.name}
  className="w-full h-full object-cover"
  onError={handleImgError}
/>
                      </div>

                      {/* INFO */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {item.name}
                        </p>
                        <p className="text-sm text-slate-400 mt-0.5">
                          ₹{item.price} each
                        </p>
                      </div>

                      {/* STEPPER */}
                      <div className="flex items-center rounded-xl p-1.5 flex-shrink-0 shadow-inner">
                        <button
                          onClick={() =>
                            dispatch(decreaseQty(item.menu_item_id))
                          }
                          className="w-8 h-8 rounded-lg bg-white text-slate-700 font-bold shadow-md border border-slate-200 active:scale-95 active:shadow-sm transition-all duration-150"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-semibold text-slate-800 text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => dispatch(addToCart(item))}
                          className="w-8 h-8 rounded-lg bg-white text-slate-700 font-bold shadow-md border border-slate-200 active:scale-95 active:shadow-sm transition-all duration-150"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
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

            {/* ✅ DELIVERY ADDRESS — Now reads from Redux */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 shadow-l">
              <div className="flex items-center gap-2 mb-4">
                <span style={{ fontSize: 20 }}>📍</span>
                <h2 className="text-lg font-semibold text-slate-800">
                  Delivery Address
                </h2>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <IconBox emoji="🏠" bg="bg-green-100" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">
                    Delivering to
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {deliveryAddress}
                  </p>
                </div>
                <button
                  onClick={() => {
                    startRouteLoader();
                    router.push("/");
                  }}
                  className="text-sm text-green-600 hover:text-green-700 font-semibold flex-shrink-0"
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* ORDER SUMMARY */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 lg:sticky lg:top-20">
              <div className="flex items-center gap-2 mb-5">
                <span style={{ fontSize: 20 }}>🧾</span>
                <h2 className="text-lg font-semibold text-slate-800">
                  Order Summary
                </h2>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-800">
                    ₹{total}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Delivery Fee</span>
                  {/* <span className="font-semibold text-slate-800">₹40</span> */}
                  <div className="flex items-center gap-2">
  {/* OLD PRICE */}
  <span className="text-xs text-slate-400 line-through">
    ₹60
  </span>

  {/* NEW PRICE */}
  <span className="font-semibold text-slate-800">
    ₹40
  </span>
</div>
                </div>


                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Platform Fee</span>
                  {/* <span className="font-semibold text-slate-800">₹40</span> */}
                  <div className="flex items-center gap-2">
  {/* OLD PRICE */}
  <span className="text-xs text-slate-400 line-through">
    ₹20
  </span>

  {/* NEW PRICE */}
  <span className="font-semibold text-slate-800">
    ₹0
  </span>
</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Taxes & Charges</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 my-4"></div>

              {/* ✅ Delivery location in summary too */}
              <div className="flex items-center gap-2 mb-4 p-2.5 bg-slate-50 rounded-lg">
                <span style={{ fontSize: 14 }}>📍</span>
                <p className="text-xs text-slate-500 truncate">
                  Delivering to:{" "}
                  <span className="font-semibold text-slate-700">
                    {deliveryAddress}
                  </span>
                </p>
              </div>
<div className="flex items-center justify-between mb-5">
  {/* LEFT */}
  <span className="text-base font-semibold text-slate-800">
    Total
  </span>

  {/* RIGHT */}
  <div className="flex items-center gap-2">
    {/* OLD PRICE */}
    <span className="text-m  text-slate-400 line-through">
      ₹{total + 80}
    </span>

    {/* NEW PRICE */}
    <span className="text-2xl font-bold text-slate-800">
      ₹{total + 40}
    </span>
  </div>
</div>

              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl mb-5">
                <span style={{ fontSize: 18, flexShrink: 0 }}>🎉</span>
                <p className="text-xs text-green-700 font-medium">
                  You&apos;re saving ₹40 on this order!
                </p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3.5 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 p-10 text-white font-semibold rounded-xl transition shadow-md shadow-green-200 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order <span>→</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400 mt-4">
                🔒 Secure & encrypted checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
