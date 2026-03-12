/**
 * DocumentColorWheel — HSL color picker with gradient/ombre support.
 * Owner gets locked company palette; users get general presets.
 */
import { useState } from "react";
import { Palette, Lock, Unlock, Pipette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export interface DocumentColors {
  accentColor: string;
  headerBg: string;
  textColor: string;
  dividerColor: string;
  headerGradientEnd?: string; // for ombre
}

interface Props {
  colors: DocumentColors;
  onChange: (colors: DocumentColors) => void;
  isOwner?: boolean;
}

const PRESETS = [
  { label: "Navy",    accent: "#1e293b", header: "#f8fafc", text: "#374151", divider: "#1e293b" },
  { label: "Royal Blue", accent: "#1d4ed8", header: "#eff6ff", text: "#1e293b", divider: "#3b82f6" },
  { label: "Gold",    accent: "#92400e", header: "#fffbeb", text: "#1c1917", divider: "#d97706" },
  { label: "Emerald", accent: "#065f46", header: "#ecfdf5", text: "#1c1917", divider: "#10b981" },
  { label: "Rose",    accent: "#9f1239", header: "#fff1f2", text: "#1c1917", divider: "#e11d48" },
  { label: "Purple",  accent: "#6b21a8", header: "#faf5ff", text: "#1c1917", divider: "#a855f7" },
  { label: "Slate",   accent: "#111827", header: "#ffffff", text: "#374151", divider: "#e5e7eb" },
  { label: "Teal",    accent: "#0f766e", header: "#f0fdfa", text: "#1c1917", divider: "#14b8a6" },
];

const OWNER_PALETTE = [
  { label: "JBJ Corporate", accent: "#1e293b", header: "#FDFBF7", text: "#1c1917", divider: "#c8a45a" },
  { label: "JBJ Gold",      accent: "#92400e", header: "#fffbeb", text: "#1c1917", divider: "#c8a45a" },
];

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export default function DocumentColorWheel({ colors, onChange, isOwner }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [hue, setHue] = useState(() => hexToHsl(colors.accentColor)[0]);
  const [sat, setSat] = useState(() => hexToHsl(colors.accentColor)[1]);
  const [lit, setLit] = useState(() => hexToHsl(colors.accentColor)[2]);
  const [ombreEnabled, setOmbreEnabled] = useState(false);
  const [ombreHue, setOmbreHue] = useState(200);

  const applyPreset = (p: typeof PRESETS[0]) => {
    onChange({ accentColor: p.accent, headerBg: p.header, textColor: p.text, dividerColor: p.divider });
  };

  const applyCustomHsl = (h: number, s: number, l: number) => {
    const hex = hslToHex(h, s, l);
    onChange({
      ...colors,
      accentColor: hex,
      dividerColor: hex,
      headerGradientEnd: ombreEnabled ? hslToHex(ombreHue, s, Math.min(l + 15, 95)) : undefined,
    });
  };

  const presets = isOwner ? [...OWNER_PALETTE, ...PRESETS] : PRESETS;

  return (
    <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette size={12} className="text-[hsl(var(--gold))]" />
          <span className="text-xs font-bold text-[hsl(var(--foreground))]">Color Palette</span>
          {isOwner && <Lock size={10} className="text-[hsl(var(--gold))]" />}
        </div>
        <button
          onClick={() => setShowCustom(v => !v)}
          className="text-[10px] flex items-center gap-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          <Pipette size={10} />
          {showCustom ? "Presets" : "Custom"}
        </button>
      </div>

      {!showCustom ? (
        <div className="grid grid-cols-4 gap-1.5">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                colors.accentColor === p.accent
                  ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]"
                  : "border-transparent hover:border-[hsl(var(--border))]"
              }`}
            >
              <div
                className="w-6 h-6 rounded-full border border-black/10"
                style={{ background: p.accent }}
              />
              <span className="text-[8px] text-[hsl(var(--muted-foreground))] leading-none">{p.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Hue */}
          <div>
            <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Hue: {hue}°</Label>
            <div className="relative mt-1">
              <div className="h-3 rounded-full" style={{
                background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
              }} />
              <Slider
                value={[hue]}
                onValueChange={([v]) => { setHue(v); applyCustomHsl(v, sat, lit); }}
                min={0} max={360} step={1}
                className="absolute inset-0"
              />
            </div>
          </div>
          {/* Saturation */}
          <div>
            <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Saturation: {sat}%</Label>
            <Slider
              value={[sat]}
              onValueChange={([v]) => { setSat(v); applyCustomHsl(hue, v, lit); }}
              min={0} max={100} step={1}
            />
          </div>
          {/* Lightness */}
          <div>
            <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Lightness: {lit}%</Label>
            <Slider
              value={[lit]}
              onValueChange={([v]) => { setLit(v); applyCustomHsl(hue, sat, v); }}
              min={5} max={95} step={1}
            />
          </div>
          {/* Ombre toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Ombre / Gradient Header</Label>
            <button
              onClick={() => {
                const next = !ombreEnabled;
                setOmbreEnabled(next);
                if (!next) onChange({ ...colors, headerGradientEnd: undefined });
                else applyCustomHsl(hue, sat, lit);
              }}
              className={`w-8 h-4 rounded-full transition-colors ${ombreEnabled ? "bg-[hsl(var(--gold))]" : "bg-[hsl(var(--muted))]"}`}
            >
              <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${ombreEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
          {ombreEnabled && (
            <div>
              <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Gradient End Hue: {ombreHue}°</Label>
              <Slider
                value={[ombreHue]}
                onValueChange={([v]) => { setOmbreHue(v); applyCustomHsl(hue, sat, lit); }}
                min={0} max={360} step={1}
              />
            </div>
          )}
          {/* Preview swatch */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border border-black/10"
              style={{
                background: ombreEnabled
                  ? `linear-gradient(135deg, ${hslToHex(hue, sat, lit)}, ${hslToHex(ombreHue, sat, Math.min(lit + 15, 95))})`
                  : hslToHex(hue, sat, lit),
              }}
            />
            <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]">{hslToHex(hue, sat, lit)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
