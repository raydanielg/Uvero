import { z } from "zod";

export const createQuoteSchema = z.object({
  amount: z.number().positive(),
  note: z.string().trim().max(500).optional(),
  validUntil: z.coerce.date().optional(),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(200),
        quantity: z.number().int().positive().default(1),
        unitPrice: z.number().nonnegative(),
      }),
    )
    .default([]),
});

export const respondQuoteSchema = z.object({
  accept: z.boolean(),
});
