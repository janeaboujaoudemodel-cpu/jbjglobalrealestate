import { useState, useMemo, useEffect } from "react";
import VideoBackground from "@/components/VideoBackground";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { useDevelopers, useDeveloperProjectStats } from "@/hooks/useProjects";
import PropertySearchBar from "@/components/search/PropertySearchBar";
import { EMPTY_SEARCH, type PropertySearch } from "@/lib/propertySearch";
import { getDeveloperTier, ELITE_PRIORITY_ORDER } from "@/utils/developerTier";
import DeveloperCard from "@/components/DeveloperCard";
import { SEOHead } from "@/components/SEOHead";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";
import ContinueSearching from "@/components/ContinueSearching";
import { Button } from "@/components/ui/button";

import developersHeroVideoAsset from "@/assets/videos/dubai-investment-hero.mp4.asset.json";
import MIPreFooterCard from "@/components/shell/MIPreFooterCard";
const developersHeroVideo = developersHeroVideoAsset.url;

const Developers = () => {
  const { data: developers, isLoading, refetch: refetchDevelopers } = useDevelopers();
  const { data: projectStats } = useDeveloperProjectStats();
  
  // Filter states
  const [search, setSearch] = useState<PropertySearch>(EMPTY_SEARCH);
  
  const [currentPage, setCurrentPage] = useState(1);
  // Multi-country geography cascade (Country → Emirate/City → Area)
  const ITEMS_PER_PAGE = 24;


  // Count projects per developer (precomputed by the lightweight stats query)
  const projectCounts = useMemo(() => projectStats?.counts ?? {}, [projectStats]);
  const normalizeDeveloperName = (value?: string | null) =>
    (value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

  // Top project cover image per developer (used as the card hero photo)
  const topProjectImageByDev = useMemo(
    () => projectStats?.images ?? ({} as Record<string, string>),
    [projectStats],
  );


  // Apply filters to developers
  
  const filteredDevelopers = useMemo(() => {
    if (!developers) return [];
    
    let filtered = [...developers];

    // Search filter (name only for accuracy)
    const q = (search.q || "").trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(dev => dev.name.toLowerCase().includes(q));
    }

    // Tier filter
    if (search.developerTier) {
      filtered = filtered.filter(dev => 
        getDeveloperTier(dev.slug || "", dev.name || "", dev.rank) === search.developerTier
      );
    }

    // Geography cascade filter
    const geoTerms: string[] = [];
    if (search.areasInclude.length) {
      // Note: we might need to map slugs to names here if the dev record uses names
      // but for now we follow the existing pattern.
      geoTerms.push(...search.areasInclude.map(s => s.toLowerCase()));
    } else if (search.region) {
      geoTerms.push(search.region.toLowerCase());
    }
    
    if (geoTerms.length) {
      filtered = filtered.filter((dev) => {
        const rec = dev as unknown as Record<string, unknown>;
        const blob = [rec.city, rec.country, rec.headquarters, rec.location, rec.description, dev.name]
          .filter((v): v is string => typeof v === "string")
          .join(" ")
          .toLowerCase();
        return geoTerms.some((term) => blob.includes(term));
      });
    }
    
    // Sort
    if ((search.sort as string) === "alpha") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if ((search.sort as string) === "most_projects") {
      filtered.sort((a, b) => (projectCounts[b.id] || 0) - (projectCounts[a.id] || 0));
    } else {
      filtered.sort((a, b) => {
        const aSlug = a.slug?.toLowerCase() || "";
        const bSlug = b.slug?.toLowerCase() || "";
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
  }, [developers, search, search.sort, projectCounts]);


  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, search.sort]);


  const totalPages = Math.ceil(filteredDevelopers.length / ITEMS_PER_PAGE);
  const paginatedDevelopers = filteredDevelopers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeFilterCount = [search.q.trim(), search.developerTier, search.region, search.areasInclude.length].filter(Boolean).length;

  const clearFilters = () => {
    setSearch(EMPTY_SEARCH);
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

        
        {/* Unified Search Filter — exact light project-page treatment */}
        <section
          data-filter-clean="true"
          data-filter-band-light="true"
          className="sticky top-[88px] z-40 border-b border-[#B89555]/28 py-3 md:py-4"
          style={{ background: "linear-gradient(180deg,#FFFFFF 0%,#FDFBF7 58%,#F7F2EA 100%)" }}
        >
          <div className="container mx-auto px-3 sm:px-4">
            <div className="jjpf-shell" style={{ overflow: "visible" }}>
              <PropertySearchBar 
                value={search}
                onChange={setSearch}
                onSubmit={setSearch}
                showTiers={true}
                showSort={true}
                sortOptions={[
                  { slug: "default", label: "Recommended" },
                  { slug: "alpha", label: "Alphabetical" },
                  { slug: "most_projects", label: "Most Projects" },
                ]}
                countOverride={filteredDevelopers.length}
                countNoun="developers"
                typewriterPhrases={[
                  "Search by developer name...",
                  "Emaar, Nakheel, DAMAC...",
                  "Elite UAE developers...",
                ]}
                showActiveSummary
              />
            </div>
          </div>
        </section>

        




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
                      projectCount={projectCounts[developer.id] || projectStats?.countsByName?.[normalizeDeveloperName(developer.name)] || 0}
                       heroImageUrl={topProjectImageByDev[developer.id] || projectStats?.imagesByName?.[normalizeDeveloperName(developer.name)]}
                      heroImageUrls={[
                        ...(projectStats?.imageCandidates?.[developer.id] || []),
                        ...(projectStats?.imageCandidatesByName?.[normalizeDeveloperName(developer.name)] || []),
                      ]}
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
      <MIPreFooterCard
        title="Launching a new development?"
        subtitle="Partner with JBJ to reach qualified investors and brokers across the region."
        maxWidthClass="max-w-6xl"
      />
    </>
  );
};

export default Developers;
