import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menu_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    items: {
      type: [orderItemSchema],
      validate: [(val) => val.length > 0, "Order must have items"]
    },
    status: {
      type: String,
      enum: [
        "placed",
        "accepted",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled"
      ],
      default: "placed",
      index: true
    },
    total_amount: {
      type: Number,
      required: true,
      min: 0
    },
    eta: {
      type: Date,
      required: true
    },
    timeout_at: {
      type: Date,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);



// ✅ FIXED STATUS VALIDATION HOOK
orderSchema.pre("save", async function () {
  if (this.isNew) return;

  const validFlow = {
    placed: ["accepted", "cancelled"],
    accepted: ["preparing"],
    preparing: ["out_for_delivery"],
    out_for_delivery: ["delivered"]
  };

  // 🔥 Get previous state from DB
  const prevDoc = await this.constructor.findById(this._id);

  if (!prevDoc) return;

  const prev = prevDoc.status;
  const next = this.status;

  // skip if same
  if (prev === next) return;

  // ❌ invalid transition
  if (validFlow[prev] && !validFlow[prev].includes(next)) {
    throw new Error("Invalid status transition");
  }
});

export default mongoose.model("Order", orderSchema);