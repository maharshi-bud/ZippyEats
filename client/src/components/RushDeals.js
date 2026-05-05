"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, decreaseQty } from "../store/slices/cartSlice";

export default function RushDeals() {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart.items);

  // 🔥 countdown (20 mins = 1200 sec)
  const [time, setTime] = useState(1200);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    const min = Math.floor(time / 60);
    const sec = time % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  // 🔥 your real data
  const deals = [
    {
      _id: "69f07b097de83adf654cf672",
      name: "Pasta Alfredo",
      price: 280,
      discountPrice: 160,
      discount: "45%",
      img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b"
    },
    {
      _id: "69f07b097de83adf654cf673",
      name: "Lasagna",
      price: 350,
      discountPrice: 199,
      discount: "40%",
      // img: "https://images.unsplash.com/photo-1604908176997-431dfc0e7a3d"
      img : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRs1nkXfdrJgGxUXvlzUAWB-_qKj5snjoguBFEqpSEgCbfh3V2qxg3IA3q0JlAIrBaWw0LtTbjp6-9zLUaBQwwy2bAPBSOzsJ5Mf_TgR2bi&s=10"
    }
  ];

  return (
    <div className="rush-container">

      {/* LEFT */}
      <div className="rush-left">
        <div className="rush-content">
          <span className="rush-tag">⚡ RUSH DEALS</span>
          <h1>Hurry! Big savings</h1>

          <div className="rush-timer">
            ⏱ Ends in <b>{formatTime()}</b>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="rush-right">
        {deals.map((item) => {
          const itemInCart = cart.find(
            (i) => i.menu_item_id === item._id
          );

          return (
            <div key={item._id} className="rush-card">

              <div
                className="rush-img"
                style={{ backgroundImage: `url(${item.img})` }}
              >
                <span className="discount">{item.discount} OFF</span>
              </div>

              <div className="rush-info">
                <h3>{item.name}</h3>

                <p className="price">
                  <span className="old">₹{item.price}</span>
                  ₹{item.discountPrice}
                </p>

                <p className="time">⏱ {formatTime()} left</p>

                {/* 🔥 ADD → STEPPER */}
                {!itemInCart ? (
                  <button
                    onClick={() =>
                      dispatch(
                        addToCart({
                          menu_item_id: item._id,
                          name: item.name,
                          price: item.discountPrice
                        })
                      )
                    }
                  >
                    Grab Now →
                  </button>
                ) : (
                  <div className="stepper">
                    <button
                      onClick={() =>
                        dispatch(decreaseQty(item._id))
                      }
                    >
                      -
                    </button>

                    <span>{itemInCart.quantity}</span>

                    <button
                      onClick={() =>
                        dispatch(
                          addToCart({
                            menu_item_id: item._id,
                            name: item.name,
                            price: item.discountPrice
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
          );
        })}
      </div>

    </div>
  );
}