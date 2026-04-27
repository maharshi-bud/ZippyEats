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



orderSchema.pre("save", function (next) {
  const validFlow = {
    placed: ["accepted", "cancelled"],
    accepted: ["preparing"],
    preparing: ["out_for_delivery"],
    out_for_delivery: ["delivered"]
  };

  if (!this.isNew) {
    const prev = this.get("status");
    const nextStatus = this.status;

    if (validFlow[prev] && !validFlow[prev].includes(nextStatus)) {
      return next(new Error("Invalid status transition"));
    }
  }

  next();
});

export default mongoose.model("Order", orderSchema);