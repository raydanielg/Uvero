import { z } from "zod";

export const listSettingsQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
});

export const updateSettingSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.any())]),
});
