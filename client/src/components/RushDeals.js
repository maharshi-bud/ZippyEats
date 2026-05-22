"use client";

import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  addToCart,
  decreaseQty,
} from "../store/slices/cartSlice";

const API =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  "http://localhost:5010";

export default function RushDeals() {

  const dispatch =
    useDispatch();

  const cart =
    useSelector(
      (state) => state.cart.items
    );

  // ==========================================================
  // STATE
  // ==========================================================
const [allDeals, setAllDeals] =
  useState([]);

const [visibleDeals, setVisibleDeals] =
  useState([]);

  const [now, setNow] =
    useState(Date.now());

  // ==========================================================
  // LIVE CLOCK
  // ==========================================================

  useEffect(() => {

    const interval =
      setInterval(() => {

        setNow(Date.now());

      }, 1000);

    return () =>
      clearInterval(interval);

  }, []);

  // ==========================================================
  // FETCH RUSH DEALS
  // ==========================================================

  useEffect(() => {

    fetchRushDeals();

  }, []);

const fetchRushDeals =
  async () => {

    try {

      const res =
        await axios.get(
          `${API}/api/rush-deals`
        );

      const formatted =
        (res.data.data || [])

          .map((deal) => {

            const item =
              deal.menuItem || {};

            return {

              _id:
                deal._id,

              menu_item_id:
                item._id,

              restaurant_id:
                deal.restaurant_id,

              name:
                deal.itemName,

              price:
                deal.oldPrice,

              discountPrice:
                deal.discountPrice,

              discount:
                deal.discountPercent,

              endsAt:
                deal.endsAt,

              image:
                item.image,
            };
          });

      setAllDeals(formatted);

    } catch (err) {

      console.error(
        "Failed to fetch rush deals:",
        err
      );
    }
  };

  // ==========================================================
  // FORMAT TIMER
  // ==========================================================

  const formatTime =
    (endsAt) => {

      if (!endsAt)
        return "Limited";

      const distance =
        new Date(endsAt).getTime() -
        now;

      if (distance <= 0)
        return "Expired";

      const hours =
        Math.floor(
          distance /
          (1000 * 60 * 60)
        );

      const mins =
        Math.floor(
          (
            distance %
            (1000 * 60 * 60)
          ) /
          (1000 * 60)
        );

      const secs =
        Math.floor(
          (
            distance %
            (1000 * 60)
          ) / 1000
        );

      if (hours > 0) {

        return `${hours}h ${mins}m`;
      }

      return `${mins}m ${secs}s`;
    };

  // ==========================================================
  // REMOVE EXPIRED LIVE
  // ==========================================================

useEffect(() => {

  const activeDeals =

    allDeals.filter((deal) => {

      if (!deal.endsAt)
        return true;

      return (
        new Date(
          deal.endsAt
        ).getTime() > now
      );
    });

  setVisibleDeals(
    activeDeals.slice(0, 2)
  );

}, [allDeals, now]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="rush-container">

      {/* ==================================================== */}
      {/* LEFT */}
      {/* ==================================================== */}

      <div className="rush-left">

        <div className="rush-content">

          <span className="rush-tag">
            RUSH DEALS
          </span>

          <h1>
            Limited Time Offers
          </h1>

          <p className="
            mt-3
            text-slate-300
            text-lg
          ">
            Grab exclusive food deals
            before they disappear.
          </p>

        </div>

      </div>

      {/* ==================================================== */}
      {/* RIGHT */}
      {/* ==================================================== */}

      <div className="rush-right">

        {/* {deals.map((item) => { */}
          {visibleDeals.map((item) => {
          const itemInCart =
            cart.find(
              (i) =>
                i.menu_item_id ===
                item.menu_item_id
            );

          return (

            <div
              key={item._id}
              className="rush-card"
            >

              {/* IMAGE */}

              <div
                className="rush-img"
                style={{

                  backgroundImage:
                    `url(${item.image})`,
                }}
              >

                <span className="discount">

                  {item.discount}% OFF

                </span>

              </div>

              {/* INFO */}

              <div className="rush-info">

                <h3>
                  {item.name}
                </h3>

                {/* PRICE */}

                <p className="price">

                  <span className="old">

                    ₹{item.price}

                  </span>

                  ₹{item.discountPrice}

                </p>

                {/* TIMER */}

                <p className="
                  time
                  text-orange-400
                ">

                  ⏱
                  {" "}
                  {formatTime(
                    item.endsAt
                  )}
                  {" "}
                  left

                </p>

                {/* SAVINGS */}

                <p className="
                  mt-1
                  text-sm
                  text-green-400
                ">

                  Save ₹
                  {
                    item.price -
                    item.discountPrice
                  }

                </p>

                {/* ========================================== */}
                {/* ADD / STEPPER */}
                {/* ========================================== */}

                {!itemInCart ? (

                  <button

                    onClick={() =>
                      dispatch(
                        addToCart({

                          menu_item_id:
                            item.menu_item_id,

                          name:
                            item.name,

                          price:
                            item.discountPrice,

                          restaurant_id:
                            item.restaurant_id,

                          image:
                            item.image,
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
                        dispatch(
                          decreaseQty(
                            item.menu_item_id
                          )
                        )
                      }
                    >
                      -
                    </button>

                    <span>
                      {
                        itemInCart.quantity
                      }
                    </span>

                    <button
                      onClick={() =>
                        dispatch(
                          addToCart({

                            menu_item_id:
                              item.menu_item_id,

                            name:
                              item.name,

                            price:
                              item.discountPrice,

                            restaurant_id:
                              item.restaurant_id,

                            image:
                              item.image,
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