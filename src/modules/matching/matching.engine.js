import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { getSetting } from "../settings/settings.service.js";
import { findNearbyForService } from "../providers/providers.service.js";
import { notify } from "../notifications/notifications.service.js";
import { track } from "../analytics/analytics.service.js";
import { createJobFromMatch } from "../jobs/jobs.service.js";

// Request -> find candidate providers -> rank -> send to #1 -> on
// decline/timeout, send to the next one -> if the list is exhausted, the
// request fails and the customer can retry or widen the search.
export async function startMatching(requestId) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: { address: true },
  });
  if (!request || request.status !== "PENDING") return;

  const radiusKm = await getSetting("matching.search_radius", 5);
  const maxProviders = await getSetting("matching.max_providers", 5);

  const candidates = await findNearbyForService({
    serviceId: request.serviceId,
    lat: request.address.lat,
    lng: request.address.lng,
    radiusKm,
  });

  if (candidates.length === 0) {
    await prisma.serviceRequest.update({ where: { id: requestId }, data: { status: "FAILED" } });
    await prisma.requestEvent.create({
      data: { requestId, eventType: "NO_PROVIDER_AVAILABLE" },
    });
    return;
  }

  const top = candidates.slice(0, maxProviders);
  await prisma.$transaction([
    prisma.serviceRequest.update({ where: { id: requestId }, data: { status: "MATCHING" } }),
    prisma.requestMatch.createMany({
      data: top.map((entry, index) => ({
        requestId,
        providerId: entry.provider.id,
        rank: index,
        distanceKm: entry.distanceKm,
      })),
    }),
  ]);

  await dispatchNext(requestId);
}

// Sends the request to the next PENDING match in rank order.
export async function dispatchNext(requestId) {
  const next = await prisma.requestMatch.findFirst({
    where: { requestId, status: "PENDING" },
    orderBy: { rank: "asc" },
    include: { provider: true },
  });

  if (!next) {
    await prisma.serviceRequest.update({ where: { id: requestId }, data: { status: "FAILED" } });
    await prisma.requestEvent.create({ data: { requestId, eventType: "NO_PROVIDER_AVAILABLE" } });
    return null;
  }

  const updated = await prisma.requestMatch.update({
    where: { id: next.id },
    data: { status: "SENT", sentAt: new Date() },
  });

  await notify(next.provider.userId, "new_request_available", { requestId }, "PUSH");
  return updated;
}

export async function acceptMatch(matchId, providerUserId) {
  const match = await prisma.requestMatch.findUnique({
    where: { id: matchId },
    include: { provider: true, request: true },
  });
  if (!match) throw ApiError.notFound("Match not found");
  if (match.provider.userId !== providerUserId) throw ApiError.forbidden();
  if (match.status !== "SENT") throw ApiError.conflict("This request is no longer available to you");

  const job = await prisma.$transaction(async (tx) => {
    await tx.requestMatch.update({
      where: { id: matchId },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
    await tx.requestMatch.updateMany({
      where: { requestId: match.requestId, id: { not: matchId }, status: { in: ["PENDING", "SENT"] } },
      data: { status: "CANCELLED" },
    });
    await tx.serviceRequest.update({ where: { id: match.requestId }, data: { status: "ACCEPTED" } });
    await tx.requestEvent.create({
      data: { requestId: match.requestId, eventType: "PROVIDER_ACCEPTED", payload: { providerId: match.providerId } },
    });
    return createJobFromMatch(tx, match);
  });

  await track("PROVIDER_ACCEPTED", {
    userId: providerUserId,
    properties: { requestId: match.requestId, jobId: job.id },
  });
  await notify(match.request.customerId, "provider_accepted", { requestId: match.requestId });

  return job;
}

export async function declineMatch(matchId, providerUserId) {
  const match = await prisma.requestMatch.findUnique({
    where: { id: matchId },
    include: { provider: true },
  });
  if (!match) throw ApiError.notFound("Match not found");
  if (match.provider.userId !== providerUserId) throw ApiError.forbidden();
  if (match.status !== "SENT") throw ApiError.conflict("This match cannot be declined");

  await prisma.requestMatch.update({
    where: { id: matchId },
    data: { status: "DECLINED", respondedAt: new Date() },
  });
  await track("PROVIDER_DECLINED", { userId: providerUserId, properties: { requestId: match.requestId } });

  return dispatchNext(match.requestId);
}
