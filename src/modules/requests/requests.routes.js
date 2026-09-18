import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { cancelRequestSchema, createRequestSchema, listRequestsQuerySchema } from "./requests.schema.js";
import * as controller from "./requests.controller.js";

export const requestsRouter = Router();

requestsRouter.use(protect);

requestsRouter.post("/", restrictTo("CUSTOMER"), validate(createRequestSchema), controller.create);
requestsRouter.get("/", restrictTo("CUSTOMER"), validate(listRequestsQuerySchema, "query"), controller.listMine);
requestsRouter.get("/:id", controller.get);
requestsRouter.get("/:id/tracking", restrictTo("CUSTOMER"), controller.tracking);
requestsRouter.post(
  "/:id/cancel",
  restrictTo("CUSTOMER"),
  validate(cancelRequestSchema),
  controller.cancel,
);

// Provider responses to a dispatched match.
requestsRouter.post("/matches/:matchId/accept", restrictTo("PROVIDER"), controller.acceptMatch);
requestsRouter.post("/matches/:matchId/decline", restrictTo("PROVIDER"), controller.declineMatch);
