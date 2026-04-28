"use client";

import { useSelector, useDispatch } from "react-redux";
import { selectCartItems, clearCart } from "../../store/slices/cartSlice";
import axios from "../../lib/axios";
import { useRouter } from "next/navigation";

export default function Checkout() {
  const items = useSelector(selectCartItems);
  const dispatch = useDispatch();
  const router = useRouter();

  const placeOrder = async () => {
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

      <button onClick={placeOrder}>Place Order</button>
    </div>
  );
}