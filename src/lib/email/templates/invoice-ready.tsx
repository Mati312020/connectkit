import * as React from "react";
import { appConfig } from "@/config/app.config";

interface InvoiceReadyProps {
  clientName: string;
  cae: string;
  voucherNumber: number;
  totalAmount: number;
  pdfUrl: string;
}

export function InvoiceReadyEmail({
  clientName,
  cae,
  voucherNumber,
  totalAmount,
  pdfUrl,
}: InvoiceReadyProps) {
  const formattedAmount = new Intl.NumberFormat(appConfig.currency.locale, {
    style: "currency",
    currency: appConfig.currency.code,
  }).format(totalAmount);

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ color: appConfig.theme.primaryColor }}>
        Tu comprobante está listo
      </h1>
      <p>Hola {clientName},</p>
      <p>Generamos el comprobante fiscal correspondiente a tu pago.</p>
      <div
        style={{
          background: "#f5f5f5",
          padding: 16,
          borderRadius: 8,
          margin: "16px 0",
        }}
      >
        <p>
          <strong>Nº comprobante:</strong> {voucherNumber}
        </p>
        <p>
          <strong>CAE:</strong> {cae}
        </p>
        <p>
          <strong>Total:</strong> {formattedAmount}
        </p>
      </div>
      <a
        href={pdfUrl}
        style={{
          display: "inline-block",
          background: appConfig.theme.primaryColor,
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 6,
          textDecoration: "none",
        }}
      >
        Descargar comprobante PDF
      </a>
      <hr />
      <p style={{ color: "#999", fontSize: 12 }}>{appConfig.name}</p>
    </div>
  );
}
