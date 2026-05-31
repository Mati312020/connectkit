import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { appConfig } from "@/config/app.config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatea moneda usando la configuración del marketplace
export function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat(appConfig.currency.locale, {
    style: "currency",
    currency: appConfig.currency.code,
    minimumFractionDigits: 0,
  }).format(amountInCents / 100);
}

export function formatDate(date: Date | string, pattern = "d 'de' MMMM, yyyy"): string {
  return format(new Date(date), pattern, { locale: es });
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "d/MM/yyyy HH:mm", { locale: es });
}

// Calcula el total que paga el cliente incluyendo su comisión
export function calculateClientTotal(baseAmountCents: number): {
  base: number;
  fee: number;
  total: number;
} {
  const fee = Math.round(baseAmountCents * (appConfig.commissions.client / 100));
  return { base: baseAmountCents, fee, total: baseAmountCents + fee };
}

// Calcula el neto que recibe el proveedor descontando su comisión
export function calculateProviderNet(baseAmountCents: number): {
  gross: number;
  fee: number;
  net: number;
} {
  const fee = Math.round(baseAmountCents * (appConfig.commissions.provider / 100));
  return { gross: baseAmountCents, fee, net: baseAmountCents - fee };
}

// Genera un slug URL-safe a partir de un nombre
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
