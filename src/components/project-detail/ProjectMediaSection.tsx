import { useState } from "react";
import { Play, Video, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ProjectMediaSectionProps {
  videoUrl?: string | null;
  virtualTourUrl?: string | null;
  projectName: string;
}

// Extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Extract Vimeo video ID
const getVimeoVideoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

// Check if URL is a direct video file
const isDirectVideoUrl = (url: string): boolean => {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
};

export default function ProjectMediaSection({
  videoUrl,
  virtualTourUrl,
  projectName,
}: ProjectMediaSectionProps) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  if (!videoUrl && !virtualTourUrl) return null;

  const youtubeId = videoUrl ? getYouTubeVideoId(videoUrl) : null;
  const vimeoId = videoUrl ? getVimeoVideoId(videoUrl) : null;
  const isDirect = videoUrl ? isDirectVideoUrl(videoUrl) : false;

  const getEmbedUrl = () => {
    if (youtubeId) return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
    if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
    return null; // direct videos handled separately
  };

  return (
    <div className="jj-card-inner">
      <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
        <Video className="w-5 h-5 text-gold" />
        Project Media
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Video Card */}
        {videoUrl && (
          <button
            onClick={() => setVideoOpen(true)}
            className="group relative rounded-xl border-2 border-gold/30 bg-card overflow-hidden aspect-video hover:border-gold/60 hover:shadow-lg hover:shadow-gold/10 transition-all text-left"
          >
            {/* YouTube Thumbnail */}
            {youtubeId ? (
              <img
                src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                alt={`${projectName} video`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                }}
              />
            ) : isDirect ? (
              <video
                src={videoUrl}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
                playsInline
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Video className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-gold/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
              </div>
            </div>
            
            {/* Label */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white font-medium">Watch Project Video</p>
            </div>
          </button>
        )}

        {/* Virtual Tour Card */}
        {virtualTourUrl && (
          <button
            onClick={() => setTourOpen(true)}
            className="group relative rounded-xl border-2 border-gold/30 bg-card overflow-hidden aspect-video hover:border-gold/60 hover:shadow-lg hover:shadow-gold/10 transition-all text-left"
          >
            <div className="w-full h-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
              <Eye className="w-16 h-16 text-gold/60 group-hover:scale-110 transition-transform" />
            </div>
            
            {/* Label */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white font-medium flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Take a Virtual Tour
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Video Modal */}
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-gold/30">
          <DialogTitle className="sr-only">{projectName} Video</DialogTitle>
          <div className="aspect-video w-full">
            {videoOpen && isDirect && videoUrl ? (
              <video
                src={videoUrl}
                className="w-full h-full"
                controls
                autoPlay
                playsInline
              />
            ) : videoOpen && getEmbedUrl() ? (
              <iframe
                src={getEmbedUrl() || ""}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={`${projectName} Video`}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Virtual Tour Modal */}
      <Dialog open={tourOpen} onOpenChange={setTourOpen}>
        <DialogContent className="max-w-6xl p-0 bg-black border-gold/30">
          <DialogTitle className="sr-only">{projectName} Virtual Tour</DialogTitle>
          <div className="aspect-video w-full relative">
            {tourOpen && virtualTourUrl && (
              <>
                <iframe
                  src={virtualTourUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title={`${projectName} Virtual Tour`}
                />
                <a
                  href={virtualTourUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-4 right-4 bg-gold text-black px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-gold-light transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </a>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
