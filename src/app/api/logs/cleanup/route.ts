import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/logger.server";
import { appConfig } from "@/config/app.config";
import prisma from "@/lib/prisma";

// POST /api/logs/cleanup — elimina logs según la retención configurada
// Puede invocarse manualmente desde el admin o via cron job externo
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Obtener retentionMonths del body (override del admin) o usar el default del config
  let retentionMonths: number = appConfig.logs.retentionMonths;
  try {
    const body = await request.json();
    if (typeof body.retentionMonths === "number" && body.retentionMonths >= 0) {
      retentionMonths = body.retentionMonths;
    }
  } catch {
    // Sin body → usar config default
  }

  // 0 = conservar todo indefinidamente
  if (retentionMonths === 0) {
    return NextResponse.json({
      deleted: 0,
      message: "Retención configurada como indefinida (0 meses). No se eliminaron registros.",
    });
  }

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

  const { count } = await prisma.activityLog.deleteMany({
    where: { createdAt: { lt: cutoffDate } },
  });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });

  await logServerEvent("ADMIN_LOGS_CLEANUP", {
    userId: dbUser?.id,
    metadata: {
      deletedCount: count,
      retentionMonths,
      cutoffDate: cutoffDate.toISOString(),
    },
    source: "SYSTEM",
  });

  return NextResponse.json({
    deleted: count,
    retentionMonths,
    cutoffDate: cutoffDate.toISOString(),
    message: `Se eliminaron ${count} registros anteriores a ${cutoffDate.toLocaleDateString("es-AR")}.`,
  });
}
