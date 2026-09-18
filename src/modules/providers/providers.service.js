import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { haversineKm } from "../../core/geo/distance.js";
import { recordAudit } from "../../core/audit/audit.js";
import { broadcastToRoom } from "../../realtime/broadcaster.js";

const profileInclude = {
  services: { include: { service: true } },
  serviceAreas: true,
  location: true,
  documents: true,
};

export async function getOrCreateProfile(userId) {
  const existing = await prisma.providerProfile.findUnique({
    where: { userId },
    include: profileInclude,
  });
  if (existing) return existing;

  return prisma.providerProfile.create({
    data: { userId },
    include: profileInclude,
  });
}

export async function getProfileById(id) {
  const profile = await prisma.providerProfile.findUnique({ where: { id }, include: profileInclude });
  if (!profile) throw ApiError.notFound("Provider profile not found");
  return profile;
}

export async function updateProfile(userId, data) {
  const profile = await getOrCreateProfile(userId);
  return prisma.providerProfile.update({
    where: { id: profile.id },
    data,
    include: profileInclude,
  });
}

export async function setAvailability(userId, availabilityStatus) {
  const profile = await getOrCreateProfile(userId);
  return prisma.providerProfile.update({
    where: { id: profile.id },
    data: {
      availabilityStatus,
      lastOnlineAt: availabilityStatus === "ONLINE" ? new Date() : profile.lastOnlineAt,
    },
  });
}

export async function updateLocation(userId, { lat, lng, heading, speed }) {
  const profile = await getOrCreateProfile(userId);
  const location = await prisma.providerLocation.upsert({
    where: { providerId: profile.id },
    update: { lat, lng, heading, speed },
    create: { providerId: profile.id, lat, lng, heading, speed },
  });

  const activeJob = await prisma.job.findFirst({
    where: { providerId: profile.id, status: { in: ["ASSIGNED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"] } },
  });
  if (activeJob) {
    broadcastToRoom(`job:${activeJob.id}`, "provider:location", { lat, lng, heading, speed });
  }

  return location;
}

export async function setServiceArea(userId, { centerLat, centerLng, radiusKm, region }) {
  const profile = await getOrCreateProfile(userId);
  // Single primary area per provider for now — replace instead of accumulating.
  await prisma.providerServiceArea.deleteMany({ where: { providerId: profile.id } });
  return prisma.providerServiceArea.create({
    data: { providerId: profile.id, centerLat, centerLng, radiusKm, region },
  });
}

export async function setServices(userId, serviceIds) {
  const profile = await getOrCreateProfile(userId);
  await prisma.$transaction([
    prisma.providerService.deleteMany({
      where: { providerId: profile.id, serviceId: { notIn: serviceIds } },
    }),
    ...serviceIds.map((serviceId) =>
      prisma.providerService.upsert({
        where: { providerId_serviceId: { providerId: profile.id, serviceId } },
        update: { isActive: true },
        create: { providerId: profile.id, serviceId },
      }),
    ),
  ]);
  return getOrCreateProfile(userId);
}

export async function addDocument(userId, { type, fileUrl, expiresAt }) {
  const profile = await getOrCreateProfile(userId);
  return prisma.providerDocument.create({
    data: { providerId: profile.id, type, fileUrl, expiresAt },
  });
}

export async function listDocuments(providerId) {
  return prisma.providerDocument.findMany({ where: { providerId }, orderBy: { createdAt: "desc" } });
}

export async function reviewDocument(documentId, { status, rejectReason }, reviewerId, req) {
  const document = await prisma.providerDocument.findUnique({ where: { id: documentId } });
  if (!document) throw ApiError.notFound("Document not found");

  const updated = await prisma.providerDocument.update({
    where: { id: documentId },
    data: { status, rejectReason, reviewedBy: reviewerId, reviewedAt: new Date() },
  });

  await recordAudit({
    actorId: reviewerId,
    action: "REVIEWED_PROVIDER_DOCUMENT",
    entityType: "ProviderDocument",
    entityId: documentId,
    oldValue: { status: document.status },
    newValue: { status },
    req,
  });

  return updated;
}

export async function suspend(providerId, { reason, endsAt }, actorId, req) {
  const suspension = await prisma.providerSuspension.create({
    data: { providerId, reason, endsAt, issuedBy: actorId },
  });
  await prisma.providerProfile.update({
    where: { id: providerId },
    data: { availabilityStatus: "OFFLINE" },
  });
  await recordAudit({
    actorId,
    action: "SUSPENDED_PROVIDER",
    entityType: "ProviderProfile",
    entityId: providerId,
    newValue: { reason, endsAt },
    req,
  });
  return suspension;
}

export async function liftSuspension(suspensionId, actorId, req) {
  const suspension = await prisma.providerSuspension.findUnique({ where: { id: suspensionId } });
  if (!suspension) throw ApiError.notFound("Suspension not found");

  const updated = await prisma.providerSuspension.update({
    where: { id: suspensionId },
    data: { status: "LIFTED", liftedBy: actorId, liftedAt: new Date() },
  });

  await recordAudit({
    actorId,
    action: "LIFTED_PROVIDER_SUSPENSION",
    entityType: "ProviderSuspension",
    entityId: suspensionId,
    req,
  });

  return updated;
}

export async function warn(providerId, { reason, severity }, actorId) {
  return prisma.providerWarning.create({
    data: { providerId, reason, severity, issuedBy: actorId },
  });
}

// Used by the matching engine: providers offering `serviceId`, currently
// online, approved, and within `radiusKm` of (lat, lng) — nearest first.
export async function findNearbyForService({ serviceId, lat, lng, radiusKm }) {
  const candidates = await prisma.providerProfile.findMany({
    where: {
      isApproved: true,
      availabilityStatus: "ONLINE",
      services: { some: { serviceId, isActive: true } },
      location: { isNot: null },
    },
    include: { location: true },
  });

  return candidates
    .map((provider) => ({
      provider,
      distanceKm: haversineKm(lat, lng, provider.location.lat, provider.location.lng),
    }))
    .filter((entry) => entry.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm || b.provider.averageRating - a.provider.averageRating);
}
