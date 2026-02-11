import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Crown, Building2, Calendar, Briefcase, DollarSign } from "lucide-react";
import { useDevelopers, useProjects, useCommunities, useTrendingAreas } from "@/hooks/useProjects";
import { useFilteredProjects, defaultFilters } from "@/hooks/useProjectFilters";
import ProjectFilters, { type FilterState } from "@/components/ProjectFilters";
import { Skeleton } from "@/components/ui/skeleton";

const formatPortfolioWorth = (value: number | null) => {
  if (!value) return null;
  if (value >= 1000000000) {
    return `AED ${(value / 1000000000).toFixed(0)}B`;
  }
  return `AED ${(value / 1000000).toFixed(0)}M`;
};

const DeveloperGrid = () => {
  const { data: developers, isLoading: loadingDevelopers } = useDevelopers();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: communities } = useCommunities();
  const { data: trendingAreas } = useTrendingAreas();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  
  const filteredProjects = useFilteredProjects(projects, filters);

  // Smart filter fallback: if no results, suggest clearing closest filter
  useEffect(() => {
    if (filteredProjects.length === 0 && projects && projects.length > 0) {
      // Could implement smart suggestions here
    }
  }, [filteredProjects, projects]);

  if (loadingDevelopers || loadingProjects) {
    return (
      <div className="space-y-16">
        <Skeleton className="h-14 w-full mb-4 bg-[#1a1a1a] rounded-xl" />
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <Skeleton className="h-14 w-48 mb-8 bg-[#1a1a1a]" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, j) => (
                <Skeleton key={j} className="aspect-[4/3] rounded-lg bg-[#1a1a1a]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Group filtered projects by developer
  const projectsByDeveloper = developers?.map((developer) => ({
    developer,
    projects: filteredProjects.filter((p) => p.developer?.id === developer.id),
  })).filter((group) => group.projects.length > 0);

  const hasFiltersApplied = 
    filters.search || 
    filters.priceMin > 0 || 
    filters.priceMax < 500000000 ||
    filters.bedroomsMin !== null ||
    filters.communityId !== null ||
    filters.developerId !== null ||
    filters.handoverStatus !== null ||
    filters.emirate !== null ||
    filters.trendingArea !== null ||
    filters.furnishedStatus !== null ||
    filters.views.length > 0 ||
    filters.amenities.length > 0 ||
    filters.facilities.length > 0 ||
    filters.premiumOnly;

  return (
    <div>
      <ProjectFilters
        filters={filters}
        onFiltersChange={setFilters}
        communities={communities}
        developers={developers}
        trendingAreas={trendingAreas}
        hideQuickFilters
      />

      {hasFiltersApplied && (
        <p className="text-gray-400 mb-8">
          Found <span className="text-white font-semibold">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? "s" : ""}
        </p>
      )}

      <div className="space-y-24">
        {projectsByDeveloper?.map(({ developer, projects: devProjects }) => (
          <div key={developer.id} className="scroll-mt-24" id={`developer-${developer.slug}`}>
            {/* Developer Header Section with Logo */}
            <div className="mb-10">
              <Link
                to={`/developer/${developer.slug}`}
                className="inline-block group mb-6"
              >
                {/* Developer Logo Tile - Light background for readability */}
                <div className="bg-card rounded-2xl p-6 md:p-8 inline-flex items-center justify-center min-w-[280px] md:min-w-[350px] h-24 md:h-32 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02] border border-gold/20">
                  {developer.logo_url ? (
                    <img 
                      src={developer.logo_url} 
                      alt={`${developer.name} logo`}
                      className="max-h-16 md:max-h-20 max-w-[240px] md:max-w-[300px] object-contain"
                    />
                  ) : (
                    <h2
                      className="text-foreground font-bold text-2xl md:text-3xl text-center"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {developer.name}
                    </h2>
                  )}
                </div>
              </Link>

              {/* Developer Description */}
              {developer.description && (
                <p className="text-gray-400 text-lg max-w-4xl mb-6 leading-relaxed">
                  {developer.description}
                </p>
              )}

              {/* Developer Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                {developer.founded_year && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-4 h-4 text-gold" />
                    <span>Est. {developer.founded_year}</span>
                  </div>
                )}
                {developer.completed_projects && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Building2 className="w-4 h-4 text-gold" />
                    <span>{developer.completed_projects.toLocaleString()}+ Units Delivered</span>
                  </div>
                )}
                {developer.offplan_projects && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Briefcase className="w-4 h-4 text-gold" />
                    <span>{developer.offplan_projects} Active Projects</span>
                  </div>
                )}
                {developer.portfolio_worth && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <DollarSign className="w-4 h-4 text-gold" />
                    <span>Portfolio: {formatPortfolioWorth(developer.portfolio_worth)}</span>
                  </div>
                )}
                {developer.headquarters && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-gold">📍</span>
                    <span>{(() => {
                      const parts = developer.headquarters.split(',').map((s: string) => s.trim());
                      return parts.length >= 2 ? `${parts[parts.length - 2]}, ${parts[parts.length - 1]}` : parts[parts.length - 1];
                    })()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Projects Grid - 2-3 per row for balanced layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {devProjects.slice(0, 12).map((project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold shadow-[0_4px_20px_rgba(200,167,102,0.15)] hover:shadow-[0_12px_40px_rgba(200,167,102,0.35),0_8px_25px_rgba(0,0,0,0.15)] hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    {project.images?.[0]?.image_url ? (
                      <img
                        src={project.images[0].image_url}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-champagne-light/50 to-champagne/30">
                        <Building2 className="w-8 h-8 text-gold" />
                        <span className="text-xs text-foreground/60 font-medium">Media pending</span>
                      </div>
                    )}
                    
                    {/* Premium Badge */}
                    {project.is_premium && (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="bg-gradient-to-r from-gold via-[#E8D5A3] to-gold px-3 py-1.5 rounded-full shadow-lg shadow-gold/30 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-black" />
                          <span className="text-black text-xs font-bold uppercase tracking-wide">Premium</span>
                        </div>
                      </div>
                    )}

                    {/* Handover Badge */}
                    {project.handover_date && (
                      <span className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium ${
                        project.handover_date.toLowerCase().includes("ready")
                          ? "bg-green-500/90 text-white"
                          : "bg-gold text-black"
                      }`}>
                        {project.handover_date.toLowerCase().includes("ready") ? "Ready" : project.handover_date}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h4
                      className="text-black text-lg font-semibold mb-2 whitespace-normal break-words leading-tight group-hover:text-gold transition-colors"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {project.name}
                    </h4>
                    {project.location && (
                      <p className="text-zinc-600 text-sm mb-3 flex items-center gap-1.5">
                        <svg className="w-4 h-4 flex-shrink-0 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{project.location}</span>
                      </p>
                    )}
                    {project.bedrooms_min && (
                      <p className="text-zinc-500 text-sm mb-3">
                        {project.bedrooms_min === project.bedrooms_max
                          ? `${project.bedrooms_min} Bedrooms`
                          : `${project.bedrooms_min}-${project.bedrooms_max} Bedrooms`}
                      </p>
                    )}
                    {project.price_from && (
                      <p className="text-gold font-semibold text-lg">
                        From AED {(project.price_from / 1000000).toFixed(1)}M
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* View All Link */}
            {devProjects.length > 12 && (
              <div className="mt-6 text-center">
                <Link
                  to={`/developer/${developer.slug}`}
                  className="inline-flex items-center gap-2 text-gold hover:underline"
                >
                  View all {devProjects.length} projects from {developer.name}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        ))}

        {(!projectsByDeveloper || projectsByDeveloper.length === 0) && (
          <div className="text-center py-20 bg-zinc-900 rounded-lg">
            <p className="text-gray-400 text-lg mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
              {hasFiltersApplied ? "No projects match your filters" : "No projects available yet"}
            </p>
            {hasFiltersApplied && (
              <button
                onClick={() => setFilters(defaultFilters)}
                className="text-gold hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperGrid;
