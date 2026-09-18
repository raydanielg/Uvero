import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import { setEnabledSchema, upsertIntegrationSchema } from "./integrations.schema.js";
import * as controller from "./integrations.controller.js";

export const integrationsRouter = Router();

integrationsRouter.use(protect, requirePermission("integrations.manage"));

integrationsRouter.get("/", controller.list);
integrationsRouter.put("/", validate(upsertIntegrationSchema), controller.upsert);
integrationsRouter.patch("/:code/enabled", validate(setEnabledSchema), controller.setEnabled);
