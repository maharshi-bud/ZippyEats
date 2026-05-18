"use client";
import { useEffect } from "react";
import { requestNotificationPermission, onForegroundMessage } from "../lib/firebase";

export function useNotifications() {
  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
    if (!token) return;

    if (sessionStorage.getItem("fcm_init")) return;

    async function init() {
      try {
        // ✅ Wait for service worker to be ready before getting FCM token
        if ("serviceWorker" in navigator) {
          await navigator.serviceWorker.ready;
          console.log("[FCM] Service worker ready");
        }

        sessionStorage.setItem("fcm_init", "true");
        await requestNotificationPermission(token);
      } catch (err) {
        console.error("[FCM] init failed:", err);
        sessionStorage.removeItem("fcm_init"); // allow retry on next load
      }
    }

    init();

    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      const data = payload.data || {};
      console.log("[FCM] Foreground message:", title, body);
    });

    return () => unsubscribe?.();
  }, []);
} 