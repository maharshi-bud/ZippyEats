"use client";

import { useEffect, useState } from "react";
import axios from "../lib/axios";
import Link from "next/link";
import CuisineBar from "../components/CuisineBar";
import PromoCarousel from "../components/PromoCarousel";
import PopularBar from "../components/PopularBar";



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

  return (
    <div className="container">


    <CuisineBar
  selected={selectedCuisine}
  setSelected={setSelectedCuisine}
/>


<PromoCarousel></PromoCarousel>

<PopularBar />

      <h1>Restaurants</h1>
      <div className="resgrid">
        {restaurants.map((r) => (
          <Link key={r._id} href={`/restaurant/${r._id}`}>
            <div className="rescard">
              <h3 className="card__title">{r.name}</h3>

              <p className="card__content">
                {r.delivery_time} mins
              </p>

              <div className="card__date">
                ⭐ {r.rating}
              </div>

              <div className="card__arrow">
                →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}