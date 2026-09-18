import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(500).optional(),
  permissionKeys: z.array(z.string()).default([]),
});

export const setPermissionsSchema = z.object({
  permissionKeys: z.array(z.string()).default([]),
});

export const assignRoleSchema = z.object({
  roleId: z.string().min(1),
});
