import * as React from "react";
import { Shield, CreditCard, FileText, Calendar, Star, Smartphone } from "lucide-react";
import { appConfig } from "@/config/app.config";

const FEATURES: { icon: React.ElementType; title: string; description: string; show?: boolean }[] = [
  {
    icon: Shield,
    title: "Perfiles verificados",
    description: `Cada ${appConfig.roles.provider.singular.toLowerCase()} pasa por un proceso de verificación de identidad.`,
  },
  {
    icon: Calendar,
    title: "Reservas en línea",
    description: "Sistema de disponibilidad en tiempo real. Reservá en segundos.",
  },
  {
    icon: CreditCard,
    title: "Pagos con Mercado Pago",
    description: "Pagá de forma segura con tarjeta, transferencia o efectivo.",
  },
  {
    icon: FileText,
    title: "Factura fiscal incluida",
    description: "Comprobante ARCA válido emitido automáticamente en cada pago.",
    show: Boolean(appConfig.features.invoicing),
  },
  {
    icon: Star,
    title: "Sistema de reseñas",
    description: "Calificaciones reales de familias reales.",
    show: Boolean(appConfig.features.ratings),
  },
  {
    icon: Smartphone,
    title: "Disponible en tu celular",
    description: "Funciona perfecto en cualquier dispositivo. Sin descargas.",
  },
].filter((f) => f.show === undefined || Boolean(f.show));

export function Features() {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">¿Por qué elegirnos?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4 p-4">
              <div
                className="p-2 rounded-lg h-fit"
                style={{ backgroundColor: `${appConfig.theme.primaryColor}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: appConfig.theme.primaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
