import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

// GET /api/facturacion/consultar?bookingId=xxx
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");

  if (!bookingId) {
    return NextResponse.json({ error: "bookingId requerido" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { bookingId },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ invoice });
}
