"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appConfig } from "@/config/app.config";

interface ReviewFormProps {
  bookingId:   string;
  providerId:  string;
  providerName: string;
  onSuccess?:  () => void;
}

export function ReviewForm({ bookingId, providerId, providerName, onSuccess }: ReviewFormProps) {
  const [rating,  setRating]  = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  if (!appConfig.features.ratings) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Seleccioná una calificación"); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/reviews", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ bookingId, providerId, rating, comment }),
    });

    if (res.ok) {
      setDone(true);
      onSuccess?.();
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al enviar la calificación");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-2xl mb-2">⭐".repeat(rating)</p>
          <p className="font-medium text-green-600">¡Gracias por tu calificación!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Calificá tu experiencia con {providerName}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Selector de estrellas */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="text-2xl transition-transform hover:scale-110"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
              >
                <span className={star <= (hovered || rating) ? "text-yellow-400" : "text-gray-300"}>
                  ★
                </span>
              </button>
            ))}
            {rating > 0 && (
              <span className="text-sm text-muted-foreground ml-2 self-center">
                {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][rating]}
              </span>
            )}
          </div>

          {/* Comentario opcional */}
          <textarea
            placeholder="Comentario (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <div className="px-6 pb-4">
          <Button type="submit" disabled={loading || rating === 0}>
            {loading ? "Enviando..." : "Enviar calificación"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
