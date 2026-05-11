"use client";

import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:5010", {
      transports: ["websocket"],
    });
  }

  return socket;
};
