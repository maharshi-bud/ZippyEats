"use client";

import { Bell, Search } from "lucide-react";

export default function RestaurantNavbar() {
  return (
    <header className="h-20 border-b border-white/10 bg-[#151924] px-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">
          Restaurant Panel
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-3 text-gray-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search..."
            className="bg-[#0f1117] border border-white/10 rounded-xl pl-10 pr-4 py-2 outline-none"
          />
        </div>

        <button className="w-11 h-11 rounded-xl bg-[#0f1117] flex items-center justify-center">
          <Bell size={20} />
        </button>

        <div className="w-11 h-11 rounded-full bg-orange-500 flex items-center justify-center font-bold">
          R
        </div>
      </div>
    </header>
  );
}