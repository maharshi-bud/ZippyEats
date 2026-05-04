"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/axios";
import { useDispatch } from "react-redux";
import { addToCart } from "../../../store/slices/cartSlice";
import { useSelector } from "react-redux";
import { selectCartItems } from "../../../store/slices/cartSlice";
import { decreaseQty } from "../../../store/slices/cartSlice";

export default function RestaurantPage({ params }) {
  const [data, setData] = useState(null);
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const getQty = (id) => {
  const found = cartItems.find(
    (i) => i.menu_item_id === id
  );
  return found?.quantity || 0;
};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/restaurant/${params.id}`);
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [params.id]);

  if (!data) return <p>Loading...</p>;

  // 🔥 group items by cuisine
  const grouped = data.menu.reduce((acc, item) => {
    if (!acc[item.cuisine]) acc[item.cuisine] = [];
    acc[item.cuisine].push(item);
    return acc;
  }, {});

 return (
  <div className="max-w-5xl mx-auto px-4 py-6 bg-slate-50 min-h-screen">

    {/* 🏪 HEADER */}
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
      <h1 className="text-3xl font-bold text-slate-800">
        {data.name}
      </h1>

      <p className="text-slate-500 mt-2 text-sm">
        {data.cuisines?.join(" • ")}
      </p>
    </div>

    {/* 🍽️ MENU BY CUISINE */}
    {Object.entries(grouped).map(([cuisine, items]) => (
      <div key={cuisine} className="mb-8">

        {/* SECTION TITLE */}
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
          {cuisine}
        </h2>

        {/* ITEMS */}
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 p-4"
            >

              {/* LEFT */}
              <div>
                <h3 className="font-semibold text-slate-800">
                  {item.name}
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  ₹{item.price}
                </p>
              </div>

              {/* RIGHT (STEPPER) */}
<div className="w-[110px] h-[40px] flex items-center justify-center">

  {getQty(item._id) === 0 ? (
    <button
      className="w-full h-full rounded-lg bg-slate-900 text-align-center text-white font-medium shadow-md hover:shadow-lg transition"
      onClick={() =>
        dispatch(
          addToCart({
            menu_item_id: item._id,
            name: item.name,
            price: item.price,
          })
        )
      }
    >
      Add
    </button>
  ) : (
    <div className="w-full h-full flex items-center justify-between bg-slate-900 text-white rounded-lg px-3 shadow-md">

      {/* MINUS */}
      <button
  className="w-3  h-full flex items-center justify-center text-lg leading-none hover:opacity-70"

        // className="w-6 flex items-center justify-center text-lg hover:opacity-70"
        onClick={() => dispatch(decreaseQty(item._id))}
      >
        -
      </button>

      {/* QTY */}
      <span className="text-l font-medium">
        {getQty(item._id)}
      </span>

      {/* PLUS */}
      <button
  className="w-3 h-full flex items-center justify-center text-lg leading-none hover:opacity-70"
        onClick={() =>
          dispatch(
            addToCart({
              menu_item_id: item._id,
              name: item.name,
              price: item.price,
            })
          )
        }
      >
        +
      </button>

    </div>
  )}

</div>

            </div>
          ))}
        </div>

      </div>
    ))}
  </div>
);
}