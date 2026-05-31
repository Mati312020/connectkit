import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InvoiceDownload } from "./InvoiceDownload";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types";

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pendiente", variant: "secondary" },
  EMITTED: { label: "Emitida", variant: "default" },
  ERROR: { label: "Error", variant: "destructive" },
  CANCELLED: { label: "Anulada", variant: "outline" },
};

export function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const { label, variant } = STATUS_CONFIG[invoice.status];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium">
            Comprobante #{invoice.voucherNumber ?? "—"}
          </CardTitle>
          {invoice.emittedAt && (
            <p className="text-xs text-muted-foreground">
              {formatDate(invoice.emittedAt)}
            </p>
          )}
        </div>
        <Badge variant={variant}>{label}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm">
          {invoice.cae && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">CAE</span>
              <span className="font-mono text-xs">{invoice.cae}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">{formatCurrency(invoice.totalAmount * 100)}</span>
          </div>
        </div>
        {invoice.pdfUrl && (
          <div className="mt-3">
            <InvoiceDownload invoiceId={invoice.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
