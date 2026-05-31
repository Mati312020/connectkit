import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { Calendar, CheckCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { appConfig } from "@/config/app.config";
import prisma from "@/lib/prisma";

export default async function ClientDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      bookingsAsClient: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!dbUser) redirect("/login");

  const confirmed = dbUser.bookingsAsClient.filter((b) => b.status === "CONFIRMED").length;
  const total = dbUser.bookingsAsClient.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bienvenido, {dbUser.name?.split(" ")[0] ?? ""}!</h1>
        <Link href="/dashboard/client/search" className={buttonVariants()}>
          Buscar {appConfig.roles.provider.plural}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatsCard
          title="Reservas totales"
          value={total}
          icon={Calendar}
        />
        <StatsCard
          title="Reservas activas"
          value={confirmed}
          icon={CheckCircle}
          description="Confirmadas"
        />
      </div>

      <RecentBookings bookings={dbUser.bookingsAsClient as any} />
    </div>
  );
}
