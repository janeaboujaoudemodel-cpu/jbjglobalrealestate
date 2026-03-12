import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, Upload, Wand2, Music, Languages, Play, Pause, 
  Download, Share2, FileVideo, Image as ImageIcon, Mic, 
  Type, Palette, Layers, Volume2, Subtitles, Sparkles,
  RotateCcw, ChevronRight, Check, X, Settings, Film,
  Camera, MapPin, DollarSign, Building2, Clock, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

import VideoBuilderAccessGate from "@/components/video-builder/VideoBuilderAccessGate";
import VideoProjectSelector from "@/components/video-builder/VideoProjectSelector";
import VideoMediaUploader from "@/components/video-builder/VideoMediaUploader";
import VideoScriptGenerator from "@/components/video-builder/VideoScriptGenerator";
import VideoVoiceStudio from "@/components/video-builder/VideoVoiceStudio";
import VideoSubtitleEditor from "@/components/video-builder/VideoSubtitleEditor";
import VideoMusicSelector from "@/components/video-builder/VideoMusicSelector";
import VideoBrandingEditor from "@/components/video-builder/VideoBrandingEditor";
import VideoPreviewPlayer from "@/components/video-builder/VideoPreviewPlayer";
import VideoExportPanel from "@/components/video-builder/VideoExportPanel";
import VideoTimelineEditor from "@/components/video-builder/VideoTimelineEditor";

export interface VideoProject {
  id: string;
  name: string;
  property?: {
    id: string;
    name: string;
    location: string;
    price_from: number;
    developer: string;
    images: string[];
  };
  media: MediaItem[];
  script: string;
  voiceover?: {
    url: string;
    language: string;
    accent: string;
  };
  subtitles?: SubtitleItem[];
  music?: {
    url: string;
    name: string;
    mood: string;
  };
  branding: {
    showLogo: boolean;
    showIntro: boolean;
    showOutro: boolean;
    watermark: boolean;
    priceOverlay: boolean;
  };
  format: "16:9" | "9:16" | "1:1";
  duration: number;
  status: "draft" | "processing" | "ready";
}

export interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  duration?: number;
  order: number;
  startTime: number;
  endTime: number;
  effects?: {
    transition: string;
    filter: string;
    zoom: boolean;
    pan: boolean;
  };
}

export interface SubtitleItem {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  language: string;
}

const VideoBuilder = () => {
  const [activeTab, setActiveTab] = useState("project");
  const [project, setProject] = useState<VideoProject>({
    id: crypto.randomUUID(),
    name: "New Video Project",
    media: [],
    script: "",
    branding: {
      showLogo: true,
      showIntro: true,
      showOutro: true,
      watermark: true,
      priceOverlay: true,
    },
    format: "16:9",
    duration: 0,
    status: "draft",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const steps = [
    { id: "project", label: "Select Property", icon: Building2, complete: !!project.property },
    { id: "media", label: "Add Media", icon: ImageIcon, complete: project.media.length > 0 },
    { id: "script", label: "AI Script", icon: Type, complete: !!project.script },
    { id: "voice", label: "Voiceover", icon: Mic, complete: !!project.voiceover },
    { id: "music", label: "Music", icon: Music, complete: !!project.music },
    { id: "subtitles", label: "Subtitles", icon: Subtitles, complete: project.subtitles && project.subtitles.length > 0 },
    { id: "branding", label: "Branding", icon: Sparkles, complete: true },
    { id: "preview", label: "Preview", icon: Eye, complete: false },
    { id: "export", label: "Export", icon: Download, complete: project.status === "ready" },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === activeTab);

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setActiveTab(steps[currentStepIndex + 1].id);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setActiveTab(steps[currentStepIndex - 1].id);
    }
  };

  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate video generation progress
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setProject(p => ({ ...p, status: "ready" }));
          toast.success("Video generated successfully!");
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  return (
    <VideoBuilderAccessGate>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 lg:top-[48px] z-40">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  AI Video Builder
                </h1>
                <p className="text-sm text-muted-foreground">
                  Create professional property videos in minutes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {project.format}
              </Badge>
              <Badge variant={project.status === "ready" ? "default" : "secondary"}>
                {project.status === "ready" ? "Ready" : project.status === "processing" ? "Processing" : "Draft"}
              </Badge>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setActiveTab(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  activeTab === step.id
                    ? "bg-primary text-primary-foreground"
                    : step.complete
                    ? "bg-primary/20 text-primary hover:bg-primary/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {step.complete && activeTab !== step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:inline" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Editor Panel */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "project" && (
                  <VideoProjectSelector
                    project={project}
                    onUpdate={setProject}
                    onNext={handleNextStep}
                  />
                )}
                {activeTab === "media" && (
                  <VideoMediaUploader
                    project={project}
                    onUpdate={setProject}
                    onNext={handleNextStep}
                  />
                )}
                {activeTab === "script" && (
                  <VideoScriptGenerator
                    project={project}
                    onUpdate={setProject}
                    onNext={handleNextStep}
                  />
                )}
                {activeTab === "voice" && (
                  <VideoVoiceStudio
                    project={project}
                    onUpdate={setProject}
                    onNext={handleNextStep}
                  />
                )}
                {activeTab === "music" && (
                  <VideoMusicSelector
                    project={project}
                    onUpdate={setProject}
                    onNext={handleNextStep}
                  />
                )}
                {activeTab === "subtitles" && (
                  <VideoSubtitleEditor
                    project={project}
                    onUpdate={setProject}
                    onNext={handleNextStep}
                  />
                )}
                {activeTab === "branding" && (
                  <VideoBrandingEditor
                    project={project}
                    onUpdate={setProject}
                    onNext={handleNextStep}
                  />
                )}
                {activeTab === "preview" && (
                  <div className="space-y-4">
                    <VideoPreviewPlayer project={project} />
                    <VideoTimelineEditor
                      project={project}
                      onUpdate={setProject}
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleNextStep} className="gap-2">
                        Continue to Export <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {activeTab === "export" && (
                  <VideoExportPanel
                    project={project}
                    isGenerating={isGenerating}
                    progress={generationProgress}
                    onGenerate={handleGenerateVideo}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Preview Sidebar */}
          <div className="space-y-4">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className={`bg-black rounded-lg overflow-hidden relative ${
                    project.format === "9:16" ? "aspect-[9/16]" : 
                    project.format === "1:1" ? "aspect-square" : "aspect-video"
                  }`}
                >
                  {project.media.length > 0 ? (
                    <img
                      src={project.media[0]?.url || project.property?.images[0]}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : project.property?.images[0] ? (
                    <img
                      src={project.property.images[0]}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Film className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Add media to preview</p>
                      </div>
                    </div>
                  )}

                  {/* Overlays */}
                  {project.branding.watermark && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-background/80 text-foreground text-xs">
                        JBJ Global
                      </Badge>
                    </div>
                  )}

                  {project.branding.priceOverlay && project.property && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2">
                        <p className="text-sm font-semibold truncate">{project.property.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{project.property.location}</span>
                        </div>
                        <p className="text-primary font-bold mt-1">
                          AED {project.property.price_from?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Format Selector */}
                <div className="mt-4 flex gap-2">
                  {(["16:9", "9:16", "1:1"] as const).map((format) => (
                    <Button
                      key={format}
                      variant={project.format === format ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setProject(p => ({ ...p, format }))}
                    >
                      {format}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Project Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Media Items</span>
                  <span className="font-medium">{project.media.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {Math.floor(project.duration / 60)}:{String(project.duration % 60).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Voiceover</span>
                  <span className="font-medium">{project.voiceover ? "Added" : "Not set"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Music</span>
                  <span className="font-medium">{project.music?.name || "Not set"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Generation Progress */}
            {isGenerating && (
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Wand2 className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Generating Video</p>
                      <p className="text-xs text-muted-foreground">Please wait...</p>
                    </div>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-xs text-center mt-2 text-muted-foreground">
                    {generationProgress}% complete
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
    </VideoBuilderAccessGate>
  );
};

export default VideoBuilder;
