"use client";

import { useEffect, useState, useRef } from "react";
import axios from "../../lib/axios";
import Head from "next/head";
import Link from "next/link";
import { getRestaurantCoverImage, handleImgError } from "../../lib/imageUtils";
import gsap from "gsap";

export default function AllRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantImages, setRestaurantImages] = useState({});

  const headerRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    axios.get("/restaurants").then((res) => {
      setRestaurants(res.data.data || []);
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

  // GSAP Entrance Animations
  useEffect(() => {
    if (restaurants.length === 0) return;

    const ctx = gsap.context(() => {
      // Animate the main header
      gsap.from(headerRef.current, {
        opacity: 0,
        y: -30,
        duration: 0.6,
        ease: "power3.out",
      });

      // Stagger all the loaded restaurant cards
      const cards = gridRef.current?.children;
      if (cards && cards.length > 0) {
        gsap.from(cards, {
          opacity: 0,
          y: 40,
          stagger: 0.06,
          duration: 0.6,
          ease: "power3.out",
        });
      }
    });

    return () => ctx.revert();
  }, [restaurants]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Head>
        <title>All Restaurants — ZippyEats</title>
      </Head>
      
      <h1 
        ref={headerRef} 
        className="text-3xl font-bold text-slate-800 mb-6 text-left"
      >
        All Restaurants
      </h1>

      <div 
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {restaurants.map((r) => (
          <Link key={r._id} href={`/restaurant/${r._id}`}>
            <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">

              <div className="h-40 w-full overflow-hidden bg-slate-100">
                <img
                  src={restaurantImages[r._id] || "/fallback.png"}
                  alt={r.name}
                  onError={handleImgError}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>

              <div className="p-4 text-left">
                <h3 className="text-lg font-semibold text-slate-800 truncate">{r.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                  {r.cuisine?.join(", ") || "Multi-cuisine"}
                </p>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md font-medium">
                    ⭐ {r.rating || "N/A"}
                  </span>
                  <span className="text-slate-500">{r.delivery_time || "--"} mins</span>
                </div>
              </div>

            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}