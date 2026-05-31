import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import type { LogEventType } from "@/lib/logger";

// POST /api/logs — recibe eventos desde el cliente (browser)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, metadata = {} } = body as {
      type: LogEventType;
      metadata?: Record<string, unknown>;
    };

    if (!type || typeof type !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? null;
    const userAgent = hdrs.get("user-agent") ?? null;

    // Buscar el userId interno (Prisma) a partir del supabaseId
    let internalUserId: string | null = null;
    if (user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        select: { id: true },
      });
      internalUserId = dbUser?.id ?? null;
    }

    await prisma.activityLog.create({
      data: {
        type,
        source: "CLIENT",
        userId: internalUserId,
        metadata: metadata as object,
        ip,
        userAgent,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Nunca retornar error — el logging no debe interrumpir al cliente
    return NextResponse.json({ ok: false });
  }
}
