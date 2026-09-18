import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import { updateBrandingSchema } from "./branding.schema.js";
import * as controller from "./branding.controller.js";

export const brandingRouter = Router();

brandingRouter.get("/", controller.get);
brandingRouter.put(
  "/",
  protect,
  requirePermission("branding.update"),
  validate(updateBrandingSchema),
  controller.update,
);
