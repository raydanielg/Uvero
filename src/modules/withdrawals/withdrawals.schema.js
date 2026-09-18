import { z } from "zod";

export const payoutAccountSchema = z.object({
  type: z.enum(["MOBILE_MONEY", "BANK"]),
  accountName: z.string().trim().min(2).max(120),
  accountNumber: z.string().trim().min(4).max(40),
  bankOrNetwork: z.string().trim().min(2).max(80),
  isDefault: z.boolean().default(false),
});

export const requestWithdrawalSchema = z.object({
  amount: z.number().positive(),
  payoutAccountId: z.string().min(1),
});

export const rejectWithdrawalSchema = z.object({
  note: z.string().trim().max(500).optional(),
});
