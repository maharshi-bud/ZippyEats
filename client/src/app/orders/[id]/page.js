"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";

export default function OrderPage({ params }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await axios.get(`/orders/${params.id}`);
      setOrder(res.data.data);
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);

    return () => clearInterval(interval);
  }, [params.id]);

  if (!order) return <p>Loading...</p>;

  return (
    <div>
      <h2>Status: {order.status}</h2>
      <p>Total: ₹{order.total_amount}</p>
    </div>
  );
}