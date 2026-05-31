import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { Users, Calendar, DollarSign, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import prisma from "@/lib/prisma";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [totalUsers, totalBookings, approvedPayments, totalInvoices] = await Promise.all([
    prisma.user.count(),
    prisma.booking.count(),
    prisma.payment.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
    prisma.invoice.count({ where: { status: "EMITTED" } }),
  ]);

  const recentBookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const totalRevenue = approvedPayments._sum.amount ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Usuarios totales"
          value={totalUsers}
          icon={Users}
          description="Clientes y proveedores"
        />
        <StatsCard
          title="Reservas totales"
          value={totalBookings}
          icon={Calendar}
        />
        <StatsCard
          title="Ingresos (aprobados)"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
        />
        <StatsCard
          title="Comprobantes emitidos"
          value={totalInvoices}
          icon={FileText}
        />
      </div>

      <RecentBookings bookings={recentBookings as any} title="Últimas reservas" />
    </div>
  );
}
