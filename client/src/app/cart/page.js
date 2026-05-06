"use client";

import { useSelector, useDispatch } from "react-redux";
import {
  selectCartItems,
  selectCartTotal,
  addToCart,
  removeFromCart,decreaseQty
} from "../../store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "../../lib/axios";
import { startRouteLoader } from "../../lib/routeLoading";

export default function CartPage() {
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const dispatch = useDispatch();
  const router = useRouter();

  // 🔥 FIX
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // ⛔ prevent SSR mismatch

  return (
    <div className="cart1-container">

      {/* 🛒 CART */}
      <div className="cart1-card cart1-cart">
        <label className="cart1-title">Your cart</label>

        <div className="cart1-products">
          {items.map((item) => (
            <div className="cart1-product" key={item.menu_item_id}>

              <div>
                <span>{item.name}</span>
                <p>Qty: {item.quantity}</p>
              </div>

              <div className="cart1-quantity">
                <button
                  onClick={() =>
                    dispatch(decreaseQty(item.menu_item_id))
                  }
                >
                  -
                </button>

                <label>{item.quantity}</label>

                <button
                  onClick={() =>
                    dispatch(addToCart(item))
                  }
                >
                  +
                </button>
              </div>

              <label className="cart1-price">
                ₹{item.price * item.quantity}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* 💳 CHECKOUT */}
      <div className="cart1-card cart1-checkout">
        <label className="cart1-title">Checkout</label>

        <div className="cart1-details">
          <span>Subtotal</span>
          <span>₹{total}</span>

          <span>Delivery</span>
          <span>₹40</span>
        </div>

        <div className="cart1-footer">
          <label className="cart1-total">₹{total + 40}</label>

          <button
            className="cart1-btn"

            onClick={async () => {
  try {
    const formattedItems = items.map((item) => ({
      menu_item_id: item.menu_item_id,
      quantity: item.quantity
    }));

    const res = await api.post("/orders", {
      items: formattedItems,
      total_amount: total + 40
    });

    const orderId = res.data.data._id;

    startRouteLoader();
    router.push(`/orders/${orderId}`);
  } catch (err) {
    console.error("ORDER ERROR:", err.response?.data || err.message);
  }
}}


          >
            Checkout
          </button>
        </div>
      </div>

    </div>
  );
}
