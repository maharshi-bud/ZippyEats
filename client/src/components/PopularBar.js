"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, decreaseQty } from "../store/slices/cartSlice";

export default function PopularBar() {
  const [items, setItems] = useState([]);

  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart.items); // 🔥 get cart

  useEffect(() => {
    api.get("/menu/popular").then((res) => {
      setItems(res.data.data);
    });
  }, []);

  return (
    <div className="popular-wrapper">
      <h2>🔥 Popular Near You</h2>

      <div className="popular-scroll">
        {items.map((item) => {
          // 🔥 correct scope
          const itemInCart = cart.find(
            (i) => i.menu_item_id === item._id
          );

          return (
            <div key={item._id} className="popular-card">

             <div
  className="popular-img"
  style={{
    backgroundImage: `url(https://source.unsplash.com/400x300/?food,${item.name})`
  }}
>

  {/* 🔥 FLOATING BUTTON */}
  <div className="popular-action">
    {!itemInCart ? (
      <button
        className="add-btn"
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
    ) : (
      <div className="stepper">
        <button onClick={() => dispatch(decreaseQty(item._id))}>
          -
        </button>

        <span>{itemInCart.quantity}</span>

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
          +
        </button>
      </div>
    )}
  </div>

</div>
                

              <div className="popular-info">
                <h3>{item.name}</h3>
                <p>₹{item.price}</p>

                {/* 🔥 conditional UI */}
                
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}