// ============================================================
// FILE: server/src/models/SupportTicket.js
// ============================================================

import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: [
        "payment_issue",
        "missing_items",
        "wrong_order",
        "order_not_received",
        "refund_issue",
        "delivery_issue",
        "other",
      ],
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["open", "pending", "active", "resolved"],
      default: "open",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolutionSummary: {
      type: String,
      default: null,
    },

    resolutionType: {
      type: String,
      enum: [
        "refund_issued",
        "clarified_issue",
        "reordered_item",
        "delivery_completed",
        "other",
        null,
      ],
      default: null,
    },

    internalNotes: [
      {
        note: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    actionLog: [
      {
        action: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        performedAt: { type: Date, default: Date.now },
        meta: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],

    refundAmount: {
      type: Number,
      default: 0,
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    unreadUser: {
      type: Number,
      default: 0,
    },

    unreadAdmin: {
      type: Number,
      default: 0,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-generate ticketId before save
supportTicketSchema.pre("save", async function () {
  if (this.isNew && !this.ticketId) {
    const count = await mongoose.model("SupportTicket").countDocuments();
    this.ticketId = `TKT-${String(count + 1).padStart(5, "0")}`;
  }
});

// Auto-detect priority based on category
supportTicketSchema.pre("save", function () {
  if (this.isNew) {
    const highPriority = ["payment_issue", "refund_issue", "order_not_received"];
    const urgentPriority = ["wrong_order", "missing_items"];
    if (urgentPriority.includes(this.category)) this.priority = "urgent";
    else if (highPriority.includes(this.category)) this.priority = "high";
    else this.priority = "medium";
  }
});

export default mongoose.model("SupportTicket", supportTicketSchema);