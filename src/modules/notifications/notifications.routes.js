import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import * as controller from "./notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.use(protect);

notificationsRouter.get("/", controller.listMine);
notificationsRouter.post("/read-all", controller.markAllRead);
notificationsRouter.post("/:id/read", controller.markRead);
