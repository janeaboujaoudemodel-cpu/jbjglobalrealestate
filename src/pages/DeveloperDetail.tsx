import { useState, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import { useDeveloper, useProjectsByDeveloper, useCommunities, useTrendingAreas, useDevelopers } from "@/hooks/useProjects";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useFilteredProjects, defaultFilters } from "@/hooks/useProjectFilters";
import { type FilterState } from "@/components/ProjectFilters";
import ProjectCard from "@/components/ProjectCard";
import EmiratesTabs from "@/components/EmiratesTabs";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Building2, MapPin, Calendar, TrendingUp, MapIcon, ChevronDown, ChevronUp, Search } from "lucide-react";
import { getHighResImageUrl } from "@/lib/imageUtils";
import { Button } from "@/components/ui/button";
import { renderMarkdownToHtml, formatReellyDescription } from "@/lib/markdownUtils";
import { DeveloperAIAnalyzer } from "@/components/developer/DeveloperAIAnalyzer";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";
import { SectionDivider } from "@/components/ui/section-divider";
import RecommendedDevelopers from "@/components/developer/RecommendedDevelopers";
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";
import { applyShortcutFilters } from "@/utils/applyShortcutFilters";
import { Input } from "@/components/ui/input";

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
  const { trackView } = useRecentSearches();

  // Track developer view
  useEffect(() => {
    if (!developer) return;
    trackView({
      id: developer.id,
      type: "developer",
      name: developer.name,
      slug: developer.slug || slug || "",
      imageUrl: (developer as any).logo_url || undefined,
      subtitle: `${projects?.length || 0} Projects`,
    });
  }, [developer, projects?.length]);

  const [filters, setFilters] = useState<FilterState>(() => {
    const storedCurrency = typeof window !== 'undefined' ? localStorage.getItem('jj_currency') : null;
    return { ...(defaultFilters as unknown as FilterState), currency: (storedCurrency || 'AED') as any };
  });

  // Sync currency with global switcher
  useEffect(() => {
    const handler = (e: Event) => {
      const code = (e as CustomEvent).detail;
      if (code) setFilters(prev => ({ ...prev, currency: code }));
    };
    window.addEventListener('currencyChange', handler);
    return () => window.removeEventListener('currencyChange', handler);
  }, []);
  const [selectedEmirate, setSelectedEmirate] = useState<string | null>(null);
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);
  const [isDevDescExpanded, setIsDevDescExpanded] = useState(false);
  const [isFilterFixed, setIsFilterFixed] = useState(false);
  const [bottomReached, setBottomReached] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
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

  // Bottom sentinel: hide fixed bar when "Ready to Get Started" enters viewport
  useEffect(() => {
    const target = document.getElementById('ready-to-get-started');
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setBottomReached(entry.isIntersecting || entry.boundingClientRect.top < 0),
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Signal GlobalHeader to hide when filter bar is fixed
  useEffect(() => {
    if (isFilterFixed && !bottomReached) {
      document.body.classList.add('filter-bar-fixed');
    } else {
      document.body.classList.remove('filter-bar-fixed');
    }
    return () => document.body.classList.remove('filter-bar-fixed');
  }, [isFilterFixed, bottomReached]);

  // Reset showAll when filters or developer changes
  useEffect(() => { setShowAllProjects(false); }, [slug, selectedEmirate, filters]);

  // Apply emirate filter first, then apply other filters
  const projectsInEmirate = useMemo(() => {
    if (!projects) return [];
    if (!selectedEmirate) return projects;
    return projects.filter((p) => p.emirate === selectedEmirate);
  }, [projects, selectedEmirate]);

  const filteredProjectsBase = useFilteredProjects(projectsInEmirate, filters);
  const filteredProjects = useMemo(() => applyShortcutFilters(filteredProjectsBase, shortcutFilters), [filteredProjectsBase, shortcutFilters]);

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
      <div className="jj-layer-2 mt-6 md:mt-8 mb-12" style={{ marginLeft: 0, marginRight: 0, borderRadius: 0, border: 'none' }}>
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
                className="w-full h-full object-contain"
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

        {/* AI Analyzer - Before Projects */}
        <DeveloperAIAnalyzer
          developerName={developer.name}
          developerSlug={slug}
          foundedYear={developer.founded_year}
          headquarters={developer.headquarters}
          completedProjects={developer.completed_projects}
          activeProjects={developer.offplan_projects || projects?.length}
          projectCount={projects?.length}
        />

        {/* Projects section */}
        <div className="mt-8">
          {/* Emirates Tabs */}
          <EmiratesTabs
            projects={projects}
            selectedEmirate={selectedEmirate}
            onEmirateSelect={(emirate) => {
              setSelectedEmirate(emirate);
              setFilters({ ...defaultFilters as unknown as FilterState, emirate: emirate });
            }}
          />

          <h2 className="text-foreground text-2xl font-semibold mb-6">
            {selectedEmirate ? `Projects in ${selectedEmirate}` : "All Projects"}
          </h2>

          {/* Sentinel for IntersectionObserver */}
          <div ref={filterSentinelRef} className="h-0" />

          {/* Inline filter bar — 2 rows only */}
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-2xl p-2 sm:p-4 mb-6 overflow-x-auto scrollbar-hide">
            <FilterShortcutBar
              variant="light"
              filters={shortcutFilters}
              onFilterChange={setShortcutFilters}
              searchSlot={
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search projects..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="h-8 pl-8 pr-2 text-xs w-full bg-white border-gold/30"
                  />
                </div>
              }
            />
          </div>

          {/* Spacer when filter is fixed to prevent content hiding under it */}
          {isFilterFixed && <div className="h-[100px]" />}

          {/* Fixed portal filter bar — when scrolled past sentinel */}
          {isFilterFixed && !bottomReached && createPortal(
            <div className="fixed top-0 left-0 right-0 z-[9998] transition-shadow duration-200">
              <div className="mx-0 pt-0">
                <div className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-b border-gold/30 p-2 sm:p-4 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
                  <FilterShortcutBar
                    variant="light"
                    filters={shortcutFilters}
                    onFilterChange={setShortcutFilters}
                    searchSlot={
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="Search projects..."
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          className="h-8 pl-8 pr-2 text-xs w-full bg-white border-gold/30"
                        />
                      </div>
                    }
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
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(showAllProjects ? filteredProjects : filteredProjects.slice(0, 9)).map((project) => (
                  <ProjectCard key={project.id} project={project} currency={filters.currency} sizeUnit={filters.sizeUnit} />
                ))}
              </div>
              {!showAllProjects && filteredProjects.length > 9 && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => setShowAllProjects(true)}
                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold tracking-wide rounded-xl transition-all duration-300 border-2 border-gold/40 hover:border-gold/80 hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E6 50%, #EDE4D3 100%)',
                      boxShadow: '0 4px 20px rgba(200,167,102,0.2)',
                    }}
                  >
                    <span className="text-foreground">
                      Explore All {filteredProjects.length} {developer.name} Projects
                    </span>
                    <ChevronDown className="w-5 h-5 text-gold group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </div>
              )}
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
                    setFilters(defaultFilters as unknown as FilterState);
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

        {/* Divider between projects and recommendations */}
        <div className="py-10 md:py-14">
          <div className="flex items-center justify-center gap-6">
            <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
            <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
          </div>
        </div>

        {/* Similar Developers */}
        <RecommendedDevelopers
          currentDeveloperSlug={slug || ""}
          currentDeveloperEmirate={developer?.headquarters || null}
        />

        {/* DLD Market Widget - Live transaction data */}
        <DLDMarketWidget />
      </div>
    </section>
  );
};

export default DeveloperDetail;