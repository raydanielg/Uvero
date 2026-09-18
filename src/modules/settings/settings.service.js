import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { recordAudit } from "../../core/audit/audit.js";

const TTL_MS = 15_000;
const cache = new Map(); // key -> { value, expiresAt }

function decode(row) {
  switch (row.valueType) {
    case "NUMBER":
      return Number(row.value);
    case "BOOLEAN":
      return row.value === "true";
    case "JSON":
      return JSON.parse(row.value);
    default:
      return row.value;
  }
}

function encode(value, valueType) {
  if (valueType === "JSON") return JSON.stringify(value);
  return String(value);
}

export async function getSetting(key, fallback) {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const row = await prisma.setting.findUnique({ where: { key } });
  const value = row ? decode(row) : fallback;
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
  return value;
}

export async function getSettingsByCategory(category) {
  const rows = await prisma.setting.findMany({ where: { category } });
  return Object.fromEntries(rows.map((row) => [row.key, decode(row)]));
}

export async function getPublicSettings() {
  const rows = await prisma.setting.findMany({ where: { isPublic: true } });
  return Object.fromEntries(rows.map((row) => [row.key, decode(row)]));
}

export async function listSettings({ category } = {}) {
  const rows = await prisma.setting.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });
  return rows.map((row) => ({ ...row, value: decode(row) }));
}

export async function updateSetting(key, rawValue, actorId, req) {
  const existing = await prisma.setting.findUnique({ where: { key } });
  if (!existing) throw ApiError.notFound(`Unknown setting: ${key}`);
  if (!existing.isEditable) throw ApiError.forbidden(`Setting "${key}" is not editable`);

  const value = encode(rawValue, existing.valueType);
  const updated = await prisma.setting.update({
    where: { key },
    data: { value, updatedBy: actorId },
  });

  cache.delete(key);
  await recordAudit({
    actorId,
    action: "UPDATED_SETTING",
    entityType: "Setting",
    entityId: key,
    oldValue: { value: existing.value },
    newValue: { value },
    req,
  });

  return { ...updated, value: decode(updated) };
}
