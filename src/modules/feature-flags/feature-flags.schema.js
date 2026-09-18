import { z } from "zod";

export const createFlagSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z][a-z0-9_]*$/, "key must be snake_case"),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  isEnabled: z.boolean().default(false),
  rolloutPercentage: z.number().int().min(0).max(100).default(100),
});

export const updateFlagSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isEnabled: z.boolean().optional(),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
});
