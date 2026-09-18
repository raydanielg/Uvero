import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { getGateway } from "../../providers/payments/gateways.js";
import { getSetting } from "../settings/settings.service.js";
import { credit as creditWallet } from "../wallets/wallets.service.js";
import { track } from "../analytics/analytics.service.js";

const METHOD_TO_GATEWAY_CODE = {
  CASH: "cash",
  MOBILE_MONEY: "mock",
  CARD: "mock",
  BANK_TRANSFER: "mock",
};

export async function initiatePayment(jobId, customerId, method) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { request: true, provider: true },
  });
  if (!job) throw ApiError.notFound("Job not found");
  if (job.customerId !== customerId) throw ApiError.forbidden();

  const amount = Number(job.request.finalPrice ?? job.request.estimatedPrice ?? 0);
  if (amount <= 0) throw ApiError.conflict("This job has no payable amount yet");

  const gatewayCode = METHOD_TO_GATEWAY_CODE[method];
  const gateway = getGateway(gatewayCode);
  if (!gateway) throw ApiError.badRequest(`Payment method ${method} is not available`);

  if (gatewayCode !== "cash") {
    const integration = await prisma.integrationConfig.findUnique({ where: { code: gatewayCode } });
    if (!integration?.isEnabled) throw ApiError.badRequest(`Payment method ${method} is not enabled`);
  }

  const idempotencyKey = crypto.randomUUID();
  const payment = await prisma.payment.create({
    data: { jobId, customerId, amount, method, idempotencyKey, status: "PROCESSING" },
  });

  const result = await gateway.charge({ amount, currency: "TZS", reference: payment.id });

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: result.status, providerReference: result.providerReference },
  });
  await prisma.paymentTransaction.create({
    data: { paymentId: payment.id, type: "CHARGE", amount, status: result.status, rawResponse: result.raw },
  });

  if (result.status === "COMPLETED") {
    await settleToProviderWallet(job.provider.userId, amount, payment.id);
    await track("PAYMENT_COMPLETED", { userId: customerId, properties: { jobId, paymentId: payment.id } });
  }

  return updated;
}

async function settleToProviderWallet(providerUserId, amount, paymentReference) {
  const commissionPercent = await getSetting("pricing.platform_commission", 10);
  const net = Math.round(amount * (1 - commissionPercent / 100));
  await creditWallet(providerUserId, net, {
    reference: paymentReference,
    description: `Job payment (commission ${commissionPercent}%)`,
  });
}

export async function handleWebhook(gatewayCode, payload, signatureValid) {
  await prisma.paymentWebhookLog.create({
    data: { integrationCode: gatewayCode, eventType: payload?.event, payloadRaw: payload, signatureValid },
  });
  if (!signatureValid) throw ApiError.unauthorized("Invalid webhook signature");

  const payment = await prisma.payment.findFirst({
    where: { providerReference: payload.providerReference },
    include: { job: { include: { provider: true } } },
  });
  if (!payment) return;

  const status = payload.status ?? "COMPLETED";
  await prisma.payment.update({ where: { id: payment.id }, data: { status } });
  await prisma.paymentTransaction.create({
    data: { paymentId: payment.id, type: "CHARGE", amount: payment.amount, status, rawResponse: payload },
  });

  if (status === "COMPLETED" && payment.status !== "COMPLETED") {
    await settleToProviderWallet(payment.job.provider.userId, Number(payment.amount), payment.id);
  }
}

export async function getPayment(id) {
  const payment = await prisma.payment.findUnique({ where: { id }, include: { transactions: true } });
  if (!payment) throw ApiError.notFound("Payment not found");
  return payment;
}
