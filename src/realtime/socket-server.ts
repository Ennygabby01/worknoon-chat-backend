import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { registerSocketHandlers } from "./socket-handlers.js";
import { authenticateSocket, type AuthenticatedSocket } from "./socket-auth.js";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.use((socket, next) => {
    void authenticateSocket(socket, next);
  });

  io.on("connection", (socket) => {
    registerSocketHandlers(io, socket as AuthenticatedSocket);
  });

  return io;
}
