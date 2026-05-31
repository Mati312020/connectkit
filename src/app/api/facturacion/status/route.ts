import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkWSFEStatus } from "@/lib/arca/consultar";
import { appConfig } from "@/config/app.config";

// GET /api/facturacion/status — verifica la conexión con ARCA
// Útil para el panel de admin antes de emitir comprobantes
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!appConfig.arca.enabled) {
    return NextResponse.json({
      enabled: false,
      message: "ARCA no está habilitada. Configurar ARCA_ENABLED=true en las variables de entorno.",
    });
  }

  try {
    const status = await checkWSFEStatus();
    return NextResponse.json({
      enabled:     true,
      environment: appConfig.arca.environment,
      cuit:        appConfig.arca.cuit,
      puntoVenta:  appConfig.arca.puntoVenta,
      wsfe:        status,
      ok:          status.appServer === "OK" && status.dbServer === "OK" && status.authServer === "OK",
    });
  } catch (error) {
    return NextResponse.json(
      {
        enabled: true,
        ok:      false,
        error:   error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 503 }
    );
  }
}
