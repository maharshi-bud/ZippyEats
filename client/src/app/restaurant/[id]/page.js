"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  decreaseQty,
  selectCartItems,
} from "../../../store/slices/cartSlice";
import {
  resolveItemImage,
  handleImgError,
} from "../../../lib/imageUtils";

export default function RestaurantPage({ params }) {
  const [data, setData] = useState(null);
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);

  const getQty = (id) =>
    cartItems.find((i) => i.menu_item_id === id)?.quantity || 0;

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

  if (!data)
    return (
      <div className="p-10 text-center text-slate-500">
        Loading restaurant...
      </div>
    );

  const grouped = data.menu.reduce((acc, item) => {
    if (!acc[item.cuisine]) acc[item.cuisine] = [];
    acc[item.cuisine].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-gradient-to-b from-slate-50 to-white min-h-screen">

      {/* 🔥 HERO HEADER */}
      <div className="relative mb-10 rounded-3xl overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 z-10" />

        <img
          src={resolveItemImage(data.menu[0])}
          onError={handleImgError}
          className="w-full h-52 object-cover"
        />

        <div className="absolute z-20 bottom-6 left-6 text-white">
          <h1 className="text-3xl font-bold">{data.name}</h1>
          <p className="text-sm mt-1 opacity-90">
            {data.cuisines?.join(" • ")}
          </p>
        </div>
      </div>

      {/* 🍽️ MENU */}
      {Object.entries(grouped).map(([cuisine, items]) => (
        <div key={cuisine} className="mb-12">

          {/* SECTION TITLE */}
          <h2 className="text-xl font-semibold text-slate-800 mb-6 tracking-wide border-b pb-2">
            {cuisine}
          </h2>

          {/* ITEMS */}
          <div className="space-y-5">
            {items.map((item) => (
              <div
                key={item._id}
                className="group flex items-center justify-between bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 p-4 gap-5 hover:-translate-y-1"
              >

                {/* LEFT */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {item.name}
                  </h3>

                  <p className="text-slate-600 text-sm mt-1 font-medium">
                    ₹{item.price}
                  </p>

                  {item.description && (
                    <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* RIGHT */}
                <div className="flex flex-col items-center gap-3">

                  {/* IMAGE */}
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-slate-100 shadow-sm group-hover:shadow-md transition">
                    <img
                      src={resolveItemImage(item)}
                      alt={item.name}
                      onError={handleImgError}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>

                  {/* STEPPER */}
                  <div className="w-28 h-10 flex items-center justify-center">
                    {getQty(item._id) === 0 ? (
                      <button
                        className="w-full h-full rounded-lg bg-gradient-to-r from-slate-900 to-slate-700 text-white text-sm font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition"
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
                      <div className="w-full h-full flex items-center justify-between bg-slate-900 text-white rounded-lg px-2 shadow-md">

                        <button
                          className="w-7 h-7 flex items-center justify-center text-lg hover:opacity-70 active:scale-90 transition"
                          onClick={() =>
                            dispatch(decreaseQty(item._id))
                          }
                        >
                          -
                        </button>

                        <span className="text-sm font-semibold">
                          {getQty(item._id)}
                        </span>

                        <button
                          className="w-7 h-7 flex items-center justify-center text-lg hover:opacity-70 active:scale-90 transition"
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
              </div>
            ))}
          </div>

        </div>
      ))}
    </div>
  );
}