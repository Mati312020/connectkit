import { z } from "zod";

export const createPaymentSchema = z.object({
  bookingId: z.string().cuid(),
});

export const webhookPayloadSchema = z.object({
  action: z.string(),
  api_version: z.string(),
  data: z.object({ id: z.string() }),
  type: z.string(),
  live_mode: z.boolean(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
