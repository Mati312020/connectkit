"use client";

import { useState, useEffect } from "react";
import { logEvent } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface DaySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DEFAULT_SLOTS: DaySlot[] = DAYS.map((_, i) => ({
  dayOfWeek: i,
  startTime: "09:00",
  endTime: "18:00",
  isAvailable: i >= 1 && i <= 5, // lunes a viernes por defecto
}));

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<DaySlot[]>(DEFAULT_SLOTS);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slots),
      });
      if (res.ok) {
        logEvent("AVAILABILITY_UPDATED", {
          availableDays: slots.filter((s) => s.isAvailable).length,
          totalDays:     slots.length,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  }

  function updateSlot(dayOfWeek: number, field: keyof DaySlot, value: string | boolean) {
    setSlots((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s))
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mi disponibilidad</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horarios semanales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {slots.map((slot) => (
            <div key={slot.dayOfWeek} className="flex items-center gap-4">
              <label className="flex items-center gap-2 w-32 cursor-pointer">
                <input
                  type="checkbox"
                  checked={slot.isAvailable}
                  onChange={(e) => updateSlot(slot.dayOfWeek, "isAvailable", e.target.checked)}
                />
                <span className="text-sm">{DAYS[slot.dayOfWeek]}</span>
              </label>
              {slot.isAvailable && (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Desde</Label>
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(slot.dayOfWeek, "startTime", e.target.value)}
                      className="w-28 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Hasta</Label>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(slot.dayOfWeek, "endTime", e.target.value)}
                      className="w-28 h-8 text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <Button onClick={handleSave} disabled={loading}>
        {loading ? "Guardando..." : saved ? "¡Guardado!" : "Guardar disponibilidad"}
      </Button>
    </div>
  );
}
