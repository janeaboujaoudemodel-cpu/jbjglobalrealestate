import { useMemo, useState, type MouseEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, Mail, Phone, MessageCircle, Bed, AlertTriangle, RefreshCw } from "lucide-react";
import { CONTACT_INFO, getCallUrl, getWhatsAppUrl } from "@/constants/stats";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PendingImportCardImage = {
  url: string;
  alt?: string;
};

type PendingImportCardDocument = {
  url: string;
  type: string;
  name?: string;
};

type PendingImportCardItem = {
  id: string;
  name: string;
  developer_name: string | null;
  location: string | null;
  description: string | null;
  price_from: number | null;
  handover_date: string | null;
  payment_plan: string | null;
  property_type_label: string | null;
  status_label: string | null;
  images: PendingImportCardImage[];
  documents: PendingImportCardDocument[];
  is_new_project: boolean;
  source_url: string | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  review_notes?: string | null;
};

interface PendingImportCardProps {
  item: PendingImportCardItem;
  formatPrice: (price: number | null) => string | null;
  onReview: () => void;
  onRepaired?: () => void;
}

const truncate = (text: string, max = 120) => {
  if (text.length <= max) return text;
  return text.slice(0, max).trim();
};

export function PendingImportCard({ item, formatPrice, onReview, onRepaired }: PendingImportCardProps) {
  const images = useMemo(() => (item.images || []).filter((i) => !!i?.url), [item.images]);
  const documents = useMemo(() => (item.documents || []).filter((d) => !!d?.url), [item.documents]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isRepairing, setIsRepairing] = useState(false);

  const activeImage = images[currentImageIndex] || images[0];
  const hasMultipleImages = images.length > 1;

  // Determine if extraction is incomplete
  const isIncomplete = Boolean(
    item.review_notes?.includes("INCOMPLETE") ||
    !item.description ||
    (item.developer_name?.toLowerCase() === "unknown") ||
    images.length === 0 ||
    documents.length === 0
  );

  const handleCardClick = () => {
    onReview();
  };

  const handlePrev = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleRepair = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRepairing(true);
    try {
      const { data, error } = await supabase.functions.invoke("repair-project-extraction", {
        body: { pendingImportId: item.id },
      });
      if (error) throw error;
      toast.success(`Repaired: ${item.name} (${data.images} images, ${data.documents} docs)`);
      onRepaired?.();
    } catch (err) {
      toast.error(`Repair failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsRepairing(false);
    }
  };

  const hasDescription = !!item.description?.trim();
  const truncatedDescription = item.description ? truncate(item.description, 120) : null;
  const showMore = !!item.description && item.description.length > 120;

  const paymentPlanLabel = item.payment_plan?.trim() || null;
  const emailSubject = encodeURIComponent(`Inquiry: ${item.name}`);
  const emailBody = encodeURIComponent(
    `Hello ${CONTACT_INFO.companyDescriptor},\n\nI'm interested in ${item.name}.\n\nProject link: ${item.source_url || ""}\n\nThanks,`
  );
  const mailtoHref = `mailto:${CONTACT_INFO.email}?subject=${emailSubject}&body=${emailBody}`;
  const callHref = getCallUrl();
  const whatsappHref = getWhatsAppUrl(`Hi, I'm interested in ${item.name}.`);

  return (
    <Card
      className={`overflow-hidden cursor-pointer border-2 ${isIncomplete ? "border-amber-500" : "border-gold"} bg-card shadow-[0_4px_20px_rgba(200,167,102,0.25)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(200,167,102,0.4)] hover:scale-[1.02] hover:-translate-y-2`}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
      onClick={handleCardClick}
    >
      {/* Incomplete badge */}
      {isIncomplete && (
        <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1 flex items-center gap-1 justify-center">
          <AlertTriangle className="w-3 h-3" />
          Incomplete Extraction
        </div>
      )}

      {/* Image Preview */}
      <div className="relative h-56 bg-muted">
        {activeImage?.url ? (
          <img
            src={activeImage.url}
            alt={activeImage.alt || item.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Media pending verification</span>
          </div>
        )}

        {/* Navigation arrows - Elegant gold style */}
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card border border-gold/60 text-gold flex items-center justify-center shadow-md hover:bg-gold hover:text-foreground hover:border-gold transition-all duration-200 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card border border-gold/60 text-gold flex items-center justify-center shadow-md hover:bg-gold hover:text-foreground hover:border-gold transition-all duration-200 z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Image dots indicator (no photo icon / no count) */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    idx === currentImageIndex ? "bg-overlay" : "bg-overlay/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Overlays */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.property_type_label && (
            <div className="rounded bg-foreground/80 text-background px-2.5 py-1 text-[11px] font-medium leading-none backdrop-blur">
              {item.property_type_label}
            </div>
          )}
        </div>

        {item.status_label && (
          <div className="absolute top-2 right-2 rounded bg-background/90 text-foreground border border-border px-2.5 py-1 text-[11px] font-medium leading-none backdrop-blur">
            {item.status_label}
          </div>
        )}

        {paymentPlanLabel && (
          <div className="absolute bottom-2 left-2 rounded bg-secondary/90 text-secondary-foreground border border-border px-2.5 py-1 text-[11px] font-medium leading-none backdrop-blur">
            {paymentPlanLabel}
          </div>
        )}

        {item.handover_date && (
          <div className="absolute bottom-2 right-2 rounded bg-handover text-handover-foreground px-2.5 py-1 text-[11px] font-bold leading-none shadow">
            {item.handover_date}
          </div>
        )}
      </div>

      <CardContent className="p-5 flex flex-col min-h-[240px]">
        {/* Title - 2 lines for full readability */}
        <h3 className="font-semibold text-foreground text-base mb-1 line-clamp-2 min-h-[48px]">{item.name}</h3>

        {/* Developer - fixed height */}
        <div className="h-5 mb-2">
          {item.developer_name && <p className="text-sm text-gold truncate">by {item.developer_name}</p>}
        </div>

        {/* Location & Bedrooms - fixed height */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 h-5">
          {item.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{item.location}</span>
            </span>
          )}
          {(item.bedrooms_min !== null || item.bedrooms_max !== null) && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <Bed className="h-3.5 w-3.5" />
              {item.bedrooms_min === item.bedrooms_max
                ? item.bedrooms_min === 0 ? "Studio" : `${item.bedrooms_min} BR`
                : `${item.bedrooms_min === 0 ? "Studio" : item.bedrooms_min}-${item.bedrooms_max} BR`}
            </span>
          )}
        </div>

        {/* Description - fixed height with line clamp */}
        <div className="h-[60px] mb-3">
          {hasDescription ? (
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
              {truncatedDescription}
              {showMore && (
                <button
                  type="button"
                  className="text-gold font-medium hover:underline ml-1"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onReview();
                  }}
                >
                  ...more
                </button>
              )}
            </p>
          ) : (
            <p className="text-muted-foreground/50 text-sm italic">No description available</p>
          )}
        </div>

        {/* Price - consistent spacing */}
        <div className="text-sm mb-4">
          <span className="text-muted-foreground">From </span>
          {item.price_from ? (
            <span className="font-semibold text-foreground">{formatPrice(item.price_from)}</span>
          ) : (
            <span className="font-semibold text-handover">TBA</span>
          )}
        </div>

        {/* Premium action bar - pushed to bottom */}
        <div className="mt-auto pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-border hover:border-primary hover:bg-primary/10 transition-all"
                aria-label="Email"
                asChild
              >
                <a
                  href={mailtoHref}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-border hover:border-primary hover:bg-primary/10 transition-all"
                aria-label="Call"
                asChild
              >
                <a
                  href={callHref}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-border hover:border-primary hover:bg-primary/10 transition-all"
                aria-label="WhatsApp"
                asChild
              >
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Repair button for incomplete items */}
            {isIncomplete && (
              <Button
                variant="secondary"
                size="sm"
                disabled={isRepairing}
                onClick={handleRepair}
                className="gap-1 px-3 font-medium border border-amber-400 text-amber-700 hover:bg-amber-50"
              >
                {isRepairing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Repair
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onReview();
              }}
              className="gap-2 px-4 font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              Review
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
