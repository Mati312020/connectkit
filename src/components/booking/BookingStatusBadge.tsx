import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/types";

const STATUS_CONFIG: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pendiente", variant: "secondary" },
  CONFIRMED: { label: "Confirmada", variant: "default" },
  IN_PROGRESS: { label: "En curso", variant: "default" },
  COMPLETED: { label: "Completada", variant: "outline" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
  REFUNDED: { label: "Reembolsada", variant: "outline" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, variant } = STATUS_CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
