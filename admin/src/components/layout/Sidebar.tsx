"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

// ✅ FIX: place image inside admin/public or admin/src/assets
import logo from "../../../../client/src/lib/imgs/logoText.png"; // adjust path accordingly

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
      
      {/* LOGO */}
      <Link href="/"  >
      <div className="px-6 py-5 border-b border-slate-700 flex items-center">
        <Image
          src={logo}
          alt="Logo"
          width={140}
          height={40}
          className="object-contain"
        />
      </div>
      </Link>

      {/* NAV */}
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

      {/* FOOTER */}
      <div className="p-4 border-t border-slate-700 text-sm text-slate-400">
        Admin Panel v1
      </div>
    </aside>
  );
}