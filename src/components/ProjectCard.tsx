import { useState } from "react";
import { Link } from "react-router-dom";
import type { Project } from "@/hooks/useProjects";
import FavoriteButton from "./FavoriteButton";
import ShortlistBadgeButton from "./ShortlistBadgeButton";
import { ChevronLeft, ChevronRight, MapPin, Bed, Mail, Phone, MessageCircle } from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { SafeImage } from "@/components/SafeImage";
import { VerifiedMedia } from "@/components/ui/verified-media";

interface ProjectCardProps {
  project: Project & { is_sold_out?: boolean | null };
  showFavorite?: boolean;
  showBadgeButton?: boolean;
  currency?: 'AED' | 'USD' | 'EUR' | 'GBP' | 'INR';
  sizeUnit?: 'sqft' | 'sqm';
}

// Currency conversion rates
const CURRENCY_RATES: Record<string, number> = {
  AED: 1,
  USD: 0.27,
  EUR: 0.25,
  GBP: 0.21,
  INR: 22.5,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: 'AED',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
};

// Helper to format price with currency conversion
const formatPriceWithCurrency = (price: number, currency: string = 'AED'): string => {
  const converted = price * CURRENCY_RATES[currency];
  const symbol = CURRENCY_SYMBOLS[currency];
  if (converted >= 1000000) {
    return `${symbol} ${(converted / 1000000).toFixed(2)}M`;
  }
  if (converted >= 1000) {
    return `${symbol} ${Math.round(converted / 1000)}K`;
  }
  return `${symbol} ${converted.toLocaleString()}`;
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

const ProjectCard = ({ project, showFavorite = true, showBadgeButton = true, currency = 'EUR', sizeUnit = 'sqft' }: ProjectCardProps) => {
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
      return project.bedrooms_min.toString();
    }
    return `${project.bedrooms_min}, ${project.bedrooms_min + 1}${project.bedrooms_max && project.bedrooms_max > project.bedrooms_min + 1 ? `, ${project.bedrooms_max}` : ''}`;
  };

  // Truncate description for card preview
  const getTruncatedDescription = () => {
    if (!project.description) return null;
    const maxLength = 120;
    if (project.description.length <= maxLength) return project.description;
    return project.description.substring(0, maxLength).trim();
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

  return (
    <div className="group relative overflow-hidden rounded-lg bg-white border border-zinc-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* Favorite Button */}
      {showFavorite && (
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <FavoriteButton projectId={project.id} size="sm" />
        </div>
      )}

      {/* Badge Button */}
      {showBadgeButton && (
        <div className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <ShortlistBadgeButton projectId={project.id} size="sm" showBadgeIndicator={true} />
        </div>
      )}

      <Link to={`/project/${project.slug}`} className="flex-1 flex flex-col">
        {/* Image with Carousel - Provident Style */}
        <div className="aspect-[4/3] overflow-hidden relative">
          <VerifiedMedia
            src={images[currentImageIndex]?.image_url || images[0]?.image_url}
            alt={images[currentImageIndex]?.alt_text || project.name}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            placeholderLabel="Media pending verification"
          />
          
          {/* Navigation Arrows - Always Visible (Provident style) */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-zinc-700 flex items-center justify-center shadow-md transition-all z-10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-zinc-700 flex items-center justify-center shadow-md transition-all z-10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              {/* Image Dots Indicator - Bottom center above handover */}
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.slice(0, 5).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Top-Left: Property Type Label (dark background) */}
          {project.property_type_label && (
            <div className="absolute top-3 left-3 z-10 bg-zinc-800/90 text-white px-2 py-1 rounded text-xs font-medium">
              {project.property_type_label}
            </div>
          )}
          
          {/* Top-Right: Status Label (white background, only for specific projects) */}
          {statusLabel && (
            <div className="absolute top-3 right-3 z-10 bg-white text-zinc-800 px-2 py-1 rounded text-xs font-medium border border-zinc-200">
              {statusLabel}
            </div>
          )}
          
          {/* Bottom-Right: Handover Year - ORANGE */}
          {project.handover_date && (
            <div className="absolute bottom-3 right-3 z-10 bg-orange-500 text-white px-2.5 py-1 rounded text-xs font-bold">
              {project.handover_date}
            </div>
          )}
          
          {/* Sold Out Badge */}
          {project.is_sold_out && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
              <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                Sold Out
              </span>
            </div>
          )}
        </div>
        
        {/* Content - Provident Style */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Project Name - Gray color */}
          <h4 className="text-zinc-700 text-lg font-semibold mb-1 line-clamp-2 hover:text-primary transition-colors">
            {project.name}
          </h4>
          
          {/* Developer - Clickable Link */}
          {project.developer && (
            <p className="text-zinc-500 text-sm mb-2">
              by{' '}
              <Link 
                to={`/developer/${project.developer.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
              >
                {project.developer.name}
              </Link>
            </p>
          )}
          
          {/* Starting Price - Orange/Gold */}
          {project.price_from && (
            <p className="text-sm mb-3">
              <span className="text-zinc-600">Starting Price </span>
              <span className="text-orange-500 font-semibold">
                {formatPriceWithCurrency(project.price_from, currency)}
              </span>
            </p>
          )}
          
          {/* Location with icon + Bedrooms with icon */}
          <div className="flex items-center gap-4 text-zinc-500 text-sm mb-3">
            {project.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-zinc-400" />
                <span className="truncate max-w-[120px]">{project.location}</span>
              </div>
            )}
            {getBedroomsText() && (
              <div className="flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-zinc-400" />
                <span>{getBedroomsText()}</span>
              </div>
            )}
          </div>
          
          {/* Description with ...more link */}
          {getTruncatedDescription() && (
            <p className="text-zinc-600 text-sm leading-relaxed mb-4 flex-1">
              {getTruncatedDescription()}
              {project.description && project.description.length > 120 && (
                <span className="text-primary hover:underline cursor-pointer ml-1">...more</span>
              )}
            </p>
          )}
        </div>
      </Link>

      {/* CTA Buttons - Email, Call, WhatsApp (Provident style) */}
      <div className="px-4 pb-4 pt-0">
        <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 pt-4">
          <a
            href={`mailto:info@jbjglobalrealestate.com?subject=Inquiry: ${project.name}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-zinc-200 text-zinc-600 hover:border-primary hover:text-primary transition-colors text-sm font-medium"
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </a>
          <a
            href={callHref}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-zinc-200 text-zinc-600 hover:border-primary hover:text-primary transition-colors text-sm font-medium"
          >
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </a>
          <a
            href={whatsappHref}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-zinc-200 text-zinc-600 hover:border-green-600 hover:text-green-600 transition-colors text-sm font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
