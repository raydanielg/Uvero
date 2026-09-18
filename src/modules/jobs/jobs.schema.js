import { z } from "zod";

export const updateStatusSchema = z.object({
  status: z.enum(["EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED"]),
  note: z.string().trim().max(500).optional(),
});

export const cancelJobSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
