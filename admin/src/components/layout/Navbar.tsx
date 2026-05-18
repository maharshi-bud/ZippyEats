// admin/src/components/layout/Navbar.tsx

"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
      if (token) {
        await fetch("http://localhost:5010/api/fcm/token", {
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
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith("fcm_init_"))
        .forEach((k) => sessionStorage.removeItem(k));
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
      <h1 className="truncate text-lg font-semibold text-slate-900">
        Admin Dashboard
      </h1>

      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden text-sm text-slate-500 sm:inline">Admin</span>

        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
          A
        </div>

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
