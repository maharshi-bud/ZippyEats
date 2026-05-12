import Order from "../models/Order.js";
import { getIO } from "../lib/socket.js";



// ================= STATUS FLOW =================

const STATUS_FLOW = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered",
};



// ================= STATUS DURATIONS =================
// ⏱️ Time spent in each status

const STATUS_DURATIONS = {
  placed: 10 * 60 * 1000,            // 10 min → auto cancel if ignored
  accepted: 60 * 60 * 1000,          // 1 hour
  preparing: 60 * 60 * 1000,         // 1 hour
  out_for_delivery: 60 * 60 * 1000,  // 1 hour
};



// ================= ACTIVE TIMERS =================
// orderId => timeoutId

const activeTimers = new Map();



// ================= EMIT ORDER UPDATE =================

const emitOrderUpdate = (order) => {
  const io = getIO();

  const payload = {
    orderId: order._id,
    status: order.status,
    updatedAt: order.updatedAt,
    restaurantId: order.restaurant_id,
    userId: order.user_id,
  };

  // 👤 Notify user
  io.to(`user:${order.user_id}`).emit(
    "orderStatusUpdate",
    payload
  );

  // 🍔 Notify restaurant
  io.to(`restaurant:${order.restaurant_id}`).emit(
    "orderStatusUpdate",
    payload
  );

  // 👨‍💼 Notify admins
  io.to("admin").emit(
    "orderStatusUpdate",
    payload
  );

  console.log(
    `📡 Emitted update for order ${order._id} → ${order.status}`
  );
};



// ================= SCHEDULE NEXT TRANSITION =================

export const scheduleNextTransition = (order) => {

  // 🔥 Clear old timer if exists
  if (activeTimers.has(order._id.toString())) {
    clearTimeout(activeTimers.get(order._id.toString()));
    activeTimers.delete(order._id.toString());
  }

  const currentStatus = order.status;

  // ❌ Stop if terminal state
  if (
    !STATUS_FLOW[currentStatus] &&
    currentStatus !== "placed"
  ) {
    return;
  }

  const duration = STATUS_DURATIONS[currentStatus];

  if (!duration) return;

  // ⏱️ Create timer
  const timer = setTimeout(async () => {

    try {

      // 🔥 ALWAYS fetch fresh DB state
      const fresh = await Order.findById(order._id);

      if (!fresh) return;

      // ================= AUTO STATUS LOGIC =================

      // ❌ Auto cancel if restaurant ignored order
      if (fresh.status === "placed") {

        fresh.status = "cancelled";

      }

      // ✅ Normal transition
      else if (STATUS_FLOW[fresh.status]) {

        fresh.status = STATUS_FLOW[fresh.status];

      }

      // ❌ Invalid state
      else {

        return;

      }

      // 🔥 IMPORTANT
      // Bypass validation because this is system automation
      fresh._updatedByAdmin = true;

      // 💾 Save
      await fresh.save();

      // 📡 Emit realtime update
      emitOrderUpdate(fresh);

      // 🧹 Remove finished timer
      activeTimers.delete(order._id.toString());

      // 🔁 Schedule next stage
      scheduleNextTransition(fresh);

    } catch (err) {

      console.error(
        "⚠️ Scheduler error:",
        err
      );

    } finally {

      // Cleanup safety
      if (
        activeTimers.get(order._id.toString()) === timer
      ) {
        activeTimers.delete(order._id.toString());
      }

    }

  }, duration);

  // 💾 Store timer
  activeTimers.set(
    order._id.toString(),
    timer
  );

  console.log(
    `⏰ Scheduled ${order._id} (${currentStatus}) in ${duration}ms`
  );
};



// ================= MANUAL STATUS UPDATE =================

export const updateOrderStatus = async (
  orderId,
  newStatus,
  updatedBy = "restaurant" // 🔥 admin | restaurant | system
) => {

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  // 🔥 Update status
  order.status = newStatus;

  // ================= ADMIN OVERRIDE =================
  // Admin can skip any stage

  if (updatedBy === "admin") {
    order._updatedByAdmin = true;
  }

  // 💾 Save
  await order.save();

  // 📡 Emit realtime update
  emitOrderUpdate(order);

  // ================= CANCEL OLD TIMER =================

  if (activeTimers.has(orderId.toString())) {

    clearTimeout(
      activeTimers.get(orderId.toString())
    );

    activeTimers.delete(orderId.toString());

  }

  // ================= SCHEDULE NEXT =================

  scheduleNextTransition(order);

  return order;
};



// ================= NEW ORDER EVENT =================

export const emitNewOrder = (order) => {

  const io = getIO();

  // 🍔 Restaurant
  io.to(`restaurant:${order.restaurant_id}`).emit(
    "newOrder",
    order
  );

  // 👨‍💼 Admin
  io.to("admin").emit(
    "newOrder",
    order
  );

  console.log(
    `📡 Emitted new order ${order._id}`
  );
};



// ================= RELOAD ACTIVE ORDERS =================
// Used after server restart

export const reloadActiveOrders = async () => {

  const activeOrders = await Order.find({
    status: {
      $in: Object.keys(STATUS_FLOW),
    },
  });

  console.log(
    `🔄 Reloading ${activeOrders.length} active orders into scheduler`
  );
  for (const order of activeOrders) {
    scheduleNextTransition(order);
  }
};