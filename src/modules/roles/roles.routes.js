import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import { assignRoleSchema, createRoleSchema, setPermissionsSchema } from "./roles.schema.js";
import * as controller from "./roles.controller.js";

export const rolesRouter = Router();

rolesRouter.use(protect, requirePermission("roles.manage"));

rolesRouter.get("/", controller.list);
rolesRouter.post("/", validate(createRoleSchema), controller.create);
rolesRouter.patch("/:id/permissions", validate(setPermissionsSchema), controller.setPermissions);
rolesRouter.get("/permissions/catalog", controller.listPermissions);

rolesRouter.get("/users/:userId", controller.listForUser);
rolesRouter.post("/users/:userId", validate(assignRoleSchema), controller.assignToUser);
rolesRouter.delete("/users/:userId/:roleId", controller.revokeFromUser);
