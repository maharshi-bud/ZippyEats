import type { ReactNode } from "react";
import "./global.css";

export const metadata = {
  title: "Admin Dashboard",
  description: "ZippyEats Admin Panel",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">

        <div className="flex min-h-screen">

          {/* 🔥 SIDEBAR */}
          <aside className="w-64 bg-slate-900 text-white flex flex-col">

            <div className="px-6 py-5 text-xl font-bold border-b border-slate-700">
              Zippy Admin
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">

              <a href="/admin" className="block px-4 py-2 rounded-lg hover:bg-slate-800 transition">
                Dashboard
              </a>

              <a href="/admin/orders" className="block px-4 py-2 rounded-lg hover:bg-slate-800 transition">
                Orders
              </a>

              <a href="/admin/restaurants" className="block px-4 py-2 rounded-lg hover:bg-slate-800 transition">
                Restaurants
              </a>

              <a href="/admin/users" className="block px-4 py-2 rounded-lg hover:bg-slate-800 transition">
                Users
              </a>

            </nav>

            <div className="p-4 border-t border-slate-700 text-sm text-slate-400">
              Admin Panel v1
            </div>

          </aside>

          {/* 🔥 MAIN CONTENT */}
          <div className="flex-1 flex flex-col">

            {/* 🔥 NAVBAR */}
            <header className="h-16 bg-white shadow flex items-center justify-between px-6">

              <h1 className="text-lg font-semibold">
                Admin Dashboard
              </h1>

              <div className="flex items-center gap-4">

                <span className="text-sm text-slate-500">
                  Admin
                </span>

                <div className="w-8 h-8 rounded-full bg-slate-300" />

              </div>

            </header>

            {/* 🔥 PAGE CONTENT */}
            <main className="p-6 flex-1">
              {children}
            </main>

          </div>

        </div>

      </body>
    </html>
  );
}