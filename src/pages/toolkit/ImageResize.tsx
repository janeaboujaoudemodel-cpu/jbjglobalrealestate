import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  FileArchive,
  Loader2,
  Check,
  Move,
  Crop,
  Square
} from "lucide-react";
import JSZip from "jszip";

// Size presets
const SIZE_PRESETS = [
  { id: "instagram_square", name: "Instagram Post", ratio: "1:1", width: 1080, height: 1080 },
  { id: "instagram_portrait", name: "Instagram Portrait", ratio: "4:5", width: 1080, height: 1350 },
  { id: "instagram_story", name: "Instagram Story/Reel", ratio: "9:16", width: 1080, height: 1920 },
  { id: "youtube_thumb", name: "YouTube Thumbnail", ratio: "16:9", width: 1280, height: 720 },
  { id: "linkedin_post", name: "LinkedIn Post", ratio: "1.91:1", width: 1200, height: 628 },
  { id: "website_hero", name: "Website Hero", ratio: "16:9", width: 1920, height: 1080 },
];

type FitMode = "crop" | "fit";
type PaddingBg = "white" | "black" | "blur";
type OutputFormat = "jpg" | "png" | "webp";

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
}

interface ImageResizeProps { embedded?: boolean; }

export default function ImageResize({ embedded = false }: ImageResizeProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedPresets, setSelectedPresets] = useState<string[]>(["instagram_square"]);
  const [fitMode, setFitMode] = useState<FitMode>("crop");
  const [paddingBg, setPaddingBg] = useState<PaddingBg>("white");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpg");
  const [quality, setQuality] = useState(85);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;
    
    const newImages: UploadedImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      
      const preview = URL.createObjectURL(file);
      const dimensions = await getImageDimensions(preview);
      
      const orientation = dimensions.width > dimensions.height 
        ? "landscape" 
        : dimensions.width < dimensions.height 
          ? "portrait" 
          : "square";
      
      newImages.push({
        id: `img_${Date.now()}_${i}`,
        file,
        name: file.name,
        preview,
        width: dimensions.width,
        height: dimensions.height,
        orientation,
        cropPosition: { x: 50, y: 50 },
      });
    }
    
    setImages(prev => [...prev, ...newImages]);
    setProcessedImages([]);
  }, []);

  const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = src;
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
    setProcessedImages([]);
  };

  const togglePreset = (presetId: string) => {
    setSelectedPresets(prev => 
      prev.includes(presetId) 
        ? prev.filter(p => p !== presetId)
        : [...prev, presetId]
    );
    setProcessedImages([]);
  };

  const updateCropPosition = (imageId: string, x: number, y: number) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, cropPosition: { x, y } } : img
    ));
  };

  const processImages = async () => {
    if (images.length === 0 || selectedPresets.length === 0) {
      toast({ title: "Select images and sizes", variant: "destructive" });
      return;
    }

    setProcessing(true);
    setProgress(0);
    const results: ProcessedImage[] = [];
    const totalOperations = images.length * selectedPresets.length;
    let completed = 0;

    try {
      for (const image of images) {
        const img = await loadImage(image.preview);
        
        for (const presetId of selectedPresets) {
          const preset = SIZE_PRESETS.find(p => p.id === presetId);
          if (!preset) continue;

          const canvas = document.createElement("canvas");
          canvas.width = preset.width;
          canvas.height = preset.height;
          const ctx = canvas.getContext("2d")!;

          if (fitMode === "crop") {
            drawCroppedImage(ctx, img, preset.width, preset.height, image.cropPosition);
          } else {
            await drawFittedImage(ctx, img, preset.width, preset.height, paddingBg, image.preview);
          }

          const mimeType = outputFormat === "jpg" ? "image/jpeg" : 
                          outputFormat === "png" ? "image/png" : "image/webp";
          const qualityValue = outputFormat === "png" ? undefined : quality / 100;
          
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), mimeType, qualityValue);
          });

          const baseName = image.name.replace(/\.[^/.]+$/, "");
          const filename = `${baseName}_${preset.id}.${outputFormat}`;

          results.push({
            presetId,
            presetName: preset.name,
            blob,
            filename,
            dataUrl: URL.createObjectURL(blob),
          });

          completed++;
          setProgress((completed / totalOperations) * 100);
        }
      }

      setProcessedImages(results);
      toast({ title: `Generated ${results.length} images` });
    } catch (error) {
      console.error("Processing error:", error);
      toast({ title: "Processing failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const drawCroppedImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number,
    cropPosition: { x: number; y: number }
  ) => {
    const targetRatio = targetWidth / targetHeight;
    const imgRatio = img.width / img.height;

    let sourceWidth = img.width;
    let sourceHeight = img.height;
    let sourceX = 0;
    let sourceY = 0;

    if (imgRatio > targetRatio) {
      sourceWidth = img.height * targetRatio;
      sourceX = (img.width - sourceWidth) * (cropPosition.x / 100);
    } else {
      sourceHeight = img.width / targetRatio;
      sourceY = (img.height - sourceHeight) * (cropPosition.y / 100);
    }

    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, targetWidth, targetHeight
    );
  };

  const drawFittedImage = async (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number,
    background: PaddingBg,
    originalSrc: string
  ) => {
    // Fill background
    if (background === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else if (background === "black") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else {
      // Blur background
      const blurCanvas = document.createElement("canvas");
      blurCanvas.width = targetWidth;
      blurCanvas.height = targetHeight;
      const blurCtx = blurCanvas.getContext("2d")!;
      blurCtx.filter = "blur(30px)";
      blurCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
      ctx.drawImage(blurCanvas, 0, 0);
    }

    // Calculate fitted dimensions
    const imgRatio = img.width / img.height;
    const targetRatio = targetWidth / targetHeight;

    let drawWidth = targetWidth;
    let drawHeight = targetHeight;

    if (imgRatio > targetRatio) {
      drawHeight = targetWidth / imgRatio;
    } else {
      drawWidth = targetHeight * imgRatio;
    }

    const x = (targetWidth - drawWidth) / 2;
    const y = (targetHeight - drawHeight) / 2;

    ctx.drawImage(img, x, y, drawWidth, drawHeight);
  };

  const downloadSingle = (processed: ProcessedImage) => {
    const link = document.createElement("a");
    link.href = processed.dataUrl;
    link.download = processed.filename;
    link.click();
  };

  const downloadZip = async () => {
    if (processedImages.length === 0) return;

    const zip = new JSZip();
    
    for (const processed of processedImages) {
      zip.file(processed.filename, processed.blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = "resized_images.zip";
    link.click();
  };

  return (
    <div style={{ background: "#0C0E14", minHeight: "100vh" }}>
      {!embedded && (
        <div style={{ background: "linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)", borderBottom: "1px solid rgba(99,102,241,0.2)" }}>
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)" }}>
                <ImageIcon className="h-6 w-6 text-gold" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Image Resizer + Social Sizes Pack</h1>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Free</Badge>
            </div>
            <p style={{ color: "rgba(255,255,255,0.4)" }}>Resize images for Instagram, YouTube, LinkedIn and more. All processing happens in your browser.</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Upload & Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Area */}
            <Card style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.2)" }}>
              <CardContent className="p-6">
                <div
                  className="rounded-2xl p-8 text-center cursor-pointer transition-all duration-300"
                  style={{ border: "2px dashed rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.02)" }}
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.6)"; (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.05)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.02)"; }}
                  onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: "rgba(201,168,76,0.5)" }} />
                  <p className="text-white font-medium mb-2">Drop images here or click to upload</p>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>JPG, PNG, WebP, HEIC supported</p>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Images */}
            {images.length > 0 && (
              <Card className="bg-[#111]/80 border-gold/20">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold mb-4">
                    Uploaded Images ({images.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-black/50 border border-gold/20">
                          <img
                            src={image.preview}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-black/70 text-champagne text-xs">
                            {image.orientation}
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 bg-black/70 hover:bg-gold/20"
                            onClick={() => setEditingImageId(
                              editingImageId === image.id ? null : image.id
                            )}
                          >
                            <Move className="h-3.5 w-3.5 text-white" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 bg-black/70 hover:bg-red-500/20"
                            onClick={() => removeImage(image.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </div>
                        <p className="text-xs text-champagne/60 mt-2 truncate">
                          {image.name}
                        </p>
                        <p className="text-xs text-champagne/40">
                          {image.width} × {image.height}
                        </p>
                        
                        {/* Crop Position Editor */}
                        {editingImageId === image.id && fitMode === "crop" && (
                          <div className="mt-3 p-3 bg-black/50 rounded-lg border border-gold/20">
                            <p className="text-xs text-champagne/70 mb-2">Crop Focus Point</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-champagne/50 w-6">X:</span>
                                <Slider
                                  value={[image.cropPosition.x]}
                                  min={0}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                  onValueChange={([v]) => updateCropPosition(image.id, v, image.cropPosition.y)}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-champagne/50 w-6">Y:</span>
                                <Slider
                                  value={[image.cropPosition.y]}
                                  min={0}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                  onValueChange={([v]) => updateCropPosition(image.id, image.cropPosition.x, v)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {processedImages.length > 0 && (
              <Card className="bg-[#111]/80 border-green-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-400" />
                      Generated Images ({processedImages.length})
                    </h3>
                    <Button
                      onClick={downloadZip}
                      className="bg-gold hover:bg-gold/90 text-black"
                    >
                      <FileArchive className="h-4 w-4 mr-2" />
                      Download ZIP
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {processedImages.map((processed, idx) => (
                      <div key={idx} className="group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-black/50 border border-gold/20 relative">
                          <img
                            src={processed.dataUrl}
                            alt={processed.filename}
                            className="w-full h-full object-contain bg-[#1a1a1a]"
                          />
                          <Button
                            size="icon"
                            className="absolute bottom-2 right-2 h-8 w-8 bg-gold hover:bg-gold/90 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => downloadSingle(processed)}
                          >
                            <Download className="h-4 w-4 text-black" />
                          </Button>
                        </div>
                        <p className="text-xs text-gold mt-2">{processed.presetName}</p>
                        <p className="text-xs text-champagne/50 truncate">{processed.filename}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Settings */}
          <div className="space-y-6">
            {/* Size Presets */}
            <Card className="bg-[#111]/80 border-gold/20">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Square className="h-4 w-4 text-gold" />
                  Size Presets
                </h3>
                <div className="space-y-3">
                  {SIZE_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-gold/10 hover:border-gold/30 transition-colors cursor-pointer"
                      onClick={() => togglePreset(preset.id)}
                    >
                      <Checkbox
                        checked={selectedPresets.includes(preset.id)}
                        className="border-gold/50 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{preset.name}</p>
                        <p className="text-champagne/50 text-xs">
                          {preset.width} × {preset.height} ({preset.ratio})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fit Mode */}
            <Card className="bg-[#111]/80 border-gold/20">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Crop className="h-4 w-4 text-gold" />
                  Fit Mode
                </h3>
                <RadioGroup value={fitMode} onValueChange={(v) => setFitMode(v as FitMode)}>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-gold/10">
                    <RadioGroupItem value="crop" id="crop" className="border-gold text-gold" />
                    <Label htmlFor="crop" className="text-white cursor-pointer flex-1">
                      <span className="font-medium">Crop to Fill</span>
                      <p className="text-xs text-champagne/50">Fills entire frame, may crop edges</p>
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-gold/10 mt-2">
                    <RadioGroupItem value="fit" id="fit" className="border-gold text-gold" />
                    <Label htmlFor="fit" className="text-white cursor-pointer flex-1">
                      <span className="font-medium">Fit with Padding</span>
                      <p className="text-xs text-champagne/50">Shows full image with background</p>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Padding Background */}
                {fitMode === "fit" && (
                  <div className="mt-4 pt-4 border-t border-gold/10">
                    <p className="text-champagne/70 text-sm mb-3">Background</p>
                    <div className="flex gap-2">
                      {(["white", "black", "blur"] as PaddingBg[]).map((bg) => (
                        <Button
                          key={bg}
                          variant="outline"
                          size="sm"
                          className={`flex-1 capitalize ${
                            paddingBg === bg 
                              ? "bg-gold/20 border-gold text-gold" 
                              : "border-gold/30 text-champagne/70"
                          }`}
                          onClick={() => setPaddingBg(bg)}
                        >
                          {bg}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Output Settings */}
            <Card className="bg-[#111]/80 border-gold/20">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-4">Output Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-champagne/70 text-sm mb-2">Format</p>
                    <div className="flex gap-2">
                      {(["jpg", "png", "webp"] as OutputFormat[]).map((fmt) => (
                        <Button
                          key={fmt}
                          variant="outline"
                          size="sm"
                          className={`flex-1 uppercase ${
                            outputFormat === fmt 
                              ? "bg-gold/20 border-gold text-gold" 
                              : "border-gold/30 text-champagne/70"
                          }`}
                          onClick={() => setOutputFormat(fmt)}
                        >
                          {fmt}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {outputFormat !== "png" && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <p className="text-champagne/70 text-sm">Quality</p>
                        <span className="text-gold text-sm font-medium">{quality}%</span>
                      </div>
                      <Slider
                        value={[quality]}
                        min={10}
                        max={100}
                        step={5}
                        onValueChange={([v]) => setQuality(v)}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={processImages}
              disabled={processing || images.length === 0 || selectedPresets.length === 0}
              className="w-full h-14 bg-gradient-to-r from-gold to-[#d4af37] hover:from-gold/90 hover:to-[#d4af37]/90 text-black font-bold text-lg shadow-lg shadow-gold/20"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Resize & Export
                </>
              )}
            </Button>

            {processing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-center text-champagne/50 text-sm">
                  {Math.round(progress)}% complete
                </p>
              </div>
            )}

            {/* Fair Usage Notice */}
            <p className="text-xs text-champagne/40 text-center">
              Free tool with fair usage limits. All processing happens in your browser – 
              your images never leave your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
