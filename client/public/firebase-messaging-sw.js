// ============================================================
// FILE: client/public/firebase-messaging-sw.js
// ============================================================

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");

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

    const { title = "ZippyEats", body = "" } = payload.notification || {};
    const data = payload.data || {};

    self.registration.showNotification(title, {
      body,
      icon: "/logoSquare.png",
      badge: "/logoCircle.png",
      data,
      actions: getActions(data.type),
      tag: data.orderId || data.ticketId || "default", // ← prevents duplicate notifications
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
  // Order notifications → go to that specific order page
  if (data.orderId && data.type?.startsWith("ORDER")) return `/orders/${data.orderId}`;
  if (data.type === "REFUND" && data.orderId) return `/orders/${data.orderId}`;
  if (data.type?.startsWith("TICKET")) return "/support"; // adjust to your support page path
  return "/";
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  // Determine URL based on action button clicked or notification type
  let url;
  if (action === "view_order" || (data.type?.startsWith("ORDER") && data.orderId)) {
    url = `/orders/${data.orderId}`;
  } else if (action === "view_ticket" || data.type?.startsWith("TICKET")) {
    url = "/support"; // ← adjust to your client-side support/ticket page path
  } else if (data.type === "REFUND" && data.orderId) {
    url = `/orders/${data.orderId}`;
  } else {
    url = getTargetUrl(data);
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // ✅ If app is already open — focus and navigate to the right page
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          client.navigate(url); // ← navigate existing tab
          return;
        }
      }
      // ✅ App not open — open new window at the right URL
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});