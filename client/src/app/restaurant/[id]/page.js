"use client";

import { useEffect, useState, useRef } from "react";
import api from "../../../lib/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  decreaseQty,
  selectCartItems,
} from "../../../store/slices/cartSlice";
import { selectLocation } from "../../../store/slices/locationSlice";
import {
  resolveItemImage,
  handleImgError,
} from "../../../lib/imageUtils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Safely register ScrollTrigger on client side
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const CrossIcon = () => (
  <svg width="26" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// 📐 Slanted 3D Column Grid Background Component (Emerald Green Tint)
function FloatingCulinaryBg() {
  const fixedRef = useRef(null);
  const row1Ref = useRef(null);
  const row2Ref = useRef(null);
  const row3Ref = useRef(null);

  useEffect(() => {
    const fixedContainer = fixedRef.current;
    if (!fixedContainer) return;

    let active = true;

    // Target horizontal translations (relative offsets)
    let targetX1 = -150;
    let targetX2 = -200;
    let targetX3 = -150;

    let currentX1 = -150;
    let currentX2 = -200;
    let currentX3 = -150;

    // 🌀 Slanted Columns Horizontal Scroll Sync (with smooth 6% Lerping Inertia)
    // - Configured strictly to slide: LEFT, RIGHT, LEFT on scroll down!
    const handleLenisScroll = (e) => {
      const scroll = e.scroll;

      // Row 1 (Top) slides LEFT (-x), Row 2 (Middle) slides RIGHT (+x), Row 3 (Bottom) slides LEFT (-x)
      targetX1 = -150 - scroll * 0.28;
      targetX2 = -200 + scroll * 0.28;
      targetX3 = -150 - scroll * 0.28;
    };

    window.__handleLenisScroll = handleLenisScroll;

    // Linear interpolation loop running on high speed requestAnimationFrame for slanted lanes
    // - Cards move strictly in a straight horizontal line as single rigid row blocks!
    const updateLanes = () => {
      if (!active) return;

      currentX1 += (targetX1 - currentX1) * 0.06; // 6% cushioning deceleration lag
      currentX2 += (targetX2 - currentX2) * 0.06;
      currentX3 += (targetX3 - currentX3) * 0.06;

      if (row1Ref.current) row1Ref.current.style.transform = `translateX(${currentX1}px)`;
      if (row2Ref.current) row2Ref.current.style.transform = `translateX(${currentX2}px)`;
      if (row3Ref.current) row3Ref.current.style.transform = `translateX(${currentX3}px)`;

      requestAnimationFrame(updateLanes);
    };

    requestAnimationFrame(updateLanes);

    // 🔮 Global ambient light slow floats (keeps background alive without moving individual cards)
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
   
    });

    return () => {
      active = false;
      ctx.revert();
    };
  }, []);

  // Helper function to render a row of slanted emerald-green Cards
  // - Cards kept perfectly flat, rigid, and locked to ensure 100% consistent gaps/margins
  const renderCardRow = () => {
    return Array.from({ length: 12 }).map((_, i) => (
      <div
        key={i}
        className="grid-mesh-card flex-shrink-0 rounded-[32px] border relative transition-shadow duration-300"
        style={{
          width: 420,
          height: 250,
          // 🌐 Emerald Green Brand Color Scheme: Translucent frosted green card styling
          background: "linear-gradient(135deg, rgba(22, 163, 74, 0.05) 0%, rgba(22, 163, 74, 0.015) 100%)",
          borderColor: "rgba(22, 163, 74, 0.16)",
          boxShadow: "0 15px 35px rgba(22, 163, 74, 0.03)",
        }}
      />
    ));
  };

  return (
    <div
      ref={fixedRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#f0f3f1]"
      style={{ width: "100vw", height: "100vh" }}
    >
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

      {/* 📐 Slanted 3D Column Grid Wrapper (Under-layer):
          - Gap decreased to 4 (16px) to minimize vertical margins between rows.
          - Scale increased to 1.25 to securely cover all margins.
          - No individual card translations are applied, keeping gaps 100% mathematically locked!
      */}
      <div
        className="absolute inset-0 flex flex-col justify-center gap-4"
        style={{
          transform: "rotate(-12deg) scale(1.25)",
          transformOrigin: "center center",
          left: "-18vw",
          width: "135vw",
        }}
      >
        {/* Row 1: Top Lane (Slides LEFT on scroll down) - gap decreased to 4 (16px) */}
        <div ref={row1Ref} className="flex gap-4 whitespace-nowrap" style={{ width: "240%", willChange: "transform" }}>
          {renderCardRow()}
        </div>

        {/* Row 2: Middle Lane (Slides RIGHT on scroll down) */}
        <div ref={row2Ref} className="flex gap-4 whitespace-nowrap" style={{ width: "240%", willChange: "transform" }}>
          {renderCardRow()}
        </div>

        {/* Row 3: Bottom Lane (Slides LEFT on scroll down) */}
        <div ref={row3Ref} className="flex gap-4 whitespace-nowrap" style={{ width: "240%", willChange: "transform" }}>
          {renderCardRow()}
        </div>
      </div>
    </div>
  );
}

export default function RestaurantPage({ params }) {
  const [data, setData] = useState(null);
  const [openCuisines, setOpenCuisines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const deliveryAddress = useSelector(selectLocation);

  // Filter state
  const [vegOnly, setVegOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);

  // Animation refs
  const pageContainerRef = useRef(null);
  const headerRef = useRef(null);
  const dealsRef = useRef(null);
  const menuHeaderRef = useRef(null);
  const accordionRefs = useRef({});

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
    lenis.on("scroll", (e) => {
      ScrollTrigger.update();
      // Safely check and execute the background's scroll physics callback!
      if (typeof window !== "undefined" && window.__handleLenisScroll) {
        window.__handleLenisScroll(e);
      }
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

  // Toggle handlers
  const handleVegToggle = () => {
    setVegOnly((prev) => {
      const next = !prev;
      if (next) setNonVegOnly(false);
      return next;
    });
  };

  const handleNonVegToggle = () => {
    setNonVegOnly((prev) => {
      const next = !prev;
      if (next) setVegOnly(false);
      return next;
    });
  };

  const getQty = (id) =>
    cartItems.find((i) => i.menu_item_id === id)?.quantity || 0;

  const rememberViewedItem = (itemId) => {
    if (typeof window === "undefined") return;
    try {
      const key = "recentlyViewedItems";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const next = [itemId, ...existing.filter((id) => id !== itemId)].slice(0, 15);
      localStorage.setItem(key, JSON.stringify(next));
    } catch (err) {
      console.error("Failed to save recently viewed item", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await api.get(`/restaurant/${params.id}`);
      setData(res.data.data);
    };
    fetchData();
  }, [params.id]);

  // Open all by default
  useEffect(() => {
    if (data?.menu) {
      const cuisines = [...new Set(data.menu.map((item) => item.cuisine))];
      setOpenCuisines(cuisines);
    }
  }, [data]);

  // ── GSAP: ScrollTrigger Viewport Reveals (Reveal when visible) ───────────────
  useEffect(() => {
    if (!data) return;

    const ctx = gsap.context(() => {
      // 1. Initial Header (Breadcrumb, title, card) — immediate slide-up on load
      if (headerRef.current) {
        gsap.from(headerRef.current.children, {
          opacity: 0,
          y: 35,
          stagger: 0.1,
          duration: 0.6,
          ease: "power3.out",
        });
      }

      // 2. Deals for you carousel — reveals smoothly as it enters viewport
      if (dealsRef.current) {
        gsap.from(dealsRef.current, {
          scrollTrigger: {
            trigger: dealsRef.current,
            start: "top bottom-=80px", // Trigger when 80px into viewport
            once: true,
          },
          opacity: 0,
          x: 40,
          duration: 0.6,
          ease: "power3.out",
        });
      }

      // 3. Menu Title, search, and switches — reveal when visible
      if (menuHeaderRef.current) {
        gsap.from(menuHeaderRef.current.children, {
          scrollTrigger: {
            trigger: menuHeaderRef.current,
            start: "top bottom-=80px",
            once: true,
          },
          opacity: 0,
          y: 20,
          stagger: 0.08,
          duration: 0.5,
          ease: "power2.out",
        });
      }

      // 4. Cuisine Accordion Cards — stagger-revealed as they scroll into view
      const accordions = pageContainerRef.current?.querySelectorAll(".cuisine-accordion-card");
      if (accordions && accordions.length > 0) {
        gsap.from(accordions, {
          scrollTrigger: {
            trigger: accordions[0],
            start: "top bottom-=100px",
            once: true,
          },
          opacity: 0,
          y: 45,
          stagger: 0.1,
          duration: 0.6,
          ease: "power3.out",
        });
      }
    }, pageContainerRef);

    return () => ctx.revert();
  }, [data]);

  // ── GSAP: Smooth Height Accordion Collapse & Expand ─────────────────────────
  useEffect(() => {
    if (!data?.menu) return;
    const cuisines = [...new Set(data.menu.map((item) => item.cuisine))];

    cuisines.forEach((cuisine) => {
      const el = accordionRefs.current[cuisine];
      if (!el) return;

      const isOpen = openCuisines.includes(cuisine);

      if (isOpen) {
        // Guard: If already open/auto, do not re-run animation to avoid glitching during typing/filtering/cart updates
        if (el.style.height === "auto" || el.dataset.animating === "open") {
          return;
        }

        // Capture exact scroll height dynamically
        const targetHeight = el.scrollHeight;

        el.dataset.animating = "open";

        // Smooth expanding transition
        gsap.to(el, {
          height: targetHeight,
          opacity: 1,
          duration: 0.45,
          ease: "power2.out",
          onComplete: () => {
            // Revert height to auto so it remains fully responsive to filters and window resizes!
            gsap.set(el, { height: "auto" });
            delete el.dataset.animating;
          }
        });

        // Stagger list dishes rise inside expanded accordion body
        const dishes = el.querySelectorAll(".dish-row");
        if (dishes.length > 0) {
          gsap.fromTo(dishes,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, stagger: 0.04, duration: 0.45, ease: "power2.out", delay: 0.08 }
          );
        }
      } else {
        // Guard: If already closed, do not re-run animation
        if (el.style.height === "0px" || el.style.height === "0" || el.dataset.animating === "close") {
          return;
        }

        el.dataset.animating = "close";

        // Set the height from auto/current to explicit height so GSAP can animate it down to 0
        const currentHeight = el.offsetHeight;
        gsap.set(el, { height: currentHeight });

        // Smooth collapsing transition
        gsap.to(el, {
          height: 0,
          opacity: 0,
          duration: 0.35,
          ease: "power2.inOut",
          onComplete: () => {
            el.style.height = "0px";
            delete el.dataset.animating;
          }
        });
      }
    });
  }, [openCuisines, data]);

  // ── GSAP: Smooth Elastic Deals Carousel Scrolling ─────────────────────────
  const scrollDeals = (dir) => {
    const el = document.getElementById("deals-scroll");
    if (!el || !el.firstElementChild) return;
    
    const card = el.firstElementChild;
    const cardWidth = card.getBoundingClientRect().width;
    const gap = parseFloat(window.getComputedStyle(el).gap) || 16;
    const scrollAmount = cardWidth + gap;

    gsap.to(el, {
      scrollLeft: el.scrollLeft + dir * scrollAmount,
      duration: 0.5,
      ease: "power2.out"
    });
  };

  // Filter menu items based on search and veg/non-veg filters
  const getFilteredMenu = () => {
    if (!data?.menu) return [];

    return data.menu.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.cuisine?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesVegFilter =
        (!vegOnly && !nonVegOnly) ||
        (vegOnly && item.veg) ||
        (nonVegOnly && !item.veg);

      return matchesSearch && matchesVegFilter;
    });
  };

  // Group filtered items by cuisine
  const grouped = getFilteredMenu().reduce((acc, item) => {
    if (!acc[item.cuisine]) acc[item.cuisine] = [];
    acc[item.cuisine].push(item);
    return acc;
  }, {});

  const allItems = Object.values(grouped).flat();

  let globalBestSellerId = null;
  let maxReviews = 0;
  allItems.forEach((item) => {
    const reviews = item.totalReviews || 0;
    if (reviews > maxReviews) {
      maxReviews = reviews;
      globalBestSellerId = item._id;
    }
  });

  let globalTopRatedId = null;
  let maxRating = 0;
  allItems.forEach((item) => {
    const rating = item.rating || 0;
    if (rating > maxRating && item._id !== globalBestSellerId) {
      maxRating = rating;
      globalTopRatedId = item._id;
    }
  });

  const toggleCuisine = (cuisine) => {
    setOpenCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  // Subtle tactile cart controls — intentionally no bounce/spring.
  // Keep GSAP as the only animation authority for these controls.
  const animateAddClick = (button, onComplete) => {
    if (!button) {
      onComplete?.();
      return;
    }

    gsap.killTweensOf(button);
    gsap.timeline({ onComplete })
      .to(button, {
        scale: 0.97,
        y: 1,
        duration: 0.08,
        ease: "power2.out",
      })
      .to(button, {
        scale: 0.985,
        opacity: 0.88,
        duration: 0.07,
        ease: "power2.inOut",
      });
  };

  const animateStepperEnter = (stepper) => {
    if (!stepper || stepper.dataset.stepperAnimated === "true") return;

    stepper.dataset.stepperAnimated = "true";
    gsap.fromTo(
      stepper,
      { opacity: 0, y: 5, scale: 0.985, filter: "blur(2px)" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.24,
        ease: "power3.out",
        clearProps: "filter",
      }
    );
  };

  const animateStepperTap = (button, direction = 1) => {
    if (!button) return;

    const stepper = button.closest(".cart-stepper");
    const qty = stepper?.querySelector(".stepper-qty");

    gsap.killTweensOf([button, stepper, qty].filter(Boolean));

    gsap.timeline()
      .to(button, {
        scale: 0.9,
        duration: 0.055,
        ease: "power2.out",
      })
      .to(button, {
        scale: 1,
        duration: 0.16,
        ease: "power3.out",
      });

    if (stepper) {
      gsap.fromTo(
        stepper,
        { boxShadow: "0 8px 18px rgba(15, 23, 42, 0.11), 0 0 0 0 rgba(22, 163, 74, 0)" },
        {
          boxShadow: "0 10px 22px rgba(15, 23, 42, 0.13), 0 0 0 3px rgba(22, 163, 74, 0.10)",
          duration: 0.12,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
          clearProps: "boxShadow",
        }
      );
    }

    if (qty) {
      gsap.fromTo(
        qty,
        { y: direction > 0 ? 3 : -3, opacity: 0.72, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.2, ease: "power3.out" }
      );
    }
  };

  if (!data) return <div className="p-10 text-center">Loading...</div>;

  return (
    /* 
      📐 Real-World Sibling Layer Depth structure:
      - Sits inside a relative wrapping container.
      - Backdrop is <FloatingCulinaryBg /> sitting at 'fixed inset-0'.
      - Main content is a frosted glass pane styled in bg-blue-100/45.
    */
    <div className="relative min-h-screen w-full pb-16">
      
      {/* 📐 Slanted 3D Column Grid Background (Under-layer) - Sits outside of the transformed container! */}
      <FloatingCulinaryBg />

      {/* 
        🎨 Dynamic Ice-Blue Glass Glassmorphism Panel Wrapper:
        - Frosted ice-blue background tint bg-blue-100/45 with border-blue-200/50.
        - The cards and accordion rows float beautifully on top of this plate.
      */}
      <div 
        ref={pageContainerRef} 
        className="max-w-4xl mx-auto px-4 md:px-8 py-8 bg-white/10 backdrop-blur-[16px] border border-white/20 shadow-2xl shadow-black/10 rounded-[36px] min-h-screen relative z-10 mt-6 mb-12"
        // className="max-w-4xl mx-auto px-4 md:px-8 py-8 bg-white/5 backdrop-blur-[20px] border border-white/30 shadow-2xl shadow-black/15 rounded-[36px] min-h-screen relative z-10 mt-6 mb-12"
        // className="max-w-4xl mx-auto px-4 md:px-8 py-8 bg-white/30 backdrop-blur-[10px] border border-white/50 shadow-2xl shadow-black/5 rounded-[36px] min-h-screen relative z-10 mt-6 mb-12"
        // className="max-w-4xl mx-auto px-4 md:px-8 py-8 bg-white-10/30 backdrop-blur-[10px] border border-white-200/50 shadow-2xl shadow-white-900/5 rounded-[36px] min-h-screen relative z-10 mt-6 mb-12"
        style={{
          boxSizing: "border-box",
        }}
      >
        {/* HEADER SEGMENT */}
        <div ref={headerRef} className="space-y-4 relative z-10">
          {/* BREADCRUMB */}
          <nav className="text-xs text-slate-400 text-left">
            <span className="hover:text-slate-600 cursor-pointer font-medium">Home</span>
            <span className="mx-2">/</span>
            <span className="hover:text-slate-600 cursor-pointer font-medium">Ahmedabad</span>
            <span className="mx-2">/</span>
            <span className="text-slate-600 font-semibold truncate">{data.name}</span>
          </nav>

          {/* RESTAURANT NAME */}
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-5 text-left tracking-tight">
            {data.name}
          </h1>

          {/* INFO CARD */}
          <div className="bg-gradient-to-b from-transparent to-b via-slate-100 to-slate-200 rounded-b-[36px] px-4 py-4 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-[rgba(2,6,12,0.15)] shadow-[0_8px_16px_rgba(0,0,0,0.04)]">
              {/* ROW 1 */}
              <div className="flex flex-wrap items-start justify-start gap-2 text-left">
                <div className="flex items-left gap-2 mb-3">
                  <div className="flex items-left gap-1.5 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    <span>★</span>
                    <span>{data.rating || "4.2"}</span>
                  </div>
                  <span className="text-sm text-slate-500 font-medium">
                    ({data.totalReviews || "120"}+ ratings)
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-sm text-slate-500 font-medium">
                    ₹{data.avg_price_for_two || "300"} for two
                  </span>
                </div>
              </div>

              {/* ROW 2 */}
              <div className="flex flex-wrap items-center justify-start gap-2 mb-0 text-left">
                <div className="flex items-center gap-1.5 mb-4">
                  {data.cuisines?.map((c, i) => (
                    <span key={c}>
                      <span className="text-sm text-orange-500 font-bold cursor-pointer hover:underline">
                        {c}
                      </span>
                      {i < data.cuisines.length - 1 && (
                        <span className="text-slate-300 ml-1.5 font-bold">,</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* DIVIDER */}
              <div className="border-t border-dashed border-slate-200 mb-4" />

              {/* ROW 3 */}
              <div className="flex flex-wrap items-center justify-start gap-2 mb-0 text-left">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-start gap-0.5 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      <div className="w-px h-4 bg-slate-300" />
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                    </div>
                    <div className="flex flex-col items-start gap-1.5">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-bold text-slate-700">Outlet</span>
                        <span className="text-sm text-slate-500 font-medium">
                          {deliveryAddress || "Gandhinagar"}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-700 self-start text-left">
                        {data.delivery_time || "30"}–{(data.delivery_time || 10) + 10} mins
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DEALS FOR YOU (Polished spacing & margins) */}
        <div ref={dealsRef} className="my-10 text-left relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Deals for you
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollDeals(-1)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm grid place-items-center text-slate-600 text-lg hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition"
              >
                <span className="block leading-none -mt-px">‹</span>
              </button>
              <button
                onClick={() => scrollDeals(1)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm grid place-items-center text-slate-600 text-lg hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition"
              >
                <span className="block leading-none -mt-px">›</span>
              </button>
            </div>
          </div>

          <div
            id="deals-scroll"
            className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {/* DEAL 1 */}
            <div className="flex-shrink-0 w-[320px] snap-start flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="grid place-items-center w-14 h-14 rounded-xl bg-blue-50 flex-shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="3" stroke="#3b82f6" strokeWidth="1.5" />
                  <path d="M2 10h20" stroke="#3b82f6" strokeWidth="1.5" />
                  <path d="M6 14h4" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-base font-extrabold text-slate-800 leading-tight">20% off up to ₹120</p>
                <p className="mt-1.5 text-sm font-medium text-slate-500 leading-snug">
                  Use code <span className="font-bold text-blue-500">HDFCFEST</span>
                </p>
                <p className="mt-1 text-xs text-slate-400 leading-normal">
                  On orders above ₹249 with HDFC Bank cards
                </p>
              </div>
            </div>

            {/* DEAL 2 */}
            <div className="flex-shrink-0 w-[320px] h-[115px] snap-start flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="grid place-items-center w-14 h-14 rounded-xl bg-orange-50 flex-shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="min-w-0 text-left">
                <p className="text-base font-extrabold text-slate-800 leading-tight">Flat ₹150 off</p>
                <p className="mt-1.5 text-sm font-medium text-slate-500 leading-snug">
                  Use code <span className="font-bold text-orange-500">TRYNEW</span>
                </p>
                <p className="mt-1 text-xs text-slate-400 leading-normal">On your first order above ₹349</p>
              </div>
            </div>

            {/* DEAL 3 */}
            <div className="flex-shrink-0 w-[320px] snap-start flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="grid place-items-center w-14 h-14 rounded-xl bg-green-50 flex-shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="9" r="2" stroke="#22c55e" strokeWidth="1.5" />
                  <circle cx="15" cy="15" r="2" stroke="#22c55e" strokeWidth="1.5" />
                  <path d="M7.5 16.5l9-9" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="2" y="2" width="20" height="20" rx="4" stroke="#22c55e" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-base font-extrabold text-slate-800 leading-tight">60% off up to ₹100</p>
                <p className="mt-1.5 text-sm font-medium text-slate-500 leading-snug">
                  Use code <span className="font-bold text-green-500">ZIPPY60</span>
                </p>
                <p className="mt-1 text-xs text-slate-400 leading-normal">
                  On orders above ₹199. No minimum for Zippy One
                </p>
              </div>
            </div>

            {/* DEAL 4 */}
            <div className="flex-shrink-0 w-[320px] snap-start flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="grid place-items-center w-14 h-14 rounded-xl bg-purple-50 flex-shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="3" stroke="#8b5cf6" strokeWidth="1.5" />
                  <path d="M2 10h20" stroke="#8b5cf6" strokeWidth="1.5" />
                  <circle cx="17" cy="14" r="1.5" stroke="#8b5cf6" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="min-w-0 text-left">
                <p className="text-base font-extrabold text-slate-800 leading-tight">15% off up to ₹200</p>
                <p className="mt-1.5 text-sm font-medium text-slate-500 leading-snug">
                  Use code <span className="font-bold text-purple-500">AXISCC</span>
                </p>
                <p className="mt-1 text-xs text-slate-400 leading-normal">
                  On orders above ₹499 with Axis credit cards
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MENU HEADER SEGMENT */}
        <div ref={menuHeaderRef} className="space-y-5 mb-6 relative z-10">
          {/* MENU HEADING */}
          <div className="flex items-center justify-center mb-2">
            <div className="flex-1 h-px bg-slate-300"></div>
            <h2 className="px-6 text-2xl font-extrabold text-slate-800 tracking-wide">MENU</h2>
            <div className="flex-1 h-px bg-slate-300"></div>
          </div>

          {/* SEARCH BAR */}
          <div className="relative mb-0">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search for dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-4 bg-white rounded-2xl border border-slate-200 
                       shadow-sm text-slate-700 placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent
                       transition duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* VEG / NON-VEG FILTERS */}
          <div className="px-6 py-1 rounded-2xl">
            <div className="flex items-center gap-6 flex-wrap" style={{ justifyContent: "start" }}>
              <label className="veg-switch veg flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={vegOnly}
                  onChange={handleVegToggle}
                />
                <div className="slider" />
              </label>

              <label className="veg-switch nonveg flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={nonVegOnly}
                  onChange={handleNonVegToggle}
                />
                <div className="slider" />
              </label>
            </div>
          </div>
        </div>

        {/* SEARCH RESULTS INFO */}
        {searchQuery && (
          <div className="mb-4 px-2 text-left relative z-10">
            <p className="text-sm text-slate-500 font-medium">
              {allItems.length} results for "{searchQuery}"
            </p>
          </div>
        )}

        {/* NO RESULTS MESSAGE */}
        {allItems.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200 mb-8 relative z-10">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full grid place-items-center">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">No items found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}

        {/* MENU CUISINE SECTIONS */}
        {Object.entries(grouped).map(([cuisine, items]) => {
          const isOpen = openCuisines.includes(cuisine);

          return (
            <div key={cuisine} className="cuisine-accordion-card mb-4 relative z-10">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {/* HEADER */}
                <button
                  onClick={() => toggleCuisine(cuisine)}
                  className={`w-full flex justify-between items-center px-6 py-4 hover:shadow-s transition-all duration-200 ${
                    isOpen ? "border-b border-slate-200 bg-slate-50/50" : ""
                  }`}
                >
                  <span className="text-lg font-bold text-slate-800">
                    {cuisine}{" "}
                    <span className="text-slate-400 text-sm font-normal">
                      ({items.length})
                    </span>
                  </span>
                  <span className="text-2xl font-semibold text-slate-600">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {/* SMOOTH LIQUID ACCORDION CONTENT */}
                <div
                  ref={(el) => {
                    if (el) {
                      accordionRefs.current[cuisine] = el;
                      if (!el.dataset.initialized) {
                        const isCuisineOpen = openCuisines.includes(cuisine);
                        el.style.height = isCuisineOpen ? "auto" : "0px";
                        el.style.opacity = isCuisineOpen ? "1" : "0";
                        el.dataset.initialized = "true";
                      }
                    }
                  }}
                  style={{
                    overflow: "hidden",
                  }}
                  className="w-full"
                >
                  <div className="p-1">
                    {items.map((item) => {
                      const isBestSeller = item._id === globalBestSellerId;
                      const isTopRated = item._id === globalTopRatedId;
                      const quantity = getQty(item._id);

                      return (
                        <div
                          key={item._id}
                          onClick={() => rememberViewedItem(item._id)}
                          className="dish-row flex items-start justify-between gap-6 px-6 py-5 hover:bg-slate-50/50 transition-colors duration-200 cursor-pointer group border-b border-slate-100 last:border-b-0"
                        >
                          {/* LEFT — DETAILS */}
                          <div className="flex-1 min-w-0 text-left self-start">
                            {/* VEG/NON-VEG + BADGES */}
                            <div className="flex items-center gap-2 mb-2">
                              {item.veg ? (
                                <div className="w-[18px] h-[18px] border-[2px] border-green-700 grid place-items-center rounded-[5px] flex-shrink-0">
                                  <div className="w-2 h-2 rounded-full bg-green-700" />
                                </div>
                              ) : (
                                <div className="w-[18px] h-[18px] border-[2px] border-red-700 grid place-items-center rounded-[5px] flex-shrink-0">
                                  <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-700" />
                                </div>
                              )}

                              {isBestSeller && (
                                <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" />
                                  </svg>
                                  <span className="text-[12px] font-bold text-amber-700 uppercase tracking-wide leading-none">
                                    Bestseller
                                  </span>
                                </div>
                              )}

                              {isTopRated && (
                                <div className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 15l-3.09 1.62.59-3.45L7 10.74l3.46-.5L12 7l1.54 3.24 3.46.5-2.5 2.43.59 3.45L12 15z" fill="#3b82f6" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.5" fill="none" />
                                  </svg>
                                  <span className="text-[12px] font-bold text-blue-700 uppercase tracking-wide leading-none">
                                    Top Rated
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* NAME */}
                            <h3 className="text-base text-[18px] font-bold text-slate-900 leading-tight mb-1">
                              {item.name}
                            </h3>

                            {/* PRICE */}
                            <p className="text-[15px] font-semibold text-slate-800 mb-1.5">
                              ₹{item.price}
                            </p>

                            {/* RATING */}
                            {item.rating && (
                              <div className="inline-flex items-center gap-1 mb-2">
                                <span className="text-green-700 text-sm leading-none">★</span>
                                <span className="text-sm font-bold text-green-700 leading-none">
                                  {item.rating}
                                </span>
                                <span className="text-xs text-slate-400 leading-none ml-0.5">
                                  ({item.totalReviews || 0})
                                </span>
                              </div>
                            )}

                            {/* DESCRIPTION */}
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                              {item.description || "Popular item — try it now!"}
                            </p>
                          </div>

                          {/* RIGHT — IMAGE + ADD BUTTON */}
                          <div className="flex-shrink-0 w-[150px] flex flex-col items-center">
                            <div className="relative w-[150px] pb-5">
                              <div className="h-[140px] w-[150px] rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-100">
                                <img
                                  src={resolveItemImage(item)}
                                  onError={handleImgError}
                                  alt={item.name}
                                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                />
                              </div>

                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[110px]">
                                {quantity === 0 ? (
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      rememberViewedItem(item._id);
                                      animateAddClick(event.currentTarget, () => {
                                        dispatch(
                                          addToCart({
                                            menu_item_id: item._id,
                                            name: item.name,
                                            price: item.price,
                                            restaurant_id: item.restaurant_id,
                                            image: item.image,
                                          })
                                        );
                                      });
                                    }}
                                    className="w-full h-10 bg-white text-green-600 text-sm font-extrabold rounded-lg shadow-md border border-slate-200 uppercase tracking-wide hover:bg-green-50 hover:border-green-300 hover:shadow-lg transition-colors duration-200"
                                  >
                                    ADD
                                  </button>
                                ) : (
                                  <div
                                    ref={animateStepperEnter}
                                    className="cart-stepper w-full h-10 bg-white text-green-600 rounded-lg shadow-md border border-slate-200 grid grid-cols-3 place-items-center font-extrabold"
                                  >
                                    <button
                                      className="w-full h-full grid place-items-center text-lg hover:bg-green-50 rounded-l-lg transition-colors duration-150"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        rememberViewedItem(item._id);
                                        const button = event.currentTarget;
                                        animateStepperTap(button, -1);
                                        if (quantity <= 1) {
                                          setTimeout(() => dispatch(decreaseQty(item._id)), 120);
                                        } else {
                                          dispatch(decreaseQty(item._id));
                                        }
                                      }}
                                    >
                                      <span className="block leading-none">−</span>
                                    </button>
                                    <span className="stepper-qty text-sm tabular-nums">{quantity}</span>
                                    <button
                                      className="w-full h-full grid place-items-center text-lg hover:bg-green-50 rounded-r-lg transition-colors duration-150"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        rememberViewedItem(item._id);
                                        const button = event.currentTarget;
                                        dispatch(
                                          addToCart({
                                            menu_item_id: item._id,
                                            name: item.name,
                                            price: item.price,
                                            restaurant_id: item.restaurant_id,
                                            image: item.image,
                                          })
                                        );
                                        requestAnimationFrame(() => animateStepperTap(button, 1));
                                      }}
                                    >
                                      <span className="block leading-none">+</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div> {/* Closes pageContainerRef */}
    </div>
  );
}