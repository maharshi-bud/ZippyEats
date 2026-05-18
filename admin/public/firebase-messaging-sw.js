// ============================================================
// FILE: admin/public/firebase-messaging-sw.js
// ============================================================

// ✅ Take over immediately — prevents duplicate service workers
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

messaging.onBackgroundMessage((payload) => {
  // ✅ Skip if app window is open — prevents duplicate with foreground handler
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    if (clients.length > 0) return;

    const { title, body } = payload.notification;
    const data = payload.data || {};

    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      data,
      actions: getActions(data.type),
    });
  });
});

function getActions(type) {
  if (type?.startsWith("ORDER")) return [{ action: "view_order", title: "View Order" }];
  if (type?.startsWith("TICKET")) return [{ action: "view_ticket", title: "View Ticket" }];
  return [];
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let url = "/";
  if (data.type?.startsWith("ORDER")) url = `/orders/${data.orderId}`;
  if (data.type?.startsWith("TICKET")) url = `/queries`;
  if (data.type === "REFUND") url = `/orders/${data.orderId}`;

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});