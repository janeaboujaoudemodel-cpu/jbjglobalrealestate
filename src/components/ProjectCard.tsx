import { Link } from "react-router-dom";
import type { Project } from "@/hooks/useProjects";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <Link
      to={`/project/${project.slug}`}
      className="group relative overflow-hidden rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#D4A017]/50 transition-all duration-300"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={project.images?.[0]?.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"}
          alt={project.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4">
        <h4
          className="text-white text-lg font-semibold mb-1 line-clamp-1"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {project.name}
        </h4>
        {project.location && (
          <p className="text-gray-400 text-sm mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {project.location}
          </p>
        )}
        {project.developer && (
          <p className="text-gray-500 text-sm mb-2">by {project.developer.name}</p>
        )}
        {project.bedrooms_min && (
          <p className="text-gray-500 text-sm mb-2">
            {project.bedrooms_min === project.bedrooms_max
              ? `${project.bedrooms_min} Bedrooms`
              : `${project.bedrooms_min}-${project.bedrooms_max} Bedrooms`}
          </p>
        )}
        {project.price_from && (
          <p className="text-[#D4A017] font-semibold text-lg">
            From AED {(project.price_from / 1000000).toFixed(1)}M
          </p>
        )}
      </div>
    </Link>
  );
};

export default ProjectCard;
