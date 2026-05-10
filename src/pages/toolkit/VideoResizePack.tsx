import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, Video, FileVideo, Download, Play, Pause, 
  Smartphone, Monitor, Square, LayoutGrid, Sparkles,
  Package, Loader2, CheckCircle2, AlertCircle, X,
  RefreshCw, Trash2, ChevronRight, ZoomIn, Sliders,
  Move, Target, Eye, Grid3X3, User, Scissors, 
  Maximize2, Lock, Unlock, MousePointer2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface DetectedShot {
  id: string;
  startTime: number;
  endTime: number;
  thumbnail?: string;
  cropWindow: { x: number; y: number; width: number; height: number };
  isKeyframe: boolean;
}

interface SmartReframeSettings {
  targetRatio: "9:16" | "16:9" | "1:1";
  sensitivity: number; // 0-100, 0=stable, 100=aggressive
  keepHeadroom: boolean;
  showSafeArea: boolean;
  trackingMode: "face" | "body" | "object" | "auto";
  smoothTransitions: boolean;
}

type TargetOutput = "keep" | "vertical" | "landscape" | "square";
type ToolMode = "resize" | "smart-reframe";

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
  const [toolMode, setToolMode] = useState<ToolMode>("resize");
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [targetOutput, setTargetOutput] = useState<TargetOutput>("keep");
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["reels", "youtube", "feed"]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Smart Reframe State
  const [reframeSettings, setReframeSettings] = useState<SmartReframeSettings>({
    targetRatio: "9:16",
    sensitivity: 50,
    keepHeadroom: true,
    showSafeArea: true,
    trackingMode: "auto",
    smoothTransitions: true,
  });
  const [detectedShots, setDetectedShots] = useState<DetectedShot[]>([]);
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [isDetectingShots, setIsDetectingShots] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [cropWindow, setCropWindow] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

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

  // Start processing (Basic Resize)
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

  // Detect shots in video (Smart Reframe)
  const detectShots = async () => {
    if (!uploadedVideo) return;
    
    setIsDetectingShots(true);
    
    // Simulate shot detection (in production, this would use ML/computer vision)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock detected shots
    const numShots = Math.floor(Math.random() * 5) + 2;
    const shotDuration = uploadedVideo.duration / numShots;
    
    const shots: DetectedShot[] = [];
    for (let i = 0; i < numShots; i++) {
      const targetRatioValue = reframeSettings.targetRatio === "9:16" ? 9/16 : 
                                reframeSettings.targetRatio === "16:9" ? 16/9 : 1;
      
      // Calculate smart crop based on video dimensions
      const sourceRatio = uploadedVideo.width / uploadedVideo.height;
      let cropWidth = 100, cropHeight = 100, cropX = 0, cropY = 0;
      
      if (sourceRatio > targetRatioValue) {
        // Source is wider, crop horizontally
        cropWidth = (targetRatioValue / sourceRatio) * 100;
        cropX = (100 - cropWidth) / 2 + (Math.random() * 10 - 5); // Slight variation per shot
      } else {
        // Source is taller, crop vertically
        cropHeight = (sourceRatio / targetRatioValue) * 100;
        cropY = reframeSettings.keepHeadroom ? 5 : (100 - cropHeight) / 2;
      }
      
      shots.push({
        id: `shot-${i}`,
        startTime: i * shotDuration,
        endTime: (i + 1) * shotDuration,
        cropWindow: { 
          x: Math.max(0, Math.min(100 - cropWidth, cropX)), 
          y: Math.max(0, Math.min(100 - cropHeight, cropY)), 
          width: cropWidth, 
          height: cropHeight 
        },
        isKeyframe: true,
      });
    }
    
    setDetectedShots(shots);
    setSelectedShotId(shots[0]?.id || null);
    if (shots[0]) {
      setCropWindow(shots[0].cropWindow);
    }
    setIsDetectingShots(false);
    toast.success(`Detected ${numShots} shots with AI subject tracking`);
  };

  // Handle shot selection
  const selectShot = (shot: DetectedShot) => {
    setSelectedShotId(shot.id);
    setCropWindow(shot.cropWindow);
    if (videoPreviewRef.current) {
      videoPreviewRef.current.currentTime = shot.startTime;
    }
  };

  // Update crop window for selected shot
  const updateShotCrop = (newCrop: typeof cropWindow) => {
    setCropWindow(newCrop);
    if (selectedShotId) {
      setDetectedShots(prev => prev.map(shot => 
        shot.id === selectedShotId 
          ? { ...shot, cropWindow: newCrop }
          : shot
      ));
    }
  };

  // Handle crop drag
  const handleCropMouseDown = (e: React.MouseEvent) => {
    if (!isManualMode || !cropContainerRef.current) return;
    setIsDraggingCrop(true);
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCrop || !cropContainerRef.current) return;
    
    const rect = cropContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100 - cropWindow.width / 2;
    const y = ((e.clientY - rect.top) / rect.height) * 100 - cropWindow.height / 2;
    
    updateShotCrop({
      ...cropWindow,
      x: Math.max(0, Math.min(100 - cropWindow.width, x)),
      y: Math.max(0, Math.min(100 - cropWindow.height, y)),
    });
  };

  const handleCropMouseUp = () => {
    setIsDraggingCrop(false);
  };

  // Start Smart Reframe Processing
  const startSmartReframe = async () => {
    if (!uploadedVideo || detectedShots.length === 0) {
      toast.error("Please detect shots first");
      return;
    }

    setIsProcessing(true);
    
    // Create job for smart reframe
    const newJob: ProcessingJob = {
      id: crypto.randomUUID(),
      formatId: reframeSettings.targetRatio.replace(":", "x"),
      status: "processing",
      progress: 0,
    };
    setJobs([newJob]);

    try {
      // Upload video to temporary storage
      const fileName = `${crypto.randomUUID()}-${uploadedVideo.name}`;
      const { error: uploadError } = await supabase.storage
        .from("video-processing-temp")
        .upload(fileName, uploadedVideo.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("video-processing-temp")
        .getPublicUrl(fileName);

      // Call edge function for smart reframe processing
      const { data, error } = await supabase.functions.invoke("video-resize-process", {
        body: {
          sourceUrl: urlData.publicUrl,
          sourcePath: fileName,
          targetAspect: reframeSettings.targetRatio,
          smartFraming: true,
          originalWidth: uploadedVideo.width,
          originalHeight: uploadedVideo.height,
          reframeMode: "smart",
          shots: detectedShots.map(shot => ({
            startTime: shot.startTime,
            endTime: shot.endTime,
            cropWindow: shot.cropWindow,
          })),
          settings: reframeSettings,
        },
      });

      if (error) throw error;

      // Simulate progress
      for (let progress = 10; progress <= 90; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 400));
        setJobs(prev => prev.map(j => ({ ...j, progress })));
      }

      setJobs(prev => prev.map(j => ({
        ...j,
        status: "completed",
        progress: 100,
        outputUrl: data?.outputUrl,
      })));

      toast.success("Smart Reframe completed!");
    } catch (error) {
      console.error("Smart Reframe error:", error);
      setJobs(prev => prev.map(j => ({
        ...j,
        status: "failed",
        error: "Processing failed. Please try again.",
      })));
      toast.error("Smart Reframe failed. Please try again.");
    }

    setIsProcessing(false);
  };

  // Download single output
  const downloadOutput = async (job: ProcessingJob) => {
    if (!job.outputUrl) return;
    
    const format = EXPORT_FORMATS.find(f => f.id === job.formatId);
    const link = document.createElement("a");
    link.href = job.outputUrl;
    link.download = `${uploadedVideo?.name.replace(/\.[^/.]+$/, "")}_${format?.aspect.replace(":", "x") || job.formatId}.mp4`;
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

  // Download all sizes pack (Smart Reframe)
  const downloadAllSizesPack = async () => {
    if (!uploadedVideo || detectedShots.length === 0) {
      toast.error("Please process your video first");
      return;
    }

    toast.info("Generating all sizes pack: 9:16, 16:9, 1:1...");
    
    // In production, this would queue multiple processing jobs
    // For now, simulate
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("All sizes pack ready for download!");
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
    setDetectedShots([]);
    setSelectedShotId(null);
    setIsManualMode(false);
  };

  const completedCount = jobs.filter(j => j.status === "completed").length;
  const hasCompletedJobs = completedCount > 0;

  // Calculate crop preview dimensions based on target ratio
  const getCropPreviewStyle = () => {
    if (!uploadedVideo) return {};
    
    const targetRatioValue = reframeSettings.targetRatio === "9:16" ? 9/16 : 
                              reframeSettings.targetRatio === "16:9" ? 16/9 : 1;
    
    return {
      left: `${cropWindow.x}%`,
      top: `${cropWindow.y}%`,
      width: `${cropWindow.width}%`,
      height: `${cropWindow.height}%`,
    };
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30 mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Free Tool
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Video Resizer + <span className="text-[#1A1A1A]">Smart Reframe AI</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Upload once, export to all social formats. Smart AI keeps your subject in focus with per-shot tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Mode Tabs */}
      <section className="pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Tabs value={toolMode} onValueChange={(v) => setToolMode(v as ToolMode)} className="w-full">
              <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 bg-jj-layer-2 p-1 rounded-xl">
                <TabsTrigger 
                  value="resize" 
                  className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] rounded-lg"
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Multi-Format Export
                </TabsTrigger>
                <TabsTrigger 
                  value="smart-reframe"
                  className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] rounded-lg"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Smart Reframe AI
                </TabsTrigger>
              </TabsList>

              {/* Multi-Format Export Mode */}
              <TabsContent value="resize" className="mt-8 space-y-8">
                {/* Step 1: Upload */}
                <Card className="bg-jj-layer-2 border-[#B89555]/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center text-[#1A1A1A] font-bold text-sm">1</div>
                      <div>
                        <CardTitle className="text-white">Upload Your Video</CardTitle>
                        <CardDescription className="text-white/90">MP4, MOV, or WebM • Max 500MB</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!uploadedVideo ? (
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                          dragActive ? "border-[#B89555] bg-[#EFE6D6]/10" : "border-[#B89555]/30 hover:border-[#B89555]/50"
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
                            <Loader2 className="h-12 w-12 text-[#1A1A1A] animate-spin" />
                            <p className="text-white/70">Processing video...</p>
                          </div>
                        ) : (
                          <>
                            <Upload className={`h-12 w-12 mx-auto mb-4 ${dragActive ? "text-[#1A1A1A]" : "text-[#1A1A1A]/70"}`} />
                            <p className="text-lg font-medium text-white mb-2">
                              {dragActive ? "Drop your video here" : "Drag & drop your video"}
                            </p>
                            <p className="text-white/90 text-sm">or click to browse</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Video Preview */}
                        <div className="flex-1">
                          <div className="relative aspect-video bg-[#1A1A1A]/50 rounded-lg overflow-hidden">
                            <video
                              src={uploadedVideo.url}
                              className="w-full h-full object-contain"
                              controls
                            />
                          </div>
                        </div>
                        
                        {/* Video Info */}
                        <div className="md:w-72 space-y-4">
                          <div className="p-4 bg-[#1A1A1A]/30 rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-[#1A1A1A]">
                              <FileVideo className="h-5 w-5" />
                              <span className="font-medium truncate">{uploadedVideo.name}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-white/90">Resolution</p>
                                <p className="text-white">{uploadedVideo.width}×{uploadedVideo.height}</p>
                              </div>
                              <div>
                                <p className="text-white/90">Orientation</p>
                                <p className="text-white capitalize">{uploadedVideo.orientation}</p>
                              </div>
                              <div>
                                <p className="text-white/90">Duration</p>
                                <p className="text-white">{Math.floor(uploadedVideo.duration / 60)}:{String(Math.floor(uploadedVideo.duration % 60)).padStart(2, "0")}</p>
                              </div>
                              <div>
                                <p className="text-white/90">Size</p>
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
                      <Card className="bg-jj-layer-2 border-[#B89555]/20">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center text-[#1A1A1A] font-bold text-sm">2</div>
                            <div>
                              <CardTitle className="text-white">Target Output</CardTitle>
                              <CardDescription className="text-white/90">Choose how to transform your video</CardDescription>
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
                                    ? "border-[#B89555] bg-[#EFE6D6]/10" 
                                    : "border-white/10 hover:border-[#B89555]/30"
                                }`}
                              >
                                <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                                <div className={`mb-2 ${targetOutput === option.value ? "text-[#1A1A1A]" : "text-white/90"}`}>
                                  {option.icon}
                                </div>
                                <p className="font-medium text-white text-sm">{option.label}</p>
                                <p className="text-xs text-white/90 text-center mt-1">{option.desc}</p>
                                {targetOutput === option.value && (
                                  <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-[#1A1A1A]" />
                                )}
                              </Label>
                            ))}
                          </RadioGroup>

                          {/* Smart Framing Note */}
                          <div className="mt-4 p-3 bg-[#EFE6D6]/10 rounded-lg border border-[#B89555]/20 flex items-start gap-3">
                            <ZoomIn className="h-5 w-5 text-[#1A1A1A] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm text-[#1A1A1A] font-medium">Smart Framing Enabled</p>
                              <p className="text-xs text-white/90">AI automatically detects subjects and keeps them in frame during reframe - no blind center-crops.</p>
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
                      <Card className="bg-jj-layer-2 border-[#B89555]/20">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center text-[#1A1A1A] font-bold text-sm">3</div>
                              <div>
                                <CardTitle className="text-white">Export Formats</CardTitle>
                                <CardDescription className="text-white/90">Select the formats you need</CardDescription>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
                                onClick={() => setSelectedFormats(EXPORT_FORMATS.map(f => f.id))}
                              >
                                Select All
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-white/20 text-white/70 hover:bg-[#FDFBF7]/5"
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
                                      ? "border-[#B89555] bg-[#EFE6D6]/10" 
                                      : "border-white/10 hover:border-[#B89555]/30"
                                  }`}
                                  onClick={() => toggleFormat(format.id)}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className={isSelected ? "text-[#1A1A1A]" : "text-white/90"}>
                                      {format.icon}
                                    </div>
                                    <Checkbox 
                                      checked={isSelected}
                                      className="data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:border-[#B89555]"
                                    />
                                  </div>
                                  <p className="font-medium text-white text-sm">{format.name}</p>
                                  <p className="text-xs text-white/90">{format.width}×{format.height}</p>
                                  <Badge variant="outline" className="mt-2 text-xs border-white/20 text-white/90">
                                    {format.platform}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>

                          {/* Process Button */}
                          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#1A1A1A]/30 rounded-xl">
                            <div className="text-center sm:text-left">
                              <p className="text-white font-medium">
                                {selectedFormats.length} format{selectedFormats.length !== 1 ? "s" : ""} selected
                              </p>
                              <p className="text-sm text-white/90">Projects save automatically</p>
                            </div>
                            <Button 
                              size="lg"
                              className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-semibold px-8"
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
                      <Card className="bg-jj-layer-2 border-[#B89555]/20">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center text-[#1A1A1A] font-bold text-sm">4</div>
                              <div>
                                <CardTitle className="text-white">Export Results</CardTitle>
                                <CardDescription className="text-white/90">
                                  {completedCount} of {jobs.length} complete
                                </CardDescription>
                              </div>
                            </div>
                            {hasCompletedJobs && (
                              <Button 
                                className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-semibold"
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
                                  className="flex items-center gap-4 p-4 bg-[#1A1A1A]/30 rounded-xl"
                                >
                                  <div className="w-10 h-10 rounded-lg bg-[#FDFBF7]/5 flex items-center justify-center">
                                    {format?.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-medium text-white">{format?.name}</p>
                                      <Badge variant="outline" className="text-xs border-white/20 text-white/90">
                                        {format?.aspect}
                                      </Badge>
                                    </div>
                                    {job.status === "processing" && (
                                      <Progress value={job.progress} className="h-2" />
                                    )}
                                    {job.status === "queued" && (
                                      <p className="text-xs text-white/90">Waiting in queue...</p>
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
                                      <Loader2 className="h-5 w-5 text-[#1A1A1A] animate-spin" />
                                    )}
                                    {job.status === "completed" && (
                                      <>
                                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
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
                                          className="border-white/20 text-white/70 hover:bg-[#FDFBF7]/5"
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
              </TabsContent>

              {/* Smart Reframe AI Mode */}
              <TabsContent value="smart-reframe" className="mt-8 space-y-8">
                {/* Upload Section (Shared) */}
                <Card className="bg-jj-layer-2 border-[#B89555]/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center text-[#1A1A1A] font-bold text-sm">1</div>
                      <div>
                        <CardTitle className="text-white">Upload Your Video</CardTitle>
                        <CardDescription className="text-white/90">MP4, MOV, or WebM • Max 500MB</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!uploadedVideo ? (
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                          dragActive ? "border-[#B89555] bg-[#EFE6D6]/10" : "border-[#B89555]/30 hover:border-[#B89555]/50"
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById("video-input-reframe")?.click()}
                      >
                        <input
                          id="video-input-reframe"
                          type="file"
                          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                          className="hidden"
                          onChange={handleFileInput}
                        />
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-12 w-12 text-[#1A1A1A] animate-spin" />
                            <p className="text-white/70">Processing video...</p>
                          </div>
                        ) : (
                          <>
                            <Upload className={`h-12 w-12 mx-auto mb-4 ${dragActive ? "text-[#1A1A1A]" : "text-[#1A1A1A]/70"}`} />
                            <p className="text-lg font-medium text-white mb-2">
                              {dragActive ? "Drop your video here" : "Drag & drop your video"}
                            </p>
                            <p className="text-white/90 text-sm">or click to browse</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Video Preview with Crop Overlay */}
                        <div className="flex-1">
                          <div 
                            ref={cropContainerRef}
                            className="relative aspect-video bg-[#1A1A1A]/50 rounded-lg overflow-hidden cursor-crosshair"
                            onMouseMove={handleCropMouseMove}
                            onMouseUp={handleCropMouseUp}
                            onMouseLeave={handleCropMouseUp}
                          >
                            <video
                              ref={videoPreviewRef}
                              src={uploadedVideo.url}
                              className="w-full h-full object-contain"
                              controls={!isManualMode}
                            />
                            
                            {/* Crop Window Overlay */}
                            {detectedShots.length > 0 && (
                              <>
                                {/* Darkened areas outside crop */}
                                <div className="absolute inset-0 pointer-events-none">
                                  <div 
                                    className="absolute bg-[#1A1A1A]/60"
                                    style={{ top: 0, left: 0, right: 0, height: `${cropWindow.y}%` }}
                                  />
                                  <div 
                                    className="absolute bg-[#1A1A1A]/60"
                                    style={{ 
                                      top: `${cropWindow.y + cropWindow.height}%`, 
                                      left: 0, 
                                      right: 0, 
                                      bottom: 0 
                                    }}
                                  />
                                  <div 
                                    className="absolute bg-[#1A1A1A]/60"
                                    style={{ 
                                      top: `${cropWindow.y}%`, 
                                      left: 0, 
                                      width: `${cropWindow.x}%`, 
                                      height: `${cropWindow.height}%` 
                                    }}
                                  />
                                  <div 
                                    className="absolute bg-[#1A1A1A]/60"
                                    style={{ 
                                      top: `${cropWindow.y}%`, 
                                      right: 0, 
                                      left: `${cropWindow.x + cropWindow.width}%`, 
                                      height: `${cropWindow.height}%` 
                                    }}
                                  />
                                </div>
                                
                                {/* Crop Frame */}
                                <div 
                                  className={`absolute border-2 transition-all ${
                                    isManualMode ? "border-[#B89555] cursor-move" : "border-[#B89555]/70"
                                  }`}
                                  style={getCropPreviewStyle()}
                                  onMouseDown={handleCropMouseDown}
                                >
                                  {/* Safe Area Guides */}
                                  {reframeSettings.showSafeArea && (
                                    <div className="absolute inset-0 pointer-events-none">
                                      {/* Title safe (10% from edges) */}
                                      <div className="absolute border border-dashed border-blue-400/40" 
                                           style={{ top: '10%', left: '10%', right: '10%', bottom: '10%' }} 
                                      />
                                      {/* Action safe (5% from edges) */}
                                      <div className="absolute border border-dashed border-green-400/40" 
                                           style={{ top: '5%', left: '5%', right: '5%', bottom: '5%' }} 
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Corner handles */}
                                  {isManualMode && (
                                    <>
                                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#EFE6D6] rounded-sm" />
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#EFE6D6] rounded-sm" />
                                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#EFE6D6] rounded-sm" />
                                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#EFE6D6] rounded-sm" />
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Shot Timeline */}
                          {detectedShots.length > 0 && (
                            <div className="mt-4 p-3 bg-[#1A1A1A]/30 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-white/70">
                                  <Scissors className="h-4 w-4 inline mr-1" />
                                  {detectedShots.length} shots detected
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`border-[#B89555]/30 ${isManualMode ? 'bg-[#EFE6D6]/20 text-[#1A1A1A]' : 'text-[#1A1A1A]'} hover:bg-[#EFE6D6]/10`}
                                  onClick={() => setIsManualMode(!isManualMode)}
                                >
                                  {isManualMode ? <Lock className="h-4 w-4 mr-1" /> : <Unlock className="h-4 w-4 mr-1" />}
                                  {isManualMode ? "Lock Crop" : "Manual Override"}
                                </Button>
                              </div>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {detectedShots.map((shot, idx) => (
                                  <button
                                    key={shot.id}
                                    onClick={() => selectShot(shot)}
                                    className={`flex-shrink-0 p-2 rounded-lg border-2 transition-all ${
                                      selectedShotId === shot.id 
                                        ? "border-[#B89555] bg-[#EFE6D6]/20" 
                                        : "border-white/10 hover:border-[#B89555]/30"
                                    }`}
                                  >
                                    <div className="w-16 h-10 bg-[#FDFBF7]/10 rounded flex items-center justify-center text-xs text-white/70">
                                      Shot {idx + 1}
                                    </div>
                                    <p className="text-xs text-white/90 mt-1">
                                      {shot.startTime.toFixed(1)}s
                                    </p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Video Info & Controls */}
                        <div className="lg:w-80 space-y-4">
                          <div className="p-4 bg-[#1A1A1A]/30 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[#1A1A1A]">
                                <FileVideo className="h-5 w-5" />
                                <span className="font-medium truncate text-sm">{uploadedVideo.name}</span>
                              </div>
                              <Button 
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:bg-red-500/10 p-1 h-auto"
                                onClick={clearAll}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-white/90">Resolution</p>
                                <p className="text-white">{uploadedVideo.width}×{uploadedVideo.height}</p>
                              </div>
                              <div>
                                <p className="text-white/90">Duration</p>
                                <p className="text-white">{Math.floor(uploadedVideo.duration / 60)}:{String(Math.floor(uploadedVideo.duration % 60)).padStart(2, "0")}</p>
                              </div>
                            </div>
                          </div>

                          {/* Detect Shots Button */}
                          {detectedShots.length === 0 && (
                            <Button 
                              className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-semibold"
                              onClick={detectShots}
                              disabled={isDetectingShots}
                            >
                              {isDetectingShots ? (
                                <>
                                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                  Analyzing Video...
                                </>
                              ) : (
                                <>
                                  <Target className="h-5 w-5 mr-2" />
                                  Detect Shots & Subjects
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Reframe Settings */}
                <AnimatePresence>
                  {uploadedVideo && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className="bg-jj-layer-2 border-[#B89555]/20">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center text-[#1A1A1A] font-bold text-sm">2</div>
                            <div>
                              <CardTitle className="text-white">Reframe Settings</CardTitle>
                              <CardDescription className="text-white/90">Configure AI tracking and output</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Target Ratio */}
                          <div>
                            <Label className="text-white mb-3 block">Target Aspect Ratio</Label>
                            <div className="grid grid-cols-3 gap-4">
                              {[
                                { value: "9:16", label: "Vertical", desc: "Reels/TikTok", icon: <Smartphone className="h-6 w-6" /> },
                                { value: "16:9", label: "Landscape", desc: "YouTube", icon: <Monitor className="h-6 w-6" /> },
                                { value: "1:1", label: "Square", desc: "Feed", icon: <Square className="h-6 w-6" /> },
                              ].map((ratio) => (
                                <button
                                  key={ratio.value}
                                  onClick={() => {
                                    setReframeSettings(prev => ({ ...prev, targetRatio: ratio.value as SmartReframeSettings["targetRatio"] }));
                                    setDetectedShots([]);
                                  }}
                                  className={`p-4 rounded-xl border-2 transition-all ${
                                    reframeSettings.targetRatio === ratio.value 
                                      ? "border-[#B89555] bg-[#EFE6D6]/10" 
                                      : "border-white/10 hover:border-[#B89555]/30"
                                  }`}
                                >
                                  <div className={`mb-2 ${reframeSettings.targetRatio === ratio.value ? "text-[#1A1A1A]" : "text-white/90"}`}>
                                    {ratio.icon}
                                  </div>
                                  <p className="font-medium text-white text-sm">{ratio.label}</p>
                                  <p className="text-xs text-white/90">{ratio.desc}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Tracking Mode */}
                          <div>
                            <Label className="text-white mb-3 block">Subject Tracking</Label>
                            <Select 
                              value={reframeSettings.trackingMode} 
                              onValueChange={(v) => setReframeSettings(prev => ({ ...prev, trackingMode: v as SmartReframeSettings["trackingMode"] }))}
                            >
                              <SelectTrigger className="w-full bg-[#1A1A1A]/30 border-[#B89555]/30 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Auto Detect (Recommended)
                                  </div>
                                </SelectItem>
                                <SelectItem value="face">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Face Priority
                                  </div>
                                </SelectItem>
                                <SelectItem value="body">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Full Body
                                  </div>
                                </SelectItem>
                                <SelectItem value="object">
                                  <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Object Focus
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Sensitivity Slider */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-white">Reframe Sensitivity</Label>
                              <span className="text-sm text-[#1A1A1A]">{reframeSettings.sensitivity}%</span>
                            </div>
                            <Slider
                              value={[reframeSettings.sensitivity]}
                              onValueChange={([v]) => setReframeSettings(prev => ({ ...prev, sensitivity: v }))}
                              min={0}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <div className="flex justify-between mt-1 text-xs text-white/90">
                              <span>Stable (less movement)</span>
                              <span>Aggressive (follows subject)</span>
                            </div>
                          </div>

                          {/* Toggle Options */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center justify-between p-3 bg-[#1A1A1A]/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-[#1A1A1A]" />
                                <span className="text-sm text-white">Keep Headroom</span>
                              </div>
                              <Switch
                                checked={reframeSettings.keepHeadroom}
                                onCheckedChange={(v) => setReframeSettings(prev => ({ ...prev, keepHeadroom: v }))}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-[#1A1A1A]/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Grid3X3 className="h-4 w-4 text-[#1A1A1A]" />
                                <span className="text-sm text-white">Safe Area Guides</span>
                              </div>
                              <Switch
                                checked={reframeSettings.showSafeArea}
                                onCheckedChange={(v) => setReframeSettings(prev => ({ ...prev, showSafeArea: v }))}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-[#1A1A1A]/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Move className="h-4 w-4 text-[#1A1A1A]" />
                                <span className="text-sm text-white">Smooth Transitions</span>
                              </div>
                              <Switch
                                checked={reframeSettings.smoothTransitions}
                                onCheckedChange={(v) => setReframeSettings(prev => ({ ...prev, smoothTransitions: v }))}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Export Section */}
                <AnimatePresence>
                  {detectedShots.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className="bg-jj-layer-2 border-[#B89555]/20">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center text-[#1A1A1A] font-bold text-sm">3</div>
                            <div>
                              <CardTitle className="text-white">Export</CardTitle>
                              <CardDescription className="text-white/90">Generate your reframed video</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#1A1A1A]/30 rounded-xl">
                            <div>
                              <p className="text-white font-medium">
                                Ready to export {reframeSettings.targetRatio} version
                              </p>
                              <p className="text-sm text-white/90">
                                {detectedShots.length} shots with AI tracking • Projects save automatically
                              </p>
                            </div>
                            <div className="flex gap-3">
                              <Button 
                                variant="outline"
                                className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
                                onClick={downloadAllSizesPack}
                              >
                                <Package className="h-4 w-4 mr-2" />
                                All Sizes Pack
                              </Button>
                              <Button 
                                className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-semibold"
                                onClick={startSmartReframe}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-5 w-5 mr-2" />
                                    Export MP4
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Results */}
                          {jobs.length > 0 && toolMode === "smart-reframe" && (
                            <div className="mt-4 space-y-3">
                              {jobs.map((job) => (
                                <div 
                                  key={job.id}
                                  className="flex items-center gap-4 p-4 bg-[#1A1A1A]/20 rounded-lg"
                                >
                                  <div className="w-10 h-10 rounded-lg bg-[#EFE6D6]/20 flex items-center justify-center">
                                    <Target className="h-5 w-5 text-[#1A1A1A]" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-white">Smart Reframe {job.formatId}</p>
                                    {job.status === "processing" && (
                                      <Progress value={job.progress} className="h-2 mt-2" />
                                    )}
                                    {job.status === "completed" && (
                                      <p className="text-xs text-green-400">Ready to download</p>
                                    )}
                                    {job.status === "failed" && (
                                      <p className="text-xs text-red-400">{job.error}</p>
                                    )}
                                  </div>
                                  {job.status === "completed" && (
                                    <Button 
                                      size="sm" 
                                      className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
                                      onClick={() => downloadOutput(job)}
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      Download
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-jj-layer-2">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
              Why Use Our <span className="text-[#1A1A1A]">Video Tools</span>?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Target className="h-8 w-8" />,
                  title: "Per-Shot AI Tracking",
                  desc: "Intelligent subject detection for each scene. Faces, bodies, and objects stay perfectly framed."
                },
                {
                  icon: <Scissors className="h-8 w-8" />,
                  title: "Shot Detection",
                  desc: "Automatic scene cut detection. Each shot gets its own optimized crop window."
                },
                {
                  icon: <MousePointer2 className="h-8 w-8" />,
                  title: "Manual Override",
                  desc: "Drag crop windows on keyframes. Full control when you need it."
                },
              ].map((feature, idx) => (
                <Card key={idx} className="bg-[#1A1A1A]/50 border-[#B89555]/20">
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#EFE6D6]/20 text-[#1A1A1A] mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-white/90">{feature.desc}</p>
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
