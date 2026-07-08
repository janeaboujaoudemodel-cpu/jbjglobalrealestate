import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Crown, Building2, Calendar, Briefcase, DollarSign } from "lucide-react";
import { useDevelopers, useProjects, useCommunities, useTrendingAreas } from "@/hooks/useProjects";
import { useFilteredProjects, defaultFilters } from "@/hooks/useProjectFilters";
import ProjectFilters, { type FilterState } from "@/components/ProjectFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";
import { PricePill } from "@/components/ui/price-pill";

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
        <Skeleton className="h-14 w-full mb-4 rounded-xl" />
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <Skeleton className="h-10 w-56 mb-8 rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="space-y-3">
                  <Skeleton className="aspect-[4/3] rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
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
        <p className="text-[#1A1A1A]/70 mb-8">
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
                {/* Developer Logo Tile — uniform white plate, full-fit logo */}
                <div className="w-[260px] h-[120px] rounded-2xl bg-white border border-[#B89555]/35 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-0.5 flex items-center justify-center p-5 overflow-hidden">
                  {isValidDeveloperLogoUrl(developer.logo_url) ? (
                    <img
                      src={developer.logo_url as string}
                      alt={`${developer.name} logo`}
                      className="block max-h-full max-w-full w-auto h-auto object-contain"
                     loading="lazy" decoding="async" />
                  ) : (
                    <h2 className="text-[#1A1A1A] font-bold text-xl md:text-2xl text-center line-clamp-2">
                      {developer.name}
                    </h2>
                  )}
                </div>
              </Link>

              {/* Developer Description */}
              {developer.description && (
                <p className="text-[#1A1A1A]/70 text-lg max-w-4xl mb-6 leading-relaxed">
                  {developer.description}
                </p>
              )}

              {/* Developer Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                {developer.founded_year && (
                  <div className="flex items-center gap-2 text-[#1A1A1A]/70">
                    <Calendar className="w-4 h-4 text-[#1A1A1A]" />
                    <span>Est. {developer.founded_year}</span>
                  </div>
                )}
                {developer.completed_projects && (
                  <div className="flex items-center gap-2 text-[#1A1A1A]/70">
                    <Building2 className="w-4 h-4 text-[#1A1A1A]" />
                    <span>{developer.completed_projects.toLocaleString()}+ Units Delivered</span>
                  </div>
                )}
                {developer.offplan_projects && (
                  <div className="flex items-center gap-2 text-[#1A1A1A]/70">
                    <Briefcase className="w-4 h-4 text-[#1A1A1A]" />
                    <span>{developer.offplan_projects} Active Projects</span>
                  </div>
                )}
                {developer.portfolio_worth && (
                  <div className="flex items-center gap-2 text-[#1A1A1A]/70">
                    <DollarSign className="w-4 h-4 text-[#1A1A1A]" />
                    <span>Portfolio: {formatPortfolioWorth(developer.portfolio_worth)}</span>
                  </div>
                )}
                {/* Headquarters intentionally removed — never display developer office locations. */}

              </div>
            </div>

            {/* Projects Grid - 2-3 per row for balanced layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {devProjects.slice(0, 12).map((project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] shadow-[0_4px_20px_rgba(200,167,102,0.15)] hover:shadow-[0_12px_40px_rgba(200,167,102,0.35),0_8px_25px_rgba(0,0,0,0.15)] hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    {project.images?.[0]?.image_url ? (
                      <img
                        src={project.images[0].image_url}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                       loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-champagne-light/50 to-champagne/30">
                        <Building2 className="w-8 h-8 text-[#1A1A1A]" />
                        <span className="text-xs text-foreground/60 font-medium">Media pending</span>
                      </div>
                    )}
                    
                    {/* Premium Badge */}
                    {project.is_premium && (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="bg-gradient-to-r from-gold via-[#E8D5A3] to-gold px-3 py-1.5 rounded-full shadow-lg shadow-gold/30 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-[#1A1A1A]" />
                          <span className="text-[#1A1A1A] text-xs font-bold uppercase tracking-wide">Premium</span>
                        </div>
                      </div>
                    )}

                    {/* Handover Badge — uses site-wide .handover-orange pill */}
                    {project.handover_date && (
                      <span className="absolute top-3 left-3 handover-orange">
                        {project.handover_date.toLowerCase().includes("ready") ? "Ready" : project.handover_date}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h4
                      className="text-[#1A1A1A] text-lg font-semibold mb-2 whitespace-normal break-words leading-tight group-hover:text-[#1A1A1A] transition-colors"
                    >
                      {project.name}
                    </h4>
                    {project.location && (
                      <p className="text-[#1A1A1A]/70 text-sm mb-3 flex items-center gap-1.5">
                        <svg className="w-4 h-4 flex-shrink-0 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{project.location}</span>
                      </p>
                    )}
                    {project.bedrooms_min && (
                      <p className="text-[#1A1A1A]/70 text-sm mb-3">
                        {project.bedrooms_min === project.bedrooms_max
                          ? `${project.bedrooms_min} Bedrooms`
                          : `${project.bedrooms_min}-${project.bedrooms_max} Bedrooms`}
                      </p>
                    )}
                    {project.price_from && (
                      <PricePill price={project.price_from} />
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
                  className="inline-flex items-center gap-2 text-[#1A1A1A] hover:underline"
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
          <div className="text-center py-20 bg-[#FDFBF7] rounded-lg">
            <p className="text-[#1A1A1A]/70 text-lg mb-2">
              {hasFiltersApplied ? "No projects match your filters" : "No projects available yet"}
            </p>
            {hasFiltersApplied && (
              <button
                onClick={() => setFilters(defaultFilters)}
                className="text-[#1A1A1A] hover:underline"
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
