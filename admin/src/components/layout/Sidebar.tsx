"use client";

// ============================================================
// FILE: admin/src/components/layout/Sidebar.tsx
// ── SIDEBAR IS THE SINGLE SOURCE OF TRUTH FOR MODULES ────────
// To add a new module:
//   1. Create the Next.js page
//   2. Add one entry to SIDEBAR_LINKS below
//   → DB sync, permissions matrix, sidebar all update automatically
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import api from "../../lib/api";

import logo from "../../../../client/src/lib/imgs/logoText.png";

// ── THE ONLY PLACE YOU DEFINE MODULES ────────────────────────
export type SidebarLink = {
  key: string;         // resource key used in permissions DB
  label: string;       // display name
  href: string;        // Next.js route
  requiredOp?: string; // permission needed (default: "view")
  resource?: string;   // override resource key (e.g. Roles uses "users")
};

export const SIDEBAR_LINKS: SidebarLink[] = [
  { key: "dashboard",   label: "Dashboard",   href: "/",            requiredOp: "view" },
  { key: "orders",      label: "Orders",      href: "/orders",      requiredOp: "view" },
  { key: "users",       label: "Users",       href: "/users",       requiredOp: "view" },
  { key: "restaurants", label: "Restaurants", href: "/restaurants", requiredOp: "view" },
  { key: "banners",     label: "Banners",     href: "/banners",     requiredOp: "view" },
  { key: "bi",          label: "BI",          href: "/BI",          requiredOp: "view" },
  { key: "queries",     label: "Queries",     href: "/queries",     requiredOp: "view" },
  { key: "roles",       label: "Roles",       href: "/roles",       requiredOp: "edit", resource: "users" },
  { key: "staff",       label: "Staff",       href: "/staff",       requiredOp: "edit", resource: "users" },
  // ── Add new modules here ─────────────────────────────────
];

// Derived: unique resource keys — used by ModuleSync and permissions matrix
export const SIDEBAR_RESOURCES = [
  ...new Set(SIDEBAR_LINKS.map((l) => l.resource ?? l.key)),
];

// ─────────────────────────────────────────────────────────────

type UserPermissions = {
  [resource: string]: {
    add: boolean;
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
};

export default function Sidebar() {
  const path = usePathname();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { setLoading(false); return; }

        const res = await api.get("/admin/me/permissions");
        const perms = res.data.data.permissions;

        // Build full permissions object — dynamic, no hardcoded keys
        const fullPerms: UserPermissions = {};

        // Seed all sidebar resources as false
        for (const resource of SIDEBAR_RESOURCES) {
          fullPerms[resource] = { add: false, view: false, edit: false, delete: false };
        }

        // Merge actual permissions from server
        for (const [resource, ops] of Object.entries(perms)) {
          fullPerms[resource] = {
            add: false, view: false, edit: false, delete: false,
            ...(ops as any),
          };
        }

        setPermissions(fullPerms);
      } catch (err) {
        console.error("Failed to fetch permissions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasAccess = (link: SidebarLink): boolean => {
    if (!permissions) return false;
    const resource = link.resource ?? link.key;
    const resourcePerms = permissions[resource];
    if (!resourcePerms) return false;
    const op = link.requiredOp ?? "view";
    return resourcePerms[op as keyof typeof resourcePerms] === true;
  };

  const visibleLinks = SIDEBAR_LINKS.filter(hasAccess);

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
                key={link.key}
                href={link.href}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {link.label}
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