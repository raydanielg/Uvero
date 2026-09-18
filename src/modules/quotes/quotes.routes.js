import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createQuoteSchema, respondQuoteSchema } from "./quotes.schema.js";
import * as controller from "./quotes.controller.js";

export const quotesRouter = Router();

quotesRouter.use(protect);

quotesRouter.post(
  "/requests/:requestId",
  restrictTo("PROVIDER"),
  validate(createQuoteSchema),
  controller.create,
);
quotesRouter.get("/requests/:requestId", controller.listForRequest);
quotesRouter.post(
  "/:id/respond",
  restrictTo("CUSTOMER"),
  validate(respondQuoteSchema),
  controller.respond,
);
