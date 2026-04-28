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

  // 🔥 GSAP animation
  useEffect(() => {
    if (!order) return;

    const currentIndex = steps.indexOf(order.status);

    progressRef.current.forEach((el, index) => {
      gsap.to(el, {
        width: index <= currentIndex ? "100%" : "0%",
        duration: 0.6,
        ease: "power2.out"
      });
    });
  }, [order]);

  if (!order) return <p>Loading...</p>;

  const currentIndex = steps.indexOf(order.status);

  return (
    <div>
      <h1>Order Tracking</h1>

      {/* 🔵 Animated Progress */}
      <div style={{ display: "flex", margin: "20px 0" }}>
        {steps.map((step, index) => (
          <div key={step} style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                height: "8px",
                background: "#eee",
                borderRadius: "10px",
                overflow: "hidden",
                margin: "0 5px"
              }}
            >
              <div
                ref={(el) => (progressRef.current[index] = el)}
                style={{
                  height: "100%",
                  width: index <= currentIndex ? "100%" : "0%",
                  background: "#fc8019"
                }}
              />
            </div>

            <p
              style={{
                fontSize: "12px",
                marginTop: "6px",
                color: index <= currentIndex ? "#fc8019" : "#888"
              }}
            >
              {step}
            </p>
          </div>
        ))}
      </div>

      {/* 📦 Info */}
      <div className="card">
        <h2>Status: {order.status}</h2>
        <p>Total: ₹{order.total_amount}</p>
        <p>ETA: {new Date(order.eta).toLocaleTimeString()}</p>
      </div>

      {/* 🍔 Items */}
      <h3>Items</h3>
      {order.items.map((item) => (
        <div className="card" key={item.menu_item_id._id}>
          {item.menu_item_id.name} × {item.quantity}
        </div>
      ))}
    </div>
  );
}