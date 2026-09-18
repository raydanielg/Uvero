import { isProd } from "../../config/env.js";
import * as authService from "./auth.service.js";

const REFRESH_COOKIE = "refreshToken";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProd,
  path: "/api/v1/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export async function requestOtp(req, res) {
  const result = await authService.requestOtp(req.body.phone);
  res.status(200).json({ success: true, data: result });
}

export async function verifyOtp(req, res) {
  const result = await authService.verifyOtp(req.body);
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
  res.status(200).json({ success: true, data: result });
}

export async function refresh(req, res) {
  const token = req.body.refreshToken || req.cookies?.[REFRESH_COOKIE];
  const result = await authService.refreshSession(token);
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
  res.status(200).json({ success: true, data: result });
}

export async function logout(req, res) {
  const token = req.body.refreshToken || req.cookies?.[REFRESH_COOKIE];
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
  res.status(200).json({ success: true, message: "Logged out" });
}

export async function me(req, res) {
  res.status(200).json({ success: true, data: { user: req.user } });
}
