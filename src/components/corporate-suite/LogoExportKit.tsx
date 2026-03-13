/**
 * LogoExportKit — Full export panel with format, size, background options and ZIP kit.
 */
import { useState } from "react";
import { Download, Archive, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import JSZip from "jszip";
import jsPDF from "jspdf";
import {
  type LogoData, type ExportBg, EXPORT_SIZES,
  svgToPng, svgToJpg, triggerDownload,
} from "./logoCreatorTypes";

interface Props {
  logo: LogoData;
  colors: { primary: string; secondary: string; accent: string };
  name: string;
}

type ExportFormat = "svg" | "png" | "jpg" | "pdf";

export default function LogoExportKit({ logo, colors, name }: Props) {
  const [formats, setFormats] = useState<Set<ExportFormat>>(new Set(["png"]));
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set(["Large 512"]));
  const [bgOption, setBgOption] = useState<ExportBg>("white");
  const [customBgColor, setCustomBgColor] = useState("#f5f5f5");
  const [downloading, setDownloading] = useState(false);

  const baseName = name || "logo";

  const getBgColor = (): string | undefined => {
    switch (bgOption) {
      case "white": return "#ffffff";
      case "black": return "#111111";
      case "brand": return colors.primary;
      case "custom": return customBgColor;
      case "transparent": return undefined;
    }
  };

  const toggleFormat = (f: ExportFormat) => {
    setFormats(prev => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f); else next.add(f);
      return next;
    });
  };

  const toggleSize = (label: string) => {
    setSelectedSizes(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  const downloadSingle = async () => {
    const bg = getBgColor();
    if (formats.has("svg")) {
      const svgBlob = new Blob([logo.svgContent], { type: "image/svg+xml" });
      triggerDownload(svgBlob, `${baseName}.svg`);
    }
    if (formats.has("png")) {
      const blob = await svgToPng(logo.svgContent, 512, 512, bg);
      triggerDownload(blob, `${baseName}-512.png`);
    }
    if (formats.has("jpg")) {
      const blob = await svgToJpg(logo.svgContent, 512, 512, bg || "#ffffff");
      triggerDownload(blob, `${baseName}-512.jpg`);
    }
    if (formats.has("pdf")) {
      const pngBlob = await svgToPng(logo.svgContent, 1024, 1024, bg || "#ffffff");
      const arrayBuf = await pngBlob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuf);
      const binary = uint8.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
      const b64 = btoa(binary);
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [1024, 1024] });
      pdf.addImage(`data:image/png;base64,${b64}`, "PNG", 0, 0, 1024, 1024);
      pdf.save(`${baseName}.pdf`);
    }
    toast.success("Download complete");
  };

  const downloadFullKit = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      const bg = getBgColor();
      const sizes = EXPORT_SIZES.filter(s => selectedSizes.has(s.label));
      if (sizes.length === 0) {
        // Default: all standard sizes
        sizes.push(...EXPORT_SIZES.filter(s => s.category === "Standard"));
      }

      // SVG
      if (formats.has("svg") || formats.size === 0) {
        zip.file(`${baseName}.svg`, logo.svgContent);
        if (bg) {
          const svgWithBg = logo.svgContent.replace(/<svg/, `<svg style="background:${bg}"`);
          zip.file(`${baseName}-with-bg.svg`, svgWithBg);
        }
      }

      // PNG + JPG for each size
      for (const size of sizes) {
        if (formats.has("png") || formats.size === 0) {
          // Transparent
          const pngT = await svgToPng(logo.svgContent, size.width, size.height);
          zip.file(`png/${baseName}-${size.width}x${size.height}-transparent.png`, await pngT.arrayBuffer());
          // With bg
          if (bg) {
            const pngBg = await svgToPng(logo.svgContent, size.width, size.height, bg);
            zip.file(`png/${baseName}-${size.width}x${size.height}.png`, await pngBg.arrayBuffer());
          }
          // Always include white + black variants for standard sizes
          if (size.category === "Standard") {
            const pngW = await svgToPng(logo.svgContent, size.width, size.height, "#ffffff");
            zip.file(`png/${baseName}-${size.width}x${size.height}-white.png`, await pngW.arrayBuffer());
            const pngB = await svgToPng(logo.svgContent, size.width, size.height, "#111111");
            zip.file(`png/${baseName}-${size.width}x${size.height}-black.png`, await pngB.arrayBuffer());
          }
        }
        if (formats.has("jpg")) {
          const jpgBlob = await svgToJpg(logo.svgContent, size.width, size.height, bg || "#ffffff");
          zip.file(`jpg/${baseName}-${size.width}x${size.height}.jpg`, await jpgBlob.arrayBuffer());
        }
      }

      // PDF
      if (formats.has("pdf")) {
        const pdfPng = await svgToPng(logo.svgContent, 1024, 1024, bg || "#ffffff");
        const buf = await pdfPng.arrayBuffer();
        const uint8 = new Uint8Array(buf);
        const binary = uint8.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
        const b64 = btoa(binary);
        const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [1024, 1024] });
        pdf.addImage(`data:image/png;base64,${b64}`, "PNG", 0, 0, 1024, 1024);
        const pdfBlob = pdf.output("blob");
        zip.file(`${baseName}.pdf`, pdfBlob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerDownload(zipBlob, `${baseName}-logo-kit.zip`);
      toast.success("Full logo kit downloaded");
    } catch (e) {
      console.error("Kit download error:", e);
      toast.error("Kit download failed — try again");
    } finally {
      setDownloading(false);
    }
  };

  const sizesByCategory = EXPORT_SIZES.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, typeof EXPORT_SIZES>);

  return (
    <div className="space-y-4">
      {/* Format Selection */}
      <div>
        <Label className="text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-2 block">Format</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {(["svg", "png", "jpg", "pdf"] as const).map(f => (
            <button key={f} onClick={() => toggleFormat(f)}
              className={`p-2 rounded-lg border-2 text-xs font-bold uppercase transition-all flex items-center justify-center gap-1 ${formats.has(f) ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"}`}>
              {formats.has(f) && <Check size={10} />}
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Background */}
      <div>
        <Label className="text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-2 block">Background</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {([
            { id: "white" as ExportBg, label: "White", color: "#fff", text: "#333" },
            { id: "black" as ExportBg, label: "Black", color: "#111", text: "#fff" },
            { id: "transparent" as ExportBg, label: "None", color: undefined, text: "#666" },
            { id: "brand" as ExportBg, label: "Brand", color: colors.primary, text: "#fff" },
            { id: "custom" as ExportBg, label: "Custom", color: customBgColor, text: "#333" },
          ]).map(bg => (
            <button key={bg.id} onClick={() => setBgOption(bg.id)}
              className={`p-2 rounded-lg border-2 text-[10px] font-semibold transition-all ${bgOption === bg.id ? "border-[hsl(var(--gold))] ring-1 ring-[hsl(var(--gold))]/30" : "border-[hsl(var(--border))]"}`}
              style={{ background: bg.color || "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 0 0 / 12px 12px", color: bg.text }}>
              {bg.label}
            </button>
          ))}
        </div>
        {bgOption === "custom" && (
          <div className="flex items-center gap-2 mt-2">
            <input type="color" value={customBgColor} onChange={e => setCustomBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
            <Input value={customBgColor} onChange={e => setCustomBgColor(e.target.value)} className="flex-1 text-xs h-8 font-mono" maxLength={7} />
          </div>
        )}
      </div>

      {/* Sizes */}
      <div>
        <Label className="text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-2 block">Sizes</Label>
        {Object.entries(sizesByCategory).map(([cat, sizes]) => (
          <div key={cat} className="mb-2">
            <p className="text-[9px] font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-1">{cat}</p>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map(s => (
                <button key={s.label} onClick={() => toggleSize(s.label)}
                  className={`px-2 py-1 rounded-md text-[9px] font-medium border transition-all ${selectedSizes.has(s.label) ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"}`}>
                  {s.width === s.height ? `${s.width}` : `${s.width}×${s.height}`}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="flex gap-2 mt-1">
          <button onClick={() => setSelectedSizes(new Set(EXPORT_SIZES.map(s => s.label)))} className="text-[9px] text-[hsl(var(--gold))] hover:underline">Select All</button>
          <button onClick={() => setSelectedSizes(new Set())} className="text-[9px] text-[hsl(var(--muted-foreground))] hover:underline">Clear</button>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="space-y-2 pt-2 border-t border-[hsl(var(--border))]">
        <Button onClick={downloadSingle} variant="outline" className="w-full gap-2 text-xs">
          <Download size={13} /> Quick Download
        </Button>
        <Button onClick={downloadFullKit} disabled={downloading}
          className="w-full gap-2 text-xs text-[hsl(var(--foreground))] font-semibold border border-[hsl(var(--gold))]/60"
          style={{ background: "linear-gradient(135deg, hsl(var(--gold)/0.15), hsl(var(--gold)/0.05))" }}>
          {downloading ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
          {downloading ? "Packaging…" : "Full Kit (ZIP)"}
        </Button>
      </div>
    </div>
  );
}
