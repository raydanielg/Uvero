import { z } from "zod";

export const createRequestSchema = z.object({
  serviceId: z.string().min(1),
  addressId: z.string().min(1),
  description: z.string().trim().max(1000).optional(),
  urgency: z.enum(["NORMAL", "URGENT", "SCHEDULED"]).default("NORMAL"),
  scheduledAt: z.coerce.date().optional(),
  distanceKm: z.number().nonnegative().optional(),
});

export const cancelRequestSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const listRequestsQuerySchema = z.object({
  status: z
    .enum(["PENDING", "MATCHING", "MATCHED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "EXPIRED", "FAILED"])
    .optional(),
  group: z.enum(["active", "history"]).optional(),
  serviceId: z.string().optional(),
  search: z.string().trim().min(1).max(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});
