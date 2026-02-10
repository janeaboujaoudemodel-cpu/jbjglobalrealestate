import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Download, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

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

  // FIXED: Filter out map images and location thumbnails from gallery
  const images = useMemo(() => {
    return (rawImages || []).filter(img => {
      const url = img.image_url?.toLowerCase() || "";
      // Exclude map images, location images, and thumbnails
      if (url.includes("map") && !url.includes("maptype=satellite")) return false;
      if (url.includes("location") && url.includes("thumbnail")) return false;
      if (url.includes("google.com/maps")) return false;
      return true;
    });
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
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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
            src={images[currentIndex].image_url}
            alt={images[currentIndex].alt_text || "Project image"}
            className="w-full h-full object-cover"
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
              {images.slice(0, 6).map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`aspect-[4/3] rounded overflow-hidden border-2 transition-colors relative ${
                    index === currentIndex ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                  type="button"
                >
                  <img
                    src={image.image_url}
                    alt={image.alt_text || `Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 5 && images.length > 6 && (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-foreground font-semibold">+{images.length - 6}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[calc(100vh-4rem)] p-0 bg-background border-none top-[52%]" aria-describedby={undefined}>
          <VisuallyHidden.Root>
            <DialogTitle>Image Gallery - {projectName}</DialogTitle>
          </VisuallyHidden.Root>
          <div className="relative w-full h-[calc(90vh-2rem)] flex items-center justify-center bg-gradient-to-br from-muted via-background to-muted/80">
            <img
              src={images[currentIndex].image_url}
              alt={images[currentIndex].alt_text || "Project image"}
              className="w-full h-full max-w-none max-h-none object-cover"
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