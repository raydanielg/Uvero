import { z } from "zod";

export const raiseDisputeSchema = z.object({
  jobId: z.string().min(1),
  reason: z.string().trim().min(5).max(1000),
});

export const addMessageSchema = z.object({
  body: z.string().trim().max(2000).optional(),
  attachmentUrl: z.string().url().optional(),
});

export const resolveDisputeSchema = z.object({
  resolution: z.string().trim().min(2).max(1000),
  status: z.enum(["RESOLVED", "REJECTED", "CLOSED"]).default("RESOLVED"),
});
