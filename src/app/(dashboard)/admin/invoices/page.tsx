import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InvoiceDownload } from "@/components/invoicing/InvoiceDownload";
import { formatCurrency, formatDate } from "@/lib/utils";
import prisma from "@/lib/prisma";

export default async function AdminInvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const invoices = await prisma.invoice.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Comprobantes ARCA</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>CAE</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell>{inv.voucherNumber ?? "—"}</TableCell>
                <TableCell>{inv.user.name || inv.user.email}</TableCell>
                <TableCell>{formatCurrency(inv.totalAmount * 100)}</TableCell>
                <TableCell className="font-mono text-xs">{inv.cae ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={inv.status === "EMITTED" ? "default" : "secondary"}>
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {inv.emittedAt ? formatDate(inv.emittedAt) : "—"}
                </TableCell>
                <TableCell>
                  {inv.pdfUrl && <InvoiceDownload invoiceId={inv.id} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
