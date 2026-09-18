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
