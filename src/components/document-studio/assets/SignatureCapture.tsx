/**
 * SignatureCapture — three capture modes: Upload / Draw / Type.
 * Each mode returns a transparent PNG Blob (so it overlays cleanly on the document).
 */
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Eraser, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onCapture: (blob: Blob, label: string) => Promise<void> | void;
  onCancel?: () => void;
}

export default function SignatureCapture({ onCapture, onCancel }: Props) {
  const [label, setLabel] = useState("My signature");
  const [busy, setBusy] = useState(false);

  /* ─── Draw mode ─── */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#1A1A1A";
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const beginStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d"); if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
    setDrawing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext("2d"); if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y); ctx.stroke();
  };
  const endStroke = () => setDrawing(false);
  const clearCanvas = () => {
    const c = canvasRef.current; if (!c) return;
    c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  };

  const saveDrawn = async () => {
    const c = canvasRef.current; if (!c) return;
    // detect non-empty
    const ctx = c.getContext("2d"); if (!ctx) return;
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let any = false;
    for (let i = 3; i < data.length; i += 4) { if (data[i] !== 0) { any = true; break; } }
    if (!any) { toast.error("Draw a signature first"); return; }
    setBusy(true);
    c.toBlob(async (blob) => {
      if (!blob) { setBusy(false); return; }
      await onCapture(blob, label || "Drawn signature");
      setBusy(false);
    }, "image/png");
  };

  /* ─── Type mode ─── */
  const [typed, setTyped] = useState("");
  const typedRef = useRef<HTMLDivElement>(null);

  const saveTyped = async () => {
    if (!typed.trim()) { toast.error("Type your name first"); return; }
    setBusy(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      if (!typedRef.current) return;
      const cnv = await html2canvas(typedRef.current, { backgroundColor: null, scale: 3 });
      cnv.toBlob(async (blob) => {
        if (!blob) { setBusy(false); return; }
        await onCapture(blob, label || `Signature — ${typed}`);
        setBusy(false);
      }, "image/png");
    } catch (e: any) {
      toast.error(e?.message || "Could not render typed signature");
      setBusy(false);
    }
  };

  /* ─── Upload mode ─── */
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg)/i.test(file.type)) {
      toast.error("Upload a PNG or JPG"); return;
    }
    setBusy(true);
    try { await onCapture(file, label || file.name); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65">Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} className="bg-[#FDFBF7] mt-1" />
      </div>

      <Tabs defaultValue="draw">
        <TabsList className="grid w-full grid-cols-3 bg-[#F7F2EA] border border-[#B89555]/25">
          <TabsTrigger value="draw">Draw</TabsTrigger>
          <TabsTrigger value="type">Type</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="space-y-2">
          <div className="rounded-md border border-[#B89555]/30 bg-white">
            <canvas
              ref={canvasRef} width={520} height={160}
              className="w-full h-[160px] cursor-crosshair touch-none rounded-md"
              onPointerDown={beginStroke}
              onPointerMove={moveStroke}
              onPointerUp={endStroke}
              onPointerLeave={endStroke}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearCanvas}>
              <Eraser className="w-4 h-4 mr-1.5" /> Clear
            </Button>
            <Button size="sm" onClick={saveDrawn} disabled={busy} className="ml-auto">
              {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
              Save signature
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="type" className="space-y-2">
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type your full name"
            className="bg-[#FDFBF7]"
          />
          <div
            ref={typedRef}
            className="rounded-md bg-white border border-[#B89555]/30 px-6 py-6 text-center"
            style={{ fontFamily: '"Brush Script MT","Segoe Script","Lucida Handwriting",cursive', fontSize: 44, color: "#1A1A1A" }}
          >
            {typed || <span style={{ opacity: 0.35 }}>Preview</span>}
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={saveTyped} disabled={busy || !typed.trim()}>
              {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
              Save signature
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-2">
          <label className="block rounded-md border border-dashed border-[#B89555]/40 bg-[#F7F2EA] hover:bg-[#EFE6D6] px-6 py-8 text-center cursor-pointer">
            <Upload className="w-5 h-5 mx-auto text-[#1A1A1A]/70" />
            <div className="text-[12px] mt-2 text-[#1A1A1A]">Click to upload PNG or JPG</div>
            <div className="text-[11px] text-[#1A1A1A]/60">Transparent PNG recommended</div>
            <input
              type="file" accept="image/png,image/jpeg" className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
        </TabsContent>
      </Tabs>

      {onCancel && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>Close</Button>
        </div>
      )}
    </div>
  );
}
