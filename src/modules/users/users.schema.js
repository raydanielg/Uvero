import { z } from "zod";

export const listUsersQuerySchema = z.object({
  userType: z.enum(["CUSTOMER", "PROVIDER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "BANNED", "PENDING"]).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const setStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "BANNED", "PENDING"]),
});
