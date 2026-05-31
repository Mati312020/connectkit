"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logEvent } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appConfig } from "@/config/app.config";

// Categorías de servicio — personalizar según el nicho en app.config.ts
// Acá van las categorías por defecto del starter kit (niñeras)
const DEFAULT_CATEGORIES = [
  "Niños 0-2 años",
  "Niños 3-6 años",
  "Niños 7-12 años",
  "Cuidado nocturno",
  "Cuidado fines de semana",
  "Primeros auxilios",
  "Estimulación temprana",
  "Idiomas",
];

interface OnboardingData {
  role:       "PROVIDER" | "CLIENT" | null;
  name:       string;
  phone:      string;
  // Proveedor
  bio:        string;
  categories: string[];
  hourlyRate: string;
  location:   string;
  // Cliente
  address:    string;
  notes:      string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const [data, setData] = useState<OnboardingData>({
    role: null, name: "", phone: "",
    bio: "", categories: [], hourlyRate: String(appConfig.pricing.baseHourlyRate), location: "",
    address: "", notes: "",
  });

  function update(field: keyof OnboardingData, value: string | string[]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategory(cat: string) {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  }

  async function handleSubmit() {
    if (!data.name.trim()) { setError("El nombre es obligatorio"); return; }
    if (!data.role)        { setError("Seleccioná tu rol"); return; }

    setLoading(true);
    setError("");

    const payload = {
      role:  data.role,
      name:  data.name,
      phone: data.phone || undefined,
      ...(data.role === "PROVIDER" && {
        bio:        data.bio,
        categories: data.categories,
        hourlyRate: parseInt(data.hourlyRate) || appConfig.pricing.baseHourlyRate,
        location:   data.location,
      }),
      ...(data.role === "CLIENT" && {
        address: data.address,
        notes:   data.notes,
      }),
    };

    const res = await fetch("/api/onboarding", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Error al guardar el perfil");
      setLoading(false);
      return;
    }

    logEvent("ONBOARDING_COMPLETED", {
      role:           data.role,
      hasCategories:  data.categories.length > 0,
      hasLocation:    !!data.location,
    });
    router.push(json.redirectTo ?? "/dashboard");
    router.refresh();
  }

  // ── Step 1: Elegir rol ────────────────────────────────────────
  if (step === 1) {
    return (
      <OnboardingShell title="¡Bienvenido a ConnectKit!" subtitle="¿Cómo vas a usar la plataforma?">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RoleCard
            selected={data.role === "CLIENT"}
            onClick={() => { update("role", "CLIENT"); setStep(2); }}
            emoji="👨‍👩‍👧"
            title={appConfig.roles.client.singular}
            description={`Buscás un ${appConfig.roles.provider.singular.toLowerCase()} para tu ${appConfig.roles.client.singular.toLowerCase()}`}
          />
          <RoleCard
            selected={data.role === "PROVIDER"}
            onClick={() => { update("role", "PROVIDER"); setStep(2); }}
            emoji="⭐"
            title={appConfig.roles.provider.singular}
            description={`Ofrecés tus servicios como ${appConfig.roles.provider.singular.toLowerCase()}`}
          />
        </div>
      </OnboardingShell>
    );
  }

  // ── Step 2: Datos básicos ─────────────────────────────────────
  if (step === 2) {
    return (
      <OnboardingShell
        title="Tus datos"
        subtitle="Así te van a ver los demás usuarios"
        step={2}
        totalSteps={data.role === "PROVIDER" ? 3 : 2}
        onBack={() => setStep(1)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre completo *</Label>
            <Input
              value={data.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ej: María García"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input
              value={data.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+54 9 11 1234-5678"
              type="tel"
            />
          </div>
          {data.role === "CLIENT" && (
            <>
              <div className="space-y-2">
                <Label>Dirección (opcional)</Label>
                <Input
                  value={data.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                />
              </div>
              <div className="space-y-2">
                <Label>Notas adicionales (opcional)</Label>
                <textarea
                  value={data.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Ej: Tenemos un niño con alergia al maní..."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none h-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  maxLength={500}
                />
              </div>
            </>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex justify-end mt-6">
          {data.role === "CLIENT" ? (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Guardando..." : "Empezar →"}
            </Button>
          ) : (
            <Button onClick={() => { if (!data.name.trim()) { setError("El nombre es obligatorio"); return; } setError(""); setStep(3); }}>
              Continuar →
            </Button>
          )}
        </div>
      </OnboardingShell>
    );
  }

  // ── Step 3: Perfil del proveedor ──────────────────────────────
  return (
    <OnboardingShell
      title={`Tu perfil como ${appConfig.roles.provider.singular}`}
      subtitle="Esta información aparece en tu perfil público"
      step={3}
      totalSteps={3}
      onBack={() => setStep(2)}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Sobre vos</Label>
          <textarea
            value={data.bio}
            onChange={(e) => update("bio", e.target.value)}
            placeholder={`Contá tu experiencia como ${appConfig.roles.provider.singular.toLowerCase()}...`}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none h-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            maxLength={1000}
          />
        </div>

        <div className="space-y-2">
          <Label>Especialidades (seleccioná las que apliquen)</Label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  data.categories.includes(cat)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Tarifa por hora ({appConfig.currency.symbol})
            </Label>
            <Input
              type="number"
              min={100}
              value={data.hourlyRate}
              onChange={(e) => update("hourlyRate", e.target.value)}
              placeholder={String(appConfig.pricing.baseHourlyRate)}
            />
          </div>
          <div className="space-y-2">
            <Label>Zona de trabajo</Label>
            <Input
              value={data.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Ej: Palermo, CABA"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Guardando..." : "Crear mi perfil →"}
        </Button>
      </div>
    </OnboardingShell>
  );
}

// ── Componentes auxiliares ────────────────────────────────────

function OnboardingShell({
  children, title, subtitle, step, totalSteps, onBack,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  step?: number;
  totalSteps?: number;
  onBack?: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Branding */}
        <div className="text-center">
          <p className="font-bold text-xl" style={{ color: appConfig.theme.primaryColor }}>
            {appConfig.name}
          </p>
        </div>

        {/* Progress */}
        {step && totalSteps && (
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {step}/{totalSteps}
            </span>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  ← Atrás
                </button>
              )}
              <div>
                <CardTitle>{title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

function RoleCard({
  selected, onClick, emoji, title, description,
}: {
  selected: boolean;
  onClick: () => void;
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-lg border-2 text-left transition-all hover:shadow-md w-full ${
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      }`}
    >
      <div className="text-3xl mb-3">{emoji}</div>
      <p className="font-semibold text-base">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </button>
  );
}
