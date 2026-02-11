import { Link } from "react-router-dom";
import { Sparkles, ChevronRight } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { SafeImage } from "@/components/SafeImage";
import { DeveloperLink } from "@/components/ui/developer-link";
import { useMemo } from "react";
import { formatDisplayDate } from "@/utils/formatDate";

interface RecommendedProjectsProps {
  currentProjectId: string;
  currentDeveloperId?: string | null;
  currentLocation?: string | null;
  currentEmirate?: string | null;
}

export default function RecommendedProjects({
  currentProjectId,
  currentDeveloperId,
  currentLocation,
  currentEmirate,
}: RecommendedProjectsProps) {
  const { data: projects } = useProjects();

  // Get 3 similar projects based on developer, location, or emirate
  const recommendedProjects = useMemo(() => {
    if (!projects || projects.length === 0) return [];

    // Filter out current project
    const otherProjects = projects.filter((p) => p.id !== currentProjectId);

    // Score projects by relevance
    const scored = otherProjects.map((p) => {
      let score = 0;
      
      // Same developer = highest priority
      if (currentDeveloperId && p.developer?.id === currentDeveloperId) {
        score += 10;
      }
      
      // Same location/area
      if (currentLocation && p.location?.toLowerCase().includes(currentLocation.toLowerCase())) {
        score += 5;
      }
      
      // Same emirate
      if (currentEmirate && p.emirate === currentEmirate) {
        score += 3;
      }
      
      // Has images (better presentation)
      if (p.images && p.images.length > 0) {
        score += 2;
      }
      
      // Has price
      if (p.price_from) {
        score += 1;
      }

      return { project: p, score };
    });

    // Sort by score and take top 3
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.project);
  }, [projects, currentProjectId, currentDeveloperId, currentLocation, currentEmirate]);

  if (recommendedProjects.length === 0) return null;

  return (
    <section className="py-12 bg-black">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-gold" />
            <h2 className="text-2xl md:text-3xl font-bold text-white">Recommended Projects</h2>
          </div>
          <Link 
            to="/properties" 
            className="text-gold hover:underline text-sm font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedProjects.map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.slug}`}
              className="group relative overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-premium-bg to-black hover:border-gold/60 transition-all"
            >
              {/* Image */}
              <div className="aspect-[16/10] overflow-hidden">
                <SafeImage
                  src={project.images?.[0]?.image_url}
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Handover Badge */}
                {project.handover_date && (
                  <div className="absolute top-3 right-3 bg-handover text-handover-foreground px-2 py-1 rounded text-xs font-bold">
                    {formatDisplayDate(project.handover_date)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-gold transition-colors whitespace-normal break-words leading-tight mb-1">
                  {project.name}
                </h3>
                
                {project.developer && (
                  <DeveloperLink
                    name={project.developer.name}
                    slug={project.developer.slug}
                    className="text-sm mb-2"
                  />
                )}

                {project.price_from && (
                  <p className="text-handover font-bold">
                    From AED {(project.price_from / 1000000).toFixed(2)}M
                  </p>
                )}

                {project.location && (
                  <p className="text-muted-foreground text-sm mt-1 truncate">
                    {project.location}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
