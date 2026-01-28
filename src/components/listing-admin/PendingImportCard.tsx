import { useMemo, useState, type MouseEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, Mail, Phone, MessageCircle } from "lucide-react";
import { CONTACT_INFO, getCallUrl, getWhatsAppUrl } from "@/constants/stats";

type PendingImportCardImage = {
  url: string;
  alt?: string;
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
  documents: unknown[];
  is_new_project: boolean;
  source_url: string | null;
};

interface PendingImportCardProps {
  item: PendingImportCardItem;
  formatPrice: (price: number | null) => string | null;
  onReview: () => void;
}

const truncate = (text: string, max = 120) => {
  if (text.length <= max) return text;
  return text.slice(0, max).trim();
};

export function PendingImportCard({ item, formatPrice, onReview }: PendingImportCardProps) {
  const images = useMemo(() => (item.images || []).filter((i) => !!i?.url), [item.images]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const activeImage = images[currentImageIndex] || images[0];
  const hasMultipleImages = images.length > 1;

  const openSource = () => {
    if (item.source_url) {
      window.open(item.source_url, "_blank", "noopener,noreferrer");
      return true;
    }
    return false;
  };

  const handleCardClick = () => {
    // In admin, clicking the card should open the project page (source) — not the photo modal.
    if (!openSource()) {
      onReview();
    }
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

  const hasDescription = !!item.description?.trim();
  const truncatedDescription = item.description ? truncate(item.description, 120) : null;
  const showMore = !!item.description && item.description.length > 120;

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-border"
      onClick={handleCardClick}
    >
      {/* Image Preview (Provident-style arrows on-card) */}
      <div className="relative h-48 bg-muted">
        {activeImage?.url ? (
          <img
            src={activeImage.url}
            alt={activeImage.alt || item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Media pending verification</span>
          </div>
        )}

        {/* Navigation arrows (always visible; fixed position) */}
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-overlay/95 hover:bg-overlay text-overlay-foreground flex items-center justify-center shadow-md transition-all z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-overlay/95 hover:bg-overlay text-overlay-foreground flex items-center justify-center shadow-md transition-all z-10"
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

          {/* Admin-only indicator (avoid confusion with Provident 'New' status) */}
          <div className="flex gap-2">
            <Badge variant="secondary">{item.is_new_project ? "New Import" : "Update"}</Badge>
          </div>
        </div>

        {item.status_label && (
          <div className="absolute top-2 right-2 rounded bg-background/90 text-foreground border border-border px-2.5 py-1 text-[11px] font-medium leading-none backdrop-blur">
            {item.status_label}
          </div>
        )}

        {item.payment_plan && (
          <div className="absolute bottom-2 left-2 rounded bg-secondary/90 text-secondary-foreground border border-border px-2.5 py-1 text-[11px] font-medium leading-none backdrop-blur">
            {item.payment_plan}
          </div>
        )}

        {item.handover_date && (
          <div className="absolute bottom-2 right-2 rounded bg-handover text-handover-foreground px-2.5 py-1 text-[11px] font-bold leading-none shadow">
            {item.handover_date}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-muted-foreground mb-1 line-clamp-1">{item.name}</h3>

        {item.developer_name && <p className="text-sm text-gold mb-2">by {item.developer_name}</p>}

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
          {item.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {item.location}
            </span>
          )}
        </div>

        {/* Description preview on the card (outside) */}
        {hasDescription && (
          <p className="text-muted-foreground text-sm leading-relaxed mb-3">
            {truncatedDescription}
            {showMore && (
              <button
                type="button"
                className="text-primary hover:underline ml-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!openSource()) onReview();
                }}
              >
                ...more
              </button>
            )}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="text-sm">
              <span className="text-foreground">From </span>
              {item.price_from ? (
                <span className="font-medium text-foreground">{formatPrice(item.price_from)}</span>
              ) : (
                <span className="font-semibold text-handover">TBA</span>
              )}
            </div>

            {/* Contact shortcuts (Email / Call / WhatsApp) */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="Email"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const subject = encodeURIComponent(`Inquiry: ${item.name}`);
                  const body = encodeURIComponent(
                    `Hello ${CONTACT_INFO.companyDescriptor},\n\nI'm interested in ${item.name}.\n\nProject link: ${item.source_url || ""}\n\nThanks,`
                  );
                  window.location.href = `mailto:${CONTACT_INFO.email}?subject=${subject}&body=${body}`;
                }}
              >
                <Mail className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="Call"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = getCallUrl();
                }}
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="WhatsApp"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const url = getWhatsAppUrl(`Hi, I'm interested in ${item.name}.`);
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onReview();
            }}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
