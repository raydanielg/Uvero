import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    email: z.string().trim().toLowerCase().email().nullable().optional(),
    language: z.enum(["sw", "en"]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Provide at least one field to update");

export const addressSchema = z.object({
  label: z.string().trim().max(60).optional(),
  line1: z.string().trim().min(2).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  region: z.string().trim().max(100).optional(),
  country: z.string().trim().length(2).default("TZ"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  placeId: z.string().trim().optional(),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = addressSchema.partial();

export const acceptLegalSchema = z.object({
  types: z.array(z.enum(["TERMS", "PRIVACY", "REFUND_POLICY"])).min(1).default(["TERMS", "PRIVACY"]),
});

export const activityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
