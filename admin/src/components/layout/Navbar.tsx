// admin/src/components/layout/Navbar.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserInfo = {
  name?: string;
  role?: string;
};

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    // ✅ Read user saved by login page — instant, no network call needed
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch {
      // malformed JSON — ignore
    }
  }, []);

  const handleLogout = async () => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("adminToken");
      if (token) {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5010";
        await fetch(`${API_BASE}/api/fcm/token`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error("[FCM] Logout clear failed:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("restaurantToken");
      localStorage.removeItem("restaurant");
      localStorage.removeItem("user");
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith("fcm_init_"))
        .forEach((k) => sessionStorage.removeItem(k));
      router.push("/login");
    }
  };

  const displayName = user?.name || "...";
  const displayRole = user?.role?.replace(/_/g, " ") || "...";
  const avatar = (user?.name || user?.role || "A").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
      <h1 className="truncate text-lg font-semibold text-slate-900">
        Admin Dashboard
      </h1>

      <div className="flex min-w-0 items-center gap-3">

        {/* User Info */}
        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate text-sm font-semibold text-slate-900">
            {displayName}
          </p>
          <p className="truncate text-xs capitalize text-slate-500">
            {displayRole}
          </p>
        </div>

        {/* Avatar */}
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-sm font-bold uppercase text-slate-700">
          {avatar}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="rounded-lg bg-slate-950 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Logout
        </button>

      </div>
    </header>
  );
}