"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axios";
import { getRestaurantCoverImage } from "../lib/imageUtils";

export default function RestaurantList({ restaurants }) {
  const [showAll, setShowAll] = useState(false);
  const [restaurantImages, setRestaurantImages] = useState({});
  const router = useRouter();

  useEffect(() => {
    const fetchImages = async () => {
      const images = {};
      for (const restaurant of restaurants) {
        try {
          const res = await api.get(`/menu/restaurant/${restaurant._id}`);
          // console.log("sample item:", res.data.data?.[0]); // ← log one item

          images[restaurant._id] = getRestaurantCoverImage(res.data.data || []);
        } catch (err) {
          images[restaurant._id] = "https://via.placeholder.com/400x300?text=No+Image";
        }
      }
      setRestaurantImages(images);
    };
    if (restaurants.length > 0) fetchImages();
  }, [restaurants]);

  const visibleData = showAll ? restaurants : restaurants.slice(0, 7);

  return (
    <div className="restaurant-section">
      <h2>🍽️ Restaurants Near You</h2>

      <div className="restaurant-grid">
        {visibleData.map((r) => (
          <div
            key={r._id}
            className="rescard2"
            onClick={() => router.push(`/restaurant/${r._id}`)}
          >
            <div
              className="rescard2-img"
              style={{
                backgroundImage: `url(${restaurantImages[r._id] || "https://via.placeholder.com/400x300?text=Loading..."})`
              }}
            />

            <div className="rescard2-info">
              <h3>{r.name}</h3>
              <p>{r.cuisine?.join(", ") }</p>

              <div className="rescard2-meta">
                ⭐ {r.rating || 4.2} • {r.delivery_time || 30} mins
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🔥 View Toggle */}
      <div className="view-toggle">
        <button onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show Less" : "View All"}
        </button>
      </div>
    </div>
  );
}