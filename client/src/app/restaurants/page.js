"use client";

import { useEffect, useState } from "react";
import axios from "../../lib/axios";
import Link from "next/link";
import { getRestaurantCoverImage, handleImgError } from "../../lib/imageUtils";

export default function AllRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantImages, setRestaurantImages] = useState({});

  useEffect(() => {
    axios.get("/restaurants").then((res) => {
      setRestaurants(res.data.data);
    });
  }, []);

  useEffect(() => {
    if (!restaurants.length) return;
    const fetchImages = async () => {
      const images = {};
      await Promise.all(
        restaurants.map(async (r) => {
          try {
            const res = await axios.get(`/menu/restaurant/${r._id}`);
            images[r._id] = getRestaurantCoverImage(res.data.data || []);
          } catch {
            images[r._id] = "/fallback.png";
          }
        })
      );
      setRestaurantImages(images);
    };
    fetchImages();
  }, [restaurants]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">All Restaurants</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {restaurants.map((r) => (
          <Link key={r._id} href={`/restaurant/${r._id}`}>
            <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">

              <div className="h-40 w-full overflow-hidden">
                <img
                  src={restaurantImages[r._id] || "/fallback.png"}
                  alt={r.name}
                  onError={handleImgError}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-slate-800 truncate">{r.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{r.cuisine?.join(", ")}</p>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md font-medium">
                    ⭐ {r.rating}
                  </span>
                  <span className="text-slate-500">{r.delivery_time} mins</span>
                </div>
              </div>

            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}