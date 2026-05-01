import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const admin = {
  name: "Admin",
  email: "admin@example.com",
  password: "admin123",
  role: "admin",
};

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URL);

  const hashedPassword = await bcrypt.hash(admin.password, 10);

  await User.updateOne(
    { email: admin.email },
    {
      $set: {
        name: admin.name,
        email: admin.email,
        password: hashedPassword,
        role: admin.role,
      },
    },
    { upsert: true }
  );

  console.log(`Admin ready: ${admin.email} / ${admin.password}`);
  await mongoose.disconnect();
};

createAdmin().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
