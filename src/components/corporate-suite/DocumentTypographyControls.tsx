/**
 * DocumentTypographyControls — Font family, size, weight, alignment, underline.
 */
import { Type, AlignLeft, AlignCenter, AlignJustify, Bold, Italic, Underline } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export interface TypographySettings {
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textAlign: "left" | "center" | "justify";
}

interface Props {
  settings: TypographySettings;
  onChange: (s: TypographySettings) => void;
}

const FONTS = [
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Merriweather', serif", label: "Merriweather" },
  { value: "'Lora', serif", label: "Lora" },
  { value: "'Poppins', sans-serif", label: "Poppins" },
  { value: "'Roboto', sans-serif", label: "Roboto" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Crimson Text', serif", label: "Crimson Text" },
  { value: "'Source Serif Pro', serif", label: "Source Serif Pro" },
  { value: "'Helvetica Neue', sans-serif", label: "Helvetica Neue" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
];

export default function DocumentTypographyControls({ settings, onChange }: Props) {
  const set = (partial: Partial<TypographySettings>) => onChange({ ...settings, ...partial });

  return (
    <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Type size={12} className="text-[hsl(var(--gold))]" />
        <span className="text-xs font-bold text-[hsl(var(--foreground))]">Typography</span>
      </div>

      {/* Font family */}
      <div>
        <Label className="text-[9px] text-[hsl(var(--muted-foreground))] mb-1 block">Font Family</Label>
        <select
          value={settings.fontFamily}
          onChange={e => set({ fontFamily: e.target.value })}
          className="w-full h-8 text-xs border border-[hsl(var(--border))] rounded-lg px-2 bg-white text-[hsl(var(--foreground))]"
        >
          {FONTS.map(f => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Font size */}
      <div>
        <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Size: {settings.fontSize}px</Label>
        <Slider
          value={[settings.fontSize]}
          onValueChange={([v]) => set({ fontSize: v })}
          min={8} max={16} step={0.5}
        />
      </div>

      {/* Style toggles */}
      <div className="flex items-center gap-1">
        {([
          { key: "bold" as const, Icon: Bold },
          { key: "italic" as const, Icon: Italic },
          { key: "underline" as const, Icon: Underline },
        ]).map(({ key, Icon }) => (
          <button
            key={key}
            onClick={() => set({ [key]: !settings[key] })}
            className={`w-7 h-7 rounded-md flex items-center justify-center border transition-all ${
              settings[key]
                ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
            }`}
          >
            <Icon size={12} />
          </button>
        ))}

        <div className="w-px h-5 bg-[hsl(var(--border))] mx-1" />

        {([
          { align: "left" as const, Icon: AlignLeft },
          { align: "center" as const, Icon: AlignCenter },
          { align: "justify" as const, Icon: AlignJustify },
        ]).map(({ align, Icon }) => (
          <button
            key={align}
            onClick={() => set({ textAlign: align })}
            className={`w-7 h-7 rounded-md flex items-center justify-center border transition-all ${
              settings.textAlign === align
                ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
            }`}
          >
            <Icon size={12} />
          </button>
        ))}
      </div>

      {/* Preview */}
      <div
        className="p-2 rounded-lg bg-[hsl(var(--muted)/0.3)] text-[hsl(var(--foreground))]"
        style={{
          fontFamily: settings.fontFamily,
          fontSize: settings.fontSize,
          fontWeight: settings.bold ? 700 : 400,
          fontStyle: settings.italic ? "italic" : "normal",
          textDecoration: settings.underline ? "underline" : "none",
          textAlign: settings.textAlign,
        }}
      >
        The quick brown fox jumps over the lazy dog.
      </div>
    </div>
  );
}
