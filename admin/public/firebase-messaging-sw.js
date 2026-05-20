// ============================================================
// FILE: admin/public/firebase-messaging-sw.js
// ============================================================

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

// ── SW lifecycle ───────────────────────────────────────────
self.addEventListener(
  "install",
  () => self.skipWaiting()
);

self.addEventListener(
  "activate",
  (event) =>
    event.waitUntil(
      self.clients.claim()
    )
);

// ── Firebase init ──────────────────────────────────────────
firebase.initializeApp({
  apiKey: "AIzaSyDcUIhib2wJVlFeXRmWG3Yc27WD1wFf2-4",
  authDomain: "zippyeats-9a038.firebaseapp.com",
  projectId: "zippyeats-9a038",
  storageBucket: "zippyeats-9a038.firebasestorage.app",
  messagingSenderId: "855429795584",
  appId: "1:855429795584:web:34b5636417c50254142de5",
  measurementId: "G-T6EQ8YD4S0",
});

const messaging = firebase.messaging();

// ── Dedupe guard ───────────────────────────────────────────
const recentMessageIds = new Set();

function forgetMessageId(
  id,
  ttl = 30000
) {
  setTimeout(
    () =>
      recentMessageIds.delete(id),
    ttl
  );
}

// ── Background notifications ──────────────────────────────
messaging.onBackgroundMessage(
  async (payload) => {

    console.log(
      "[ADMIN SW] Background message:",
      payload
    );

    const data =
      payload.data || {};

    const title =
      data.title ||
      payload.notification?.title ||
      "ZippyEats Admin";

    const body =
      data.body ||
      payload.notification?.body ||
      "";

    const messageId =
      data.messageId ||
      payload.messageId ||
      `m_${Date.now()}`;

    const tag =
      data.tag ||
      data.ticketId ||
      data.orderId ||
      messageId;

    // prevent duplicate processing
    if (
      recentMessageIds.has(
        messageId
      )
    ) {

      console.log(
        "[ADMIN SW] Duplicate skipped:",
        messageId
      );

      return;
    }

    try {

      // existing notifications check
      const existing =
        await self.registration.getNotifications({
          tag,
        });

      if (
        existing &&
        existing.length > 0
      ) {

        console.log(
          "[ADMIN SW] Existing notification:",
          tag
        );

        return;
      }

      recentMessageIds.add(
        messageId
      );

      forgetMessageId(
        messageId
      );

      await self.registration.showNotification(
        title,
        {
          body,

          icon:
            "/icons/icon-192x192.png",

          badge:
            "/icons/badge-72x72.png",

          tag,

          renotify: false,

          data: {
            ...data,
            messageId,
          },

          actions:
            getActions(
              data.type
            ),
        }
      );

    } catch (err) {

      console.error(
        "[ADMIN SW] Notification failed:",
        err
      );
    }
  }
);

// ── Notification actions ──────────────────────────────────
function getActions(type) {

  if (
    type?.startsWith(
      "TICKET"
    )
  ) {

    return [
      {
        action:
          "view_ticket",

        title:
          "Open Ticket",
      },
    ];
  }

  if (
    type?.startsWith(
      "ORDER"
    )
  ) {

    return [
      {
        action:
          "view_order",

        title:
          "View Order",
      },
    ];
  }

  return [];
}



// ── Notification click handler ────────────────────────────
self.addEventListener(
  "notificationclick",
  (event) => {

    console.log(
      "[ADMIN SW] Notification click:",
      event.notification.data
    );

    event.notification.close();

    const data =
      event.notification.data || {};

    const action =
      event.action;

    const url =
      getUrl(
        data,
        action
      );

    console.log(
      "[ADMIN SW] Navigate to:",
      url
    );

    event.waitUntil(

      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })

        .then(
          async (
            clientList
          ) => {

            // existing tab
            for (const client of clientList) {

              if (
                client.url.startsWith(
                  self.location.origin
                )
              ) {

                await client.focus();

                // IMPORTANT:
                // send message to Next.js app
                client.postMessage({
                  type:
                    "navigate",

                  url,
                });

                return;
              }
            }

            // no tab open
            return self.clients.openWindow(
              url
            );
          }
        )
    );
  }
);






function getUrl(data, action) {

  const type = data?.type || "";

  const role = data?.role || "";

  if (type.startsWith("TICKET") || action === "view_ticket") {
    if (role === "admin") {
   
    return "/queries";
  }
  }

  if (type.startsWith("ORDER") || action === "view_order") {
    if (role === "restaurant") {
      return "/restaurant/orders";
    }
    if (role === "admin") {
      return data.orderId ? `/order/${data.orderId}` : "/orders";
    }
    // return data.orderId ? `/order/${data.orderId}` : "/orders";
  }

  return "/";

}