import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { requirePermission } from "../../core/permissions/rbac.js";
import { validate } from "../../middleware/validate.js";
import { addMessageSchema, raiseDisputeSchema, resolveDisputeSchema } from "./disputes.schema.js";
import * as controller from "./disputes.controller.js";

export const disputesRouter = Router();

disputesRouter.use(protect);

disputesRouter.post("/", validate(raiseDisputeSchema), controller.raise);
disputesRouter.get("/mine", controller.listMine);
disputesRouter.get("/:id", controller.get);
disputesRouter.post("/:id/messages", validate(addMessageSchema), controller.addMessage);

disputesRouter.get("/", requirePermission("disputes.manage"), controller.listAll);
disputesRouter.post(
  "/:id/resolve",
  requirePermission("disputes.manage"),
  validate(resolveDisputeSchema),
  controller.resolve,
);
