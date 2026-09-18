import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import { listSettingsQuerySchema, updateSettingSchema } from "./settings.schema.js";
import * as controller from "./settings.controller.js";

export const settingsRouter = Router();

settingsRouter.use(protect);

settingsRouter.get(
  "/",
  requirePermission("settings.view"),
  validate(listSettingsQuerySchema, "query"),
  controller.list,
);

settingsRouter.patch(
  "/:key",
  requirePermission("settings.update"),
  validate(updateSettingSchema),
  controller.update,
);
