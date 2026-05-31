import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookingCard } from "@/components/booking/BookingCard";
import { CheckoutButton } from "@/components/payments/CheckoutButton";
import { InvoiceButton } from "@/components/invoicing/InvoiceButton";
import prisma from "@/lib/prisma";

export default async function ClientBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { clientId: dbUser.id },
    include: { payment: true, invoice: true },
    orderBy: { startDateTime: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mis reservas</h1>
      {bookings.length === 0 ? (
        <p className="text-muted-foreground">No tenés reservas aún.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b as any}
              actions={
                <div className="flex gap-2 flex-wrap">
                  {b.status === "PENDING" && !b.payment && (
                    <CheckoutButton bookingId={b.id} />
                  )}
                  {b.payment?.status === "APPROVED" && !b.invoice && (
                    <InvoiceButton bookingId={b.id} />
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
