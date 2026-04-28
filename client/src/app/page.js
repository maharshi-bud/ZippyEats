"use client";

import { useEffect, useState } from "react";
import axios from "../lib/axios";
import Link from "next/link";

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    axios.get("/restaurants").then((res) => {
      setRestaurants(res.data.data);
    });
  }, []);

  return (
    <div>
      <h1>Restaurants</h1>

      {restaurants.map((r) => (
        <Link key={r._id} href={`/restaurant/${r._id}`}>
          <div className="card">
            <h3>{r.name}</h3>
            <p>⭐ {r.rating} • {r.delivery_time} mins</p>
          </div>
        </Link>
      ))}
    </div>
  );
}