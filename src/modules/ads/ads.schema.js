import { z } from "zod";

const placement = z.enum([
  "CUSTOMER_HOME",
  "SERVICES_LIST",
  "REQUEST_SCREEN",
  "PROVIDER_HOME",
  "PROVIDER_JOBS",
]);

export const createAdSchema = z.object({
  campaignId: z.string().optional(),
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  placement,
  priority: z.number().int().default(0),
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "ENDED"]).default("DRAFT"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  targetAudience: z.record(z.string(), z.any()).optional(),
});

export const updateAdSchema = createAdSchema.partial();

export const createCampaignSchema = z.object({
  name: z.string().trim().min(2).max(150),
  budget: z.number().nonnegative().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
