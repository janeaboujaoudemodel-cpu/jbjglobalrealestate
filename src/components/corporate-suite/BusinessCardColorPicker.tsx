import React from "react";
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { COLOR_PRESETS } from "./businessCardTypes";

export function ColorPickerSection({
  label, colorIdx, customColor, onPresetChange, onCustomChange,
}: {
  label: string; colorIdx: number; customColor: string;
  onPresetChange: (i: number) => void; onCustomChange: (hex: string) => void;
}) {
  const activeColor = customColor || COLOR_PRESETS[colorIdx].primary;
  return (
    <div>
      <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">{label}</Label>
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {COLOR_PRESETS.map((c, i) => (
          <button
            key={i}
            onClick={() => { onPresetChange(i); onCustomChange(""); }}
            title={c.label}
            className={`h-8 rounded-lg flex items-center justify-center text-[8px] font-semibold transition-all border-2 ${
              colorIdx === i && !customColor ? "border-[hsl(var(--foreground))] scale-105 shadow-md" : "border-transparent hover:scale-105"
            }`}
            style={{ background: c.primary, color: c.secondary }}
          >
            {colorIdx === i && !customColor ? <Check size={10} /> : ""}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={activeColor}
          onChange={e => onCustomChange(e.target.value)}
          className="w-9 h-8 rounded-lg border border-[hsl(var(--border))] cursor-pointer p-0.5"
          title="Custom color wheel"
        />
        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
          {customColor ? `Custom: ${customColor}` : COLOR_PRESETS[colorIdx].label}
        </span>
        {customColor && (
          <button onClick={() => onCustomChange("")} className="text-[9px] underline text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">Reset</button>
        )}
      </div>
    </div>
  );
}
