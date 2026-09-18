import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

export async function rateJob(jobId, fromUserId, { score, comment }) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { provider: true } });
  if (!job) throw ApiError.notFound("Job not found");
  if (job.status !== "COMPLETED") throw ApiError.conflict("Only completed jobs can be rated");

  const toUserId = fromUserId === job.customerId ? job.provider.userId : job.customerId;
  if (fromUserId !== job.customerId && fromUserId !== job.provider.userId) throw ApiError.forbidden();

  const rating = await prisma.rating.create({
    data: {
      jobId,
      fromUserId,
      toUserId,
      score,
      review: comment ? { create: { comment } } : undefined,
    },
    include: { review: true },
  });

  await recalculateAverage(toUserId);
  return rating;
}

async function recalculateAverage(toUserId) {
  const aggregate = await prisma.rating.aggregate({
    where: { toUserId },
    _avg: { score: true },
    _count: true,
  });

  const providerProfile = await prisma.providerProfile.findUnique({ where: { userId: toUserId } });
  if (providerProfile) {
    await prisma.providerProfile.update({
      where: { id: providerProfile.id },
      data: { averageRating: aggregate._avg.score ?? 0, totalRatings: aggregate._count },
    });
  } else {
    await prisma.customerProfile.updateMany({
      where: { userId: toUserId },
      data: { averageRating: aggregate._avg.score ?? 0 },
    });
  }
}

export async function listForUser(userId, { skip, take } = {}) {
  const where = { toUserId: userId };
  const [rows, total] = await Promise.all([
    prisma.rating.findMany({ where, include: { review: true }, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.rating.count({ where }),
  ]);
  return { rows, total };
}
