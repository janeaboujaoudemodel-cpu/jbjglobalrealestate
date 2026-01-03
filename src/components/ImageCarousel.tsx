import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

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
          
          {/* Overlay Controls */}
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10"
              onClick={() => handleDownload(images[currentIndex].image_url, currentIndex)}
              title="Download this image"
            >
              <Download className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10"
              onClick={() => setIsFullscreen(true)}
              title="View fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10"
              onClick={goToNext}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}

        {/* Dots */}
        {images.length > 1 && images.length <= 10 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-gold" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">{images.length} Photos</span>
              {images.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadAll}
                  className="text-gold hover:text-gold-light hover:bg-gold/10 text-sm"
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
                    index === currentIndex ? "border-gold" : "border-transparent hover:border-gold/50"
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
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
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

            {/* Navigation in fullscreen */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

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