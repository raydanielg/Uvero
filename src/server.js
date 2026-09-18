import http from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { initSocket } from "./realtime/socket.js";

const httpServer = http.createServer(app);
initSocket(httpServer);

const server = httpServer.listen(env.PORT, () => {
  console.log("");
  console.log("  ██╗   ██╗██╗   ██╗███████╗██████╗  ██████╗ ");
  console.log("  ██║   ██║██║   ██║██╔════╝██╔══██╗██╔═══██╗");
  console.log("  ██║   ██║██║   ██║█████╗  ██████╔╝██║   ██║");
  console.log("  ██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗██║   ██║");
  console.log("  ╚██████╔╝ ╚████╔╝ ███████╗██║  ██║╚██████╔╝");
  console.log("   ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝ ╚═════╝ ");
  console.log("");
  console.log(`  API:      http://localhost:${env.PORT}/api/v1`);
  console.log(`  Docs:     http://localhost:${env.PORT}/api/docs`);
  console.log(`  Env:      ${env.NODE_ENV}`);
  console.log("");
});

async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
