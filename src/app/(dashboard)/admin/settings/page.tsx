import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ARCAStatusCard } from "@/components/invoicing/ARCAStatusCard";
import { appConfig } from "@/config/app.config";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración de la plataforma</h1>
      <p className="text-muted-foreground text-sm">
        Estos valores se configuran en{" "}
        <code className="text-xs bg-muted px-1 py-0.5 rounded">
          src/config/app.config.ts
        </code>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Información general</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Nombre</span><span>{appConfig.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Moneda</span><span>{appConfig.currency.code}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Locale</span><span>{appConfig.currency.locale}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Comisiones</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Comisión {appConfig.roles.client.singular}</span>
              <span>{appConfig.commissions.client}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Comisión {appConfig.roles.provider.singular}</span>
              <span>{appConfig.commissions.provider}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Features activas</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(appConfig.features).map(([key, enabled]) => (
                <Badge key={key} variant={enabled ? "default" : "secondary"}>
                  {enabled ? "✓" : "✗"} {key}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Precio base</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tarifa por hora</span>
              <span>{appConfig.currency.symbol}{appConfig.pricing.baseHourlyRate.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mín. horas</span>
              <span>{appConfig.pricing.minBookingHours}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Máx. horas</span>
              <span>{appConfig.pricing.maxBookingHours}h</span>
            </div>
          </CardContent>
        </Card>

        {/* Estado ARCA — solo visible si la feature está habilitada */}
        {appConfig.features.invoicing && (
          <div className="md:col-span-2">
            <ARCAStatusCard />
          </div>
        )}
      </div>
    </div>
  );
}
