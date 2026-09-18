import { prisma } from "../../config/prisma.js";

// Every state-changing admin action should call this so `settings.commission
// 10% -> 8%` style history survives even after the setting itself changes.
export async function recordAudit({
  actorId,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
  req,
}) {
  await prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
      oldValue: oldValue ?? undefined,
      newValue: newValue ?? undefined,
      ipAddress: req?.ip ?? null,
      userAgent: req?.headers?.["user-agent"] ?? null,
    },
  });
}
