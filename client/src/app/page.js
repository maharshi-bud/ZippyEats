"use client";

import { useEffect, useState, useRef } from "react";
import axios from "../lib/axios";
import Link from "next/link";
import CuisineBar from "../components/CuisineBar";
import PromoCarousel from "../components/PromoCarousel";
import PopularBar from "../components/PopularBar";
import TopRated from "../components/TopRated";
import People from "../components/People";
import QuickBites from "../components/QuickBites";
import Recently from "../components/Recently";
import RushDeals from "../components/RushDeals";
import { useRouter } from "next/navigation";
import { getRestaurantCoverImage, handleImgError } from "../lib/imageUtils";
import { startRouteLoader } from "../lib/routeLoading";
import Head from "next/head";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Safely register ScrollTrigger on the client side to avoid Next.js SSR errors
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const CrossIcon = () => (
  <svg width="26" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function FloatingCulinaryBg() {
  const fixedRef = useRef(null);

  useEffect(() => {
    const fixedContainer = fixedRef.current;
    if (!fixedContainer) return;

    // 🔮 Ambient Grid Pulses & Lenses (GSAP scoped context)
    const ctx = gsap.context(() => {
      const crosses = document.querySelectorAll(".grid-cross");
      crosses.forEach((cross) => {
        gsap.to(cross, {
          scale: 1.35,
          opacity: 0.22,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      const lenses = document.querySelectorAll(".ambient-lens");
      lenses.forEach((lens, i) => {
        gsap.to(lens, {
          x: "random(-50, 50)",
          y: "random(-50, 50)",
          scale: "random(0.9, 1.15)",
          duration: 12 + i * 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 2,
        });
      });
    });

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={fixedRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#f0f3f1]"
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* 🌐 Clean Light-Mode Coordinate Tech Grid (Emerald Green Brand Accent) */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 191, 99, 0.08) 1.5px, transparent 1.5px),
            linear-gradient(to bottom, rgba(0, 191, 99, 0.08) 1.5px, transparent 1.5px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Appetite-Enhancing Warm Ambient Light Lenses with GSAP slow float */}
      <div 
        className="ambient-lens absolute top-[4%] left-[-15%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-[0.22] pointer-events-none"
        style={{ background: "radial-gradient(circle, #ffedd5 0%, transparent 70%)" }} // Peach lens
      />
      <div 
        className="ambient-lens absolute bottom-[10%] right-[-15%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-[0.24] pointer-events-none"
        style={{ background: "radial-gradient(circle, #dcfce7 0%, transparent 70%)" }} // Mint lens
      />
      <div 
        className="ambient-lens absolute top-[35%] right-[5%] w-[50vw] h-[50vw] rounded-full blur-[130px] opacity-[0.14] pointer-events-none"
        style={{ background: "radial-gradient(circle, #fef9c3 0%, transparent 70%)" }} // Honey lens
      />

      {/* Pulsing Grid Intersections / Crosshairs */}
      <div className="grid-cross absolute left-[12%] top-[8%] text-emerald-600/15"><CrossIcon /></div>
      <div className="grid-cross absolute left-[88%] top-[24%] text-emerald-600/15"><CrossIcon /></div>
      <div className="grid-cross absolute left-[5%] top-[45%] text-emerald-600/15"><CrossIcon /></div>
      <div className="grid-cross absolute left-[92%] top-[66%] text-emerald-600/15"><CrossIcon /></div>
      <div className="grid-cross absolute left-[8%] top-[85%] text-emerald-600/15"><CrossIcon /></div>
    </div>
  );
}

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [restaurantImages, setRestaurantImages] = useState({});
  const router = useRouter();

  // 🌀 Butter-Smooth Lenis Scroll Sync
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2, // Scroll transition timing
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Silky ease curve
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    // Connect Lenis RAF loop to requestAnimationFrame
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync GSAP's ScrollTrigger refresh rate with Lenis scrollbar changes
    lenis.on("scroll", () => {
      ScrollTrigger.update();
    });

    // Bind GSAP Ticker directly to Lenis to keep both fully synchronized
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
    };
  }, []);

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
    <div className="container relative overflow-visible z-10 min-h-screen pb-16">
      <Head>
        <title>ZippyEats — Fast Food Delivery</title>
      </Head>

      {/* 
        Prisinte Minimalist Coordinate Grid Background:
        - Keeps only the high-density emerald green coordinate grid mesh background.
        - Displays the slowly breathing warm light color lenses and pulsing crosshairs.
        - Extremely clean, letting your main content sections float beautifully on top!
      */}
      <FloatingCulinaryBg />
    
      <div className="relative z-10">
        <CuisineBar selected={selectedCuisine} setSelected={setSelectedCuisine} />
        <PromoCarousel />
        <PopularBar />
        <People />
        <QuickBites />
        <RushDeals />
        <Recently />
        <TopRated />

        <div className="restaurant-section">
          <div className="section-header">
            <h2 className="text-2xl font-extrabold text-slate-900">Restaurants</h2>
            <Link href="/restaurants">
              <button className="view-all-btn">View All →</button>
            </Link>
          </div>

          <div className="restaurant-grid">
            {visibleRestaurants.map((r) => (
              <div key={r._id} className="rescard2 hover:shadow-xl transition-all duration-300">
                <div
                  className="rescard2-img"
                  onClick={() => {
                    startRouteLoader();
                    router.push(`/restaurant/${r._id}`);
                  }}
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
                  onClick={() => {
                    startRouteLoader();
                    router.push(`/restaurant/${r._id}`);
                  }}
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
    </div>
  );
}
