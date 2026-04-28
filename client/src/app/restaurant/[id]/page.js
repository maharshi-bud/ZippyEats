"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/axios";
import MenuItem from "../../../components/MenuItem";

export default function RestaurantPage({ params }) {
  const [menu, setMenu] = useState([]);

  useEffect(() => {
    api.get(`/restaurants/${params.id}`).then((res) => {
      setMenu(res.data.menu);
    });
  }, []);

  return (
    <div className="grid">
      {menu.map((item) => (
        <MenuItem key={item.id} item={item} onAdd={() => {}} />
      ))}
    </div>
  );
}