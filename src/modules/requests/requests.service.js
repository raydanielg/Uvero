import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { getSetting } from "../settings/settings.service.js";
import { estimatePrice } from "../services/pricing.engine.js";
import { track } from "../../modules/analytics/analytics.service.js";
import { startMatching } from "../matching/matching.engine.js";
import { haversineKm } from "../../core/geo/distance.js";

const ACTIVE_STATUSES = ["PENDING", "MATCHING", "MATCHED", "ACCEPTED", "IN_PROGRESS"];

export async function createRequest(customerId, { serviceId, addressId, description, urgency, scheduledAt, distanceKm }) {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId: customerId } });
  if (!address) throw ApiError.badRequest("Address does not belong to this customer");

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) throw ApiError.badRequest("Service is not available");

  const maxActive = await getSetting("customer.max_active_requests", 3);
  const activeCount = await prisma.serviceRequest.count({
    where: { customerId, status: { in: ACTIVE_STATUSES } },
  });
  if (activeCount >= maxActive) {
    throw ApiError.conflict(`You already have ${maxActive} active requests`);
  }

  const { estimatedPrice } = await estimatePrice(serviceId, { distanceKm, region: address.region });

  const request = await prisma.serviceRequest.create({
    data: {
      customerId,
      serviceId,
      addressId,
      description,
      urgency,
      scheduledAt,
      estimatedPrice,
    },
  });

  await prisma.requestEvent.create({
    data: { requestId: request.id, eventType: "REQUEST_CREATED" },
  });
  await track("REQUEST_CREATED", { userId: customerId, properties: { requestId: request.id, serviceId } });

  // Kick off matching without blocking the HTTP response on the full
  // provider-search pipeline.
  startMatching(request.id).catch((err) => console.error("startMatching failed", err));

  return request;
}

export async function getRequest(id, requesterId) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: { service: true, address: true, matches: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!request) throw ApiError.notFound("Request not found");
  if (requesterId && request.customerId !== requesterId) throw ApiError.forbidden();
  return request;
}

export async function listMine(customerId, filters = {}, { skip, take } = {}) {
  const { status, group, serviceId, search, from, to } = filters;
  const where = {
    customerId,
    ...(status ? { status } : {}),
    ...(group === "active" ? { status: { in: ACTIVE_STATUSES } } : {}),
    ...(group === "history" ? { status: { in: ["COMPLETED", "CANCELLED", "EXPIRED", "FAILED"] } } : {}),
    ...(serviceId ? { serviceId } : {}),
    ...(search
      ? {
          OR: [
            { description: { contains: search, mode: "insensitive" } },
            { service: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
  };

  const [rows, total, byStatus] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      include: {
        service: { select: { id: true, name: true, iconUrl: true } },
        address: { select: { label: true, line1: true, city: true } },
        job: {
          select: {
            id: true,
            status: true,
            provider: { select: { averageRating: true, user: { select: { name: true, avatarUrl: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.serviceRequest.count({ where }),
    prisma.serviceRequest.groupBy({ by: ["status"], where: { customerId }, _count: { status: true } }),
  ]);

  return {
    rows,
    total,
    summary: Object.fromEntries(byStatus.map((g) => [g.status, g._count.status])),
  };
}

const TRACKING_STEPS = [
  { key: "REQUESTED", label: "Request sent" },
  { key: "MATCHING", label: "Finding a provider" },
  { key: "ASSIGNED", label: "Provider assigned" },
  { key: "EN_ROUTE", label: "Provider on the way" },
  { key: "ARRIVED", label: "Provider arrived" },
  { key: "IN_PROGRESS", label: "Work in progress" },
  { key: "COMPLETED", label: "Completed" },
];
const AVERAGE_SPEED_KMH = 30;

// Everything a customer's "track my request" screen needs in one call.
export async function getTracking(id, customerId) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      service: { select: { id: true, name: true, iconUrl: true } },
      address: true,
      events: { orderBy: { createdAt: "asc" } },
      job: {
        include: {
          statusHistory: { orderBy: { createdAt: "asc" } },
          provider: {
            include: { user: { select: { name: true, phone: true, avatarUrl: true } }, location: true },
          },
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!request) throw ApiError.notFound("Request not found");
  if (request.customerId !== customerId) throw ApiError.forbidden();

  const job = request.job;
  const at = {};
  at.REQUESTED = request.createdAt;
  const matching = request.events.find((e) => e.eventType === "REQUEST_CREATED");
  if (matching) at.MATCHING = matching.createdAt;
  for (const h of job?.statusHistory ?? []) at[h.status] = at[h.status] ?? h.createdAt;

  const terminal = ["CANCELLED", "EXPIRED", "FAILED"].includes(request.status);
  const reached = job ? job.status : request.status === "PENDING" ? "REQUESTED" : "MATCHING";
  const lastReachedStep = [...(job?.statusHistory ?? [])].reverse().find((h) => TRACKING_STEPS.some((s) => s.key === h.status))?.status;
  const reachedIndex = Math.max(
    0,
    TRACKING_STEPS.findIndex((s) => s.key === (terminal || !TRACKING_STEPS.some((x) => x.key === reached) ? lastReachedStep ?? "MATCHING" : reached)),
  );
  const steps = TRACKING_STEPS.map((s, i) => ({
    ...s,
    done: i <= reachedIndex,
    current: !terminal && i === reachedIndex,
    at: at[s.key] ?? null,
  }));

  let providerInfo = null;
  let etaMinutes = null;
  if (job) {
    const p = job.provider;
    providerInfo = {
      name: p.user.name,
      phone: p.user.phone,
      avatarUrl: p.user.avatarUrl,
      averageRating: p.averageRating,
      totalJobsCompleted: p.totalJobsCompleted,
      location: p.location ? { lat: p.location.lat, lng: p.location.lng, updatedAt: p.location.updatedAt } : null,
    };
    if (p.location && ["ASSIGNED", "EN_ROUTE"].includes(job.status)) {
      const km = haversineKm(p.location.lat, p.location.lng, request.address.lat, request.address.lng);
      etaMinutes = Math.max(1, Math.round((km / AVERAGE_SPEED_KMH) * 60));
      providerInfo.distanceKm = Number(km.toFixed(2));
    }
  }

  return {
    request: {
      id: request.id,
      status: request.status,
      service: request.service,
      description: request.description,
      address: request.address,
      estimatedPrice: request.estimatedPrice,
      finalPrice: request.finalPrice,
      cancelledReason: request.cancelledReason,
      createdAt: request.createdAt,
    },
    job: job ? { id: job.id, status: job.status, startedAt: job.startedAt, completedAt: job.completedAt } : null,
    provider: providerInfo,
    etaMinutes,
    steps,
    payment: job?.payments[0] ? { status: job.payments[0].status, method: job.payments[0].method, amount: job.payments[0].amount } : null,
    canCancel: ACTIVE_STATUSES.includes(request.status) && (!job || ["ASSIGNED"].includes(job.status)),
    timeline: request.events.map((e) => ({ event: e.eventType, at: e.createdAt })),
    socket: job ? { room: `job:${job.id}`, events: ["provider:location"] } : null,
  };
}

export async function cancelRequest(id, customerId, reason) {
  const request = await getRequest(id, customerId);
  if (!ACTIVE_STATUSES.includes(request.status)) {
    throw ApiError.conflict("Only active requests can be cancelled");
  }

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data: { status: "CANCELLED", cancelledReason: reason, cancelledBy: customerId },
  });
  await prisma.requestMatch.updateMany({
    where: { requestId: id, status: { in: ["PENDING", "SENT"] } },
    data: { status: "CANCELLED" },
  });
  await prisma.requestEvent.create({
    data: { requestId: id, eventType: "REQUEST_CANCELLED", payload: { reason } },
  });
  await track("REQUEST_CANCELLED", { userId: customerId, properties: { requestId: id, reason } });

  return updated;
}
