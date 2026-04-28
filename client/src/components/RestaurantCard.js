"use client";

import { useRouter } from "next/navigation";

export default function RestaurantCard({ data }) {
  const router = useRouter();

  return (
    <div
      className="card"
      onClick={() => router.push(`/restaurant/${data.id}`)}
    >
      <h3>{data.name}</h3>
      <p>⭐ {data.rating}</p>
      <p>⏱ {data.delivery_time} mins</p>
    </div>
  );
}