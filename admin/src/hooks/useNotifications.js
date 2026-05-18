"use client";
import { useEffect } from "react";
import { requestNotificationPermission, onForegroundMessage } from "../lib/firebase";

export function useNotifications() {
  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
    if (!token) return;

    // ✅ Only register once per session
    // const tokenKey = `fcm_init_${token.slice(-10)}`; // last 10 chars of JWT as key
    // if (sessionStorage.getItem(tokenKey)) return;
    // if (sessionStorage.getItem("fcm_init")) return;
    // sessionStorage.setItem("fcm_init", "true");

    let isAdmin = false;
    try {
      const payload = JSON.parse(atob(token.split(".")[1] || ""));
      isAdmin = payload?.role === "admin";
    } catch (err) {
      console.warn("[FCM] Could not parse token role:", err);
    }

    requestNotificationPermission(token, isAdmin);

    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      console.log("[FCM] Foreground message:", title, body);
    });

    return () => unsubscribe?.();
  }, []);
}