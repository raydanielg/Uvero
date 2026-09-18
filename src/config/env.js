import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("30d"),
  OTP_TTL_MINUTES: z.coerce.number().int().positive().default(5),
  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
  CORS_ORIGIN: z.string().default("*"),
  OTP_STORE_PLAINTEXT: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  OTP_MONITOR_KEY: z.string().min(8).optional(),
  INTEGRATION_ENC_KEY: z
    .string()
    .min(16)
    .default("dev-only-integration-key-change-me"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
// Plaintext OTPs are only kept when explicitly enabled, or by default outside production.
export const storeOtpPlaintext = env.OTP_STORE_PLAINTEXT ?? !isProd;
