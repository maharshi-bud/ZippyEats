"use client";

import { useEffect, useState } from "react";
// import axios from "@/lib/axios";
import axios from "../../../lib/axios";
import { useDispatch } from "react-redux";
import { addToCart } from "../../../store/slices/cartSlice";

export default function Restaurant({ params }) {
  const [data, setData] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    axios.get(`/restaurant/${params.id}`).then((res) => {
      setData(res.data.data);
    });
  }, [params.id]);

  // ✅ loading guard
  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h1>{data.name}</h1>

      {/* ✅ safe map */}
      {data.menu?.map((item) => (
        <div key={item._id}>
          <h3>{item.name}</h3>
          <p>₹{item.price}</p>

          <button
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