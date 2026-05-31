import { NextResponse } from "next/server";
import { getPaymentDetails, verifyWebhookSignature } from "@/lib/mercadopago/webhook";
import { appConfig } from "@/config/app.config";
import { sendEmail } from "@/lib/email/client";
import { logServerEvent } from "@/lib/logger.server";
import { BookingConfirmedEmail } from "@/lib/email/templates/booking-confirmed";
import { PaymentReceivedEmail } from "@/lib/email/templates/payment-received";
import prisma from "@/lib/prisma";
import * as React from "react";

// POST /api/mercadopago/webhook
export async function POST(request: Request) {
  const body = await request.json();

  // Verificar firma del webhook para evitar llamadas fraudulentas
  const xSignature = request.headers.get("x-signature") || "";
  const xRequestId = request.headers.get("x-request-id") || "";

  if (
    appConfig.mercadopago.webhookSecret &&
    !verifyWebhookSignature(xSignature, xRequestId, String(body.data?.id), appConfig.mercadopago.webhookSecret)
  ) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  // Log de cada webhook recibido (solo tipo payment, ignorar el resto silenciosamente)
  logServerEvent("WEBHOOK_RECEIVED", {
    metadata: { type: body.type, dataId: body.data?.id },
    source: "SYSTEM",
  });

  if (body.type !== "payment") {
    return NextResponse.json({ received: true });
  }

  const paymentDetails = await getPaymentDetails(String(body.data.id));

  if (!paymentDetails.status) {
    return NextResponse.json({ error: "Estado de pago inválido" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { mpPreferenceId: paymentDetails.external_reference || undefined },
    include: {
      booking: {
        include: {
          client: true,
          provider: true,
        },
      },
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  // Actualizar estado del pago
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      mpPaymentId: String(paymentDetails.id),
      mpStatus: paymentDetails.status,
      status: paymentDetails.status === "approved" ? "APPROVED" : "PROCESSING",
      paidAt: paymentDetails.status === "approved" ? new Date() : undefined,
    },
  });

  // Loggear el resultado del pago
  const logType = paymentDetails.status === "approved"
    ? "PAYMENT_APPROVED"
    : paymentDetails.status === "rejected"
    ? "PAYMENT_REJECTED"
    : "PAYMENT_INITIATED";

  logServerEvent(logType, {
    userId: payment.booking.clientId,
    metadata: {
      paymentId: payment.id,
      bookingId: payment.bookingId,
      mpPaymentId: String(paymentDetails.id),
      amount: payment.amount,
      mpStatus: paymentDetails.status,
    },
    source: "SYSTEM",
  });

  // Si el pago fue aprobado, confirmar la reserva y enviar emails
  if (paymentDetails.status === "approved") {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: "CONFIRMED" },
    });

    // Emails de notificación (en paralelo, sin bloquear la respuesta)
    Promise.all([
      sendEmail({
        to: payment.booking.client.email,
        subject: "¡Tu reserva fue confirmada!",
        react: React.createElement(BookingConfirmedEmail, {
          clientName: payment.booking.client.name || "Cliente",
          providerName: payment.booking.provider.name || "Proveedor",
          startDateTime: payment.booking.startDateTime,
          totalAmount: payment.amount,
          bookingId: payment.bookingId,
        }),
      }),
      sendEmail({
        to: payment.booking.provider.email,
        subject: "Recibiste un pago",
        react: React.createElement(PaymentReceivedEmail, {
          providerName: payment.booking.provider.name || "Proveedor",
          clientName: payment.booking.client.name || "Cliente",
          amount: payment.booking.baseAmount,
          bookingDate: payment.booking.startDateTime,
        }),
      }),
    ]).catch(console.error);
  }

  return NextResponse.json({ received: true });
}
