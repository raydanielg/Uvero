import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Liveness check
 *     responses:
 *       200:
 *         description: Service is up
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 status: { type: string, example: "ok" }
 *                 uptime: { type: number, example: 42.5 }
 */
apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok", uptime: process.uptime() });
});
