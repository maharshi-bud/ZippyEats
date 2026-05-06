import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import menuRoutes from "./routes/menuRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import testRoutes from "./routes/testRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import User from "./models/User.js";
import Restaurant from "./models/Restaurant.js";
import MenuItem from "./models/MenuItem.js";
import Order from "./models/Order.js";
import authRoutes from "./routes/authRoutes.js"
import restaurantRoutes from "./routes/restaurantRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminStatsRoutes from "./routes/admin/statsRoutes.js";
import { runOrderEngine } from "./services/orderEngine.js";
import { syncRestaurantCuisines } from "./utils/syncCuisines.js";
import { syncMenuImages } from "./utils/syncImages.js";
import userRoutes from "./routes/userRoutes.js";
import { protect } from "./middleware/authMiddleware.js";
import { adminOnly } from "./middleware/adminMiddleware.js";

dotenv.config();
const app = express();



app.use(cors());
app.use(express.json());
app.use("/api", orderRoutes);
app.use("/api/test", testRoutes);
app.use("/api/admin/stats", protect, adminOnly, adminStatsRoutes);

app.get("/api/health", (req, res) => {
  res.json({ success: true, app: "ZippyEats" });
});
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use ("/api", restaurantRoutes);
app.use("/api/users", userRoutes);

app.use("/images", express.static(path.join(__dirname, "../../food_images")));

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
  
  setInterval(runOrderEngine, 5); // every 5 sec
  
  app.listen(PORT, () => {
    console.log(`🚀 ZippyEats running on ${PORT}`);
  });
  await syncRestaurantCuisines();
  // await syncMenuImages();
};

startServer();
