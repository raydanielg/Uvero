import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { notify } from "../notifications/notifications.service.js";

export async function createQuote(requestId, providerUserId, { amount, note, validUntil, items = [] }) {
  const provider = await prisma.providerProfile.findUnique({ where: { userId: providerUserId } });
  if (!provider) throw ApiError.badRequest("Provider profile not found");

  const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!request) throw ApiError.notFound("Request not found");

  const quote = await prisma.quote.create({
    data: {
      requestId,
      providerId: provider.id,
      amount,
      note,
      validUntil,
      status: "SENT",
      items: { create: items.map((item) => ({ ...item, total: item.quantity * item.unitPrice })) },
    },
    include: { items: true },
  });

  await notify(request.customerId, "quote_received", { requestId, amount });
  return quote;
}

export async function listForRequest(requestId) {
  return prisma.quote.findMany({
    where: { requestId },
    include: { items: true, provider: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function respondToQuote(quoteId, customerId, accept) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include: { request: true } });
  if (!quote) throw ApiError.notFound("Quote not found");
  if (quote.request.customerId !== customerId) throw ApiError.forbidden();
  if (quote.status !== "SENT") throw ApiError.conflict("This quote has already been resolved");

  const updated = await prisma.quote.update({
    where: { id: quoteId },
    data: { status: accept ? "ACCEPTED" : "REJECTED" },
  });

  if (accept) {
    await prisma.serviceRequest.update({
      where: { id: quote.requestId },
      data: { estimatedPrice: quote.amount },
    });
  }

  return updated;
}
