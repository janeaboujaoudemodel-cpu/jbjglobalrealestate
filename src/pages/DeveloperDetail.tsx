import { useState, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import { useDeveloper, useProjectsByDeveloper, useCommunities, useTrendingAreas, useDevelopers } from "@/hooks/useProjects";
import { useFilteredProjects, defaultFilters } from "@/hooks/useProjectFilters";
import ProjectFilters, { type FilterState } from "@/components/ProjectFilters";
import ProjectCard from "@/components/ProjectCard";
import EmiratesTabs from "@/components/EmiratesTabs";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Building2, MapPin, Calendar, TrendingUp, MapIcon, ChevronDown, ChevronUp } from "lucide-react";
import { getHighResImageUrl } from "@/lib/imageUtils";
import { Button } from "@/components/ui/button";
import { renderMarkdownToHtml, formatReellyDescription } from "@/lib/markdownUtils";

// Lazy load map component to prevent boot errors from react-leaflet context issues
const DeveloperProjectsMap = lazy(() => import("@/components/developer/DeveloperProjectsMap").then(m => ({ default: m.DeveloperProjectsMap })));

// Map loading fallback
const MapLoadingFallback = () => (
  <div className="rounded-xl border-2 border-gold/40 bg-champagne/20 p-8 h-[400px] flex items-center justify-center">
    <div className="text-center">
      <MapIcon className="w-12 h-12 text-gold/50 mx-auto mb-3 animate-pulse" />
      <p className="text-foreground/70">Loading map...</p>
    </div>
  </div>
);

const DeveloperDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: developer, isLoading: loadingDeveloper } = useDeveloper(slug || "");
  const { data: projects, isLoading: loadingProjects } = useProjectsByDeveloper(slug || "");
  const { data: communities } = useCommunities();
  const { data: trendingAreas } = useTrendingAreas();
  const { data: allDevelopers } = useDevelopers();

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedEmirate, setSelectedEmirate] = useState<string | null>(null);
  const [isDevDescExpanded, setIsDevDescExpanded] = useState(false);
  const [isFilterFixed, setIsFilterFixed] = useState(false);
  const filterSentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for fixed filter positioning
  const hasProjects = !!projects;
  useEffect(() => {
    const sentinel = filterSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFilterFixed(!entry.isIntersecting && entry.boundingClientRect.top < 140);
      },
      { threshold: 0, rootMargin: "-140px 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasProjects]);

  // Apply emirate filter first, then apply other filters
  const projectsInEmirate = useMemo(() => {
    if (!projects) return [];
    if (!selectedEmirate) return projects;
    return projects.filter((p) => p.emirate === selectedEmirate);
  }, [projects, selectedEmirate]);

  const filteredProjects = useFilteredProjects(projectsInEmirate, filters);

  const hasFiltersApplied =
    filters.search ||
    filters.priceMin > 0 ||
    filters.priceMax < 500000000 ||
    filters.bedroomsMin !== null ||
    filters.communityId !== null ||
    filters.handoverStatus !== null ||
    filters.trendingArea !== null ||
    filters.furnishedStatus !== null ||
    filters.views.length > 0 ||
    filters.amenities.length > 0 ||
    filters.facilities.length > 0 ||
    filters.premiumOnly;

  if (loadingDeveloper) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 bg-premium-bg">
        <div className="container mx-auto px-4">
          <Skeleton className="h-20 w-64 bg-champagne/50 mb-4" />
          <Skeleton className="h-6 w-96 bg-champagne/50" />
        </div>
      </section>
    );
  }

  if (!developer) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 flex items-center justify-center bg-premium-bg">
        <div className="text-center">
          <h1 className="text-foreground text-2xl mb-4">Developer not found</h1>
          <Link to="/developers" className="text-gold hover:underline">
            Back to Developers
          </Link>
        </div>
      </section>
    );
  }

  const stats = [
    {
      icon: Calendar,
      label: "Founded",
      value: developer.founded_year || null,
    },
    {
      icon: Building2,
      label: "Units Delivered",
      value: developer.completed_projects
        ? `${developer.completed_projects.toLocaleString()}+`
        : null,
    },
    {
      icon: TrendingUp,
      label: "Active Projects",
      value: developer.offplan_projects || projects?.length || null,
    },
    {
      icon: MapPin,
      label: "Headquarters",
      value: developer.headquarters 
        ? (() => {
            const parts = developer.headquarters.split(',').map((s: string) => s.trim());
            return parts.length >= 2 ? `${parts[parts.length - 2]}, ${parts[parts.length - 1]}` : parts[parts.length - 1];
          })()
        : null,
    },
  ].filter(s => s.value !== null);

  return (
    <section className="relative w-full min-h-screen bg-premium-bg">
      {/* Hero section - always visible */}
      <div className="relative w-full h-screen min-h-[500px] overflow-hidden">
        {developer.feature_image_url ? (
          <img
            src={getHighResImageUrl(developer.feature_image_url)}
            alt={`${developer.name} featured project`}
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              // Fallback to original URL if high-res fails
              const img = e.currentTarget;
              if (img.src !== developer.feature_image_url) {
                img.src = developer.feature_image_url!;
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-premium-bg via-premium-bg/60 to-black/30" />
        {/* Hero Title Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center mb-4 drop-shadow-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {developer.name}
          </h1>
          <p className="text-white/80 text-lg md:text-xl text-center max-w-2xl">
            {(developer as any).tagline || `Discover premium developments by ${developer.name}`}
          </p>
        </div>
        <div className="absolute bottom-4 left-4 md:left-8 z-10">
          <Link to="/developers">
            <Button variant="primary" size="sm" className="group">
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Developers</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Content (Layer 2) */}
      <div className="jj-layer-2 mt-6 md:mt-8 mb-12">
        {/* Developer header */}
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Logo plate - Full-fit, no white corners */}
          <div 
            className="w-32 h-32 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{
              background: '#FFFFFF',
              border: '3px solid hsl(42 45% 59%)',
              boxShadow: '0 4px 16px rgba(200,167,102,0.3)'
            }}
          >
            {developer.logo_url ? (
              <img
                src={developer.logo_url}
                alt={`${developer.name} logo`}
                className="w-full h-full object-contain p-2"
                loading="eager"
              />
            ) : (
              <Building2 className="w-10 h-10 text-zinc-400" />
            )}
          </div>

          {/* Text */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2">
              <span className="text-gold">{developer.name.split(" ")[0]}</span>{" "}
              {developer.name.split(" ").slice(1).join(" ")}
            </h1>
            {developer.description && (
              <div className="max-w-3xl">
                <div className={`relative ${!isDevDescExpanded && developer.description.length > 400 ? 'max-h-32 overflow-hidden' : ''}`}>
                  <div 
                    className="text-foreground/75 text-base md:text-lg leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:mb-2"
                    dangerouslySetInnerHTML={{ 
                      __html: renderMarkdownToHtml(formatReellyDescription(developer.description)) 
                    }}
                  />
                  {!isDevDescExpanded && developer.description.length > 400 && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F5F0E6] to-transparent pointer-events-none" />
                  )}
                </div>
                {developer.description.length > 400 && (
                  <button
                    onClick={() => setIsDevDescExpanded(!isDevDescExpanded)}
                    className="flex items-center gap-1 text-gold text-sm font-medium mt-3 hover:underline"
                  >
                    {isDevDescExpanded ? (
                      <><ChevronUp className="w-4 h-4" /> Show Less</>
                    ) : (
                      <><ChevronDown className="w-4 h-4" /> Read More</>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Stats - Aligned consistent layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              {stats.map((stat) => (
                <div 
                  key={stat.label} 
                  className="rounded-xl border-2 border-gold/40 p-4"
                  style={{
                    background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E6 50%, #EDE4D3 100%)',
                    boxShadow: '0 0 15px rgba(200,167,102,0.22), inset 0 1px 2px rgba(255,255,255,0.4)',
                  }}
                >
                  <div className="flex items-center gap-2 text-foreground/70 text-xs uppercase tracking-wide mb-2">
                    <stat.icon className="w-4 h-4 text-gold flex-shrink-0" />
                    <span className="truncate">{stat.label}</span>
                  </div>
                  <p className="text-foreground text-xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Developer Projects Map - Wrapped in error boundary */}
        {projects && projects.length > 0 && (
          <div className="mt-8">
            <MapErrorBoundary>
              <Suspense fallback={<MapLoadingFallback />}>
                <DeveloperProjectsMap
                  developerId={developer.id}
                  developerName={developer.name}
                  projects={projects.map(p => ({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    latitude: p.latitude,
                    longitude: p.longitude,
                    price_from: p.price_from,
                    cover_image_url: p.cover_image_url,
                    location: p.location,
                  }))}
                />
              </Suspense>
            </MapErrorBoundary>
          </div>
        )}

        {/* Projects section */}
        <div className="mt-8">
          {/* Emirates Tabs */}
          <EmiratesTabs
            projects={projects}
            selectedEmirate={selectedEmirate}
            onEmirateSelect={(emirate) => {
              setSelectedEmirate(emirate);
              setFilters({ ...defaultFilters, emirate: emirate });
            }}
          />

          <h2 className="text-foreground text-2xl font-semibold mb-6">
            {selectedEmirate ? `Projects in ${selectedEmirate}` : "All Projects"}
          </h2>

          {/* Sentinel for IntersectionObserver */}
          <div ref={filterSentinelRef} className="h-0" />

          {/* Inline filter bar */}
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-2xl p-4 mb-6">
            <ProjectFilters
              filters={filters}
              onFiltersChange={setFilters}
              communities={communities}
              trendingAreas={trendingAreas}
              developers={allDevelopers}
              showDeveloperFilter={true}
            />
          </div>

          {/* Spacer when filter is fixed to prevent content hiding under it */}
          {isFilterFixed && <div className="h-[100px]" />}

          {/* Fixed portal filter bar — when scrolled past sentinel */}
          {isFilterFixed && createPortal(
            <div className="fixed top-24 sm:top-28 lg:top-32 left-0 right-0 z-[9998] transition-shadow duration-200">
              <div className="mx-1 sm:mx-2 md:mx-3 lg:mx-4 pt-0">
                <div className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 border-t-0 rounded-none p-4 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
            <ProjectFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    communities={communities}
                    trendingAreas={trendingAreas}
                    developers={allDevelopers}
                    showDeveloperFilter={true}
                  />
                </div>
              </div>
            </div>,
            document.body
          )}

          {hasFiltersApplied && (
            <p className="text-foreground/70 mb-6">
              Found <span className="text-gold font-semibold">{filteredProjects.length}</span> project
              {filteredProjects.length !== 1 ? "s" : ""}
            </p>
          )}

          {loadingProjects ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-lg bg-champagne/50" />
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 jj-box-active">
              <Building2 className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-foreground text-xl font-semibold mb-2">
                {hasFiltersApplied
                  ? "No Projects Match Your Filters"
                  : selectedEmirate
                    ? `No Projects in ${selectedEmirate} Yet`
                    : "No Projects Available Yet"}
              </h3>
              <p className="text-foreground/70 mb-4 max-w-md mx-auto">
                {hasFiltersApplied
                  ? "Try adjusting your filters to see more results."
                  : selectedEmirate
                    ? `${developer.name} doesn't have any projects in ${selectedEmirate} at the moment.`
                    : `${developer.name} projects are coming soon. Check back later for updates.`}
              </p>
              {(hasFiltersApplied || selectedEmirate) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setFilters(defaultFilters);
                    setSelectedEmirate(null);
                  }}
                  className="mt-2"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DeveloperDetail;