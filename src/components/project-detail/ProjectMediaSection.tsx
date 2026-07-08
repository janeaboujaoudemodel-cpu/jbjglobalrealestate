import { useMemo, useRef, useState } from "react";
import { Play, Video, Eye, ExternalLink, ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";


interface ProjectMediaSectionProps {
  videoUrl?: string | null;
  virtualTourUrl?: string | null;
  videos?: { id: string; url: string; title?: string | null }[];
  projectName: string;
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

  if (mediaVideos.length === 0 && !virtualTourUrl) return null;

  const activeVideo = activeVideoIndex !== null ? mediaVideos[activeVideoIndex] : null;
  const activeIsDirect = activeVideo ? isDirectVideoUrl(activeVideo.url) : false;
  const hasOneCard = mediaVideos.length + (virtualTourUrl ? 1 : 0) === 1;

  const getEmbedUrl = (url: string) => {
    const youtubeId = getYouTubeVideoId(url);
    const vimeoId = getVimeoVideoId(url);
    if (youtubeId) return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
    if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
    return null; // direct videos handled separately
  };

  const closeVideo = () => {
    videoRef.current?.pause();
    videoRef.current?.removeAttribute("src");
    videoRef.current?.load();
    videoRef.current = null;
    setActiveVideoIndex(null);
  };

  const moveVideo = (direction: -1 | 1) => {
    setActiveVideoIndex((index) => {
      if (index === null || mediaVideos.length === 0) return index;
      return (index + direction + mediaVideos.length) % mediaVideos.length;
    });
  };

  return (
    <div className="jj-card-inner">
      <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
        <Video className="w-5 h-5 text-[#1A1A1A]" />
        Project Media
      </h3>

      <div className={`grid gap-4 ${hasOneCard ? 'grid-cols-1 max-w-2xl mx-auto' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {/* Video Card */}
        {mediaVideos.map((video, index) => {
          const youtubeId = getYouTubeVideoId(video.url);
          const isDirect = isDirectVideoUrl(video.url);
          return (
            <button
            key={video.id || video.url}
            onClick={() => setActiveVideoIndex(index)}
            className="group relative rounded-xl border-2 border-[#B89555]/30 bg-card overflow-hidden aspect-video hover:border-[#B89555]/60 hover:shadow-lg hover:shadow-gold/10 transition-all text-left"
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
                src={video.url}
                className="w-full h-full object-cover"
                muted
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
            <div className="absolute inset-0 bg-[#1A1A1A]/40 flex items-center justify-center group-hover:bg-[#1A1A1A]/50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-[#EFE6D6]/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Play className="w-8 h-8 text-[#1A1A1A] ml-1" fill="currentColor" />
              </div>
            </div>
            
            {/* Label */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white font-medium">{video.title || "Watch Project Video"}</p>
            </div>
          </button>
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

      {/* Video Modal — large, in-page expansion (not fullscreen) */}
      <Dialog open={activeVideoIndex !== null} onOpenChange={(open) => { if (!open) closeVideo(); }}>
        <DialogContent
          className="max-w-[min(1400px,96vw)] w-[96vw] p-0 bg-[#0b0b0b] border-[#B89555]/30 overflow-hidden sm:rounded-xl"
          onEscapeKeyDown={closeVideo}
          onPointerDownOutside={closeVideo}
        >
          <DialogTitle className="sr-only">{activeVideo?.title || `${projectName} Video`}</DialogTitle>
          <div className="relative w-full" style={{ aspectRatio: "16 / 9", maxHeight: "88vh" }}>
            {activeVideo && activeIsDirect ? (
              <video
                key={activeVideo.url}
                ref={(node) => { videoRef.current = node; }}
                src={activeVideo.url}
                className="w-full h-full object-contain bg-black"
                controls
                controlsList="nodownload"
                autoPlay
                playsInline
              />
            ) : activeVideo && getEmbedUrl(activeVideo.url) ? (
              <iframe
                key={activeVideo.url}
                src={getEmbedUrl(activeVideo.url) || ""}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={activeVideo.title || `${projectName} Video`}
              />
            ) : null}

            {/* Top-right toolbar: Download + Close (both always work) */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              {activeVideo && activeIsDirect && (
                <a
                  href={activeVideo.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Download video"
                  className="inline-grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#1A1A1A] shadow-lg hover:bg-white"
                >
                  <Download className="h-5 w-5" />
                </a>
              )}
              <DialogClose
                aria-label="Close video"
                className="inline-grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#1A1A1A] shadow-lg hover:bg-white"
              >
                <X className="h-5 w-5" />
              </DialogClose>
            </div>

            {mediaVideos.length > 1 && (
              <>
                <button type="button" onClick={() => moveVideo(-1)} aria-label="Previous video" className="absolute left-4 top-1/2 -translate-y-1/2 inline-grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/55 text-white hover:bg-black/75 z-10">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => moveVideo(1)} aria-label="Next video" className="absolute right-4 top-1/2 -translate-y-1/2 inline-grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/55 text-white hover:bg-black/75 z-10">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white z-10">
                  {(activeVideoIndex ?? 0) + 1} / {mediaVideos.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>


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
