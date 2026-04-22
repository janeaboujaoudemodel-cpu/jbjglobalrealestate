import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface TargetSize {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
}

export const PRESETS: TargetSize[] = [
  { id: "a4-p", label: "A4 portrait (210 × 297 mm)", widthMm: 210, heightMm: 297 },
  { id: "a4-l", label: "A4 landscape (297 × 210 mm)", widthMm: 297, heightMm: 210 },
  { id: "a3-p", label: "A3 portrait (297 × 420 mm)", widthMm: 297, heightMm: 420 },
  { id: "letter-p", label: "US Letter (216 × 279 mm)", widthMm: 216, heightMm: 279 },
  { id: "tabloid", label: "US Tabloid (279 × 432 mm)", widthMm: 279, heightMm: 432 },
  { id: "sq-1080", label: "Square 1080 (286 × 286 mm)", widthMm: 286, heightMm: 286 },
  { id: "custom", label: "Custom…", widthMm: 0, heightMm: 0 },
];

interface Props {
  presetId: string;
  customW: number;
  customH: number;
  minDpi: number;
  onPresetChange: (id: string) => void;
  onCustomChange: (w: number, h: number) => void;
  onDpiChange: (dpi: number) => void;
}

export default function TargetSizePicker({
  presetId, customW, customH, minDpi,
  onPresetChange, onCustomChange, onDpiChange,
}: Props) {
  const isCustom = presetId === "custom";
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>Target size</Label>
        <Select value={presetId} onValueChange={onPresetChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isCustom && (
        <div className="space-y-2 md:col-span-1">
          <Label>Custom W × H (mm)</Label>
          <div className="flex gap-2">
            <Input
              type="number" min={50} max={2000} value={customW || ""}
              placeholder="W"
              onChange={(e) => onCustomChange(parseInt(e.target.value || "0", 10), customH)}
            />
            <Input
              type="number" min={50} max={2000} value={customH || ""}
              placeholder="H"
              onChange={(e) => onCustomChange(customW, parseInt(e.target.value || "0", 10))}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Min DPI</Label>
        <Select value={String(minDpi)} onValueChange={(v) => onDpiChange(parseInt(v, 10))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="150">150 (screen)</SelectItem>
            <SelectItem value="200">200 (draft print)</SelectItem>
            <SelectItem value="300">300 (print, recommended)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
