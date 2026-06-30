import { useState, useRef, useCallback } from "react";
import { 
  Upload, Image as ImageIcon, Video, X, GripVertical, 
  ChevronRight, Plus, Wand2, Trash2, RotateCcw, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { VideoProject, MediaItem } from "@/pages/VideoBuilder";

interface VideoMediaUploaderProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
  onNext: () => void;
}

const VideoMediaUploader = ({ project, onUpdate, onNext }: VideoMediaUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [project]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(f => 
      f.type.startsWith('image/') || f.type.startsWith('video/')
    );

    if (validFiles.length === 0) {
      toast.error("Please upload images or videos only");
      return;
    }

    setIsAnalyzing(true);
    toast.info(`Analyzing ${validFiles.length} file(s)...`);

    // Simulate AI analysis of uploaded media
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newMedia: MediaItem[] = await Promise.all(
      validFiles.map(async (file, index) => {
        const url = URL.createObjectURL(file);
        const isVideo = file.type.startsWith('video/');
        const currentOrder = project.media.length + index;
        
        return {
          id: crypto.randomUUID(),
          type: isVideo ? "video" as const : "image" as const,
          url,
          duration: isVideo ? 5 : 3,
          order: currentOrder,
          startTime: currentOrder * 3,
          endTime: (currentOrder + 1) * 3,
          effects: {
            transition: "fade",
            filter: "none",
            zoom: !isVideo,
            pan: currentOrder % 2 === 0,
          },
        };
      })
    );

    const updatedMedia = [...project.media, ...newMedia];
    const totalDuration = updatedMedia.reduce((acc, m) => acc + (m.endTime - m.startTime), 0);

    onUpdate({
      ...project,
      media: updatedMedia,
      duration: totalDuration,
    });

    setIsAnalyzing(false);
    toast.success(`Added ${validFiles.length} media item(s)`);
  };

  const handleRemoveMedia = (id: string) => {
    const updatedMedia = project.media.filter(m => m.id !== id);
    // Recalculate times
    let currentTime = 0;
    const reorderedMedia = updatedMedia.map((m, index) => {
      const duration = m.endTime - m.startTime;
      const item = {
        ...m,
        order: index,
        startTime: currentTime,
        endTime: currentTime + duration,
      };
      currentTime += duration;
      return item;
    });

    onUpdate({
      ...project,
      media: reorderedMedia,
      duration: currentTime,
    });
    toast.success("Media removed");
  };

  const handleReorder = (dragIndex: number, hoverIndex: number) => {
    const newMedia = [...project.media];
    const [removed] = newMedia.splice(dragIndex, 1);
    newMedia.splice(hoverIndex, 0, removed);
    
    // Recalculate times
    let currentTime = 0;
    const reorderedMedia = newMedia.map((m, index) => {
      const duration = m.endTime - m.startTime;
      const item = {
        ...m,
        order: index,
        startTime: currentTime,
        endTime: currentTime + duration,
      };
      currentTime += duration;
      return item;
    });

    onUpdate({
      ...project,
      media: reorderedMedia,
      duration: currentTime,
    });
  };

  const handleAIOptimize = async () => {
    if (project.media.length === 0) {
      toast.error("Add media first to optimize");
      return;
    }

    setIsAnalyzing(true);
    toast.info("AI is analyzing and optimizing your media...");
    
    // Simulate AI optimization
    await new Promise(resolve => setTimeout(resolve, 2000));

    const optimizedMedia = project.media.map((m, index) => ({
      ...m,
      effects: {
        transition: index === 0 ? "fade" : ["fade", "slide", "zoom"][index % 3],
        filter: ["none", "warm", "cool", "cinematic"][index % 4],
        zoom: true,
        pan: index % 2 === 0,
      },
    }));

    onUpdate({
      ...project,
      media: optimizedMedia,
    });

    setIsAnalyzing(false);
    toast.success("Media optimized with AI-suggested effects!");
  };

  const handleClearAll = () => {
    onUpdate({
      ...project,
      media: [],
      duration: 0,
    });
    toast.success("All media cleared");
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Add Media
        </CardTitle>
        <CardDescription>
          Upload images and video clips, or use the property images. AI will detect the best shots automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag & drop images or videos here, or
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
          >
            <Plus className="h-4 w-4 mr-2" />
            Browse Files
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Supports: JPG, PNG, WEBP, MP4, MOV
          </p>
        </div>

        {/* Actions */}
        {project.media.length > 0 && (
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              {project.media.length} item(s) • {Math.floor(project.duration / 60)}:{String(Math.floor(project.duration % 60)).padStart(2, '0')}
            </Badge>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAIOptimize}
                disabled={isAnalyzing}
              >
                <Wand2 className="h-4 w-4 mr-1" />
                AI Optimize
              </Button>
            </div>
          </div>
        )}

        {/* Media Grid */}
        {project.media.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {project.media.map((item, index) => (
              <div
                key={item.id}
                className="group relative aspect-video rounded-lg overflow-hidden bg-muted border border-border"
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                   loading="lazy" decoding="async" />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-[#1A1A1A]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-[#FDFBF7]/20"
                    onClick={() => handleRemoveMedia(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Order Badge */}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-background/80 text-foreground text-xs px-1.5">
                    {index + 1}
                  </Badge>
                </div>

                {/* Type Badge */}
                <div className="absolute top-2 right-2">
                  {item.type === "video" ? (
                    <Video className="h-4 w-4 text-white drop-shadow-md" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-white drop-shadow-md" />
                  )}
                </div>

                {/* Effects Indicator */}
                {item.effects && (item.effects.zoom || item.effects.pan) && (
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="text-xs px-1.5">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {item.effects.filter !== "none" ? item.effects.filter : "Effects"}
                    </Badge>
                  </div>
                )}

                {/* Duration */}
                <div className="absolute bottom-2 right-2">
                  <Badge className="bg-[#1A1A1A]/70 text-white text-xs">
                    {(item.endTime - item.startTime).toFixed(1)}s
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {project.media.length === 0 && !isAnalyzing && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No media added yet</p>
            {project.property && (
              <p className="text-sm mt-2">
                Using {project.property.images.length} images from {project.property.name}
              </p>
            )}
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-muted-foreground">AI is analyzing your media...</p>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onNext} disabled={project.media.length === 0 && !project.property}>
            Continue to Script <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoMediaUploader;
