import { z } from "zod";

export const initiatePaymentSchema = z.object({
  jobId: z.string().min(1),
  method: z.enum(["CASH", "MOBILE_MONEY", "CARD", "BANK_TRANSFER"]),
});
