"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { gsap } from "gsap";

export default function OrderPage({ params }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await api.get(`/orders/${params.id}`);
      setOrder(res.data);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!order) return;

    const map = {
      placed: 20,
      accepted: 40,
      preparing: 60,
      out_for_delivery: 80,
      delivered: 100,
    };

    gsap.to(".progress", {
      width: `${map[order.status] || 0}%`,
      duration: 0.5,
    });
  }, [order]);

  if (!order) return <p>Loading...</p>;

  return (
    <div>
      <h2>Status: {order.status}</h2>
      <div className="progress-bar">
        <div className="progress"></div>
      </div>
    </div>
  );
}