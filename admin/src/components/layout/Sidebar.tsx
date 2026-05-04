// admin/src/components/layout/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { name: "Dashboard", href: "/" },
  { name: "Orders", href: "/orders" },
  { name: "Users", href: "/users" },
  { name: "Restaurants", href: "/restaurants" },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
      <div className="px-6 py-5 text-xl font-bold border-b border-slate-700">
        Zippy Admin
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {links.map((link) => {
          const active = path === link.href;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`block px-4 py-2 rounded-lg transition ${
                active
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 text-sm text-slate-400">
        Admin Panel v1
      </div>
    </aside>
  );
}