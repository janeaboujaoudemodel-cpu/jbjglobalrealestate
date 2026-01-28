import { Link } from "react-router-dom";
import type { Project } from "@/hooks/useProjects";
import FavoriteButton from "./FavoriteButton";
import ShortlistBadgeButton from "./ShortlistBadgeButton";
import { FileText, Download, Phone, MessageCircle, Crown } from "lucide-react";
import { Button } from "./ui/button";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { SafeImage } from "@/components/SafeImage";
import AIMarketAnalyzer from "@/components/AIMarketAnalyzer";
import { T } from "@/components/ui/T";
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
    return `${symbol} ${(converted / 1000000).toFixed(1)}M`;
  }
  if (converted >= 1000) {
    return `${symbol} ${(converted / 1000).toFixed(0)}K`;
  }
  return `${symbol} ${converted.toLocaleString()}`;
};

// Helper to convert size
const convertSize = (sqft: number, unit: 'sqft' | 'sqm'): number => {
  return unit === 'sqm' ? Math.round(sqft * 0.0929) : sqft;
};

const ProjectCard = ({ project, showFavorite = true, showBadgeButton = true, currency = 'AED', sizeUnit = 'sqft' }: ProjectCardProps) => {
  const handleDownloadBrochure = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const brochure = project.documents?.find(doc => doc.document_type === 'brochure');
    if (brochure) {
      window.open(brochure.file_url, '_blank');
    } else {
      window.location.href = `/project/${project.slug}`;
    }
  };

  const handleDownloadAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (project.documents && project.documents.length > 0) {
      project.documents.forEach(doc => {
        window.open(doc.file_url, '_blank');
      });
    } else {
      window.location.href = `/project/${project.slug}`;
    }
  };

  const whatsappMessage = `Hello JBJ Global Real Estate,\n\nI am interested in ${project.name} located in ${project.location || 'UAE'}.\n\nPlease provide more details about this property.\n\nThank you.`;

  const whatsappHref = getWhatsAppUrl(whatsappMessage);
  const callHref = getCallUrl();

  const navigateExternal = (href: string) => {
    // Avoid popup blockers / iframe restrictions by navigating directly.
    window.location.href = href;
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold shadow-[0_4px_20px_rgba(200,167,102,0.15)] hover:shadow-[0_12px_40px_rgba(200,167,102,0.35),0_8px_25px_rgba(0,0,0,0.15)] hover:-translate-y-2 transition-all duration-300 flex flex-col">
      {/* Favorite Button */}
      {showFavorite && (
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <FavoriteButton projectId={project.id} size="sm" />
        </div>
      )}

      {/* Badge Button - Always visible when enabled */}
      {showBadgeButton && (
        <div className="absolute top-3 left-3 z-10">
          <ShortlistBadgeButton projectId={project.id} size="sm" showBadgeIndicator={true} />
        </div>
      )}

      <Link to={`/project/${project.slug}`} className="flex-1">
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden relative">
          <VerifiedMedia
            src={project.images?.[0]?.image_url}
            alt={project.images?.[0]?.alt_text || project.name}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            placeholderLabel="Media pending verification"
          />
          
          {/* Provident-style Label Layout */}
          {/* Top-Left: Property Type Label (e.g., "Apartment, Sky-Villa", "Villa") */}
          {project.property_type_label && (
            <div className="absolute top-3 left-3 z-10 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded text-xs font-medium shadow-lg">
              {project.property_type_label}
            </div>
          )}
          
          {/* Top-Right: Status Label (e.g., "Future Launch", "New Phase") */}
          {project.status_label && (
            <div className="absolute top-3 right-3 z-10 bg-white text-zinc-800 px-3 py-1 rounded text-xs font-medium shadow-lg border border-zinc-200">
              {project.status_label}
            </div>
          )}
          
          {/* Bottom-Right: Handover Year (e.g., "2028", "2030") */}
          {project.handover_date && (
            <div className="absolute bottom-3 right-3 z-10 bg-gold text-black px-3 py-1.5 rounded text-xs font-bold shadow-lg">
              {project.handover_date}
            </div>
          )}
          
          {/* Sold Out Badge - overlays everything */}
          {project.is_sold_out && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
              <span className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                <T>Sold Out</T>
              </span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5">
          {/* Project Name */}
          <h4 className="text-black text-lg font-semibold mb-2 line-clamp-1 group-hover:text-gold transition-colors">
            {project.name}
          </h4>
          
          {/* Location */}
          {project.location && (
            <p className="text-zinc-600 text-sm mb-3 flex items-center gap-1.5">
              <svg className="w-4 h-4 flex-shrink-0 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{project.location}</span>
            </p>
          )}
          
          {/* Developer */}
          {project.developer && (
            <p className="text-zinc-500 text-sm mb-2">
              <T>by</T> <span className="text-zinc-700">{project.developer.name}</span>
            </p>
          )}
          
          {/* Bedrooms */}
          {project.bedrooms_min && (
            <p className="text-zinc-500 text-sm mb-3">
              {project.bedrooms_min === project.bedrooms_max
                ? <><T>{`${project.bedrooms_min} Bedrooms`}</T></>
                : <><T>{`${project.bedrooms_min}-${project.bedrooms_max} Bedrooms`}</T></>}
            </p>
          )}
          
          {/* Size */}
          {project.size_min && (
            <p className="text-zinc-600 text-sm mb-2">
              {convertSize(project.size_min, sizeUnit).toLocaleString()} {sizeUnit}
              {project.size_max && project.size_max !== project.size_min && 
                ` - ${convertSize(project.size_max, sizeUnit).toLocaleString()} ${sizeUnit}`}
            </p>
          )}
          
          {/* Price */}
          {project.price_from && (
            <p className="text-gold font-semibold text-lg">
              <T>From</T> {formatPriceWithCurrency(project.price_from, currency)}
            </p>
          )}
        </div>
      </Link>

      {/* AI Market Analyzer - Compact version */}
      <div className="px-4 pb-2">
        <AIMarketAnalyzer
          type="property"
          name={project.name}
          location={project.location || project.community?.name}
          pricePerSqft={project.price_from && project.size_min ? Math.round(project.price_from / project.size_min) : undefined}
          totalPrice={project.price_from}
          size={project.size_min}
          bedrooms={project.bedrooms_min}
          developer={project.developer?.name}
          variant="compact"
        />
      </div>

      {/* Action Buttons - Fixed at bottom with 3D Premium Style */}
      <div className="p-4 pt-0 mt-auto space-y-3">
        {/* Download Buttons - 3D Premium Style */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownloadBrochure}
            className="relative h-9 px-3 rounded-lg text-xs font-semibold transition-all duration-300 group overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F5F0E6 100%)',
              boxShadow: `
                0 4px 12px rgba(200,167,102,0.3),
                0 2px 6px rgba(0,0,0,0.1),
                inset 0 1px 2px rgba(255,255,255,0.9),
                0 0 10px rgba(200,167,102,0.2)
              `,
            }}
          >
            <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />
            <span className="relative flex items-center justify-center gap-1.5 text-gold">
              <FileText className="w-3.5 h-3.5" />
              <T>Brochure</T>
            </span>
          </button>
          <button
            onClick={handleDownloadAll}
            className="relative h-9 px-3 rounded-lg text-xs font-semibold transition-all duration-300 group overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F5F0E6 100%)',
              boxShadow: `
                0 4px 12px rgba(200,167,102,0.3),
                0 2px 6px rgba(0,0,0,0.1),
                inset 0 1px 2px rgba(255,255,255,0.9),
                0 0 10px rgba(200,167,102,0.2)
              `,
            }}
          >
            <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />
            <span className="relative flex items-center justify-center gap-1.5 text-gold">
              <Download className="w-3.5 h-3.5" />
              <T>Materials</T>
            </span>
          </button>
        </div>

        {/* Contact Buttons - 3D Premium Style */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={whatsappHref}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigateExternal(whatsappHref);
            }}
            className="relative h-9 px-3 rounded-lg text-xs font-semibold transition-all duration-300 group overflow-hidden flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
              boxShadow: `
                0 4px 14px rgba(200,167,102,0.35),
                0 3px 8px rgba(0,0,0,0.12),
                inset 0 1px 3px rgba(255,255,255,0.9),
                inset 0 -1px 3px rgba(200,167,102,0.15),
                0 0 12px rgba(200,167,102,0.25)
              `,
            }}
          >
            <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-white/75 to-transparent pointer-events-none" />
            <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 25px rgba(200,167,102,0.5)' }} />
            <span className="relative flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-green-600" />
              <span className="text-black"><T>WhatsApp</T></span>
            </span>
          </a>
          <a
            href={callHref}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigateExternal(callHref);
            }}
            className="relative h-9 px-3 rounded-lg text-xs font-semibold transition-all duration-300 group overflow-hidden flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
              boxShadow: `
                0 4px 14px rgba(200,167,102,0.35),
                0 3px 8px rgba(0,0,0,0.12),
                inset 0 1px 3px rgba(255,255,255,0.9),
                inset 0 -1px 3px rgba(200,167,102,0.15),
                0 0 12px rgba(200,167,102,0.25)
              `,
            }}
          >
            <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-white/75 to-transparent pointer-events-none" />
            <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 25px rgba(200,167,102,0.5)' }} />
            <span className="relative flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-black"><T>Call</T></span>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
