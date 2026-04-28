"use client";

import { useEffect, useState } from "react";
import axios from "../../../lib/axios";

const steps = [
  "placed",
  "accepted",
  "preparing",
  "out_for_delivery",
  "delivered"
];

export default function OrderPage({ params }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await axios.get(`/orders/${params.id}`);
      setOrder(res.data.data);
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 4000);

    return () => clearInterval(interval);
  }, [params.id]);

  if (!order) return <p>Loading...</p>;

  const currentIndex = steps.indexOf(order.status);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Order Tracking</h1>

      {/* 🔵 Progress Bar */}
      <div style={{ display: "flex", margin: "20px 0" }}>
        {steps.map((step, index) => (
          <div key={step} style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                height: "10px",
                background:
                  index <= currentIndex ? "green" : "#ddd",
                margin: "0 5px"
              }}
            />
            <p style={{ fontSize: "12px" }}>{step}</p>
          </div>
        ))}
      </div>

      {/* 📦 Status */}
      <h2>Status: {order.status}</h2>
      <p>Total: ₹{order.total_amount}</p>
      <p>ETA: {new Date(order.eta).toLocaleTimeString()}</p>

      {/* 🍔 Items */}
      <h3>Items</h3>
      {order.items.map((item) => (
        <div key={item.menu_item_id._id}>
          <p>
            {item.menu_item_id.name} × {item.quantity}
          </p>
        </div>
      ))}
    </div>
  );
}