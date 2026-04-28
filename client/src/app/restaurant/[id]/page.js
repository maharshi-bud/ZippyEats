"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/axios";
import { useDispatch } from "react-redux";
import { addToCart } from "../../../store/slices/cartSlice";

export default function RestaurantPage({ params }) {
  const [data, setData] = useState(null);
  const dispatch = useDispatch();

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
    <div className="container">
      {/* 🏪 HEADER */}
      <div className="card">
        <h1>{data.name}</h1>

        {/* 🔥 cuisines display */}
        <p className="text-muted">
          {data.cuisines?.join(" • ")}
        </p>
      </div>

      {/* 🍽️ MENU BY CUISINE */}
      {Object.entries(grouped).map(([cuisine, items]) => (
        <div key={cuisine}>
          <h2 style={{ marginTop: "20px" }}>{cuisine}</h2>

          {items.map((item) => (
            <div className="card" key={item._id}>
              <h3>{item.name}</h3>
              <p>₹{item.price}</p>

              <button
                className="btn"
                onClick={() =>
                  dispatch(
                    addToCart({
                      menu_item_id: item._id,
                      name: item.name,
                      price: item.price
                    })
                  )
                }
              >
                Add
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}