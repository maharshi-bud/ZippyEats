"use client";

import { useSelector, useDispatch } from "react-redux";
import {
  selectCartItems,
  selectCartTotal,
  clearCart,
  addToCart,
  removeFreeRewardItems,
} from "../../store/slices/cartSlice";

import { useRouter } from "next/navigation";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../../lib/axios";

import { startRouteLoader } from "../../lib/routeLoading";
import gsap from "gsap";

const DELIVERY_FEE = 40;

const CrossIcon = () => (
  <svg width="26" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function CheckoutGridBg() {
  const fixedRef = useRef(null);

  useEffect(() => {
    const fixedContainer = fixedRef.current;
    if (!fixedContainer) return;

    const ctx = gsap.context(() => {
      const crosses = fixedContainer.querySelectorAll(".checkout-grid-cross");
      crosses.forEach((cross, i) => {
        gsap.to(cross, {
          scale: 1.35,
          opacity: 0.22,
          duration: 3 + i * 0.25,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      const lenses = fixedContainer.querySelectorAll(".checkout-ambient-lens");
      lenses.forEach((lens, i) => {
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
        className="checkout-ambient-lens absolute top-[4%] left-[-15%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-[0.22] pointer-events-none"
        style={{ background: "radial-gradient(circle, #ffedd5 0%, transparent 70%)" }}
      />
      <div
        className="checkout-ambient-lens absolute bottom-[10%] right-[-15%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-[0.24] pointer-events-none"
        style={{ background: "radial-gradient(circle, #dcfce7 0%, transparent 70%)" }}
      />
      <div
        className="checkout-ambient-lens absolute top-[35%] right-[5%] w-[50vw] h-[50vw] rounded-full blur-[130px] opacity-[0.14] pointer-events-none"
        style={{ background: "radial-gradient(circle, #fef9c3 0%, transparent 70%)" }}
      />

      <div className="checkout-grid-cross absolute left-[12%] top-[8%] text-emerald-600/15"><CrossIcon /></div>
      <div className="checkout-grid-cross absolute left-[88%] top-[24%] text-emerald-600/15"><CrossIcon /></div>
      <div className="checkout-grid-cross absolute left-[5%] top-[45%] text-emerald-600/15"><CrossIcon /></div>
      <div className="checkout-grid-cross absolute left-[92%] top-[66%] text-emerald-600/15"><CrossIcon /></div>
      <div className="checkout-grid-cross absolute left-[8%] top-[85%] text-emerald-600/15"><CrossIcon /></div>
    </div>
  );
}

const PAYMENT_OPTIONS = [
  {
    id: "cod",
    label: "Cash on Delivery",
    icon: "💵",
    available: true,
  },

  {
    id: "upi",
    label: "UPI",
    icon: "📱",
    available: false,
  },

  {
    id: "card",
    label: "Card",
    icon: "💳",
    available: false,
  },
];

export default function CheckoutPage() {
  const items =
    useSelector(
      selectCartItems
    );

  const total =
    useSelector(
      selectCartTotal
    );

  const dispatch =
    useDispatch();

  const router =
    useRouter();

  const [
    savedAddresses,
    setSavedAddresses,
  ] = useState([]);

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState(null);

  const [
    useCustom,
    setUseCustom,
  ] = useState(false);

  const [
    saveAddress,
    setSaveAddress,
  ] = useState(false);

  const [
    zipCoins,
    setZipCoins,
  ] = useState(0);

  const [
    useZipCoins,
    setUseZipCoins,
  ] = useState(false);

  const [
    couponCode,
    setCouponCode,
  ] = useState("");

  const [
    couponLoading,
    setCouponLoading,
  ] = useState(false);

  const [
    appliedCoupon,
    setAppliedCoupon,
  ] = useState(null);

  const [
    couponError,
    setCouponError,
  ] = useState("");

  const [form, setForm] =
    useState({
      full_name: "",
      phone: "",
      address_line: "",

      city: "Ahmedabad",

      state: "Gujarat",

      pincode: "",
    });

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("cod");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const checkoutShellRef = useRef(null);
  const addressSectionRef = useRef(null);
  const customAddressRef = useRef(null);
  const saveCheckboxRef = useRef(null);
  const saveCheckboxIconRef = useRef(null);
  const saveCheckboxLabelRef = useRef(null);
  const couponCardRef = useRef(null);
  const couponContentRef = useRef(null);
  const couponContentHeightRef = useRef(null);
  const couponConfettiRef = useRef(null);
  const previousAppliedCouponRef = useRef(null);

  // ── Computed totals ──────────────────────────────────────

  const subtotal =
    total + DELIVERY_FEE;

  const coinsDiscount =
    useZipCoins
      ? Math.min(
          zipCoins,
          subtotal
        )
      : 0;

  const coinsRemaining =
    useZipCoins
      ? Math.max(
          0,
          zipCoins -
            subtotal
        )
      : zipCoins;

  const couponDiscount =
    appliedCoupon
      ?.discount_amount || 0;

  const finalTotal =
    Math.max(
      0,
      subtotal -
        coinsDiscount -
        couponDiscount
    );

  useEffect(() => {
    const shell = checkoutShellRef.current;
    if (!shell) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".checkout-reveal-card");
      if (!cards.length) return;

      gsap.fromTo(
        cards,
        {
          autoAlpha: 0,
          y: 76,
          scale: 0.965,
          transformOrigin: "50% 100%",
          willChange: "transform, opacity",
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.78,
          stagger: 0.12,
          ease: "back.out(1.18)",
          clearProps: "willChange,transform,opacity,visibility",
        }
      );
    }, shell);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    // Fetch addresses

    api.get(
      "/users/addresses"
    )
      .then((res) => {
        const addrs =
          res.data.data ||
          [];

        setSavedAddresses(
          addrs
        );

        const def =
          addrs.find(
            (a) =>
              a.is_default
          ) || addrs[0];

        if (def) {
          setSelectedAddressId(
            def._id
          );

          setUseCustom(
            false
          );
        } else {
          setUseCustom(
            true
          );
        }
      })
      .catch(() =>
        setUseCustom(true)
      );

    // Fetch ZipCoins balance

    api.get(
      "/users/me/coins"
    )
      .then((res) =>
        setZipCoins(
          res.data.data
            ?.zipCoins || 0
        )
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const section = addressSectionRef.current;
    if (!section) return;

    const cards = section.querySelectorAll(".checkout-address-option");
    const activeCard = section.querySelector('.checkout-address-option[data-active="true"]');

    gsap.killTweensOf(cards);
    gsap.to(cards, {
      scale: 1,
      y: 0,
      duration: 0.18,
      ease: "power2.out",
      overwrite: "auto",
    });

    if (activeCard) {
      gsap.fromTo(
        activeCard,
        {
          scale: 0.992,
          y: 1,
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
        },
        {
          scale: 1,
          y: 0,
          boxShadow: "0 14px 30px rgba(16, 185, 129, 0.10)",
          duration: 0.28,
          ease: "power3.out",
          clearProps: "boxShadow,transform",
        }
      );
    }
  }, [selectedAddressId, useCustom]);

  useEffect(() => {
    const el = customAddressRef.current;
    if (!el) return;

    const shouldShowCustomAddress = useCustom || savedAddresses.length === 0;
    const fields = el.querySelectorAll(".checkout-address-field");

    gsap.killTweensOf([el, ...fields]);

    if (shouldShowCustomAddress) {
      gsap.set(el, { display: "block", pointerEvents: "auto" });
      const targetHeight = el.scrollHeight;

      if (el.dataset.addressInitialized !== "true") {
        gsap.set(el, { height: "auto", opacity: 1, y: 0 });
        el.dataset.addressInitialized = "true";
        return;
      }

      gsap.fromTo(
        el,
        { height: 0, opacity: 0, y: -8 },
        {
          height: targetHeight,
          opacity: 1,
          y: 0,
          duration: 0.42,
          ease: "power3.out",
          onComplete: () => gsap.set(el, { height: "auto" }),
        }
      );

      if (fields.length > 0) {
        gsap.fromTo(
          fields,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.34,
            stagger: 0.035,
            delay: 0.08,
            ease: "power3.out",
          }
        );
      }
    } else {
      if (el.dataset.addressInitialized !== "true") {
        gsap.set(el, { height: 0, opacity: 0, y: -6, display: "none", pointerEvents: "none" });
        el.dataset.addressInitialized = "true";
        return;
      }

      const currentHeight = el.offsetHeight;
      gsap.set(el, { height: currentHeight, pointerEvents: "none" });

      gsap.to(el, {
        height: 0,
        opacity: 0,
        y: -6,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => gsap.set(el, { display: "none" }),
      });
    }
  }, [useCustom, savedAddresses.length]);

  useEffect(() => {
    const box = saveCheckboxRef.current;
    const icon = saveCheckboxIconRef.current;
    const label = saveCheckboxLabelRef.current;

    if (!box || !icon) return;

    gsap.killTweensOf([box, icon, label].filter(Boolean));

    if (saveAddress) {
      gsap.timeline()
        .to(box, {
          scale: 0.92,
          duration: 0.07,
          ease: "power2.out",
        })
        .to(box, {
          scale: 1,
          backgroundColor: "#10b981",
          borderColor: "#10b981",
          boxShadow: "0 0 0 5px rgba(16, 185, 129, 0.13)",
          duration: 0.2,
          ease: "power3.out",
        })
        .fromTo(
          icon,
          { opacity: 0, scale: 0.45, rotate: -18 },
          { opacity: 1, scale: 1, rotate: 0, duration: 0.22, ease: "power3.out" },
          "-=0.12"
        )
        .to(box, {
          boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)",
          duration: 0.28,
          ease: "power2.out",
        });

      if (label) {
        gsap.fromTo(
          label,
          { x: -2, color: "#047857" },
          { x: 0, color: "#475569", duration: 0.24, ease: "power3.out" }
        );
      }
    } else {
      gsap.timeline()
        .to(icon, {
          opacity: 0,
          scale: 0.55,
          rotate: 12,
          duration: 0.12,
          ease: "power2.in",
        })
        .to(
          box,
          {
            backgroundColor: "rgba(255, 255, 255, 0.75)",
            borderColor: "#cbd5e1",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
            duration: 0.18,
            ease: "power2.out",
          },
          "-=0.04"
        );
    }
  }, [saveAddress]);

  const runCouponConfetti = () => {
    const container = couponConfettiRef.current;
    if (!container) return;

    container.innerHTML = "";

    const colors = ["#10b981", "#34d399", "#f59e0b", "#fb923c", "#fef3c7", "#ffffff"];
    const particles = Array.from({ length: 34 }).map((_, index) => {
      const particle = document.createElement("span");
      const size = gsap.utils.random(5, 9, 1);

      particle.style.position = "absolute";
      particle.style.left = "50%";
      particle.style.top = "20px";
      particle.style.width = `${size}px`;
      particle.style.height = `${size * gsap.utils.random(0.55, 1.2)}px`;
      particle.style.borderRadius = index % 3 === 0 ? "999px" : "2px";
      particle.style.background = colors[index % colors.length];
      particle.style.pointerEvents = "none";
      particle.style.willChange = "transform, opacity";
      particle.style.boxShadow = "0 4px 12px rgba(15, 23, 42, 0.08)";

      container.appendChild(particle);
      return particle;
    });

    gsap.fromTo(
      particles,
      {
        x: 0,
        y: 0,
        opacity: 1,
        scale: 0.8,
        rotate: 0,
      },
      {
        x: () => gsap.utils.random(-170, 170),
        y: () => gsap.utils.random(-92, 96),
        opacity: 0,
        scale: () => gsap.utils.random(0.45, 1),
        rotate: () => gsap.utils.random(-220, 220),
        duration: () => gsap.utils.random(0.85, 1.35),
        ease: "power3.out",
        stagger: 0.008,
        onComplete: () => {
          container.innerHTML = "";
        },
      }
    );
  };

  useEffect(() => {
    const content = couponContentRef.current;
    if (!content) return;

    const targetHeight = content.scrollHeight;
    const startHeight = couponContentHeightRef.current ?? targetHeight;
    gsap.killTweensOf(content);

    gsap.fromTo(
      content,
      { height: startHeight, opacity: 0.72, y: appliedCoupon ? -4 : 0 },
      {
        height: targetHeight,
        opacity: 1,
        y: 0,
        duration: appliedCoupon ? 0.4 : 0.3,
        ease: appliedCoupon ? "power3.out" : "power2.out",
        onComplete: () => {
          couponContentHeightRef.current = targetHeight;
          gsap.set(content, { height: "auto" });
        },
      }
    );
  }, [appliedCoupon, couponError]);

  useEffect(() => {
    const couponWasJustApplied = appliedCoupon && !previousAppliedCouponRef.current;
    previousAppliedCouponRef.current = appliedCoupon;

    if (!couponWasJustApplied) return;

    const card = couponCardRef.current;
    const appliedPanel = couponContentRef.current?.querySelector(".applied-coupon-panel");

    runCouponConfetti();

    if (card) {
      gsap.fromTo(
        card,
        {
          y: 2,
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08), 0 0 0 0 rgba(16, 185, 129, 0)",
        },
        {
          y: 0,
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.10), 0 0 0 4px rgba(16, 185, 129, 0.10)",
          duration: 0.22,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
          clearProps: "boxShadow,transform",
        }
      );
    }

    if (appliedPanel) {
      gsap.fromTo(
        appliedPanel.children,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.32, stagger: 0.06, ease: "power3.out", delay: 0.05 }
      );
    }
  }, [appliedCoupon]);

  // ── APPLY COUPON ──────────────────────────────────────
  const applyCoupon =
    async () => {
      if (
        !couponCode.trim()
      ) {
        return;
      }

      try {
        setCouponLoading(
          true
        );

        setCouponError("");

        // ✅ CORRECT: Build cart object for API
        const cartData = {
          subtotal,
          delivery_fee:
            DELIVERY_FEE,
          restaurant_id:
            items[0]
              ?.restaurant_id,
          cuisines: [],
          city:
            form.city ||
            "Ahmedabad",
          payment_method:
            paymentMethod,
          platform: "web",
          items: items.map(
            (item) => ({
              item_id:
                item.menu_item_id,
              qty:
                item.quantity,
              price:
                item.price,
            })
          ),
        };

        // ✅ CORRECT: Call API with coupon code
        const res =
          await api.post(
            "/coupons/apply",
            {
              code:
                couponCode
                  .trim()
                  .toUpperCase(),
              cart: cartData,
            }
          );

        const coupon =
          res.data.data;

        // ✅ CORRECT: Handle BXGY coupon - auto-add free item
        if (
          coupon.reward_type ===
          "bxgy"
        ) {
          const freeItemId =
            coupon.free_item_id ||
            coupon.bxgy_config?.reward_item_id ||
            coupon.bxgy_config?.get_item;

          const freeItemQty =
            coupon.free_item_qty ||
            coupon.bxgy_config?.free_quantity ||
            coupon.bxgy_config?.reward_quantity ||
            1;

          const matchedItem =
            items.find(
              (i) =>
                i.menu_item_id ===
                freeItemId
            );

         dispatch(
            addToCart({
              ...(matchedItem || {}),
              menu_item_id: freeItemId,
              quantity: freeItemQty,
              isFree: true,
              isRewardItem: true,
              reward_type: "bxgy",
              originalPrice: matchedItem?.price || (coupon.discount_amount / freeItemQty),
              price: matchedItem?.price || (coupon.discount_amount / freeItemQty),
            })
          );
        }

        setAppliedCoupon(
          coupon
        );

        setCouponCode("");
      } catch (err) {
        setAppliedCoupon(
          null
        );

        setCouponError(
          err?.response
            ?.data
            ?.message ||
            "Invalid coupon"
        );
      } finally {
        setCouponLoading(
          false
        );
      }
    };

  const removeCoupon =
    () => {
      if (
        appliedCoupon?.reward_type ===
          "bxgy"
      ) {
        dispatch(
          removeFreeRewardItems(appliedCoupon)
        );
      }

      setAppliedCoupon(
        null
      );

      setCouponCode("");

      setCouponError(
        ""
      );
    };

  const handleCheckout =
    async () => {
      if (
        items.length === 0
      ) {
        return;
      }

      let delivery_address;

      if (
        !useCustom &&
        selectedAddressId
      ) {
        const addr =
          savedAddresses.find(
            (a) =>
              a._id ===
              selectedAddressId
          );

        if (!addr) {
          setError(
            "Please select a delivery address."
          );

          return;
        }

        delivery_address =
          addr;
      } else {
        if (
          !form.full_name ||
          !form.phone ||
          !form.address_line
        ) {
          setError(
            "Please fill in all required address fields."
          );

          return;
        }

        delivery_address =
          form;
      }

      // ── Save address if requested ─────────────────

      if (saveAddress) {
        try {

          const addressPayload = {
            ...form,

            label: "Other",

            is_default:
              savedAddresses.length === 0,
          };

          const saveRes =
            await api.post(
              "/users/addresses",
              addressPayload
            );

          // Add immediately to local state

          if (saveRes.data?.data) {

            setSavedAddresses(
              (prev) => [
                ...prev,
                saveRes.data.data,
              ]
            );
          }

        } catch (saveErr) {

          console.error(
            "SAVE ADDRESS ERROR:",
            saveErr
          );
        }
      }


      setLoading(true);

      setError("");

      try {
        const restaurantId =
          items[0]
            ?.restaurant_id;

        // ✅ CORRECT: Send coupon info to order API
        const res =
          await api.post(
            "/orders",
            {
              items:
                items.map(
                  (i) => ({
                    menu_item_id:
                      i.menu_item_id,

                    quantity:
                      i.quantity,
                      
                    price: 
                      i.price || 0, // ✅ CRITICAL: Send the full original price to the backend
                  })
                ),

              restaurant_id:
                restaurantId,

              delivery_address,

              payment_method:
                paymentMethod,

              useZipCoins,

              coupon_code:
                appliedCoupon?.code ||
                null,

              appliedCouponId:
                appliedCoupon?._id ||
                null,

              discountAmount:
                appliedCoupon
                  ?.discount_amount || 0,

              cashbackAmount:
                appliedCoupon
                  ?.cashback_amount || 0,

              rewardType:
                appliedCoupon
                  ?.reward_type || "",
            }
          );

        dispatch(
          clearCart()
        );

        startRouteLoader();

        console.log(
          "ORDER RESPONSE:",
          res.data
        );

        router.push(
          `/orders/${
            res.data?.data?._id ||
            res.data?._id
          }`
        );

      } catch (err) {
        setError(
          err?.response
            ?.data
            ?.message ||
            "Something went wrong. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f0f3f1] py-10">
      <CheckoutGridBg />

      <div ref={checkoutShellRef} className="relative left-1/2 z-10 w-[calc(100%-32px)] max-w-2xl -translate-x-1/2 space-y-6">
        <div className="checkout-reveal-card rounded-[28px] border border-white/40 bg-white/25 backdrop-blur-[16px] px-6 py-5 shadow-[0_0_40px_rgba(15,23,42,0.11),0_18px_55px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-700/80">
            Secure order handoff
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
            Checkout
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Review your delivery details and place your ZippyEats order.
          </p>
        </div>

        {/* ── DELIVERY ADDRESS ─────────────────────────────── */}

        <div ref={addressSectionRef} className="checkout-reveal-card rounded-2xl border border-white/50 bg-white/65 p-6 shadow-[0_0_40px_rgba(15,23,42,0.11),0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-[16px]">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Delivery address
          </h2>

          {savedAddresses.length >
            0 && (
            <div className="space-y-2 mb-4">
              {savedAddresses.map(
                (addr) => (
                  <label
                    key={
                      addr._id
                    }
                    data-active={!useCustom && selectedAddressId === addr._id}
                    className={`checkout-address-option flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors duration-200 ${
                      !useCustom &&
                      selectedAddressId ===
                        addr._id
                        ? "border-emerald-500 bg-emerald-50/80"
                        : "border-white/60 bg-white/35 hover:border-emerald-200 hover:bg-white/55"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={
                        addr._id
                      }
                      checked={
                        !useCustom &&
                        selectedAddressId ===
                          addr._id
                      }
                      onChange={() => {
                        setSelectedAddressId(
                          addr._id
                        );

                        setUseCustom(
                          false
                        );
                      }}
                      className="sr-only"
                    />

                    <span
                      className={`mt-1 grid h-4 w-4 flex-shrink-0 place-items-center rounded-full border transition-colors duration-200 ${
                        !useCustom && selectedAddressId === addr._id
                          ? "border-emerald-500 bg-white"
                          : "border-slate-300 bg-white/70"
                      }`}
                      aria-hidden="true"
                    >
                      <span
                        className={`h-2 w-2 rounded-full bg-emerald-500 transition-opacity duration-200 ${
                          !useCustom && selectedAddressId === addr._id ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </span>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {
                          addr.full_name
                        }

                        <span className="ml-2 text-xs font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {
                            addr.label
                          }
                        </span>

                        {addr.is_default && (
                          <span className="ml-1 text-xs text-emerald-600">
                            ✓
                            Default
                          </span>
                        )}
                      </p>

                      <p className="text-xs text-slate-500">
                        {
                          addr.address_line
                        }
                        ,{" "}
                        {
                          addr.city
                        }{" "}
                        —{" "}
                        {
                          addr.phone
                        }
                      </p>
                    </div>
                  </label>
                )
              )}

              <label
                data-active={useCustom}
                className={`checkout-address-option flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors duration-200 ${
                  useCustom
                    ? "border-emerald-500 bg-emerald-50/80"
                    : "border-white/60 bg-white/35 hover:border-emerald-200 hover:bg-white/55"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={
                    useCustom
                  }
                  onChange={() =>
                    setUseCustom(
                      true
                    )
                  }
                  className="sr-only"
                />

                <span
                  className={`grid h-4 w-4 flex-shrink-0 place-items-center rounded-full border transition-colors duration-200 ${
                    useCustom
                      ? "border-emerald-500 bg-white"
                      : "border-slate-300 bg-white/70"
                  }`}
                  aria-hidden="true"
                >
                  <span
                    className={`h-2 w-2 rounded-full bg-emerald-500 transition-opacity duration-200 ${
                      useCustom ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </span>

                <span className="text-sm text-slate-700">
                  Enter a
                  different
                  address
                </span>
              </label>
            </div>
          )}

          <div
            ref={customAddressRef}
            aria-hidden={!(useCustom || savedAddresses.length === 0)}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              <input
                placeholder="Full name *"
                value={
                  form.full_name
                }
                onChange={(
                  e
                ) =>
                  setForm(
                    (f) => ({
                      ...f,
                      full_name:
                        e
                          .target
                          .value,
                    })
                  )
                }
                className="checkout-address-field w-[610px] m-1 px-4 py-3 border border-slate-200 bg-white/85 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
              />

              <input
                placeholder="Phone *"
                value={
                  form.phone
                }
                onChange={(
                  e
                ) =>
                  setForm(
                    (f) => ({
                      ...f,
                      phone:
                        e
                          .target
                          .value,
                    })
                  )
                }
                className="checkout-address-field w-[610px] m-1 px-4 py-3 border border-slate-200 bg-white/85 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
              />

              <input
                placeholder="Flat / Building / Street *"
                value={
                  form.address_line
                }
                onChange={(
                  e
                ) =>
                  setForm(
                    (f) => ({
                      ...f,
                      address_line:
                        e
                          .target
                          .value,
                    })
                  )
                }
                className="checkout-address-field w-[610px] m-1 px-4 py-3 border border-slate-200 bg-white/85 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
              />

              <div className="grid grid-cols-3 gap-3">
                <input
                  placeholder="City"
                  value={
                    form.city
                  }
                  onChange={(
                    e
                  ) =>
                    setForm(
                      (f) => ({
                        ...f,
                        city:
                          e
                            .target
                            .value,
                      })
                    )
                  }
                  className="checkout-address-field m-1 flex-1 px-4 py-3 border border-slate-200 bg-white/85 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
                />

                <input
                  placeholder="State"
                  value={
                    form.state
                  }
                  onChange={(
                    e
                  ) =>
                    setForm(
                      (f) => ({
                        ...f,
                        state:
                          e
                            .target
                            .value,
                      })
                    )
                  }
                  className="checkout-address-field m-1 flex-1 px-4 py-3 border border-slate-200 bg-white/85 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
                />

                <input
                  placeholder="Pincode"
                  value={
                    form.pincode
                  }
                  onChange={(
                    e
                  ) =>
                    setForm(
                      (f) => ({
                        ...f,
                        pincode:
                          e
                            .target
                            .value,
                      })
                    )
                  }
                  className="checkout-address-field m-1 flex-1 px-4 py-3 border border-slate-200 bg-white/85 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
                />

                <label className="checkout-address-field group col-span-3 mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-emerald-100/80 bg-white/45 px-3.5 py-3 shadow-sm shadow-slate-900/5 backdrop-blur-[12px]">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) =>
                      setSaveAddress(
                        e.target.checked
                      )
                    }
                    className="sr-only"
                  />

                  <span
                    ref={saveCheckboxRef}
                    className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-md border shadow-sm ${
                      saveAddress
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-slate-300 bg-white/75"
                    }`}
                    aria-hidden="true"
                  >
                    <svg
                      ref={saveCheckboxIconRef}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={saveAddress ? "opacity-100" : "opacity-0"}
                    >
                      <path
                        d="M5 12.5l4.2 4.2L19 7"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <span ref={saveCheckboxLabelRef} className="text-sm font-medium text-slate-600">
                    Save this address
                    for future orders
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ── ZIPCOINS ─────────────────────────────────────── */}

        {zipCoins > 0 && (
          <div
            className={`checkout-reveal-card rounded-2xl border p-5 shadow-[0_0_40px_rgba(15,23,42,0.11),0_18px_55px_rgba(15,23,42,0.08)] transition-colors duration-200 ${
              useZipCoins
                ? "bg-amber-50 border-amber-300"
                : "bg-white/65 border-white/50 backdrop-blur-[16px]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  🪙
                </span>

                <div>
                  <p className="font-semibold text-slate-800">
                    Use
                    ZipCoins

                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {
                        zipCoins
                      }{" "}
                      coins
                      =
                      ₹
                      {
                        zipCoins
                      }
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setUseZipCoins(
                    !useZipCoins
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useZipCoins
                    ? "bg-amber-500"
                    : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useZipCoins
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* ── COUPON ─────────────────────────────────────── */}

        <div ref={couponCardRef} className="checkout-reveal-card relative overflow-visible rounded-2xl border border-white/50 bg-white/65 p-6 shadow-[0_0_40px_rgba(15,23,42,0.11),0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-[16px]">
          <div ref={couponConfettiRef} className="pointer-events-none absolute inset-0 z-20 overflow-visible" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Coupons
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Apply coupon
                for extra
                savings
              </p>
            </div>

            {appliedCoupon ? (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                Applied
              </span>
            ) : null}
          </div>

          <div ref={couponContentRef} className="overflow-hidden">
          {!appliedCoupon ? (
            <>
              <div className="flex gap-3">
                <input
                  value={
                    couponCode
                  }
                  onChange={(
                    e
                  ) =>
                    setCouponCode(
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="Enter coupon code"
                  className="m-1 flex-1 px-4 py-3 border border-slate-200 bg-white/85 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
                />

                <button
                  onClick={
                    applyCoupon
                  }
                  disabled={
                    couponLoading ||
                    !couponCode.trim()
                  }
                  className="px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  {couponLoading
                    ? "Applying..."
                    : "Apply"}
                </button>
              </div>

              {couponError ? (
                <p className="mt-3 text-sm text-red-500">
                  {
                    couponError
                  }
                </p>
              ) : null}
            </>
          ) : (
            <div className="applied-coupon-panel rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-emerald-700">
                    {
                      appliedCoupon.code
                    }
                  </p>

                  <p className="text-sm text-emerald-600 mt-1">
                    {
                      appliedCoupon.reward_label ||
                      "Coupon applied successfully"
                    }
                  </p>
                </div>

                <button
                  onClick={
                    removeCoupon
                  }
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
                <span className="text-sm text-emerald-700">
                  Coupon
                  Discount
                </span>

                <span className="font-bold text-emerald-700">
                  -₹
                  {
                    appliedCoupon.discount_amount
                  }
                </span>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* ── ORDER SUMMARY ────────────────────────────────── */}

        <div className="checkout-reveal-card rounded-2xl border border-white/50 bg-white/65 p-6 shadow-[0_0_40px_rgba(15,23,42,0.11),0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-[16px]">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Order summary
          </h2>

          <div className="space-y-2 mb-4">
            {items.map(
              (item) => (
                <div
                  key={
                    item.menu_item_id
                  }
                  className="flex justify-between text-sm"
                >
                  <span className="text-slate-700">
                    {item.name} ×{" "}
                    {
                      item.quantity
                    }
                  </span>

                <span className="font-semibold text-slate-800">
                    ₹{(item.price || 0) * item.quantity}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-700 font-medium">
              <span>
                Total
              </span>

              <span>
                ₹{total}
              </span>
            </div>

            <div className="flex justify-between text-sm text-slate-500">
              <span>
                Delivery fee
              </span>

              <span>
                ₹
                {
                  DELIVERY_FEE
                }
              </span>
            </div>

            {useZipCoins &&
              coinsDiscount >
                0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>
                    🪙 ZipCoins
                    discount
                  </span>

                  <span>
                    -₹
                    {
                      coinsDiscount
                    }
                  </span>
                </div>
              )}

            {appliedCoupon && (
              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                <span>
                  🎟 Coupon discount
                </span>

                <span>
                  -₹
                  {
                    appliedCoupon.discount_amount
                  }
                </span>
              </div>
            )}

            <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
              <span>
                Amount to Pay
              </span>

              <span>
                ₹
                {
                  finalTotal
                }
              </span>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-red-500 text-sm bg-red-50/90 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={
              handleCheckout
            }
            disabled={
              loading ||
              items.length ===
                0
            }
            className="mt-5 w-full p-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-base hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/15"
          >
            {loading ? (
              <>

                <span>
                  Placing
                  order…
                </span>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </>
            ) : (
              <>
                <span>
                  Place order · ₹{finalTotal}
                </span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 mt-3">
            🔒 Your
            information is
            secure
          </p>
        </div>
      </div>
    </div>
  );
}
