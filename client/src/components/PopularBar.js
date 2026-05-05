"use client";
import { useEffect, useState } from "react";
import api from "../lib/axios";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, decreaseQty } from "../store/slices/cartSlice";
import { resolveItemImage, handleImgError } from "../lib/imageUtils";

export default function PopularBar() {
  const [items, setItems] = useState([]);
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart.items);

  useEffect(() => {
    api.get("/menu/popular").then((res) => setItems(res.data.data));
  }, []);

  return (
    <div className="popular-wrapper">
      <h2>Popular Near You</h2>
      <div className="popular-scroll">
        {items.map((item) => {
          const itemInCart = cart.find((i) => i.menu_item_id === item._id);
          const imgSrc = resolveItemImage(item); // ✅ DB image or constructed URL

          return (
            <div key={item._id} className="popular-card">
              <div className="popular-img">
                
                <img
                  src={imgSrc}
                  alt={item.name}
                  onError={handleImgError}       // ✅ fallback on broken URL
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div className="popular-action">
                  {!itemInCart ? (
                    <button
                      className="add-btn"
                      onClick={() =>
                        dispatch(addToCart({
                          menu_item_id: item._id,
                          name: item.name,
                          price: item.price,
                        }))
                      }
                    >
                      Add
                    </button>
                  ) : (
                    <div className="stepper">
                      <button onClick={() => dispatch(decreaseQty(item._id))}>-</button>
                      <span>{itemInCart.quantity}</span>
                      <button
                        onClick={() =>
                          dispatch(addToCart({
                            menu_item_id: item._id,
                            name: item.name,
                            price: item.price,
                          }))
                        }
                      >+</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="popular-info">
                <h3>{item.name}</h3>
                <p>₹{item.price}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}