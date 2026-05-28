import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import menuRoutes from "./routes/menuRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import Role from "./models/Role.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// import testRoutes from "./routes/testRoutes.js";
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
import bannerRoutes from "./routes/bannerRoutes.js";
import aiRoutes from "./modules/ai/ai.routes.js"; // ← ADD THIS LINE
// import {createRestaurantOwners} from "./utils/createRestaurantOwner.js"
  import SupportRoutes from "./routes/Supportroutes.js";
  import SupportTicket from "./models/SupportTicket.js";
  import SupportMessage from "./models/SupportMessage.js";
  import { initFirebase } from "./services/fcmService.js";
  import fcmRoutes from "./routes/fcmRoutes.js";
import rolesRoutes from "./routes/admin/rolesRoutes.js";
import Module from "./models/module.js";
import modulesRoutes from "./routes/admin/Modulesroutes.js";









const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

// app.use(cors());
// import cors from "cors";

// app.use(
//   cors({
//     origin: [
//       "http://localhost:3000",
//       "http://localhost:3010",
//     ],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:3010",
  "http://localhost:3000",
  "http://127.0.0.1:3010",
  "http://127.0.0.1:3000",
  ...configuredOrigins,
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const isLocalDevOrigin =
      process.env.NODE_ENV !== "production" &&
      /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

    if (allowedOrigins.has(origin) || isLocalDevOrigin) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// app.use(express.json());


app.use(express.json());
app.use("/api", orderRoutes);
// app.use("/api/test", testRoutes);
// app.use("/api/admin/stats", protect, adminOnly, adminStatsRoutes);
app.use("/api/admin/stats", protect, adminStatsRoutes);
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
app.use("/api", bannerRoutes);
app.use("/api/ai", aiRoutes); // ← ADD THIS LINE
// app.use("/api/restaurant-owner",  restaurantOwnerRoutes);

  app.use("/api/support", supportRoutes);
  app.use("/api/fcm", fcmRoutes);
app.use("/api/admin", rolesRoutes);
app.use("/api/admin", modulesRoutes);
app.use(errorHandler);
app.use("/api/restaurant-owner", restaurantOwnerRoutes);


const PORT = process.env.PORT || 5010;

const startServer = async () => {
  await connectDB();
  

  await Promise.all([
    User.init(),
    Restaurant.init(),
    MenuItem.init(),
    Order.init(),
    SupportTicket.init(),  
    SupportMessage.init(),
  ]);
await Role.seedDefaults();

await Module.seedDefaults().catch(e => console.error("[Module] seedDefaults failed:", e));
await Module.syncToRoles().catch(e => console.error("[Module] syncToRoles failed:", e));


  await reloadActiveOrders();
  initFirebase();
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 ZippyEats + Socket.IO running on ${PORT}`);
  });
  await syncRestaurantCuisines();
  // await syncMenuImages();

  // await createRestaurantOwners();
};

startServer();
