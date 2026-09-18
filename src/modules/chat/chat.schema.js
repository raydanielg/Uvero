import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.string().trim().max(2000).optional(),
  attachmentUrl: z.string().url().optional(),
});
