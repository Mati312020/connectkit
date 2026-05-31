"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

interface CheckoutButtonProps {
  bookingId: string;
  label?: string;
}

export function CheckoutButton({ bookingId, label = "Pagar con Mercado Pago" }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Redirigir al checkout de Mercado Pago
      const url = process.env.NODE_ENV === "production"
        ? data.initPoint
        : data.sandboxInitPoint;

      window.location.href = url;
    } catch (error) {
      console.error("Error al crear preferencia:", error);
      alert("Hubo un error al procesar el pago. Intentá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleCheckout} disabled={loading} className="gap-2">
      <CreditCard className="h-4 w-4" />
      {loading ? "Procesando..." : label}
    </Button>
  );
}
