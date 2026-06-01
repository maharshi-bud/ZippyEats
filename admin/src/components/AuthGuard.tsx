"use client";

// ============================================================
// FILE: admin/src/components/AuthGuard.tsx
// ── Redirects to /login if token is missing or expired ───────
// ============================================================

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is in seconds, Date.now() is in ms
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // treat malformed token as expired
  }
}

export default function AuthGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't guard the login page itself
    if (pathname === "/login") return;

    const token = localStorage.getItem("token");

    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("token");
      router.replace("/login");
    }
  }, [pathname]);

  return null;
}