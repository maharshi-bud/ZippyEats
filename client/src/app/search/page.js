"use client";

import Head from "next/head";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/api";
import {
  FALLBACK_IMAGE,
  getRestaurantCoverImage,
  handleImgError,
  resolveItemImage,
} from "../../lib/imageUtils";
import { startRouteLoader } from "../../lib/routeLoading";
import gsap from "gsap";

const CrossIcon = () => (
  <svg width="26" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function SearchGridBg() {
  const fixedRef = useRef(null);

  useEffect(() => {
    const fixedContainer = fixedRef.current;
    if (!fixedContainer) return;

    const ctx = gsap.context(() => {
      fixedContainer.querySelectorAll(".search-grid-cross").forEach((cross, i) => {
        gsap.to(cross, {
          scale: 1.35,
          opacity: 0.22,
          duration: 3 + i * 0.25,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      fixedContainer.querySelectorAll(".search-ambient-lens").forEach((lens, i) => {
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
        className="search-ambient-lens absolute top-[4%] left-[-15%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-[0.22]"
        style={{ background: "radial-gradient(circle, #ffedd5 0%, transparent 70%)" }}
      />
      <div
        className="search-ambient-lens absolute bottom-[10%] right-[-15%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-[0.24]"
        style={{ background: "radial-gradient(circle, #dcfce7 0%, transparent 70%)" }}
      />
      <div
        className="search-ambient-lens absolute top-[35%] right-[5%] w-[50vw] h-[50vw] rounded-full blur-[130px] opacity-[0.14]"
        style={{ background: "radial-gradient(circle, #fef9c3 0%, transparent 70%)" }}
      />

      <div className="search-grid-cross absolute left-[12%] top-[8%] text-emerald-600/15"><CrossIcon /></div>
      <div className="search-grid-cross absolute left-[88%] top-[24%] text-emerald-600/15"><CrossIcon /></div>
      <div className="search-grid-cross absolute left-[5%] top-[45%] text-emerald-600/15"><CrossIcon /></div>
      <div className="search-grid-cross absolute left-[92%] top-[66%] text-emerald-600/15"><CrossIcon /></div>
      <div className="search-grid-cross absolute left-[8%] top-[85%] text-emerald-600/15"><CrossIcon /></div>
    </div>
  );
}

const getRestaurantId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

const getRestaurantNameFromItem = (item) => {
  if (item?.restaurant?.name) return item.restaurant.name;
  if (item?.restaurant_id?.name) return item.restaurant_id.name;
  if (item?.restaurant_name) return item.restaurant_name;
  return "Restaurant menu";
};

const getRestaurantImage = (restaurant) => {
  return (
    restaurant?.image ||
    restaurant?.coverImage ||
    restaurant?.cover_image ||
    restaurant?.logo ||
    FALLBACK_IMAGE
  );
};

export default function SearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const q = (params.get("q") || "").trim();

  const [data, setData] = useState({ restaurants: [], items: [] });
  const [restaurantImages, setRestaurantImages] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const shellRef = useRef(null);

  const restaurants = useMemo(
    () => (Array.isArray(data.restaurants) ? data.restaurants : []),
    [data.restaurants]
  );

  const items = useMemo(
    () => (Array.isArray(data.items) ? data.items : []),
    [data.items]
  );

  const totalResults = restaurants.length + items.length;

  useEffect(() => {
    let cancelled = false;

    if (!restaurants.length) {
      setRestaurantImages({});
      return;
    }

    const fetchRestaurantImages = async () => {
      const images = {};

      await Promise.all(
        restaurants.map(async (restaurant) => {
          try {
            const res = await api.get(`/menu/restaurant/${restaurant._id}`);
            images[restaurant._id] = getRestaurantCoverImage(res.data?.data || []);
          } catch {
            images[restaurant._id] = getRestaurantImage(restaurant);
          }
        })
      );

      if (!cancelled) setRestaurantImages(images);
    };

    fetchRestaurantImages();

    return () => {
      cancelled = true;
    };
  }, [restaurants]);

  useEffect(() => {
    let cancelled = false;

    if (!q) {
      setData({ restaurants: [], items: [] });
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    api
      .get("/search", { params: { q } })
      .then((res) => {
        if (cancelled) return;
        const payload = res.data?.data || {};
        setData({
          restaurants: Array.isArray(payload.restaurants) ? payload.restaurants : [],
          items: Array.isArray(payload.items) ? payload.items : [],
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Could not load search results. Please try again.");
        setData({ restaurants: [], items: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const cards = Array.from(shell.querySelectorAll(".search-reveal-card"));
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
  }, [q, loading, restaurants.length, items.length]);

  const goToRestaurant = (restaurantId) => {
    if (!restaurantId) return;
    startRouteLoader();
    router.push(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f0f3f1] py-10">
      <Head>
        <title>{q ? `Search: ${q} — ZippyEats` : "Search — ZippyEats"}</title>
      </Head>

      <SearchGridBg />

      <main
        ref={shellRef}
        className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8 rounded-[36px] border border-white/30 bg-white/10 backdrop-blur-[16px] shadow-[0_0_40px_rgba(15,23,42,0.10),0_18px_55px_rgba(15,23,42,0.08)]"
      >
        <section className="search-reveal-card rounded-[28px] border border-white/55 bg-white/45 p-6 md:p-8 shadow-[0_0_40px_rgba(15,23,42,0.11),0_18px_55px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-700/80">
            Search discovery
          </p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-950">
                {q ? `Results for “${q}”` : "Search ZippyEats"}
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Restaurants and menu items matching your craving.
              </p>
            </div>

            <div className="inline-flex w-fit shrink-0 items-center rounded-full border border-emerald-200 bg-white/70 px-3.5 py-2 text-sm font-bold text-emerald-700 shadow-sm">
              {loading
                ? "Searching…"
                : `${totalResults} result${totalResults === 1 ? "" : "s"}`}
            </div>
          </div>
        </section>

        {loading && (
          <section className="search-reveal-card rounded-2xl border border-white/55 bg-white/45 p-6 shadow-[0_0_30px_rgba(15,23,42,0.08),0_14px_38px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3 text-slate-500">
              <span className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <span className="text-sm font-semibold">Searching kitchens and menus…</span>
            </div>
          </section>
        )}

        {error && !loading && (
          <section className="search-reveal-card rounded-2xl border border-red-200 bg-red-50/80 p-5 text-sm font-semibold text-red-600 shadow-[0_0_30px_rgba(239,68,68,0.10)]">
            {error}
          </section>
        )}

        {!loading && !error && q && totalResults === 0 && (
          <section className="search-reveal-card rounded-2xl border border-white/55 bg-white/45 p-10 text-center shadow-[0_0_30px_rgba(15,23,42,0.08),0_14px_38px_rgba(15,23,42,0.06)]">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-3xl">
              🍽️
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">No matches found</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Try searching for a restaurant, cuisine, or dish like “pizza”, “biryani”, or “paneer”.
            </p>
            <Link
              href="/restaurants"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-700"
            >
              Browse restaurants
            </Link>
          </section>
        )}

        {!loading && restaurants.length > 0 && (
          <section className="space-y-4">
            <div className="search-reveal-card flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700/75">Places</p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Restaurants</h2>
              </div>
              <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(16,185,129,0.22)]">
                {restaurants.length} result{restaurants.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {restaurants.map((restaurant) => (
                <button
                  key={restaurant._id}
                  onClick={() => goToRestaurant(restaurant._id)}
                  className="search-reveal-card group overflow-hidden rounded-2xl border border-white/60 bg-white/45 text-left shadow-[0_0_30px_rgba(15,23,42,0.08),0_14px_38px_rgba(15,23,42,0.06)] transition-colors hover:bg-white/60"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <img
                      src={restaurantImages[restaurant._id] || getRestaurantImage(restaurant)}
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
                    <h3 className="text-lg font-extrabold text-slate-900 line-clamp-1">{restaurant.name}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500 line-clamp-1">
                      {restaurant.cuisines?.join(", ") || restaurant.cuisine?.join?.(", ") || restaurant.cuisine || "Multi-cuisine"}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>{restaurant.delivery_time || "30"} mins</span>
                      <span className="text-emerald-700">View menu →</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {!loading && items.length > 0 && (
          <section className="space-y-4 pb-4">
            <div className="search-reveal-card flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700/75">Dishes</p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Menu items</h2>
              </div>
              <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(16,185,129,0.22)]">
                {items.length} result{items.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {items.map((item) => {
                const restaurantId = getRestaurantId(item.restaurant_id || item.restaurant);
                const imageItem = { ...item, restaurant_id: restaurantId };

                return (
                  <button
                    key={item._id}
                    onClick={() => goToRestaurant(restaurantId)}
                    className="search-reveal-card group flex gap-4 rounded-2xl border border-white/60 bg-white/45 p-4 text-left shadow-[0_0_30px_rgba(15,23,42,0.08),0_14px_38px_rgba(15,23,42,0.06)] transition-colors hover:bg-white/60"
                  >
                    <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      <img
                        src={resolveItemImage(imageItem)}
                        alt={item.name}
                        onError={handleImgError}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="min-w-0 flex-1 py-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">{item.name}</h3>
                          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-700/80 line-clamp-1">
                            {getRestaurantNameFromItem(item)}
                          </p>
                        </div>
                        <span className="flex-shrink-0 text-sm font-extrabold text-slate-900">₹{item.price || "—"}</span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                        {item.description || item.cuisine || "Popular menu item from this restaurant."}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">{item.rating ? `⭐ ${item.rating}` : "Menu match"}</span>
                        <span className="text-emerald-700">Open restaurant →</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
