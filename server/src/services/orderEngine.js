import Order from "../models/Order.js";

const STATUS_FLOW = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered"
};

export const runOrderEngine = async () => {
  try {
    const now = new Date();

    // 🔴 1. Handle timeout (placed → cancelled)
    await Order.updateMany(
      {
        status: "placed",
        timeout_at: { $lt: now }
      },
      {
        $set: { status: "cancelled" }
      }
    );

    // 🟡 2. Handle normal transitions
    const orders = await Order.find({
      status: { $in: Object.keys(STATUS_FLOW) }
    });

    for (const order of orders) {
      const currentStatus = order.status;

      // skip cancelled/delivered
      if (!STATUS_FLOW[currentStatus]) continue;

      const lastUpdate = order.updatedAt;
      const diff = (now - lastUpdate) / 1; // seconds

      let requiredTime = 10; // default seconds per stage

      // ⏱️ customize timings
      if (currentStatus === "accepted") requiredTime = 5;
      if (currentStatus === "preparing") requiredTime = 5;
      if (currentStatus === "out_for_delivery") requiredTime = 5;

      if (diff >= requiredTime) {
        order.status = STATUS_FLOW[currentStatus];
        await order.save();
      }
    }
  } catch (err) {
    console.error("ORDER ENGINE ERROR:", err.message);
  }
};