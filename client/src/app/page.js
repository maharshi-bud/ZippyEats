"use client";

import { useEffect, useState } from "react";
import axios from "../lib/axios";
import Link from "next/link";

import CuisineBar from "../components/CuisineBar";
import PromoCarousel from "../components/PromoCarousel";
import PopularBar from "../components/PopularBar";
import RushDeals from "../components/RushDeals";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, decreaseQty } from "../store/slices/cartSlice";

// import { useRouter } from "next/navigation";
// const router = useRouter();
export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const router = useRouter();
const dispatch = useDispatch();
const cart = useSelector((state) => state.cart.items);
  useEffect(() => {
    let url = "/restaurants";

    if (selectedCuisine !== "All") {
      url += `?cuisine=${selectedCuisine}`;
    }

    axios.get(url).then((res) => {
      setRestaurants(res.data.data);
    });
  }, [selectedCuisine]);

  // 🔥 only first 7
  const visibleRestaurants = restaurants.slice(0, 6);

  return (
    <div className="container">

      <CuisineBar
        selected={selectedCuisine}
        setSelected={setSelectedCuisine}
      />

      <PromoCarousel />
      <PopularBar />
      <RushDeals />

      {/* 🔥 RESTAURANTS */}
      <div className="restaurant-section">
        <div className="section-header">
          <h2>Restaurants</h2>

          {/* 👉 goes to new page */}
          <Link href="/restaurants">
            <button className="view-all-btn">
              View All →
            </button>
          </Link>
        </div>

        <div className="restaurant-grid">
         {visibleRestaurants.map((r) => {
  // 🔥 TEMP fallback item (since you don't have featured_item yet)
  const fakeItem = {
    _id: r._id,
    name: r.name,
    price: 199
  };

  const itemInCart = cart.find(
    (i) => i.menu_item_id === fakeItem._id
  );

  return (
    <div key={r._id} className="rescard2">

      {/* IMAGE */}
      <div
        className="rescard2-img"
        style={{
          backgroundImage: `url(https://source.unsplash.com/400x300/?food,${r.name})`
        }}
        onClick={() => router.push(`/restaurant/${r._id}`)}
      >

        {/* 🔥 BUTTON */}
        <div className="rescard-action">

          {/* {!itemInCart ? (
            <button
              className="add-btn"
              onClick={(e) => {
                e.stopPropagation();
                dispatch(
                  addToCart({
                    menu_item_id: fakeItem._id,
                    name: fakeItem.name,
                    price: fakeItem.price
                  })
                );
              }}
            >
              Add
            </button>
          ) : (
            <div className="stepper">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(decreaseQty(fakeItem._id));
                }}
              >
                -
              </button>

              <span>{itemInCart.quantity}</span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(
                    addToCart({
                      menu_item_id: fakeItem._id,
                      name: fakeItem.name,
                      price: fakeItem.price
                    })
                  );
                }}
              >
                +
              </button>
            </div>
          )} */}

        </div>
      </div>

      {/* INFO */}
      <div
        className="rescard2-info"
        onClick={() => router.push(`/restaurant/${r._id}`)}
      >
        <h3>{r.name}</h3>
        <p>{r.cuisine?.join(", ") }</p>

        <div className="rescard2-meta">
          ⭐ {r.rating} • {r.delivery_time} mins
        </div>
      </div>

    </div>
  );
})}
        </div>
      </div>


    </div>
    
  );
}