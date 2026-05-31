import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/logger.server";
import { updateBookingSchema } from "@/lib/validations/booking";
import prisma from "@/lib/prisma";

// GET /api/bookings/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { payment: true, invoice: true, review: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ booking });
}

// PUT /api/bookings/[id] — actualiza estado o notas de la reserva
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body   = await request.json();
  const parsed = updateBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Leer estado anterior para el log
  const before = await prisma.booking.findUnique({
    where:  { id },
    select: { status: true, clientId: true, providerId: true, totalAmount: true },
  });

  const booking = await prisma.booking.update({
    where: { id },
    data:  parsed.data,
  });

  // Loggear cambios de estado con el tipo de evento correcto
  if (parsed.data.status && before && parsed.data.status !== before.status) {
    const dbUser = await prisma.user.findUnique({
      where:  { supabaseId: user.id },
      select: { id: true },
    });

    const eventType =
      parsed.data.status === "CONFIRMED"  ? "BOOKING_CONFIRMED"  :
      parsed.data.status === "CANCELLED"  ? "BOOKING_CANCELLED"  :
      parsed.data.status === "COMPLETED"  ? "BOOKING_COMPLETED"  :
      parsed.data.status === "IN_PROGRESS"? "BOOKING_CONFIRMED"  : // reutilizamos
      "BOOKING_CONFIRMED"; // fallback

    logServerEvent(eventType, {
      userId:   dbUser?.id ?? before.clientId,
      metadata: {
        bookingId:   id,
        prevStatus:  before.status,
        newStatus:   parsed.data.status,
        totalAmount: before.totalAmount,
      },
    });
  }

  return NextResponse.json({ booking });
}

// DELETE /api/bookings/[id] — cancela la reserva
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const booking = await prisma.booking.update({
    where: { id },
    data:  { status: "CANCELLED" },
    select: { clientId: true, providerId: true, totalAmount: true },
  });

  const dbUser = await prisma.user.findUnique({
    where:  { supabaseId: user.id },
    select: { id: true },
  });

  logServerEvent("BOOKING_CANCELLED", {
    userId:   dbUser?.id ?? booking.clientId,
    metadata: {
      bookingId:   id,
      initiatedBy: dbUser?.id === booking.clientId ? "client" : "provider",
      totalAmount: booking.totalAmount,
    },
  });

  return NextResponse.json({ success: true });
}
