import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { getSetting } from "../settings/settings.service.js";
import { estimatePrice } from "../services/pricing.engine.js";
import { track } from "../../modules/analytics/analytics.service.js";
import { startMatching } from "../matching/matching.engine.js";

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

export async function listMine(customerId, { skip, take } = {}) {
  const where = { customerId };
  const [rows, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      include: { service: true, address: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.serviceRequest.count({ where }),
  ]);
  return { rows, total };
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
