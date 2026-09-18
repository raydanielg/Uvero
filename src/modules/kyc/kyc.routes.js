import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  createRequirementSchema,
  reviewSubmissionSchema,
  submitDocumentSchema,
} from "./kyc.schema.js";
import * as controller from "./kyc.controller.js";

export const kycRouter = Router();

kycRouter.get("/requirements", controller.listRequirements);
kycRouter.post(
  "/requirements",
  protect,
  requirePermission("kyc.review"),
  validate(createRequirementSchema),
  controller.createRequirement,
);

kycRouter.post(
  "/submissions",
  protect,
  restrictTo("PROVIDER"),
  validate(submitDocumentSchema),
  controller.submitDocument,
);
kycRouter.get("/submissions", protect, requirePermission("kyc.review"), controller.listSubmissions);
kycRouter.post(
  "/submissions/:id/review",
  protect,
  requirePermission("kyc.review"),
  validate(reviewSubmissionSchema),
  controller.reviewSubmission,
);
