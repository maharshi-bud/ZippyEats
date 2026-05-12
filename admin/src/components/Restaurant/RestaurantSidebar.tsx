"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  BarChart3,
  Settings,
} from "lucide-react";

const links = [
  {
    label: "Dashboard",
    href: "/restaurant",
    icon: LayoutDashboard,
  },
  {
    label: "Orders",
    href: "/restaurant/orders",
    icon: ShoppingBag,
  },
  {
    label: "Menu",
    href: "/restaurant/menu",
    icon: UtensilsCrossed,
  },

  {
    label: "Settings",
    href: "/restaurant/settings",
    icon: Settings,
  },
];

export default function RestaurantSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-[#151924] border-r border-white/10 p-5">
      <div className="text-2xl font-bold mb-10">
        ZippyEats
      </div>

      <div className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;

          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                active
                  ? "bg-orange-500 text-white"
                  : "hover:bg-white/5 text-gray-300"
              }`}
            >
              <Icon size={20} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}