"use client";
import { useEffect } from "react";
import { requestNotificationPermission, onForegroundMessage } from "../lib/firebase";

export function useNotifications() {
  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
    if (!token) return;

    // ✅ Only register once per session
    if (sessionStorage.getItem("fcm_init")) return;
    sessionStorage.setItem("fcm_init", "true");

    requestNotificationPermission(token, true);

    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      const data = payload.data || {};
      console.log("[FCM] Foreground message:", title, body);
    });

    return () => unsubscribe?.();
  }, []);
}