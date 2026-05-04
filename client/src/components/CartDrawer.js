"use client";

import { useSelector } from "react-redux";
import { selectCartItems, selectCartTotal } from "../store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { addToCart, decreaseQty } from "../store/slices/cartSlice";

export default function CartDrawer({ open, onClose }) {
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const token = useSelector((state) => state.auth.token);
  const router = useRouter();
const dispatch = useDispatch();
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[1100] bg-black/40 transition-opacity duration-300 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />

     <aside
  className={`fixed right-0 top-0 z-[1101] flex h-full w-[min(100%,380px)] flex-col bg-white text-slate-900 shadow-2xl transition-transform duration-300 ease-out ${
    open ? "translate-x-0" : "translate-x-full"
  }`}
>
  {/* HEADER */}
  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 w-full flex items-center justify-center">
    <h2 className="text-xl font-bold tracking-tight flex items-center mb-0">My Cart</h2>

<button
  onClick={onClose}
  className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 transition leading-none"
>
  X
</button>
  </div>

  {/* ITEMS */}
  <div className="flex-1 overflow-y-auto px-4 py-4   w-full ">
    {items.length === 0 ? (
      <p className="mt-16 text-center text-sm text-slate-400">
        Cart is empty
      </p>
    ) : (
      items.map((item) => (
      <div
  key={item.menu_item_id}
  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
>
  {/* LEFT */}
  <div>
    <p className="text-sm font-semibold">{item.name}</p>

    {/* 🔥 STEPPER */}
    <div className="mt-2 flex items-center gap-2 bg-white border rounded-lg px-2 py-1 w-fit shadow-sm">

      <button
        onClick={() => dispatch(decreaseQty(item.menu_item_id))}
        className="w-6 h-6 flex items-center justify-center text-lg font-bold text-slate-700 hover:bg-slate-100 rounded"
      >
        −
      </button>

      <span className="text-sm font-semibold w-5 text-center">
        {item.quantity}
      </span>

      <button
        onClick={() =>
          dispatch(
            addToCart({
              menu_item_id: item.menu_item_id,
              name: item.name,
              price: item.price
            })
          )
        }
        className="w-6 h-6 flex items-center justify-center text-lg font-bold text-slate-700 hover:bg-slate-100 rounded"
      >
        +
      </button>

    </div>
  </div>

  {/* RIGHT */}
  <p className="text-base font-bold text-slate-900">
    ₹{item.price * item.quantity}
  </p>
</div>
      ))
    )}
  </div>

  {/* FOOTER */}
  <div className="border-t border-slate-200 bg-white px-5 py-4 shadow-inner">
    
    {/* TOTAL */}
    <div className="flex justify-between items-center mb-4">
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
          router.push("/checkout"); // Navigate to checkout page
        }}
        className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold text-base hover:bg-green-700 transition active:scale-95"
      >
        Checkout
      </button>
    ) : (
      <button
        onClick={() => {
          onClose(); // Also close the drawer when redirecting to login
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
