import { Server } from "socket.io";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { setIo } from "./broadcaster.js";

// Every connected socket auto-joins its own `user:<id>` room (used for
// notifications) and can additionally join a job or conversation room it's
// a participant of, verified against the database before the join succeeds
// — nobody can subscribe to another user's job just by guessing its id.
export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","), credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Missing auth token"));
      socket.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.sub}`);

    socket.on("join:job", async (jobId) => {
      const job = await prisma.job.findUnique({ where: { id: jobId }, include: { provider: true } });
      if (!job) return;
      if (job.customerId === socket.user.sub || job.provider.userId === socket.user.sub) {
        socket.join(`job:${jobId}`);
      }
    });

    socket.on("join:conversation", async (conversationId) => {
      const member = await prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId: socket.user.sub } },
      });
      if (member) socket.join(`conversation:${conversationId}`);
    });
  });

  setIo(io);
  return io;
}
