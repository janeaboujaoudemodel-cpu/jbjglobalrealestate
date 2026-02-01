import { useState } from "react";
import { Download, Maximize2, X } from "lucide-react";
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

const ImageCarousel = ({ images, projectName = "project" }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[16/9] bg-[#1a1a1a] rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Fallback: open in new tab
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
        {/* Main Image */}
        <div className="aspect-[16/9] rounded-lg overflow-hidden bg-[#1a1a1a] relative group">
          <img
            src={images[currentIndex].image_url}
            alt={images[currentIndex].alt_text || "Project image"}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay Controls - Always Visible with 3D Premium Style */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              className="relative w-11 h-11 rounded-xl font-bold transition-all duration-300 overflow-hidden flex items-center justify-center hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                boxShadow: `
                  0 4px 14px rgba(200,167,102,0.4),
                  0 3px 8px rgba(0,0,0,0.15),
                  inset 0 1px 3px rgba(255,255,255,0.9),
                  0 0 12px rgba(200,167,102,0.3)
                `,
              }}
              onClick={() => handleDownload(images[currentIndex].image_url, currentIndex)}
              title="Download this image"
            >
              <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />
              <Download className="w-5 h-5 text-black relative z-10" />
            </button>
            <button
              className="relative w-11 h-11 rounded-xl font-bold transition-all duration-300 overflow-hidden flex items-center justify-center hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                boxShadow: `
                  0 4px 14px rgba(200,167,102,0.4),
                  0 3px 8px rgba(0,0,0,0.15),
                  inset 0 1px 3px rgba(255,255,255,0.9),
                  0 0 12px rgba(200,167,102,0.3)
                `,
              }}
              onClick={() => setIsFullscreen(true)}
              title="View fullscreen"
            >
              <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />
              <Maximize2 className="w-5 h-5 text-black relative z-10" />
            </button>
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Navigation Arrows hidden - user navigates via thumbnails */}

        {/* Dots hidden - user navigates via thumbnails */}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">{images.length} Photos</span>
              {images.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadAll}
                  className="text-zinc-300 hover:text-white hover:bg-zinc-800 text-sm"
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
                    index === currentIndex ? "border-white" : "border-transparent hover:border-zinc-600"
                  }`}
                >
                  <img
                    src={image.image_url}
                    alt={image.alt_text || `Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 5 && images.length > 6 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-semibold">+{images.length - 6}</span>
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
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none" aria-describedby={undefined}>
          <VisuallyHidden.Root>
            <DialogTitle>Image Gallery - {projectName}</DialogTitle>
          </VisuallyHidden.Root>
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            <img
              src={images[currentIndex].image_url}
              alt={images[currentIndex].alt_text || "Project image"}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Navigation arrows hidden in fullscreen too */}

            {/* Download button in fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10"
              onClick={() => handleDownload(images[currentIndex].image_url, currentIndex)}
            >
              <Download className="w-5 h-5" />
            </Button>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageCarousel;