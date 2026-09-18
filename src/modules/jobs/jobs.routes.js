import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { cancelJobSchema, updateStatusSchema } from "./jobs.schema.js";
import * as controller from "./jobs.controller.js";

export const jobsRouter = Router();

jobsRouter.use(protect);

jobsRouter.get("/", controller.listMine);
jobsRouter.get("/:id", controller.get);
jobsRouter.get("/:id/history", controller.history);
jobsRouter.patch("/:id/status", validate(updateStatusSchema), controller.updateStatus);
jobsRouter.post("/:id/cancel", validate(cancelJobSchema), controller.cancel);
