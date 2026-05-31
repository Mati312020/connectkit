"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { appConfig } from "@/config/app.config";

interface InvoiceButtonProps {
  bookingId: string;
  disabled?: boolean;
}

export function InvoiceButton({ bookingId, disabled }: InvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!appConfig.features.invoicing) return null;

  async function handleEmitir() {
    setLoading(true);
    try {
      const res = await fetch("/api/facturacion/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
    } catch (error) {
      console.error("Error al emitir comprobante:", error);
      alert("Error al emitir el comprobante ARCA. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Button variant="outline" size="sm" className="gap-2 text-green-600" disabled>
        <FileText className="h-4 w-4" />
        Comprobante emitido
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEmitir}
      disabled={disabled || loading}
      className="gap-2"
    >
      <FileText className="h-4 w-4" />
      {loading ? "Emitiendo..." : "Emitir comprobante"}
    </Button>
  );
}
