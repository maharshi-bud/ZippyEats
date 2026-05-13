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
import searchRoutes from "./routes/searchRoutes.js";
import adminStatsRoutes from "./routes/admin/statsRoutes.js";
import { reloadActiveOrders } from "./services/orderEngine.js";
import { syncRestaurantCuisines } from "./utils/syncCuisines.js";
import { syncMenuImages } from "./utils/syncImages.js";
import userRoutes from "./routes/userRoutes.js";
import { protect } from "./middleware/authMiddleware.js";
import { adminOnly } from "./middleware/adminMiddleware.js";
import adminOrderRoutes from "./routes/admin/orderRoutes.js";
dotenv.config();
import http from "http";
import { initSocket } from "./lib/socket.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import restaurantOwnerRoutes from "./routes/restaurantOwnerRoutes.js";
import aiRoutes from "./modules/ai/ai.routes.js"; // ← ADD THIS LINE
// import {createRestaurantOwners} from "./utils/createRestaurantOwner.js"



const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

// app.use(cors());
// import cors from "cors";

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3010",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// app.use(express.json());


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
app.use("/api/search",searchRoutes );
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/images", express.static(path.join(__dirname, "../../food_images")));
app.use("/api/reviews", reviewRoutes);
app.use("/api/ai", aiRoutes); // ← ADD THIS LINE
// app.use("/api/restaurant-owner",  restaurantOwnerRoutes);


app.use(errorHandler);
app.use("/api/restaurant-owner", restaurantOwnerRoutes);


const PORT = process.env.PORT || 5010;

const startServer = async () => {
  await connectDB();
  
  
  await Promise.all([
    User.init(),
    Restaurant.init(),
    MenuItem.init(),
    Order.init()
    
  ]);
  
  await reloadActiveOrders();
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 ZippyEats + Socket.IO running on ${PORT}`);
  });
  await syncRestaurantCuisines();
  // await syncMenuImages();

  // await createRestaurantOwners();
};

startServer();
