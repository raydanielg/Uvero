import { z } from "zod";

const phone = z
  .string({ error: "phone is required" })
  .min(9, "phone is too short")
  .max(20, "phone is too long");

const code = z
  .string({ error: "code is required" })
  .regex(/^\d{4,8}$/, "code must be 4-8 digits");

export const requestOtpSchema = z.object({
  phone,
});

export const verifyOtpSchema = z.object({
  phone,
  code,
  name: z.string().trim().min(2).max(60).optional(),
  userType: z.enum(["CUSTOMER", "PROVIDER"]).default("CUSTOMER"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});
