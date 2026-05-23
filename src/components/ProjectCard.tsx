import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link, useLocation } from "react-router-dom";
import type { Project } from "@/hooks/useProjects";
import FavoriteButton from "./FavoriteButton";
import ShortlistBadgeButton from "./ShortlistBadgeButton";
import { ChevronLeft, ChevronRight, MapPin, Mail, Phone, MessageCircle, Calendar } from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { VerifiedMedia } from "@/components/ui/verified-media";
import { Button } from "@/components/ui/button";
import { DeveloperLink } from "@/components/ui/developer-link";
import { sanitizeForDisplay } from "@/utils/contentSanitizer";
import { deriveHandover, HANDOVER_FALLBACK } from "@/utils/handoverDerivation";
import { CardBadge, resolveSaleStatusLabel } from "@/components/ui/card-badge";
import { useUserRole } from "@/hooks/useUserRole";

interface ProjectCardProps {
  project: Project & { is_sold_out?: boolean | null };
  showFavorite?: boolean;
  showBadgeButton?: boolean;
  currency?: 'AED' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'SAR' | 'CNY' | 'RUB' | 'CAD' | 'AUD';
  sizeUnit?: 'sqft' | 'sqm';
}

// Currency conversion rates - 10 unified currencies
const CURRENCY_RATES: Record<string, number> = {
  AED: 1,
  USD: 0.27,
  EUR: 0.25,
  GBP: 0.21,
  INR: 22.5,
  SAR: 1.02,
  CNY: 1.98,
  RUB: 24.5,
  CAD: 0.37,
  AUD: 0.42,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: 'AED',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  SAR: 'SAR',
  CNY: '¥',
  RUB: '₽',
  CAD: 'C$',
  AUD: 'A$',
};

// Helper to format price with currency conversion
const formatPriceWithCurrency = (price: number, currency: string = 'AED'): string => {
  const converted = Math.round(Math.round(price) * CURRENCY_RATES[currency]);
  const symbol = CURRENCY_SYMBOLS[currency];
  if (converted >= 1000000) {
    const millions = converted / 1000000;
    const formatted = millions % 1 === 0 ? `${millions}` : `${millions.toFixed(1)}`;
    return `${symbol} ${formatted}M`;
  }
  if (converted >= 1000) {
    return `${symbol} ${Math.round(converted / 1000)}K`;
  }
  return `${symbol} ${converted.toLocaleString('en-US')}`;
};

// Projects that should show "New" status label (only these specific ones)
const PROJECTS_WITH_NEW_STATUS = [
  'sobha sanctuary',
  'mercedes-benz by binghatti',
  'mercedes-benz places by binghatti'
];

const shouldShowNewStatus = (projectName: string): boolean => {
  const normalized = projectName.toLowerCase().trim();
  return PROJECTS_WITH_NEW_STATUS.some(p => normalized.includes(p) || p.includes(normalized));
};

// Sale status label resolver — visual style is owned by <CardBadge variant="status" />.
const getSaleStatusLabel = resolveSaleStatusLabel;

const ProjectCard = ({ project, showFavorite = true, showBadgeButton = true, currency = 'AED', sizeUnit = 'sqft' }: ProjectCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { isOwner } = useUserRole();
  const { pathname } = useLocation();
  const isHomepage = pathname === "/";
  const images = project.images || [];
  const primaryImageUrl = images[currentImageIndex]?.image_url || images[0]?.image_url || project.cover_image_url || null;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  const whatsappMessage = `Hello JBJ Global Real Estate,\n\nI am interested in ${project.name} located in ${project.location || 'UAE'}.\n\nPlease provide more details about this property.\n\nThank you.`;
  const whatsappHref = getWhatsAppUrl(whatsappMessage);
  const callHref = getCallUrl();

  // Get formatted bedrooms text
  const getBedroomsText = () => {
    if (!project.bedrooms_min) return null;
    if (project.bedrooms_min === project.bedrooms_max) {
      return `${project.bedrooms_min} BR`;
    }
    return `${project.bedrooms_min}-${project.bedrooms_max} BR`;
  };

  // Get unit types inline (1BR • 2BR • 3BR style)
  const getUnitTypesText = () => {
    const types: string[] = [];
    if (project.bedrooms_min === 0 || (project as any).has_studio) types.push('Studio');
    if (project.bedrooms_min && project.bedrooms_max) {
      for (let i = project.bedrooms_min; i <= Math.min(project.bedrooms_max, 5); i++) {
        if (i > 0) types.push(`${i}BR`);
      }
    }
    return types.length > 0 ? types.join(' • ') : null;
  };

  // Get size range text
  const getSizeText = () => {
    if (!project.size_min) return null;
    const min = project.size_min.toLocaleString();
    const max = project.size_max?.toLocaleString();
    if (min === max || !max) return `${min} ${sizeUnit}`;
    return `${min}-${max} ${sizeUnit}`;
  };

  // Truncate description for card preview - strip HTML + competitor refs
  const getTruncatedDescription = () => {
    if (!project.description) return null;
    let clean = sanitizeForDisplay(project.description)
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*{1,3}/g, '')
      .replace(/project\s*general\s*facts/gi, '')
      .trim();
    const maxLength = 80;
    if (clean.length <= maxLength) return clean;
    return clean.substring(0, maxLength).trim();
  };

  // Determine if we should show status label (from source data)
  const getStatusLabel = () => {
    // Only show "New" for specific projects
    if (shouldShowNewStatus(project.name)) {
      return "New";
    }
    // Show other status labels from source (Future Launch, New Phase, etc.)
    if (project.status_label && project.status_label !== "New") {
      return project.status_label;
    }
    return null;
  };

  const statusLabel = getStatusLabel();
  const saleStatusLabel = getSaleStatusLabel(project.status_label);
  const badgePosition = 'top-3 left-3';

  return (
    <div
      data-surface="champagne"
      className={
        "group relative overflow-hidden rounded-2xl border border-[#B89555]/60 transition-all duration-300 flex flex-col " +
        "bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))] " +
        "shadow-[0_0_18px_hsl(var(--gold)/0.14),0_18px_55px_hsl(0_0%_0%/0.16)] hover:border-[#B89555] " +
        "hover:shadow-[0_0_26px_hsl(var(--gold)/0.18),0_26px_75px_hsl(0_0%_0%/0.20)]"
      }
    >
      {/* Top-Right: Favorite + Shortlist Buttons (stacked) — Always visible */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200" data-no-contrast-guard>
        {showFavorite && (
          <div>
            <FavoriteButton projectId={project.id} size="sm" />
          </div>
        )}
        {showBadgeButton && (
          <div>
            <ShortlistBadgeButton projectId={project.id} size="sm" showBadgeIndicator={true} />
          </div>
        )}
      </div>

      <Link to={`/project/${project.slug}`} className="flex-1 flex flex-col">
        {/* Image with Carousel — 16:10 landscape */}
        <div className="aspect-[16/10] overflow-hidden relative" data-surface="ink">
          <VerifiedMedia
            src={primaryImageUrl}
            alt={images[currentImageIndex]?.alt_text || project.name}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            placeholderLabel=""
            loggerComponent="ProjectCard"
            loggerContext={{
              projectId: project.id,
              slug: project.slug,
              name: project.name,
              imageIndex: currentImageIndex,
            }}
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                aria-label="Previous image"
                data-no-contrast-guard
                className={
                  "absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full z-10 flex items-center justify-center transition-all " +
                  "bg-[#FDFBF7] border border-[#B89555] !text-[#1A1A1A] " +
                  "shadow-[0_10px_24px_hsl(0_0%_0%/0.20),inset_0_1px_0_hsl(0_0%_100%/0.55)] " +
                  "hover:bg-[#B89555] hover:!text-[#FFFFFF]"
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextImage}
                aria-label="Next image"
                data-no-contrast-guard
                className={
                  "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full z-10 flex items-center justify-center transition-all " +
                  "bg-[#FDFBF7] border border-[#B89555] text-[#1A1A1A] " +
                  "shadow-[0_10px_24px_hsl(0_0%_0%/0.20),inset_0_1px_0_hsl(0_0%_100%/0.55)] " +
                  "hover:bg-[#B89555] hover:text-[#FFFFFF]"
                }
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Image Dots Indicator */}
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.slice(0, 5).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      idx === currentImageIndex
                        ? 'bg-[#B89555] shadow-[0_0_10px_hsl(var(--gold)/0.55)]'
                        : 'bg-[#FDFBF7]/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Top-Left: Property Type Label */}
          {project.property_type_label && (
            <CardBadge variant="status" className="absolute top-3 left-3 z-10">
              {project.property_type_label}
            </CardBadge>
          )}

          {/* Sale Status Badge — Bottom Left */}
          {saleStatusLabel && !project.is_sold_out && !project.status_label?.toLowerCase().includes('sold') && (
            <CardBadge variant="status" className="absolute bottom-3 left-3 z-10">
              {saleStatusLabel}
            </CardBadge>
          )}

          {/* Bottom-Right: Price label — shown over image ONLY on homepage; on other pages it moves next to the Ready/handover row */}
          {project.price_from && isHomepage ? (
            <div className="absolute bottom-3 right-3 z-10 price-pill-premium" data-price-badge>
              <span className="price-pill-eyebrow">From</span>
              <span className="price-pill-value">
                {formatPriceWithCurrency(project.price_from, currency)}
              </span>
            </div>
          ) : null}

          {/* Sold Out Badge */}
          {(project.is_sold_out || project.status_label?.toLowerCase().includes('sold')) && (
            <CardBadge variant="sold" className={`absolute ${badgePosition} z-10`}>
              Sold Out
            </CardBadge>
          )}
        </div>


        {/* Content — consistent 4px-grid spacing */}
        <div className="p-4 flex-1 flex flex-col gap-3">
          {/* Header block — title + location, ink-solid */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-[#1A1A1A] text-lg font-bold break-words leading-tight line-clamp-2 group-hover:text-[#B89555] transition-colors">
              {project.name}
            </h4>
            {project.location && (
              <div className="flex items-center gap-1.5 text-[#1A1A1A] text-sm font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#B89555] flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{project.location}</span>
              </div>
            )}
          </div>

          {/* Premium gold divider — between header and developer/meta */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#B89555]/60 to-transparent" />

          {/* Detail metadata above developer name */}
          <div className="flex flex-col gap-2">
            {/* Payment Plan removed from cards — shown only on details page */}

            {(getUnitTypesText() || getSizeText()) && (
              <div className="flex items-center gap-2 text-[#1A1A1A] text-xs flex-wrap font-medium">
                {getUnitTypesText() && (
                  <span className="font-semibold">{getUnitTypesText()}</span>
                )}
                {getUnitTypesText() && getSizeText() && (
                  <span className="text-[#B89555]" aria-hidden="true">|</span>
                )}
                {getSizeText() && <span>{getSizeText()}</span>}
              </div>
            )}
          </div>

          {project.developer && (
            <DeveloperLink
              name={project.developer.name}
              slug={project.developer.slug}
              className="text-sm block"
              showPrefix={true}
            />
          )}

          {/* Description */}
          <p className="text-[#1A1A1A] text-sm leading-relaxed line-clamp-3 overflow-hidden">

            {getTruncatedDescription() || "Discover this exceptional property opportunity..."}
            <span className="text-[#B89555] font-bold hover:text-[#1A1A1A] cursor-pointer ml-1">
              ...more
            </span>
          </p>

          {/* Premium full-width divider — directly after developer name, before handover */}
          <div className="w-full border-t border-[#B89555]/45" />

          {/* Spacer pushes handover row to the very bottom */}
          <div className="flex-1" />

          {/* Bottom row — Price (left) parallel to Handover/Ready (right). Price hidden here on homepage (lives on the image). */}
          <div className="flex items-center justify-between gap-2">
            {!isHomepage && project.price_from ? (
              <div className="price-pill-premium" data-price-badge>
                <span className="price-pill-eyebrow">From</span>
                <span className="price-pill-value">
                  {formatPriceWithCurrency(project.price_from, currency)}
                </span>
              </div>
            ) : (
              <span aria-hidden="true" />
            )}
            <span
              data-no-contrast-guard
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FDFBF7] border border-[#B89555]/40 shadow-sm text-[#1A1A1A] text-xs font-semibold tabular-nums handover-orange"
            >
              <Calendar className="w-3 h-3 text-[#B89555]" aria-hidden="true" />
              {deriveHandover(project) || HANDOVER_FALLBACK}
            </span>
          </div>

          {/* Owner-only diagnostic — Updated date hidden from public */}
          {isOwner && (project as any).updated_at && (
            <div className="flex items-center justify-between gap-2 min-h-[24px]">
              <p className="text-[10px] text-[#1A1A1A]/70 font-medium">
                Updated {formatDistanceToNow(new Date((project as any).updated_at), { addSuffix: true })}
              </p>
            </div>
          )}
        </div>
      </Link>

      {/* CTA Buttons — Email, Call, WhatsApp. Solid surfaces, equal grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2 border-t border-[#B89555]/40 pt-3">
          <Button asChild variant="secondary" size="sm" className="w-full min-w-0 overflow-hidden px-2 h-9">
            <a
              href={`mailto:${CONTACT_INFO.email}?subject=Inquiry: ${encodeURIComponent(project.name)}&body=${encodeURIComponent(`Hello JBJ Global Real Estate,\n\nI am interested in ${project.name}${project.location ? ` located in ${project.location}` : ''}.\n\nPlease provide more details.\n\nThank you.`)}`}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Email about ${project.name}`}
              className="flex items-center justify-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate text-xs font-semibold">Email</span>
            </a>
          </Button>
          <Button asChild variant="secondary" size="sm" className="w-full min-w-0 overflow-hidden px-2 h-9">
            <a href={callHref} onClick={(e) => e.stopPropagation()} aria-label={`Call about ${project.name}`} className="flex items-center justify-center gap-1.5">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate text-xs font-semibold">Call</span>
            </a>
          </Button>
          <Button asChild variant="secondary" size="sm" className="w-full min-w-0 overflow-hidden px-2 h-9">
            <a href={whatsappHref} onClick={(e) => e.stopPropagation()} aria-label={`WhatsApp about ${project.name}`} className="flex items-center justify-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate text-xs font-semibold">Chat</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
