"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { Label } from "@/components/ui/label";
import { es } from "date-fns/locale";
import type { Availability } from "@/types";

interface BookingCalendarProps {
  availability: Availability[];
  onSelect: (startDateTime: Date, endDateTime: Date) => void;
}

function generateSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh] = endTime.split(":").map(Number);
  for (let h = sh; h < eh; h++) {
    slots.push(`${String(h).padStart(2, "0")}:${String(sm).padStart(2, "0")}`);
  }
  return slots;
}

export function BookingCalendar({ availability, onSelect }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();

  const dayAvailability = selectedDate
    ? availability.find((a) => a.dayOfWeek === selectedDate.getDay() && a.isAvailable)
    : null;

  const slots = dayAvailability
    ? generateSlots(dayAvailability.startTime, dayAvailability.endTime).map((time) => ({
        time,
        available: true,
      }))
    : [];

  function handleTimeSelect(time: string) {
    if (!selectedDate) return;
    setSelectedTime(time);

    const [h, m] = time.split(":").map(Number);
    const start = new Date(selectedDate);
    start.setHours(h, m, 0, 0);
    const end = new Date(start);
    end.setHours(h + 2); // duración mínima por defecto

    onSelect(start, end);
  }

  // Deshabilitar días sin disponibilidad
  const disabledDays = (date: Date) => {
    const dayOfWeek = date.getDay();
    return !availability.some((a) => a.dayOfWeek === dayOfWeek && a.isAvailable);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Elegí una fecha</Label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={disabledDays}
          locale={es}
          className="rounded-md border"
        />
      </div>

      {selectedDate && slots.length > 0 && (
        <div>
          <Label className="mb-2 block">Elegí un horario</Label>
          <TimeSlotPicker
            slots={slots}
            selectedTime={selectedTime}
            onSelect={handleTimeSelect}
          />
        </div>
      )}

      {selectedDate && slots.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay horarios disponibles para este día.
        </p>
      )}
    </div>
  );
}
