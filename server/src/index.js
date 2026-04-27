import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import testRoutes from "./routes/testRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import User from "./models/User.js";
import Restaurant from "./models/Restaurant.js";
import MenuItem from "./models/MenuItem.js";
import Order from "./models/Order.js";
import authRoutes from "./routes/authRoutes.js"
import restaurantRoutes from "./routes/restaurantRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/test", testRoutes);

app.get("/api/health", (req, res) => {
  res.json({ success: true, app: "ZippyEats" });
});
app.use("/api/auth", authRoutes);

app.use ("/api", restaurantRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5010;

const startServer = async () => {
  await connectDB();


    await Promise.all([
    User.init(),
    Restaurant.init(),
    MenuItem.init(),
    Order.init()
  ]);

  app.listen(PORT, () => {
    console.log(`🚀 ZippyEats running on ${PORT}`);
  });
};

startServer();