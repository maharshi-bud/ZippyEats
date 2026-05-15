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
  if (!token) return;
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    });
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
  try {
    await admin.messaging().send({
      topic,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    });
  } catch (err) {
    console.error(`[FCM] sendToTopic(${topic}) failed:`, err.message);
  }
}

// ============================================================
// NOTIFICATION HELPERS — call these from controllers
// ============================================================

// ── Order notifications ──────────────────────────────────

export async function notifyOrderCreated({ restaurantFcmToken, restaurantName, orderId, itemCount, total }) {
  // To restaurant
  await sendToToken(restaurantFcmToken, {
    title: "🛎️ New Order!",
    body: `You have a new order — ${itemCount} items for ₹${total}`,
    data: { type: "ORDER_NEW", orderId },
  });
  // To admin topic
  await sendToTopic("admin_orders", {
    title: "📦 New Order Placed",
    body: `New order at ${restaurantName} — ₹${total}`,
    data: { type: "ORDER_NEW", orderId },
  });
}

export async function notifyOrderStatusChanged({ userFcmToken, status, restaurantName, orderId }) {
  const messages = {
    accepted:         { title: "✅ Order Accepted!",          body: `${restaurantName} accepted your order. Preparing soon!` },
    preparing:        { title: "🍳 Being Prepared",           body: `${restaurantName} is now preparing your order.` },
    out_for_delivery: { title: "🛵 On the Way!",              body: "Your order is out for delivery. Hang tight!" },
    delivered:        { title: "📦 Delivered!",               body: `Your order from ${restaurantName} has been delivered. Enjoy! ⭐ Leave a review!` },
    cancelled:        { title: "❌ Order Cancelled",          body: `Your order from ${restaurantName} was cancelled.` },
  };

  const msg = messages[status];
  if (!msg) return;

  await sendToToken(userFcmToken, {
    ...msg,
    data: { type: "ORDER_STATUS", orderId, status },
  });
}

export async function notifyOrderCancelled({ restaurantFcmToken, userFcmToken, orderId, restaurantName }) {
  await sendToToken(restaurantFcmToken, {
    title: "❌ Order Cancelled",
    body: "A customer has cancelled their order.",
    data: { type: "ORDER_CANCELLED", orderId },
  });
  await sendToToken(userFcmToken, {
    title: "❌ Order Cancelled",
    body: `Your order from ${restaurantName} has been cancelled.`,
    data: { type: "ORDER_CANCELLED", orderId },
  });
  await sendToTopic("admin_orders", {
    title: "❌ Order Cancelled",
    body: `Order at ${restaurantName} was cancelled.`,
    data: { type: "ORDER_CANCELLED", orderId },
  });
}

export async function notifyRefundIssued({ userFcmToken, amount, orderId }) {
  await sendToToken(userFcmToken, {
    title: "💰 Refund Issued",
    body: `₹${amount} has been refunded to your account.`,
    data: { type: "REFUND", orderId, amount: String(amount) },
  });
}

// ── Support ticket notifications ─────────────────────────

export async function notifyNewTicket({ ticketId, ticketNo, category, userName }) {
  await sendToTopic("admin_support", {
    title: "🎫 New Support Ticket",
    body: `${userName} raised a ${category.replace(/_/g, " ")} ticket — ${ticketNo}`,
    data: { type: "TICKET_NEW", ticketId },
  });
}

export async function notifyTicketUrgent({ ticketId, ticketNo, category }) {
  await sendToTopic("admin_support", {
    title: "🚨 Urgent Ticket!",
    body: `High priority: ${category.replace(/_/g, " ")} — ${ticketNo}`,
    data: { type: "TICKET_URGENT", ticketId },
  });
}

export async function notifyTicketStatusChanged({ userFcmToken, status, ticketNo }) {
  const messages = {
    active:   { title: "💬 Agent Joined",      body: `Support staff joined your ticket ${ticketNo}` },
    resolved: { title: "✅ Ticket Resolved",   body: `Your support ticket ${ticketNo} has been resolved.` },
    pending:  { title: "⏳ Ticket Pending",     body: `Your ticket ${ticketNo} is pending. We'll be back soon.` },
  };
  const msg = messages[status];
  if (!msg) return;
  await sendToToken(userFcmToken, {
    ...msg,
    data: { type: "TICKET_STATUS", ticketNo, status },
  });
}
