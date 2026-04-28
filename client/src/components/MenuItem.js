"use client";

import { useDispatch } from "react-redux";
import { addToCart } from "../store/slices/cartSlice";

export default function MenuItem({ item }) {
  const dispatch = useDispatch();

  return (
    <div className="card">
      <h4>{item.name}</h4>
      <p>{item.description}</p>
      <p>₹{item.price}</p>

      <button
        className="btn"
        onClick={() => dispatch(addToCart(item))}
      >
        Add
      </button>
    </div>
  );
}