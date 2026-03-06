import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/SafeImage";
import { Crown, ExternalLink, Pencil, MessageCircle, MapPin, Bed, Calendar, Building2, Image as ImageIcon, FileText } from "lucide-react";
import type { UnifiedProject } from "@/types/unifiedProject";
import { useNavigate } from "react-router-dom";

interface ProjectPreviewModalProps {
  project: UnifiedProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (project: UnifiedProject) => void;
  onSendToSarah?: (project: UnifiedProject) => void;
}

export function ProjectPreviewModal({ project, open, onOpenChange, onEdit, onSendToSarah }: ProjectPreviewModalProps) {
  const navigate = useNavigate();
  if (!project) return null;

  const heroImage = project.cover_image_url || project.images?.[0]?.image_url;
  const imageCount = project.images?.length ?? 0;
  const docCount = project.documents?.length ?? 0;
  const formatPrice = (price?: number | null) => {
    if (!price) return null;
    if (price >= 1000000) return `AED ${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `AED ${(price / 1000).toFixed(0)}K`;
    return `AED ${price.toLocaleString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30">
        <DialogTitle className="sr-only">{project.name} Preview</DialogTitle>
        
        {/* Hero Image */}
        <div className="relative h-64 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
          {heroImage ? (
            <SafeImage
              src={heroImage}
              alt={project.name}
              className="w-full h-full object-cover"
              fallbackSrc="/placeholder.svg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex gap-2">
            {project.is_premium && (
              <Badge className="bg-gold text-foreground text-xs font-bold gap-1">
                <Crown className="w-3 h-3" /> Premium
              </Badge>
            )}
            {project.is_sold_out && (
              <Badge variant="destructive" className="text-xs">Sold Out</Badge>
            )}
            {(project as any).construction_status && (
              <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm border-gold/30">
                {(project as any).construction_status}
              </Badge>
            )}
          </div>
          {/* Media counts */}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />{imageCount}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm flex items-center gap-1">
              <FileText className="w-3 h-3" />{docCount}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{project.name}</h2>
            <p className="text-sm text-muted-foreground">{project.developer?.name || (project as any).developer_name || "Unknown Developer"}</p>
          </div>

          {/* Quick facts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {project.price_from && (
              <div className="bg-background/60 rounded-lg p-3 text-center border border-gold/20">
                <p className="text-xs text-muted-foreground">Starting Price</p>
                <p className="text-sm font-bold text-gold">{formatPrice(project.price_from)}</p>
              </div>
            )}
            {(project.bedrooms_min || project.bedrooms_max) && (
              <div className="bg-background/60 rounded-lg p-3 text-center border border-gold/20">
                <p className="text-xs text-muted-foreground">Bedrooms</p>
                <p className="text-sm font-bold text-foreground flex items-center justify-center gap-1">
                  <Bed className="w-3.5 h-3.5" />
                  {project.bedrooms_min}{project.bedrooms_max && project.bedrooms_max !== project.bedrooms_min ? ` - ${project.bedrooms_max}` : ""}
                </p>
              </div>
            )}
            {project.handover_date && (
              <div className="bg-background/60 rounded-lg p-3 text-center border border-gold/20">
                <p className="text-xs text-muted-foreground">Handover</p>
                <p className="text-sm font-bold text-foreground flex items-center justify-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />{project.handover_date}
                </p>
              </div>
            )}
            {project.location && (
              <div className="bg-background/60 rounded-lg p-3 text-center border border-gold/20">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-bold text-foreground flex items-center justify-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />{project.location.split(",")[0]}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gold/20">
            <Button
              variant="primary"
              onClick={() => { onOpenChange(false); navigate(`/project/${project.slug}`); }}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Full Listing
            </Button>
            <Button
              variant="secondary"
              onClick={() => { onOpenChange(false); onEdit(project); }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            {onSendToSarah && (
              <Button
                variant="secondary"
                onClick={() => { onOpenChange(false); onSendToSarah(project); }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send to Sarah
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
