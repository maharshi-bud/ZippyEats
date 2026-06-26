"use client";

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { selectCartItems, selectCartTotal } from "../store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { addToCart, decreaseQty } from "../store/slices/cartSlice";
import { resolveItemImage, handleImgError } from "../lib/imageUtils";
import { startRouteLoader } from "../lib/routeLoading";
import gsap from "gsap";

function CartDrawerItem({ item, dispatch }) {
  const qtyRef = useRef(null);
  const stepperRef = useRef(null);
  const priceRef = useRef(null);
  const previousQtyRef = useRef(item.quantity);

  const animateButtonTap = (button) => {
    if (!button) return;

    gsap.killTweensOf(button);
    gsap.timeline()
      .to(button, {
        scale: 0.88,
        duration: 0.06,
        ease: "power2.out",
      })
      .to(button, {
        scale: 1,
        duration: 0.16,
        ease: "power3.out",
      });
  };

  useEffect(() => {
    const previousQty = previousQtyRef.current;
    if (previousQty === item.quantity) return;

    const direction = item.quantity > previousQty ? 1 : -1;
    previousQtyRef.current = item.quantity;

    const animatedTargets = [qtyRef.current, stepperRef.current, priceRef.current].filter(Boolean);
    gsap.killTweensOf(animatedTargets);

    if (qtyRef.current) {
      gsap.fromTo(
        qtyRef.current,
        {
          y: direction > 0 ? 10 : -10,
          opacity: 0,
          scale: 0.82,
          color: "#16a34a",
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          color: "#0f172a",
          duration: 0.24,
          ease: "power3.out",
          clearProps: "transform,color",
        }
      );
    }

    if (stepperRef.current) {
      gsap.fromTo(
        stepperRef.current,
        {
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08), 0 0 0 0 rgba(22, 163, 74, 0)",
        },
        {
          boxShadow: "0 8px 18px rgba(15, 23, 42, 0.10), 0 0 0 3px rgba(22, 163, 74, 0.11)",
          duration: 0.13,
          repeat: 1,
          yoyo: true,
          ease: "power2.inOut",
          clearProps: "boxShadow",
        }
      );
    }

    if (priceRef.current) {
      gsap.fromTo(
        priceRef.current,
        { y: direction > 0 ? 4 : -4, opacity: 0.65 },
        { y: 0, opacity: 1, duration: 0.22, ease: "power3.out" }
      );
    }
  }, [item.quantity, item.price]);

  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-200 transition gap-3"
    >
      {/* IMAGE */}
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
        <img
          src={resolveItemImage(item)}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={handleImgError}
        />
      </div>

      {/* LEFT */}
      <div className="flex-1">
        <p className="text-sm font-semibold">{item.name}</p>

        {/* STEPPER */}
        <div
          ref={stepperRef}
          className="mt-2 flex items-center gap-2 bg-white border rounded-lg px-2 py-1 w-fit shadow-sm"
        >
          <button
            onClick={(event) => {
              animateButtonTap(event.currentTarget);
              dispatch(decreaseQty(item.menu_item_id));
            }}
            className="w-6 h-6 grid place-items-center text-lg font-bold text-slate-700 hover:bg-slate-100 rounded"
          >
            <span className="block -mt-px">−</span>
          </button>

          <span className="relative grid h-5 w-5 place-items-center overflow-hidden text-center">
            <span ref={qtyRef} className="text-sm font-semibold tabular-nums leading-none">
              {item.quantity}
            </span>
          </span>

          <button
            onClick={(event) => {
              animateButtonTap(event.currentTarget);
              dispatch(
                addToCart({
                  menu_item_id: item.menu_item_id,
                  name: item.name,
                  price: item.price,
                  restaurant_id: item.restaurant_id,
                  image: item.image,
                })
              );
            }}
            className="w-6 h-6 grid place-items-center text-lg font-bold text-slate-700 hover:bg-slate-100 rounded"
          >
            <span className="block -mt-px">+</span>
          </button>
        </div>
      </div>

      {/* RIGHT */}
      <p ref={priceRef} className="text-base font-bold text-slate-900">
        ₹{item.price * item.quantity}
      </p>
    </div>
  );
}

export default function CartDrawer({ open = false, onClose = () => {} }) {
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const token = useSelector((state) => state.auth.token);
  const router = useRouter();
  const dispatch = useDispatch();
  const itemsScrollRef = useRef(null);

  // When the drawer is open, the restaurant page/Lenis should not consume wheel/touch scroll.
  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  const handleDrawerWheelCapture = (event) => {
    if (!open) return;

    // Stop Lenis/page listeners from receiving the wheel event.
    event.stopPropagation();

    const scrollEl = itemsScrollRef.current;
    if (!scrollEl || scrollEl.contains(event.target)) return;

    // If the user wheels over the header/footer, still move the cart item list.
    if (scrollEl.scrollHeight > scrollEl.clientHeight) {
      scrollEl.scrollTop += event.deltaY;
      event.preventDefault();
    }
  };

  const stopPageScrollCapture = (event) => {
    if (!open) return;
    event.stopPropagation();
  };

  return (
    <>
      <div
        onClick={onClose}
        onWheelCapture={stopPageScrollCapture}
        onTouchMoveCapture={stopPageScrollCapture}
        className={`fixed inset-0 z-[1100] bg-black/40 transition-opacity duration-300 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />

     <aside
  onWheelCapture={handleDrawerWheelCapture}
  onTouchMoveCapture={stopPageScrollCapture}
  className={`fixed right-0 top-0 z-[1101] flex h-full w-[min(100%,380px)] flex-col overscroll-contain bg-white text-slate-900 shadow-2xl transition-transform duration-300 ease-out ${
    open ? "translate-x-0" : "translate-x-full"
  }`}
  style={{ overscrollBehavior: "contain" }}
>
  {/* HEADER */}
  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 w-full flex items-center justify-center">
    <h2 className="text-xl font-bold tracking-tight flex items-center mb-0">My Cart</h2>

<button
  onClick={onClose}
  className="grid place-items-center w-9 h-9 rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 transition"
>
  <span className="block text-sm font-semibold">✕</span>
</button>
  </div>

  {/* ITEMS */}
  <div
    ref={itemsScrollRef}
    onWheelCapture={stopPageScrollCapture}
    onTouchMoveCapture={stopPageScrollCapture}
    className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 w-full"
    style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
  >
    {items.length === 0 ? (
      <p className="mt-16 text-center text-sm text-slate-400">
        Cart is empty
      </p>
    ) : (
      items.map((item) => (
        <CartDrawerItem
          key={item.menu_item_id}
          item={item}
          dispatch={dispatch}
        />
      ))
    )}
  </div>

  {/* FOOTER */}
  <div className="border-t border-slate-200 bg-white px-5 py-4 shadow-inner">
    
    {/* TOTAL */}
    <div className="flex justify-between items-center mb-2">
      <span className="text-lg font-semibold">Total</span>
      <span className="text-xl font-bold text-slate-900">
        ₹{total + 40}
      </span>
    </div>

    {/* BUTTON */}
        {/* // Find the checkout button in the FOOTER section and replace it with this: */}
    
    {token ? (
      <button
        onClick={() => {
          onClose(); // Close the drawer
          startRouteLoader();
          router.push("/checkout"); // Navigate to checkout page
        }}
        className="w-full py-3 px-3 rounded-xl bg-green-600 text-white font-semibold text-base hover:bg-green-700 transition active:scale-95"
      >
        Proceed to Checkout
      </button>
    ) : (
      <button
        onClick={() => {
          onClose(); // Also close the drawer when redirecting to login
          startRouteLoader();
          router.push("/login");
        }}
        className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-base hover:bg-slate-800 transition active:scale-95"
      >
        Login to Proceed
      </button>
    )}


  </div>
</aside>


    </>
  );

    // return(<div>hi</div>)
}
