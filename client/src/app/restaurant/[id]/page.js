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

  return (
    <div>
      <h1>{data.name}</h1>

      {data.menu?.map((item) => (
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
  );
}