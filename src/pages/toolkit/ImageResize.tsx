import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { SaveProjectBar, ToolContentWrapper } from '@/components/toolkit/SaveProjectBar';
import { toast as sonnerToast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Upload, Image as ImageIcon, Download, Trash2, FileArchive,
  Loader2, Check, Crop, Square, Plus, Type, Stamp, CalendarDays,
  Palette, Grid3X3, Eraser, LayoutGrid, ChevronLeft, ChevronRight,
  Maximize, ZoomIn, ZoomOut, RotateCcw, FlipHorizontal, FlipVertical,
  Layers, Scissors, PaintBucket, SlidersHorizontal, Sparkles, Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";

// ─── Size Presets ───────────────────────────────────────────
const SIZE_PRESETS = [
  { id: "instagram_square", name: "Instagram Post", ratio: "1:1", width: 1080, height: 1080, icon: "📸" },
  { id: "instagram_portrait", name: "Instagram Portrait", ratio: "4:5", width: 1080, height: 1350, icon: "📱" },
  { id: "instagram_story", name: "Instagram Story/Reel", ratio: "9:16", width: 1080, height: 1920, icon: "📱" },
  { id: "facebook_post", name: "Facebook Post", ratio: "1.91:1", width: 1200, height: 630, icon: "📘" },
  { id: "youtube_thumb", name: "YouTube Thumbnail", ratio: "16:9", width: 1280, height: 720, icon: "▶" },
  { id: "linkedin_post", name: "LinkedIn Post", ratio: "1.91:1", width: 1200, height: 628, icon: "in" },
  { id: "twitter_post", name: "X / Twitter Post", ratio: "16:9", width: 1600, height: 900, icon: "X" },
  { id: "pinterest_pin", name: "Pinterest Pin", ratio: "2:3", width: 1000, height: 1500, icon: "P" },
  { id: "website_hero", name: "Website Hero", ratio: "16:9", width: 1920, height: 1080, icon: "W" },
  { id: "business_card", name: "Business Card", ratio: "3.5:2", width: 1050, height: 600, icon: "BC" },
  { id: "a4_portrait", name: "A4 Portrait", ratio: "1:1.41", width: 2480, height: 3508, icon: "A4" },
  { id: "og_image", name: "OG / Social Share", ratio: "1.91:1", width: 1200, height: 630, icon: "OG" },
];

type FitMode = "crop" | "fit";
type PaddingBg = "white" | "black" | "blur" | "custom";
type OutputFormat = "jpg" | "png" | "webp";
type EditTool = "none" | "text" | "border" | "collage";

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  bold: boolean;
}

interface UploadedImage {
  id: string;
  file: File;
  name: string;
  preview: string;
  width: number;
  height: number;
  orientation: "landscape" | "portrait" | "square";
  cropPosition: { x: number; y: number };
}

interface ProcessedImage {
  presetId: string;
  presetName: string;
  blob: Blob;
  filename: string;
  dataUrl: string;
  width: number;
  height: number;
}

interface ImageResizeProps { embedded?: boolean; }

export default function ImageResize({ embedded = false }: ImageResizeProps) {
  const [projectName, setProjectName] = useState('Image Resize Project');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [selectedPresets, setSelectedPresets] = useState<string[]>(["instagram_square"]);
  const [activePreviewPreset, setActivePreviewPreset] = useState<string>("instagram_square");
  const [fitMode, setFitMode] = useState<FitMode>("crop");
  const [paddingBg, setPaddingBg] = useState<PaddingBg>("white");
  const [customBgColor, setCustomBgColor] = useState("#ffffff");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpg");
  const [quality, setQuality] = useState(85);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);

  // Edit tools
  const [activeTool, setActiveTool] = useState<EditTool>("none");
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState("#B89555");
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(48);

  // Collage
  const [collageMode, setCollageMode] = useState(false);
  const [collageGap, setCollageGap] = useState(20);
  const [collageLayout, setCollageLayout] = useState<"horizontal" | "vertical" | "grid">("horizontal");
  const [collageBgColor, setCollageBgColor] = useState("#ffffff");

  // Smart Crop AI
  const [smartCropLoading, setSmartCropLoading] = useState(false);
  const [smartCropSubject, setSmartCropSubject] = useState<string | null>(null);
  const [smartCropConfidence, setSmartCropConfidence] = useState<number | null>(null);
  const [smartCropComposition, setSmartCropComposition] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  const activeImage = useMemo(() => images.find(i => i.id === activeImageId) ?? images[0] ?? null, [images, activeImageId]);
  const activePreset = useMemo(() => SIZE_PRESETS.find(p => p.id === activePreviewPreset), [activePreviewPreset]);

  // ─── AI Smart Crop ──────────────────────────────────────
  const handleSmartCrop = useCallback(async () => {
    if (!activeImage) return;
    setSmartCropLoading(true);
    setSmartCropSubject(null);
    setSmartCropConfidence(null);
    setSmartCropComposition(null);
    try {
      // Convert image to base64 for AI analysis (downscale for speed)
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = activeImage.preview;
      });
      const maxDim = 768; // higher res for better detection
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.8);

      const { data, error } = await supabase.functions.invoke("smart-crop-detect", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const x = data.x ?? 50;
      const y = data.y ?? 50;
      setImages(prev => prev.map(i =>
        i.id === activeImage.id ? { ...i, cropPosition: { x, y } } : i
      ));
      setSmartCropSubject(data.subject || null);
      setSmartCropConfidence(data.confidence ?? null);
      setSmartCropComposition(data.composition ?? null);
      setFitMode("crop");

      const confidenceLabel = (data.confidence ?? 0) >= 80 ? "High" : (data.confidence ?? 0) >= 50 ? "Medium" : "Low";
      sonnerToast.success(`Smart crop: ${data.subject || "main subject"} (${confidenceLabel} confidence)`);
    } catch (err: any) {
      console.error("Smart crop error:", err);
      sonnerToast.error(err?.message || "Smart crop failed");
    } finally {
      setSmartCropLoading(false);
    }
  }, [activeImage]);

  // ─── Import from Business Card Designer ─────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem("jbj-card-to-resizer");
    if (!raw) return;
    sessionStorage.removeItem("jbj-card-to-resizer");
    try {
      const { dataUrl, name, width, height } = JSON.parse(raw);
      if (!dataUrl) return;
      // Convert data URL to File object
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `${name || "business-card"}.png`, { type: "image/png" });
          const preview = URL.createObjectURL(blob);
          const orientation = width > height ? "landscape" : width < height ? "portrait" : "square" as const;
          const img: UploadedImage = {
            id: `img_card_${Date.now()}`, file, name: file.name, preview,
            width, height, orientation,
            cropPosition: { x: 50, y: 50 },
          };
          setImages(prev => [...prev, img]);
          setActiveImageId(img.id);
          // Auto-select business card preset
          if (!selectedPresets.includes("business_card")) {
            setSelectedPresets(prev => [...prev, "business_card"]);
          }
          setActivePreviewPreset("business_card");
          setProcessedImages([]);
          sonnerToast.success("Business card imported! Select sizes and export.");
        });
    } catch (e) {
      console.error("Failed to import card:", e);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── File Handling ───────────────────────────────────────
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const newImages: UploadedImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      const preview = URL.createObjectURL(file);
      const dims = await getImageDimensions(preview);
      const orientation = dims.width > dims.height ? "landscape" : dims.width < dims.height ? "portrait" : "square";
      newImages.push({
        id: `img_${Date.now()}_${i}`, file, name: file.name, preview,
        width: dims.width, height: dims.height, orientation,
        cropPosition: { x: 50, y: 50 },
      });
    }
    setImages(prev => [...prev, ...newImages]);
    if (newImages.length > 0 && !activeImageId) setActiveImageId(newImages[0].id);
    setProcessedImages([]);
  }, [activeImageId]);

  const getImageDimensions = (src: string): Promise<{ width: number; height: number }> =>
    new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = src;
    });

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      const filtered = prev.filter(i => i.id !== id);
      if (activeImageId === id) setActiveImageId(filtered[0]?.id ?? null);
      return filtered;
    });
    setProcessedImages([]);
  };

  const togglePreset = (presetId: string) => {
    setSelectedPresets(prev =>
      prev.includes(presetId) ? prev.filter(p => p !== presetId) : [...prev, presetId]
    );
    setActivePreviewPreset(presetId);
    setProcessedImages([]);
  };

  const selectAllPresets = () => {
    const allIds = SIZE_PRESETS.map(p => p.id);
    setSelectedPresets(prev => prev.length === allIds.length ? [] : allIds);
  };

  // ─── Live Preview Engine ─────────────────────────────────
  useEffect(() => {
    if (!activeImage || !activePreset) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const renderPreview = async () => {
      const img = await loadImage(activeImage.preview);
      const pw = activePreset.width;
      const ph = activePreset.height;

      // Scale canvas for display (max 600px wide)
      const scale = Math.min(600 / pw, 500 / ph, 1);
      canvas.width = pw * scale;
      canvas.height = ph * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);

      // Clear
      ctx.clearRect(0, 0, pw, ph);

      if (fitMode === "crop") {
        drawCroppedImage(ctx, img, pw, ph, activeImage.cropPosition);
      } else {
        await drawFittedImage(ctx, img, pw, ph, paddingBg, customBgColor, activeImage.preview);
      }

      // Border
      if (borderWidth > 0) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(borderWidth / 2, borderWidth / 2, pw - borderWidth, ph - borderWidth);
      }

      // Text overlays
      for (const overlay of textOverlays) {
        ctx.font = `${overlay.bold ? 'bold ' : ''}${overlay.fontSize}px ${overlay.fontFamily}`;
        ctx.fillStyle = overlay.color;
        ctx.textBaseline = "top";
        ctx.fillText(overlay.text, overlay.x, overlay.y);
      }
    };

    const timer = setTimeout(renderPreview, 100);
    return () => clearTimeout(timer);
  }, [activeImage, activePreset, fitMode, paddingBg, customBgColor, borderWidth, borderColor, textOverlays]);

  // ─── Canvas Draw Helpers ─────────────────────────────────
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const drawCroppedImage = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, tw: number, th: number, crop: { x: number; y: number }) => {
    const tr = tw / th;
    const ir = img.width / img.height;
    let sw = img.width, sh = img.height, sx = 0, sy = 0;
    if (ir > tr) { sw = img.height * tr; sx = (img.width - sw) * (crop.x / 100); }
    else { sh = img.width / tr; sy = (img.height - sh) * (crop.y / 100); }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
  };

  const drawFittedImage = async (ctx: CanvasRenderingContext2D, img: HTMLImageElement, tw: number, th: number, bg: PaddingBg, customColor: string, originalSrc: string) => {
    if (bg === "white") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, tw, th); }
    else if (bg === "black") { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, tw, th); }
    else if (bg === "custom") { ctx.fillStyle = customColor; ctx.fillRect(0, 0, tw, th); }
    else {
      const bc = document.createElement("canvas");
      bc.width = tw; bc.height = th;
      const bctx = bc.getContext("2d")!;
      bctx.filter = "blur(30px)";
      bctx.drawImage(img, 0, 0, tw, th);
      ctx.drawImage(bc, 0, 0);
    }
    const ir = img.width / img.height;
    const tr = tw / th;
    let dw = tw, dh = th;
    if (ir > tr) dh = tw / ir; else dw = th * ir;
    ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh);
  };

  // ─── Process & Export ────────────────────────────────────
  const processImages = async () => {
    if (images.length === 0 || selectedPresets.length === 0) {
      sonnerToast.error("Select images and sizes first");
      return;
    }
    setProcessing(true); setProgress(0);
    const results: ProcessedImage[] = [];
    const total = images.length * selectedPresets.length;
    let done = 0;
    try {
      for (const image of images) {
        const img = await loadImage(image.preview);
        for (const pid of selectedPresets) {
          const preset = SIZE_PRESETS.find(p => p.id === pid);
          if (!preset) continue;
          const canvas = document.createElement("canvas");
          canvas.width = preset.width; canvas.height = preset.height;
          const ctx = canvas.getContext("2d")!;
          if (fitMode === "crop") drawCroppedImage(ctx, img, preset.width, preset.height, image.cropPosition);
          else await drawFittedImage(ctx, img, preset.width, preset.height, paddingBg, customBgColor, image.preview);
          if (borderWidth > 0) {
            ctx.strokeStyle = borderColor; ctx.lineWidth = borderWidth;
            ctx.strokeRect(borderWidth / 2, borderWidth / 2, preset.width - borderWidth, preset.height - borderWidth);
          }
          for (const ov of textOverlays) {
            ctx.font = `${ov.bold ? 'bold ' : ''}${ov.fontSize}px ${ov.fontFamily}`;
            ctx.fillStyle = ov.color; ctx.textBaseline = "top";
            ctx.fillText(ov.text, ov.x, ov.y);
          }
          const mime = outputFormat === "jpg" ? "image/jpeg" : outputFormat === "png" ? "image/png" : "image/webp";
          const q = outputFormat === "png" ? undefined : quality / 100;
          const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), mime, q));
          const baseName = image.name.replace(/\.[^/.]+$/, "");
          const filename = `${baseName}_${preset.id}.${outputFormat}`;
          results.push({ presetId: pid, presetName: preset.name, blob, filename, dataUrl: URL.createObjectURL(blob), width: preset.width, height: preset.height });
          done++; setProgress((done / total) * 100);
        }
      }
      setProcessedImages(results);
      sonnerToast.success(`Generated ${results.length} images`);
    } catch (err) {
      console.error(err);
      sonnerToast.error("Processing failed");
    } finally { setProcessing(false); }
  };

  const downloadSingle = (p: ProcessedImage) => {
    const a = document.createElement("a"); a.href = p.dataUrl; a.download = p.filename; a.click();
  };

  const downloadZip = async () => {
    if (processedImages.length === 0) return;
    const zip = new JSZip();
    processedImages.forEach(p => zip.file(p.filename, p.blob));
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "resized_images.zip"; a.click();
  };

  const addTextOverlay = () => {
    if (!newText.trim()) return;
    setTextOverlays(prev => [...prev, {
      id: `txt_${Date.now()}`, text: newText, x: 50, y: 50,
      fontSize: textSize, color: textColor, fontFamily: "Arial", bold: false,
    }]);
    setNewText("");
  };

  const removeTextOverlay = (id: string) => setTextOverlays(prev => prev.filter(t => t.id !== id));

  // ─── Collage Export ──────────────────────────────────────
  const exportCollage = async () => {
    if (images.length < 2) { sonnerToast.error("Upload at least 2 images for collage"); return; }
    setProcessing(true);
    try {
      const loadedImgs = await Promise.all(images.map(i => loadImage(i.preview)));
      const gap = collageGap;
      let cw = 0, ch = 0;
      if (collageLayout === "horizontal") {
        const h = 800;
        cw = loadedImgs.reduce((sum, img) => sum + (img.width / img.height) * h, 0) + gap * (loadedImgs.length - 1);
        ch = h;
      } else if (collageLayout === "vertical") {
        const w = 800;
        cw = w;
        ch = loadedImgs.reduce((sum, img) => sum + (img.height / img.width) * w, 0) + gap * (loadedImgs.length - 1);
      } else {
        const cols = Math.ceil(Math.sqrt(loadedImgs.length));
        const rows = Math.ceil(loadedImgs.length / cols);
        const cellW = 600, cellH = 600;
        cw = cols * cellW + (cols - 1) * gap;
        ch = rows * cellH + (rows - 1) * gap;
      }
      const canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = collageBgColor; ctx.fillRect(0, 0, cw, ch);
      let x = 0, y = 0;
      if (collageLayout === "horizontal") {
        for (const img of loadedImgs) {
          const w = (img.width / img.height) * 800;
          ctx.drawImage(img, x, 0, w, 800);
          x += w + gap;
        }
      } else if (collageLayout === "vertical") {
        for (const img of loadedImgs) {
          const h = (img.height / img.width) * 800;
          ctx.drawImage(img, 0, y, 800, h);
          y += h + gap;
        }
      } else {
        const cols = Math.ceil(Math.sqrt(loadedImgs.length));
        const cellW = 600, cellH = 600;
        loadedImgs.forEach((img, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          ctx.drawImage(img, col * (cellW + gap), row * (cellH + gap), cellW, cellH);
        });
      }
      const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), "image/png"));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "collage.png"; a.click();
      sonnerToast.success("Collage exported!");
    } catch (err) {
      console.error(err);
      sonnerToast.error("Collage export failed");
    } finally { setProcessing(false); }
  };

  // ─── Render ──────────────────────────────────────────────
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 50%, #EFE6D6 100%)" }}>
      {/* Header */}
      {!embedded && (
        <div className="border-b border-[#B89555]/20" style={{ background: "linear-gradient(135deg, #FDFBF7 0%, #F0E8D8 100%)" }}>
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-[#B89555]/30">
                <ImageIcon className="h-6 w-6 text-[#1A1A1A]" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Image Resizer Pro</h1>
              <Badge className="jj-surface-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30/20 font-medium">Free</Badge>
            </div>
            <p className="text-muted-foreground text-sm ml-[52px]">
              Resize, crop, add text, borders & merge — all processed locally in your browser.
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Save Bar */}
        <div className="mb-5">
          <SaveProjectBar
            projectName={projectName} onNameChange={setProjectName}
            onSave={() => { if (images.length === 0) { sonnerToast.error('No images'); return; } localStorage.setItem(`resize-project-${Date.now()}`, JSON.stringify({ name: projectName, count: images.length, savedAt: new Date().toISOString() })); sonnerToast.success(`Project "${projectName}" saved!`); }}
            onClear={() => { if (!confirm('Clear all?')) return; setImages([]); setProcessedImages([]); setTextOverlays([]); setProjectName('Image Resize Project'); sonnerToast.success('Cleared'); }}
            canSave={images.length > 0} accentColor="hsl(42, 45%, 59%)" accentBorder="hsl(42, 45%, 59%, 0.3)"
          />
        </div>

        <ToolContentWrapper accentColor="hsl(42, 45%, 59%)">
          <div className="grid lg:grid-cols-[1fr_340px] gap-6">

            {/* ━━━ LEFT: Preview + Thumbnails ━━━ */}
            <div className="space-y-4">
              {/* Upload Zone (shown when no images) */}
              {!hasImages && (
                <div
                  className="rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 border-2 border-dashed border-[#B89555]/30 hover:border-[#B89555]/60 bg-[#FDFBF7]/60 hover:bg-[#FDFBF7]/80"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Upload className="h-14 w-14 mx-auto mb-4 text-[#1A1A1A]/70" />
                  <p className="text-foreground font-semibold text-lg mb-1">Drop images here or click to upload</p>
                  <p className="text-muted-foreground text-sm">JPG, PNG, WebP — unlimited photos</p>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                </div>
              )}

              {/* Live Preview Area */}
              {hasImages && activeImage && (
                <div className="bg-[#FDFBF7] rounded-2xl border border-[#B89555]/30 shadow-sm overflow-hidden">
                  {/* Preview Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#B89555]/30 bg-[#F7F2EA]/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full jj-surface-emerald" />
                      <span className="text-sm font-medium text-foreground">Live Preview</span>
                      {activePreset && (
                        <Badge variant="outline" className="text-xs border-[#B89555]/30 text-[#1A1A1A]-dark font-mono">
                          {activePreset.width} × {activePreset.height}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{activeImage.name}</span>
                      <Badge variant="outline" className="text-xs ml-1">{activeImage.width}×{activeImage.height}</Badge>
                    </div>
                  </div>

                  {/* Canvas Preview */}
                  <div className="flex items-center justify-center p-6 min-h-[400px] bg-[repeating-conic-gradient(#f3f3f3_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
                    <canvas
                      ref={previewCanvasRef}
                      className="max-w-full max-h-[500px] rounded-lg shadow-lg border border-[#B89555]/30"
                    />
                  </div>

                  {/* Editing Toolbar */}
                  <div className="flex items-center gap-1 px-4 py-2.5 border-t border-[#B89555]/30 bg-[#F7F2EA]/50 overflow-x-auto">
                    {([
                      { id: "none" as EditTool, icon: <Maximize className="h-4 w-4" />, label: "Select" },
                      { id: "text" as EditTool, icon: <Type className="h-4 w-4" />, label: "Text" },
                      { id: "border" as EditTool, icon: <Square className="h-4 w-4" />, label: "Border" },
                      { id: "collage" as EditTool, icon: <LayoutGrid className="h-4 w-4" />, label: "Collage" },
                    ]).map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          setActiveTool(tool.id);
                          if (tool.id === "collage") setCollageMode(true);
                          else setCollageMode(false);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                          activeTool === tool.id
                            ? "bg-gradient-to-r from-gold/20 to-gold/10 text-foreground border border-[#B89555]/40 shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-[#F7F2EA]"
                        )}
                      >
                        {tool.icon} {tool.label}
                      </button>
                    ))}
                    <div className="h-5 w-px bg-[#EFE6D6] mx-1" />
                    <button
                      onClick={() => {
                        const stamp = sessionStorage.getItem('savedStamp');
                        if (stamp) {
                          setTextOverlays(prev => [...prev, { id: `stamp_${Date.now()}`, text: "⬡ Stamp", x: 100, y: 100, fontSize: 36, color: "#1a365d", fontFamily: "Arial", bold: true }]);
                          sonnerToast.success("Stamp added from Scan & Sign");
                        } else {
                          sonnerToast.info("No stamp saved — create one in Stamp Generator first");
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-[#F7F2EA] whitespace-nowrap"
                    >
                      <Stamp className="h-4 w-4" /> Stamp
                    </button>
                    <button
                      onClick={() => {
                        const d = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                        setTextOverlays(prev => [...prev, { id: `date_${Date.now()}`, text: d, x: 20, y: 20, fontSize: 28, color: "#333", fontFamily: "Arial", bold: false }]);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-[#F7F2EA] whitespace-nowrap"
                    >
                      <CalendarDays className="h-4 w-4" /> Date
                    </button>
                  </div>

                  {/* Tool-specific controls */}
                  {activeTool === "text" && (
                    <div className="px-4 py-3 border-t border-[#B89555]/30 bg-[#FDFBF7] space-y-3">
                      <div className="flex gap-2">
                        <Input value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Enter text..." className="flex-1 h-9 text-sm" />
                        <Button size="sm" onClick={addTextOverlay} className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] h-9">Add</Button>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs text-muted-foreground">Color</label>
                          <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-[#B89555]/30" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs text-muted-foreground">Size</label>
                          <Slider value={[textSize]} min={12} max={120} step={2} onValueChange={([v]) => setTextSize(v)} className="w-24" />
                          <span className="text-xs font-mono text-muted-foreground w-8">{textSize}</span>
                        </div>
                      </div>
                      {textOverlays.length > 0 && (
                        <div className="space-y-1">
                          {textOverlays.map(ov => (
                            <div key={ov.id} className="flex items-center justify-between bg-[#F7F2EA] rounded px-2 py-1">
                              <span className="text-xs text-foreground truncate">{ov.text}</span>
                              <button onClick={() => removeTextOverlay(ov.id)} className="text-red-400 hover:text-red-600 ml-2"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTool === "border" && (
                    <div className="px-4 py-3 border-t border-[#B89555]/30 bg-[#FDFBF7] space-y-3">
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-muted-foreground whitespace-nowrap">Width</label>
                        <Slider value={[borderWidth]} min={0} max={60} step={2} onValueChange={([v]) => setBorderWidth(v)} className="flex-1" />
                        <span className="text-xs font-mono text-muted-foreground w-8">{borderWidth}px</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Color</label>
                        <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-[#B89555]/30" />
                        <button onClick={() => setBorderWidth(0)} className="text-xs text-red-500 hover:text-red-700 ml-auto">Reset</button>
                      </div>
                    </div>
                  )}

                  {activeTool === "collage" && (
                    <div className="px-4 py-3 border-t border-[#B89555]/30 bg-[#FDFBF7] space-y-3">
                      <div className="flex gap-2">
                        {(["horizontal", "vertical", "grid"] as const).map(layout => (
                          <button key={layout} onClick={() => setCollageLayout(layout)}
                            className={cn("flex-1 text-xs py-1.5 rounded-lg font-medium capitalize transition-all",
                              collageLayout === layout ? "bg-[#EFE6D6]/20 border border-[#B89555]/40 text-foreground" : "bg-[#F7F2EA] text-muted-foreground hover:bg-[#EFE6D6]"
                            )}>
                            {layout}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-muted-foreground">Gap</label>
                        <Slider value={[collageGap]} min={0} max={80} step={5} onValueChange={([v]) => setCollageGap(v)} className="flex-1" />
                        <span className="text-xs font-mono text-muted-foreground w-8">{collageGap}px</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Background</label>
                        <input type="color" value={collageBgColor} onChange={(e) => setCollageBgColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-[#B89555]/30" />
                      </div>
                      <Button onClick={exportCollage} disabled={images.length < 2 || processing} className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
                        <Layers className="h-4 w-4 mr-2" /> Export Collage ({images.length} images)
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Thumbnail Strip */}
              {hasImages && (
                <div className="bg-[#FDFBF7] rounded-xl border border-[#B89555]/30 shadow-sm p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-foreground">Images ({images.length})</span>
                    <div className="flex-1" />
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 text-xs text-[#1A1A1A] hover:text-[#1A1A1A]-dark font-medium">
                      <Plus className="h-3.5 w-3.5" /> Add More
                    </button>
                  </div>
                  <div ref={thumbnailStripRef} className="flex gap-2 overflow-x-auto pb-1 jj-scrollbar-gold-x">
                    {images.map(img => (
                      <div
                        key={img.id}
                        onClick={() => setActiveImageId(img.id)}
                        className={cn(
                          "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all group",
                          activeImageId === img.id || (!activeImageId && images[0]?.id === img.id)
                            ? "border-[#B89555] shadow-md ring-2 ring-gold/20"
                            : "border-[#B89555]/30 hover:border-[#B89555]/50"
                        )}
                      >
                        <img src={img.preview} alt={img.name} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                        <button
                          onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-2.5 w-2.5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                </div>
              )}

              {/* Generated Results */}
              {processedImages.length > 0 && (
                <div className="bg-[#FDFBF7] rounded-2xl border border-[color:var(--emerald-1)]/30 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-green-100 jj-emerald-soft/50">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Check className="h-4 w-4 text-[color:var(--emerald-1)]" />
                      Generated ({processedImages.length})
                    </h3>
                    <Button size="sm" onClick={downloadZip} className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] h-8">
                      <FileArchive className="h-3.5 w-3.5 mr-1.5" /> Download ZIP
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
                    {processedImages.map((p, i) => (
                      <div key={i} className="group relative">
                        <div className="aspect-square rounded-lg overflow-hidden bg-[#F7F2EA] border border-[#B89555]/30">
                          <img src={p.dataUrl} alt={p.filename} className="w-full h-full object-contain"  loading="lazy" decoding="async" />
                        </div>
                        <button onClick={() => downloadSingle(p)}
                          className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-[#EFE6D6]/90 hover:bg-[#EFE6D6] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                          <Download className="h-3.5 w-3.5 text-[#1A1A1A]" />
                        </button>
                        <p className="text-xs text-foreground font-medium mt-1.5 truncate">{p.presetName}</p>
                        <p className="text-xs text-muted-foreground">{p.width}×{p.height}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ━━━ RIGHT: Settings Panel ━━━ */}
            <div className="space-y-4">
              {/* Preset Selector */}
              <div className="bg-[#FDFBF7] rounded-2xl border border-[#B89555]/30 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#B89555]/30">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4 text-[#1A1A1A]" /> Size Presets
                  </h3>
                  <button onClick={selectAllPresets} className="text-xs text-[#1A1A1A] hover:text-[#1A1A1A]-dark font-medium">
                    {selectedPresets.length === SIZE_PRESETS.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="p-2 max-h-[360px] overflow-y-auto space-y-1">
                  {SIZE_PRESETS.map(preset => {
                    const selected = selectedPresets.includes(preset.id);
                    const isActive = activePreviewPreset === preset.id;
                    return (
                      <div
                        key={preset.id}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all text-sm",
                          isActive
                            ? "bg-gradient-to-r from-gold/15 to-gold/5 border border-[#B89555]/30"
                            : "hover:bg-[#F7F2EA] border border-transparent"
                        )}
                        onClick={() => togglePreset(preset.id)}
                      >
                        <Checkbox checked={selected} className="border-[#B89555]/50 data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:border-[#B89555]" />
                        <span className="text-base">{preset.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium text-[13px] truncate">{preset.name}</p>
                          <p className="text-muted-foreground text-[11px]">{preset.width}×{preset.height}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActivePreviewPreset(preset.id); if (!selected) togglePreset(preset.id); }}
                          className="text-xs text-[#1A1A1A] hover:text-[#1A1A1A]-dark opacity-0 group-hover:opacity-100"
                          title="Preview this size"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fit Mode */}
              <div className="bg-[#FDFBF7] rounded-2xl border border-[#B89555]/30 shadow-sm p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Crop className="h-4 w-4 text-[#1A1A1A]" /> Fit Mode
                </h3>
                <RadioGroup value={fitMode} onValueChange={(v) => setFitMode(v as FitMode)} className="space-y-2">
                  <div className={cn("flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer",
                    fitMode === "crop" ? "border-[#B89555]/40 bg-[#EFE6D6]/5" : "border-[#B89555]/30 hover:border-[#B89555]/30")}>
                    <RadioGroupItem value="crop" id="crop" className="border-[#B89555] text-[#1A1A1A]" />
                    <Label htmlFor="crop" className="cursor-pointer flex-1">
                      <span className="text-sm font-medium text-foreground">Crop to Fill</span>
                      <p className="text-xs text-muted-foreground">Fills entire frame, may crop edges</p>
                    </Label>
                  </div>
                  <div className={cn("flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer",
                    fitMode === "fit" ? "border-[#B89555]/40 bg-[#EFE6D6]/5" : "border-[#B89555]/30 hover:border-[#B89555]/30")}>
                    <RadioGroupItem value="fit" id="fit" className="border-[#B89555] text-[#1A1A1A]" />
                    <Label htmlFor="fit" className="cursor-pointer flex-1">
                      <span className="text-sm font-medium text-foreground">Fit with Padding</span>
                      <p className="text-xs text-muted-foreground">Full image with background fill</p>
                    </Label>
                  </div>
                </RadioGroup>

                {fitMode === "fit" && (
                  <div className="pt-2 border-t border-[#B89555]/30 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Background</p>
                    <div className="flex gap-1.5">
                      {(["white", "black", "blur", "custom"] as PaddingBg[]).map(bg => (
                        <button key={bg} onClick={() => setPaddingBg(bg)}
                          className={cn("flex-1 capitalize text-xs font-medium py-1.5 rounded-lg transition-all border",
                            paddingBg === bg
                              ? "bg-[#EFE6D6]/15 border-[#B89555]/40 text-foreground"
                              : "bg-[#F7F2EA] border-[#B89555]/30 text-muted-foreground hover:bg-[#F7F2EA]"
                          )}>
                          {bg}
                        </button>
                      ))}
                    </div>
                    {paddingBg === "custom" && (
                      <div className="flex items-center gap-2 pt-1">
                        <input type="color" value={customBgColor} onChange={(e) => setCustomBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[#B89555]/30" />
                        <span className="text-xs text-muted-foreground font-mono">{customBgColor}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Crop position when crop mode active */}
                {fitMode === "crop" && activeImage && (
                  <div className="pt-2 border-t border-[#B89555]/30 space-y-3">
                    {/* AI Smart Crop Button */}
                    <Button
                      size="sm"
                      onClick={handleSmartCrop}
                      disabled={smartCropLoading}
                      className="jj-cta-dark w-full font-medium text-xs h-9"
                    >
                      {smartCropLoading ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Analyzing with AI Pro...</>
                      ) : (
                        <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI Smart Crop Pro</>
                      )}
                    </Button>
                    {smartCropSubject && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-violet-50 border border-violet-200">
                          <Target className="h-3 w-3 text-violet-600 shrink-0" />
                          <span className="text-xs text-violet-700 truncate">Focused on: {smartCropSubject}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {smartCropConfidence !== null && (
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
 smartCropConfidence >= 80 ? "jj-emerald-soft text-[color:var(--emerald-1)]" :
 smartCropConfidence >= 50 ? "bg-amber-100 text-amber-700" :
 "bg-red-100 text-red-700"
 }`}>
                              <span>{smartCropConfidence}%</span>
                            </div>
                          )}
                          {smartCropComposition && (
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {smartCropComposition.replace(/-/g, " ")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground font-medium">Manual Crop Focus</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">X</span>
                        <Slider value={[activeImage.cropPosition.x]} min={0} max={100} step={1}
                          onValueChange={([v]) => { setImages(prev => prev.map(i => i.id === activeImage.id ? { ...i, cropPosition: { ...i.cropPosition, x: v } } : i)); setSmartCropSubject(null); }} className="flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">Y</span>
                        <Slider value={[activeImage.cropPosition.y]} min={0} max={100} step={1}
                          onValueChange={([v]) => { setImages(prev => prev.map(i => i.id === activeImage.id ? { ...i, cropPosition: { ...i.cropPosition, y: v } } : i)); setSmartCropSubject(null); }} className="flex-1" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Output Settings */}
              <div className="bg-[#FDFBF7] rounded-2xl border border-[#B89555]/30 shadow-sm p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[#1A1A1A]" /> Output
                </h3>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Format</p>
                  <div className="flex gap-1.5">
                    {(["jpg", "png", "webp"] as OutputFormat[]).map(fmt => (
                      <button key={fmt} onClick={() => setOutputFormat(fmt)}
                        className={cn("flex-1 uppercase text-xs font-semibold py-1.5 rounded-lg transition-all border",
                          outputFormat === fmt
                            ? "bg-[#EFE6D6]/15 border-[#B89555]/40 text-foreground"
                            : "bg-[#F7F2EA] border-[#B89555]/30 text-muted-foreground hover:bg-[#F7F2EA]"
                        )}>
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
                {outputFormat !== "png" && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Quality</p>
                      <span className="text-xs font-mono text-[#1A1A1A] font-medium">{quality}%</span>
                    </div>
                    <Slider value={[quality]} min={10} max={100} step={5} onValueChange={([v]) => setQuality(v)} />
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <Button
                onClick={processImages}
                disabled={processing || !hasImages || selectedPresets.length === 0}
                className="w-full h-12 bg-gradient-to-r from-gold to-[#d4af37] hover:from-gold/90 hover:to-[#d4af37]/90 text-[#1A1A1A] font-bold text-base shadow-lg shadow-gold/20 rounded-xl"
              >
                {processing ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><ImageIcon className="h-5 w-5 mr-2" /> Resize & Export ({selectedPresets.length} sizes)</>
                )}
              </Button>

              {processing && (
                <div className="space-y-1.5">
                  <Progress value={progress} className="h-2" />
                  <p className="text-center text-muted-foreground text-xs">{Math.round(progress)}%</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center px-2">
                All processing is local — your images never leave your device. Free with fair usage.
              </p>
            </div>
          </div>
        </ToolContentWrapper>
      </div>
    </div>
  );
}
