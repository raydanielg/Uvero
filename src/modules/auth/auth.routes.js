import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  otpRequestLimiter,
  otpVerifyLimiter,
} from "../../middleware/rateLimit.js";
import {
  refreshSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from "./auth.schema.js";
import * as controller from "./auth.controller.js";

export const authRouter = Router();

/**
 * @openapi
 * /auth/otp/request:
 *   post:
 *     tags: [Auth]
 *     summary: Request an OTP code
 *     description: >
 *       Sends a 6-digit verification code to the given phone number via SMS.
 *       In development the code is also returned in the response as `devCode`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestOtpBody'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     phone: { type: string, example: "+255712345678" }
 *                     expiresIn: { type: integer, example: 300 }
 *                     devCode:
 *                       type: string
 *                       example: "482913"
 *                       description: Only present outside production
 *       400:
 *         description: Invalid phone number
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       429:
 *         description: Rate limited — wait before requesting again
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
authRouter.post(
  "/otp/request",
  otpRequestLimiter,
  validate(requestOtpSchema),
  controller.requestOtp,
);

/**
 * @openapi
 * /auth/otp/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP and sign in
 *     description: >
 *       Verifies the code. If the phone number has no account yet, one is
 *       created using the provided `name` and `userType` — otherwise the existing
 *       account is signed in. Returns an access token and a refresh token
 *       (also set as an httpOnly cookie).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpBody'
 *     responses:
 *       200:
 *         description: Signed in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                     accessToken: { type: 'string' }
 *                     refreshToken: { type: 'string' }
 *                     expiresIn: { type: 'string', example: "15m" }
 *       401:
 *         description: Wrong or expired code
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       429:
 *         description: Too many attempts
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
authRouter.post(
  "/otp/verify",
  otpVerifyLimiter,
  validate(verifyOtpSchema),
  controller.verifyOtp,
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate tokens
 *     description: >
 *       Exchanges a valid refresh token (body or httpOnly cookie) for a new
 *       access + refresh token pair. The old refresh token is revoked.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshBody'
 *     responses:
 *       200:
 *         description: New token pair issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                     accessToken: { type: 'string' }
 *                     refreshToken: { type: 'string' }
 *                     expiresIn: { type: 'string', example: "15m" }
 *       401:
 *         description: Invalid, revoked or expired refresh token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
authRouter.post("/refresh", validate(refreshSchema), controller.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out
 *     description: Revokes the refresh token and clears the cookie.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshBody'
 *     responses:
 *       200:
 *         description: Logged out
 */
authRouter.post("/logout", controller.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
authRouter.get("/me", protect, controller.me);
