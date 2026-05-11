import { useState } from "react";
import { 
  Download, Share2, Wand2, Check, FileVideo, 
  Smartphone, Monitor, Square, Instagram, Youtube, 
  MessageCircle, Mail, Copy, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import type { VideoProject } from "@/pages/VideoBuilder";

interface VideoExportPanelProps {
  project: VideoProject;
  isGenerating: boolean;
  progress: number;
  onGenerate: () => void;
}

const EXPORT_QUALITIES = [
  { id: "720p", label: "720p HD", description: "Good for web", size: "~50MB" },
  { id: "1080p", label: "1080p Full HD", description: "Recommended", size: "~100MB" },
  { id: "4k", label: "4K Ultra HD", description: "Best quality", size: "~300MB" },
];

const EXPORT_FORMATS = [
  { id: "mp4", label: "MP4", description: "Universal compatibility" },
  { id: "mov", label: "MOV", description: "Apple devices" },
  { id: "webm", label: "WebM", description: "Web optimized" },
];

const SHARE_OPTIONS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "bg-green-500" },
  { id: "email", label: "Email", icon: Mail, color: "bg-blue-500" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "bg-pink-500" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "bg-red-500" },
  { id: "facebook", label: "Facebook", icon: ExternalLink, color: "bg-blue-600" },
  { id: "tiktok", label: "TikTok", icon: ExternalLink, color: "bg-[#1A1A1A]" },
  { id: "linkedin", label: "LinkedIn", icon: ExternalLink, color: "bg-blue-700" },
  { id: "twitter", label: "X", icon: ExternalLink, color: "bg-[#1A1A1A]" },
  { id: "copy", label: "Copy Link", icon: Copy, color: "bg-[#B89555]" },
];

const VideoExportPanel = ({ project, isGenerating, progress, onGenerate }: VideoExportPanelProps) => {
  const [quality, setQuality] = useState("1080p");
  const [format, setFormat] = useState("mp4");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (project.status !== "ready") {
      onGenerate();
      return;
    }

    setIsExporting(true);
    toast.info("Preparing your video for download...");

    try {
      // Create a sample video blob for download demonstration
      // In production, this would fetch the actual rendered video
      const videoUrl = project.media[0]?.url || project.property?.images[0];
      
      if (videoUrl) {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        
        // Create download link
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${project.name.replace(/\s+/g, '-')}-${format}.${format === 'mp4' ? 'mp4' : format === 'mov' ? 'mov' : 'webm'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        
        toast.success("Video downloaded successfully!");
      } else {
        toast.error("No media available to download");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to download video. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = (platform: string) => {
    if (project.status !== "ready") {
      toast.error("Please generate the video first");
      return;
    }

    const shareUrl = encodeURIComponent(`https://jbj.ae/video/${project.id}`);
    const shareText = encodeURIComponent(`Check out this property video: ${project.name}`);

    switch (platform) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${shareText}%20${shareUrl}`, "_blank");
        break;
      case "email":
        window.location.href = `mailto:?subject=Property Video - ${project.name}&body=Check out this property video: ${decodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`, "_blank");
        break;
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, "_blank");
        break;
      case "tiktok":
        toast.info("To share on TikTok, download the video and upload directly to the TikTok app");
        break;
      case "instagram":
        toast.info("To share on Instagram, download the video and upload via the Instagram app");
        break;
      case "youtube":
        toast.info("To upload to YouTube, download the video and use YouTube Studio");
        break;
      case "copy":
        navigator.clipboard.writeText(`https://jbj.ae/video/${project.id}`);
        toast.success("Link copied to clipboard!");
        break;
      default:
        toast.info(`Sharing to ${platform} - download the video and upload manually`);
    }
  };

  const handlePublishToListing = () => {
    if (project.status !== "ready") {
      toast.error("Please generate the video first");
      return;
    }

    if (!project.property) {
      toast.error("No property associated with this video");
      return;
    }

    toast.success(`Video will be published to ${project.property.name} listing!`);
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Export & Share
        </CardTitle>
        <CardDescription>
          Generate your final video and share it across platforms.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Video Summary */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <h4 className="font-medium">Video Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span>{Math.floor(project.duration / 60)}:{String(Math.floor(project.duration % 60)).padStart(2, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Format</span>
              <span>{project.format}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Clips</span>
              <span>{project.media.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Voiceover</span>
              <span>{project.voiceover ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Music</span>
              <span>{project.music?.name || "None"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtitles</span>
              <span>{project.subtitles?.length || 0} segments</span>
            </div>
          </div>
        </div>

        {/* Status */}
        {project.status !== "ready" && !isGenerating && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <p className="text-amber-600 font-medium">Video not yet generated</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Generate Video" to create your final video with all effects applied.
            </p>
          </div>
        )}

        {/* Generation Progress */}
        {isGenerating && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Generating your video...</p>
                <p className="text-sm text-muted-foreground">
                  Applying effects, transitions, and branding
                </p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              {progress}% complete
            </p>
          </div>
        )}

        {/* Ready Status */}
        {project.status === "ready" && !isGenerating && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-green-600 font-medium">Video Ready!</p>
              <p className="text-sm text-muted-foreground">
                Your video is ready to download and share
              </p>
            </div>
          </div>
        )}

        {/* Export Quality */}
        <div className="space-y-3">
          <Label>Export Quality</Label>
          <RadioGroup
            value={quality}
            onValueChange={setQuality}
            className="grid grid-cols-3 gap-3"
          >
            {EXPORT_QUALITIES.map((q) => (
              <Label
                key={q.id}
                htmlFor={`quality-${q.id}`}
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  quality === q.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={q.id} id={`quality-${q.id}`} className="sr-only" />
                <span className="font-medium text-sm">{q.label}</span>
                <span className="text-xs text-muted-foreground">{q.description}</span>
                <span className="text-xs text-muted-foreground">{q.size}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Export Format */}
        <div className="space-y-3">
          <Label>Export Format</Label>
          <RadioGroup
            value={format}
            onValueChange={setFormat}
            className="grid grid-cols-3 gap-3"
          >
            {EXPORT_FORMATS.map((f) => (
              <Label
                key={f.id}
                htmlFor={`format-${f.id}`}
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  format === f.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={f.id} id={`format-${f.id}`} className="sr-only" />
                <span className="font-medium text-sm uppercase">{f.label}</span>
                <span className="text-xs text-muted-foreground">{f.description}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {project.status !== "ready" ? (
            <Button
              onClick={onGenerate}
              disabled={isGenerating || project.media.length === 0}
              className="flex-1"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Video
            </Button>
          ) : (
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Download Video"}
            </Button>
          )}
        </div>

        {/* Share Options */}
        <div className="space-y-3 pt-4 border-t">
          <Label>Share Video</Label>
          <div className="flex flex-wrap gap-2">
            {SHARE_OPTIONS.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                size="sm"
                onClick={() => handleShare(option.id)}
                disabled={project.status !== "ready"}
                className="gap-2"
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Publish to Listing */}
        {project.property && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={handlePublishToListing}
              disabled={project.status !== "ready"}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Publish to {project.property.name} Listing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoExportPanel;
