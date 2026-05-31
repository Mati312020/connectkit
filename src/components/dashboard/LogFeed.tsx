"use client";

import { useState, useMemo, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { appConfig } from "@/config/app.config";
import type { LogEventType } from "@/lib/logger";

// ── Tipos ─────────────────────────────────────────────────────

export interface LogEntry {
  id: string;
  type: LogEventType;
  source: "CLIENT" | "SERVER" | "SYSTEM";
  userId: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date | string;
  user?: { name: string | null; email: string } | null;
}

// ── Colores por categoría de evento ──────────────────────────

const EVENT_COLORS: Record<string, string> = {
  // Auth — azul
  USER_REGISTER: "bg-blue-100 text-blue-800",
  USER_LOGIN: "bg-blue-100 text-blue-800",
  USER_LOGOUT: "bg-slate-100 text-slate-700",
  USER_PASSWORD_RESET: "bg-blue-100 text-blue-800",
  // Reservas — indigo
  BOOKING_CREATED: "bg-indigo-100 text-indigo-800",
  BOOKING_CONFIRMED: "bg-indigo-100 text-indigo-800",
  BOOKING_CANCELLED: "bg-orange-100 text-orange-800",
  BOOKING_COMPLETED: "bg-green-100 text-green-800",
  BOOKING_REFUNDED: "bg-yellow-100 text-yellow-800",
  // Pagos — esmeralda
  PAYMENT_INITIATED: "bg-emerald-100 text-emerald-800",
  PAYMENT_APPROVED: "bg-green-100 text-green-800",
  PAYMENT_REJECTED: "bg-red-100 text-red-800",
  PAYMENT_REFUNDED: "bg-yellow-100 text-yellow-800",
  SUBSCRIPTION_CREATED: "bg-emerald-100 text-emerald-800",
  SUBSCRIPTION_CANCELLED: "bg-orange-100 text-orange-800",
  // Facturación — violeta
  INVOICE_EMITTED: "bg-violet-100 text-violet-800",
  INVOICE_ERROR: "bg-red-100 text-red-800",
  // Perfil — cyan
  PROFILE_UPDATED: "bg-cyan-100 text-cyan-800",
  AVAILABILITY_UPDATED: "bg-cyan-100 text-cyan-800",
  PROVIDER_VERIFIED: "bg-cyan-100 text-cyan-800",
  // Admin — fuchsia
  ADMIN_LOGIN: "bg-fuchsia-100 text-fuchsia-800",
  ADMIN_USER_STATUS_CHANGED: "bg-fuchsia-100 text-fuchsia-800",
  ADMIN_SETTINGS_UPDATED: "bg-fuchsia-100 text-fuchsia-800",
  ADMIN_LOGS_CLEANUP: "bg-fuchsia-100 text-fuchsia-800",
  // Sistema — gris
  WEBHOOK_RECEIVED: "bg-gray-100 text-gray-700",
  EMAIL_SENT: "bg-gray-100 text-gray-700",
  EMAIL_ERROR: "bg-red-100 text-red-800",
  SYSTEM_ERROR: "bg-red-100 text-red-800",
};

const EVENT_LABELS: Record<string, string> = {
  USER_REGISTER: "Registro",
  USER_LOGIN: "Inicio sesión",
  USER_LOGOUT: "Cierre sesión",
  USER_PASSWORD_RESET: "Reset contraseña",
  PROFILE_UPDATED: "Perfil actualizado",
  AVAILABILITY_UPDATED: "Disponibilidad",
  PROVIDER_VERIFIED: "Proveedor verificado",
  BOOKING_CREATED: "Reserva creada",
  BOOKING_CONFIRMED: "Reserva confirmada",
  BOOKING_CANCELLED: "Reserva cancelada",
  BOOKING_COMPLETED: "Reserva completada",
  BOOKING_REFUNDED: "Reembolso",
  PAYMENT_INITIATED: "Pago iniciado",
  PAYMENT_APPROVED: "Pago aprobado",
  PAYMENT_REJECTED: "Pago rechazado",
  PAYMENT_REFUNDED: "Pago reembolsado",
  SUBSCRIPTION_CREATED: "Suscripción creada",
  SUBSCRIPTION_CANCELLED: "Suscripción cancelada",
  INVOICE_EMITTED: "Factura emitida",
  INVOICE_ERROR: "Error facturación",
  ADMIN_LOGIN: "Admin login",
  ADMIN_USER_STATUS_CHANGED: "Estado de usuario",
  ADMIN_SETTINGS_UPDATED: "Config actualizada",
  ADMIN_LOGS_CLEANUP: "Limpieza de logs",
  WEBHOOK_RECEIVED: "Webhook recibido",
  EMAIL_SENT: "Email enviado",
  EMAIL_ERROR: "Error email",
  SYSTEM_ERROR: "Error del sistema",
};

const SOURCE_LABELS = {
  CLIENT: "Cliente",
  SERVER: "Servidor",
  SYSTEM: "Sistema",
} as const;

// ── Componente ────────────────────────────────────────────────

interface LogFeedProps {
  logs: LogEntry[];
  retentionMonths: number;
}

export function LogFeed({ logs, retentionMonths }: LogFeedProps) {
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cleaning, startClean] = useTransition();
  const [cleanResult, setCleanResult] = useState<string | null>(null);
  const [customRetention, setCustomRetention] = useState<string>(
    String(retentionMonths)
  );

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (filterSource !== "all" && log.source !== filterSource) return false;
      if (filterType !== "all" && log.type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        const userName = log.user?.name?.toLowerCase() ?? "";
        const userEmail = log.user?.email?.toLowerCase() ?? "";
        const type = log.type.toLowerCase();
        const meta = JSON.stringify(log.metadata).toLowerCase();
        if (!userName.includes(q) && !userEmail.includes(q) && !type.includes(q) && !meta.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [logs, filterSource, filterType, search]);

  const uniqueTypes = useMemo(
    () => Array.from(new Set(logs.map((l) => l.type))).sort(),
    [logs]
  );

  async function handleCleanup() {
    const months = parseInt(customRetention);
    if (isNaN(months) || months < 0) return;

    startClean(async () => {
      const res = await fetch("/api/logs/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retentionMonths: months }),
      });
      const data = await res.json();
      setCleanResult(data.message ?? "Limpieza completada");
      // Recargar la página para reflejar la eliminación
      setTimeout(() => window.location.reload(), 2000);
    });
  }

  return (
    <div className="space-y-4">
      {/* ── Controles de filtro ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Buscar por usuario, tipo, detalle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterSource} onValueChange={(v) => setFilterSource(v ?? "all")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Origen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los orígenes</SelectItem>
            <SelectItem value="CLIENT">Cliente</SelectItem>
            <SelectItem value="SERVER">Servidor</SelectItem>
            <SelectItem value="SYSTEM">Sistema</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {uniqueTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {EVENT_LABELS[t] ?? t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} de {logs.length} eventos
        </span>
      </div>

      {/* ── Tabla de logs ── */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Evento</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Origen</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Usuario</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay eventos que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${EVENT_COLORS[log.type] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {EVENT_LABELS[log.type] ?? log.type}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-xs">
                          {SOURCE_LABELS[log.source]}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        {log.user ? (
                          <div>
                            <p className="font-medium">{log.user.name ?? "Sin nombre"}</p>
                            <p className="text-xs text-muted-foreground">{log.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 max-w-xs">
                        <p className="truncate text-muted-foreground text-xs">
                          {Object.keys(log.metadata).length > 0
                            ? Object.entries(log.metadata)
                                .slice(0, 2)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" · ")
                            : "—"}
                        </p>
                      </td>
                    </tr>
                    {/* Fila expandida con metadata completa */}
                    {expanded === log.id && (
                      <tr key={`${log.id}-expanded`} className="bg-muted/20">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {Object.keys(log.metadata).length > 0 && (
                              <div>
                                <p className="font-medium mb-1 text-foreground">Metadata</p>
                                <pre className="bg-muted rounded p-2 overflow-auto max-h-32 text-muted-foreground">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                            <div className="space-y-1 text-muted-foreground">
                              {log.ip && <p><span className="font-medium text-foreground">IP:</span> {log.ip}</p>}
                              {log.userAgent && (
                                <p className="truncate">
                                  <span className="font-medium text-foreground">User-Agent:</span>{" "}
                                  {log.userAgent}
                                </p>
                              )}
                              <p><span className="font-medium text-foreground">ID:</span> {log.id}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Panel de retención y limpieza ── */}
      <div className="border rounded-md p-4 bg-muted/20 space-y-3">
        <h3 className="font-medium text-sm">Política de retención</h3>
        <p className="text-xs text-muted-foreground">
          Configuración por defecto: <strong>{(appConfig.logs.retentionMonths as number) === 0 ? "indefinida" : `${appConfig.logs.retentionMonths} meses`}</strong>.
          Podés sobrescribir manualmente para esta limpieza.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm">Retener últimos</label>
            <Input
              type="number"
              min="0"
              max="120"
              value={customRetention}
              onChange={(e) => setCustomRetention(e.target.value)}
              className="w-20 h-8 text-sm"
            />
            <span className="text-sm text-muted-foreground">
              meses (0 = no eliminar)
            </span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCleanup}
            disabled={cleaning}
          >
            {cleaning ? "Limpiando..." : "Ejecutar limpieza"}
          </Button>
        </div>
        {cleanResult && (
          <p className="text-sm text-green-600 font-medium">{cleanResult}</p>
        )}
      </div>
    </div>
  );
}
