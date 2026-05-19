// ============================================================
// FILE: server/src/services/fcmService.js
// ============================================================
// Sends Firebase Cloud Messaging push notifications
// ============================================================

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Init Firebase Admin once ─────────────────────────────
let initialized = false;

export function initFirebase() {
  if (initialized) return;
  try {
    const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
  readFileSync(path.join(__dirname, "../../firebase-service-account.json"), "utf8")
);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log("🔥 Firebase Admin initialized");
  } catch (err) {
    console.error("❌ Firebase init failed:", err.message);
  }
}

// ── Send to single FCM token ─────────────────────────────
export async function sendToToken(token, { title, body, data = {} }) {
    // console.log("[FCM] sendToToken called with token:", token ? token.slice(0, 20) + "..." : "NULL");
  console.log("[FCM] sendToToken:", title, "→", token?.slice(0, 15));
    if (!token) return;
  try {
    const message = {
      token,
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    };

    // Only include notification when title/body explicitly provided
    if (title || body) {
      message.notification = { title, body };
    }

    await admin.messaging().send(message);
  } catch (err) {
    console.error(`[FCM] sendToToken failed (${token?.slice(0, 20)}...):`, err.message);
  }
}

// ── Send to multiple tokens ──────────────────────────────
export async function sendToTokens(tokens, payload) {
  const valid = tokens.filter(Boolean);
  if (valid.length === 0) return;
  await Promise.allSettled(valid.map((t) => sendToToken(t, payload)));
}

// ── Send to a topic ──────────────────────────────────────
export async function sendToTopic(topic, { title, body, data = {} }) {
    console.log("[FCM] sendToTopic:", title, "→ topic:", topic);
  try {
    const message = {
      topic,
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    };

    // Only include notification when title/body explicitly provided
    if (title || body) {
      message.notification = { title, body };
    }

    await admin.messaging().send(message);
  } catch (err) {
    console.error(`[FCM] sendToTopic(${topic}) failed:`, err.message);
  }
}

// ============================================================
// NOTIFICATION HELPERS — call these from controllers
// ============================================================

// ── Order notifications ──────────────────────────────────
// Helper to create a stable data payload for SW
function makeMessageData(title, body, extra = {}) {
  const messageId = extra.messageId || `m_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  return {
    ...extra,
    title,
    body,
    messageId,
  };
}

export async function notifyOrderCreated({ restaurantFcmToken, restaurantName, orderId, itemCount, total }) {
  // To restaurant (token) — send data-only payload; SW will display notification
  await sendToToken(restaurantFcmToken, {
    data: makeMessageData(
      "🛎️ New Order!",
      `You have a new order — ${itemCount} items for ₹${total}`,
      { type: "ORDER_NEW", orderId: orderId?.toString() }
    ),
  });

  // To admin topic (data-only)
  await sendToTopic("admin_orders", {
    data: makeMessageData(
      "📦 New Order Placed",
      `New order at ${restaurantName} — ₹${total}`,
      { type: "ORDER_NEW", orderId: orderId?.toString() }
    ),
  });
}

export async function notifyOrderStatusChanged({
  userFcmToken,
  status,
  restaurantName,
  orderId,
}) {

  console.log(
    "Sending notifications for order status:",
    status
  );

  const messages = {

    accepted: {
      title: "✅ Order Accepted!",
      body:
        `${restaurantName} accepted your order. Preparing soon!`,
    },

    preparing: {
      title: "🍳 Being Prepared",
      body:
        `${restaurantName} is now preparing your order.`,
    },

    out_for_delivery: {
      title: "🛵 On the Way!",
      body:
        "Your order is out for delivery. Hang tight!",
    },

    delivered: {
      title: "📦 Delivered!",
      body:
        `Your order from ${restaurantName} has been delivered. Enjoy! ⭐ Leave a review!`,
    },

    cancelled: {
      title: "❌ Order Cancelled",
      body:
        `Your order from ${restaurantName} was cancelled.`,
    },
  };

  const msg = messages[status];

  if (!msg) return;

  try {
    await sendToToken(userFcmToken, {
      data: makeMessageData(msg.title, msg.body, {
        type: `ORDER_${status.toUpperCase()}`,
        orderId: orderId?.toString(),
        status: status?.toString(),
      }),
    });
  } catch (err) {
    console.error("FCM SEND FAILED:", err);
  }
}

export async function notifyOrderCancelled({ restaurantFcmToken, userFcmToken, orderId, restaurantName }) {
  await sendToToken(restaurantFcmToken, {
    data: makeMessageData("❌ Order Cancelled", "A customer has cancelled their order.", { type: "ORDER_CANCELLED", orderId: orderId?.toString() }),
  });
  await sendToToken(userFcmToken, {
    data: makeMessageData("❌ Order Cancelled", `Your order from ${restaurantName} has been cancelled.`, { type: "ORDER_CANCELLED", orderId: orderId?.toString() }),
  });
  await sendToTopic("admin_orders", {
    data: makeMessageData("❌ Order Cancelled", `Order at ${restaurantName} was cancelled.`, { type: "ORDER_CANCELLED", orderId: orderId?.toString() }),
  });
}

export async function notifyRefundIssued({ userFcmToken, amount, orderId }) {
  await sendToToken(userFcmToken, {
    data: makeMessageData("💰 Refund Issued", `₹${amount} has been refunded to your account.`, { type: "REFUND", orderId: orderId?.toString(), amount: String(amount) }),
  });
}

// ── Support ticket notifications ─────────────────────────

export async function notifyNewTicket({ ticketId, ticketNo, category, userName }) {
  await sendToTopic("admin_support", {
    data: makeMessageData("🎫 New Support Ticket", `${userName} raised a ${category.replace(/_/g, " ")} ticket — ${ticketNo}`, { type: "TICKET_NEW", ticketId }),
  });
}

export async function notifyTicketUrgent({ ticketId, ticketNo, category }) {
  await sendToTopic("admin_support", {
    data: makeMessageData("🚨 Urgent Ticket!", `High priority: ${category.replace(/_/g, " ")} — ${ticketNo}`, { type: "TICKET_URGENT", ticketId }),
  });
}

export async function notifyTicketStatusChanged({ userFcmToken, status, ticketNo,ticketId  }) {
  const messages = {
    active:   { title: "💬 Agent Joined",      body: `Support staff joined your ticket ${ticketNo}` },
    resolved: { title: "✅ Ticket Resolved",   body: `Your support ticket ${ticketNo} has been resolved.` },
    pending:  { title: "⏳ Ticket Pending",     body: `Your ticket ${ticketNo} is pending. We'll be back soon.` },
  };
  const msg = messages[status];
  if (!msg) return;
  await sendToToken(userFcmToken, {
    data: makeMessageData(msg.title, msg.body, { type: "TICKET_STATUS", ticketNo, ticketId: ticketId?.toString(), status }),
  });
}
