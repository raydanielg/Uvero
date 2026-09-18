import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const handler = (_req, res) =>
  res.status(429).json({
    success: false,
    message: "Too many requests, please try again later",
  });

// Global API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler,
});

// OTP requests are expensive (SMS) — keep them tight.
export const otpRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}:${req.body?.phone ?? ""}`,
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      message: "Too many OTP requests for this number. Try again in an hour.",
    }),
});

// Verification attempts — protects against OTP brute force.
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler,
});
