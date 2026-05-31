import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

// GET /api/facturacion/pdf?invoiceId=xxx
// Redirige a la URL del PDF en Supabase Storage o la CDN configurada
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get("invoiceId");

  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId requerido" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

  if (!invoice || !invoice.pdfUrl) {
    return NextResponse.json(
      { error: "PDF no disponible aún" },
      { status: 404 }
    );
  }

  return NextResponse.redirect(invoice.pdfUrl);
}
