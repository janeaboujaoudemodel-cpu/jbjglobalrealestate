import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SafeImage } from "@/components/SafeImage";
import { 
  Check, 
  X, 
  ExternalLink, 
  Building2, 
  MapPin, 
  DollarSign, 
  Bed, 
  Calendar,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export interface ExtractedProject {
  name: string;
  developer_name?: string;
  location?: string;
  url?: string;
  image_urls?: string[];
  bedrooms?: string;
  price_text?: string;
  price_from?: number;
  handover_display?: string;
  handover_date?: string;
  property_type_label?: string;
  status_label?: string;
}

interface ListingApprovalCardProps {
  project: ExtractedProject;
  sourceName?: string;
  sourceUrl?: string;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export function ListingApprovalCard({ 
  project, 
  sourceName,
  sourceUrl,
  onApprove, 
  onReject,
  isProcessing 
}: ListingApprovalCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // CRITICAL: Filter out brochure/document images from gallery
  const excludePattern = /(brochure|payment[-_]?plan|floor[-_]?plan|master[-_]?plan|pdf|document|General_Brochure|logo)/i;
  const images = project.image_urls?.filter(url => url && !excludePattern.test(url)) || [];

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `AED ${(price / 1000000).toFixed(2)}M`;
    }
    return `AED ${(price / 1000).toFixed(0)}K`;
  };

  // Get handover display value
  const handoverValue = project.handover_display || project.handover_date;
  
  // Only show status label for specific projects (Sobha Sanctuary, Mercedes-Benz) or non-"New" labels
  const shouldShowStatus = () => {
    const projectName = project.name?.toLowerCase() || '';
    const isSpecialProject = ['sobha sanctuary', 'mercedes-benz by binghatti', 'mercedes-benz places'].some(p => projectName.includes(p));
    if (isSpecialProject && project.status_label) return true;
    if (project.status_label && project.status_label.toLowerCase() !== 'new') return true;
    return false;
  };

  return (
    <Card className="bg-[#FDFBF7] border-[#B89555]/30 shadow-md overflow-hidden">
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="relative h-48 bg-[#F7F2EA]">
          <SafeImage
            src={images[currentImageIndex]}
            alt={`${project.name} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
            fallbackSrc="/placeholder.svg"
          />
          
          {/* Navigation arrows - Always visible with gold border */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#FDFBF7] border-2 border-[#B89555] hover:bg-[#EFE6D6]/10 text-[#1A1A1A]/70 flex items-center justify-center shadow-lg transition-all z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#FDFBF7] border-2 border-[#B89555] hover:bg-[#EFE6D6]/10 text-[#1A1A1A]/70 flex items-center justify-center shadow-lg transition-all z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              {/* Image dots indicator */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1">
                {images.slice(0, 5).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
 idx === currentImageIndex ? 'bg-[#FDFBF7]' : 'bg-[#FDFBF7]/50'
 }`}
                  />
                ))}
                {images.length > 5 && (
                  <span className="text-white text-[10px] ml-1">+{images.length - 5}</span>
                )}
              </div>
            </>
          )}
          
          {/* Property Type - Top Left (dark) */}
          {project.property_type_label && (
            <div className="absolute top-2 left-2 bg-[#1A1A1A]/90 text-white px-2.5 py-1 rounded text-xs font-medium">
              {project.property_type_label}
            </div>
          )}
          
          {/* Status - Top Right (only show if valid) */}
          {shouldShowStatus() && project.status_label && (
            <div className="absolute top-2 right-2 bg-[#FDFBF7] text-[#1A1A1A] px-2.5 py-1 rounded text-xs font-medium border border-[#B89555]/30">
              {project.status_label}
            </div>
          )}
          
          {/* Handover - Bottom Right (ORANGE) */}
          {handoverValue && (
            <div className="absolute bottom-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold">
              {handoverValue}
            </div>
          )}
        </div>
      )}

      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[#1A1A1A]/70 flex items-start justify-between gap-2">
          <span className="line-clamp-2">{project.name || "Untitled Project"}</span>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-1 hover:bg-[#F7F2EA] rounded"
            >
              <ExternalLink className="w-4 h-4 text-[#1A1A1A]/70" />
            </a>
          )}
        </CardTitle>
        {sourceName && (
          <p className="text-xs text-[#1A1A1A]/70">Source: {sourceName}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Project details grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {project.developer_name && (
            <div className="flex items-center gap-2 text-[#1A1A1A]/70">
              <Building2 className="w-4 h-4 text-[#1A1A1A]/70" />
              <span data-developer-name className="min-w-0 whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">{project.developer_name}</span>
            </div>
          )}
          
          {project.location && (
            <div className="flex items-center gap-2 text-[#1A1A1A]/70">
              <MapPin className="w-4 h-4 text-[#1A1A1A]/70" />
              <span className="truncate">{project.location}</span>
            </div>
          )}
          
          {(project.price_from || project.price_text) && (
            <div className="flex items-center gap-2 text-[#1A1A1A]/70">
              <DollarSign className="w-4 h-4 text-[#1A1A1A]/70" />
              <span className="truncate font-medium text-[#1A1A1A]">
                {project.price_from ? formatPrice(project.price_from) : project.price_text}
              </span>
            </div>
          )}
          
          {project.bedrooms && (
            <div className="flex items-center gap-2 text-[#1A1A1A]/70">
              <Bed className="w-4 h-4 text-[#1A1A1A]/70" />
              <span className="truncate">{project.bedrooms}</span>
            </div>
          )}
          
          {project.handover_display && (
            <div className="flex items-center gap-2 text-[#1A1A1A]/70 col-span-2">
              <Calendar className="w-4 h-4 text-[#1A1A1A]/70" />
              <span className="truncate">Handover: {project.handover_display}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Action buttons */}
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            disabled={isProcessing}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            onClick={onApprove}
            disabled={isProcessing}
            className="jj-surface-emerald hover:jj-surface-emerald text-white"
          >
            <Check className="h-4 w-4 mr-1" />
            Approve & Publish
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
