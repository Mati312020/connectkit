import { MercadoPagoConfig } from "mercadopago";
import { appConfig } from "@/config/app.config";

// Instancia singleton — reutilizada en todas las operaciones MP
export const mpClient = new MercadoPagoConfig({
  accessToken: appConfig.mercadopago.accessToken,
  options: { timeout: 5000 },
});
