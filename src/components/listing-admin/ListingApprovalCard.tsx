import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  const images = project.image_urls?.filter(url => url && !url.includes('logo')) || [];

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

  return (
    <Card className="bg-white border-zinc-200 shadow-md overflow-hidden">
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="relative h-48 bg-zinc-100">
          <img
            src={images[currentImageIndex]}
            alt={`${project.name} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          
          {/* Image navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              {/* Image counter */}
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
          
          {/* Status badges */}
          <div className="absolute top-2 left-2 flex gap-2">
            {project.status_label && (
              <Badge className="bg-gold text-black font-medium">
                {project.status_label}
              </Badge>
            )}
            {project.property_type_label && (
              <Badge variant="secondary" className="bg-white/90 text-zinc-800">
                {project.property_type_label}
              </Badge>
            )}
          </div>
        </div>
      )}

      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-zinc-900 flex items-start justify-between gap-2">
          <span className="line-clamp-2">{project.name || "Untitled Project"}</span>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-1 hover:bg-zinc-100 rounded"
            >
              <ExternalLink className="w-4 h-4 text-zinc-400" />
            </a>
          )}
        </CardTitle>
        {sourceName && (
          <p className="text-xs text-zinc-500">Source: {sourceName}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Project details grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {project.developer_name && (
            <div className="flex items-center gap-2 text-zinc-700">
              <Building2 className="w-4 h-4 text-zinc-400" />
              <span className="truncate">{project.developer_name}</span>
            </div>
          )}
          
          {project.location && (
            <div className="flex items-center gap-2 text-zinc-700">
              <MapPin className="w-4 h-4 text-zinc-400" />
              <span className="truncate">{project.location}</span>
            </div>
          )}
          
          {(project.price_from || project.price_text) && (
            <div className="flex items-center gap-2 text-zinc-700">
              <DollarSign className="w-4 h-4 text-zinc-400" />
              <span className="truncate font-medium text-gold">
                {project.price_from ? formatPrice(project.price_from) : project.price_text}
              </span>
            </div>
          )}
          
          {project.bedrooms && (
            <div className="flex items-center gap-2 text-zinc-700">
              <Bed className="w-4 h-4 text-zinc-400" />
              <span className="truncate">{project.bedrooms}</span>
            </div>
          )}
          
          {project.handover_display && (
            <div className="flex items-center gap-2 text-zinc-700 col-span-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Check className="h-4 w-4 mr-1" />
            Approve & Publish
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
