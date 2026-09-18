import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

export function generateOtp() {
  const max = 10 ** env.OTP_LENGTH;
  return crypto.randomInt(0, max).toString().padStart(env.OTP_LENGTH, "0");
}

export function hashOtp(code) {
  return bcrypt.hash(code, 10);
}

export function compareOtp(code, hash) {
  return bcrypt.compare(code, hash);
}

export function otpExpiry() {
  return new Date(Date.now() + env.OTP_TTL_MINUTES * 60_000);
}
