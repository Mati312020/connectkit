import * as React from "react";
import { appConfig } from "@/config/app.config";
import { formatDate } from "@/lib/utils";

interface BookingConfirmedProps {
  clientName: string;
  providerName: string;
  startDateTime: Date;
  totalAmount: number;
  bookingId: string;
}

export function BookingConfirmedEmail({
  clientName,
  providerName,
  startDateTime,
  totalAmount,
  bookingId,
}: BookingConfirmedProps) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ color: appConfig.theme.primaryColor }}>
        ¡Reserva confirmada!
      </h1>
      <p>Hola {clientName},</p>
      <p>
        Tu reserva con {providerName} ha sido confirmada y el pago procesado.
      </p>
      <div
        style={{
          background: "#f5f5f5",
          padding: 16,
          borderRadius: 8,
          margin: "16px 0",
        }}
      >
        <p>
          <strong>Fecha:</strong> {formatDate(startDateTime)}
        </p>
        <p>
          <strong>Total abonado:</strong>{" "}
          {new Intl.NumberFormat(appConfig.currency.locale, {
            style: "currency",
            currency: appConfig.currency.code,
          }).format(totalAmount / 100)}
        </p>
        <p>
          <strong>N° de reserva:</strong> {bookingId.slice(0, 8).toUpperCase()}
        </p>
      </div>
      <p>
        Podés ver el detalle completo en{" "}
        <a href={`${appConfig.url}/dashboard/client/bookings`}>tu panel</a>.
      </p>
      <hr />
      <p style={{ color: "#999", fontSize: 12 }}>
        {appConfig.name} — {appConfig.tagline}
      </p>
    </div>
  );
}
