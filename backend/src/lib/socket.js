import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { env } from "../config/env.js";
import logger from "../config/logger.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.clientUrl,
    credentials: true,
  },
});

// One user can be connected from multiple browser tabs or devices.
const userSockets = new Map();

const getOnlineUserIds = () => [...userSockets.keys()];

const getCookie = (cookieHeader, name) => {
  if (!cookieHeader) return null;

  for (const item of cookieHeader.split(";")) {
    const [cookieName, ...valueParts] = item.trim().split("=");
    if (cookieName === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
};

io.use(async (socket, next) => {
  try {
    const token = getCookie(socket.request.headers.cookie, "jwt");
    if (!token) return next(new Error("Unauthorized"));

    const decoded = jwt.verify(token, env.jwtSecret);
    const userExists = await User.exists({ _id: decoded.userId });
    if (!userExists) return next(new Error("Unauthorized"));

    socket.data.userId = String(decoded.userId);
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;

  logger.info({ userId, socketId: socket.id }, "socket connected");

  socket.join(userId);

  const sockets = userSockets.get(userId) || new Set();
  sockets.add(socket.id);
  userSockets.set(userId, sockets);

  io.emit("getOnlineUsers", getOnlineUserIds());

  socket.on("typing", ({ receiverId, isTyping }) => {
    if (!receiverId) return;

    socket.to(String(receiverId)).emit("typing", {
      senderId: userId,
      isTyping: Boolean(isTyping),
    });
  });

  socket.on("disconnect", () => {
    logger.info({ userId, socketId: socket.id }, "socket disconnected");

    const remainingSockets = userSockets.get(userId);
    remainingSockets?.delete(socket.id);

    if (!remainingSockets?.size) {
      userSockets.delete(userId);
    }

    io.emit("getOnlineUsers", getOnlineUserIds());
  });
});

export { io, app, server };
