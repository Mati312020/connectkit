import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import prisma from "@/lib/prisma";
import type { BookingStatus } from "@/types";

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const bookings = await prisma.booking.findMany({
    include: { client: true, provider: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reservas</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{formatDateTime(b.startDateTime)}</TableCell>
                <TableCell>{b.client.name || b.client.email}</TableCell>
                <TableCell>{b.provider.name || b.provider.email}</TableCell>
                <TableCell>{formatCurrency(b.totalAmount)}</TableCell>
                <TableCell>
                  <BookingStatusBadge status={b.status as BookingStatus} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
