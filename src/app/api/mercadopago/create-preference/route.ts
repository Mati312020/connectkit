import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBookingPreference } from "@/lib/mercadopago/preference";
import { createPaymentSchema } from "@/lib/validations/payment";
import prisma from "@/lib/prisma";

// POST /api/mercadopago/create-preference
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "bookingId inválido" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { client: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const preference = await createBookingPreference({
    bookingId: booking.id,
    totalAmount: booking.totalAmount,
    clientEmail: booking.client.email,
    description: `Reserva #${booking.id.slice(0, 8).toUpperCase()}`,
  });

  // Guardar el ID de preferencia en el registro de pago
  await prisma.payment.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      userId: booking.clientId,
      mpPreferenceId: preference.id,
      amount: booking.totalAmount,
      currency: "ARS",
    },
    update: {
      mpPreferenceId: preference.id,
    },
  });

  return NextResponse.json({
    preferenceId: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
  });
}
