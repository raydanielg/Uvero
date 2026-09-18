import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate.js";
import * as searchService from "./search.service.js";

export const searchRouter = Router();

const searchQuerySchema = z.object({
  q: z.string().trim().min(2, "Type at least 2 characters").max(60),
  categoryId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

searchRouter.get("/", validate(searchQuerySchema, "query"), async (req, res) => {
  res.json({ success: true, data: await searchService.search(req.query) });
});

searchRouter.get("/discover", async (_req, res) => {
  res.json({ success: true, data: await searchService.discover() });
});
