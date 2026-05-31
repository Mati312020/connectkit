import * as React from "react";
import { appConfig } from "@/config/app.config";

interface PaymentReceivedProps {
  providerName: string;
  clientName: string;
  amount: number;        // neto que recibe el proveedor (ya descontada comisión)
  bookingDate: Date;
}

export function PaymentReceivedEmail({
  providerName,
  clientName,
  amount,
  bookingDate,
}: PaymentReceivedProps) {
  const formattedAmount = new Intl.NumberFormat(appConfig.currency.locale, {
    style: "currency",
    currency: appConfig.currency.code,
  }).format(amount / 100);

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ color: appConfig.theme.primaryColor }}>
        Recibiste un pago
      </h1>
      <p>Hola {providerName},</p>
      <p>
        {clientName} pagó su reserva. Acreditaremos{" "}
        <strong>{formattedAmount}</strong> en tu cuenta.
      </p>
      <p style={{ color: "#666", fontSize: 13 }}>
        * El importe ya tiene descontada la comisión de la plataforma (
        {appConfig.commissions.provider}%).
      </p>
      <p>
        Ver detalle en{" "}
        <a href={`${appConfig.url}/dashboard/provider/earnings`}>mis ingresos</a>.
      </p>
      <hr />
      <p style={{ color: "#999", fontSize: 12 }}>{appConfig.name}</p>
    </div>
  );
}
