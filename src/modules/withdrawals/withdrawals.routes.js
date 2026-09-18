import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  payoutAccountSchema,
  rejectWithdrawalSchema,
  requestWithdrawalSchema,
} from "./withdrawals.schema.js";
import * as controller from "./withdrawals.controller.js";

export const withdrawalsRouter = Router();

withdrawalsRouter.use(protect);

withdrawalsRouter.get("/payout-accounts", restrictTo("PROVIDER"), controller.listPayoutAccounts);
withdrawalsRouter.post(
  "/payout-accounts",
  restrictTo("PROVIDER"),
  validate(payoutAccountSchema),
  controller.addPayoutAccount,
);

withdrawalsRouter.post(
  "/",
  restrictTo("PROVIDER"),
  validate(requestWithdrawalSchema),
  controller.requestWithdrawal,
);
withdrawalsRouter.get("/me", restrictTo("PROVIDER"), controller.listMine);

withdrawalsRouter.get("/", requirePermission("withdrawals.view"), controller.listAll);
withdrawalsRouter.post("/:id/approve", requirePermission("withdrawals.approve"), controller.approve);
withdrawalsRouter.post(
  "/:id/reject",
  requirePermission("withdrawals.approve"),
  validate(rejectWithdrawalSchema),
  controller.reject,
);
