import { Payment } from "mercadopago";
import { mpClient } from "./client";

export type MPWebhookPayload = {
  action: string;
  api_version: string;
  data: { id: string };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: "payment" | "subscription_preapproval" | string;
  user_id: string;
};

// Obtiene los detalles completos del pago desde la API de MP
export async function getPaymentDetails(paymentId: string) {
  const paymentClient = new Payment(mpClient);
  return paymentClient.get({ id: paymentId });
}

// Verifica la firma HMAC del webhook para evitar llamadas fraudulentas
export function verifyWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): boolean {
  // MP envía: ts=<timestamp>,v1=<hash>
  // Arma el manifest: "id:<dataId>;request-id:<xRequestId>;ts:<ts>;"
  const parts = xSignature.split(",");
  const tsPart = parts.find((p) => p.startsWith("ts="));
  const v1Part = parts.find((p) => p.startsWith("v1="));
  if (!tsPart || !v1Part) return false;

  const ts = tsPart.replace("ts=", "");
  const v1 = v1Part.replace("v1=", "");
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const crypto = require("crypto");
  const expectedHash = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return expectedHash === v1;
}
