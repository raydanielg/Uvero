import { z } from "zod";

export const createRequirementSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  documentType: z.string().trim().min(2).max(60),
  serviceId: z.string().optional(),
  isRequired: z.boolean().default(true),
});

export const submitDocumentSchema = z.object({
  requirementId: z.string().min(1),
  fileUrl: z.string().url(),
});

export const reviewSubmissionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "RESUBMIT_REQUIRED"]),
  note: z.string().trim().max(500).optional(),
});
