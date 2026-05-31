import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBookingSchema } from "@/lib/validations/booking";
import { calculateClientTotal } from "@/lib/utils";
import { appConfig } from "@/config/app.config";
import { logServerEvent } from "@/lib/logger.server";
import prisma from "@/lib/prisma";

// GET /api/bookings — lista las reservas del usuario autenticado
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      bookingsAsClient: { orderBy: { createdAt: "desc" }, take: 50 },
      bookingsAsProvider: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  return NextResponse.json({ bookings: dbUser });
}

// POST /api/bookings — crea una nueva reserva
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { providerId, startDateTime, endDateTime, notes } = parsed.data;

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  // Calcular montos con comisiones
  const baseAmount = Math.round(appConfig.pricing.baseHourlyRate * totalHours * 100);
  const { fee: clientFee, total: totalAmount } = calculateClientTotal(baseAmount);
  const providerFee = Math.round(baseAmount * (appConfig.commissions.provider / 100));

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const booking = await prisma.booking.create({
    data: {
      clientId: dbUser.id,
      providerId,
      startDateTime: start,
      endDateTime: end,
      totalHours,
      baseAmount,
      clientFee,
      providerFee,
      totalAmount,
      notes,
    },
  });

  // Log fire-and-forget — no bloquea la respuesta
  logServerEvent("BOOKING_CREATED", {
    userId: dbUser.id,
    metadata: { bookingId: booking.id, providerId, totalHours, totalAmount },
  });

  return NextResponse.json({ booking }, { status: 201 });
}
