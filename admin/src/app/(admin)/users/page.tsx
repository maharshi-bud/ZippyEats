// admin/src/app/(admin)/users/page.tsx

"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import Card from "../../../components/ui/Card";

export default function UsersPage() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  const [sortBy, setSortBy] = useState("totalSpent");
const [order, setOrder] = useState("desc");
const [activeFilter, setActiveFilter] = useState("");


useEffect(() => {
  const fetchData = async () => {
    const statsRes = await api.get("/admin/stats/users-summary");
    const usersRes = await api.get("/admin/stats/users-list", {
      params: { sortBy, order, active: activeFilter },
    });

    setStats(statsRes.data);
    setUsers(usersRes.data);
  };

  fetchData();
}, [sortBy, order, activeFilter]);

        

//       setStats(statsRes.data);
//       setUsers(usersRes.data);
//     };

//     fetchData();
//   }, []);

  if (!stats) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Users</h1>

      {/* CARDS */}
      <div className="grid grid-cols-3 gap-6">
        <Card title="Total Users" value={stats.totalUsers} />
        <Card title="New (7 days)" value={stats.newUsers} />
        <Card title="Avg Ticket" value={`₹${stats.avgTicket}`} />
      </div>



<div className="flex gap-4">
  <select onChange={(e) => setSortBy(e.target.value)}>
    <option value="totalSpent">Total Spent</option>
    <option value="avgTicket">Avg Ticket</option>
  </select>

  <select onChange={(e) => setOrder(e.target.value)}>
    <option value="desc">High → Low</option>
    <option value="asc">Low → High</option>
  </select>

  <select onChange={(e) => setActiveFilter(e.target.value)}>
    <option value="">All</option>
    <option value="true">Active</option>
    <option value="false">Inactive</option>
  </select>
</div>


      {/* TABLE */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Total Spent</th>
              <th className="p-3 text-left">Avg Ticket</th>
              <th className="p-3 text-left">Fav Restaurant</th>
              <th className="p-3 text-left">Status</th>
<th className="p-3 text-left">Fav Dish</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t hover:bg-emerald-50">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-zinc-500">{u.email}</td>
                <td className="p-3 text-emerald-600 font-semibold">
                  ₹{u.totalSpent}
                </td>
                <td className="p-3">₹{u.avgTicket}</td>
                <td className="p-3">{u.favRestaurant}</td>
                <td>
  {u.isActive ? (
    <span className=" p-3 text-green-600 font-semibold">Active</span>
  ) : (
    <span className="p-3 text-red-500">Inactive</span>
  )}
</td>

<td  className="p-3 ">{u.favDish || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}