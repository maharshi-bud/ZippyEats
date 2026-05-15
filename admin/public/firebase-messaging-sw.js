// ============================================================
// FILE: client/public/firebase-messaging-sw.js
// Also copy to: admin/public/firebase-messaging-sw.js
// ============================================================
// This file MUST be in /public — it runs as a service worker
// ============================================================

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyDcUIhib2wJVlFeXRmWG3Yc27WD1wFf2-4",
  authDomain:        "zippyeats-9a038.firebaseapp.com",
  projectId:         "zippyeats-9a038",
  storageBucket:     "zippyeats-9a038.firebasestorage.app",
  messagingSenderId: "855429795584",
  appId:             "1:855429795584:web:34b5636417c50254142de5",
    measurementId: "G-T6EQ8YD4S0"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  const data = payload.data || {};

  const notificationTitle = title;
  const notificationOptions = {
    body,
    icon: "/icons/icon-192x192.png", // optional — add your app icon
    badge: "/icons/badge-72x72.png",
    data,
    actions: getActions(data.type),
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

function getActions(type) {
  if (type?.startsWith("ORDER")) {
    return [{ action: "view_order", title: "View Order" }];
  }
  if (type?.startsWith("TICKET")) {
    return [{ action: "view_ticket", title: "View Ticket" }];
  }
  return [];
}

// Handle notification click
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
