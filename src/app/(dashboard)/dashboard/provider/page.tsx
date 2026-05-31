import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { EarningsCard } from "@/components/payments/EarningsCard";
import { Calendar, Star, DollarSign } from "lucide-react";
import { appConfig } from "@/config/app.config";
import { calculateProviderNet, formatCurrency } from "@/lib/utils";
import prisma from "@/lib/prisma";
import type { BookingStatus } from "@/types";

export default async function ProviderDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      providerProfile: true,
      bookingsAsProvider: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!dbUser) redirect("/login");

  const completedBookings = dbUser.bookingsAsProvider.filter(
    (b) => b.status === "COMPLETED"
  );
  const grossAmount = completedBookings.reduce((sum, b) => sum + b.baseAmount, 0);
  const { net: netAmount } = calculateProviderNet(grossAmount);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mi panel</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Reservas totales"
          value={dbUser.bookingsAsProvider.length}
          icon={Calendar}
        />
        <StatsCard
          title="Calificación"
          value={dbUser.providerProfile?.rating.toFixed(1) ?? "—"}
          description={`${dbUser.providerProfile?.totalReviews ?? 0} reseñas`}
          icon={Star}
        />
        <StatsCard
          title="Ingresos netos"
          value={formatCurrency(netAmount)}
          icon={DollarSign}
          description="Total histórico"
        />
      </div>

      <EarningsCard
        grossAmount={grossAmount}
        netAmount={netAmount}
        bookingsCount={completedBookings.length}
      />

      <RecentBookings bookings={dbUser.bookingsAsProvider as any} />
    </div>
  );
}
