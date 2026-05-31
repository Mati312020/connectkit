import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/logger.server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const availabilitySchema = z.array(
  z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isAvailable: z.boolean(),
  })
);

// GET /api/availability?providerId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get("providerId");

  if (!providerId) {
    return NextResponse.json({ error: "providerId requerido" }, { status: 400 });
  }

  const availability = await prisma.availability.findMany({
    where: { providerId },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json({ availability });
}

// PUT /api/availability — actualiza la disponibilidad del proveedor autenticado
export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = availabilitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { providerProfile: true },
  });

  if (!dbUser?.providerProfile) {
    return NextResponse.json({ error: "Perfil de proveedor no encontrado" }, { status: 404 });
  }

  // Reemplazar toda la disponibilidad en una transacción
  await prisma.$transaction([
    prisma.availability.deleteMany({
      where: { providerId: dbUser.providerProfile.id },
    }),
    prisma.availability.createMany({
      data: parsed.data.map((slot) => ({
        ...slot,
        providerId: dbUser.providerProfile!.id,
      })),
    }),
  ]);

  const availableDays = parsed.data.filter((s) => s.isAvailable).length;

  logServerEvent("AVAILABILITY_UPDATED", {
    userId:   dbUser.id,
    metadata: {
      providerId:    dbUser.providerProfile.id,
      totalSlots:    parsed.data.length,
      availableDays,
      unavailableDays: parsed.data.length - availableDays,
    },
  });

  return NextResponse.json({ success: true });
}
