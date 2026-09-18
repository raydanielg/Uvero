import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { recordAudit } from "../../core/audit/audit.js";

const publicSelect = {
  id: true,
  phone: true,
  email: true,
  name: true,
  userType: true,
  status: true,
  isPhoneVerified: true,
  isEmailVerified: true,
  avatarUrl: true,
  createdAt: true,
  lastLoginAt: true,
};

export async function list({ userType, status, search } = {}, { skip, take } = {}) {
  const where = {
    ...(userType ? { userType } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? { OR: [{ phone: { contains: search } }, { name: { contains: search, mode: "insensitive" } }] }
      : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.user.findMany({ where, select: publicSelect, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.user.count({ where }),
  ]);
  return { rows, total };
}

export async function get(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: publicSelect });
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

export async function setStatus(id, status, actorId, req) {
  const user = await get(id);
  const updated = await prisma.user.update({ where: { id }, data: { status }, select: publicSelect });

  await recordAudit({
    actorId,
    action: "UPDATED_USER_STATUS",
    entityType: "User",
    entityId: id,
    oldValue: { status: user.status },
    newValue: { status },
    req,
  });

  return updated;
}
