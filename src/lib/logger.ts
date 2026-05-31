// Logger cliente — fire-and-forget, nunca lanza excepciones
// Usar en componentes "use client" y en el browser

export type LogEventType =
  // Auth
  | "USER_REGISTER"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_PASSWORD_RESET"
  // Perfil
  | "PROFILE_UPDATED"
  | "AVAILABILITY_UPDATED"
  | "PROVIDER_VERIFIED"
  // Reservas
  | "BOOKING_CREATED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_COMPLETED"
  | "BOOKING_REFUNDED"
  // Pagos
  | "PAYMENT_INITIATED"
  | "PAYMENT_APPROVED"
  | "PAYMENT_REJECTED"
  | "PAYMENT_REFUNDED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_CANCELLED"
  // Facturación
  | "INVOICE_EMITTED"
  | "INVOICE_ERROR"
  | "PDF_GENERATED"
  | "PDF_ERROR"
  // Reseñas
  | "REVIEW_SUBMITTED"
  // Onboarding
  | "ONBOARDING_COMPLETED"
  // Admin
  | "ADMIN_LOGIN"
  | "ADMIN_USER_STATUS_CHANGED"
  | "ADMIN_SETTINGS_UPDATED"
  | "ADMIN_LOGS_CLEANUP"
  // Sistema
  | "WEBHOOK_RECEIVED"
  | "EMAIL_SENT"
  | "EMAIL_ERROR"
  | "SYSTEM_ERROR";

export function logEvent(
  type: LogEventType,
  metadata?: Record<string, unknown>
): void {
  fetch("/api/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, metadata: metadata ?? {} }),
  }).catch(() => {
    // Silencioso — el logging nunca interrumpe el flujo principal
  });
}
