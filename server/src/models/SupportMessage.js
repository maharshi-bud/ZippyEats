// ============================================================
// FILE: server/src/models/SupportMessage.js
// ============================================================

import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
      index: true,
    },

    senderType: {
      type: String,
      enum: ["user", "admin", "system"],
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    message: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SupportMessage", supportMessageSchema);