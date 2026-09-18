import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  addDocumentSchema,
  availabilitySchema,
  locationSchema,
  reviewDocumentSchema,
  serviceAreaSchema,
  setServicesSchema,
  suspendSchema,
  updateProfileSchema,
  warnSchema,
} from "./providers.schema.js";
import * as controller from "./providers.controller.js";

export const providersRouter = Router();

const asProvider = [protect, restrictTo("PROVIDER")];

providersRouter.get("/me", asProvider, controller.getMyProfile);
providersRouter.patch("/me", asProvider, validate(updateProfileSchema), controller.updateMyProfile);
providersRouter.patch(
  "/me/availability",
  asProvider,
  validate(availabilitySchema),
  controller.setAvailability,
);
providersRouter.put("/me/location", asProvider, validate(locationSchema), controller.updateLocation);
providersRouter.put(
  "/me/service-area",
  asProvider,
  validate(serviceAreaSchema),
  controller.setServiceArea,
);
providersRouter.put("/me/services", asProvider, validate(setServicesSchema), controller.setServices);
providersRouter.post(
  "/me/documents",
  asProvider,
  validate(addDocumentSchema),
  controller.addDocument,
);
providersRouter.get("/me/documents", asProvider, controller.listMyDocuments);

// Admin / staff.
providersRouter.get("/:id", protect, requirePermission("providers.view"), controller.getProfileById);
providersRouter.patch(
  "/documents/:documentId/review",
  protect,
  requirePermission("providers.verify"),
  validate(reviewDocumentSchema),
  controller.reviewDocument,
);
providersRouter.post(
  "/:id/suspend",
  protect,
  requirePermission("providers.suspend"),
  validate(suspendSchema),
  controller.suspend,
);
providersRouter.post(
  "/suspensions/:suspensionId/lift",
  protect,
  requirePermission("providers.suspend"),
  controller.liftSuspension,
);
providersRouter.post(
  "/:id/warnings",
  protect,
  requirePermission("providers.suspend"),
  validate(warnSchema),
  controller.warn,
);
