// ============================================================
// FILE: client/src/lib/firebase.js
// Also copy to: admin/src/lib/firebase.js
// ============================================================

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export async function getFirebaseMessaging() {
  if (typeof window === "undefined") return null;
  const supported = await isSupported();
  if (!supported) {
    console.warn("[FCM] Messaging is not supported in this browser");
    return null;
  }
  return getMessaging(app);
}

export async function registerMessagingServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.warn("[FCM] Service workers are not available");
    return null;
  }

  const existing = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
  if (existing) {
    console.log("[SW] Existing registration:", existing.scope);
    return existing;
  }

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
    scope: "/",
  });
  console.log("[SW] Registered:", registration.scope);
  return registration;
}

// ── Request permission + get FCM token ───────────────────
export async function requestNotificationPermission(authToken) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[FCM] Permission denied");
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const serviceWorkerRegistration = await registerMessagingServiceWorker();
    if (!serviceWorkerRegistration) return null;

    const fcmToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration,
    });

    if (!fcmToken) return null;

    // Save token to server
    const serverBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5010";
    await fetch(
      `${serverBase}/api/fcm/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: fcmToken }),
      }
    );

    console.log("[FCM] Token registered:", fcmToken.slice(0, 20) + "...");
    return fcmToken;
  } catch (err) {
    console.error("[FCM] requestPermission failed:", err);
    return null;
  }
}

// ── Listen for foreground messages ───────────────────────
export function onForegroundMessage(callback) {
  if (typeof window === "undefined") return () => {};
  let unsubscribe = () => {};

  getFirebaseMessaging()
    .then((messaging) => {
      if (!messaging) return;
      unsubscribe = onMessage(messaging, callback);
    })
    .catch((err) => console.error("[FCM] foreground listener failed:", err));

  return () => unsubscribe?.();
}
