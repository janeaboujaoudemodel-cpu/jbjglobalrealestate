import { useState, useMemo, useEffect, useRef } from "react";
import VideoBackground from "@/components/VideoBackground";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Search,
  Building2,
  Crown,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useDevelopers, useProjects } from "@/hooks/useProjects";
import DeveloperCard from "@/components/DeveloperCard";
import { SEOHead } from "@/components/SEOHead";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";
import ContinueSearching from "@/components/ContinueSearching";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdvancedFilterPanel from "@/components/filters/AdvancedFilterPanel";
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";

import developersHeroVideoAsset from "@/assets/videos/dubai-landmarks-hero.mp4.asset.json";
const developersHeroVideo = developersHeroVideoAsset.url;

// Developer tier classification for filtering
const TIER_FILTERS = [
  { value: "all", label: "All Tiers" },
  { value: "elite", label: "Elite" },
  { value: "premium", label: "Premium" },
  { value: "top-tier", label: "Top Tier" },
  { value: "established", label: "Established" },
];

const ELITE_DEVELOPERS = ["emaar", "nakheel", "damac", "sobha", "meraas", "aldar", "omniyat", "dubai-properties", "dubai properties", "dubai-holding", "dubai holding"];
const PREMIUM_DEVELOPERS = ["ellington", "binghatti", "danube", "azizi", "select-group", "select group", "deyaar", "majid-al-futtaim", "majid al futtaim", "arada", "nshama", "wasl"];
const TOP_TIER_DEVELOPERS = ["imtiaz", "samana", "tiger", "beyond", "object", "rak-properties", "rak properties", "mag", "meydan", "reportage", "h&h", "h-h"];
const ESTABLISHED_DEVELOPERS = ["aark", "ab-developers", "radiant", "peace homes"];

// Exact order for elite developers at the top of the directory
const ELITE_PRIORITY_ORDER = [
  'emaar', 'omniyat', 'nakheel', 'sobha', 'aldar', 
  'ellington', 'damac', 'meraas', 'dubai-properties'
];

function getDeveloperTierKey(slug: string, name = "", rank?: number | null): string {
  const normalized = `${slug} ${name}`.toLowerCase();
  if (ELITE_DEVELOPERS.some(d => normalized.includes(d))) return "elite";
  if (PREMIUM_DEVELOPERS.some(d => normalized.includes(d))) return "premium";
  if (TOP_TIER_DEVELOPERS.some(d => normalized.includes(d))) return "top-tier";
  if (ESTABLISHED_DEVELOPERS.some(d => normalized.includes(d))) return "established";
  if (rank && rank > 0) {
    if (rank <= 10) return "elite";
    if (rank <= 30) return "premium";
    if (rank <= 80) return "top-tier";
  }
  return "other";
}

const Developers = () => {
  const { data: developers, isLoading, refetch: refetchDevelopers } = useDevelopers();
  const { data: projects } = useProjects();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selectedDeveloper, setSelectedDeveloper] = useState("");
  const [isFilterFixed, setIsFilterFixed] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "alpha" | "most_projects">("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);
  const ITEMS_PER_PAGE = 24;
  const filterSentinelRef = useRef<HTMLDivElement>(null);

  // Toggle header visibility when filter is fixed
  useEffect(() => {
    if (isFilterFixed) {
      document.body.classList.add('filter-bar-fixed');
    } else {
      document.body.classList.remove('filter-bar-fixed');
    }
    return () => document.body.classList.remove('filter-bar-fixed');
  }, [isFilterFixed]);

  // Two-phase scroll-to-fix filter logic
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
  }, []);

  // Developer names list for dropdown
  const developerNames = useMemo(() => {
    if (!developers) return [];
    const sorted = [...developers].sort((a, b) => {
      const aSlug = a.slug?.toLowerCase() || '';
      const bSlug = b.slug?.toLowerCase() || '';
      const aIdx = ELITE_PRIORITY_ORDER.findIndex(d => aSlug.includes(d));
      const bIdx = ELITE_PRIORITY_ORDER.findIndex(d => bSlug.includes(d));
      if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
      if (aIdx >= 0) return -1;
      if (bIdx >= 0) return 1;
      return a.name.localeCompare(b.name);
    });
    return sorted.map(d => d.name);
  }, [developers]);

  // Count projects per developer
  const projectCounts = useMemo(() => {
    if (!projects) return {};
    return projects.reduce<Record<string, number>>((acc, project) => {
      if (project.developer?.id) {
        acc[project.developer.id] = (acc[project.developer.id] || 0) + 1;
      }
      return acc;
    }, {});
  }, [projects]);

  // Top project cover image per developer (used as the card hero photo)
  const topProjectImageByDev = useMemo(() => {
    if (!projects) return {} as Record<string, string>;
    const map: Record<string, string> = {};
    for (const p of projects) {
      const devId = p.developer?.id;
      if (!devId) continue;
      if (map[devId]) continue;
      const img = (p as any).cover_image_url || (p as any).images?.find?.((i: any) => i?.image_url)?.image_url;
      if (img) map[devId] = img;
    }
    return map;
  }, [projects]);


  // Apply filters to developers
  const filteredDevelopers = useMemo(() => {
    if (!developers) return [];
    
    let filtered = [...developers];
    
    // Developer dropdown filter (local)
    if (selectedDeveloper) {
      filtered = filtered.filter(dev => dev.name === selectedDeveloper);
    }

    // Advanced filter: developer name filter from shared AdvancedFilterPanel
    if (shortcutFilters.developers && shortcutFilters.developers.length > 0) {
      filtered = filtered.filter(dev =>
        shortcutFilters.developers.some(d => dev.name.toLowerCase().includes(d.toLowerCase()))
      );
    }
    
    // Search filter (local + advanced) - match name only for accuracy
    const qLocal = searchQuery.trim().toLowerCase();
    const qAdvanced = (shortcutFilters.searchQuery || '').trim().toLowerCase();
    const q = qAdvanced || qLocal;
    if (q) {
      filtered = filtered.filter(dev => dev.name.toLowerCase().includes(q));
      // Sort: name-starts-with first, then name-includes
      filtered.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aStarts = aName.startsWith(q) ? 0 : 1;
        const bStarts = bName.startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return aName.localeCompare(bName);
      });
    }
    
    // Tier filter
    if (tierFilter !== "all") {
      filtered = filtered.filter(dev => 
        getDeveloperTierKey(dev.slug || "", dev.name || "", dev.rank) === tierFilter
      );
    }
    
    // Sort
    if (sortBy === "alpha") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "most_projects") {
      filtered.sort((a, b) => (projectCounts[b.id] || 0) - (projectCounts[a.id] || 0));
    } else {
      filtered.sort((a, b) => {
        const aSlug = a.slug?.toLowerCase() || '';
        const bSlug = b.slug?.toLowerCase() || '';
        const aIdx = ELITE_PRIORITY_ORDER.findIndex(d => aSlug.includes(d));
        const bIdx = ELITE_PRIORITY_ORDER.findIndex(d => bSlug.includes(d));
        if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
        if (aIdx >= 0) return -1;
        if (bIdx >= 0) return 1;
        const aRank = a.rank && a.rank > 0 ? a.rank : 999;
        const bRank = b.rank && b.rank > 0 ? b.rank : 999;
        const rankDiff = aRank - bRank;
        if (rankDiff !== 0) return rankDiff;
        return a.name.localeCompare(b.name);
      });
    }
    
    return filtered;
  }, [developers, searchQuery, tierFilter, selectedDeveloper, sortBy, projectCounts, shortcutFilters.developers, shortcutFilters.searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, tierFilter, selectedDeveloper, sortBy, shortcutFilters]);

  const totalPages = Math.ceil(filteredDevelopers.length / ITEMS_PER_PAGE);
  const paginatedDevelopers = filteredDevelopers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeFilterCount = [
    searchQuery.trim(),
    tierFilter !== "all",
    selectedDeveloper,
    shortcutFilters.developers.length > 0,
    (shortcutFilters.searchQuery || '').trim(),
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setTierFilter("all");
    setSelectedDeveloper("");
    setShortcutFilters(defaultShortcutFilters);
  };

  return (
    <>
      <SEOHead 
        title="UAE Property Developers | JBJ Global Real Estate"
        description="Explore trusted UAE property developers offering off-plan and ready properties. Direct from developers - no secondary market listings."
        keywords="UAE developers, Dubai developers, Emaar, Nakheel, DAMAC, off-plan properties, new developments"
      />
      
      <div data-marketing-page className="min-h-screen bg-[hsl(var(--premium-bg))]">
        {/* Hero Section - Full-width Video */}
        <section data-hero-dark data-on-dark className="jj-hero-fullscreen jj-hero-compact relative flex items-center justify-center overflow-hidden">
          {/* Video Background */}
          <div className="absolute inset-0 bg-[#1A1A1A]">
            <VideoBackground 
              src={developersHeroVideo}
              poster="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Label */}
              <div data-label-emerald-only className="allow-white jj-pill-emerald-metallic inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border-0 backdrop-blur-md shadow-[0_10px_24px_-14px_rgba(0,0,0,0.85)]">
                <Building2 className="w-4 h-4 text-white" />
                <span className="text-white font-semibold text-xs uppercase tracking-[0.2em]">
                  Developer-Direct Properties
                </span>
              </div>
              
              <h1 className="allow-white text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-[-0.02em]">
                UAE's Premier Developers
              </h1>
              
              <p className="allow-white text-white/90 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Explore off-plan and ready properties directly from UAE's most trusted developers. 
                No secondary market — only developer-direct listings.
              </p>
            </motion.div>
          </div>
          
          {/* Scroll indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <span className="allow-white text-white/75 text-xs tracking-widest uppercase">Explore</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-white/45 to-transparent" />
          </motion.div>
        </section>

        {/* Scroll sentinel for two-phase filter fix */}
        <div ref={filterSentinelRef} className="h-0" style={{ background: "linear-gradient(180deg,#064E3B 0%,#042C1C 55%,#031E14 100%)" }} />

        {/* Filters Section — emerald rail (never near-black), no gold/double borders */}
        <section
          className="relative z-40 pt-8 pb-5 border-y border-white/12"
          style={{ background: "linear-gradient(180deg,#064E3B 0%,#042C1C 55%,#031E14 100%)" }}
        >
          <div className="w-full px-3 sm:px-4">
            <div className="p-0">
              <FilterShortcutBar
                variant="dark"
                filters={shortcutFilters}
                onFilterChange={(f) => {
                  setShortcutFilters(f);
                  setSearchQuery(f.searchQuery || '');
                  if (f.sortBy === 'alpha') setSortBy('alpha');
                  else if (f.sortBy === 'most_projects') setSortBy('most_projects');
                  else if (f.sortBy) setSortBy('default');
                }}
                priorityFilter="developers"
                resultsCount={filteredDevelopers.length}
                resultsLabel="Developers"
              />

              {/* Tier filter row */}
              <div className="flex items-center gap-3 flex-wrap mt-3 pt-3 border-t border-white/10">
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] h-11 jj-pill-emerald-metallic allow-white text-white border-0 rounded-full text-sm shadow-md hover:shadow-lg transition-none duration-0 [&>svg]:text-white">
                    <Crown className="w-4 h-4 mr-2 text-white flex-shrink-0" />
                    <span className="truncate text-left flex-1 text-white font-semibold">
                      {TIER_FILTERS.find(t => t.value === tierFilter)?.label || "All Tiers"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none">
                    {TIER_FILTERS.map((tier) => (
                      <SelectItem key={tier.value} value={tier.value}>
                        {tier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex-1 text-white/80 text-sm">
                  {filteredDevelopers.length} developer{filteredDevelopers.length !== 1 ? 's' : ''} found
                  {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
                </div>

                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="allow-white h-9 px-3 bg-[#04241C] border-0 text-white hover:bg-[#064E3B] rounded-full flex items-center gap-1.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)] [&_svg]:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear ({activeFilterCount})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Filter Panel */}
        <AdvancedFilterPanel
          open={advancedOpen}
          onOpenChange={setAdvancedOpen}
          filters={shortcutFilters}
          onFilterChange={setShortcutFilters}
        />

        {/* Fixed portal copy of filters when scrolled past —
            rendered into #root so the .jj-utility-shell sidebar-safe left
            offset applies and the bar stops before the vertical sidebar. */}
        {isFilterFixed && createPortal(
          <section className="jj-utility-shell fixed top-[88px] right-0 z-[9998] backdrop-blur-md py-3 border-b border-white/12 shadow-lg" style={{ background: "linear-gradient(180deg,#064E3B 0%,#042C1C 55%,#031E14 100%)" }}>
            <div className="w-full px-3 sm:px-4">
              <div className="p-0">
                <FilterShortcutBar
                  variant="dark"
                  filters={shortcutFilters}
                  onFilterChange={(f) => {
                    setShortcutFilters(f);
                    setSearchQuery(f.searchQuery || '');
                    if (f.sortBy === 'alpha') setSortBy('alpha');
                    else if (f.sortBy === 'most_projects') setSortBy('most_projects');
                    else if (f.sortBy) setSortBy('default');
                  }}
                  priorityFilter="developers"
                  resultsCount={filteredDevelopers.length}
                  resultsLabel="Developers"
                />

                <div className="flex items-center gap-3 flex-wrap mt-3 pt-3 border-t border-white/10">
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger className="w-full sm:w-[200px] h-11 jj-pill-emerald-metallic allow-white text-white border-0 rounded-full text-sm shadow-md transition-none duration-0 [&>svg]:text-white">
                      <Crown className="w-4 h-4 mr-2 text-white flex-shrink-0" />
                      <span className="truncate text-left flex-1 text-white font-semibold">
                        {TIER_FILTERS.find(t => t.value === tierFilter)?.label || "All Tiers"}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none">
                      {TIER_FILTERS.map((tier) => (
                        <SelectItem key={tier.value} value={tier.value}>
                          {tier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex-1 text-white/80 text-sm">
                    {filteredDevelopers.length} developer{filteredDevelopers.length !== 1 ? 's' : ''} found
                  </div>

                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="allow-white h-9 px-3 bg-[#04241C] border-0 text-white hover:bg-[#064E3B] rounded-full flex items-center gap-1.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)] [&_svg]:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear ({activeFilterCount})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>,
          document.getElementById('root') || document.body
        )}

        {/* Developer Cards Grid */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-0">{/* Edge-to-edge container */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className="h-[280px] rounded-xl bg-[#04241C]/50 animate-pulse"
                    style={{ border: '2px solid rgba(255,255,255,0.12)' }}
                  />
                ))}
              </div>
            ) : filteredDevelopers.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-[#064E3B]/25 rounded-xl bg-premium-card/50">
                <Building2 className="w-20 h-20 text-[#1A1A1A]/70 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-foreground mb-3">No Developers Found</h3>
                <p className="text-foreground/70 max-w-lg mx-auto mb-6">
                  {activeFilterCount > 0 
                    ? "Try adjusting your search or filter criteria."
                    : "Having trouble loading developers. Please try again."}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {activeFilterCount > 0 && (
                    <Button variant="secondary" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => refetchDevelopers()} className="border-[#064E3B]/25 text-[#1A1A1A] hover:bg-[#064E3B]/10">
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                  {paginatedDevelopers.map((developer, idx) => (
                    <DeveloperCard 
                      key={developer.id} 
                      developer={developer} 
                      projectCount={projectCounts[developer.id] || 0}
                      heroImageUrl={developer.feature_image_url || topProjectImageByDev[developer.id]}
                      index={(currentPage - 1) * ITEMS_PER_PAGE + idx}
                    />
                  ))}
                </div>


                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                      className="border-[#064E3B]/25 text-foreground"
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                      .reduce<(number | string)[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        typeof p === 'string' ? (
                          <span key={`dot-${i}`} className="px-1 text-foreground/50">…</span>
                        ) : (
                          <Button
                            key={p}
                            variant={p === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => { setCurrentPage(p); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                            className={p === currentPage ? "jj-pill-emerald-metallic allow-white text-white border-0" : "border-[#064E3B]/25 text-foreground"}
                          >
                            {p}
                          </Button>
                        )
                      )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                      className="border-[#064E3B]/25 text-foreground"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Continue Searching - Recently viewed developers */}
        <ContinueSearching type="developer" />

        {/* DLD Market Intelligence */}
        <DLDMarketWidget />
      </div>
    </>
  );
};

export default Developers;
