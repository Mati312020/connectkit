import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogFeed } from "@/components/dashboard/LogFeed";
import { appConfig } from "@/config/app.config";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic"; // siempre fresco — nunca cacheado

export default async function AdminLogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: appConfig.logs.maxEntriesPerPage,
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Logs del sistema</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Últimos {appConfig.logs.maxEntriesPerPage} eventos.
            Retención configurada:{" "}
            <strong>
              {(appConfig.logs.retentionMonths as number) === 0
                ? "indefinida"
                : `${appConfig.logs.retentionMonths} meses`}
            </strong>
          </p>
        </div>
      </div>

      <LogFeed
        logs={logs as any}
        retentionMonths={appConfig.logs.retentionMonths}
      />
    </div>
  );
}
