import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookingCard } from "@/components/booking/BookingCard";
import prisma from "@/lib/prisma";
import type { BookingStatus } from "@/types";

export default async function ProviderBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { providerId: dbUser.id },
    include: { client: true },
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
            <BookingCard key={b.id} booking={b as any} />
          ))}
        </div>
      )}
    </div>
  );
}
