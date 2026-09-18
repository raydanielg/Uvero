import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { configRouter } from "../modules/config/config.routes.js";
import { settingsRouter } from "../modules/settings/settings.routes.js";
import { brandingRouter } from "../modules/branding/branding.routes.js";
import { featureFlagsRouter } from "../modules/feature-flags/feature-flags.routes.js";
import { rolesRouter } from "../modules/roles/roles.routes.js";
import { usersRouter } from "../modules/users/users.routes.js";
import { customersRouter } from "../modules/customers/customers.routes.js";
import { providersRouter } from "../modules/providers/providers.routes.js";
import { kycRouter } from "../modules/kyc/kyc.routes.js";
import { servicesRouter } from "../modules/services/services.routes.js";
import { requestsRouter } from "../modules/requests/requests.routes.js";
import { jobsRouter } from "../modules/jobs/jobs.routes.js";
import { quotesRouter } from "../modules/quotes/quotes.routes.js";
import { paymentsRouter, paymentWebhooksRouter } from "../modules/payments/payments.routes.js";
import { walletsRouter } from "../modules/wallets/wallets.routes.js";
import { withdrawalsRouter } from "../modules/withdrawals/withdrawals.routes.js";
import { ratingsRouter } from "../modules/ratings/ratings.routes.js";
import { notificationsRouter } from "../modules/notifications/notifications.routes.js";
import { searchRouter } from "../modules/search/search.routes.js";
import { chatRouter } from "../modules/chat/chat.routes.js";
import { uploadsRouter } from "../modules/uploads/uploads.routes.js";
import { disputesRouter } from "../modules/disputes/disputes.routes.js";
import { supportRouter } from "../modules/support/support.routes.js";
import { adsRouter } from "../modules/ads/ads.routes.js";
import { contentRouter } from "../modules/content/content.routes.js";
import { integrationsRouter } from "../modules/integrations/integrations.routes.js";
import { auditRouter } from "../modules/audit/audit.routes.js";
import { analyticsRouter } from "../modules/analytics/analytics.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/config", configRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/branding", brandingRouter);
apiRouter.use("/features", featureFlagsRouter);
apiRouter.use("/roles", rolesRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/customers", customersRouter);
apiRouter.use("/providers", providersRouter);
apiRouter.use("/kyc", kycRouter);
apiRouter.use("/services", servicesRouter);
apiRouter.use("/requests", requestsRouter);
apiRouter.use("/jobs", jobsRouter);
apiRouter.use("/quotes", quotesRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/webhooks/payments", paymentWebhooksRouter);
apiRouter.use("/wallets", walletsRouter);
apiRouter.use("/withdrawals", withdrawalsRouter);
apiRouter.use("/ratings", ratingsRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/search", searchRouter);
apiRouter.use("/uploads", uploadsRouter);
apiRouter.use("/disputes", disputesRouter);
apiRouter.use("/support", supportRouter);
apiRouter.use("/ads", adsRouter);
apiRouter.use("/content", contentRouter);
apiRouter.use("/integrations", integrationsRouter);
apiRouter.use("/audit-logs", auditRouter);
apiRouter.use("/analytics", analyticsRouter);

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
