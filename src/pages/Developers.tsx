import { useState, useMemo, useEffect } from "react";
import VideoBackground from "@/components/VideoBackground";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { useDevelopers, useDeveloperProjectStats, type Developer } from "@/hooks/useProjects";
import PropertySearchBar from "@/components/search/PropertySearchBar";
import { EMPTY_SEARCH, type PropertySearch } from "@/lib/propertySearch";
import { getDeveloperTier, ELITE_PRIORITY_ORDER } from "@/utils/developerTier";
import DeveloperCard from "@/components/DeveloperCard";
import { dedupeDevelopers } from "@/utils/developerDedupe";
import { SEOHead } from "@/components/SEOHead";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";
import { Button } from "@/components/ui/button";
import { useEffectiveOwner } from "@/hooks/useEffectiveOwner";
import DeveloperDirectoryViewControls, { type DirectoryViewMode, type DirectoryAuditFilter } from "@/components/developers/DeveloperDirectoryViewControls";
import DeveloperAuditRow from "@/components/developers/DeveloperAuditRow";
import { getDeveloperLogoUrl, getKnownDeveloperLogoUrl } from "@/utils/developerLogo";
import { getVerifiedDeveloperFlagship, isUsableDeveloperCover } from "@/utils/developerFlagshipMedia";


import developersHeroVideoAsset from "@/assets/videos/dubai-investment-hero.mp4.asset.json";
import MIPreFooterCard from "@/components/shell/MIPreFooterCard";
const developersHeroVideo = developersHeroVideoAsset.url;

const Developers = () => {
  const { data: developers, isLoading, refetch: refetchDevelopers } = useDevelopers();
  const { data: projectStats } = useDeveloperProjectStats();
  const { effectiveOwner } = useEffectiveOwner();

  // Filter states
  const [search, setSearch] = useState<PropertySearch>(EMPTY_SEARCH);

  const [currentPage, setCurrentPage] = useState(1);

  // Public viewing controls; audit diagnostics remain owner-only.
  const [view, setView] = useState<DirectoryViewMode>("grid");
  const [columns, setColumns] = useState(4);
  const [perPage, setPerPage] = useState(24);
  const [auditFilter, setAuditFilter] = useState<DirectoryAuditFilter>("all");
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const effectiveColumns = viewportWidth < 640
    ? 1
    : viewportWidth < 900
      ? Math.min(2, columns)
      : viewportWidth < 1200
        ? Math.min(4, columns)
        : Math.min(columns, 8);

  const ITEMS_PER_PAGE = perPage === 0 ? 100000 : perPage;



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
  
  // LOCKED (canonical identity): merge duplicate developer records so one brand
  // never renders twice. Project counts and hero candidates are combined.
  const rawCount = (dev: Developer) =>
    projectCounts[dev.id] || projectStats?.countsByName?.[normalizeDeveloperName(dev.name)] || 0;

  const canonical = useMemo(
    () => dedupeDevelopers(developers ?? [], rawCount),
    [developers, projectCounts, projectStats],
  );

  const canonicalDevelopers = useMemo(() => canonical.map((entry) => entry.developer), [canonical]);

  const mergedStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const heroes: Record<string, string[]> = {};
    for (const { developer, mergedIds } of canonical) {
      let count = 0;
      const images: string[] = [];
      for (const id of mergedIds) {
        count += projectCounts[id] || 0;
        images.push(...(projectStats?.imageCandidates?.[id] || []));
        const single = topProjectImageByDev[id];
        if (single) images.push(single);
      }
      const byName = projectStats?.countsByName?.[normalizeDeveloperName(developer.name)] || 0;
      counts[developer.id] = Math.max(count, byName);
      heroes[developer.id] = [
        ...new Set([
          ...images,
          ...(projectStats?.imageCandidatesByName?.[normalizeDeveloperName(developer.name)] || []),
        ]),
      ];
    }
    return { counts, heroes };
  }, [canonical, projectCounts, projectStats, topProjectImageByDev]);

  const filteredDevelopers = useMemo(() => {
    if (!canonicalDevelopers.length) return [];

    let filtered = [...canonicalDevelopers];


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
      filtered.sort((a, b) => (mergedStats.counts[b.id] || 0) - (mergedStats.counts[a.id] || 0));
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
  }, [canonicalDevelopers, search, search.sort, mergedStats]);

  // Owner audit: which records still lack a logo or a cover photo.
  const mediaStatus = useMemo(() => {
    const map: Record<string, { hasLogo: boolean; hasCover: boolean }> = {};
    for (const dev of filteredDevelopers) {
      const logo = getDeveloperLogoUrl(dev) || getKnownDeveloperLogoUrl(dev.name);
      const cover = [
        getVerifiedDeveloperFlagship(dev.name, dev.slug),
        (dev as { feature_image_url?: string | null }).feature_image_url || undefined,
        ...(mergedStats.heroes[dev.id] || []),
      ].find((value): value is string => Boolean(value) && value !== logo && isUsableDeveloperCover(value));
      map[dev.id] = { hasLogo: Boolean(logo), hasCover: Boolean(cover) };
    }
    return map;
  }, [filteredDevelopers, mergedStats]);

  // Owner audit buckets are PRECISE: "missing logo only", "missing photo only"
  // and "missing both" never overlap, so a chip shows exactly what it says.
  const visibleDevelopers = useMemo(() => {
    if (!effectiveOwner || auditFilter === "all") return filteredDevelopers;
    return filteredDevelopers.filter((dev) => {
      const status = mediaStatus[dev.id];
      if (!status) return false;
      if (auditFilter === "missing_both") return !status.hasLogo && !status.hasCover;
      if (auditFilter === "missing_logo") return !status.hasLogo && status.hasCover;
      return status.hasLogo && !status.hasCover;
    });
  }, [filteredDevelopers, effectiveOwner, auditFilter, mediaStatus]);

  const missingLogoCount = useMemo(
    () =>
      filteredDevelopers.filter(
        (dev) => !mediaStatus[dev.id]?.hasLogo && mediaStatus[dev.id]?.hasCover,
      ).length,
    [filteredDevelopers, mediaStatus],
  );
  const missingCoverCount = useMemo(
    () =>
      filteredDevelopers.filter(
        (dev) => mediaStatus[dev.id]?.hasLogo && !mediaStatus[dev.id]?.hasCover,
      ).length,
    [filteredDevelopers, mediaStatus],
  );
  const missingBothCount = useMemo(
    () =>
      filteredDevelopers.filter(
        (dev) => !mediaStatus[dev.id]?.hasLogo && !mediaStatus[dev.id]?.hasCover,
      ).length,
    [filteredDevelopers, mediaStatus],
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, search.sort, auditFilter, perPage]);



  const totalPages = Math.ceil(visibleDevelopers.length / ITEMS_PER_PAGE);
  const paginatedDevelopers = visibleDevelopers.slice(
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
                <DeveloperDirectoryViewControls
                    view={view}
                    onViewChange={setView}
                    columns={columns}
                    onColumnsChange={setColumns}
                    perPage={perPage}
                    onPerPageChange={setPerPage}
                    total={visibleDevelopers.length}
                    missingLogo={missingLogoCount}
                    missingCover={missingCoverCount}
                    auditOnly={auditOnly}
                    onAuditOnlyChange={setAuditOnly}
                    showAuditData={effectiveOwner}
                  />

                {view === "list" ? (
                  <div
                    className="grid gap-3 px-3 sm:px-4"
                    style={{ gridTemplateColumns: `repeat(${effectiveColumns}, minmax(0,1fr))` }}
                  >
                    {paginatedDevelopers.map((developer) => (
                      <DeveloperAuditRow
                        key={developer.id}
                        developer={developer}
                        projectCount={mergedStats.counts[developer.id] || 0}
                        heroImageUrl={mergedStats.heroes[developer.id]?.[0] || projectStats?.imagesByName?.[normalizeDeveloperName(developer.name)]}
                        heroImageUrls={mergedStats.heroes[developer.id] || []}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="grid items-stretch"
                    style={{
                      gridTemplateColumns: `repeat(${effectiveColumns}, minmax(0,1fr))`,
                      gap: effectiveColumns >= 6 ? "0.75rem" : "1.5rem",
                    }}
                  >
                    {paginatedDevelopers.map((developer, idx) => (
                      <DeveloperCard
                        key={developer.id} 
                        developer={developer} 
                        projectCount={mergedStats.counts[developer.id] || 0}
                        heroImageUrl={mergedStats.heroes[developer.id]?.[0] || projectStats?.imagesByName?.[normalizeDeveloperName(developer.name)]}
                        heroImageUrls={mergedStats.heroes[developer.id] || []}
                        index={(currentPage - 1) * ITEMS_PER_PAGE + idx}
                      />
                    ))}
                  </div>
                )}



                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 400, behavior: 'auto' }); }}
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
                            onClick={() => { setCurrentPage(p); window.scrollTo({ top: 400, behavior: 'auto' }); }}
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
                      onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 400, behavior: 'auto' }); }}
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
