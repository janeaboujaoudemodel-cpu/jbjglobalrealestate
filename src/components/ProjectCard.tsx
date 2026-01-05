import { Link } from "react-router-dom";
import type { Project } from "@/hooks/useProjects";
import FavoriteButton from "./FavoriteButton";
import ShortlistBadgeButton from "./ShortlistBadgeButton";
import { FileText, Download, Phone, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";

interface ProjectCardProps {
  project: Project;
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

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const message = `Hello JJ Global Capital,\n\nI am interested in ${project.name} located in ${project.location || 'UAE'}.\n\nPlease provide more details about this property.\n\nThank you.`;
    window.open(getWhatsAppUrl(message), '_blank');
  };

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = getCallUrl();
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-gold/30 transition-all duration-300 flex flex-col">
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
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={project.images?.[0]?.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        
        {/* Content */}
        <div className="p-5">
          {/* Project Name */}
          <h4 className="text-white text-lg font-semibold mb-2 line-clamp-1 group-hover:text-gold transition-colors">
            {project.name}
          </h4>
          
          {/* Location */}
          {project.location && (
            <p className="text-zinc-500 text-sm mb-3 flex items-center gap-1.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{project.location}</span>
            </p>
          )}
          
          {/* Developer */}
          {project.developer && (
            <p className="text-zinc-600 text-sm mb-2">
              by <span className="text-zinc-400">{project.developer.name}</span>
            </p>
          )}
          
          {/* Bedrooms */}
          {project.bedrooms_min && (
            <p className="text-zinc-600 text-sm mb-3">
              {project.bedrooms_min === project.bedrooms_max
                ? `${project.bedrooms_min} Bedrooms`
                : `${project.bedrooms_min}-${project.bedrooms_max} Bedrooms`}
            </p>
          )}
          
          {/* Size */}
          {project.size_min && (
            <p className="text-zinc-500 text-sm mb-2">
              {convertSize(project.size_min, sizeUnit).toLocaleString()} {sizeUnit}
              {project.size_max && project.size_max !== project.size_min && 
                ` - ${convertSize(project.size_max, sizeUnit).toLocaleString()} ${sizeUnit}`}
            </p>
          )}
          
          {/* Price */}
          {project.price_from && (
            <p className="text-gold font-semibold text-lg">
              From {formatPriceWithCurrency(project.price_from, currency)}
            </p>
          )}
        </div>
      </Link>

      {/* Action Buttons - Fixed at bottom */}
      <div className="p-4 pt-0 mt-auto space-y-3">
        {/* Download Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadBrochure}
            className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white text-xs h-9"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Brochure
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white text-xs h-9"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Materials
          </Button>
        </div>

        {/* Contact Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsApp}
            className="bg-green-950/30 border-green-800/50 hover:bg-green-900/40 hover:border-green-600 text-green-400 hover:text-green-300 text-xs h-9"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCall}
            className="bg-gold/10 border-gold/30 hover:bg-gold/20 hover:border-gold text-gold hover:text-white text-xs h-9"
          >
            <Phone className="w-3.5 h-3.5 mr-1.5" />
            Call
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
