// ============================================================
// FILE: client/public/firebase-messaging-sw.js
// Also copy to: admin/public/firebase-messaging-sw.js
// ============================================================

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

firebase.initializeApp({
  apiKey:            "AIzaSyDcUIhib2wJVlFeXRmWG3Yc27WD1wFf2-4",
  authDomain:        "zippyeats-9a038.firebaseapp.com",
  projectId:         "zippyeats-9a038",
  storageBucket:     "zippyeats-9a038.firebasestorage.app",
  messagingSenderId: "855429795584",
  appId:             "1:855429795584:web:34b5636417c50254142de5",
});

const messaging = firebase.messaging();

// ── Background message ────────────────────────────────────
// Server now sends data-only payloads (no notification field).
// FCM won't auto-display anything — we show exactly one here.
// title and body are in payload.data because server puts them there.
// Dedupe guard: short-lived in-memory set of messageIds
const recentMessageIds = new Set();
function forgetMessageId(id, ttl = 30_000) {
  setTimeout(() => recentMessageIds.delete(id), ttl);
}

messaging.onBackgroundMessage((payload) => {
  console.log("[SW] onBackgroundMessage:", payload);

  const data = payload.data || {};
  const title = data.title || (payload.notification && payload.notification.title) || "ZippyEats";
  const body = data.body || (payload.notification && payload.notification.body) || "";
  const messageId = data.messageId || payload.messageId || `m_${Date.now()}`;
  const tag = data.tag || data.orderId || data.ticketId || messageId || "zippyeats";

  console.log("[SW] Showing notification:", title, "| tag:", tag, "| messageId:", messageId);

  // In-memory dedupe
  if (recentMessageIds.has(messageId)) {
    console.log("[SW] Duplicate messageId in-memory, skipping:", messageId);
    return;
  }

  // Check active notifications with same tag to avoid duplicates
  self.registration.getNotifications({ tag }).then((existing) => {
    if (existing && existing.length > 0) {
      console.log("[SW] Existing notification with tag found, skipping showNotification:", tag);
      return;
    }

    recentMessageIds.add(messageId);
    forgetMessageId(messageId);

    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      tag,
      renotify: false,
      data: { ...data, messageId },
    });
  }).catch((err) => {
    console.warn('[SW] getNotifications failed, falling back to showNotification:', err);
    recentMessageIds.add(messageId);
    forgetMessageId(messageId);
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      tag,
      renotify: false,
      data: { ...data, messageId },
    });
  });
});

// ── Notification click ────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] notificationclick fired:", event.notification.data);
  event.notification.close();

  const data = event.notification.data || {};
  const url  = getNavigationUrl(data);
  console.log("[SW] Target url:", url);

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        console.log("[SW] Open clients:", clientList.length);

        const appClient = clientList.find(
          (c) => c.url.startsWith(self.location.origin) && "focus" in c
        );

        if (appClient) {
          console.log("[SW] Posting navigate to open tab");
          appClient.focus();
          appClient.postMessage({ type: "navigate", url });
          return;
        }

        console.log("[SW] No open tab, opening window");
        return clients.openWindow(url);
      })
  );
});

// ── URL builder ───────────────────────────────────────────
function getNavigationUrl(data) {
  const type = data.type || "";
  if (type.startsWith("ORDER") || type === "REFUND") {
    return data.orderId ? `/orders/${data.orderId}` : "/orders";
  }
  if (type.startsWith("TICKET") || type === "SUPPORT") {
    return "/queries";
  }
  return "/";
}