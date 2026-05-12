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
