"use client";

import { useEffect, useState } from "react";
import axios from "../lib/axios";
import Link from "next/link";

import CuisineBar from "../components/CuisineBar";
import PromoCarousel from "../components/PromoCarousel";
import PopularBar from "../components/PopularBar";
import RushDeals from "../components/RushDeals";

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedCuisine, setSelectedCuisine] = useState("All");

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
          {visibleRestaurants.map((r) => (
            <Link key={r._id} href={`/restaurant/${r._id}`}>
              <div className="rescard2">

                <div
                  className="rescard2-img"
                  style={{
                    backgroundImage: `url(https://source.unsplash.com/400x300/?food,${r.name})`
                  }}
                />

                <div className="rescard2-info">
                  <h3>{r.name}</h3>

                  <p>
                    {r.cuisine?.join(", ") || "Multi Cuisine"}
                  </p>

                  <div className="rescard2-meta">
                    ⭐ {r.rating} • {r.delivery_time} mins
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      </div>


    </div>
    
  );
}