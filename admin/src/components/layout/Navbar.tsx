// admin/src/components/layout/Navbar.tsx

"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
<header className="sticky top-0 z-50 h-17 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">      <h1 className="text-lg font-semibold text-slate-900">
        Admin Dashboard
      </h1>

      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">Admin</span>

        <div className="w-8 h-8 rounded-full bg-slate-300" />

        <button
          onClick={handleLogout}
          className="text-sm bg-black text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}