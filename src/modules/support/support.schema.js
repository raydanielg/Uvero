import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(150),
  category: z.string().trim().max(60).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export const addMessageSchema = z.object({
  body: z.string().trim().max(2000).optional(),
  attachmentUrl: z.string().url().optional(),
});

export const assignSchema = z.object({
  assignedTo: z.string().min(1),
});

export const updateStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"]),
});
