"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RestaurantList({ restaurants }) {
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();

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
                backgroundImage: `url(https://source.unsplash.com/400x300/?food,${r.name})`
              }}
            />

            <div className="rescard2-info">
              <h3>{r.name}</h3>
              <p>{r.cuisine?.join(", ") || "Multi Cuisine"}</p>

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