import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Search,
  Building2,
  Crown,
  X,
} from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useDevelopers, useProjects } from "@/hooks/useProjects";
import DeveloperCard from "@/components/DeveloperCard";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import developersHeroVideo from "@/assets/videos/burj-khalifa-day-to-night.mp4";

// Developer tier classification for filtering
const TIER_FILTERS = [
  { value: "all", label: "All Tiers" },
  { value: "elite", label: "Elite" },
  { value: "premium", label: "Premium" },
  { value: "top-tier", label: "Top Tier" },
  { value: "established", label: "Established" },
];

const ELITE_DEVELOPERS = ["emaar", "nakheel", "damac", "sobha", "meraas", "aldar", "omniyat"];
const PREMIUM_DEVELOPERS = ["ellington"];
const TOP_TIER_DEVELOPERS = ["binghatti", "majid-al-futtaim", "majid al futtaim"];
const ESTABLISHED_DEVELOPERS = ["danube", "azizi"];

// Exact order for elite developers at the top of the directory
const ELITE_PRIORITY_ORDER = [
  'emaar', 'omniyat', 'nakheel', 'sobha', 'aldar', 
  'ellington', 'damac', 'meraas', 'dubai-properties'
];

function getDeveloperTierKey(slug: string): string {
  const normalizedSlug = slug.toLowerCase();
  if (ELITE_DEVELOPERS.some(d => normalizedSlug.includes(d))) return "elite";
  if (PREMIUM_DEVELOPERS.some(d => normalizedSlug.includes(d))) return "premium";
  if (TOP_TIER_DEVELOPERS.some(d => normalizedSlug.includes(d))) return "top-tier";
  if (ESTABLISHED_DEVELOPERS.some(d => normalizedSlug.includes(d))) return "established";
  return "other";
}

const Developers = () => {
  const { data: developers, isLoading } = useDevelopers();
  const { data: projects } = useProjects();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selectedDeveloper, setSelectedDeveloper] = useState("");
  const [isFilterFixed, setIsFilterFixed] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "alpha" | "most_projects">("default");
  const filterSentinelRef = useRef<HTMLDivElement>(null);

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

  // Apply filters to developers
  const filteredDevelopers = useMemo(() => {
    if (!developers) return [];
    
    let filtered = [...developers];
    
    // Developer dropdown filter
    if (selectedDeveloper) {
      filtered = filtered.filter(dev => dev.name === selectedDeveloper);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(dev => 
        dev.name.toLowerCase().includes(query) ||
        (dev.description?.toLowerCase().includes(query)) ||
        (dev.headquarters?.toLowerCase().includes(query))
      );
    }
    
    // Tier filter
    if (tierFilter !== "all") {
      filtered = filtered.filter(dev => 
        getDeveloperTierKey(dev.slug || "") === tierFilter
      );
    }
    
    // Sort based on selected sort option
    if (sortBy === "alpha") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "most_projects") {
      filtered.sort((a, b) => (projectCounts[b.id] || 0) - (projectCounts[a.id] || 0));
    } else {
      // Default: Elite priority order first, then by rank, then alphabetically
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
  }, [developers, searchQuery, tierFilter, selectedDeveloper, sortBy, projectCounts]);

  const activeFilterCount = [
    searchQuery.trim(),
    tierFilter !== "all",
    selectedDeveloper,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setTierFilter("all");
    setSelectedDeveloper("");
  };

  return (
    <>
      <SEOHead 
        title="UAE Property Developers | JBJ Global Real Estate"
        description="Explore trusted UAE property developers offering off-plan and ready properties. Direct from developers - no secondary market listings."
        keywords="UAE developers, Dubai developers, Emaar, Nakheel, DAMAC, off-plan properties, new developments"
      />
      
      <div className="min-h-screen bg-[hsl(var(--premium-bg))]">
        {/* Hero Section - Full-width Video */}
        <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
          {/* Video Background */}
          <div className="absolute inset-0 bg-black">
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src={developersHeroVideo}
              muted
              playsInline
              autoPlay
              loop
              preload="metadata"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
          </div>
          
          {/* Floating gold accent orbs */}
          <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/15 rounded-full blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Label */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border border-gold/40 bg-black/30 backdrop-blur-md">
                <Building2 className="w-4 h-4 text-gold" />
                <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                  Developer-Direct Properties
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-[-0.02em]">
                UAE's Premier Developers
              </h1>
              
              <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
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
            <span className="text-gold/60 text-xs tracking-widest uppercase">Explore</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
          </motion.div>
        </section>

        {/* Scroll sentinel for two-phase filter fix */}
        <div ref={filterSentinelRef} className="h-0" />

        {/* Filters Section - Champagne Layer matching Properties page */}
        <section className="z-40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] py-4 border-b border-gold/30">
          <div className="container mx-auto px-3 sm:px-4">
            {/* Active Champagne Layer */}
            <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl p-4 sm:p-5 shadow-lg">
              
              {/* Search + Sort row */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
                  <Input
                    placeholder="Search developer, project or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 pl-12 pr-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-zinc-500 focus:border-gold rounded-lg text-base shadow-sm w-full"
                  />
                </div>
                <div className="flex gap-1.5 flex-shrink-0 items-center">
                  {([
                    { key: "default", label: "Newest" },
                    { key: "alpha", label: "A-Z" },
                    { key: "most_projects", label: "Most Projects" },
                  ] as const).map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        // Use existing sort - just set tier to trigger different sort
                        if (opt.key === "alpha") {
                          setSortBy("alpha" as any);
                        } else if (opt.key === "most_projects") {
                          setSortBy("most_projects" as any);
                        } else {
                          setSortBy("default" as any);
                        }
                      }}
                      className={`px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                        (sortBy as any) === opt.key || (!sortBy && opt.key === "default")
                          ? "bg-black text-gold border border-gold shadow-md"
                          : "bg-white border border-gold/30 text-zinc-600 hover:border-gold"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Row */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Developer Dropdown */}
                <div className="w-full sm:w-[240px]">
                  <SearchableSelect
                    value={selectedDeveloper}
                    onChange={(val) => setSelectedDeveloper(val === selectedDeveloper ? "" : val)}
                    options={developerNames}
                    placeholder="All Developers"
                    searchPlaceholder="Search developer..."
                    triggerClassName="h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-lg text-sm shadow-sm"
                  />
                </div>

                {/* Tier Filter */}
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-lg text-sm shadow-sm">
                    <Crown className="w-4 h-4 mr-2 text-gold flex-shrink-0" />
                    <span className="truncate text-left flex-1">
                      {TIER_FILTERS.find(t => t.value === tierFilter)?.label || "All Tiers"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {TIER_FILTERS.map((tier) => (
                      <SelectItem key={tier.value} value={tier.value}>
                        {tier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Results Count */}
                <div className="flex-1 text-black/70 text-sm">
                  {filteredDevelopers.length} developer{filteredDevelopers.length !== 1 ? 's' : ''} found
                </div>

                {/* Clear Filters */}
                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 px-3 bg-white/80 border-gold/30 text-black hover:bg-white rounded-lg flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear ({activeFilterCount})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Fixed portal copy of filters when scrolled past */}
        {isFilterFixed && createPortal(
          <section className="fixed top-14 sm:top-16 md:top-20 lg:top-[72px] left-0 right-0 z-[9998] bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] py-4 border-b border-gold/30 shadow-lg">
            <div className="container mx-auto px-3 sm:px-4">
              <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl p-4 sm:p-5 shadow-lg">
                {/* Keyword Search */}
                <div className="relative w-full mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
                  <Input
                    placeholder="Search by developer name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 pl-12 pr-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-zinc-500 focus:border-gold rounded-lg text-base shadow-sm w-full"
                  />
                </div>

                {/* Filter Row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Developer Dropdown */}
                  <div className="w-full sm:w-[240px]">
                    <SearchableSelect
                      value={selectedDeveloper}
                      onChange={(val) => setSelectedDeveloper(val === selectedDeveloper ? "" : val)}
                      options={developerNames}
                      placeholder="All Developers"
                      searchPlaceholder="Search developer..."
                      triggerClassName="h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-lg text-sm shadow-sm"
                    />
                  </div>

                  {/* Tier Filter */}
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-lg text-sm shadow-sm">
                      <Crown className="w-4 h-4 mr-2 text-gold flex-shrink-0" />
                      <span className="truncate text-left flex-1">
                        {TIER_FILTERS.find(t => t.value === tierFilter)?.label || "All Tiers"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {TIER_FILTERS.map((tier) => (
                        <SelectItem key={tier.value} value={tier.value}>
                          {tier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Results Count */}
                  <div className="flex-1 text-black/70 text-sm">
                    {filteredDevelopers.length} developer{filteredDevelopers.length !== 1 ? 's' : ''} found
                  </div>

                  {/* Clear Filters */}
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="h-9 px-3 bg-white/80 border-gold/30 text-black hover:bg-white rounded-lg flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear ({activeFilterCount})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>,
          document.body
        )}

        {/* Developer Cards Grid */}
        <section className="py-12 md:py-16">
          <div className="jj-layer-2">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className="h-[280px] rounded-xl bg-champagne/50 animate-pulse"
                    style={{ border: '2px solid hsl(42 45% 59% / 0.3)' }}
                  />
                ))}
              </div>
            ) : filteredDevelopers.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gold/30 rounded-xl bg-premium-card/50">
                <Building2 className="w-20 h-20 text-gold/40 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-foreground mb-3">No Developers Found</h3>
                <p className="text-foreground/70 max-w-lg mx-auto mb-6">
                  {activeFilterCount > 0 
                    ? "Try adjusting your search or filter criteria."
                    : "No developers available at the moment."}
                </p>
                {activeFilterCount > 0 && (
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDevelopers.map((developer, idx) => (
                  <DeveloperCard 
                    key={developer.id} 
                    developer={developer} 
                    projectCount={projectCounts[developer.id] || 0}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default Developers;
