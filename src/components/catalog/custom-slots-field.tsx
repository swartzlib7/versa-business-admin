"use client";

import { Button } from "@/components/ui/button";
import { customSlotsJson, parseCustomSlots } from "@/lib/public/schedule-times";

export function CustomSlotsField({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  const slots = parseCustomSlots(value);
  const write = (next: string[]) => onChange?.(customSlotsJson(next));
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {slots.map((slot, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="datetime-local"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={slot}
            disabled={readOnly}
            onChange={(e) => {
              const next = [...slots];
              next[index] = e.target.value;
              write(next);
            }}
          />
          {readOnly ? null : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => write(slots.filter((_, i) => i !== index))}
            >
              Remove
            </Button>
          )}
        </div>
      ))}
      {readOnly ? null : (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => write([...slots, ""])}>
          Add a time
        </Button>
      )}
    </div>
  );
}
