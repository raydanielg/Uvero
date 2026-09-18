import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  addMessageSchema,
  assignSchema,
  createTicketSchema,
  updateStatusSchema,
} from "./support.schema.js";
import * as controller from "./support.controller.js";

export const supportRouter = Router();

supportRouter.use(protect);

supportRouter.post("/", validate(createTicketSchema), controller.create);
supportRouter.get("/mine", controller.listMine);
supportRouter.get("/:id", controller.get);
supportRouter.post("/:id/messages", validate(addMessageSchema), controller.addMessage);

supportRouter.get("/", requirePermission("support.manage"), controller.listAll);
supportRouter.post(
  "/:id/assign",
  requirePermission("support.manage"),
  validate(assignSchema),
  controller.assign,
);
supportRouter.patch(
  "/:id/status",
  requirePermission("support.manage"),
  validate(updateStatusSchema),
  controller.updateStatus,
);
