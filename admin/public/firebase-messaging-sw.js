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

messaging.onBackgroundMessage((payload) => {
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    if (clients.length > 0) return;

    const { title = "ZippyEats Admin", body = "" } = payload.notification || {};
    const data = payload.data || {};

    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      data,
      actions: getActions(data.type),
      tag: data.ticketId || data.orderId || "default", // ← prevents duplicate notifications
      renotify: true,
    });
  });
});

function getActions(type) {
  if (type?.startsWith("ORDER")) return [{ action: "view_order", title: "View Order" }];
  if (type?.startsWith("TICKET")) return [{ action: "view_ticket", title: "View Ticket" }];
  return [];
}

function getTargetUrl(data) {
  if (!data) return "/";
  if (data.type === "TICKET_NEW" || data.type === "TICKET_URGENT") return "/queries";
  if (data.type === "TICKET_STATUS") return "/queries";
  if (data.type?.startsWith("ORDER")) return "/orders"; // admin goes to orders list
  return "/";
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  // Determine target URL based on action or notification type
  let url;
  if (action === "view_ticket" || data.type?.startsWith("TICKET")) {
    url = "/queries";
  } else if (action === "view_order" || data.type?.startsWith("ORDER")) {
    url = "/orders";
  } else {
    url = getTargetUrl(data);
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // ✅ If admin app is already open — focus it and navigate
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          client.navigate(url); // ← navigate existing tab to the right page
          return;
        }
      }
      // ✅ No window open — open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});