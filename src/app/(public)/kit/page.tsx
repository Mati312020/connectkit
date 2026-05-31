import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Datos de la página (centralizar acá para editar fácil) ────
const PRODUCT = {
  name:       "ConnectKit",
  tagline:    "El boilerplate para lanzar tu marketplace de servicios en Argentina",
  subtitle:   "Next.js 16 + Supabase + Mercado Pago + Facturación ARCA — todo conectado, listo para usar.",
  gumroadUrl: "https://gumroad.com/l/connectkit", // reemplazar con tu URL real
  demoUrl:    "/",
  githubUrl:  "#", // reemplazar
  prices: {
    starter: { label: "Starter",   usd: 79,  features: ["Código fuente completo", "Docs de setup", "5 actualizaciones"] },
    pro:     { label: "Pro",       usd: 129, features: ["Todo Starter", "Email de soporte 30 días", "10 actualizaciones"] },
    team:    { label: "Con soporte", usd: 199, features: ["Todo Pro", "Soporte por email prioritario", "Actualizaciones de por vida"] },
  },
};

const TECH_STACK = [
  { name: "Next.js 16",     desc: "App Router, Server Components, TypeScript",            color: "bg-black text-white" },
  { name: "Supabase",       desc: "Auth, PostgreSQL, Storage — un solo proyecto",          color: "bg-green-600 text-white" },
  { name: "Prisma ORM",     desc: "Schema tipado, migraciones, relaciones",                color: "bg-blue-700 text-white" },
  { name: "Mercado Pago",   desc: "Preferencias, webhooks, suscripciones recurrentes",     color: "bg-cyan-600 text-white" },
  { name: "ARCA / AFIP",    desc: "Factura C y E — integración SOAP completa",             color: "bg-sky-800 text-white" },
  { name: "Resend",         desc: "Emails transaccionales con templates React",             color: "bg-purple-700 text-white" },
  { name: "shadcn/ui",      desc: "Componentes accesibles, tema personalizable",            color: "bg-zinc-800 text-white" },
  { name: "pdf-lib",        desc: "Comprobantes fiscales en PDF generados en el servidor",  color: "bg-red-700 text-white" },
];

const FEATURES = [
  {
    icon: "🔐",
    title: "Auth con 3 roles",
    desc:  "Admin · Proveedor · Cliente. Middleware de protección por rol, onboarding por tipo de usuario.",
  },
  {
    icon: "📅",
    title: "Sistema de reservas",
    desc:  "Calendario de disponibilidad semanal, booking flow con cálculo automático de comisiones.",
  },
  {
    icon: "💳",
    title: "Mercado Pago listo",
    desc:  "Checkout Pro, webhook verificado con firma HMAC, suscripciones recurrentes con PreApproval.",
  },
  {
    icon: "🧾",
    title: "Factura C y Factura E",
    desc:  "Integración WSAA + WSFE completa. Monotributo: IVA no discriminado. Exportación: Factura E con SIVAD.",
  },
  {
    icon: "📊",
    title: "Dashboard admin",
    desc:  "Métricas, gestión de usuarios, reservas, comprobantes y logs del sistema con retención configurable.",
  },
  {
    icon: "📝",
    title: "Logs de eventos",
    desc:  "30+ tipos de eventos (login, reservas, pagos, facturación). Filtros por origen, tipo y usuario.",
  },
  {
    icon: "🖼️",
    title: "PDF de comprobantes",
    desc:  "Generación automática con pdf-lib. Se guarda en Supabase Storage y se envía por email.",
  },
  {
    icon: "⭐",
    title: "Reviews y ratings",
    desc:  "Sistema de calificaciones de 1 a 5 estrellas. Rating promedio actualizado en tiempo real.",
  },
  {
    icon: "⚙️",
    title: "Un archivo para personalizar todo",
    desc:  "Nombre, vocabulario, comisiones, features y colores desde app.config.ts. Sin tocar el código funcional.",
  },
];

const FAQS = [
  {
    q: "¿Necesito conocimiento previo en ARCA/AFIP?",
    a: "No. El kit incluye documentación paso a paso para generar los certificados digitales, habilitar el punto de venta y configurar las env vars. La integración SOAP ya está implementada.",
  },
  {
    q: "¿Funciona para otros países de LATAM?",
    a: "Sí para el frontend: Next.js, Supabase y Resend son agnósticos. La integración de Mercado Pago funciona en AR, MX, BR, CO, CL. La parte ARCA es exclusiva de Argentina.",
  },
  {
    q: "¿Puedo usar ConnectKit en proyectos comerciales?",
    a: "Sí. La licencia MIT te permite usarlo en proyectos propios o de clientes sin restricciones.",
  },
  {
    q: "¿Qué pasa si tengo preguntas durante el setup?",
    a: "El plan Pro incluye soporte por email durante 30 días. El plan Con soporte incluye soporte por email prioritario y actualizaciones de por vida.",
  },
  {
    q: "¿Cómo recibo las actualizaciones?",
    a: "Las actualizaciones se distribuyen como nuevas versiones del ZIP en Gumroad. Recibirás un email cuando haya una nueva versión.",
  },
];

// ── Página ────────────────────────────────────────────────────

export default function ConnectKitLandingPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ── */}
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">ConnectKit</span>
            <Badge variant="secondary" className="text-xs">by ByteCraft</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link href={PRODUCT.demoUrl} className="text-sm text-muted-foreground hover:text-foreground">
              Ver demo →
            </Link>
            <a
              href={PRODUCT.gumroadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "sm" }), "bg-emerald-600 hover:bg-emerald-700")}
            >
              Comprar — desde USD 79
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="py-24 px-4 text-center border-b">
        <div className="max-w-3xl mx-auto space-y-6">
          <Badge className="text-xs px-3 py-1">Boilerplate comercial · Next.js 16</Badge>
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
            {PRODUCT.tagline}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {PRODUCT.subtitle}
          </p>
          <div className="flex justify-center gap-4 flex-wrap pt-2">
            <a
              href={PRODUCT.gumroadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "bg-emerald-600 hover:bg-emerald-700 text-base px-8")}
            >
              Comprar ahora — desde USD 79
            </a>
            <Link href={PRODUCT.demoUrl} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "text-base")}>
              Ver demo en vivo →
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Licencia MIT · Entrega inmediata por Gumroad · Incluye docs completas
          </p>
        </div>
      </section>

      {/* ── Stack tecnológico ── */}
      <section className="py-16 px-4 bg-muted/30 border-b">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Stack incluido</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TECH_STACK.map(({ name, desc, color }) => (
              <div key={name} className="rounded-lg border bg-card p-3 space-y-1">
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${color}`}>
                  {name}
                </span>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 border-b">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">Todo incluido, listo para producción</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            No arrancás de cero. Cada feature está implementado, testeado y documentado.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="p-5 rounded-lg border bg-card space-y-2">
                <div className="text-2xl">{icon}</div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cuánto tiempo ahorrás ── */}
      <section className="py-16 px-4 bg-muted/30 border-b">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-2xl font-bold">¿Cuánto tiempo ahorrás?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { item: "Auth + roles",       hours: "8–12 hs" },
              { item: "Mercado Pago",       hours: "10–15 hs" },
              { item: "Integración ARCA",   hours: "20–30 hs" },
              { item: "Dashboard admin",    hours: "15–20 hs" },
            ].map(({ item, hours }) => (
              <div key={item} className="rounded-lg border bg-card p-4">
                <p className="text-2xl font-bold text-emerald-600">{hours}</p>
                <p className="text-xs text-muted-foreground mt-1">{item}</p>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Estimado conservador: <strong>50–80 horas de desarrollo</strong> que podés aplicar directamente
            a las features específicas de tu nicho. Al precio de un freelancer, el kit se paga en la primera hora.
          </p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-20 px-4 border-b" id="pricing">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">Pricing</h2>
          <p className="text-center text-muted-foreground mb-12">Pago único. Sin suscripción. Sin licencias por proyecto.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Object.entries(PRODUCT.prices).map(([key, plan]) => (
              <div
                key={key}
                className={cn(
                  "rounded-xl border p-6 space-y-4 relative",
                  key === "pro" ? "border-emerald-500 shadow-lg shadow-emerald-500/10" : ""
                )}
              >
                {key === "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white text-xs px-3">Popular</Badge>
                  </div>
                )}
                <div>
                  <p className="font-semibold">{plan.label}</p>
                  <p className="text-3xl font-extrabold mt-1">
                    USD {plan.usd}
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-emerald-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={PRODUCT.gumroadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: key === "pro" ? "default" : "outline" }),
                    "w-full",
                    key === "pro" ? "bg-emerald-600 hover:bg-emerald-700" : ""
                  )}
                >
                  Comprar
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4 border-b">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Preguntas frecuentes</h2>
          <div className="space-y-6">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="border-b pb-6 last:border-0">
                <h3 className="font-semibold mb-2">{q}</h3>
                <p className="text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-24 px-4 bg-muted/30 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Arrancá tu marketplace esta semana</h2>
          <p className="text-muted-foreground">
            Código fuente completo · Docs detalladas · Entrega instantánea vía Gumroad
          </p>
          <a
            href={PRODUCT.gumroadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: "lg" }), "bg-emerald-600 hover:bg-emerald-700 text-base px-10")}
          >
            Comprar ConnectKit — desde USD 79
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <p>
          ConnectKit · by{" "}
          <a href="https://bytecraft.com.ar" className="underline hover:text-foreground">
            ByteCraft
          </a>{" "}
          · Licencia MIT
        </p>
      </footer>
    </div>
  );
}
