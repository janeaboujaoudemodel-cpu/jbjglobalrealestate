import { useMemo, useRef, useState } from "react";
import { Play, Video, Eye, ExternalLink, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";


interface ProjectMediaSectionProps {
  videoUrl?: string | null;
  virtualTourUrl?: string | null;
  videos?: { id: string; url: string; title?: string | null }[];
  projectName: string;
  showOwnerEmptyState?: boolean;
}

// Validate that a URL is a real video (YouTube, Vimeo, or direct video file)
const isValidVideoUrl = (url: string): boolean => {
  if (getYouTubeVideoId(url)) return true;
  if (getVimeoVideoId(url)) return true;
  if (isDirectVideoUrl(url)) return true;
  return false;
};

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
  videos = [],
  projectName,
  showOwnerEmptyState = false,
}: ProjectMediaSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Only treat as valid video if it matches known patterns
  const hasValidVideo = videoUrl && isValidVideoUrl(videoUrl) && !videoError;
  const mediaVideos = useMemo(() => {
    const rows = videos.filter((video) => video.url && isValidVideoUrl(video.url));
    if (hasValidVideo && videoUrl) rows.unshift({ id: "primary-video", url: videoUrl, title: "Project video" });
    const seen = new Set<string>();
    return rows.filter((video) => {
      const key = video.url.toLowerCase().replace(/\?.*$/, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [hasValidVideo, videoUrl, videos]);

  if (mediaVideos.length === 0 && !virtualTourUrl && !showOwnerEmptyState) return null;

  const hasOneCard = mediaVideos.length + (virtualTourUrl ? 1 : 0) === 1;

  const getEmbedUrl = (url: string) => {
    const youtubeId = getYouTubeVideoId(url);
    const vimeoId = getVimeoVideoId(url);
    if (youtubeId) return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
    if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
    return null; // direct videos handled separately
  };

  return (
    <div className="jj-card-inner">
      <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
        <Video className="w-5 h-5 text-[#1A1A1A]" />
        Project Media
      </h3>

      <div className={`grid gap-4 ${hasOneCard ? 'grid-cols-1 max-w-2xl mx-auto' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {mediaVideos.length === 0 && showOwnerEmptyState && (
          <div className="sm:col-span-2 rounded-xl border border-dashed border-[#B89555]/55 bg-[#FDFBF7] p-6 md:p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#B89555]/45 bg-[#F7F2EA]">
              <Upload className="h-5 w-5 text-[#064E3B]" />
            </div>
            <p className="text-sm font-bold text-[#1A1A1A]">No project videos are attached yet</p>
            <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-[#1A1A1A]/65">
              Upload MP4, MOV, WebM or M4V files from the owner upload panel and they will publish here as inline playable media.
            </p>
          </div>
        )}

        {/* Video Card */}
        {mediaVideos.map((video, index) => {
          const youtubeId = getYouTubeVideoId(video.url);
          const isDirect = isDirectVideoUrl(video.url);
          return (
            <div
            key={video.id || video.url}
            className={`group relative rounded-xl border-2 border-[#B89555]/30 bg-card overflow-hidden aspect-video hover:border-[#B89555]/60 hover:shadow-lg hover:shadow-gold/10 transition-all text-left ${activeVideoIndex === index ? "sm:col-span-2" : ""}`}
          >
            {/* YouTube Thumbnail */}
            {activeVideoIndex === index && getEmbedUrl(video.url) ? (
              <iframe
                key={video.url}
                src={getEmbedUrl(video.url) || ""}
                className="h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={video.title || `${projectName} Video`}
              />
            ) : youtubeId ? (
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
                src={video.url}
                ref={activeVideoIndex === index ? (node) => { videoRef.current = node; } : undefined}
                className="w-full h-full object-contain bg-black"
                muted={activeVideoIndex !== index}
                controls={activeVideoIndex === index}
                autoPlay={activeVideoIndex === index}
                preload="metadata"
                playsInline
                onError={() => setVideoError(true)}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Video className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            
            {/* Play Button Overlay */}
            {activeVideoIndex !== index && (
              <button
                type="button"
                onClick={() => setActiveVideoIndex(index)}
                className="absolute inset-0 bg-[#1A1A1A]/40 flex items-center justify-center group-hover:bg-[#1A1A1A]/50 transition-colors"
                aria-label={`Play ${video.title || "project video"}`}
              >
                <span className="w-16 h-16 rounded-full bg-[#EFE6D6]/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Play className="w-8 h-8 text-[#1A1A1A] ml-1" fill="currentColor" />
                </span>
              </button>
            )}
            
            {/* Label */}
            {activeVideoIndex !== index && <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white font-medium">{video.title || "Watch Project Video"}</p>
            </div>}
          </div>
          );
        })}

        {/* Virtual Tour Card */}
        {virtualTourUrl && (
          <button
            onClick={() => setTourOpen(true)}
            className="group relative rounded-xl border-2 border-[#B89555]/30 bg-card overflow-hidden aspect-video hover:border-[#B89555]/60 hover:shadow-lg hover:shadow-gold/10 transition-all text-left"
          >
            <div className="w-full h-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
              <Eye className="w-16 h-16 text-[#1A1A1A]/70 group-hover:scale-110 transition-transform" />
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

      {/* Virtual Tour Modal */}
      <Dialog open={tourOpen} onOpenChange={setTourOpen}>
        <DialogContent className="max-w-6xl p-0 bg-[#1A1A1A] border-[#B89555]/30">
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
                  className="absolute top-4 right-4 bg-[#EFE6D6] text-[#1A1A1A] px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-[#EFE6D6]-light transition-colors"
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
