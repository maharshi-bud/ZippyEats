"use client";

import RestaurantSidebar from "../../../components/Restaurant/RestaurantSidebar";
import RestaurantNavbar from "../../../components/Restaurant/RestaurantNavbar";

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0f1117] text-white">
      <RestaurantSidebar />

      <div className="flex-1 flex flex-col">
        <RestaurantNavbar />

        <main className="p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}