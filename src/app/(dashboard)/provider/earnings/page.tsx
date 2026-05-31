import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EarningsCard } from "@/components/payments/EarningsCard";
import { calculateProviderNet } from "@/lib/utils";
import prisma from "@/lib/prisma";

export default async function ProviderEarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) redirect("/login");

  const completedBookings = await prisma.booking.findMany({
    where: { providerId: dbUser.id, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });

  const grossAmount = completedBookings.reduce((sum, b) => sum + b.baseAmount, 0);
  const { net: netAmount } = calculateProviderNet(grossAmount);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mis ingresos</h1>
      <div className="max-w-sm">
        <EarningsCard
          grossAmount={grossAmount}
          netAmount={netAmount}
          bookingsCount={completedBookings.length}
          period="Total histórico"
        />
      </div>
    </div>
  );
}
