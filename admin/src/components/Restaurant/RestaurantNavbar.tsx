"use client";

import { Bell, Search } from "lucide-react";

export default function RestaurantNavbar() {
  return (
    <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#151924] px-4 sm:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold">
          Restaurant Panel
        </h1>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="relative hidden sm:block">
          <Search
            className="absolute left-3 top-3 text-gray-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-56 rounded-xl border border-white/10 bg-[#0f1117] py-2 pl-10 pr-4 outline-none"
          />
        </div>

        <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f1117]">
          <Bell size={20} />
        </button>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold">
          R
        </div>
      </div>
    </header>
  );
}
