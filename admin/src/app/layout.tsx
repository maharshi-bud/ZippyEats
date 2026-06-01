// ============================================================
// FILE: admin/src/app/layout.tsx
// ============================================================

import type { ReactNode } from "react";
import NotificationInit from "../components/NotificationInit";
import ModuleSync from "../components/ModuleSync";
import AuthGuard from "../components/AuthGuard";
import "./global.css";

export const metadata = {
  title: "ZippyEats Admin",
  description: "ZippyEats operations dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Redirects to /login if token missing or expired */}
        <AuthGuard />
        {/* Syncs module resources with server on every app load */}
        <ModuleSync />
        <NotificationInit />
        {children}
      </body>
    </html>
  );
}