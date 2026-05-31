"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appConfig } from "@/config/app.config";

interface TimeSlot {
  time: string;  // "09:00"
  available: boolean;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedTime?: string;
  onSelect: (time: string) => void;
}

export function TimeSlotPicker({ slots, selectedTime, onSelect }: TimeSlotPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map(({ time, available }) => (
        <Button
          key={time}
          variant={selectedTime === time ? "default" : "outline"}
          size="sm"
          disabled={!available}
          onClick={() => onSelect(time)}
          className={cn(
            !available && "opacity-40 cursor-not-allowed",
            selectedTime === time && "border-2"
          )}
        >
          {time}
        </Button>
      ))}
    </div>
  );
}
