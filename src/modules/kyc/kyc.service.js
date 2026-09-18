import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { notify } from "../notifications/notifications.service.js";
import { recordAudit } from "../../core/audit/audit.js";

export async function listRequirements(serviceId) {
  return prisma.kycRequirement.findMany({
    where: { isActive: true, OR: [{ serviceId: null }, ...(serviceId ? [{ serviceId }] : [])] },
  });
}

export async function createRequirement(data) {
  return prisma.kycRequirement.create({ data });
}

async function getOrCreateOpenSubmission(providerId) {
  const open = await prisma.kycSubmission.findFirst({
    where: { providerId, status: "PENDING" },
  });
  if (open) return open;
  return prisma.kycSubmission.create({ data: { providerId, status: "PENDING" } });
}

export async function submitDocument(providerUserId, { requirementId, fileUrl }) {
  const provider = await prisma.providerProfile.findUnique({ where: { userId: providerUserId } });
  if (!provider) throw ApiError.badRequest("Provider profile not found");

  const submission = await getOrCreateOpenSubmission(provider.id);
  const document = await prisma.kycDocument.create({
    data: { submissionId: submission.id, requirementId, fileUrl },
  });

  await prisma.providerProfile.update({
    where: { id: provider.id },
    data: { verificationStatus: "PENDING" },
  });

  return document;
}

export async function listSubmissions({ status } = {}, { skip, take } = {}) {
  const where = status ? { status } : {};
  const [rows, total] = await Promise.all([
    prisma.kycSubmission.findMany({
      where,
      include: { documents: { include: { requirement: true } }, provider: { include: { user: true } } },
      orderBy: { submittedAt: "desc" },
      skip,
      take,
    }),
    prisma.kycSubmission.count({ where }),
  ]);
  return { rows, total };
}

export async function reviewSubmission(submissionId, { decision, note }, reviewerId, req) {
  const submission = await prisma.kycSubmission.findUnique({
    where: { id: submissionId },
    include: { provider: true },
  });
  if (!submission) throw ApiError.notFound("KYC submission not found");

  const status = decision === "APPROVED" ? "APPROVED" : decision === "RESUBMIT_REQUIRED" ? "PENDING" : "REJECTED";

  await prisma.$transaction([
    prisma.kycReview.create({ data: { submissionId, reviewerId, decision, note } }),
    prisma.kycSubmission.update({
      where: { id: submissionId },
      data: { status, reviewedAt: new Date(), reviewedBy: reviewerId, note },
    }),
    prisma.providerProfile.update({
      where: { id: submission.providerId },
      data: {
        verificationStatus: decision === "APPROVED" ? "VERIFIED" : decision === "REJECTED" ? "REJECTED" : "PENDING",
        isApproved: decision === "APPROVED" ? true : submission.provider.isApproved,
      },
    }),
  ]);

  await recordAudit({
    actorId: reviewerId,
    action: "REVIEWED_KYC_SUBMISSION",
    entityType: "KycSubmission",
    entityId: submissionId,
    newValue: { decision, note },
    req,
  });

  await notify(
    submission.provider.userId,
    decision === "APPROVED" ? "kyc_approved" : "kyc_rejected",
    { note },
  );

  return prisma.kycSubmission.findUnique({ where: { id: submissionId } });
}
