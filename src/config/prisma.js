import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.ts";
import { env } from "./env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve the sqlite file relative to the project root so the app works
// no matter which directory it is started from. (The Prisma CLI resolves
// datasource URLs relative to prisma.config.ts, i.e. the project root.)
const dbFile = env.DATABASE_URL.replace(/^file:/, "");
const dbPath = path.isAbsolute(dbFile)
  ? dbFile
  : path.resolve(__dirname, "../..", dbFile);

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
