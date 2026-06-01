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

// // ── THE ONLY PLACE YOU DEFINE MODULES ────────────────────────
// export type SidebarLink = {
//   key: string;         // resource key used in permissions DB
//   label: string;       // display name
//   href: string;        // Next.js route
//   requiredOp?: string; // permission needed (default: "view")
//   resource?: string;   // override resource key (e.g. Roles uses "users")
// };

// export const SIDEBAR_LINKS: SidebarLink[] = [
//   { key: "dashboard",   label: "Dashboard",   href: "/",            requiredOp: "view" },
//   { key: "orders",      label: "Orders",      href: "/orders",      requiredOp: "view" },
//   { key: "users",       label: "Users",       href: "/users",       requiredOp: "view" },
//   { key: "restaurants", label: "Restaurants", href: "/restaurants", requiredOp: "view" },
//   { key: "banners",     label: "Banners",     href: "/banners",     requiredOp: "view" },
//   { key: "bi",          label: "BI",          href: "/BI",          requiredOp: "view" },
//   { key: "queries",     label: "Queries",     href: "/queries",     requiredOp: "view" },
//   { key: "roles",       label: "Roles",       href: "/roles",       requiredOp: "edit", resource: "users" },
//   { key: "staff",       label: "Staff",       href: "/staff",       requiredOp: "edit", resource: "users" },
//   // ── Add new modules here ─────────────────────────────────
// ];


export type SidebarChild = {
  key: string;
  label: string;
  href: string;
  requiredOp?: string;
  resource?: string;
};

export type SidebarLink = {
  key: string;
  label: string;
  href?: string;
  requiredOp?: string;
  resource?: string;
  children?: SidebarChild[];
};

export const SIDEBAR_LINKS: SidebarLink[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/",
    requiredOp: "view",
  },

  {
    key: "orders",
    label: "Orders",
    href: "/orders",
    requiredOp: "view",
  },

  {
    key: "users",
    label: "Users",
    href: "/users",
    requiredOp: "view",
  },

  {
    key: "restaurants",
    label: "Restaurants",
    href: "/restaurants",
    requiredOp: "view",
  },

  {
    key: "banners",
    label: "Banners",
    href: "/banners",
    requiredOp: "view",
  },
  {
    key: "coupons",
    label: "Coupons",
    href: "/coupons",
    // requiredOp: "view",
  },

  {
    key: "bi",
    label: "BI",
    href: "/BI",
    requiredOp: "view",
  },

  {
    key: "queries",
    label: "Queries",
    href: "/queries",
    requiredOp: "view",
  },

  // ── RBAC GROUP ─────────────────────────
  {
    key: "rbac",
    label: "RBAC",

    children: [
      {
        key: "roles",
        label: "Roles",
        href: "/roles",
        requiredOp: "edit",
        resource: "users",
      },

      {
        key: "staff",
        label: "Staff",
        href: "/staff",
        requiredOp: "edit",
        resource: "users",
      },
    ],
  },
];




// Derived: unique resource keys — used by ModuleSync and permissions matrix
// export const SIDEBAR_RESOURCES = [
//   ...new Set(SIDEBAR_LINKS.map((l) => l.resource ?? l.key)),
// ];
export const SIDEBAR_RESOURCES = [
  ...new Set(
    SIDEBAR_LINKS.flatMap((link) => {

      if (link.children) {
        return link.children.map(
          (child) => child.resource ?? child.key
        );
      }

      return [link.resource ?? link.key];
    })
  ),
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

  // const visibleLinks = SIDEBAR_LINKS.filter(hasAccess);
const visibleLinks = SIDEBAR_LINKS.filter((link) => {

  if (link.children) {
    return link.children.some(hasAccess);
  }

  return hasAccess(link);
});
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
    <div className="px-3 py-2.5 text-xs text-slate-400">
      Loading...
    </div>
  ) : visibleLinks.length > 0 ? (

    visibleLinks.map((link) => {

      // ── DROPDOWN GROUP ──────────────────────────
      if (link.children) {

        const visibleChildren =
          link.children.filter(hasAccess);

        if (visibleChildren.length === 0) {
          return null;
        }

        const isGroupActive = visibleChildren.some(
          (child) =>
            path === child.href ||
            (child.href !== "/" &&
              path.startsWith(child.href))
        );

        return (
          <details
            key={link.key}
            open={isGroupActive}
            className="group"
          >

            {/* DROPDOWN HEADER */}
            <summary
              className={`flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isGroupActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{link.label}</span>

              <svg
                className="h-4 w-4 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>

            {/* CHILD LINKS */}
            <div className="mt-1 ml-3 space-y-1 border-l border-slate-700 pl-3">

              {visibleChildren.map((child) => {

                const active =
                  path === child.href ||
                  (child.href !== "/" &&
                    path.startsWith(child.href));

                return (
                  <Link
                    key={child.key}
                    href={child.href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {child.label}
                  </Link>
                );
              })}

            </div>
          </details>
        );
      }

      // ── NORMAL LINK ─────────────────────────────
      const active =
        path === link.href ||
        (typeof link.href === "string" &&
          link.href !== "/" &&
          path.startsWith(link.href));

      return (
        <Link
          key={link.key}
          href={link.href!}
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
