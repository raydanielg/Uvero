import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().optional(),
  description: z.string().trim().max(500).optional(),
  iconUrl: z.string().url().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createServiceSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().optional(),
  description: z.string().trim().max(500).optional(),
  iconUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const pricingRuleSchema = z.object({
  pricingType: z.enum(["FIXED", "DISTANCE", "QUOTE", "STARTING_PRICE", "HOURLY"]),
  basePrice: z.number().nonnegative().optional(),
  pricePerKm: z.number().nonnegative().optional(),
  pricePerHour: z.number().nonnegative().optional(),
  minimumPrice: z.number().nonnegative().optional(),
  maximumPrice: z.number().nonnegative().optional(),
  region: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export const updatePricingRuleSchema = pricingRuleSchema.partial();

export const estimateQuerySchema = z.object({
  distanceKm: z.coerce.number().nonnegative().optional(),
  durationHours: z.coerce.number().nonnegative().optional(),
  region: z.string().trim().optional(),
});
