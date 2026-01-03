import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { Project } from "@/hooks/useProjects";
import FavoriteButton from "./FavoriteButton";

interface ProjectCardProps {
  project: Project;
  showFavorite?: boolean;
}

const ProjectCard = ({ project, showFavorite = true }: ProjectCardProps) => {
  return (
    <Link
      to={`/project/${project.slug}`}
      className="group relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-300"
    >
      {/* Premium Star Badge - Only shows for featured/premium properties when is_featured=true */}
      {project.is_featured === true && (
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-black/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-gold/30">
            <Star className="w-3 h-3 fill-gold text-gold" />
            <span className="tracking-wide text-gold-light">PREMIUM</span>
          </div>
        </div>
      )}
      
      {/* Favorite Button */}
      {showFavorite && (
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <FavoriteButton projectId={project.id} size="sm" />
        </div>
      )}

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
            From AED {(project.price_from / 1000000).toFixed(1)}M
          </p>
        )}
      </div>
    </Link>
  );
};

export default ProjectCard;
