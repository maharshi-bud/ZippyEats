import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menu_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: null,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    veg: {
      type: Boolean,
      default: true,
    },},
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // 🔹 USER
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 🔹 RESTAURANT
    restaurant_id: {
      type: String,
      required: true,
      index: true,
    },

    restaurant_name: {
      type: String,
      required: true,
    },
    
    coins_used: { type: Number, default: 0, min: 0 },
coins_discount: { type: Number, default: 0, min: 0 },
  

    // 🔹 ITEMS
    items: {
      type: [orderItemSchema],
      validate: [
        (val) => val.length > 0,
        "Order must contain at least one item",
      ],
    },

    // 🔹 STATUS
    status: {
      type: String,
      enum: [
        "placed",
        "accepted",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "placed",
      index: true,
    },

    // 🔹 PAYMENT
    payment_method: {
      type: String,
      enum: ["cod", "upi", "card"],
      default: "cod",
    },

    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    // 🔹 PRICE
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    delivery_fee: {
      type: Number,
      default: 40,
      min: 0,
    },

    tax_amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    total_amount: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    // 🔹 DELIVERY ADDRESS
    delivery_address: {
      full_name: {
        type: String,
        required: true,
      },

      phone: {
        type: String,
        required: true,
      },

      address_line: {
        type: String,
        required: true,
      },

      city: {
        type: String,
        default: "Ahmedabad",
      },

      state: {
        type: String,
        default: "Gujarat",
      },

      country: {
        type: String,
        default: "India",
      },

      pincode: {
        type: String,
      },
    },

    // 🔹 EXTRA
    instructions: {
      type: String,
      default: "",
    },

    cancellation_reason: {
      type: String,
      default: null,
    },

    // 🔹 ETA
    eta: {
      type: Date,
      required: true,
    },

    timeout_at: {
      type: Date,
      required: true,
      index: true,
    },

    // 🔹 TRACKING
    delivered_at: {
      type: Date,
      default: null,
    },

    accepted_at: {
      type: Date,
      default: null,
    },

    preparing_at: {
      type: Date,
      default: null,
    },

    out_for_delivery_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);



// ================= STATUS VALIDATION =================

orderSchema.pre("save", async function () {

  // ✅ Allow admin/system override
  if (this._updatedByAdmin) {

    // 🔥 Still apply timestamps
    if (this.status === "accepted") {
      this.accepted_at = new Date();
    }

    if (this.status === "preparing") {
      this.preparing_at = new Date();
    }

    if (this.status === "out_for_delivery") {
      this.out_for_delivery_at = new Date();
    }

    if (this.status === "delivered") {
      this.delivered_at = new Date();
      this.payment_status = "paid";
    }

    return;
  }

  // ✅ Skip validation for new orders
  if (this.isNew) return;

  // ================= VALID FLOW =================

  const validFlow = {
    placed: ["accepted", "cancelled"],
    accepted: ["preparing"],
    preparing: ["out_for_delivery"],
    out_for_delivery: ["delivered"],
  };

  // 🔥 Get previous DB state
  const prevDoc = await this.constructor.findById(this._id);

  if (!prevDoc) return;

  const prev = prevDoc.status;
  const next = this.status;

  // ✅ Same status
  if (prev === next) return;

  // ❌ Invalid transition
  if (
    validFlow[prev] &&
    !validFlow[prev].includes(next)
  ) {
    throw new Error("Invalid status transition");
  }

  // ================= AUTO TIMESTAMPS =================

  if (next === "accepted") {
    this.accepted_at = new Date();
  }

  if (next === "preparing") {
    this.preparing_at = new Date();
  }

  if (next === "out_for_delivery") {
    this.out_for_delivery_at = new Date();
  }

  if (next === "delivered") {
    this.delivered_at = new Date();
    this.payment_status = "paid";
  }

});

export default mongoose.model("Order", orderSchema);