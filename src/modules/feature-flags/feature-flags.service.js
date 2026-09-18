import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { recordAudit } from "../../core/audit/audit.js";

export async function listFlags() {
  return prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
}

export async function getPublicFlags() {
  const flags = await listFlags();
  return Object.fromEntries(flags.map((flag) => [flag.key, flag.isEnabled]));
}

export async function createFlag(data, actorId) {
  return prisma.featureFlag.create({ data: { ...data, updatedBy: actorId } });
}

export async function updateFlag(key, data, actorId, req) {
  const existing = await prisma.featureFlag.findUnique({ where: { key } });
  if (!existing) throw ApiError.notFound(`Unknown feature flag: ${key}`);

  const updated = await prisma.featureFlag.update({
    where: { key },
    data: { ...data, updatedBy: actorId },
  });

  await recordAudit({
    actorId,
    action: "UPDATED_FEATURE_FLAG",
    entityType: "FeatureFlag",
    entityId: key,
    oldValue: { isEnabled: existing.isEnabled },
    newValue: { isEnabled: updated.isEnabled },
    req,
  });

  return updated;
}

export async function isEnabled(key, fallback = false) {
  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  return flag ? flag.isEnabled : fallback;
}
