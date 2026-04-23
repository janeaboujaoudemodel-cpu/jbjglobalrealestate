/**
 * Owner-only Icon Size Preview
 * Side-by-side renders of every Lucide icon at 12px / 16px / 20px so the team
 * can verify strokes stay crisp at small sizes used across the platform.
 */
import React, { useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

type IconEntry = { name: string; Comp: React.ComponentType<any> };

const PRESET_SIZES = [12, 16, 20] as const;
const SURFACES = [
  { id: "card", label: "Card", className: "bg-card text-card-foreground border-border" },
  { id: "muted", label: "Muted", className: "bg-muted text-muted-foreground border-border" },
  { id: "primary", label: "Primary", className: "bg-primary text-primary-foreground border-primary" },
  { id: "dark", label: "Dark", className: "bg-foreground text-background border-foreground" },
] as const;

const IconSizePreview: React.FC = () => {
  const icons = useMemo<IconEntry[]>(() => {
    const out: IconEntry[] = [];
    for (const [name, Comp] of Object.entries(LucideIcons)) {
      if (typeof Comp !== "function" && typeof Comp !== "object") continue;
      if (!/^[A-Z]/.test(name)) continue;
      if (["createLucideIcon", "Icon", "default"].includes(name)) continue;
      out.push({ name, Comp: Comp as React.ComponentType<any> });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const [filter, setFilter] = useState("");
  const [sizes, setSizes] = useState<number[]>([...PRESET_SIZES]);
  const [stroke, setStroke] = useState<number>(2);
  const [surfaceId, setSurfaceId] = useState<(typeof SURFACES)[number]["id"]>("card");
  const [absoluteStroke, setAbsoluteStroke] = useState(false);

  const surface = SURFACES.find((s) => s.id === surfaceId)!;
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return icons.slice(0, 120);
    return icons.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 240);
  }, [icons, filter]);

  const togglePreset = (size: number) => {
    setSizes((cur) => (cur.includes(size) ? cur.filter((s) => s !== size) : [...cur, size].sort((a, b) => a - b)));
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Icon Size Preview</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Verify Lucide icon strokes stay crisp at the sizes used across the platform (12, 16, 20 px).
          Toggle sizes, change surfaces, and tune stroke width to find any glyph that breaks down.
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Controls</CardTitle>
          <CardDescription>Live preview updates as you change settings.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">Sizes</Label>
            <div className="flex gap-2">
              {PRESET_SIZES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={sizes.includes(s) ? "default" : "outline"}
                  onClick={() => togglePreset(s)}
                >
                  {s}px
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">Surface</Label>
            <ToggleGroup
              type="single"
              value={surfaceId}
              onValueChange={(v) => v && setSurfaceId(v as typeof surfaceId)}
              className="justify-start"
            >
              {SURFACES.map((s) => (
                <ToggleGroupItem key={s.id} value={s.id} size="sm">
                  {s.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">
              Stroke width: {stroke.toFixed(2)}
            </Label>
            <Slider
              value={[stroke]}
              min={1}
              max={3}
              step={0.25}
              onValueChange={(v) => setStroke(v[0])}
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <input
                type="checkbox"
                checked={absoluteStroke}
                onChange={(e) => setAbsoluteStroke(e.target.checked)}
              />
              Use absolute stroke (constant pixel width)
            </label>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">Filter ({filtered.length})</Label>
            <Input
              placeholder="e.g. arrow, chevron, user…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Showing first {filtered.length} of {icons.length} icons.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active sizes legend */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Active sizes:</span>
        {sizes.length === 0 ? (
          <Badge variant="outline">none — pick at least one</Badge>
        ) : (
          sizes.map((s) => <Badge key={s} variant="secondary">{s}px</Badge>)
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map(({ name, Comp }) => (
          <div
            key={name}
            className={`rounded-md border p-3 transition-colors ${surface.className}`}
          >
            <div className="flex items-end justify-around gap-2 min-h-[44px]">
              {sizes.map((s) => (
                <div key={s} className="flex flex-col items-center gap-1">
                  <Comp
                    size={s}
                    strokeWidth={stroke}
                    absoluteStrokeWidth={absoluteStroke}
                  />
                  <span className="text-[10px] opacity-60">{s}</span>
                </div>
              ))}
            </div>
            <div className="text-[11px] mt-2 truncate opacity-80 font-mono" title={name}>
              {name}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-sm text-muted-foreground text-center py-12">
            No icons match “{filter}”.
          </div>
        )}
      </div>
    </div>
  );
};

export default IconSizePreview;
