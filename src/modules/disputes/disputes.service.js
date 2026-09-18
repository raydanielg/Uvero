import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { recordAudit } from "../../core/audit/audit.js";

export async function raiseDispute(jobId, raisedById, { reason }) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { provider: true } });
  if (!job) throw ApiError.notFound("Job not found");

  const againstId = raisedById === job.customerId ? job.provider.userId : job.customerId;
  if (raisedById !== job.customerId && raisedById !== job.provider.userId) throw ApiError.forbidden();

  return prisma.dispute.create({ data: { jobId, raisedById, againstId, reason } });
}

export async function addMessage(disputeId, senderId, { body, attachmentUrl }) {
  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) throw ApiError.notFound("Dispute not found");
  if (![dispute.raisedById, dispute.againstId].includes(senderId)) throw ApiError.forbidden();

  return prisma.disputeMessage.create({ data: { disputeId, senderId, body, attachmentUrl } });
}

export async function getDispute(id, requesterId) {
  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: { messages: { orderBy: { sentAt: "asc" } }, job: true },
  });
  if (!dispute) throw ApiError.notFound("Dispute not found");
  if (requesterId && ![dispute.raisedById, dispute.againstId].includes(requesterId)) {
    throw ApiError.forbidden();
  }
  return dispute;
}

export async function listMine(userId) {
  return prisma.dispute.findMany({
    where: { OR: [{ raisedById: userId }, { againstId: userId }] },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAll({ status } = {}, { skip, take } = {}) {
  const where = status ? { status } : {};
  const [rows, total] = await Promise.all([
    prisma.dispute.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.dispute.count({ where }),
  ]);
  return { rows, total };
}

export async function resolve(id, { resolution, status }, actorId, req) {
  const dispute = await prisma.dispute.findUnique({ where: { id } });
  if (!dispute) throw ApiError.notFound("Dispute not found");

  const updated = await prisma.dispute.update({
    where: { id },
    data: {
      status: status ?? "RESOLVED",
      resolution,
      resolvedBy: actorId,
      resolvedAt: new Date(),
    },
  });

  await recordAudit({
    actorId,
    action: "RESOLVED_DISPUTE",
    entityType: "Dispute",
    entityId: id,
    newValue: { resolution, status: updated.status },
    req,
  });

  return updated;
}
