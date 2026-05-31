import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubscription, SUBSCRIPTION_PLANS } from "@/lib/mercadopago/subscription";
import { logServerEvent } from "@/lib/logger.server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const subscriptionSchema = z.object({
  plan: z.enum(["BASIC", "PREMIUM"]),
});

// POST /api/mercadopago/subscription
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body   = await request.json();
  const parsed = subscriptionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const subscription = await createSubscription({
    userId:    dbUser.id,
    userEmail: dbUser.email,
    plan:      parsed.data.plan,
  });

  logServerEvent("SUBSCRIPTION_CREATED", {
    userId:   dbUser.id,
    metadata: {
      plan:           parsed.data.plan,
      mpSubscriptionId: subscription.id,
      amount:         SUBSCRIPTION_PLANS[parsed.data.plan].amount,
    },
  });

  return NextResponse.json({
    subscriptionId: subscription.id,
    initPoint:      subscription.init_point,
  });
}
