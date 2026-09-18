import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import { initiatePaymentSchema } from "./payments.schema.js";
import * as controller from "./payments.controller.js";

export const paymentsRouter = Router();

paymentsRouter.post(
  "/",
  protect,
  restrictTo("CUSTOMER"),
  validate(initiatePaymentSchema),
  controller.initiate,
);
paymentsRouter.get("/:id", protect, requirePermission("payments.view"), controller.get);

export const paymentWebhooksRouter = Router();
paymentWebhooksRouter.post("/:code", controller.webhook);
