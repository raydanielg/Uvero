import { prisma } from "../../config/prisma.js";
import { env, storeOtpPlaintext } from "../../config/env.js";
import { rememberOtp } from "../otp-monitor/otp-store.js";
import { ApiError } from "../../utils/ApiError.js";
import { normalizePhone } from "../../utils/phone.js";
import { compareOtp, generateOtp, hashOtp, otpExpiry } from "../../utils/otp.js";
import {
  expiryToMs,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import { sendOtpSms } from "../../services/sms.service.js";

const OTP_RESEND_COOLDOWN_MS = 60_000;
const OTP_MAX_ATTEMPTS = 5;
const PUBLIC_USER_SELECT = {
  id: true,
  phone: true,
  name: true,
  userType: true,
  isPhoneVerified: true,
  avatarUrl: true,
  createdAt: true,
};

export async function requestOtp(rawPhone) {
  const phone = normalizePhone(rawPhone);

  const recent = await prisma.otpCode.findFirst({
    where: {
      phone,
      createdAt: { gt: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) },
    },
  });
  if (recent) {
    throw ApiError.tooMany("Please wait 60 seconds before requesting a new code");
  }

  const code = generateOtp();
  const otp = await prisma.otpCode.create({
    data: { phone, codeHash: await hashOtp(code), expiresAt: otpExpiry() },
  });
  if (storeOtpPlaintext) rememberOtp(otp.id, code);
  await sendOtpSms(phone, code);

  return {
    phone,
    expiresIn: env.OTP_TTL_MINUTES * 60,
    // No SMS provider wired yet — expose the code outside production only.
    ...(env.NODE_ENV !== "production" ? { devCode: code } : {}),
  };
}

export async function verifyOtp({ phone: rawPhone, code, name, userType }) {
  const phone = normalizePhone(rawPhone);

  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.expiresAt < new Date()) {
    throw ApiError.unauthorized("Code expired or never requested");
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw ApiError.tooMany("Too many attempts — request a new code");
  }
  if (!(await compareOtp(code, otp.codeHash))) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    throw ApiError.unauthorized("Incorrect code");
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  const user = await prisma.user.upsert({
    where: { phone },
    update: { isPhoneVerified: true },
    create: { phone, name: name ?? null, userType, isPhoneVerified: true },
  });

  const tokens = await issueTokens(user);
  return { user: pickUser(user), ...tokens };
}

export async function refreshSession(refreshToken) {
  if (!refreshToken) throw ApiError.unauthorized("No refresh token provided");

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: true },
  });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token revoked or expired");
  }

  // Rotate: revoke the old token before issuing a new pair.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokens(stored.user);
  return { user: pickUser(stored.user), ...tokens };
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function issueTokens(user) {
  const { token: refreshToken } = signRefreshToken(user);
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + expiryToMs(env.JWT_REFRESH_EXPIRES)),
    },
  });
  return {
    accessToken: signAccessToken(user),
    refreshToken,
    expiresIn: env.JWT_ACCESS_EXPIRES,
  };
}

function pickUser(user) {
  const { id, phone, name, userType, isPhoneVerified, avatarUrl, createdAt } = user;
  return { id, phone, name, userType, isPhoneVerified, avatarUrl, createdAt };
}
