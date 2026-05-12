"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import Head from "next/head";
export default function SearchPage() {
  const params = useSearchParams();
  const q = params.get("q");

  const [data, setData] = useState({ restaurants: [], items: [] });

  useEffect(() => {
    if (!q) return;

    api.get("/search", { params: { q } })
      .then((res) => setData(res.data.data))
      .catch(console.error);
  }, [q]);

  return (
    <div className="p-6">
            <Head>
        <title>Search — ZippyEats</title>
      </Head>
      <h1 className="text-xl font-bold mb-4">
        Results for "{q}"
      </h1>

      {/* Restaurants */}
      {data.restaurants.map((r) => (
        <div key={r._id}>{r.name}</div>
      ))}

      {/* Items */}
      {data.items.map((i) => (
        <div key={i._id}>{i.name}</div>
      ))}
    </div>
  );
}