import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import { createAdSchema, createCampaignSchema, updateAdSchema } from "./ads.schema.js";
import * as controller from "./ads.controller.js";

export const adsRouter = Router();

// Public — client apps fetch active ads per screen and report engagement.
adsRouter.get("/placement/:placement", controller.listActive);
adsRouter.post("/:id/impression", controller.impression);
adsRouter.post("/:id/click", controller.click);

// Admin management.
const manage = [protect, requirePermission("ads.manage")];
adsRouter.get("/", manage, controller.listAll);
adsRouter.post("/", manage, validate(createAdSchema), controller.create);
adsRouter.patch("/:id", manage, validate(updateAdSchema), controller.update);
adsRouter.delete("/:id", manage, controller.remove);

adsRouter.get("/campaigns/all", manage, controller.listCampaigns);
adsRouter.post("/campaigns", manage, validate(createCampaignSchema), controller.createCampaign);
