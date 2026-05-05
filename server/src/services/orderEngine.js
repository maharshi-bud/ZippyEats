import Order from "../models/Order.js";

const STATUS_FLOW = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered"
};

// ⏱️ 1 hour in ms
const ONE_HOUR = 60 * 60 * 1000;

export const runOrderEngine = async () => {
  try {
    const now = new Date();

    // 🔴 1. Timeout (keep small like 5–10 mins)
    await Order.updateMany(
      {
        status: "placed",
        timeout_at: { $lt: now }
      },
      {
        $set: { status: "cancelled" }
      }
    );

    // 🟡 2. Lifecycle transitions
    const orders = await Order.find({
      status: { $in: Object.keys(STATUS_FLOW) }
    });

    for (const order of orders) {
      const currentStatus = order.status;

      if (!STATUS_FLOW[currentStatus]) continue;

      const lastUpdate = order.updatedAt;

      // ✅ diff in milliseconds
      const diff = now - lastUpdate;

      let requiredTime = ONE_HOUR; // default 1 hour

      // ⏱️ optional fine-tuning
      if (currentStatus === "placed") requiredTime = 10 * 60 * 100; // 10 min to accept
      if (currentStatus === "accepted") requiredTime = ONE_HOUR;
      if (currentStatus === "preparing") requiredTime = ONE_HOUR;
      if (currentStatus === "out_for_delivery") requiredTime = ONE_HOUR;

      if (diff >= requiredTime) {
        order.status = STATUS_FLOW[currentStatus];
        await order.save();
      }
    }
  } catch (err) {
    console.error("ORDER ENGINE ERROR:", err.message);
  }
};