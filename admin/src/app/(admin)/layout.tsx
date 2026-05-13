"use client";

import type { ReactNode } from "react";

import Sidebar from "../../components/layout/Sidebar";
import Navbar from "../../components/layout/Navbar";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden bg-[#0B1020] text-slate-950">
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64">
        <Sidebar />
      </aside>

      {/* Main Section */}
      <div className="ml-64 flex h-screen flex-col">
        
        {/* Navbar */}
        <header className="sticky top-0 z-30 h-16 shrink-0">
          <Navbar />
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 p-4 sm:p-6">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}