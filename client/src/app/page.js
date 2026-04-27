"use client";

import { useEffect, useState } from "react";
import axios from "../lib/axios"; // use relative path (safe)
import Link from "next/link";

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/restaurants");
        setRestaurants(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Restaurants</h1>

      {restaurants.map((r) => (
        <Link key={r._id} href={`/restaurant/${r._id}`}>
          <div>
            <h3>{r.name}</h3>
            <p>Rating: {r.rating}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}