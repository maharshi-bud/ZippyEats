"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "../../lib/axios";
import Head from "next/head";
import Link from "next/link";
import {
  FALLBACK_IMAGE,
  getRestaurantCoverImage,
  handleImgError,
} from "../../lib/imageUtils";
import gsap from "gsap";

const CrossIcon = () => (
  <svg width="26" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function RestaurantsGridBg() {
  const fixedRef = useRef(null);

  useEffect(() => {
    const fixedContainer = fixedRef.current;
    if (!fixedContainer) return;

    const ctx = gsap.context(() => {
      fixedContainer.querySelectorAll(".restaurants-grid-cross").forEach((cross, i) => {
        gsap.to(cross, {
          scale: 1.35,
          opacity: 0.22,
          duration: 3 + i * 0.25,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      fixedContainer.querySelectorAll(".restaurants-ambient-lens").forEach((lens, i) => {
        gsap.to(lens, {
          x: "random(-42, 42)",
          y: "random(-42, 42)",
          scale: "random(0.92, 1.12)",
          duration: 12 + i * 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 1.8,
        });
      });
    }, fixedContainer);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={fixedRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#f0f3f1]"
      style={{ width: "100vw", height: "100vh" }}
    >
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

      <div
        className="restaurants-ambient-lens absolute top-[4%] left-[-15%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-[0.22]"
        style={{ background: "radial-gradient(circle, #ffedd5 0%, transparent 70%)" }}
      />
      <div
        className="restaurants-ambient-lens absolute bottom-[10%] right-[-15%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-[0.24]"
        style={{ background: "radial-gradient(circle, #dcfce7 0%, transparent 70%)" }}
      />
      <div
        className="restaurants-ambient-lens absolute top-[35%] right-[5%] w-[50vw] h-[50vw] rounded-full blur-[130px] opacity-[0.14]"
        style={{ background: "radial-gradient(circle, #fef9c3 0%, transparent 70%)" }}
      />

      <div className="restaurants-grid-cross absolute left-[12%] top-[8%] text-emerald-600/15"><CrossIcon /></div>
      <div className="restaurants-grid-cross absolute left-[88%] top-[24%] text-emerald-600/15"><CrossIcon /></div>
      <div className="restaurants-grid-cross absolute left-[5%] top-[45%] text-emerald-600/15"><CrossIcon /></div>
      <div className="restaurants-grid-cross absolute left-[92%] top-[66%] text-emerald-600/15"><CrossIcon /></div>
      <div className="restaurants-grid-cross absolute left-[8%] top-[85%] text-emerald-600/15"><CrossIcon /></div>
    </div>
  );
}


export default function AllRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantImages, setRestaurantImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const shellRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    axios
      .get("/restaurants")
      .then((res) => {
        if (cancelled) return;
        setRestaurants(res.data.data || []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Could not load restaurants. Please try again.");
        setRestaurants([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!restaurants.length) {
      setRestaurantImages({});
      return;
    }

    let cancelled = false;

    const fetchImages = async () => {
      const images = {};

      await Promise.all(
        restaurants.map(async (restaurant) => {
          try {
            const res = await axios.get(`/menu/restaurant/${restaurant._id}`);
            images[restaurant._id] = getRestaurantCoverImage(res.data.data || []);
          } catch {
            images[restaurant._id] = FALLBACK_IMAGE;
          }
        })
      );

      if (!cancelled) setRestaurantImages(images);
    };

    fetchImages();

    return () => {
      cancelled = true;
    };
  }, [restaurants]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const cards = Array.from(shell.querySelectorAll(".restaurants-reveal-card"));
    if (!cards.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        {
          autoAlpha: 0,
          y: 54,
          scale: 0.975,
          transformOrigin: "50% 100%",
          willChange: "transform, opacity",
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.68,
          stagger: 0.07,
          ease: "back.out(1.12)",
          clearProps: "willChange,transform,opacity,visibility",
        }
      );
    }, shell);

    return () => ctx.revert();
  }, [loading, error, restaurants.length]);

  const restaurantCountLabel = useMemo(() => {
    if (loading) return "Loading…";
    return `${restaurants.length} restaurant${restaurants.length === 1 ? "" : "s"}`;
  }, [loading, restaurants.length]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f0f3f1] py-10">
      <Head>
        <title>All Restaurants — ZippyEats</title>
      </Head>

      <RestaurantsGridBg />

      <main
        ref={shellRef}
        className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8 rounded-[36px] border border-white/30 bg-white/10 backdrop-blur-[16px] shadow-[0_0_40px_rgba(15,23,42,0.10),0_18px_55px_rgba(15,23,42,0.08)]"
      >
        <section className="restaurants-reveal-card rounded-[28px] border border-white/55 bg-white/45 p-6 md:p-8 shadow-[0_0_40px_rgba(15,23,42,0.11),0_18px_55px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-700/80">
            Restaurant discovery
          </p>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-950">
                All Restaurants
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Explore curated kitchens, quick bites, and local favorites around you.
              </p>
            </div>

            <div className="inline-flex w-fit shrink-0 items-center rounded-full border border-emerald-200 bg-white/70 px-3.5 py-2 text-sm font-bold text-emerald-700 shadow-sm">
              {restaurantCountLabel}
            </div>
          </div>
        </section>

        {loading && (
          <section className="restaurants-reveal-card rounded-2xl border border-white/55 bg-white/45 p-6 shadow-[0_0_30px_rgba(15,23,42,0.08),0_14px_38px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3 text-slate-500">
              <span className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <span className="text-sm font-semibold">Loading restaurants…</span>
            </div>
          </section>
        )}

        {!loading && error && (
          <section className="restaurants-reveal-card rounded-2xl border border-red-200 bg-red-50/80 p-5 text-sm font-semibold text-red-600 shadow-[0_0_30px_rgba(239,68,68,0.10)]">
            {error}
          </section>
        )}

        {!loading && !error && restaurants.length === 0 && (
          <section className="restaurants-reveal-card rounded-2xl border border-white/55 bg-white/45 p-10 text-center shadow-[0_0_30px_rgba(15,23,42,0.08),0_14px_38px_rgba(15,23,42,0.06)]">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-3xl">
              🍽️
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">No restaurants found</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Try again later or adjust your delivery location.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-700"
            >
              Back to home
            </Link>
          </section>
        )}

        {!loading && !error && restaurants.length > 0 && (
          <section className="space-y-5">
            <div className="restaurants-reveal-card flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700/75">
                  Places
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Restaurants near you
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {restaurants.map((restaurant) => (
                <Link
                  key={restaurant._id}
                  href={`/restaurant/${restaurant._id}`}
                  className="restaurants-reveal-card group overflow-hidden rounded-2xl border border-white/60 bg-white/45 text-left shadow-[0_0_30px_rgba(15,23,42,0.08),0_14px_38px_rgba(15,23,42,0.06)] transition-colors hover:bg-white/60"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <img
                      src={restaurantImages[restaurant._id] || FALLBACK_IMAGE}
                      alt={restaurant.name}
                      onError={handleImgError}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/55 to-transparent" />

                    <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-extrabold text-emerald-700 shadow-sm">
                      ⭐ {restaurant.rating || "New"}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-extrabold text-slate-900 line-clamp-1">
                      {restaurant.name}
                    </h3>

                    <p className="mt-1 text-sm font-medium text-slate-500 line-clamp-1">
                      {restaurant.cuisines?.join(", ") ||
                        restaurant.cuisine?.join?.(", ") ||
                        restaurant.cuisine ||
                        "Multi-cuisine"}
                    </p>

                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>{restaurant.delivery_time || "30"} mins</span>
                      <span className="text-emerald-700">View menu →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
