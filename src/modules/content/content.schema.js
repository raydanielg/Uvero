import { z } from "zod";

export const upsertPageSchema = z.object({
  title: z.string().trim().min(1).max(150),
  bodyHtml: z.string().min(1),
  isPublished: z.boolean().default(true),
});

export const faqSchema = z.object({
  category: z.string().trim().max(60).optional(),
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(1),
  sortOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
});

export const bannerSchema = z.object({
  title: z.string().trim().min(1).max(150),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  placement: z.string().trim().min(1).max(60),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(1).max(150),
  body: z.string().trim().min(1),
  audience: z.enum(["ALL", "CUSTOMERS", "PROVIDERS"]).default("ALL"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
});

export const legalDocumentSchema = z.object({
  type: z.enum(["TERMS", "PRIVACY", "PROVIDER_AGREEMENT", "REFUND_POLICY"]),
  version: z.string().trim().min(1).max(20),
  bodyHtml: z.string().min(1),
  effectiveAt: z.coerce.date().optional(),
});
