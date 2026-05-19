// ============================================================
// FILE: admin/public/firebase-messaging-sw.js
// ============================================================

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyDcUIhib2wJVlFeXRmWG3Yc27WD1wFf2-4",
  authDomain:        "zippyeats-9a038.firebaseapp.com",
  projectId:         "zippyeats-9a038",
  storageBucket:     "zippyeats-9a038.firebasestorage.app",
  messagingSenderId: "855429795584",
  appId:             "1:855429795584:web:34b5636417c50254142de5",
  measurementId:     "G-T6EQ8YD4S0"
});

const messaging = firebase.messaging();

// Dedupe guard + prefer payload.data for title/body
const recentMessageIds = new Set();
function forgetMessageId(id, ttl = 30_000) { setTimeout(() => recentMessageIds.delete(id), ttl); }

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || (payload.notification && payload.notification.title) || "ZippyEats Admin";
  const body = data.body || (payload.notification && payload.notification.body) || "";
  const messageId = data.messageId || payload.messageId || `m_${Date.now()}`;
  const tag = data.tag || data.ticketId || data.orderId || messageId || "default";

  // avoid duplicate processing
  if (recentMessageIds.has(messageId)) {
    console.log("[SW] Duplicate messageId in-memory, skipping:", messageId);
    return;
  }

  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    // show notification only if not already present
    self.registration.getNotifications({ tag }).then((existing) => {
      if (existing && existing.length > 0) {
        console.log("[SW] Existing notification with tag found, skipping:", tag);
        return;
      }

      recentMessageIds.add(messageId);
      forgetMessageId(messageId);

      self.registration.showNotification(title, {
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
        data: { ...data, messageId },
        tag,
        renotify: true,
        actions: getActions(data.type),
      });
    }).catch((err) => {
      console.warn('[SW] getNotifications failed:', err, '— showing notification as fallback');
      recentMessageIds.add(messageId);
      forgetMessageId(messageId);
      self.registration.showNotification(title, {
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
        data: { ...data, messageId },
        tag,
        renotify: true,
        actions: getActions(data.type),
      });
    });
  });
});

function getActions(type) {
  if (type?.startsWith("TICKET")) return [{ action: "view_ticket", title: "View Ticket" }];
  if (type?.startsWith("ORDER")) return [{ action: "view_order", title: "View Order" }];
  return [];
}

// ── Determine URL based on notification type ─────────────
// ── Determine URL based on notification type ─────────────
function getUrl(data, action) {
  const type = data?.type || "";
  const orderId = data?.orderId;

  // Ticket notifications → /queries (admin)
  if (
    type === "TICKET_NEW" ||
    type === "TICKET_URGENT" ||
    type === "TICKET_STATUS" ||
    action === "view_ticket"
  ) {
    return "/queries";
  }

  // New order / cancelled for restaurant → /restaurant/orders
  if (type === "ORDER_NEW" || type === "ORDER_CANCELLED") {
    return "/restaurant/orders";
  }

  // Other order notifications → /orders (admin orders list)
  if (type.startsWith("ORDER") || action === "view_order") {
    return "/orders";
  }

  return "/";
} 

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const action = event.action;
  const url = getUrl(data, action);
  console.log("[SW] Notification clicked →", url, "Data:", data);

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          const client = clientList[0];
          client.focus();
          return client.navigate(url).catch(() => {
            console.warn("[SW] navigate() failed, using postMessage");
            client.postMessage({ type: "navigate", url });
          });
        }
        return self.clients.openWindow(url);
      })
  );
});