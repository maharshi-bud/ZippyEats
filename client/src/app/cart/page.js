"use client";

import { useSelector, useDispatch } from "react-redux";
import {
  selectCartItems,
  selectCartTotal,
  removeFromCart
} from "../../store/slices/cartSlice";
import Link from "next/link";

export default function CartPage() {
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const dispatch = useDispatch();

  return (
    <div>
      <h1>Your Cart</h1>

      {items.map((item) => (
        <div className="card" key={item.menu_item_id}>
          <h3>{item.name}</h3>
          <p>Qty: {item.quantity}</p>

          <button
            className="btn"
            onClick={() => dispatch(removeFromCart(item.menu_item_id))}
          >
            Remove
          </button>
        </div>
      ))}

      <h2>Total: ₹{total}</h2>

      <Link href="/checkout">
        <button className="btn">Checkout</button>
      </Link>
    </div>
  );
}