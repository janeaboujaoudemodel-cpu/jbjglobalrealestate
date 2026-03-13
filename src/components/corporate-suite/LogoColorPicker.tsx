/**
 * LogoColorPicker — Advanced color picker with HEX, RGB, HSL inputs,
 * preset grid, website URL extraction, and auto-contrast.
 */
import { useState } from "react";
import { Palette, Globe, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  COLOR_PRESETS,
  hexToRgb, rgbToHex, hexToHsl, hslToHex,
} from "./logoCreatorTypes";

interface Props {
  colors: { primary: string; secondary: string; accent: string };
  onChange: (colors: { primary: string; secondary: string; accent: string }) => void;
  colorPreset: number;
  onPresetChange: (i: number) => void;
}

type ColorChannel = "primary" | "secondary" | "accent";
type ColorMode = "hex" | "rgb" | "hsl";

export default function LogoColorPicker({ colors, onChange, colorPreset, onPresetChange }: Props) {
  const [mode, setMode] = useState<ColorMode>("hex");
  const [activeChannel, setActiveChannel] = useState<ColorChannel>("primary");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [extracting, setExtracting] = useState(false);

  const activeHex = colors[activeChannel];
  const rgb = hexToRgb(activeHex);
  const hsl = hexToHsl(activeHex);

  const updateChannel = (hex: string) => {
    onChange({ ...colors, [activeChannel]: hex });
  };

  const handleHexInput = (val: string) => {
    const clean = val.startsWith("#") ? val : "#" + val;
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
      updateChannel(clean);
    }
  };

  const handleRgbChange = (channel: "r" | "g" | "b", value: number) => {
    const newRgb = { ...rgb, [channel]: Math.max(0, Math.min(255, value)) };
    updateChannel(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleHslChange = (channel: "h" | "s" | "l", value: number) => {
    const newHsl = { ...hsl, [channel]: value };
    updateChannel(hslToHex(newHsl.h, newHsl.s, newHsl.l));
  };

  const extractFromWebsite = async () => {
    if (!websiteUrl.trim()) return;
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-logo-generator", {
        body: {
          mode: "extract-colors",
          websiteUrl: websiteUrl.trim(),
        },
      });
      if (error) throw error;
      if (data?.colors) {
        onChange({
          primary: data.colors.primary || colors.primary,
          secondary: data.colors.secondary || colors.secondary,
          accent: data.colors.accent || colors.accent,
        });
        toast.success("Colors extracted from website");
      } else {
        toast.info("Could not extract colors — try a different URL");
      }
    } catch {
      toast.error("Failed to extract colors");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preset Grid */}
      <div className="grid grid-cols-4 gap-2">
        {COLOR_PRESETS.map((c, i) => (
          <button key={i} onClick={() => {
            onPresetChange(i);
            onChange({ primary: c.primary, secondary: c.secondary, accent: c.accent });
          }}
            className={`p-2 rounded-xl border-2 transition-all ${colorPreset === i ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10" : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold))]/60"}`}>
            <div className="flex gap-0.5 justify-center mb-1.5">
              <div className="w-4 h-4 rounded-full border border-white/60 shadow-sm" style={{ background: c.primary }} />
              <div className="w-4 h-4 rounded-full border border-[hsl(var(--border))] shadow-sm" style={{ background: c.secondary }} />
              <div className="w-4 h-4 rounded-full border border-white/60 shadow-sm" style={{ background: c.accent }} />
            </div>
            <p className="text-[8px] text-center text-[hsl(var(--muted-foreground))] leading-tight">{c.label}</p>
          </button>
        ))}
      </div>

      {/* Channel Selector */}
      <div className="flex gap-1.5 border-t border-[hsl(var(--border))] pt-3">
        {(["primary", "secondary", "accent"] as const).map(ch => (
          <button key={ch} onClick={() => setActiveChannel(ch)}
            className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${activeChannel === ch ? "bg-[hsl(var(--gold))]/10 ring-1 ring-[hsl(var(--gold))]" : "hover:bg-[hsl(var(--muted))]/50"}`}>
            <div className="w-6 h-6 rounded-full border-2 border-[hsl(var(--border))]" style={{ background: colors[ch] }}>
              <input type="color" value={colors[ch]} onChange={e => { onChange({ ...colors, [ch]: e.target.value }); }} className="w-full h-full opacity-0 cursor-pointer" />
            </div>
            <span className="text-[9px] font-semibold capitalize text-[hsl(var(--muted-foreground))]">{ch}</span>
          </button>
        ))}
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1 bg-[hsl(var(--muted))]/50 rounded-lg p-0.5">
        {(["hex", "rgb", "hsl"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 text-[10px] font-bold uppercase py-1.5 rounded-md transition-all ${mode === m ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm" : "text-[hsl(var(--muted-foreground))]"}`}>
            {m}
          </button>
        ))}
      </div>

      {/* Color Inputs */}
      {mode === "hex" && (
        <div className="space-y-2">
          <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">HEX Value</Label>
          <div className="flex gap-2 items-center">
            <div className="w-8 h-8 rounded-lg border border-[hsl(var(--border))]" style={{ background: activeHex }} />
            <Input
              value={activeHex}
              onChange={e => handleHexInput(e.target.value)}
              className="flex-1 font-mono text-xs h-8"
              maxLength={7}
            />
          </div>
        </div>
      )}

      {mode === "rgb" && (
        <div className="space-y-3">
          {(["r", "g", "b"] as const).map(ch => (
            <div key={ch}>
              <div className="flex justify-between mb-1">
                <Label className="text-[9px] text-[hsl(var(--muted-foreground))] uppercase">{ch === "r" ? "Red" : ch === "g" ? "Green" : "Blue"}</Label>
                <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]">{rgb[ch]}</span>
              </div>
              <Slider
                value={[rgb[ch]]}
                onValueChange={([v]) => handleRgbChange(ch, v)}
                min={0} max={255} step={1}
              />
            </div>
          ))}
        </div>
      )}

      {mode === "hsl" && (
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Hue</Label>
              <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]">{hsl.h}°</span>
            </div>
            <div className="relative">
              <div className="h-2 rounded-full absolute inset-x-0 top-[18px] pointer-events-none" style={{
                background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
              }} />
              <Slider
                value={[hsl.h]}
                onValueChange={([v]) => handleHslChange("h", v)}
                min={0} max={360} step={1}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Saturation</Label>
              <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]">{hsl.s}%</span>
            </div>
            <Slider
              value={[hsl.s]}
              onValueChange={([v]) => handleHslChange("s", v)}
              min={0} max={100} step={1}
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Lightness</Label>
              <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]">{hsl.l}%</span>
            </div>
            <Slider
              value={[hsl.l]}
              onValueChange={([v]) => handleHslChange("l", v)}
              min={5} max={95} step={1}
            />
          </div>
        </div>
      )}

      {/* Website URL Color Extraction */}
      <div className="border-t border-[hsl(var(--border))] pt-3 space-y-2">
        <Label className="text-[9px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
          <Globe size={10} /> Extract Colors from URL
        </Label>
        <div className="flex gap-1.5">
          <Input
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 text-xs h-8"
          />
          <Button onClick={extractFromWebsite} disabled={extracting || !websiteUrl.trim()} size="sm" variant="outline" className="h-8 text-[10px] px-2">
            {extracting ? <Palette size={12} className="animate-spin" /> : <Palette size={12} />}
          </Button>
        </div>
      </div>

      {/* Reset */}
      <button onClick={() => {
        const p = COLOR_PRESETS[colorPreset];
        onChange({ primary: p.primary, secondary: p.secondary, accent: p.accent });
      }} className="text-[10px] text-[hsl(var(--gold))] hover:underline flex items-center gap-1">
        <RotateCcw size={10} /> Reset to preset
      </button>
    </div>
  );
}
