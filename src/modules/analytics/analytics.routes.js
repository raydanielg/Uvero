import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import * as controller from "./analytics.controller.js";

export const analyticsRouter = Router();

analyticsRouter.get("/events", protect, requirePermission("reports.view"), controller.listEvents);
