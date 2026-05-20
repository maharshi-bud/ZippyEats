// server/src/models/User.js — updated role enum + restaurant_id field
// Replace the role field and add restaurant_id below the addresses field:

// role: {
//   type: String,
//   enum: ["user", "admin", "restaurant"],   // ← add "restaurant"
//   default: "user",
// },
//
// // For restaurant owners — the ID of their restaurant (e.g. "r1")
// restaurant_id: {
//   type: String,
//   default: null,
//   index: true,
// },

// Full updated User.js:

import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    address_line: { type: String, required: true },
    city: { type: String, default: "Ahmedabad" },
    state: { type: String, default: "Gujarat" },
    pincode: { type: String, default: "" },
    country: { type: String, default: "India" },
    is_default: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["user", "admin", "restaurant"],
      default: "user",
    },
    restaurant_id: {
      type: String,
      default: null,
      index: true,
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
    fcmToken: {
    type: String,
    default: null,
  },
  zipCoins: {
  type: Number,
  default: 0,
  min: 0,
},profilePic: {
  data: Buffer,
  contentType: String,
},
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
