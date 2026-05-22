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
  { name: "Banners", href: "/banners" },
  { name: "BI", href: "/BI" },
    { name: "Queries", href: "/queries" }
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 text-white">
      {/* LOGO */}
      <Link href="/">
        <div className="flex h-16 items-center border-b border-slate-800 px-5">
          <Image
            src={logo}
            alt="Logo"
            width={140}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>
      </Link>

      {/* NAV */}
      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {links.map((link) => {
          const active =
            path === link.href ||
            (link.href !== "/" && path.startsWith(link.href));

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="border-t border-slate-800 p-4 text-xs text-slate-400">
        Admin Panel v1
      </div>
    </aside>
  );
}
