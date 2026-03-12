/**
 * PhotoCollageBuilder — Upload multiple photos, arrange in grid/frame layouts, merge & export.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Upload, Download, Trash2, Grid3X3, LayoutGrid, GripVertical,
  Plus, Image as ImageIcon, Loader2, RotateCcw, Columns, Rows
} from "lucide-react";

interface CollageImage {
  id: string;
  src: string;
  file?: File;
  name: string;
}

type LayoutType = "2x2" | "3x3" | "1x3-strip" | "3x1-strip" | "mosaic" | "filmstrip";

const LAYOUTS: { id: LayoutType; label: string; icon: any; cols: number; rows: number }[] = [
  { id: "2x2", label: "2×2 Grid", icon: LayoutGrid, cols: 2, rows: 2 },
  { id: "3x3", label: "3×3 Grid", icon: Grid3X3, cols: 3, rows: 3 },
  { id: "1x3-strip", label: "Horizontal Strip", icon: Columns, cols: 3, rows: 1 },
  { id: "3x1-strip", label: "Vertical Strip", icon: Rows, cols: 1, rows: 3 },
  { id: "mosaic", label: "Mosaic", icon: LayoutGrid, cols: 3, rows: 2 },
  { id: "filmstrip", label: "Filmstrip", icon: Columns, cols: 4, rows: 1 },
];

export default function PhotoCollageBuilder({ embedded = false }: { embedded?: boolean }) {
  const [images, setImages] = useState<CollageImage[]>([]);
  const [layout, setLayout] = useState<LayoutType>("2x2");
  const [gap, setGap] = useState(8);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [borderRadius, setBorderRadius] = useState(8);
  const [exporting, setExporting] = useState(false);
  const [projectTitle, setProjectTitle] = useState("My Collage");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImages = (files: FileList) => {
    const newImages: CollageImage[] = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const src = URL.createObjectURL(file);
      newImages.push({ id, src, file, name: file.name });
    });
    setImages(prev => [...prev, ...newImages]);
    if (newImages.length) toast.success(`Added ${newImages.length} image(s)`);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const currentLayout = LAYOUTS.find(l => l.id === layout) || LAYOUTS[0];
  const totalSlots = layout === "mosaic" ? 5 : currentLayout.cols * currentLayout.rows;

  const getMosaicGrid = (): { col: number; row: number; colSpan: number; rowSpan: number }[] => [
    { col: 0, row: 0, colSpan: 2, rowSpan: 2 },
    { col: 2, row: 0, colSpan: 1, rowSpan: 1 },
    { col: 2, row: 1, colSpan: 1, rowSpan: 1 },
    { col: 0, row: 2, colSpan: 1, rowSpan: 1 },
    { col: 1, row: 2, colSpan: 2, rowSpan: 1 },
  ];

  const exportCollage = useCallback(async () => {
    if (!images.length) { toast.error("Add images first"); return; }
    setExporting(true);
    try {
      const canvasW = 1920;
      const canvasH = layout === "1x3-strip" || layout === "filmstrip" ? 640 : layout === "3x1-strip" ? 1920 : 1920;
      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasW, canvasH);

      const cols = layout === "mosaic" ? 3 : currentLayout.cols;
      const rows = layout === "mosaic" ? 3 : currentLayout.rows;
      const cellW = (canvasW - gap * (cols + 1)) / cols;
      const cellH = (canvasH - gap * (rows + 1)) / rows;

      const loadImg = (src: string): Promise<HTMLImageElement> =>
        new Promise((res, rej) => { const img = new window.Image(); img.crossOrigin = "anonymous"; img.onload = () => res(img); img.onerror = rej; img.src = src; });

      if (layout === "mosaic") {
        const grid = getMosaicGrid();
        for (let i = 0; i < Math.min(images.length, grid.length); i++) {
          const g = grid[i];
          const img = await loadImg(images[i].src);
          const x = gap + g.col * (cellW + gap);
          const y = gap + g.row * (cellH + gap);
          const w = cellW * g.colSpan + gap * (g.colSpan - 1);
          const h = cellH * g.rowSpan + gap * (g.rowSpan - 1);
          ctx.save();
          roundRect(ctx, x, y, w, h, borderRadius);
          ctx.clip();
          drawCover(ctx, img, x, y, w, h);
          ctx.restore();
        }
      } else {
        let idx = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (idx >= images.length) break;
            const img = await loadImg(images[idx].src);
            const x = gap + c * (cellW + gap);
            const y = gap + r * (cellH + gap);
            ctx.save();
            roundRect(ctx, x, y, cellW, cellH, borderRadius);
            ctx.clip();
            drawCover(ctx, img, x, y, cellW, cellH);
            ctx.restore();
            idx++;
          }
        }
      }

      canvas.toBlob(blob => {
        if (!blob) { toast.error("Export failed"); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectTitle.replace(/\s+/g, "_")}_collage.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Collage exported!");
      }, "image/png");
    } catch (e) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }, [images, layout, gap, bgColor, borderRadius, projectTitle, currentLayout]);

  return (
    <div className={embedded ? "" : "min-h-screen"} style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #EDE4D3 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {!embedded && (
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "#1A1A1A" }}>
              Photo <span style={{ color: "#B8943E" }}>Collage</span> Builder
            </h1>
            <p className="text-sm mt-1" style={{ color: "rgba(0,0,0,0.45)" }}>Arrange photos in grids, mosaics, and filmstrips — export as a single image</p>
          </div>
        )}

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* ── Left Panel: Controls ── */}
          <div className="space-y-4">
            {/* Project Title */}
            <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
              <Label className="text-xs font-bold text-[hsl(var(--foreground))]">Project Title</Label>
              <Input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} className="h-8 text-sm" />
            </div>

            {/* Upload */}
            <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4">
              <Label className="text-xs font-bold text-[hsl(var(--foreground))] mb-2 block">
                Images ({images.length}/{totalSlots} slots)
              </Label>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addImages(e.target.files)} />
              <Button variant="outline" className="w-full h-20 border-dashed border-2 border-[hsl(var(--gold)/0.4)] hover:border-[hsl(var(--gold))] text-[hsl(var(--muted-foreground))]"
                onClick={() => fileInputRef.current?.click()}>
                <div className="flex flex-col items-center gap-1">
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">Add Photos</span>
                </div>
              </Button>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {images.map(img => (
                    <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-[hsl(var(--border))]">
                      <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Layout Selection */}
            <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
              <Label className="text-xs font-bold text-[hsl(var(--foreground))]">Layout</Label>
              <div className="grid grid-cols-3 gap-2">
                {LAYOUTS.map(l => (
                  <button key={l.id} onClick={() => setLayout(l.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] transition-all ${layout === l.id ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--gold))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.5)]"}`}>
                    <l.icon className="w-4 h-4" />
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
              <Label className="text-xs font-bold text-[hsl(var(--foreground))]">Style</Label>
              <div className="flex items-center gap-3">
                <Label className="text-[10px] text-[hsl(var(--muted-foreground))] w-16">Gap</Label>
                <input type="range" min={0} max={24} value={gap} onChange={e => setGap(+e.target.value)} className="flex-1 accent-[hsl(var(--gold))]" />
                <span className="text-[10px] w-6 text-right">{gap}px</span>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-[10px] text-[hsl(var(--muted-foreground))] w-16">Radius</Label>
                <input type="range" min={0} max={32} value={borderRadius} onChange={e => setBorderRadius(+e.target.value)} className="flex-1 accent-[hsl(var(--gold))]" />
                <span className="text-[10px] w-6 text-right">{borderRadius}px</span>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-[10px] text-[hsl(var(--muted-foreground))] w-16">BG Color</Label>
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
                <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">{bgColor}</span>
              </div>
            </div>

            {/* Export */}
            <Button onClick={exportCollage} disabled={!images.length || exporting} className="w-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark,40_70%_35%))] text-white font-semibold">
              {exporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</> : <><Download className="w-4 h-4 mr-2" /> Export Collage</>}
            </Button>
          </div>

          {/* ── Right Panel: Preview ── */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6 flex items-center justify-center min-h-[500px]">
            {images.length === 0 ? (
              <div className="text-center text-[hsl(var(--muted-foreground))]">
                <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Add photos to start building your collage</p>
              </div>
            ) : (
              <div className="w-full max-w-[640px]" style={{ backgroundColor: bgColor, padding: `${gap}px`, borderRadius: `${borderRadius}px` }}>
                {layout === "mosaic" ? (
                  <div className="grid grid-cols-3 grid-rows-3" style={{ gap: `${gap}px` }}>
                    {getMosaicGrid().map((g, i) => (
                      <div key={i} className="overflow-hidden" style={{
                        gridColumn: `${g.col + 1} / span ${g.colSpan}`,
                        gridRow: `${g.row + 1} / span ${g.rowSpan}`,
                        borderRadius: `${borderRadius}px`,
                        aspectRatio: i === 0 ? "1" : undefined,
                      }}>
                        {images[i] ? (
                          <img src={images[i].src} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[hsl(var(--muted))] flex items-center justify-center">
                            <Plus className="w-6 h-6 text-[hsl(var(--muted-foreground))] opacity-40" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid" style={{
                    gridTemplateColumns: `repeat(${currentLayout.cols}, 1fr)`,
                    gridTemplateRows: `repeat(${currentLayout.rows}, 1fr)`,
                    gap: `${gap}px`,
                  }}>
                    {Array.from({ length: totalSlots }).map((_, i) => (
                      <div key={i} className="overflow-hidden aspect-square" style={{ borderRadius: `${borderRadius}px` }}>
                        {images[i] ? (
                          <img src={images[i].src} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[hsl(var(--muted))] flex items-center justify-center">
                            <Plus className="w-6 h-6 text-[hsl(var(--muted-foreground))] opacity-40" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Canvas helpers ── */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const iR = img.width / img.height;
  const cR = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (iR > cR) { sw = img.height * cR; sx = (img.width - sw) / 2; }
  else { sh = img.width / cR; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}
