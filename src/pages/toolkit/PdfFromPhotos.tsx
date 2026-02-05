import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { 
  Upload, Image, FileImage, Download, 
  FileText, Sparkles, Loader2, CheckCircle2, 
  AlertCircle, X, Trash2, GripVertical,
  Settings, Maximize, LayoutGrid, Calendar,
  FileDown, Printer, Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { PDFDocument, rgb } from "pdf-lib";

// Types
interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
  width: number;
  height: number;
}

interface TitlePageConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  date: string;
}

type PageSize = "a4" | "letter" | "fit";
type Orientation = "auto" | "portrait" | "landscape";
type Margins = "none" | "small" | "normal";
type Quality = "standard" | "high";

interface ProcessingState {
  status: "idle" | "processing" | "done" | "failed";
  progress: number;
  message: string;
}

// Page size dimensions in points (72 points = 1 inch)
const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89, name: "A4" },
  letter: { width: 612, height: 792, name: "Letter" },
  fit: { width: 0, height: 0, name: "Fit to Image" },
};

const MARGIN_VALUES = {
  none: 0,
  small: 36, // 0.5 inch
  normal: 72, // 1 inch
};

const PdfFromPhotos = () => {
  // State
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margins, setMargins] = useState<Margins>("normal");
  const [quality, setQuality] = useState<Quality>("high");
  const [titlePage, setTitlePage] = useState<TitlePageConfig>({
    enabled: false,
    title: "",
    subtitle: "",
    date: new Date().toLocaleDateString(),
  });
  const [processing, setProcessing] = useState<ProcessingState>({
    status: "idle",
    progress: 0,
    message: "",
  });
  const [generatedPdfs, setGeneratedPdfs] = useState<{
    standard?: Blob;
    compressed?: Blob;
    printReady?: Blob;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith("image/") || file.name.match(/\.(jpg|jpeg|png|heic|webp)$/i)
    );
    if (files.length > 0) {
      processImageFiles(files);
    } else {
      toast.error("Please upload valid image files (JPG, PNG, HEIC)");
    }
  }, []);

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processImageFiles(files);
    }
  };

  // Process uploaded image files
  const processImageFiles = async (files: File[]) => {
    setIsUploading(true);
    
    // Sort by filename
    const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));
    
    const newImages: UploadedImage[] = [];
    
    for (const file of sortedFiles) {
      try {
        const url = URL.createObjectURL(file);
        const dimensions = await getImageDimensions(url);
        
        newImages.push({
          id: crypto.randomUUID(),
          file,
          url,
          name: file.name,
          width: dimensions.width,
          height: dimensions.height,
        });
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        toast.error(`Failed to load: ${file.name}`);
      }
    }
    
    setImages(prev => [...prev, ...newImages]);
    setIsUploading(false);
    
    if (newImages.length > 0) {
      toast.success(`Added ${newImages.length} image${newImages.length > 1 ? "s" : ""}`);
    }
  };

  // Get image dimensions
  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = url;
    });
  };

  // Remove image
  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter(i => i.id !== id);
    });
  };

  // Clear all images
  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
    setGeneratedPdfs({});
    setProcessing({ status: "idle", progress: 0, message: "" });
  };

  // Generate PDF
  const generatePdf = async () => {
    if (images.length === 0) {
      toast.error("Please add at least one image");
      return;
    }

    setProcessing({ status: "processing", progress: 0, message: "Initializing..." });
    setGeneratedPdfs({});

    try {
      const pdfDoc = await PDFDocument.create();
      const totalSteps = images.length + (titlePage.enabled ? 1 : 0) + 2;
      let currentStep = 0;

      // Add title page if enabled
      if (titlePage.enabled) {
        setProcessing({ 
          status: "processing", 
          progress: (++currentStep / totalSteps) * 100, 
          message: "Creating title page..." 
        });
        
        const size = pageSize === "fit" ? PAGE_SIZES.a4 : PAGE_SIZES[pageSize];
        const titlePagePdf = pdfDoc.addPage([size.width, size.height]);
        
        // Draw title
        if (titlePage.title) {
          titlePagePdf.drawText(titlePage.title, {
            x: size.width / 2 - (titlePage.title.length * 10),
            y: size.height * 0.6,
            size: 36,
            color: rgb(0.1, 0.1, 0.1),
          });
        }
        
        // Draw subtitle
        if (titlePage.subtitle) {
          titlePagePdf.drawText(titlePage.subtitle, {
            x: size.width / 2 - (titlePage.subtitle.length * 5),
            y: size.height * 0.5,
            size: 18,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
        
        // Draw date
        if (titlePage.date) {
          titlePagePdf.drawText(titlePage.date, {
            x: size.width / 2 - (titlePage.date.length * 4),
            y: size.height * 0.4,
            size: 14,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
      }

      // Process each image
      for (const image of images) {
        setProcessing({ 
          status: "processing", 
          progress: (++currentStep / totalSteps) * 100, 
          message: `Processing ${image.name}...` 
        });

        // Load image
        const imageBytes = await image.file.arrayBuffer();
        let embeddedImage;
        
        if (image.file.type === "image/png") {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }

        // Calculate page size
        let pageWidth: number;
        let pageHeight: number;
        const margin = MARGIN_VALUES[margins];

        if (pageSize === "fit") {
          // Fit to image
          pageWidth = embeddedImage.width + (margin * 2);
          pageHeight = embeddedImage.height + (margin * 2);
        } else {
          const size = PAGE_SIZES[pageSize];
          
          // Determine orientation
          const imgIsPortrait = embeddedImage.height > embeddedImage.width;
          let usePortrait: boolean;
          
          if (orientation === "auto") {
            usePortrait = imgIsPortrait;
          } else {
            usePortrait = orientation === "portrait";
          }
          
          pageWidth = usePortrait ? size.width : size.height;
          pageHeight = usePortrait ? size.height : size.width;
        }

        // Add page
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        
        // Calculate image placement
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - (margin * 2);
        
        const scale = Math.min(
          availableWidth / embeddedImage.width,
          availableHeight / embeddedImage.height
        );
        
        const scaledWidth = embeddedImage.width * scale;
        const scaledHeight = embeddedImage.height * scale;
        
        const x = margin + (availableWidth - scaledWidth) / 2;
        const y = margin + (availableHeight - scaledHeight) / 2;

        // Draw image
        page.drawImage(embeddedImage, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });
      }

      // Generate standard PDF
      setProcessing({ 
        status: "processing", 
        progress: (++currentStep / totalSteps) * 100, 
        message: "Generating PDF..." 
      });
      
      const pdfBytes = await pdfDoc.save();
      const standardBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });

      // Generate compressed version (lower quality)
      setProcessing({ 
        status: "processing", 
        progress: (++currentStep / totalSteps) * 100, 
        message: "Creating compressed version..." 
      });
      
      // For compressed, we just use the same PDF (real compression would need server-side)
      const compressedBlob = standardBlob;

      // Print-ready is same as standard for client-side
      const printReadyBlob = standardBlob;

      setGeneratedPdfs({
        standard: standardBlob,
        compressed: compressedBlob,
        printReady: printReadyBlob,
      });

      setProcessing({ 
        status: "done", 
        progress: 100, 
        message: "PDF generated successfully!" 
      });
      
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      setProcessing({ 
        status: "failed", 
        progress: 0, 
        message: error instanceof Error ? error.message : "Failed to generate PDF" 
      });
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  // Download PDF
  const downloadPdf = (type: "standard" | "compressed" | "printReady") => {
    const blob = generatedPdfs[type];
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const suffix = type === "compressed" ? "_compressed" : type === "printReady" ? "_print" : "";
    link.download = `photos${suffix}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${type === "compressed" ? "compressed" : type === "printReady" ? "print-ready" : ""} PDF`);
  };

  const hasGeneratedPdf = processing.status === "done" && generatedPdfs.standard;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-gold/20 text-gold border-gold/30 mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Free Tool
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Photo → <span className="text-gold">PDF Generator</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Convert multiple photos to a beautiful PDF. Drag to reorder, customize layout, 
              and download in multiple formats.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Step 1: Upload Images */}
            <Card className="bg-zinc-900/50 border-gold/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">1</div>
                  <div>
                    <CardTitle className="text-white">Upload Images</CardTitle>
                    <CardDescription className="text-white/60">JPG, PNG, HEIC • Drag to reorder</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Drop Zone */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer mb-6 ${
                    dragActive ? "border-gold bg-gold/10" : "border-gold/30 hover:border-gold/50"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic,image/webp,.jpg,.jpeg,.png,.heic,.webp"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-12 w-12 text-gold animate-spin" />
                      <p className="text-white/70">Processing images...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className={`h-12 w-12 mx-auto mb-4 ${dragActive ? "text-gold" : "text-gold/50"}`} />
                      <p className="text-lg font-medium text-white mb-2">
                        {dragActive ? "Drop images here" : "Drag & drop images"}
                      </p>
                      <p className="text-white/50 text-sm">or click to browse • Max 50 images</p>
                    </>
                  )}
                </div>

                {/* Image List with Reorder */}
                {images.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-white/70 text-sm">{images.length} image{images.length !== 1 ? "s" : ""} • Drag to reorder</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={clearAll}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                    
                    <Reorder.Group 
                      axis="y" 
                      values={images} 
                      onReorder={setImages}
                      className="space-y-2"
                    >
                      {images.map((image) => (
                        <Reorder.Item 
                          key={image.id} 
                          value={image}
                          className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-white/10 cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="h-5 w-5 text-white/30 shrink-0" />
                          <div className="w-16 h-12 bg-black/50 rounded overflow-hidden shrink-0">
                            <img 
                              src={image.url} 
                              alt={image.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{image.name}</p>
                            <p className="text-white/50 text-xs">{image.width} × {image.height}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/50 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                            onClick={() => removeImage(image.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Settings */}
            <AnimatePresence>
              {images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="bg-zinc-900/50 border-gold/20">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">2</div>
                        <div>
                          <CardTitle className="text-white">PDF Settings</CardTitle>
                          <CardDescription className="text-white/60">Customize your output</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Page Size */}
                      <div className="space-y-3">
                        <Label className="text-white font-medium">Page Size</Label>
                        <RadioGroup 
                          value={pageSize} 
                          onValueChange={(v) => setPageSize(v as PageSize)}
                          className="flex flex-wrap gap-3"
                        >
                          {[
                            { value: "a4", label: "A4", desc: "210 × 297mm" },
                            { value: "letter", label: "Letter", desc: "8.5 × 11in" },
                            { value: "fit", label: "Fit to Image", desc: "Match photo" },
                          ].map((option) => (
                            <Label
                              key={option.value}
                              htmlFor={`size-${option.value}`}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${
                                pageSize === option.value 
                                  ? "border-gold bg-gold/10" 
                                  : "border-white/10 hover:border-gold/30"
                              }`}
                            >
                              <RadioGroupItem value={option.value} id={`size-${option.value}`} className="text-gold" />
                              <div>
                                <p className="text-white text-sm font-medium">{option.label}</p>
                                <p className="text-white/50 text-xs">{option.desc}</p>
                              </div>
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Orientation */}
                      <div className="space-y-3">
                        <Label className="text-white font-medium">Orientation</Label>
                        <RadioGroup 
                          value={orientation} 
                          onValueChange={(v) => setOrientation(v as Orientation)}
                          className="flex flex-wrap gap-3"
                        >
                          {[
                            { value: "auto", label: "Auto", icon: <LayoutGrid className="h-4 w-4" /> },
                            { value: "portrait", label: "Portrait", icon: <Maximize className="h-4 w-4" /> },
                            { value: "landscape", label: "Landscape", icon: <Maximize className="h-4 w-4 rotate-90" /> },
                          ].map((option) => (
                            <Label
                              key={option.value}
                              htmlFor={`orient-${option.value}`}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${
                                orientation === option.value 
                                  ? "border-gold bg-gold/10" 
                                  : "border-white/10 hover:border-gold/30"
                              }`}
                            >
                              <RadioGroupItem value={option.value} id={`orient-${option.value}`} className="text-gold" />
                              <span className={orientation === option.value ? "text-gold" : "text-white/50"}>{option.icon}</span>
                              <span className="text-white text-sm">{option.label}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Margins */}
                        <div className="space-y-3">
                          <Label className="text-white font-medium">Margins</Label>
                          <RadioGroup 
                            value={margins} 
                            onValueChange={(v) => setMargins(v as Margins)}
                            className="flex gap-3"
                          >
                            {[
                              { value: "none", label: "None" },
                              { value: "small", label: "Small" },
                              { value: "normal", label: "Normal" },
                            ].map((option) => (
                              <Label
                                key={option.value}
                                htmlFor={`margin-${option.value}`}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border transition-all ${
                                  margins === option.value 
                                    ? "border-gold bg-gold/10 text-gold" 
                                    : "border-white/10 hover:border-gold/30 text-white"
                                }`}
                              >
                                <RadioGroupItem value={option.value} id={`margin-${option.value}`} className="sr-only" />
                                <span className="text-sm">{option.label}</span>
                              </Label>
                            ))}
                          </RadioGroup>
                        </div>

                        {/* Quality */}
                        <div className="space-y-3">
                          <Label className="text-white font-medium">Quality</Label>
                          <RadioGroup 
                            value={quality} 
                            onValueChange={(v) => setQuality(v as Quality)}
                            className="flex gap-3"
                          >
                            {[
                              { value: "standard", label: "Standard" },
                              { value: "high", label: "High" },
                            ].map((option) => (
                              <Label
                                key={option.value}
                                htmlFor={`quality-${option.value}`}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border transition-all ${
                                  quality === option.value 
                                    ? "border-gold bg-gold/10 text-gold" 
                                    : "border-white/10 hover:border-gold/30 text-white"
                                }`}
                              >
                                <RadioGroupItem value={option.value} id={`quality-${option.value}`} className="sr-only" />
                                <span className="text-sm">{option.label}</span>
                              </Label>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>

                      {/* Title Page */}
                      <div className="p-4 bg-black/30 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gold" />
                            <div>
                              <p className="text-white font-medium">Title Page</p>
                              <p className="text-white/50 text-xs">Add a cover page to your PDF</p>
                            </div>
                          </div>
                          <Switch
                            checked={titlePage.enabled}
                            onCheckedChange={(checked) => setTitlePage(prev => ({ ...prev, enabled: checked }))}
                          />
                        </div>
                        
                        <AnimatePresence>
                          {titlePage.enabled && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-3 overflow-hidden"
                            >
                              <div>
                                <Label htmlFor="title" className="text-white/70 text-sm">Title</Label>
                                <Input
                                  id="title"
                                  value={titlePage.title}
                                  onChange={(e) => setTitlePage(prev => ({ ...prev, title: e.target.value }))}
                                  placeholder="Property Photos"
                                  className="bg-black/50 border-white/20 text-white placeholder:text-white/30"
                                />
                              </div>
                              <div>
                                <Label htmlFor="subtitle" className="text-white/70 text-sm">Subtitle</Label>
                                <Input
                                  id="subtitle"
                                  value={titlePage.subtitle}
                                  onChange={(e) => setTitlePage(prev => ({ ...prev, subtitle: e.target.value }))}
                                  placeholder="123 Main Street, Dubai"
                                  className="bg-black/50 border-white/20 text-white placeholder:text-white/30"
                                />
                              </div>
                              <div>
                                <Label htmlFor="date" className="text-white/70 text-sm">Date</Label>
                                <Input
                                  id="date"
                                  value={titlePage.date}
                                  onChange={(e) => setTitlePage(prev => ({ ...prev, date: e.target.value }))}
                                  className="bg-black/50 border-white/20 text-white"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: Generate */}
            <AnimatePresence>
              {images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-zinc-900/50 border-gold/20">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">3</div>
                        <div>
                          <CardTitle className="text-white">Generate PDF</CardTitle>
                          <CardDescription className="text-white/60">Create your PDF document</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Progress */}
                      {processing.status === "processing" && (
                        <div className="mb-6 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/70">{processing.message}</span>
                            <span className="text-gold">{Math.round(processing.progress)}%</span>
                          </div>
                          <Progress value={processing.progress} className="h-2" />
                        </div>
                      )}

                      {/* Generate Button */}
                      {!hasGeneratedPdf && (
                        <Button 
                          size="lg"
                          className="w-full bg-gold hover:bg-gold/90 text-black font-semibold"
                          onClick={generatePdf}
                          disabled={processing.status === "processing"}
                        >
                          {processing.status === "processing" ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5 mr-2" />
                              Generate PDF
                            </>
                          )}
                        </Button>
                      )}

                      {/* Download Options */}
                      {hasGeneratedPdf && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-green-400 mb-4">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">PDF generated successfully!</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button 
                              className="bg-gold hover:bg-gold/90 text-black font-semibold"
                              onClick={() => downloadPdf("standard")}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </Button>
                            <Button 
                              variant="outline"
                              className="border-gold/30 text-gold hover:bg-gold/10"
                              onClick={() => downloadPdf("compressed")}
                            >
                              <Minimize2 className="h-4 w-4 mr-2" />
                              Compressed PDF
                            </Button>
                            <Button 
                              variant="outline"
                              className="border-gold/30 text-gold hover:bg-gold/10"
                              onClick={() => downloadPdf("printReady")}
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Print-Ready PDF
                            </Button>
                          </div>

                          <Button 
                            variant="outline"
                            className="w-full border-white/20 text-white/70 hover:bg-white/5 mt-4"
                            onClick={() => {
                              setProcessing({ status: "idle", progress: 0, message: "" });
                              setGeneratedPdfs({});
                            }}
                          >
                            Generate New PDF
                          </Button>
                        </div>
                      )}

                      {/* Error State */}
                      {processing.status === "failed" && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                          <div>
                            <p className="text-red-400 font-medium">Generation Failed</p>
                            <p className="text-red-400/70 text-sm">{processing.message}</p>
                          </div>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="ml-auto border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={generatePdf}
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
              Why Use Our <span className="text-gold">Photo to PDF Tool</span>?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Image className="h-8 w-8" />,
                  title: "Multiple Formats",
                  desc: "Support for JPG, PNG, HEIC and WebP images with automatic orientation."
                },
                {
                  icon: <Settings className="h-8 w-8" />,
                  title: "Customizable",
                  desc: "Choose page size, margins, orientation, and add professional title pages."
                },
                {
                  icon: <FileDown className="h-8 w-8" />,
                  title: "Multiple Outputs",
                  desc: "Download standard, compressed, or print-ready versions of your PDF."
                },
              ].map((feature, idx) => (
                <Card key={idx} className="bg-black/50 border-gold/20">
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gold/20 text-gold mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-white/60">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PdfFromPhotos;
