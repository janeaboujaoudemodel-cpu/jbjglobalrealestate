import { Link } from "react-router-dom";
import type { Project } from "@/hooks/useProjects";
import FavoriteButton from "./FavoriteButton";
import { FileText, Download, Phone, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";

interface ProjectCardProps {
  project: Project;
  showFavorite?: boolean;
}

// Helper to format price with commas
const formatPriceWithCommas = (price: number): string => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`;
  }
  return price.toLocaleString();
};

const WHATSAPP_NUMBER = "+971565911000";
const PHONE_NUMBER = "+971565911000";

const ProjectCard = ({ project, showFavorite = true }: ProjectCardProps) => {
  const handleDownloadBrochure = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Find brochure document from project documents
    const brochure = project.documents?.find(doc => doc.document_type === 'brochure');
    if (brochure) {
      window.open(brochure.file_url, '_blank');
    } else {
      // Redirect to project detail page if no brochure
      window.location.href = `/project/${project.slug}`;
    }
  };

  const handleDownloadAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Download all documents
    if (project.documents && project.documents.length > 0) {
      project.documents.forEach(doc => {
        window.open(doc.file_url, '_blank');
      });
    } else {
      // Redirect to project detail page if no documents
      window.location.href = `/project/${project.slug}`;
    }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const message = encodeURIComponent(
      `Hello JJ Global Capital,\n\nI am interested in ${project.name} located in ${project.location || 'UAE'}.\n\nPlease provide more details about this property.\n\nThank you.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `tel:${PHONE_NUMBER}`;
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-300">
      {/* Favorite Button */}
      {showFavorite && (
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <FavoriteButton projectId={project.id} size="sm" />
        </div>
      )}

      <Link to={`/project/${project.slug}`}>
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={project.images?.[0]?.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-4">
          <h4 className="text-white text-lg font-semibold mb-1 line-clamp-1">
            {project.name}
          </h4>
          {project.location && (
            <p className="text-zinc-500 text-sm mb-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {project.location}
            </p>
          )}
          {project.developer && (
            <p className="text-zinc-600 text-sm mb-2">by {project.developer.name}</p>
          )}
          {project.bedrooms_min && (
            <p className="text-zinc-600 text-sm mb-2">
              {project.bedrooms_min === project.bedrooms_max
                ? `${project.bedrooms_min} Bedrooms`
                : `${project.bedrooms_min}-${project.bedrooms_max} Bedrooms`}
            </p>
          )}
          {project.price_from && (
            <p className="text-white font-semibold text-lg">
              From AED {formatPriceWithCommas(project.price_from)}
            </p>
          )}
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="px-4 pb-4 space-y-2">
        {/* Download Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadBrochure}
            className="flex-1 bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white text-xs"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Brochure
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            className="flex-1 bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            All Materials
          </Button>
        </div>

        {/* Contact Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsApp}
            className="flex-1 bg-green-950/30 border-green-800/50 hover:bg-green-900/40 hover:border-green-700 text-green-400 hover:text-green-300 text-xs"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCall}
            className="flex-1 bg-purple-950/30 border-purple-800/50 hover:bg-purple-900/40 hover:border-purple-700 text-purple-400 hover:text-purple-300 text-xs"
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