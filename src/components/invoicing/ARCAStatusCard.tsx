"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { appConfig } from "@/config/app.config";

interface ARCAStatus {
  enabled:     boolean;
  ok?:         boolean;
  environment?: string;
  cuit?:       string;
  puntoVenta?: number;
  wsfe?: {
    appServer:  string;
    dbServer:   string;
    authServer: string;
  };
  error?:   string;
  message?: string;
}

export function ARCAStatusCard() {
  const [status, setStatus]   = useState<ARCAStatus | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkStatus() {
    setLoading(true);
    try {
      const res  = await fetch("/api/facturacion/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ enabled: true, ok: false, error: "Error de red al consultar ARCA" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">Estado ARCA / AFIP</CardTitle>
        <Button size="sm" variant="outline" onClick={checkStatus} disabled={loading}>
          {loading ? "Verificando..." : "Verificar conexión"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!status ? (
          <p className="text-muted-foreground">
            Hacé click en "Verificar conexión" para testear la comunicación con ARCA.
          </p>
        ) : !status.enabled ? (
          <p className="text-muted-foreground">{status.message}</p>
        ) : status.error ? (
          <div className="space-y-2">
            <Badge variant="destructive">Sin conexión</Badge>
            <p className="text-muted-foreground text-xs">{status.error}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={status.ok ? "default" : "destructive"}>
                {status.ok ? "Conectado ✓" : "Con errores"}
              </Badge>
              <Badge variant="outline">{status.environment}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">CUIT</p>
                <p className="font-mono">{status.cuit}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Punto de venta</p>
                <p className="font-mono">{status.puntoVenta}</p>
              </div>
            </div>
            {status.wsfe && (
              <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t">
                {Object.entries(status.wsfe).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-muted-foreground capitalize">
                      {key.replace("Server", "")}
                    </p>
                    <span
                      className={`font-medium ${val === "OK" ? "text-green-600" : "text-red-600"}`}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
