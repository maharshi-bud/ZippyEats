"use client";

import { useEffect, useState, useRef } from "react";
import axios from "../../../lib/axios";
import gsap from "gsap";

const steps = [
  "placed",
  "accepted",
  "preparing",
  "out_for_delivery",
  "delivered"
];

export default function OrderPage({ params }) {
  const [order, setOrder] = useState(null);
  const progressRef = useRef([]);

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await axios.get(`/orders/${params.id}`);
      setOrder(res.data.data);
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 4000);
    return () => clearInterval(interval);
  }, [params.id]);

  useEffect(() => {
    if (!order) return;

    const currentIndex = steps.indexOf(order.status);

    progressRef.current.forEach((el, index) => {
      gsap.to(el, {
        width: index <= currentIndex ? "100%" : "0%",
        duration: 0.5
      });
    });
  }, [order]);

  if (!order) return <div className="p-10">Loading...</div>;

  const currentIndex = steps.indexOf(order.status);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">

      {/* 🔥 HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📦 Order Tracking</h1>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
        >
          🧾 Print Bill
        </button>
      </div>

      {/* 🔥 PROGRESS */}
      <div className="bg-white p-5 rounded-xl shadow-sm border mb-6">
        <div className="flex gap-2">
          {steps.map((step, index) => (
            <div key={step} className="flex-1 text-center">

              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  ref={(el) => (progressRef.current[index] = el)}
                  className="h-full bg-green-500"
                  style={{
                    width: index <= currentIndex ? "100%" : "0%"
                  }}
                />
              </div>

              <p
                className={`text-xs mt-2 capitalize ${
                  index <= currentIndex
                    ? "text-green-600 font-semibold"
                    : "text-slate-400"
                }`}
              >
                {step.replaceAll("_", " ")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 2 COLUMN GRID */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* LEFT → ORDER DETAILS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">
            Order Details
          </h2>

          <div className="space-y-3 text-sm">
            <p>
              <span className="text-slate-500">Status:</span>{" "}
              <span className="font-semibold text-green-600 capitalize">
                {order.status.replaceAll("_", " ")}
              </span>
            </p>

            <p>
              <span className="text-slate-500">Total:</span>{" "}
              <span className="font-semibold">
                ₹{order.total_amount}
              </span>
            </p>

            <p>
              <span className="text-slate-500">ETA:</span>{" "}
              <span className="font-semibold">
                {new Date(order.eta).toLocaleTimeString()}
              </span>
            </p>

            <p>
              <span className="text-slate-500">Order ID:</span>{" "}
              <span className="font-mono text-xs">
                {params.id}
              </span>
            </p>
          </div>
        </div>

        {/* RIGHT → ITEMS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">
            Items
          </h2>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.menu_item_id._id}
                className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {item.menu_item_id.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Qty: {item.quantity}
                  </p>
                </div>

                <p className="font-semibold">
                  ₹{item.menu_item_id.price * item.quantity}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}