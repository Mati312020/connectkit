import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ROLE_ROUTES: Record<string, string[]> = {
  "/dashboard/admin":    ["ADMIN"],
  "/dashboard/provider": ["ADMIN", "PROVIDER"],
  "/dashboard/client":   ["ADMIN", "CLIENT"],
};

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // ── Rutas que requieren sesión ────────────────────────────────
  if (pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    // ── Onboarding: redirigir si el perfil está incompleto ───────
    // Solo aplicar en rutas de dashboard, no en /onboarding ni /api
    if (pathname.startsWith("/dashboard")) {
      const { data: userData } = await supabase
        .from("users")
        .select("name, status, role")
        .eq("supabase_id", user.id)
        .single();

      // Sin registro en DB o sin nombre → redirigir a onboarding
      if (!userData || !userData.name) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }

      // ── Verificar rol para rutas protegidas ─────────────────────
      for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(route)) {
          if (!userData || !allowedRoles.includes(userData.role)) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
          }
          break;
        }
      }
    }

    // ── /dashboard (genérico) → redirigir al dashboard correcto ──
    if (pathname === "/dashboard") {
      const { data: userData } = await supabase
        .from("users")
        .select("role, name")
        .eq("supabase_id", user.id)
        .single();

      if (userData?.name) {
        const target =
          userData.role === "ADMIN"    ? "/dashboard/admin" :
          userData.role === "PROVIDER" ? "/dashboard/provider" :
          "/dashboard/client";
        return NextResponse.redirect(new URL(target, request.url));
      } else {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/bookings/:path*",
    "/api/facturacion/:path*",
  ],
};
