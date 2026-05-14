import { Server } from "socket.io";
  import { initSupportSocket } from "../socket/supportSocket.js";

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      // origin: "*", // 🔒 lock down in production
      origin: ["http://localhost:3000", "http://localhost:3010"],

      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // Client joins a personal room (user / restaurant / admin)
    socket.on("join", ({ userId, restaurantId, role }) => {
      if (userId) socket.join(`user:${userId}`);
      if (restaurantId) socket.join(`restaurant:${restaurantId}`);
      if (role === "admin") socket.join("admin");
      console.log(`👤 Joined rooms`, { userId, restaurantId, role });
    });
      initSupportSocket(io);

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  return io;
};



export const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};