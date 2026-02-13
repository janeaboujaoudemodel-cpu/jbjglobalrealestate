import { useState, useMemo, useEffect, Fragment, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, 
  X, 
  MessageCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

import ReellyProjectCard from "@/components/ReellyProjectCard";
import { ProjectGridSkeleton } from "@/components/ProjectCardSkeleton";
import { useReellyProjects, flattenReellyProjects, getReellyProjectsTotal } from "@/hooks/useReellyProjects";
import { useDevelopers, useProjectsListing } from "@/hooks/useProjects";
import { useLocalProjectSearch } from "@/hooks/useLocalProjectSearch";
import { mapDbProjectToReellyProject } from "@/utils/mapDbToReellyProject";
import { applyShortcutFilters } from "@/utils/applyShortcutFilters";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import { SEOHead } from "@/components/SEOHead";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";
import { FeaturedProjectAd, FEATURED_ADS } from "@/components/FeaturedProjectAd";
import { blueprintPagesSEO } from "@/types/blueprint";
import PropertiesHeroVideo from "@/components/PropertiesHeroVideo";
// CurrencyTooltip removed - mispositioned
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";
import PropertiesVerticalNav from "@/components/navigation/PropertiesVerticalNav";
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

const PropertiesReelly = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const { data: developers } = useDevelopers();
  
  // Database as PRIMARY source (always available, 2,410+ projects)
  const { data: dbProjects, isLoading: isDbLoading } = useProjectsListing();
  
  // Display currency/size preferences
  const [currency, setCurrency] = useState<ExtendedCurrency>('AED');
  const [sizeUnit, setSizeUnit] = useState<'sqft' | 'sqm'>('sqft');

  // Map mode state — local state for instant toggle
  const [isMapMode, setIsMapMode] = useState(searchParams.get('view') === 'map');

  // Filter shortcut bar state (single unified filter system)
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);

  // Fixed filter / header replacement
  const [isFilterFixed, setIsFilterFixed] = useState(false);
  const filterSentinelRef = useRef<HTMLDivElement>(null);

  // Map hover state
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  // Toggle map mode — local state only for instant response, URL update is secondary
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

  // IntersectionObserver for filter fixed state
  useEffect(() => {
    const sentinel = filterSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsFilterFixed(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Sync body class for GlobalHeader hide
  useEffect(() => {
    if (isFilterFixed) {
      document.body.classList.add('filter-bar-fixed');
    } else {
      document.body.classList.remove('filter-bar-fixed');
    }
    return () => document.body.classList.remove('filter-bar-fixed');
  }, [isFilterFixed]);

  // Fetch projects from API (enrichment layer — may return 0 if expired)
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

  // Apply shortcut filters to merged projects
  const projects = useMemo(() => {
    return applyShortcutFilters(mergedProjects, shortcutFilters);
  }, [mergedProjects, shortcutFilters]);

  // Total count: always reflect the full database count
  const totalCount = dbProjectsMapped.length || mergedProjects.length;

  // Apply URL params on mount (map to shortcut filters)
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
        <div className="relative z-10 container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
           <div 
               className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
               style={{
                 background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                 backdropFilter: 'blur(20px)',
                 border: '1.5px solid rgba(200,167,102,0.6)',
                 boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)',
               }}
             >
               <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
               <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Premium Curated Listings</span>
             </div>
            
            <h1 
              className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 tracking-[-0.02em]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Curated Listings. Global Standard.
            </h1>
            
             <p className="text-zinc-300 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed">
               {totalCount > 0 ? `${totalCount.toLocaleString()} properties available` : (isLoading || isDbLoading) ? 'Loading properties...' : 'Browse our collection'}
            </p>
          </motion.div>
        </div>
      </PropertiesHeroVideo>

      {/* Sentinel for IntersectionObserver - marks where filter section starts */}
      <div ref={filterSentinelRef} className="h-0 w-full" />

      {/* Single Unified FilterShortcutBar */}
      <section className={`${isFilterFixed ? 'fixed top-0 z-[9998]' : 'sticky top-14 sm:top-16 md:top-20 lg:top-[72px] z-40'} bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark py-2 border-b border-gold/30`} style={{ WebkitOverflowScrolling: 'touch', ...(isFilterFixed ? { left: isMapMode ? '0' : '200px', right: '0' } : {}) }}>
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

      {/* Divider */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Results Section - split-screen in map mode */}
      {isMapMode ? (
        <section className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
          <div className="flex h-full">
            {/* Content area: 50/50 split between cards and map — NO vertical nav in map mode */}
            <div className="flex-1 flex h-full">
              {/* Left: Scrollable card list — 50% */}
              <div className="w-1/2 h-full overflow-y-auto bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark">
                <div className="p-4">
                  {/* Results Count */}
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

                  {hasNextPage && (
                    <div className="flex justify-center py-6">
                      <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="primary" className="h-10 px-6 gap-2">
                        {isFetchingNextPage ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> : 'Load More'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Map — 50% */}
              <div className="w-1/2 h-full">
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
      /* Standard list mode */
        <section className="py-12 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark">
          <div className="flex">
            {/* Vertical Nav (desktop, when filter fixed) — full height fixed sidebar */}
            {isFilterFixed && (
              <div className="hidden lg:block flex-shrink-0 w-[200px]">
                <div className="fixed top-0 left-0 h-screen z-[9999]">
                  <PropertiesVerticalNav />
                </div>
              </div>
            )}

            <div className="flex-1 container mx-auto px-3 sm:px-4">
              <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl p-4 sm:p-5">
                
                {/* Results Count */}
                <div className="mb-6 flex items-center justify-between px-4 pt-4">
                  <p className="text-black/70">
                    Showing <span className="text-gold font-medium">{sortedProjects.length}</span> of{' '}
                    <span className="text-gold font-medium">{totalCount.toLocaleString()}</span> properties
                  </p>
                </div>

                {/* Projects Grid */}
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
                ) : sortedProjects.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 p-4">
                      {sortedProjects.map((project, index) => {
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

                    {/* Load More Button */}
                    {hasNextPage && (
                      <div className="flex justify-center py-8">
                        <Button
                          onClick={() => fetchNextPage()}
                          disabled={isFetchingNextPage}
                          variant="primary"
                          className="h-12 px-8 gap-2"
                        >
                          {isFetchingNextPage ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading more...
                            </>
                          ) : (
                            <>
                              Load More Projects
                              <span className="text-xs opacity-70">
                                ({totalCount - sortedProjects.length} remaining)
                              </span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {isFetchingNextPage && <ProjectGridSkeleton count={3} />}
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
            </div>
          </div>
        </section>
      )}

      {/* DLD Market Intelligence - hidden in map mode */}
      {!isMapMode && <DLDMarketWidget />}
       </div>
     </>
   );
};

export default PropertiesReelly;
