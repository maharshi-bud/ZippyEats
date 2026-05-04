// admin/src/app/layout.tsx

"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import "./global.css";

const metadata = {
  title: "Admin Dashboard",
  description: "ZippyEats Admin Panel",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // allow login page
    if (pathname === "/login") return;

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      // check expiry
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      // check admin role
      if (payload.role !== "admin") {
        router.push("/login");
        return;
      }
    } catch {
      router.push("/login");
    }
  }, [pathname, router]);

  // Login page layout (no navbar/sidebar)
  if (pathname === "/login") {
    return (
      <html lang="en">
        <body className="bg-slate-100 text-slate-900 antialiased">
          {children}
        </body>
      </html>
    );
  }

  // Dashboard layout (with navbar/sidebar)
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">
        <div className="flex min-h-screen">
          {/* SIDEBAR */}
          <Sidebar />

          {/* MAIN */}
          <div className="flex-1 flex flex-col">
            {/* NAVBAR */}
            <Navbar />

            {/* CONTENT */}
            <main className="flex-1 p-6 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}