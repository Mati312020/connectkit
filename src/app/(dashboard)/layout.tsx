import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import prisma from "@/lib/prisma";
import type { UserRole } from "@/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where:  { supabaseId: user.id },
    select: { role: true, name: true, email: true, avatarUrl: true },
  });

  if (!dbUser) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={dbUser.role as UserRole}
        userName={dbUser.name || dbUser.email}
        avatarUrl={dbUser.avatarUrl}
      />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
