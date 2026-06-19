import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Download, Maximize2, X } from "lucide-react";
import { getHighResImageUrl } from "@/lib/imageUtils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { SUPABASE_URL } from "@/config/backend";

interface ImageCarouselProps {
  images: {
    id: string;
    image_url: string;
    alt_text: string | null;
  }[];
  projectName?: string;
}

const ImageCarousel = ({ images: rawImages, projectName = "project" }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Normalize a CDN URL into a stable key so the same photo at different
  // resolutions (thumb / w_400 / ?width=1200 / -150x150) collapses to one entry.
  const dedupeKey = (rawUrl: string): string => {
    let u = (rawUrl || "").toLowerCase().split("?")[0].split("#")[0];
    u = u.replace(/\/(w|h|c|q|f|s|t)_[a-z0-9,_.]+\//g, "/");
    u = u.replace(/-\d{2,4}x\d{2,4}(?=\.[a-z]+$)/g, "");
    u = u.replace(/_(thumb|small|medium|large|xl|xxl|hd|hires|lowres|preview|tn)(?=\.[a-z]+$)/g, "");
    u = u.replace(/\/(thumb|thumbs|small|medium|large|xl|preview|tn)\//g, "/");
    u = u.replace(/\/+$/g, "");
    return u;
  };
  const sizeScore = (rawUrl: string): number => {
    const url = rawUrl || "";
    const m = url.match(/(\d{3,4})x(\d{3,4})/);
    if (m) return parseInt(m[1], 10) * parseInt(m[2], 10);
    const w = url.match(/[?&](w|width)=(\d{3,4})/i);
    if (w) return parseInt(w[2], 10) * parseInt(w[2], 10);
    if (/thumb|small|preview|tn|lowres/i.test(url)) return 100 * 100;
    if (/large|xl|xxl|hd|hires|original|maxres/i.test(url)) return 1920 * 1080;
    return 1024 * 768;
  };

  // Filter out map/location thumbs AND collapse duplicates (keep highest-res variant)
  const images = useMemo(() => {
    const filtered = (rawImages || []).filter((img) => {
      const url = img.image_url?.toLowerCase() || "";
      if (url.includes("map") && !url.includes("maptype=satellite")) return false;
      if (url.includes("location") && url.includes("thumbnail")) return false;
      if (url.includes("google.com/maps")) return false;
      return true;
    });
    const best = new Map<string, typeof filtered[number]>();
    for (const img of filtered) {
      const key = dedupeKey(img.image_url);
      const existing = best.get(key);
      if (!existing || sizeScore(img.image_url) > sizeScore(existing.image_url)) {
        best.set(key, img);
      }
    }
    return Array.from(best.values());
  }, [rawImages]);

  const hasMultiple = useMemo(() => (images?.length ?? 0) > 1, [images]);

  const goPrev = () => {
    if (!hasMultiple) return;
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  };

  const goNext = () => {
    if (!hasMultiple) return;
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  const handleDownload = async (imageUrl: string, index: number) => {
    const filename = `${projectName.replace(/\s+/g, "-").toLowerCase()}-${index + 1}.jpg`;
    
    // Route through download proxy for reliable Content-Disposition: attachment
    const supabaseUrl = SUPABASE_URL;
    if (supabaseUrl) {
      const proxyUrl = new URL(`${supabaseUrl}/functions/v1/download-file`);
      proxyUrl.searchParams.set("url", imageUrl);
      proxyUrl.searchParams.set("filename", filename);
      
      // Use hidden <a> tag to trigger browser download
      const link = document.createElement("a");
      link.href = proxyUrl.toString();
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Fallback: try fetch blob
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < images.length; i++) {
      await handleDownload(images[i].image_url, i);
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  };

  return (
    <>
      <div className="relative">
        {/* Main Image - with background frame for vertical images */}
        <div className="aspect-[16/9] rounded-lg overflow-hidden bg-gradient-to-br from-muted via-muted/80 to-muted/60 relative group flex items-center justify-center">
          <img
            src={getHighResImageUrl(images[currentIndex].image_url)}
            alt={images[currentIndex].alt_text || "Project image"}
            className="w-full h-full object-cover"
            loading="eager"
          />
          
          {/* Overlay Controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              className="h-11 w-11 rounded-xl border border-border bg-background/70 backdrop-blur-sm shadow-lg transition-transform duration-200 hover:scale-105 flex items-center justify-center"
              onClick={() => handleDownload(images[currentIndex].image_url, currentIndex)}
              title="Download this image"
              type="button"
            >
              <Download className="w-5 h-5 text-foreground" />
            </button>
            <button
              className="h-11 w-11 rounded-xl border border-border bg-background/70 backdrop-blur-sm shadow-lg transition-transform duration-200 hover:scale-105 flex items-center justify-center"
              onClick={() => setIsFullscreen(true)}
              title="View fullscreen"
              type="button"
            >
              <Maximize2 className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Premium left/right arrows (GALLERY ONLY) */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full border border-border bg-background/70 backdrop-blur-sm shadow-lg transition-all hover:bg-background/85 hover:shadow-xl flex items-center justify-center"
                aria-label="Previous image"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full border border-border bg-background/70 backdrop-blur-sm shadow-lg transition-all hover:bg-background/85 hover:shadow-xl flex items-center justify-center"
                aria-label="Next image"
              >
                <ArrowRight className="h-5 w-5 text-foreground" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 bg-background/70 backdrop-blur-sm px-3 py-1 rounded-full text-foreground text-sm border border-border">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Navigation Arrows hidden - user navigates via thumbnails */}

        {/* Dots hidden - user navigates via thumbnails */}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">{images.length} Photos</span>
              {images.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadAll}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted text-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download All Photos
                </Button>
              )}
            </div>
            <div className="grid grid-cols-6 gap-2">
              {images.slice(0, 6).map((image, index) => {
                const isOverflowTile = index === 5 && images.length > 6;
                return (
                  <button
                    key={image.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      // "+N" opens the full lightbox so the user can browse ALL photos
                      if (isOverflowTile) setIsFullscreen(true);
                    }}
                    className={`aspect-[4/3] rounded overflow-hidden border-2 transition-colors relative ${
                      index === currentIndex ? "border-primary" : "border-transparent hover:border-border"
                    }`}
                    type="button"
                    aria-label={isOverflowTile ? `View all ${images.length} photos` : `View photo ${index + 1}`}
                  >
                    <img
                      src={getHighResImageUrl(image.image_url, "464x312")}
                      alt={image.alt_text || `Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isOverflowTile && (
                      <div className="absolute inset-0 bg-[#1A1A1A]/70 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">+{images.length - 6}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-[#1A1A1A]/95 backdrop-blur-xl border-none top-[50%]" aria-describedby={undefined}>
          <VisuallyHidden.Root>
            <DialogTitle>Image Gallery - {projectName}</DialogTitle>
          </VisuallyHidden.Root>
          <div className="relative w-full h-[90vh] flex items-center justify-center bg-[#1A1A1A]/95">
            <img
              src={getHighResImageUrl(images[currentIndex].image_url)}
              alt={images[currentIndex].alt_text || "Project image"}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-background/70 hover:bg-background/85 text-foreground rounded-full w-10 h-10 border border-border"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Premium left/right arrows in fullscreen */}
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border border-border bg-background/70 backdrop-blur-sm shadow-lg transition-all hover:bg-background/85 hover:shadow-xl flex items-center justify-center"
                  aria-label="Previous image"
                >
                  <ArrowLeft className="h-6 w-6 text-foreground" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border border-border bg-background/70 backdrop-blur-sm shadow-lg transition-all hover:bg-background/85 hover:shadow-xl flex items-center justify-center"
                  aria-label="Next image"
                >
                  <ArrowRight className="h-6 w-6 text-foreground" />
                </button>
              </>
            )}

            {/* Download button in fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 bg-background/70 hover:bg-background/85 text-foreground rounded-full w-10 h-10 border border-border"
              onClick={() => handleDownload(images[currentIndex].image_url, currentIndex)}
            >
              <Download className="w-5 h-5" />
            </Button>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/70 backdrop-blur-sm px-4 py-2 rounded-full text-foreground border border-border">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageCarousel;