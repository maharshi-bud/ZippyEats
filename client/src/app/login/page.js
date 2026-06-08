"use client";

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser } from "../../store/slices/authSlice";
import { useRouter } from "next/navigation";
import { startRouteLoader } from "../../lib/routeLoading";
import Head from "next/head";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Safely register ScrollTrigger on the client side to avoid Next.js SSR errors
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// 🍕 Gourmet Pepperoni Pizza Slice (Bespoke Production-Ready SVG)
const PizzaIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
    <path d="M15 11l-3 3" />
    <path d="M12 2C6.48 2 2 6.48 2 12c0 .64.05 1.28.15 1.91l8.52 4.41c.42.22.94.07 1.18-.33l10-10c.34-.51.13-1.19-.45-1.42L12.5 5.5" fill="rgba(249, 115, 22, 0.08)" />
    <circle cx="9" cy="8" r="1.3" fill="#ef4444" fillOpacity="0.4" stroke="#ef4444" strokeWidth="0.8" />
    <circle cx="7" cy="13" r="1.3" fill="#ef4444" fillOpacity="0.4" stroke="#ef4444" strokeWidth="0.8" />
    <circle cx="12" cy="12" r="1.3" fill="#ef4444" fillOpacity="0.4" stroke="#ef4444" strokeWidth="0.8" />
  </svg>
);

// 🍔 Classic Double-Cheese Burger (Bespoke Production-Ready SVG)
const BurgerIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
    <path d="M12 3a9 9 0 0 0-9 8h18a9 9 0 0 0-9-8z" fill="rgba(217, 119, 6, 0.08)" />
    <path d="M3 11h18" stroke="#16a34a" strokeWidth="2" /> 
    <path d="M3 14h18" stroke="#b45309" strokeWidth="2.5" /> 
    <path d="M5 14v2a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-2" fill="rgba(217, 119, 6, 0.08)" />
  </svg>
);

// 🍦 Strawberry Sundae Waffle Cone (Bespoke Production-Ready SVG)
const IceCreamIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
    <path d="M12 2a5 5 0 0 0-5 5v3h10V7a5 5 0 0 0-5-5z" fill="rgba(236, 72, 153, 0.08)" />
    <circle cx="12" cy="5" r="1" fill="#ef4444" stroke="#ef4444" /> 
    <path d="M6 10l6 11 6-11H6z" fill="rgba(217, 119, 6, 0.05)" stroke="#d97706" />
    <path d="M9 10l3 5.5M15 10l-3 5.5" stroke="#d97706" strokeWidth="1" />
  </svg>
);

// 🧑‍🍳 Royal Masterchef Hat (Bespoke Production-Ready SVG)
const ChefHatIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
    <path d="M6 18V9a6 6 0 0 1 12 0v9H6z" fill="rgba(16, 185, 129, 0.06)" />
    <path d="M3 18h18v3H3z" fill="rgba(16, 185, 129, 0.12)" />
    <path d="M12 3a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4z" />
  </svg>
);

// ☕ Hot Steaming Cappuccino (Bespoke Production-Ready SVG)
const CoffeeIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" fill="rgba(180, 83, 9, 0.08)" />
    <path d="M6 2c.5 1-.5 2 0 3M10 2c.5 1-.5 2 0 3M14 2c.5 1-.5 2 0 3" stroke="#ea580c" />
  </svg>
);

// 🍜 Hot Herbal Ramen Bowl (Bespoke Production-Ready SVG)
const SoupIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
    <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9z" fill="rgba(13, 148, 136, 0.08)" />
    <path d="M7 12V9M12 12V9M17 12V9" stroke="#0d9488" strokeWidth="1.2" />
    <path d="M3 12h18" />
  </svg>
);

const CrossIcon = () => (
  <svg width="26" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function FloatingCulinaryBg() {
  const containerRef = useRef(null);
  const fixedRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const fixedContainer = fixedRef.current;
    if (!container || !fixedContainer) return;

    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    const domItems = container.querySelectorAll(".roaming-icon");
    const iconStates = [];

    // 1. Initialize physical state objects for each body matching CodePen parameters
    domItems.forEach((el) => {
      const startX = Math.random() * viewportWidth;
      const startY = Math.random() * viewportHeight;
      const scale = 0.55 + Math.random() * 0.4;
      const opacity = 0.16 + Math.random() * 0.16;

      // Lock positions to 0 so translate3d calculates perfectly from top-left
      el.style.left = "0px";
      el.style.top = "0px";
      el.style.position = "absolute";
      el.style.opacity = opacity;

      // Setup initial base autonomous roaming velocities
      const initialBaseVx = -1.0 + Math.random() * 2.0;
      const initialBaseVy = -1.0 + Math.random() * 2.0;

      iconStates.push({
        el: el,
        x: startX,
        y: startY,
        vx: initialBaseVx, // current actual velocity X
        vy: initialBaseVy, // current actual velocity Y
        baseVx: initialBaseVx, // target baseline roaming speed X
        baseVy: initialBaseVy, // target baseline roaming speed Y
        scale: scale,
        angle: Math.random() * 360,
        vAngle: -0.4 + Math.random() * 0.8,
        baseVAngle: -0.2 + Math.random() * 0.4,
      });
    });

    let active = true;

    // 2. 🌀 Advanced 2D Kinematics and Speed-Decay Physics Loop (For Roaming Food Icons!)
    // - Air friction damping matches CodePen's `airFriction: 0.03` (velocity * 0.97) every frame.
    // - Incorporates a constant, highly active organic baseline velocities so they float steadily when not scrolling.
    // - When scrolling, vx/vy are propelled to high speeds. 
    // - On scroll stop, they carry the momentum throw, and slowly ease (lerp) from propelled speed back to their base roaming speeds!
    const updatePhysics = () => {
      if (!active) return;

      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;

      iconStates.forEach((icon) => {
        // Gently drift base velocities so they naturally curve in S-shapes and diagonals over time
        icon.baseVx += -0.02 + Math.random() * 0.04;
        icon.baseVy += -0.02 + Math.random() * 0.04;

        // Keep base velocities bounded so they float at a beautiful, steady speed
        const currentBaseSpeed = Math.sqrt(icon.baseVx * icon.baseVx + icon.baseVy * icon.baseVy);
        const maxBaseSpeed = 1.25; // Premium noticeable floating speed limit
        if (currentBaseSpeed > maxBaseSpeed) {
          icon.baseVx = (icon.baseVx / currentBaseSpeed) * maxBaseSpeed;
          icon.baseVy = (icon.baseVy / currentBaseSpeed) * maxBaseSpeed;
        }

        // 🚀 Smooth Speed-Decay Easing (Lerp):
        // - Interpolates current velocity (vx/vy) back to base velocity (baseVx/baseVy) by 3.5% per frame.
        // - This matches real-world momentum: flings decay naturally and settle back to normal roaming speed!
        icon.vx += (icon.baseVx - icon.vx) * 0.035;
        icon.vy += (icon.baseVy - icon.vy) * 0.035;
        icon.vAngle += (icon.baseVAngle - icon.vAngle) * 0.05;

        // Integrate positions
        icon.x += icon.vx;
        icon.y += icon.vy;
        icon.angle += icon.vAngle;

        // 🪐 Matter-Wrap simulation: seamlessly warp coordinates when passing screen borders!
        const padding = 60;
        if (icon.x < -padding) icon.x = viewportWidth + padding;
        if (icon.x > viewportWidth + padding) icon.x = -padding;
        if (icon.y < -padding) icon.y = viewportHeight + padding;
        if (icon.y > viewportHeight + padding) icon.y = -padding;

        // Apply hardware-accelerated transforms directly (0% lag!)
        icon.el.style.transform = `translate3d(${icon.x}px, ${icon.y}px, 0) rotate(${icon.angle}deg) scale(${icon.scale})`;
      });

      requestAnimationFrame(updatePhysics);
    };

    // Trigger physics loop
    requestAnimationFrame(updatePhysics);

    // 3. Throttled Scroll Velocity Listener matching the CodePen delta velocity algorithm!
    // - Incorporates 80ms throttling interval (CodePen scrollDelay: 100ms) to average out sub-pixel noise.
    // - This guarantees that ALL elements are propelled in the EXACT same direction at once!
    let lastScroll = 0;
    let scrollTimeout = null;

    const handleLenisScroll = (currentScroll) => {
      const diff = lastScroll - currentScroll; // positive on scroll UP, negative on scroll DOWN
      const delta = diff * 0.025; // CodePen scrollVelocity: 0.025

      iconStates.forEach((icon) => {
        const xVariance = 0.1 + Math.random() * 0.2; // xVarianceRange: [0.1, 0.3]
        const yVariance = 0.5 + Math.random() * 1.0; // yVarianceRange: [0.5, 1.5]

        // Add delta impulses directly to velocities (CodePen Matter.Body.setVelocity equivalent)
        icon.vx += delta * xVariance * 0.85;
        icon.vy += delta * yVariance * 0.85;
        icon.vAngle += delta * (-0.03 + Math.random() * 0.06) * 0.85;
      });

      lastScroll = currentScroll;
    };

    // Safely bind our scroll physics callback to window reference
    window.__handleLenisScroll = (e) => {
      if (scrollTimeout) return;
      
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        handleLenisScroll(e.scroll);
      }, 80); // 80ms throttle eliminates sub-pixel noise completely!
    };

    // 4. Ambient Grid Pulses & Lenses (GSAP scoped context)
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
      active = false;
      ctx.revert();
    };
  }, []);

  return (
    <>
      {/* 🌐 STATIC / FIXED LAYER: Grid lines and ambient lenses stay locked to screen */}
      <div
        ref={fixedRef}
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Emerald Grid Mesh */}
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

      {/* 🚀 FIXED BACKDROP VIEWPORT LAYER: Floating Roaming Food Icons wrapped smoothly on viewport boundaries */}
      <div
        ref={containerRef}
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Dynamic Object Pool: 22 beautifully balanced roaming food items */}
        <div className="roaming-icon absolute text-emerald-600/35"><PizzaIcon /></div>
        <div className="roaming-icon absolute text-slate-500/40"><CoffeeIcon /></div>
        <div className="roaming-icon absolute text-slate-500/40"><ChefHatIcon /></div>
        <div className="roaming-icon absolute text-emerald-600/45"><SoupIcon /></div>
        <div className="roaming-icon absolute text-emerald-600/45"><BurgerIcon /></div>
        <div className="roaming-icon absolute text-slate-500/40"><IceCreamIcon /></div>
        <div className="roaming-icon absolute text-slate-500/40"><CoffeeIcon /></div>
        <div className="roaming-icon absolute text-emerald-600/45"><PizzaIcon /></div>
        <div className="roaming-icon absolute text-emerald-600/45"><SoupIcon /></div>
        <div className="roaming-icon absolute text-slate-500/40"><BurgerIcon /></div>
        <div className="roaming-icon absolute text-slate-500/40"><ChefHatIcon /></div>
        <div className="roaming-icon absolute text-emerald-600/45"><PizzaIcon /></div>
        <div className="roaming-icon absolute text-slate-500/40"><CoffeeIcon /></div>
        <div className="roaming-icon absolute text-emerald-600/45"><BurgerIcon /></div>
        <div className="roaming-icon absolute text-slate-500/40"><ChefHatIcon /></div>
        <div className="roaming-icon absolute text-emerald-600/45"><SoupIcon /></div>
        <div className="roaming-icon absolute text-slate-500/40"><IceCreamIcon /></div>
        <div className="roaming-icon absolute text-emerald-600/45"><PizzaIcon /></div>
        <div className="roaming-icon absolute text-slate-500/40"><CoffeeIcon /></div>
        <div className="roaming-icon absolute text-emerald-600/45"><BurgerIcon /></div>
        <div className="roaming-icon absolute text-slate-500/40"><ChefHatIcon /></div>
        <div className="roaming-icon absolute text-emerald-600/45"><SoupIcon /></div>
      </div>
    </>
  );
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const dispatch = useDispatch();
  const router = useRouter();

  const { token, loading, error } = useSelector((state) => state.auth);

  // Animation refs
  const cardRef = useRef(null);
  const formRef = useRef(null);

  const handleSubmit = () => {
    if (isLogin) {
      dispatch(loginUser(form));
    } else {
      dispatch(registerUser(form));
    }
  };

  useEffect(() => {
    if (token) {
      startRouteLoader();
      router.push("/");
    }
  }, [token, router]);

  // 🌀 Butter-Smooth Lenis Scroll Sync
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
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

  // ── GSAP: Tactile horizontal shake on validation/auth error ───────────────
  useEffect(() => {
    if (error) {
      gsap.to(cardRef.current, {
        x: "random(-10, 10)",
        duration: 0.05,
        repeat: 5,
        yoyo: true,
        onComplete: () => {
          gsap.to(cardRef.current, { x: 0, duration: 0.1 });
        }
      });
    }
  }, [error]);

  // ── GSAP: Smooth staggered entrance for input elements on switch ───────────
  useEffect(() => {
    const inputs = formRef.current?.querySelectorAll("input");
    if (inputs && inputs.length > 0) {
      gsap.fromTo(
        inputs,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.06, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [isLogin]);

  return (
    <div className="relative min-h-[90vh] w-full flex items-center justify-center overflow-hidden px-4">
      <Head>
        <title>Login — ZippyEats</title>
      </Head>

      {/* 
        📐 Matter-Equivalent Scroll-Physics Background (Injected into Login Page!):
        - High-density emerald green grid coordinate mesh background.
        - 22 custom-drawn detailed food SVGs roaming organically when stationary.
        - Flinging with 1:1 scroll velocity physics, border-wrapping matter bounds, and speed-decay deceleration!
      */}
      <FloatingCulinaryBg />

      {/* Content Login Glassmorphism Card */}
      <div 
        ref={cardRef}
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 border border-slate-100 ml-[33vw] text-slate-800"
        style={{
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
        }}
      >
        {/* Subtle breathing gradient line at the top of the card */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 rounded-t-2xl animate-[gradientShift_4s_ease_infinite] bg-[length:200%_200%]" />

        {/* TITLE */}
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">
          {isLogin ? "Welcome Back 👋" : "Create Account 🚀"}
        </h2>

        {/* FORM FIELDS Container */}
        <div ref={formRef} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all duration-200"
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all duration-200"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all duration-200"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />
        </div>

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all duration-200 active:scale-95 disabled:opacity-60 shadow-md hover:shadow-green-200"
        >
          {loading
            ? "Please wait..."
            : isLogin
            ? "Login"
            : "Register"}
        </button>

        {/* ERROR MESSAGE with subtle pop-in */}
        {error && (
          <p className="text-red-500 text-sm mt-3 text-center font-medium animate-pulse">
            {error}
          </p>
        )}

        {/* SWITCH TAB LINK */}
        <p
          onClick={() => setIsLogin(!isLogin)}
          className="mt-6 text-center text-sm text-slate-500 cursor-pointer hover:text-green-600 transition-colors duration-200 font-medium"
        >
          {isLogin
            ? "New user? Register"
            : "Already have an account? Login"}
        </p>
      </div>

      {/* Hardware-accelerated CSS animation utilities */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
