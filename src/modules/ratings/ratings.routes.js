import { Router } from "express";
import { protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { rateJobSchema } from "./ratings.schema.js";
import * as controller from "./ratings.controller.js";

export const ratingsRouter = Router();

ratingsRouter.post("/jobs/:jobId", protect, validate(rateJobSchema), controller.rateJob);
ratingsRouter.get("/users/:userId", controller.listForUser);
