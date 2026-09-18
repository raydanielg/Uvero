import { prisma } from "../../config/prisma.js";

export async function track(name, { userId, sessionId, source, properties } = {}) {
  await prisma.analyticsEvent.create({
    data: { name, userId, sessionId, source, properties },
  });
}

export async function listEvents({ name, from, to } = {}, { skip, take } = {}) {
  const where = {
    ...(name ? { name } : {}),
    ...(from || to
      ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.analyticsEvent.findMany({ where, orderBy: { occurredAt: "desc" }, skip, take }),
    prisma.analyticsEvent.count({ where }),
  ]);
  return { rows, total };
}
