import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { track } from "../analytics/analytics.service.js";
import { notify } from "../notifications/notifications.service.js";

// Valid forward transitions. CANCELLED is reachable from any non-terminal
// state and is handled separately in `cancelJob`.
const TRANSITIONS = {
  ASSIGNED: ["EN_ROUTE", "IN_PROGRESS"],
  EN_ROUTE: ["ARRIVED"],
  ARRIVED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
};

// Called from inside the matching engine's transaction — takes `tx` instead
// of the module-level `prisma` client.
export async function createJobFromMatch(tx, match) {
  const job = await tx.job.create({
    data: {
      requestId: match.requestId,
      providerId: match.providerId,
      customerId: match.request.customerId,
    },
  });
  await tx.jobStatusHistory.create({
    data: { jobId: job.id, status: "ASSIGNED", changedBy: match.providerId },
  });
  return job;
}

const jobInclude = {
  request: { include: { service: true, address: true } },
  provider: true,
};

export async function getJob(id, requesterId) {
  const job = await prisma.job.findUnique({ where: { id }, include: jobInclude });
  if (!job) throw ApiError.notFound("Job not found");
  if (requesterId && job.customerId !== requesterId && job.provider.userId !== requesterId) {
    throw ApiError.forbidden();
  }
  return job;
}

export async function listMine(userId, role, { skip, take } = {}) {
  const where =
    role === "PROVIDER"
      ? { provider: { userId } }
      : { customerId: userId };

  const [rows, total] = await Promise.all([
    prisma.job.findMany({ where, include: jobInclude, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.job.count({ where }),
  ]);
  return { rows, total };
}

export async function updateStatus(jobId, actorUserId, status, note) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { provider: true } });
  if (!job) throw ApiError.notFound("Job not found");
  if (job.provider.userId !== actorUserId) throw ApiError.forbidden("Only the assigned provider can update this job");

  const allowed = TRANSITIONS[job.status] ?? [];
  if (!allowed.includes(status)) {
    throw ApiError.conflict(`Cannot move job from ${job.status} to ${status}`);
  }

  const timestampField = { ARRIVED: "arrivedAt", IN_PROGRESS: "startedAt", COMPLETED: "completedAt" }[status];

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.job.update({
      where: { id: jobId },
      data: { status, ...(timestampField ? { [timestampField]: new Date() } : {}) },
    });
    await tx.jobStatusHistory.create({ data: { jobId, status, note, changedBy: actorUserId } });

    if (status === "COMPLETED") {
      const request = await tx.serviceRequest.findUnique({ where: { id: job.requestId } });
      await tx.serviceRequest.update({
        where: { id: job.requestId },
        data: {
          status: "COMPLETED",
          finalPrice: request.finalPrice ?? request.estimatedPrice ?? undefined,
        },
      });
      await tx.providerProfile.update({
        where: { id: job.providerId },
        data: { totalJobsCompleted: { increment: 1 } },
      });
      await tx.requestEvent.create({ data: { requestId: job.requestId, eventType: "JOB_COMPLETED" } });
    }

    return result;
  });

  if (status === "COMPLETED") {
    await track("JOB_COMPLETED", { userId: actorUserId, properties: { jobId } });
    await notify(job.customerId, "job_completed", { jobId });
  }

  return updated;
}

export async function cancelJob(jobId, actorUserId, reason) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { provider: true } });
  if (!job) throw ApiError.notFound("Job not found");
  if (job.status === "COMPLETED" || job.status === "CANCELLED") {
    throw ApiError.conflict("This job can no longer be cancelled");
  }
  if (job.customerId !== actorUserId && job.provider.userId !== actorUserId) {
    throw ApiError.forbidden();
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.job.update({
      where: { id: jobId },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: reason },
    });
    await tx.jobStatusHistory.create({
      data: { jobId, status: "CANCELLED", note: reason, changedBy: actorUserId },
    });
    await tx.serviceRequest.update({
      where: { id: job.requestId },
      data: { status: "CANCELLED", cancelledReason: reason, cancelledBy: actorUserId },
    });
    return result;
  });

  return updated;
}

export async function getHistory(jobId) {
  return prisma.jobStatusHistory.findMany({ where: { jobId }, orderBy: { createdAt: "asc" } });
}
