import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

export async function getOrCreateWallet(userId, currency = "TZS") {
  const existing = await prisma.wallet.findUnique({ where: { userId_currency: { userId, currency } } });
  if (existing) return existing;
  return prisma.wallet.create({ data: { userId, currency } });
}

export async function credit(userId, amount, { reference, description } = {}, currency = "TZS") {
  const wallet = await getOrCreateWallet(userId, currency);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        amount,
        balanceAfter: updated.balance,
        reference,
        description,
      },
    });
    return updated;
  });
}

export async function debit(userId, amount, { reference, description } = {}, currency = "TZS") {
  const wallet = await getOrCreateWallet(userId, currency);
  if (Number(wallet.balance) < amount) throw ApiError.conflict("Insufficient wallet balance");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "DEBIT",
        amount,
        balanceAfter: updated.balance,
        reference,
        description,
      },
    });
    return updated;
  });
}

export async function listTransactions(userId, { skip, take } = {}) {
  const wallet = await getOrCreateWallet(userId);
  const [rows, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
  ]);
  return { rows, total, wallet };
}
