import { Router } from "express";
import crypto from "node:crypto";
import { env, isProd, storeOtpPlaintext } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { renderMonitorPage } from "./otp-monitor.page.js";
import { recallOtp } from "./otp-store.js";

export const otpMonitorRouter = Router();

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

// Open in development; in production it's off unless OTP_MONITOR_KEY is set,
// and then every request must present that key.
function guard(req, _res, next) {
  if (!env.OTP_MONITOR_KEY) {
    return isProd ? next(ApiError.notFound()) : next();
  }
  const provided = req.query.key || req.headers["x-monitor-key"];
  if (!provided || !safeEqual(provided, env.OTP_MONITOR_KEY)) {
    return next(ApiError.unauthorized("Invalid monitor key"));
  }
  next();
}

otpMonitorRouter.use(guard);

otpMonitorRouter.get("/", (_req, res) => {
  res.set(
    "Content-Security-Policy",
    "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'",
  );
  res.type("html").send(renderMonitorPage({ storesPlaintext: storeOtpPlaintext, ttlMinutes: env.OTP_TTL_MINUTES }));
});

otpMonitorRouter.get("/data", async (req, res) => {
  const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
  const search = String(req.query.search || "").trim();
  const now = new Date();

  const where = search ? { phone: { contains: search } } : {};
  const [rows, total, used, active] = await Promise.all([
    prisma.otpCode.findMany({ where, orderBy: { createdAt: "desc" }, take: limit }),
    prisma.otpCode.count(),
    prisma.otpCode.count({ where: { consumedAt: { not: null } } }),
    prisma.otpCode.count({ where: { consumedAt: null, expiresAt: { gt: now } } }),
  ]);

  const items = rows.map((o) => ({
    id: o.id,
    phone: o.phone,
    code: recallOtp(o.id),
    purpose: o.purpose,
    attempts: o.attempts,
    createdAt: o.createdAt,
    expiresAt: o.expiresAt,
    consumedAt: o.consumedAt,
    status: o.consumedAt ? "USED" : o.expiresAt > now ? "ACTIVE" : "EXPIRED",
  }));

  res.set("Cache-Control", "no-store");
  res.json({
    success: true,
    data: items,
    stats: { total, used, active, expired: total - used - active },
    serverTime: now,
  });
});
