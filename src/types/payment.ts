export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "APPROVED"
  | "REJECTED"
  | "REFUNDED"
  | "CANCELLED";

export type InvoiceStatus = "PENDING" | "EMITTED" | "ERROR" | "CANCELLED";

export type SubscriptionPlan = "BASIC" | "PREMIUM" | "ENTERPRISE";
export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE";

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  mpPreferenceId?: string;
  mpPaymentId?: string;
  mpStatus?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  bookingId: string;
  userId: string;
  cae?: string;
  caeExpiry?: Date;
  voucherType: number;
  voucherNumber?: number;
  puntoVenta: number;
  concept: number;
  totalAmount: number;
  currency: string;
  pdfUrl?: string;
  status: InvoiceStatus;
  emittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  mpSubscriptionId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}
