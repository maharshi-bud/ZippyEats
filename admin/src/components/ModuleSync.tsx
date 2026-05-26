"use client";

// ============================================================
// FILE: admin/src/components/ModuleSync.tsx
// ── Pulls SIDEBAR_RESOURCES and syncs them to server ─────────
// Runs once on app load. Any new key in SIDEBAR_LINKS gets
// automatically added to all roles in DB.
// ============================================================

import { useEffect } from "react";
import { SIDEBAR_RESOURCES } from "./layout/Sidebar";
import api from "../lib/api";

export default function ModuleSync() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    api
      .post("/admin/modules/sync", { resources: SIDEBAR_RESOURCES })
      .then((res) => {
        if (res.data.synced > 0) {
          console.log(`[ModuleSync] Added ${res.data.synced} new resource(s) to roles`);
        }
      })
      .catch(() => {}); // non-fatal
  }, []);

  return null;
}