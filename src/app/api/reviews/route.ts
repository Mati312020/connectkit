import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/logger.server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const reviewSchema = z.object({
  bookingId:  z.string().cuid(),
  providerId: z.string().cuid(),
  rating:     z.number().int().min(1).max(5),
  comment:    z.string().max(1000).optional(),
});

// POST /api/reviews — el cliente califica una reserva completada
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body   = await request.json();
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { bookingId, providerId, rating, comment } = parsed.data;

  // Verificar que la reserva esté completada y pertenezca al usuario
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });

  if (!booking || booking.clientId !== dbUser.id) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  if (booking.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Solo podés calificar reservas completadas" },
      { status: 400 }
    );
  }

  if (booking.review) {
    return NextResponse.json({ error: "Ya calificaste esta reserva" }, { status: 409 });
  }

  // Crear la reseña
  const review = await prisma.review.create({
    data: { bookingId, providerId, rating, comment },
  });

  // Actualizar rating promedio del proveedor en una transacción
  const allReviews = await prisma.review.findMany({
    where: { providerId },
    select: { rating: true },
  });

  const avgRating    = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  const totalReviews = allReviews.length;

  await prisma.providerProfile.update({
    where: { id: providerId },
    data: { rating: avgRating, totalReviews },
  });

  logServerEvent("REVIEW_SUBMITTED", {
    userId:   dbUser.id,
    metadata: {
      reviewId:     review.id,
      bookingId,
      providerId,
      rating,
      hasComment:   !!comment,
      newAvgRating: Math.round(avgRating * 10) / 10,
      totalReviews,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
