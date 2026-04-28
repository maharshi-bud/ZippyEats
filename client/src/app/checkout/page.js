"use client";

import { useSelector, useDispatch } from "react-redux";
import { selectCartItems, clearCart } from "../../store/slices/cartSlice";
import { useRouter } from "next/navigation";
import axios from "../../lib/axios";

export default function Checkout() {
  const items = useSelector(selectCartItems);
  const token = useSelector((state) => state.auth.token);

  const dispatch = useDispatch();
  const router = useRouter();

  const placeOrder = async () => {
    // 🔥 redirect if not logged in
    if (!token) {
      router.push("/login");
      return;
    }

    const res = await axios.post("/orders", {
      items: items.map((i) => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity
      }))
    });

    dispatch(clearCart());

    router.push(`/orders/${res.data.data._id}`);
  };

  return (
    <div>
      <h1>Checkout</h1>
      <button className="btn" onClick={placeOrder}>
        Place Order
      </button>
    </div>
  );
}