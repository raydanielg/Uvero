import { z } from "zod";

export const updateBrandingSchema = z.object({
  appName: z.string().trim().min(1).max(60).optional(),
  logoUrl: z.string().url().nullable().optional(),
  darkLogoUrl: z.string().url().nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().trim().max(20).optional(),
  secondaryColor: z.string().trim().max(20).nullable().optional(),
  accentColor: z.string().trim().max(20).nullable().optional(),
  backgroundColor: z.string().trim().max(20).nullable().optional(),
  textColor: z.string().trim().max(20).nullable().optional(),
  fontFamily: z.string().trim().max(120).nullable().optional(),
  supportEmail: z.string().email().nullable().optional(),
  supportPhone: z.string().trim().max(20).nullable().optional(),
  website: z.string().url().nullable().optional(),
  termsUrl: z.string().url().nullable().optional(),
  privacyUrl: z.string().url().nullable().optional(),
});
