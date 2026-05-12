// server/src/controllers/authController.js — patch for restaurant role
// Change the generateToken function to include restaurant_id:

const generateToken = (userId, role, restaurantId = null) => {
  return jwt.sign(
    { id: userId, role, restaurant_id: restaurantId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }   // ← also bump this from 30m to 7d while you're here
  );
};

// Then in the login handler, pass restaurant_id:
//
//   const token = generateToken(user._id, user.role, user.restaurant_id || null);
//
// And in authMiddleware.js, attach it to req.user:
//
//   req.user = {
//     id: decoded.id,
//     role: decoded.role,
//     restaurant_id: decoded.restaurant_id || null,
//   };

// Utility script to create a restaurant owner account:
// server/src/utils/createRestaurantOwner.js

import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const owner = {
  name: "Restaurant Owner",
  email: "owner@r1.com",
  password: "owner123",
  role: "restaurant",
  restaurant_id: "r1",   // ← match the _id in your Restaurant collection
};

const createOwner = async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL);
  const hashed = await bcrypt.hash(owner.password, 10);
  await User.updateOne(
    { email: owner.email },
    { $set: { ...owner, password: hashed } },
    { upsert: true }
  );
  console.log(`Restaurant owner ready: ${owner.email} / ${owner.password} → restaurant ${owner.restaurant_id}`);
  await mongoose.disconnect();
};

createOwner().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
