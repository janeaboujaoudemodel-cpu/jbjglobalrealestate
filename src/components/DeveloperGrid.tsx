import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Building2, Calendar, Briefcase } from "lucide-react";
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
      />

      {hasFiltersApplied && (
        <p className="text-gray-400 mb-8">
          Found <span className="text-white font-semibold">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? "s" : ""}
        </p>
      )}

      <div className="space-y-24">
        {projectsByDeveloper?.map(({ developer, projects: devProjects }) => (
          <div key={developer.id} className="scroll-mt-24" id={`developer-${developer.slug}`}>
            {/* Developer Header Section */}
            <div className="mb-10">
              <Link
                to={`/developer/${developer.slug}`}
                className="inline-block group"
              >
                <h2
                  className="text-white font-semibold mb-4 group-hover:text-[#D4A017] transition-colors"
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "56px",
                    lineHeight: "1.2",
                  }}
                >
                  {developer.name}
                </h2>
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
                    <Calendar className="w-4 h-4 text-[#D4A017]" />
                    <span>Est. {developer.founded_year}</span>
                  </div>
                )}
                {developer.completed_projects && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Building2 className="w-4 h-4 text-[#D4A017]" />
                    <span>{developer.completed_projects.toLocaleString()}+ Units Delivered</span>
                  </div>
                )}
                {developer.offplan_projects && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Briefcase className="w-4 h-4 text-[#D4A017]" />
                    <span>{developer.offplan_projects} Active Projects</span>
                  </div>
                )}
                {developer.portfolio_worth && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Star className="w-4 h-4 text-[#D4A017]" />
                    <span>Portfolio: {formatPortfolioWorth(developer.portfolio_worth)}</span>
                  </div>
                )}
                {developer.headquarters && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-[#D4A017]">📍</span>
                    <span>{developer.headquarters}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {devProjects.slice(0, 12).map((project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.slug}`}
                  className="group relative overflow-hidden rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#D4A017]/50 transition-all duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={project.images?.[0]?.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Premium Star */}
                    {project.is_featured && (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="bg-black/60 backdrop-blur-sm rounded-full p-2">
                          <Star className="w-5 h-5 fill-[#D4A017] text-[#D4A017]" />
                        </div>
                      </div>
                    )}

                    {/* Handover Badge */}
                    {project.handover_date && (
                      <span className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium ${
                        project.handover_date.toLowerCase().includes("ready")
                          ? "bg-green-500/90 text-white"
                          : "bg-[#D4A017]/90 text-black"
                      }`}>
                        {project.handover_date.toLowerCase().includes("ready") ? "Ready" : project.handover_date}
                      </span>
                    )}
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
              ))}
            </div>

            {/* View All Link */}
            {devProjects.length > 12 && (
              <div className="mt-6 text-center">
                <Link
                  to={`/developer/${developer.slug}`}
                  className="inline-flex items-center gap-2 text-[#D4A017] hover:underline"
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
          <div className="text-center py-20 bg-[#1a1a1a] rounded-lg">
            <p className="text-gray-400 text-lg mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
              {hasFiltersApplied ? "No projects match your filters" : "No projects available yet"}
            </p>
            {hasFiltersApplied && (
              <button
                onClick={() => setFilters(defaultFilters)}
                className="text-[#D4A017] hover:underline"
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
