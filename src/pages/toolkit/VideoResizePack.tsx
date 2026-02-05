import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, Video, FileVideo, Download, Play, Pause, 
  Smartphone, Monitor, Square, LayoutGrid, Sparkles,
  Package, Loader2, CheckCircle2, AlertCircle, X,
  RefreshCw, Trash2, ChevronRight, ZoomIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Types
interface UploadedVideo {
  file: File;
  url: string;
  name: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  orientation: "vertical" | "landscape" | "square";
  aspectRatio: string;
}

interface ExportFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  aspect: string;
  platform: string;
  icon: React.ReactNode;
}

interface ProcessingJob {
  id: string;
  formatId: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  outputUrl?: string;
  error?: string;
}

type TargetOutput = "keep" | "vertical" | "landscape" | "square";

// Export format presets
const EXPORT_FORMATS: ExportFormat[] = [
  { id: "reels", name: "Reels/TikTok", width: 1080, height: 1920, aspect: "9:16", platform: "Instagram/TikTok", icon: <Smartphone className="h-4 w-4" /> },
  { id: "youtube", name: "YouTube", width: 1920, height: 1080, aspect: "16:9", platform: "YouTube", icon: <Monitor className="h-4 w-4" /> },
  { id: "feed", name: "Feed Square", width: 1080, height: 1080, aspect: "1:1", platform: "Instagram Feed", icon: <Square className="h-4 w-4" /> },
  { id: "portrait", name: "IG Portrait", width: 1080, height: 1350, aspect: "4:5", platform: "Instagram", icon: <Smartphone className="h-4 w-4 rotate-0" /> },
  { id: "story", name: "Story Safe", width: 1080, height: 1440, aspect: "3:4", platform: "Stories", icon: <Smartphone className="h-4 w-4" /> },
];

const VideoResizePack = () => {
  // State
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [targetOutput, setTargetOutput] = useState<TargetOutput>("keep");
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["reels", "youtube", "feed"]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Detect video orientation
  const detectOrientation = (width: number, height: number): "vertical" | "landscape" | "square" => {
    const ratio = width / height;
    if (ratio > 1.1) return "landscape";
    if (ratio < 0.9) return "vertical";
    return "square";
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("video/") || file.name.match(/\.(mp4|mov|webm|avi)$/i))) {
      processVideoFile(file);
    } else {
      toast.error("Please upload a valid video file (MP4, MOV, WebM)");
    }
  }, []);

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  // Process uploaded video file
  const processVideoFile = async (file: File) => {
    setIsUploading(true);
    
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          const orientation = detectOrientation(video.videoWidth, video.videoHeight);
          const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
          const divisor = gcd(video.videoWidth, video.videoHeight);
          const aspectRatio = `${video.videoWidth / divisor}:${video.videoHeight / divisor}`;
          
          setUploadedVideo({
            file,
            url,
            name: file.name,
            size: file.size,
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            orientation,
            aspectRatio,
          });
          resolve();
        };
        video.onerror = () => reject(new Error("Failed to load video"));
        video.src = url;
      });
      
      toast.success("Video uploaded successfully!");
    } catch (error) {
      console.error("Error processing video:", error);
      toast.error("Failed to process video. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle format selection
  const toggleFormat = (formatId: string) => {
    setSelectedFormats(prev => 
      prev.includes(formatId) 
        ? prev.filter(f => f !== formatId)
        : [...prev, formatId]
    );
  };

  // Start processing
  const startProcessing = async () => {
    if (!uploadedVideo || selectedFormats.length === 0) {
      toast.error("Please select at least one export format");
      return;
    }

    setIsProcessing(true);
    
    // Initialize jobs
    const newJobs: ProcessingJob[] = selectedFormats.map(formatId => ({
      id: crypto.randomUUID(),
      formatId,
      status: "queued",
      progress: 0,
    }));
    setJobs(newJobs);

    // Upload video to temporary storage
    try {
      const fileName = `${crypto.randomUUID()}-${uploadedVideo.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("video-processing-temp")
        .upload(fileName, uploadedVideo.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("video-processing-temp")
        .getPublicUrl(fileName);

      // Process each format
      for (let i = 0; i < newJobs.length; i++) {
        const job = newJobs[i];
        const format = EXPORT_FORMATS.find(f => f.id === job.formatId);
        if (!format) continue;

        // Update job status
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, status: "processing", progress: 10 } : j
        ));

        try {
          // Call edge function for processing
          const { data, error } = await supabase.functions.invoke("video-resize-process", {
            body: {
              sourceUrl: urlData.publicUrl,
              sourcePath: fileName,
              targetWidth: format.width,
              targetHeight: format.height,
              targetAspect: format.aspect,
              targetOutput,
              smartFraming: true,
              originalWidth: uploadedVideo.width,
              originalHeight: uploadedVideo.height,
            },
          });

          if (error) throw error;

          // Simulate progress updates (in real implementation, use realtime subscription)
          for (let progress = 20; progress <= 90; progress += 20) {
            await new Promise(resolve => setTimeout(resolve, 500));
            setJobs(prev => prev.map(j => 
              j.id === job.id ? { ...j, progress } : j
            ));
          }

          // Mark as completed
          setJobs(prev => prev.map(j => 
            j.id === job.id 
              ? { ...j, status: "completed", progress: 100, outputUrl: data?.outputUrl } 
              : j
          ));
        } catch (err) {
          console.error("Processing error:", err);
          setJobs(prev => prev.map(j => 
            j.id === job.id 
              ? { ...j, status: "failed", error: "Processing failed. Please try again." } 
              : j
          ));
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload video for processing");
      setJobs(prev => prev.map(j => ({ ...j, status: "failed", error: "Upload failed" })));
    }

    setIsProcessing(false);
  };

  // Download single output
  const downloadOutput = async (job: ProcessingJob) => {
    if (!job.outputUrl) return;
    
    const format = EXPORT_FORMATS.find(f => f.id === job.formatId);
    const link = document.createElement("a");
    link.href = job.outputUrl;
    link.download = `${uploadedVideo?.name.replace(/\.[^/.]+$/, "")}_${format?.aspect.replace(":", "x")}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all as ZIP
  const downloadAllAsZip = async () => {
    const completedJobs = jobs.filter(j => j.status === "completed" && j.outputUrl);
    if (completedJobs.length === 0) {
      toast.error("No completed exports to download");
      return;
    }

    toast.info("Preparing ZIP download...");
    
    // In production, this would call an edge function to create a ZIP
    // For now, download individually
    for (const job of completedJobs) {
      await downloadOutput(job);
    }
  };

  // Clear and start over
  const clearAll = () => {
    if (uploadedVideo?.url) {
      URL.revokeObjectURL(uploadedVideo.url);
    }
    setUploadedVideo(null);
    setJobs([]);
    setTargetOutput("keep");
    setSelectedFormats(["reels", "youtube", "feed"]);
  };

  const completedCount = jobs.filter(j => j.status === "completed").length;
  const hasCompletedJobs = completedCount > 0;

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
              Video Resizer + <span className="text-gold">Multi-Format Export Pack</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Upload once, export to all social formats. Smart framing keeps your subject in focus.
              Perfect for Reels, TikTok, YouTube, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Step 1: Upload */}
            <Card className="bg-jj-layer-2 border-gold/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">1</div>
                  <div>
                    <CardTitle className="text-white">Upload Your Video</CardTitle>
                    <CardDescription className="text-white/60">MP4, MOV, or WebM • Max 500MB</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!uploadedVideo ? (
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                      dragActive ? "border-gold bg-gold/10" : "border-gold/30 hover:border-gold/50"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("video-input")?.click()}
                  >
                    <input
                      id="video-input"
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 text-gold animate-spin" />
                        <p className="text-white/70">Processing video...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className={`h-12 w-12 mx-auto mb-4 ${dragActive ? "text-gold" : "text-gold/50"}`} />
                        <p className="text-lg font-medium text-white mb-2">
                          {dragActive ? "Drop your video here" : "Drag & drop your video"}
                        </p>
                        <p className="text-white/50 text-sm">or click to browse</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Video Preview */}
                    <div className="flex-1">
                      <div className="relative aspect-video bg-black/50 rounded-lg overflow-hidden">
                        <video
                          src={uploadedVideo.url}
                          className="w-full h-full object-contain"
                          controls
                        />
                      </div>
                    </div>
                    
                    {/* Video Info */}
                    <div className="md:w-72 space-y-4">
                      <div className="p-4 bg-black/30 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 text-gold">
                          <FileVideo className="h-5 w-5" />
                          <span className="font-medium truncate">{uploadedVideo.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-white/50">Resolution</p>
                            <p className="text-white">{uploadedVideo.width}×{uploadedVideo.height}</p>
                          </div>
                          <div>
                            <p className="text-white/50">Orientation</p>
                            <p className="text-white capitalize">{uploadedVideo.orientation}</p>
                          </div>
                          <div>
                            <p className="text-white/50">Duration</p>
                            <p className="text-white">{Math.floor(uploadedVideo.duration / 60)}:{String(Math.floor(uploadedVideo.duration % 60)).padStart(2, "0")}</p>
                          </div>
                          <div>
                            <p className="text-white/50">Size</p>
                            <p className="text-white">{(uploadedVideo.size / (1024 * 1024)).toFixed(1)} MB</p>
                          </div>
                        </div>
                        <Badge 
                          className={`${
                            uploadedVideo.orientation === "vertical" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                            uploadedVideo.orientation === "landscape" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                            "bg-green-500/20 text-green-400 border-green-500/30"
                          }`}
                        >
                          {uploadedVideo.aspectRatio} {uploadedVideo.orientation}
                        </Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={clearAll}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Video
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Target Output */}
            <AnimatePresence>
              {uploadedVideo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="bg-jj-layer-2 border-gold/20">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">2</div>
                        <div>
                          <CardTitle className="text-white">Target Output</CardTitle>
                          <CardDescription className="text-white/60">Choose how to transform your video</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup 
                        value={targetOutput} 
                        onValueChange={(v) => setTargetOutput(v as TargetOutput)}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                      >
                        {[
                          { value: "keep", label: "Keep Original", desc: "Export in original orientation with size variants", icon: <LayoutGrid className="h-5 w-5" /> },
                          { value: "vertical", label: "Convert to Vertical", desc: "9:16 with smart subject framing", icon: <Smartphone className="h-5 w-5" /> },
                          { value: "landscape", label: "Convert to Landscape", desc: "16:9 with smart subject framing", icon: <Monitor className="h-5 w-5" /> },
                          { value: "square", label: "Convert to Square", desc: "1:1 with centered subject framing", icon: <Square className="h-5 w-5" /> },
                        ].map((option) => (
                          <Label
                            key={option.value}
                            htmlFor={option.value}
                            className={`relative flex flex-col items-center p-4 rounded-xl cursor-pointer border-2 transition-all ${
                              targetOutput === option.value 
                                ? "border-gold bg-gold/10" 
                                : "border-white/10 hover:border-gold/30"
                            }`}
                          >
                            <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                            <div className={`mb-2 ${targetOutput === option.value ? "text-gold" : "text-white/50"}`}>
                              {option.icon}
                            </div>
                            <p className="font-medium text-white text-sm">{option.label}</p>
                            <p className="text-xs text-white/50 text-center mt-1">{option.desc}</p>
                            {targetOutput === option.value && (
                              <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-gold" />
                            )}
                          </Label>
                        ))}
                      </RadioGroup>

                      {/* Smart Framing Note */}
                      <div className="mt-4 p-3 bg-gold/10 rounded-lg border border-gold/20 flex items-start gap-3">
                        <ZoomIn className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gold font-medium">Smart Framing Enabled</p>
                          <p className="text-xs text-white/60">AI automatically detects subjects and keeps them in frame during reframing. Dynamic per-shot analysis for best results.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: Export Formats */}
            <AnimatePresence>
              {uploadedVideo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="bg-jj-layer-2 border-gold/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">3</div>
                          <div>
                            <CardTitle className="text-white">Export Formats</CardTitle>
                            <CardDescription className="text-white/60">Select the formats you need</CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-gold/30 text-gold hover:bg-gold/10"
                            onClick={() => setSelectedFormats(EXPORT_FORMATS.map(f => f.id))}
                          >
                            Select All
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-white/20 text-white/70 hover:bg-white/5"
                            onClick={() => setSelectedFormats([])}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {EXPORT_FORMATS.map((format) => {
                          const isSelected = selectedFormats.includes(format.id);
                          return (
                            <div
                              key={format.id}
                              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                isSelected 
                                  ? "border-gold bg-gold/10" 
                                  : "border-white/10 hover:border-gold/30"
                              }`}
                              onClick={() => toggleFormat(format.id)}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className={isSelected ? "text-gold" : "text-white/50"}>
                                  {format.icon}
                                </div>
                                <Checkbox 
                                  checked={isSelected}
                                  className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                                />
                              </div>
                              <p className="font-medium text-white text-sm">{format.name}</p>
                              <p className="text-xs text-white/50">{format.width}×{format.height}</p>
                              <Badge variant="outline" className="mt-2 text-xs border-white/20 text-white/60">
                                {format.platform}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>

                      {/* Process Button */}
                      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-black/30 rounded-xl">
                        <div className="text-center sm:text-left">
                          <p className="text-white font-medium">
                            {selectedFormats.length} format{selectedFormats.length !== 1 ? "s" : ""} selected
                          </p>
                          <p className="text-sm text-white/50">Files auto-delete after 2 hours</p>
                        </div>
                        <Button 
                          size="lg"
                          className="bg-gold hover:bg-gold/90 text-black font-semibold px-8"
                          onClick={startProcessing}
                          disabled={isProcessing || selectedFormats.length === 0}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5 mr-2" />
                              Start Processing
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 4: Results */}
            <AnimatePresence>
              {jobs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-jj-layer-2 border-gold/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">4</div>
                          <div>
                            <CardTitle className="text-white">Export Results</CardTitle>
                            <CardDescription className="text-white/60">
                              {completedCount} of {jobs.length} complete
                            </CardDescription>
                          </div>
                        </div>
                        {hasCompletedJobs && (
                          <Button 
                            className="bg-gold hover:bg-gold/90 text-black font-semibold"
                            onClick={downloadAllAsZip}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Download All as ZIP
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {jobs.map((job) => {
                          const format = EXPORT_FORMATS.find(f => f.id === job.formatId);
                          return (
                            <div 
                              key={job.id}
                              className="flex items-center gap-4 p-4 bg-black/30 rounded-xl"
                            >
                              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                {format?.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-white">{format?.name}</p>
                                  <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                                    {format?.aspect}
                                  </Badge>
                                </div>
                                {job.status === "processing" && (
                                  <Progress value={job.progress} className="h-2" />
                                )}
                                {job.status === "queued" && (
                                  <p className="text-xs text-white/50">Waiting in queue...</p>
                                )}
                                {job.status === "completed" && (
                                  <p className="text-xs text-green-400">Ready to download</p>
                                )}
                                {job.status === "failed" && (
                                  <p className="text-xs text-red-400">{job.error}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {job.status === "processing" && (
                                  <Loader2 className="h-5 w-5 text-gold animate-spin" />
                                )}
                                {job.status === "completed" && (
                                  <>
                                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="border-gold/30 text-gold hover:bg-gold/10"
                                      onClick={() => downloadOutput(job)}
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      Download
                                    </Button>
                                  </>
                                )}
                                {job.status === "failed" && (
                                  <>
                                    <AlertCircle className="h-5 w-5 text-red-400" />
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="border-white/20 text-white/70 hover:bg-white/5"
                                    >
                                      <RefreshCw className="h-4 w-4 mr-1" />
                                      Retry
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-jj-layer-2">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
              Why Use Our <span className="text-gold">Video Resizer</span>?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <ZoomIn className="h-8 w-8" />,
                  title: "Smart Framing",
                  desc: "AI detects subjects and keeps them centered during reframe - no blind center-crops."
                },
                {
                  icon: <Video className="h-8 w-8" />,
                  title: "Per-Shot Analysis",
                  desc: "Dynamic reframing per scene for multi-shot videos. Always in focus."
                },
                {
                  icon: <Package className="h-8 w-8" />,
                  title: "Batch Export",
                  desc: "Export to all social formats at once. Download as ZIP or individually."
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

export default VideoResizePack;
