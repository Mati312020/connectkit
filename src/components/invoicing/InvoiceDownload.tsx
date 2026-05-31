import { buttonVariants } from "@/components/ui/button";
import { Download } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function InvoiceDownload({ invoiceId }: { invoiceId: string }) {
  return (
    <Link
      href={`/api/facturacion/pdf?invoiceId=${invoiceId}`}
      target="_blank"
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
    >
      <Download className="h-3 w-3" />
      Descargar PDF
    </Link>
  );
}
