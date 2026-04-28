"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/slices/cartSlice";

export default function PopularBar() {
  const [items, setItems] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    api.get("/menu/popular").then((res) => {
      setItems(res.data.data);
    });
  }, []);

  return (
    <div className="popular-wrapper">
      <h2>🔥 Popular Near You</h2>

      <div className="popular-scroll">
        {items.map((item) => (
          <div key={item._id} className="popular-card">

            <div
              className="popular-img"
              style={{
                backgroundImage: `url(https://source.unsplash.com/400x300/?food,${item.name})`
              }}
            />

            <div className="popular-info">
              <h3>{item.name}</h3>
              <p>₹{item.price}</p>

              <button
                onClick={() =>
                  dispatch(
                    addToCart({
                      menu_item_id: item._id,
                      name: item.name,
                      price: item.price
                    })
                  )
                }
              >
                Add
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}