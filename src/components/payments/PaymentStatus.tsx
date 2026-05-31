import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/types";

const STATUS_CONFIG: Record<PaymentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pendiente", variant: "secondary" },
  PROCESSING: { label: "Procesando", variant: "secondary" },
  APPROVED: { label: "Aprobado", variant: "default" },
  REJECTED: { label: "Rechazado", variant: "destructive" },
  REFUNDED: { label: "Reembolsado", variant: "outline" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, variant } = STATUS_CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
