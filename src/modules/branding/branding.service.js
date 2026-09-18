import { prisma } from "../../config/prisma.js";
import { recordAudit } from "../../core/audit/audit.js";

const SINGLETON_ID = "default";

export async function getBranding() {
  return prisma.branding.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });
}

export async function updateBranding(data, actorId, req) {
  const before = await getBranding();
  const updated = await prisma.branding.update({
    where: { id: SINGLETON_ID },
    data: { ...data, updatedBy: actorId },
  });

  await recordAudit({
    actorId,
    action: "UPDATED_BRANDING",
    entityType: "Branding",
    entityId: SINGLETON_ID,
    oldValue: before,
    newValue: updated,
    req,
  });

  return updated;
}
