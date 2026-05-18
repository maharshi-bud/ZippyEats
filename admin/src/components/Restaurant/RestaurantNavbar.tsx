"use client";

import { Bell, Search, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RestaurantNavbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("restaurantToken");
    localStorage.removeItem("restaurant");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#151924] px-4 sm:px-6">
      
      {/* LEFT */}
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-white">
          Restaurant Panel
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex min-w-0 items-center gap-3">
        
        {/* SEARCH */}
        <div className="relative hidden sm:block">
          <Search
            className="absolute left-3 top-3 text-gray-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-56 rounded-xl border border-white/10 bg-[#0f1117] py-2 pl-10 pr-4 text-white outline-none placeholder:text-gray-500"
          />
        </div>

        {/* NOTIFICATIONS */}
        <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f1117] transition hover:bg-[#1b2030]">
          <Bell size={20} />
        </button>

        {/* PROFILE */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold text-white">
          R
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">
            Logout
          </span>
        </button>
      </div>
    </header>
  );
}