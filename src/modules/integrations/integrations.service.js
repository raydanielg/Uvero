import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { encryptSecret } from "../../core/security/crypto.js";
import { recordAudit } from "../../core/audit/audit.js";

function omitSecret({ credentialsEncrypted, ...rest }) {
  return { ...rest, hasCredentials: Boolean(credentialsEncrypted) };
}

export async function list({ category } = {}) {
  const rows = await prisma.integrationConfig.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return rows.map(omitSecret);
}

export async function upsert({ code, category, name, isEnabled, isDefault, config, credentials }, actorId, req) {
  const existing = await prisma.integrationConfig.findUnique({ where: { code } });

  const data = {
    category,
    name,
    isEnabled: isEnabled ?? existing?.isEnabled ?? false,
    isDefault: isDefault ?? existing?.isDefault ?? false,
    config,
    updatedBy: actorId,
    ...(credentials ? { credentialsEncrypted: encryptSecret(JSON.stringify(credentials)) } : {}),
  };

  const updated = await prisma.integrationConfig.upsert({
    where: { code },
    update: data,
    create: { code, ...data },
  });

  await recordAudit({
    actorId,
    action: existing ? "UPDATED_INTEGRATION" : "CREATED_INTEGRATION",
    entityType: "IntegrationConfig",
    entityId: code,
    oldValue: existing ? { isEnabled: existing.isEnabled } : undefined,
    newValue: { isEnabled: data.isEnabled },
    req,
  });

  return omitSecret(updated);
}

export async function setEnabled(code, isEnabled, actorId, req) {
  const existing = await prisma.integrationConfig.findUnique({ where: { code } });
  if (!existing) throw ApiError.notFound(`Unknown integration: ${code}`);

  const updated = await prisma.integrationConfig.update({ where: { code }, data: { isEnabled, updatedBy: actorId } });
  await recordAudit({
    actorId,
    action: isEnabled ? "ENABLED_INTEGRATION" : "DISABLED_INTEGRATION",
    entityType: "IntegrationConfig",
    entityId: code,
    req,
  });
  return omitSecret(updated);
}
