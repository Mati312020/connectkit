import { Preference } from "mercadopago";
import { mpClient } from "./client";
import { appConfig } from "@/config/app.config";

export async function createBookingPreference(params: {
  bookingId: string;
  totalAmount: number; // en centavos ARS
  clientEmail: string;
  description: string;
}) {
  const preference = new Preference(mpClient);

  const response = await preference.create({
    body: {
      items: [
        {
          id: params.bookingId,
          title: params.description,
          quantity: 1,
          unit_price: params.totalAmount / 100, // centavos → pesos
          currency_id: appConfig.currency.code,
        },
      ],
      payer: {
        email: params.clientEmail,
      },
      back_urls: {
        success: `${appConfig.url}${appConfig.mercadopago.successUrl}`,
        failure: `${appConfig.url}${appConfig.mercadopago.failureUrl}`,
        pending: `${appConfig.url}${appConfig.mercadopago.pendingUrl}`,
      },
      auto_return: "approved",
      external_reference: params.bookingId,
      notification_url: `${appConfig.url}/api/mercadopago/webhook`,
    },
  });

  return response;
}
