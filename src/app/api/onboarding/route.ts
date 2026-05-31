import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/logger.server";
import { slugify } from "@/lib/utils";
import { z } from "zod";
import prisma from "@/lib/prisma";

const onboardingSchema = z.object({
  // Rol — requerido para usuarios nuevos que aún no están en la DB
  role: z.enum(["PROVIDER", "CLIENT"]).optional(),

  // Datos comunes
  name:  z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[\d\s\-()]{7,15}$/).optional(),

  // Solo para proveedores
  bio:        z.string().max(1000).optional(),
  categories: z.array(z.string()).optional(),
  hourlyRate: z.number().int().positive().optional(),
  location:   z.string().max(200).optional(),

  // Solo para clientes
  address: z.string().max(300).optional(),
  notes:   z.string().max(500).optional(),
});

// POST /api/onboarding — completa el perfil post-registro
// También crea el registro en la DB si es la primera vez (upsert)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body   = await request.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { role: bodyRole, name, phone, bio, categories, hourlyRate, location, address, notes } = parsed.data;

  // Upsert: crea el registro si es nuevo usuario, o actualiza si ya existe
  const dbUser = await prisma.user.upsert({
    where:  { supabaseId: user.id },
    create: {
      supabaseId: user.id,
      email:      user.email!,
      name,
      phone:      phone ?? null,
      role:       bodyRole ?? "CLIENT",
      status:     "ACTIVE",
    },
    update: {
      name,
      phone:  phone ?? null,
      status: "ACTIVE",
    },
    include: { providerProfile: true, clientProfile: true },
  });

  const effectiveRole = dbUser.role;

  if (effectiveRole === "PROVIDER") {
    const slug = await uniqueSlug(slugify(name), dbUser.id);

    if (dbUser.providerProfile) {
      await prisma.providerProfile.update({
        where: { userId: dbUser.id },
        data:  {
          bio,
          categories: categories ?? [],
          hourlyRate: hourlyRate ?? 3450,
          location:   location ?? null,
          slug,
        },
      });
    } else {
      await prisma.providerProfile.create({
        data: {
          userId:     dbUser.id,
          bio,
          categories: categories ?? [],
          hourlyRate: hourlyRate ?? 3450,
          location:   location ?? null,
          slug,
        },
      });
    }
  } else if (effectiveRole === "CLIENT") {
    if (dbUser.clientProfile) {
      await prisma.clientProfile.update({
        where: { userId: dbUser.id },
        data:  { address: address ?? null, notes: notes ?? null },
      });
    } else {
      await prisma.clientProfile.create({
        data: { userId: dbUser.id, address: address ?? null, notes: notes ?? null },
      });
    }
  }

  logServerEvent("ONBOARDING_COMPLETED", {
    userId:   dbUser.id,
    metadata: {
      role:          effectiveRole,
      isNewUser:     !dbUser.providerProfile && !dbUser.clientProfile,
      hasCategories: (categories ?? []).length > 0,
      hasLocation:   !!location,
    },
  });

  const redirectTo =
    effectiveRole === "PROVIDER" ? "/dashboard/provider" :
    effectiveRole === "ADMIN"    ? "/dashboard/admin" :
    "/dashboard/client";

  return NextResponse.json({ success: true, redirectTo });
}

// Genera un slug único — agrega sufijo numérico si ya existe
async function uniqueSlug(base: string, userId: string): Promise<string> {
  let slug    = base;
  let attempt = 0;

  // Límite de 20 intentos para evitar loops infinitos con nombres muy comunes
  while (attempt < 20) {
    const existing = await prisma.providerProfile.findUnique({
      where:  { slug },
      select: { userId: true },
    });
    if (!existing || existing.userId === userId) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }

  return `${base}-${Date.now()}`;
}
