import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import { createFlagSchema, updateFlagSchema } from "./feature-flags.schema.js";
import * as controller from "./feature-flags.controller.js";

export const featureFlagsRouter = Router();

featureFlagsRouter.use(protect, requirePermission("features.manage"));

featureFlagsRouter.get("/", controller.list);
featureFlagsRouter.post("/", validate(createFlagSchema), controller.create);
featureFlagsRouter.patch("/:key", validate(updateFlagSchema), controller.update);
