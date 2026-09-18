import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

const CACHE_TTL_MS = 30_000;
const cache = new Map(); // userId -> { permissions: Set<string>, expiresAt: number }

async function getUserPermissions(userId) {
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.permissions;

  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });

  const permissions = new Set();
  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.rolePermissions) {
      permissions.add(rolePermission.permission.key);
    }
  }

  cache.set(userId, { permissions, expiresAt: Date.now() + CACHE_TTL_MS });
  return permissions;
}

export function invalidateUserPermissions(userId) {
  cache.delete(userId);
}

// Usage: router.patch("/settings/:key", protect, requirePermission("settings.update"), ...)
export function requirePermission(...anyOfKeys) {
  return async (req, _res, next) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const permissions = await getUserPermissions(req.user.id);
      if (!anyOfKeys.some((key) => permissions.has(key))) {
        throw ApiError.forbidden(`Missing permission: ${anyOfKeys.join(" or ")}`);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
