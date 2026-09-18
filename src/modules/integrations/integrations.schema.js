import { z } from "zod";

export const upsertIntegrationSchema = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z][a-z0-9_]*$/, "code must be snake_case"),
  category: z.enum(["PAYMENT", "SMS", "EMAIL", "MAPS", "STORAGE", "PUSH"]),
  name: z.string().trim().min(2).max(80),
  isEnabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  config: z.record(z.string(), z.any()).optional(),
  credentials: z.record(z.string(), z.any()).optional(),
});

export const setEnabledSchema = z.object({
  isEnabled: z.boolean(),
});
