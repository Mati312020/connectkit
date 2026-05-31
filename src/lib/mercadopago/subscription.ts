import { PreApproval } from "mercadopago";
import { mpClient } from "./client";
import { appConfig } from "@/config/app.config";

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: `${appConfig.name} Basic`,
    amount: 5000,     // ARS/mes — ajustar según nicho
    frequency: 1,
    frequencyType: "months" as const,
  },
  PREMIUM: {
    name: `${appConfig.name} Premium`,
    amount: 12000,    // ARS/mes
    frequency: 1,
    frequencyType: "months" as const,
  },
} as const;

export async function createSubscription(params: {
  userId: string;
  userEmail: string;
  plan: keyof typeof SUBSCRIPTION_PLANS;
}) {
  const preApproval = new PreApproval(mpClient);
  const planConfig = SUBSCRIPTION_PLANS[params.plan];

  const response = await preApproval.create({
    body: {
      reason: planConfig.name,
      auto_recurring: {
        frequency: planConfig.frequency,
        frequency_type: planConfig.frequencyType,
        transaction_amount: planConfig.amount,
        currency_id: appConfig.currency.code,
      },
      payer_email: params.userEmail,
      back_url: `${appConfig.url}/dashboard/client`,
      external_reference: params.userId,
    },
  });

  return response;
}
