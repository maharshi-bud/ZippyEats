"use client";

import { useSelector, useDispatch } from "react-redux";
import {
  selectCartItems,
  selectCartTotal,
  addToCart,
  removeFromCart
} from "../../store/slices/cartSlice";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const dispatch = useDispatch();
  const router = useRouter();

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
                    dispatch(removeFromCart(item.menu_item_id))
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
            onClick={() => router.push("/checkout")}
          >
            Checkout
          </button>
        </div>
      </div>

    </div>
  );
}