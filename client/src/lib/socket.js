"use client";

import { io } from "socket.io-client";

let socket = null;
const SERVER = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5010";

export const getSocket = () => {
  if (!socket) {
    socket = io(SERVER, {
      transports: ["websocket"],
    });
  }

  return socket;
};
