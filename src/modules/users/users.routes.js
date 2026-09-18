import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import { listUsersQuerySchema, setStatusSchema } from "./users.schema.js";
import * as controller from "./users.controller.js";

export const usersRouter = Router();

usersRouter.use(protect, requirePermission("users.view"));

usersRouter.get("/", validate(listUsersQuerySchema, "query"), controller.list);
usersRouter.get("/:id", controller.get);
usersRouter.patch(
  "/:id/status",
  requirePermission("users.update"),
  validate(setStatusSchema),
  controller.setStatus,
);
