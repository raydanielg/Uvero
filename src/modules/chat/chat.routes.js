import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { sendMessageSchema } from "./chat.schema.js";
import * as controller from "./chat.controller.js";

export const chatRouter = Router();

chatRouter.use(protect);

chatRouter.get("/", controller.listMine);
chatRouter.get("/jobs/:jobId", controller.openJobConversation);
chatRouter.get("/:id/messages", controller.listMessages);
chatRouter.post("/:id/messages", validate(sendMessageSchema), controller.sendMessage);
