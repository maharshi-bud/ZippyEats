"use client";

import { useEffect, useState } from "react";
import axios from "../../lib/axios";
import Link from "next/link";

export default function AllRestaurants() {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    axios.get("/restaurants").then((res) => {
      setRestaurants(res.data.data);
    });
  }, []);

  return (
    <div className="container">
      <h1>All Restaurants</h1>

      <div className="restaurant-grid">
        {restaurants.map((r) => (
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
  );
}