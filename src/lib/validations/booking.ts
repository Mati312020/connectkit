import { z } from "zod";
import { appConfig } from "@/config/app.config";

export const createBookingSchema = z.object({
  providerId: z.string().cuid(),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  notes: z.string().max(500).optional(),
}).refine((data) => {
  const start = new Date(data.startDateTime);
  const end = new Date(data.endDateTime);
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return (
    hours >= appConfig.pricing.minBookingHours &&
    hours <= appConfig.pricing.maxBookingHours
  );
}, {
  message: `La reserva debe ser entre ${appConfig.pricing.minBookingHours} y ${appConfig.pricing.maxBookingHours} horas`,
});

export const updateBookingSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
