import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  createCategorySchema,
  createServiceSchema,
  estimateQuerySchema,
  pricingRuleSchema,
  updateCategorySchema,
  updatePricingRuleSchema,
  updateServiceSchema,
} from "./services.schema.js";
import * as controller from "./services.controller.js";

export const servicesRouter = Router();
const manage = [protect, requirePermission("services.manage")];

// Public catalog browsing — no auth required.
servicesRouter.get("/categories", controller.listCategories);
servicesRouter.get("/categories/:id", controller.getCategory);
servicesRouter.get("/", controller.listServices);
servicesRouter.get("/:id", controller.getService);
servicesRouter.get("/:id/estimate", validate(estimateQuerySchema, "query"), controller.estimate);
servicesRouter.get("/:id/pricing-rules", controller.listPricingRules);

// Admin management.
servicesRouter.post("/categories", manage, validate(createCategorySchema), controller.createCategory);
servicesRouter.patch(
  "/categories/:id",
  manage,
  validate(updateCategorySchema),
  controller.updateCategory,
);
servicesRouter.delete("/categories/:id", manage, controller.deleteCategory);

servicesRouter.post("/", manage, validate(createServiceSchema), controller.createService);
servicesRouter.patch("/:id", manage, validate(updateServiceSchema), controller.updateService);
servicesRouter.delete("/:id", manage, controller.deleteService);

servicesRouter.post(
  "/:id/pricing-rules",
  manage,
  validate(pricingRuleSchema),
  controller.createPricingRule,
);
servicesRouter.patch(
  "/:id/pricing-rules/:ruleId",
  manage,
  validate(updatePricingRuleSchema),
  controller.updatePricingRule,
);
servicesRouter.delete("/:id/pricing-rules/:ruleId", manage, controller.deletePricingRule);
