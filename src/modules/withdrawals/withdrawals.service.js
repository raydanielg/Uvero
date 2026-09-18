import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { credit as creditWallet, debit as debitWallet } from "../wallets/wallets.service.js";
import { notify } from "../notifications/notifications.service.js";
import { recordAudit } from "../../core/audit/audit.js";

export async function listPayoutAccounts(providerId) {
  return prisma.payoutAccount.findMany({ where: { providerId }, orderBy: { createdAt: "desc" } });
}

export async function addPayoutAccount(providerId, data) {
  if (data.isDefault) {
    await prisma.payoutAccount.updateMany({ where: { providerId }, data: { isDefault: false } });
  }
  return prisma.payoutAccount.create({ data: { ...data, providerId } });
}

export async function requestWithdrawal(providerUserId, { amount, payoutAccountId }) {
  const provider = await prisma.providerProfile.findUnique({ where: { userId: providerUserId } });
  if (!provider) throw ApiError.badRequest("Provider profile not found");

  const payoutAccount = await prisma.payoutAccount.findFirst({
    where: { id: payoutAccountId, providerId: provider.id },
  });
  if (!payoutAccount) throw ApiError.badRequest("Payout account not found");

  // Hold the funds immediately so the same balance can't be withdrawn twice
  // while the request is pending approval.
  await debitWallet(providerUserId, amount, { description: "Withdrawal requested (held)" });

  return prisma.withdrawal.create({
    data: { providerId: provider.id, payoutAccountId, amount },
  });
}

export async function listMine(providerId, { skip, take } = {}) {
  const where = { providerId };
  const [rows, total] = await Promise.all([
    prisma.withdrawal.findMany({ where, include: { payoutAccount: true }, orderBy: { requestedAt: "desc" }, skip, take }),
    prisma.withdrawal.count({ where }),
  ]);
  return { rows, total };
}

export async function listAll({ status } = {}, { skip, take } = {}) {
  const where = status ? { status } : {};
  const [rows, total] = await Promise.all([
    prisma.withdrawal.findMany({
      where,
      include: { payoutAccount: true, provider: { include: { user: true } } },
      orderBy: { requestedAt: "desc" },
      skip,
      take,
    }),
    prisma.withdrawal.count({ where }),
  ]);
  return { rows, total };
}

export async function approve(withdrawalId, actorId, req) {
  const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
  if (!withdrawal) throw ApiError.notFound("Withdrawal not found");
  if (withdrawal.status !== "PENDING") throw ApiError.conflict("Withdrawal already processed");

  const updated = await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: { status: "COMPLETED", processedAt: new Date(), processedBy: actorId },
  });

  const provider = await prisma.providerProfile.findUnique({ where: { id: withdrawal.providerId } });
  await notify(provider.userId, "withdrawal_approved", { amount: withdrawal.amount });
  await recordAudit({
    actorId,
    action: "APPROVED_WITHDRAWAL",
    entityType: "Withdrawal",
    entityId: withdrawalId,
    req,
  });

  return updated;
}

export async function reject(withdrawalId, actorId, note, req) {
  const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
  if (!withdrawal) throw ApiError.notFound("Withdrawal not found");
  if (withdrawal.status !== "PENDING") throw ApiError.conflict("Withdrawal already processed");

  const provider = await prisma.providerProfile.findUnique({ where: { id: withdrawal.providerId } });

  const updated = await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: { status: "REJECTED", processedAt: new Date(), processedBy: actorId, note },
  });

  // Release the hold back into the provider's wallet.
  await creditWallet(provider.userId, Number(withdrawal.amount), {
    description: "Withdrawal rejected — funds released",
  });
  await notify(provider.userId, "withdrawal_rejected", { amount: withdrawal.amount, note });
  await recordAudit({
    actorId,
    action: "REJECTED_WITHDRAWAL",
    entityType: "Withdrawal",
    entityId: withdrawalId,
    newValue: { note },
    req,
  });

  return updated;
}
