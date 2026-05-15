"use client";
// ============================================================
// FILE: client/src/hooks/useNotifications.js
// Also copy to: admin/src/hooks/useNotifications.js
// ============================================================
// Usage in your root layout or _app:
//   import { useNotifications } from "@/hooks/useNotifications";
//   useNotifications(); // call inside any component that renders on login
// ============================================================

import { useEffect } from "react";
import { requestNotificationPermission, onForegroundMessage } from "../lib/firebase";

export function useNotifications() {
  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken");

    if (!token) return;

    // Request permission + register FCM token
    requestNotificationPermission(token);

    // Handle foreground messages (app is open)
    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      const data = payload.data || {};

      console.log("[FCM] Foreground message:", title, body);

      // Show browser notification even when app is open
      if (Notification.permission === "granted") {
        const n = new Notification(title, {
          body,
          icon: "/icons/icon-192x192.png",
          data,
        });

        n.onclick = () => {
          window.focus();
          if (data.type?.startsWith("ORDER") && data.orderId) {
            window.location.href = `/orders/${data.orderId}`;
          }
          if (data.type?.startsWith("TICKET")) {
            window.location.href = `/queries`;
          }
          n.close();
        };
      }
    });

    return () => unsubscribe?.();
  }, []);
}
