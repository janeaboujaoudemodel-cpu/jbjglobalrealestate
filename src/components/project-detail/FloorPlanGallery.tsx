import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Layers, ChevronLeft, ChevronRight, AlertCircle, Mail } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { cn } from "@/lib/utils";

interface FloorPlanType {
  label: string;
  pdfUrl?: string;
  imageUrl?: string;
}

interface FloorPlanDocument {
  id: string;
  type: string;
  url: string;
  name?: string | null;
}

interface FloorPlanGalleryProps {
  floorPlanTypes?: FloorPlanType[] | null;
  floorPlanDocs?: FloorPlanDocument[];
  projectName: string;
  onDownload: (type: "floor_plan", url?: string) => void;
  brochureUrl?: string;
  onDownloadBrochure?: (url: string) => void;
  onRequestFloorPlans?: () => void;
}

/**
 * Enhanced floor plan gallery with type tabs and image previews.
 * Floor plan section with bedroom type buttons and download capability.
 */
export function FloorPlanGallery({ 
  floorPlanTypes, 
  floorPlanDocs, 
  projectName,
  onDownload,
  brochureUrl,
  onDownloadBrochure,
  onRequestFloorPlans,
}: FloorPlanGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  
  // Combine floor plan types and documents into a unified list
  const floorPlans = [
    ...(floorPlanTypes || []).map((fp, idx) => ({
      id: `type-${idx}`,
      label: fp.label,
      pdfUrl: fp.pdfUrl,
      imageUrl: fp.imageUrl,
    })),
    ...(floorPlanDocs || []).map((doc) => ({
      id: doc.id,
      label: doc.name || "Floor Plan",
      pdfUrl: doc.url,
      imageUrl: undefined,
    })),
  ];

  // Show fallback if no floor plans at all
  if (floorPlans.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/30 rounded-xl border border-border">
        <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold text-foreground mb-2">Floor Plans Coming Soon</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Floor plans for this project are available upon request.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {brochureUrl && onDownloadBrochure ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadBrochure(brochureUrl)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Brochure
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload("floor_plan")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Request Floor Plans
            </Button>
          )}
          {onRequestFloorPlans && (
            <Button
              variant="default"
              size="sm"
              onClick={onRequestFloorPlans}
            >
              <Mail className="w-4 h-4 mr-2" />
              Request Floor Plans
            </Button>
          )}
        </div>
      </div>
    );
  }

  const activePlan = floorPlans[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : floorPlans.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < floorPlans.length - 1 ? prev + 1 : 0));
  };

  const handleImageError = (id: string) => {
    setImageError(prev => ({ ...prev, [id]: true }));
  };

  const hasImageError = activePlan ? imageError[activePlan.id] : false;

  return (
    <div className="space-y-6">
      {/* Floor Plan Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {floorPlans.map((fp, idx) => (
          <button
            key={fp.id}
            onClick={() => setActiveIndex(idx)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeIndex === idx
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card border border-border text-foreground hover:border-primary/50"
            )}
          >
            {fp.label}
          </button>
        ))}
      </div>

      {/* Floor Plan Preview Card */}
      <div className="relative rounded-xl border-2 border-primary/30 bg-card overflow-hidden">
        {/* Image preview area */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
          {activePlan?.imageUrl && !hasImageError ? (
            <SafeImage
              src={activePlan.imageUrl}
              alt={`${projectName} - ${activePlan.label}`}
              className="w-full h-full object-contain p-4"
              fallbackSrc="/placeholder.svg"
              onError={() => handleImageError(activePlan.id)}
            />
          ) : (
            <div className="text-center p-8">
              {hasImageError ? (
                <>
                  <AlertCircle className="w-16 h-16 text-amber-500/60 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm mb-2">
                    Floor plan image couldn't be loaded
                  </p>
                </>
              ) : (
                <Layers className="w-16 h-16 text-primary/40 mx-auto mb-4" />
              )}
              <p className="text-muted-foreground text-sm">
                {activePlan?.pdfUrl 
                  ? "Click download to view the floor plan PDF"
                  : brochureUrl
                    ? "Floor plans are available in the project brochure"
                    : "Floor plan preview not available"
                }
              </p>

              {!activePlan?.pdfUrl && brochureUrl && onDownloadBrochure && (
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onDownloadBrochure(brochureUrl)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Brochure
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Navigation arrows */}
          {floorPlans.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                aria-label="Previous floor plan"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                aria-label="Next floor plan"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Footer with label and download button */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{activePlan?.label}</p>
            <p className="text-xs text-muted-foreground">
              {activeIndex + 1} of {floorPlans.length} floor plans
            </p>
          </div>
          <div className="flex gap-2">
            {activePlan?.pdfUrl && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onDownload("floor_plan", activePlan.pdfUrl)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
            {onRequestFloorPlans && !activePlan?.pdfUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRequestFloorPlans}
              >
                <Mail className="w-4 h-4 mr-2" />
                Request
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Download All Button */}
      {floorPlans.filter(fp => fp.pdfUrl).length > 1 && (
        <div className="text-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              // Download the first available floor plan for now
              const firstPdf = floorPlans.find(fp => fp.pdfUrl);
              if (firstPdf?.pdfUrl) {
                onDownload("floor_plan", firstPdf.pdfUrl);
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download All Floor Plans
          </Button>
        </div>
      )}
    </div>
  );
}

export default FloorPlanGallery;
