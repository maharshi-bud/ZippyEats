// admin/src/components/layout/Sidebar.tsx

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
    <div className="h-full bg-black text-white px-5 py-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-10">Admin</h1>

      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const active = path === link.href;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`px-3 py-2 rounded-lg transition ${
                active
                  ? "bg-white text-black"
                  : "hover:bg-gray-800 text-gray-300"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}