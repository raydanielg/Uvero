import { z } from "zod";

export const updateProfileSchema = z.object({
  businessName: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(1000).optional(),
  autoAcceptEnabled: z.boolean().optional(),
  maxActiveJobs: z.number().int().min(1).max(50).optional(),
});

export const availabilitySchema = z.object({
  status: z.enum(["ONLINE", "OFFLINE", "BUSY"]),
});

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  heading: z.number().optional(),
  speed: z.number().optional(),
});

export const serviceAreaSchema = z.object({
  centerLat: z.number().min(-90).max(90),
  centerLng: z.number().min(-180).max(180),
  radiusKm: z.number().positive().max(200).default(5),
  region: z.string().trim().optional(),
});

export const setServicesSchema = z.object({
  serviceIds: z.array(z.string().min(1)).min(1),
});

export const addDocumentSchema = z.object({
  type: z.string().trim().min(2).max(60),
  fileUrl: z.string().url(),
  expiresAt: z.coerce.date().optional(),
});

export const reviewDocumentSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectReason: z.string().trim().max(500).optional(),
});

export const suspendSchema = z.object({
  reason: z.string().trim().min(2).max(500),
  endsAt: z.coerce.date().optional(),
});

export const warnSchema = z.object({
  reason: z.string().trim().min(2).max(500),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).default("LOW"),
});
