import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, Copy, MessageCircle, Mail, FileText, Image as ImageIcon, Layers, Archive } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";
import { supabase } from "@/integrations/supabase/client";

interface ExportEnvelopeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  envelope: {
    id: string;
    name?: string | null;
    document_url: string;
    document_filename?: string | null;
    metadata?: any;
  } | null;
  signedDoc?: { document_url?: string | null; document_filename?: string | null; certificate_url?: string | null } | null;
  docNumber?: string | null;
  landlordName?: string | null;
  signingLink?: string | null;
  getCurrentPdfBlob?: () => Promise<Blob | null>;
  onShareEmail?: () => void;
  onShareWhatsApp?: () => void;
}

type Quality = "1.5" | "2" | "3";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function authHeaders() {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchPdfBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(maybeProxyStorageUrl(url), { cache: "no-store", headers: await authHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? "Please sign in again to download this file" : `Fetch failed (${res.status})`);
  return res.arrayBuffer();
}

async function rasterisePdf(bytes: ArrayBuffer, scale: number): Promise<HTMLCanvasElement[]> {
  const pdfjs: any = await import("pdfjs-dist");
  // Worker setup — use the bundled worker via Vite ?url import
  // @ts-ignore - vite handles ?url
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const canvases: HTMLCanvasElement[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    canvases.push(canvas);
  }
  return canvases;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas toBlob failed"))), type, quality);
  });
}

function stitchVertical(canvases: HTMLCanvasElement[]): HTMLCanvasElement {
  const width = Math.max(...canvases.map((c) => c.width));
  const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0);
  const out = document.createElement("canvas");
  out.width = width;
  out.height = totalHeight;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, totalHeight);
  let y = 0;
  for (const c of canvases) {
    ctx.drawImage(c, Math.floor((width - c.width) / 2), y);
    y += c.height;
  }
  return out;
}

export default function ExportEnvelopeDialog({
  open,
  onOpenChange,
  envelope,
  signedDoc,
  docNumber,
  landlordName,
  signingLink,
  getCurrentPdfBlob,
  onShareEmail,
  onShareWhatsApp,
}: ExportEnvelopeDialogProps) {
  const [pickPdf, setPickPdf] = useState(true);
  const [pickPages, setPickPages] = useState(false);
  const [pickLong, setPickLong] = useState(false);
  const [includeCert, setIncludeCert] = useState(true);
  const [quality, setQuality] = useState<Quality>("2");
  const [busy, setBusy] = useState(false);

  const sourceUrl = signedDoc?.document_url || envelope?.document_url || "";
  const baseName = useMemo(() => {
    const safe = (s?: string | null) => (s || "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    const parts = [safe(docNumber || envelope?.name || "JBJ-Document"), safe(landlordName)].filter(Boolean);
    return parts.join("_") || "JBJ-Document";
  }, [docNumber, envelope?.name, landlordName]);

  const selectedCount = [pickPdf, pickPages, pickLong].filter(Boolean).length;
  const willZip = selectedCount > 1 || pickPages; // multi-page PNGs always go in a zip

  const handleExport = async () => {
    if (!sourceUrl) { toast.error("No document available"); return; }
    if (!selectedCount) { toast.error("Select at least one format"); return; }
    setBusy(true);
    try {
      const needsRaster = pickPages || pickLong;
      let canvases: HTMLCanvasElement[] = [];
      let pdfBytes: ArrayBuffer | null = null;

      if (needsRaster || pickPdf) {
        const currentBlob = getCurrentPdfBlob ? await getCurrentPdfBlob() : null;
        pdfBytes = currentBlob ? await currentBlob.arrayBuffer() : await fetchPdfBytes(sourceUrl);
      }
      if (needsRaster && pdfBytes) {
        canvases = await rasterisePdf(pdfBytes, parseFloat(quality));
      }

      const files: { name: string; blob: Blob }[] = [];

      if (pickPdf && pdfBytes) {
        files.push({
          name: `${baseName}.pdf`,
          blob: new Blob([pdfBytes], { type: "application/pdf" }),
        });
      }
      if (pickPages && canvases.length) {
        for (let i = 0; i < canvases.length; i++) {
          const blob = await canvasToBlob(canvases[i], "image/png");
          files.push({ name: `${baseName}_p${String(i + 1).padStart(2, "0")}.png`, blob });
        }
      }
      if (pickLong && canvases.length) {
        const stitched = stitchVertical(canvases);
        const blob = await canvasToBlob(stitched, "image/jpeg", 0.92);
        files.push({ name: `${baseName}_full.jpg`, blob });
      }
      if (includeCert && signedDoc?.certificate_url) {
        try {
          const certRes = await fetch(maybeProxyStorageUrl(signedDoc.certificate_url), { headers: await authHeaders() });
          if (certRes.ok) {
            const certBuf = await certRes.arrayBuffer();
            files.push({ name: `${baseName}_audit-certificate.pdf`, blob: new Blob([certBuf], { type: "application/pdf" }) });
          }
        } catch { /* ignore cert fetch errors */ }
      }

      if (willZip && files.length > 1) {
        const zip = new JSZip();
        for (const f of files) zip.file(f.name, f.blob);
        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveBlob(zipBlob, `${baseName}.zip`);
      } else {
        for (const f of files) saveBlob(f.blob, f.name);
      }
      toast.success("Export ready");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Export failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyLink = async () => {
    const link = signingLink || sourceUrl;
    if (!link) { toast.error("No link available"); return; }
    await navigator.clipboard.writeText(link);
    toast.success("Link copied");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FDFBF7] max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Download className="w-5 h-5" /> Export Document
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Tick the formats you want. PDF is the standard export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FormatRow
            checked={pickPdf}
            onChange={setPickPdf}
            icon={<FileText className="w-4 h-4" />}
            title="PDF document (.pdf)"
            subtitle="Original layout — best for signing & archiving"
          />
          <FormatRow
            checked={pickPages}
            onChange={setPickPages}
            icon={<ImageIcon className="w-4 h-4" />}
            title="Page images (.png)"
            subtitle="One PNG per page, bundled in a ZIP"
          />
          <FormatRow
            checked={pickLong}
            onChange={setPickLong}
            icon={<Layers className="w-4 h-4" />}
            title="Single long image (.jpg)"
            subtitle="All pages stitched vertically — easy WhatsApp share"
          />

          {(pickPages || pickLong) && (
            <div className="flex items-center gap-3 pl-1">
              <Label className="text-xs text-[#1A1A1A]/70">Image quality</Label>
              <Select value={quality} onValueChange={(v) => setQuality(v as Quality)}>
                <SelectTrigger className="h-8 w-[160px] bg-[#F7F2EA] border-[#B89555]/30 text-[#1A1A1A]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#FDFBF7]">
                  <SelectItem value="1.5">Standard (1.5×)</SelectItem>
                  <SelectItem value="2">High (2×)</SelectItem>
                  <SelectItem value="3">Ultra (3×)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {signedDoc?.certificate_url && (
            <div className="flex items-center gap-2 pl-1">
              <Checkbox checked={includeCert} onCheckedChange={(v) => setIncludeCert(!!v)} id="cert" />
              <Label htmlFor="cert" className="text-sm text-[#1A1A1A]/80 cursor-pointer">
                Include audit certificate
              </Label>
            </div>
          )}

          <div className="rounded-md bg-[#F7F2EA] border border-[#B89555]/30 p-3">
            <Label className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Filename preview</Label>
            <Input readOnly value={`${baseName}${willZip && selectedCount > 1 ? ".zip" : ""}`} className="mt-1 bg-white text-[#1A1A1A]" />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-2" /> Copy link
            </Button>
            {onShareWhatsApp && (
              <Button size="sm" variant="outline" onClick={onShareWhatsApp}>
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
            )}
            {onShareEmail && (
              <Button size="sm" variant="outline" onClick={onShareEmail}>
                <Mail className="w-4 h-4 mr-2" /> Email
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button variant="gold" onClick={handleExport} disabled={busy || !selectedCount}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : willZip && selectedCount > 1 ? <Archive className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {busy ? "Exporting…" : willZip && selectedCount > 1 ? "Download ZIP" : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormatRow({
  checked, onChange, icon, title, subtitle,
}: {
  checked: boolean; onChange: (v: boolean) => void; icon: React.ReactNode; title: string; subtitle: string;
}) {
  return (
    <label className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition ${checked ? "bg-[#EFE6D6] border-[#B89555]" : "bg-[#F7F2EA] border-[#B89555]/30 hover:border-[#B89555]/60"}`}>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A]">
          <span className="text-[#1A1A1A]/70">{icon}</span>
          {title}
        </div>
        <div className="text-xs text-[#1A1A1A]/70 mt-0.5">{subtitle}</div>
      </div>
    </label>
  );
}
