"use client";

import type { ReactNode } from "react";

import RestaurantSidebar from "../../components/Restaurant/RestaurantSidebar";
import RestaurantNavbar from "../../components/Restaurant/RestaurantNavbar";

export default function RestaurantLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen overflow-hidden bg-[#0B1020] text-white">
      <RestaurantSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <RestaurantNavbar />

        <main className="min-h-[calc(100vh-5rem)] flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 sm:p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
