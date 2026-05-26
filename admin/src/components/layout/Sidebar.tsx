"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import api from "../../lib/api";

import logo from "../../../../client/src/lib/imgs/logoText.png";

type UserPermissions = {
  [resource: string]: {
    add: boolean;
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
};

type MenuLink = {
  name: string;
  href: string;
  resource: string; // which resource this menu item requires
  requiredOp?: string; // which operation (default: "view")
};

const links: MenuLink[] = [
  { name: "Dashboard", href: "/", resource: "dashboard", requiredOp: "view" },
  { name: "Orders", href: "/orders", resource: "orders", requiredOp: "view" },
  { name: "Users", href: "/users", resource: "users", requiredOp: "view" },
  { name: "Restaurants", href: "/restaurants", resource: "restaurants", requiredOp: "view" },
  { name: "Banners", href: "/banners", resource: "banners", requiredOp: "view" },
  { name: "BI", href: "/BI", resource: "bi", requiredOp: "view" },
  { name: "Queries", href: "/queries", resource: "queries", requiredOp: "view" },
  { name: "Roles", href: "/roles", resource: "dashboard", requiredOp: "view" }, // Only admins can manage roles
];

export default function Sidebar() {
  const path = usePathname();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        // Decode role from JWT token
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          setLoading(false);
          return;
        }

        // Decode JWT (simple base64 decode)
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userRole = payload.role;

        if (!userRole) {
          console.error("No role in token");
          setLoading(false);
          return;
        }

        console.log("User role from token:", userRole);

        // Fetch all roles from backend
        const roleRes = await api.get("/admin/roles");
        const roles = roleRes.data.data;

        console.log("All roles from backend:", roles);

        // Find user's role
        const userRoleData = roles.find(
          (r: any) => r.name.toLowerCase() === userRole.toLowerCase()
        );

        console.log("User role data:", userRoleData);

        if (userRoleData && userRoleData.permissions) {
          // Ensure permissions is an object
          let perms = userRoleData.permissions;
          
          // If it's a Map-like object, convert it
          if (perms && typeof perms === 'object') {
            // Ensure all resources exist
            const fullPerms: UserPermissions = {
              dashboard: { add: false, view: false, edit: false, delete: false },
              users: { add: false, view: false, edit: false, delete: false },
              restaurants: { add: false, view: false, edit: false, delete: false },
              menu: { add: false, view: false, edit: false, delete: false },
              banners: { add: false, view: false, edit: false, delete: false },
              orders: { add: false, view: false, edit: false, delete: false },
              queries: { add: false, view: false, edit: false, delete: false },
              bi: { add: false, view: false, edit: false, delete: false },
            };

            // Merge with fetched permissions
            for (const [resource, ops] of Object.entries(perms)) {
              if (fullPerms[resource as keyof UserPermissions]) {
                fullPerms[resource as keyof UserPermissions] = {
                  ...fullPerms[resource as keyof UserPermissions],
                  ...(ops as any),
                };
              }
            }

            console.log("Final permissions:", fullPerms);
            setPermissions(fullPerms);
          }
        } else {
          console.error("Role not found or no permissions");
        }
      } catch (err) {
        console.error("Failed to fetch permissions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  // Check if user has permission to access a menu item
  const hasAccess = (link: MenuLink): boolean => {
    if (!permissions) return false;

    const resourcePerms = permissions[link.resource];
    if (!resourcePerms) return false;

    const op = link.requiredOp || "view";
    return resourcePerms[op as keyof typeof resourcePerms] === true;
  };

  // Filter links - only show tabs user has permission to access
  const visibleLinks = links.filter(hasAccess);

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
        {loading ? (
          <div className="px-3 py-2.5 text-xs text-slate-400">Loading...</div>
        ) : visibleLinks.length > 0 ? (
          visibleLinks.map((link) => {
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
          })
        ) : (
          <div className="px-3 py-2.5 text-xs text-slate-400">
            No pages available. Contact admin.
          </div>
        )}
      </nav>

      {/* FOOTER */}
      <div className="border-t border-slate-800 p-4 text-xs text-slate-400">
        Admin Panel v1
      </div>
    </aside>
  );
}
