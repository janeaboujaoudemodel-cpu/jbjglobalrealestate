import { useState, useMemo, useEffect, Fragment, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Search, 
  X, 
  MessageCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

import ReellyProjectCard from "@/components/ReellyProjectCard";
import { ProjectGridSkeleton } from "@/components/ProjectCardSkeleton";
import { useReellyProjects, flattenReellyProjects } from "@/hooks/useReellyProjects";
import { useDevelopers, useProjectsListing } from "@/hooks/useProjects";
import { useLocalProjectSearch } from "@/hooks/useLocalProjectSearch";
import { mapDbProjectToReellyProject } from "@/utils/mapDbToReellyProject";
import { applyShortcutFilters } from "@/utils/applyShortcutFilters";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import { SEOHead } from "@/components/SEOHead";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";
import { FeaturedProjectAd, FEATURED_ADS } from "@/components/FeaturedProjectAd";
import { blueprintPagesSEO } from "@/types/blueprint";
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";
import PropertiesVerticalNav from "@/components/navigation/PropertiesVerticalNav";
import PropertiesHeroVideo from "@/components/PropertiesHeroVideo";
import HeroButton from "@/components/ui/hero-button";
import PropertiesMapView from "@/components/maps/PropertiesMapView";
import type { UnifiedProject } from "@/types/unifiedProject";
import type { ReellyProject } from "@/hooks/useReellyProjects";

// Currency conversion rates - 10 unified currencies
const CURRENCY_RATES: Record<string, number> = {
  AED: 1, USD: 0.27, EUR: 0.25, GBP: 0.21, INR: 22.5,
  SAR: 1.02, CNY: 1.98, RUB: 24.5, CAD: 0.37, AUD: 0.42,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: 'AED', USD: '$', EUR: '€', GBP: '£', INR: '₹',
  SAR: 'SAR', CNY: '¥', RUB: '₽', CAD: 'C$', AUD: 'A$',
};

type ExtendedCurrency = 'AED' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'SAR' | 'CNY' | 'RUB' | 'CAD' | 'AUD';

const ITEMS_PER_PAGE = 24;

/** Convert ReellyProject to UnifiedProject for map component */
function toUnifiedProject(p: ReellyProject): UnifiedProject {
  return {
    id: String(p.id),
    name: p.name,
    slug: p.slug,
    source: 'reelly',
    developer_name: p.developer_name,
    latitude: p.latitude,
    longitude: p.longitude,
    price_from: p.price_from,
    handover_date: p.handover_date,
    cover_image_url: p.thumbnail || (p.images?.[0]?.image_url ?? null),
    created_at: '',
    updated_at: '',
  };
}

/** Generate page numbers with ellipsis */
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [];
  pages.push(1);
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

const PropertiesReelly = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const { data: developers } = useDevelopers();
  
  // Database as PRIMARY source (always available, 2,410+ projects)
  const { data: dbProjects, isLoading: isDbLoading } = useProjectsListing();
  
  // Display currency/size preferences
  const [currency, setCurrency] = useState<ExtendedCurrency>('AED');
  const [sizeUnit, setSizeUnit] = useState<'sqft' | 'sqm'>('sqft');

  // Map mode state
  const [isMapMode, setIsMapMode] = useState(searchParams.get('view') === 'map');

  // Filter shortcut bar state
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Map hover state
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  // Scroll-based transition: hero visible = horizontal header, scrolled past = vertical nav + filter bar
  const [showStickyNav, setShowStickyNav] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const threshold = window.innerHeight - 150;
      const shouldShow = window.scrollY > threshold;
      setShowStickyNav(shouldShow);
      if (shouldShow) {
        document.body.classList.add('filter-bar-fixed');
      } else {
        document.body.classList.remove('filter-bar-fixed');
      }
    };
    // Initial check
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.body.classList.remove('filter-bar-fixed');
    };
  }, []);

  // Toggle map mode
  const handleMapToggle = useCallback((active: boolean) => {
    setIsMapMode(active);
    const params = new URLSearchParams(searchParams);
    if (active) {
      params.set('view', 'map');
    } else {
      params.delete('view');
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  // Fetch projects from API (enrichment layer)
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReellyProjects({});

  // Local DB fallback search
  const debouncedSearch = shortcutFilters.searchQuery || '';
  const { data: localResults } = useLocalProjectSearch(debouncedSearch);

  // Convert DB projects to ReellyProject format
  const dbProjectsMapped = useMemo(() => {
    if (!dbProjects?.length) return [];
    return dbProjects.map(mapDbProjectToReellyProject);
  }, [dbProjects]);

  // Flatten paginated API data
  const reellyProjects = flattenReellyProjects(data);

  // Merge: DB is primary, API enriches/overrides when available
  const mergedProjects = useMemo(() => {
    if (reellyProjects.length > 0) {
      const apiBySlug = new Map(reellyProjects.map(p => [p.slug, p]));
      const merged = new Map<string, ReellyProject>();
      
      for (const dbP of dbProjectsMapped) {
        const apiP = apiBySlug.get(dbP.slug);
        merged.set(dbP.slug, apiP || dbP);
      }
      for (const apiP of reellyProjects) {
        if (!merged.has(apiP.slug)) {
          merged.set(apiP.slug, apiP);
        }
      }
      return Array.from(merged.values());
    }
    return dbProjectsMapped;
  }, [dbProjectsMapped, reellyProjects]);

  // Apply shortcut filters to merged projects, prioritize projects with images
  const projects = useMemo(() => {
    const filtered = applyShortcutFilters(mergedProjects, shortcutFilters);
    // When no explicit sort is set, push imageless projects to the end
    if (!shortcutFilters.sortBy || shortcutFilters.sortBy === 'newest') {
      return filtered.sort((a, b) => {
        const aHasImg = a.thumbnail || a.images?.length ? 1 : 0;
        const bHasImg = b.thumbnail || b.images?.length ? 1 : 0;
        return bHasImg - aHasImg;
      });
    }
    return filtered;
  }, [mergedProjects, shortcutFilters]);

  // Total count
  const totalCount = dbProjectsMapped.length || mergedProjects.length;

  // Apply URL params on mount
  useEffect(() => {
    const keywordParam = searchParams.get('q') || searchParams.get('keyword') || searchParams.get('search');
    const emirateParam = searchParams.get('emirate') || searchParams.get('location');
    const areaParam = searchParams.get('area');
    const statusParam = searchParams.get('saleStatus') || searchParams.get('status');
    const constructionParam = searchParams.get('constructionStatus');
    const developerParam = searchParams.get('developer');
    
    const areaSearch = areaParam
      ? areaParam.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : null;
    
    if (keywordParam || emirateParam || statusParam || constructionParam || areaSearch || developerParam) {
      setShortcutFilters(prev => ({
        ...prev,
        searchQuery: keywordParam ?? areaSearch ?? '',
        emirates: emirateParam ? [emirateParam] : [],
        statuses: statusParam ? [statusParam] : [],
        constructionStatuses: constructionParam ? [constructionParam] : [],
        developers: developerParam ? [developerParam] : [],
      }));
    }
  }, [searchParams]);

  // Sort projects — sold-out always at bottom
  const sortedProjects = useMemo(() => {
    let sorted = [...projects];
    sorted.sort((a, b) => {
      const aIsSold = (a.sale_status || a.status_label || '').toLowerCase();
      const bIsSold = (b.sale_status || b.status_label || '').toLowerCase();
      const aSold = aIsSold.includes('sold') || aIsSold.includes('out of stock');
      const bSold = bIsSold.includes('sold') || bIsSold.includes('out of stock');
      if (aSold === bSold) return 0;
      return aSold ? 1 : -1;
    });
    return sorted;
  }, [projects]);

  // Pagination logic
  const totalPages = Math.ceil(sortedProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProjects, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [shortcutFilters]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Convert for map
  const unifiedProjects = useMemo(() => 
    sortedProjects.map(toUnifiedProject),
    [sortedProjects]
  );

  const dynamicSEO = blueprintPagesSEO.buyListings;

  return (
    <>
      <SEOHead 
        title={dynamicSEO.title}
        description={dynamicSEO.metaDescription}
      />
      <div className="min-h-screen bg-[hsl(var(--premium-bg))]">

      {/* Hero Section */}
      <PropertiesHeroVideo>
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Discover Dubai's Finest <span className="text-gold">Off-Plan</span> Properties
          </h1>
          <p className="text-white/80 text-sm sm:text-base md:text-lg mb-6 max-w-xl">
            Browse {totalCount.toLocaleString()} curated developments from Dubai's top developers
          </p>
          <div className="flex flex-wrap gap-3">
            <HeroButton href="/properties?status=off-plan">New Launches</HeroButton>
            <HeroButton href="/developers">Top Developers</HeroButton>
            <HeroButton href="/areas">Explore Areas</HeroButton>
          </div>
        </div>
      </PropertiesHeroVideo>

      {/* Vertical Nav — only visible after scrolling past hero */}
      {showStickyNav && (
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-[9999]">
        <PropertiesVerticalNav />
      </div>
      )}

      {/* Single Unified FilterShortcutBar — only fixed after scrolling past hero */}
      {showStickyNav && (
      <section 
        className={cn(
          "fixed top-0 z-[9998] bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark py-2 border-b border-gold/30 right-0",
          isMapMode ? "left-0" : "left-0 lg:left-[200px]"
        )}
      >
        <div className="container mx-auto px-3 sm:px-4">
          <FilterShortcutBar
            variant="light"
            filters={shortcutFilters}
            onFilterChange={setShortcutFilters}
            isMapMode={isMapMode}
            onMapToggle={handleMapToggle}
            searchSlot={
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
                <input
                  type="text"
                  placeholder="Search area, project or keyword..."
                  value={shortcutFilters.searchQuery}
                  onChange={(e) => setShortcutFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="w-full h-full pl-9 pr-3 py-2.5 text-xs text-black bg-transparent border-0 outline-none placeholder:text-black/40 focus:ring-0"
                />
              </div>
            }
          />
        </div>
      </section>
      )}

      {/* Spacer for fixed filter bar — only when sticky nav is shown */}
      {showStickyNav && <div className="h-[60px]" />}

      {/* Divider */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Results Section - split-screen in map mode */}
      {isMapMode ? (
        <section className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
          <div className="flex flex-col md:flex-row h-full">
            <div className="flex-1 flex flex-col md:flex-row h-full">
              {/* Left: Scrollable card list */}
              <div className="w-full md:w-1/2 h-[50%] md:h-full overflow-y-auto bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark">
                <div className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-black/70 text-sm">
                      Showing <span className="text-gold font-medium">{sortedProjects.length}</span> of{' '}
                      <span className="text-gold font-medium">{totalCount.toLocaleString()}</span> properties
                    </p>
                  </div>

                  {(isLoading && isDbLoading) ? (
                    <ProjectGridSkeleton count={4} />
                  ) : sortedProjects.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {sortedProjects.map((project) => (
                        <ReellyProjectCard
                          key={project.id}
                          project={project}
                          currency={currency}
                          sizeUnit={sizeUnit}
                          compact
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="w-10 h-10 text-gold mx-auto mb-3" />
                      <p className="text-black/60">No properties found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Map */}
              <div className="w-full md:w-1/2 h-[50%] md:h-full">
                <PropertiesMapView
                  projects={unifiedProjects}
                  hoveredProjectId={hoveredProjectId}
                  onProjectHover={setHoveredProjectId}
                  onProjectClick={(id) => {
                    const project = sortedProjects.find(p => String(p.id) === id);
                    if (project) window.open(`/project/${project.slug}`, '_blank');
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      ) : (
      /* Standard list mode — edge-to-edge background, 2-col grid, pagination */
        <section className="py-8 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark min-h-screen">
          <div className={`${showStickyNav ? 'lg:pl-[200px]' : ''} px-4 sm:px-6 lg:px-8`}>
            
            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-black/70">
                Showing <span className="text-gold font-medium">{paginatedProjects.length}</span> of{' '}
                <span className="text-gold font-medium">{sortedProjects.length.toLocaleString()}</span> properties
                {totalPages > 1 && (
                  <span className="text-black/40 ml-2">· Page {currentPage} of {totalPages}</span>
                )}
              </p>
            </div>

            {/* Projects Grid — 2 columns max */}
            {(isLoading && isDbLoading) ? (
              <ProjectGridSkeleton count={6} />
            ) : isError ? (
              <div className="text-center py-20 px-4">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-200">
                  <X className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">Failed to Load Properties</h3>
                <p className="text-zinc-600 mb-4">{error?.message || 'Something went wrong. Please try again.'}</p>
                <Button onClick={() => window.location.reload()} variant="primary">
                  Retry
                </Button>
              </div>
            ) : paginatedProjects.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                  {paginatedProjects.map((project, index) => {
                    const adAfterIndex = [5, 11, 17];
                    const adIndex = adAfterIndex.indexOf(index);
                    const featuredAd = adIndex !== -1 && FEATURED_ADS[adIndex] ? FEATURED_ADS[adIndex] : null;
                    
                    return (
                      <Fragment key={project.id}>
                        <ReellyProjectCard 
                          project={project} 
                          currency={currency}
                          sizeUnit={sizeUnit}
                        />
                        {featuredAd && (
                          <FeaturedProjectAd
                            key={`ad-${featuredAd.id}`}
                            title={featuredAd.title}
                            subtitle={featuredAd.subtitle}
                            description={featuredAd.description}
                            imageUrl={featuredAd.imageUrl}
                            projectSlug={featuredAd.projectSlug}
                            ctaText={featuredAd.ctaText}
                          />
                        )}
                      </Fragment>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-10 pb-4">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-gold/30 bg-white/60 text-black/70 hover:bg-gold hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                      page === 'ellipsis' ? (
                        <span key={`e-${idx}`} className="px-2 text-black/40">…</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                            page === currentPage
                              ? 'bg-gold text-black shadow-md'
                              : 'bg-white/60 border border-gold/30 text-black/70 hover:bg-gold/20'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-gold/30 bg-white/60 text-black/70 hover:bg-gold hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 px-4">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/30 shadow-[0_0_30px_rgba(200,167,102,0.3)]">
                  <Search className="w-10 h-10 text-gold drop-shadow-[0_0_8px_rgba(200,167,102,0.5)]" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">No Properties Found</h3>
                <p className="text-zinc-600 mb-4">Try adjusting your search filters or browse all properties.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button onClick={() => setShortcutFilters(defaultShortcutFilters)} variant="primary" className="h-12 px-8">
                    Browse All Properties
                  </Button>
                  <Button asChild variant="outline" className="border-zinc-300 text-black hover:bg-zinc-100 h-12 px-6">
                    <a 
                      href={getWhatsAppUrl("Hi, I'm looking for properties but couldn't find what I need. Can you help?")}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact Us
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* DLD Market Intelligence - hidden in map mode */}
      {!isMapMode && (
        <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark">
          <div className={`${showStickyNav ? 'lg:pl-[200px]' : ''}`}>
            <DLDMarketWidget />
          </div>
        </div>
      )}
       </div>
     </>
   );
};

export default PropertiesReelly;
