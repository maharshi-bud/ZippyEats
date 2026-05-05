"use client";

import { useDispatch } from "react-redux";
import { addToCart } from "../store/slices/cartSlice";
import { resolveItemImage, handleImgError } from "../lib/imageUtils";

export default function MenuItem({ item }) {
  const dispatch = useDispatch();

  return (
    <div className="card">
      <div className="card-img" style={{ width: "100%", height: "150px", backgroundColor: "#f0f0f0", borderRadius: "8px", overflow: "hidden", marginBottom: "8px" }}>
        <img
          src={resolveItemImage(item)}
          alt={item.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={handleImgError}
        />
      </div>
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