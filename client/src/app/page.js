"use client";

import { useEffect, useState } from "react";
import axios from "../lib/axios";
import Link from "next/link";
import CuisineBar from "../components/CuisineBar";
import PromoCarousel from "../components/PromoCarousel";
import PopularBar from "../components/PopularBar";
import RushDeals from "../components/RushDeals";
import { useRouter } from "next/navigation";
import { getRestaurantCoverImage, handleImgError } from "../lib/imageUtils";

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [restaurantImages, setRestaurantImages] = useState({});
  const router = useRouter();

  useEffect(() => {
    let url = "/restaurants";
    if (selectedCuisine !== "All") url += `?cuisine=${selectedCuisine}`;
    axios.get(url).then((res) => setRestaurants(res.data.data));
  }, [selectedCuisine]);

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

  const visibleRestaurants = restaurants.slice(0, 6);

  return (
    <div className="container">
      <CuisineBar selected={selectedCuisine} setSelected={setSelectedCuisine} />
      <PromoCarousel />
      <PopularBar />
      <RushDeals />

      <div className="restaurant-section">
        <div className="section-header">
          <h2>Restaurants</h2>
          <Link href="/restaurants">
            <button className="view-all-btn">View All →</button>
          </Link>
        </div>

        <div className="restaurant-grid">
          {visibleRestaurants.map((r) => (
            <div key={r._id} className="rescard2">
              <div
                className="rescard2-img"
                onClick={() => router.push(`/restaurant/${r._id}`)}
              >
                <img
                  src={restaurantImages[r._id] || "/fallback.png"}
                  alt={r.name}
                  onError={handleImgError}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div
                className="rescard2-info"
                onClick={() => router.push(`/restaurant/${r._id}`)}
              >
                <h3>{r.name}</h3>
                <p>{r.cuisine?.join(", ")}</p>
                <div className="rescard2-meta">
                  ⭐ {r.rating} • {r.delivery_time} mins
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}