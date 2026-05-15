// ============================================================
// FILE: client/src/lib/firebase.js
// Also copy to: admin/src/lib/firebase.js
// ============================================================

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export function getFirebaseMessaging() {
  if (typeof window === "undefined") return null;
  return getMessaging(app);
}

// ── Request permission + get FCM token ───────────────────
export async function requestNotificationPermission(
  authToken,
  isAdmin = false
) {

  try {

    const permission =
      await Notification.requestPermission();

    if (permission !== "granted") {

      console.log(
        "[FCM] Permission denied"
      );

      return null;
    }

    const messaging =
      getFirebaseMessaging();

    if (!messaging) return null;

    const fcmToken =
      await getToken(
        messaging,
        {
          vapidKey:
            process.env
              .NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        }
      );

    if (!fcmToken) return null;

    // ── Save token ─────────────────

    await fetch(
      `${
        process.env
          .NEXT_PUBLIC_SERVER_URL
        || "http://localhost:5010"
      }/api/fcm/token`,
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${authToken}`,
        },

        body: JSON.stringify({
          token: fcmToken,
        }),
      }
    );

    console.log(
      "[FCM] Token registered:",
      fcmToken.slice(0, 20) + "..."
    );

    // ── Admin topic subscription ──

    if (isAdmin) {

      try {

        await fetch(
          `${
            process.env
              .NEXT_PUBLIC_SERVER_URL
            || "http://localhost:5010"
          }/api/fcm/subscribe-admin`,
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${authToken}`,
            },

            body: JSON.stringify({
              token: fcmToken,
            }),
          }
        );

        console.log(
          "[FCM] Admin subscribed to topics"
        );

      } catch (err) {

        console.error(
          "[FCM] Admin topic subscription failed:",
          err
        );
      }
    }

    return fcmToken;

  } catch (err) {

    console.error(
      "[FCM] requestPermission failed:",
      err
    );

    return null;
  }
}

// ── Listen for foreground messages ───────────────────────
export function onForegroundMessage(callback) {
  if (typeof window === "undefined") return () => {};
  const messaging = getFirebaseMessaging();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
