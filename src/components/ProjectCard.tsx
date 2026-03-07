import { useState } from "react";
import { Link } from "react-router-dom";
import type { Project } from "@/hooks/useProjects";
import FavoriteButton from "./FavoriteButton";
import ShortlistBadgeButton from "./ShortlistBadgeButton";
import { ChevronLeft, ChevronRight, MapPin, Bed, Mail, Phone, MessageCircle, Building2, ArrowUpRight, CreditCard } from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { SafeImage } from "@/components/SafeImage";
import { VerifiedMedia } from "@/components/ui/verified-media";
import { Button } from "@/components/ui/button";
import { DeveloperLink } from "@/components/ui/developer-link";

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

// Get sale status badge styling
const getSaleStatusBadge = (status?: string | null) => {
  if (!status) return null;
  
  const normalizedStatus = status.toLowerCase();
  
  if (normalizedStatus.includes('on sale') || normalizedStatus.includes('start')) {
    return { label: 'On Sale', className: 'bg-emerald-500 text-white' };
  }
  // "sold" / "out of stock" handled by dedicated red Sold Out badge, not here
  if (normalizedStatus.includes('announced')) {
    return { label: 'Announced', className: 'bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-[#C8A766]/40' };
  }
  if (normalizedStatus.includes('presale') || normalizedStatus.includes('eoi')) {
    return { label: 'Presale', className: 'bg-amber-500 text-black' };
  }
  
  return null;
};

const ProjectCard = ({ project, showFavorite = true, showBadgeButton = true, currency = 'AED', sizeUnit = 'sqft' }: ProjectCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = project.images || [];

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

  // Truncate description for card preview - shorter for landscape card
  const getTruncatedDescription = () => {
    if (!project.description) return null;
    // Strip "Project general facts" and markdown headers
    let clean = project.description
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
  const saleStatusBadge = getSaleStatusBadge(project.status_label);
  const hasDevLogo = !!(project.developer as any)?.logo_url;
  const badgePosition = hasDevLogo ? 'top-3 right-3' : 'top-3 left-3';

  return (
    <div
      className={
        "group relative overflow-hidden rounded-xl border-2 border-gold transition-all duration-300 flex flex-col " +
        "bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))] " +
        "shadow-[0_0_18px_hsl(var(--gold)/0.14),0_18px_55px_hsl(0_0%_0%/0.16)] hover:border-gold " +
        "hover:shadow-[0_0_26px_hsl(var(--gold)/0.18),0_26px_75px_hsl(0_0%_0%/0.20)]"
      }
    >
      {/* Top-Right: Favorite + Shortlist Buttons (stacked) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        {showFavorite && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <FavoriteButton projectId={project.id} size="sm" />
          </div>
        )}
        {showBadgeButton && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ShortlistBadgeButton projectId={project.id} size="sm" showBadgeIndicator={true} />
          </div>
        )}
      </div>

      <Link to={`/project/${project.slug}`} className="flex-1 flex flex-col">
        {/* Image with Carousel - LANDSCAPE aspect ratio (16:10 - Premium Hybrid) */}
        <div className="aspect-[16/10] overflow-hidden relative">
          {/* Developer Logo Overlay - Top Left */}
          {(project.developer as any)?.logo_url && (
            <div
              className={`absolute top-3 left-3 z-15 w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center ${
                (project.developer as any)?.logo_bg_color ? 'shadow-lg' : ''
              }`}
              style={{ backgroundColor: (project.developer as any)?.logo_bg_color || 'transparent' }}
            >
              <img 
                src={(project.developer as any).logo_url} 
                alt={project.developer?.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <VerifiedMedia
            src={images[currentImageIndex]?.image_url || images[0]?.image_url}
            alt={images[currentImageIndex]?.alt_text || project.name}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            placeholderLabel="Media pending verification"
          />
          
          {/* Navigation Arrows - Always Visible */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className={
                  "absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full z-10 flex items-center justify-center transition-all " +
                  "bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))] " +
                  "border border-gold/70 text-gold " +
                  "shadow-[0_10px_24px_hsl(0_0%_0%/0.20),inset_0_1px_0_hsl(0_0%_100%/0.55)] " +
                  "hover:bg-gold hover:text-black hover:border-gold"
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextImage}
                className={
                  "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full z-10 flex items-center justify-center transition-all " +
                  "bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))] " +
                  "border border-gold/70 text-gold " +
                  "shadow-[0_10px_24px_hsl(0_0%_0%/0.20),inset_0_1px_0_hsl(0_0%_100%/0.55)] " +
                  "hover:bg-gold hover:text-black hover:border-gold"
                }
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              {/* Image Dots Indicator - Bottom center */}
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.slice(0, 5).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      idx === currentImageIndex
                        ? 'bg-gold shadow-[0_0_10px_hsl(var(--gold)/0.55)]'
                        : 'bg-gold/35'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Top-Left: Property Type Label (if no developer logo) */}
          {project.property_type_label && !(project.developer as any)?.logo_url && (
            <div className="absolute top-3 left-3 z-10 bg-premium-bg/90 text-gold px-2 py-1 rounded text-xs font-semibold border border-gold/30">
              {project.property_type_label}
            </div>
          )}
          
          {/* Sale Status Badge - top-right when dev logo present, hides on hover to show favorite buttons */}
          {saleStatusBadge && !project.is_sold_out && !project.status_label?.toLowerCase().includes('sold') && (
            <div className={`absolute ${badgePosition} z-10 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${saleStatusBadge.className} ${hasDevLogo ? 'transition-opacity group-hover:opacity-0' : ''}`}>
              {saleStatusBadge.label}
            </div>
          )}
          
          {/* Bottom-Right: Handover Year - ORANGE */}
          {project.handover_date && (
            <div className="absolute bottom-3 right-3 z-10 bg-handover text-handover-foreground px-2.5 py-1 rounded text-xs font-bold shadow-[0_10px_25px_hsl(0_0%_0%/0.25)]">
              {project.handover_date}
            </div>
          )}
          
          {/* Sold Out Badge - Top Left (offset below developer logo if present) */}
          {(project.is_sold_out || project.status_label?.toLowerCase().includes('sold')) && (
            <div className={`absolute ${badgePosition} z-10`}>
              <div className="bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-bold uppercase shadow-lg border border-red-400">
                Sold Out
              </div>
            </div>
          )}
        </div>
        
        {/* Content - Premium Hybrid Style */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Project Name - Gold */}
          <h4 className="text-gold text-lg font-bold mb-1 break-words leading-tight line-clamp-2 group-hover:text-black transition-colors">
            {project.name}
          </h4>
          
          {/* Location with icon */}
          {project.location && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-2">
              <MapPin className="w-3.5 h-3.5 text-gold/70 flex-shrink-0" />
              <span className="truncate">{project.location}</span>
            </div>
          )}
          
          {/* Divider */}
          <div className="h-px bg-gold/20 my-2" />
          
          {/* Starting Price - Gold */}
          <p className="text-sm mb-2">
            {project.price_from ? (
              <>
                <span className="text-muted-foreground">Starting from </span>
                <span className="text-gold font-bold text-lg">
                  {formatPriceWithCurrency(project.price_from, currency)}
                </span>
              </>
            ) : (
              <span className="text-gold font-medium">Price on Request</span>
            )}
          </p>
          
          {/* Developer - ALWAYS Clickable (Gold line - separate) */}
          {project.developer && (
            <DeveloperLink 
              name={project.developer.name}
              slug={project.developer.slug}
              className="text-sm mb-3 block"
              showPrefix={true}
            />
          )}
          
          {/* Unit Types Row (1BR • 2BR • 3BR | 800-1500 sqft) */}
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3 flex-wrap">
            {getUnitTypesText() && (
              <span className="font-medium">{getUnitTypesText()}</span>
            )}
            {getUnitTypesText() && getSizeText() && (
              <span className="text-gold/50">|</span>
            )}
            {getSizeText() && (
              <span>{getSizeText()}</span>
            )}
          </div>
          
          {/* Description with ...more link - Shorter */}
          <p className="text-muted-foreground text-sm leading-relaxed mb-3 flex-1 line-clamp-2 overflow-hidden">
            {getTruncatedDescription() || "Discover this exceptional property opportunity..."}
            <span className="text-gold font-bold hover:text-gold/70 cursor-pointer ml-1">
              ...more
            </span>
          </p>

          {/* Payment Plan Badge - Bottom Right (real data only) */}
          {(() => {
            const breakdown = (project as any).payment_breakdown;
            if (!breakdown || !Array.isArray(breakdown) || breakdown.length === 0) return null;
            const percentages = breakdown
              .map((b: any) => b.percentage)
              .filter((p: any) => typeof p === 'number');
            if (percentages.length === 0) return null;
            return (
              <div className="flex justify-end mb-1">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold bg-gold/10 border border-gold/30 rounded-full px-2.5 py-1">
                  <CreditCard className="w-3 h-3" />
                  {percentages.join('/')}
                </span>
              </div>
            );
          })()}
        </div>
      </Link>

      {/* CTA Buttons - Email, Call, WhatsApp - Fixed overflow */}
      <div className="px-4 pb-4 pt-0 overflow-hidden">
        <div className="grid grid-cols-3 gap-1.5 border-t border-gold/20 pt-3">
          <Button asChild variant="secondary" size="sm" className="w-full min-w-0 overflow-hidden px-2">
            <a
              href={`mailto:${CONTACT_INFO.email}?subject=Inquiry: ${encodeURIComponent(project.name)}&body=${encodeURIComponent(`Hello JBJ Global Real Estate,\n\nI am interested in ${project.name}${project.location ? ` located in ${project.location}` : ''}.\n\nPlease provide more details.\n\nThank you.`)}`}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Email about ${project.name}`}
              className="flex items-center justify-center gap-1"
            >
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate text-xs">Email</span>
            </a>
          </Button>
          <Button asChild variant="secondary" size="sm" className="w-full min-w-0 overflow-hidden px-2">
            <a href={callHref} onClick={(e) => e.stopPropagation()} aria-label={`Call about ${project.name}`} className="flex items-center justify-center gap-1">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate text-xs">Call</span>
            </a>
          </Button>
          <Button asChild variant="secondary" size="sm" className="w-full min-w-0 overflow-hidden px-2">
            <a href={whatsappHref} onClick={(e) => e.stopPropagation()} aria-label={`WhatsApp about ${project.name}`} className="flex items-center justify-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate text-xs">Chat</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
