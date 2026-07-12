/**
 * AreaDetail Component - Premium Area Detail Page
 * Full-screen hero, projects grid, developers, map, AI analyzer
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link, Navigate } from "react-router-dom";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useUserBrowsingContext } from "@/hooks/useUserBrowsingContext";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Loader2, Search, X, Building2, Info, Sparkles } from "lucide-react";

import { SEOHead } from "@/components/SEOHead";
import { SchemaEntity } from "@/components/SchemaEntity";
import { useAreaBySlug, useAreas } from "@/hooks/useAreas";
import { AreaHeroSection } from "@/components/area-detail/AreaHeroSection";
import { AreaAboutSection } from "@/components/area-detail/AreaAboutSection";
import { AreaProjectsGrid } from "@/components/area-detail/AreaProjectsGrid";
import { AreaDevelopersBar } from "@/components/area-detail/AreaDevelopersBar";
import { AreaMapSection } from "@/components/area-detail/AreaMapSection";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { AreaAIAnalyzer } from "@/components/area-detail/AreaAIAnalyzer";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";
import CombinedContactNewsletter from "@/components/CombinedContactNewsletter";
// PropertiesVerticalNav removed — handled globally by MainLayout
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";

const AreaDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: area, isLoading } = useAreaBySlug(slug);
  const { data: allAreas } = useAreas({ limit: 20 });
  const { trackView } = useRecentSearches();
  const browsingContext = useUserBrowsingContext();

  // Track area view
  useEffect(() => {
    if (!area) return;
    trackView({
      id: area.id,
      type: "area",
      name: area.name,
      slug: area.slug || slug || "",
      imageUrl: area.image_url || area.hero_image_url || undefined,
      subtitle: area.emirate,
    });
  }, [area]);

  // Live project count from database
  const { data: liveProjectCount } = useQuery({
    queryKey: ['area-live-project-count', area?.name],
    queryFn: async () => {
      if (!area?.name) return 0;
      const { count } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true)
        .ilike('area_name', area.name);
      return count ?? 0;
    },
    enabled: !!area?.name,
  });

  // Live DLD transaction data for this area from dld_market_data
  const { data: dldAreaData } = useQuery({
    queryKey: ['dld-area-stats', area?.name],
    queryFn: async () => {
      const { data } = await supabase
        .from('dld_market_data')
        .select('data_json')
        .eq('data_key', 'topAreas2026')
        .maybeSingle();
      if (!data?.data_json || !area?.name) return null;
      const areas = data.data_json as Array<{ area: string; transactions: number; change: string }>;
      const nameLower = area.name.toLowerCase();
      // Try exact match, then partial match
      const match = areas.find(a => a.area.toLowerCase() === nameLower)
        || areas.find(a => nameLower.includes(a.area.toLowerCase()) || a.area.toLowerCase().includes(nameLower));
      return match || null;
    },
    enabled: !!area?.name,
  });

  // Page-level filter state
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);
  const [searchQuery, setSearchQuery] = useState("");

  // Sticky filter bar logic
  const [isFixed, setIsFixed] = useState(false);
  const [bottomReached, setBottomReached] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Show the sticky replacement filter/tab bar on any scroll — matches the
  // project-page standard so area pages get the same immediate access to
  // relevant filters.
  useEffect(() => {
    const onScroll = () => setIsFixed(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

   // Bottom sentinel: hide fixed bar when "Ready to Get Started" section enters viewport
  useEffect(() => {
    const target = document.getElementById('ready-to-get-started');
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setBottomReached(entry.isIntersecting || entry.boundingClientRect.top < 0),
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [area]);

  // Signal GlobalHeader to hide when filter bar is fixed
  useEffect(() => {
    if (isFixed && !bottomReached) {
      document.body.classList.add('filter-bar-fixed');
    } else {
      document.body.classList.remove('filter-bar-fixed');
    }
    return () => document.body.classList.remove('filter-bar-fixed');
  }, [isFixed, bottomReached]);

  // Behavior-aware area recommendations (must be before early returns)
  const relatedAreas = useMemo(() => {
    if (!allAreas || !area) return [];
    const sameEmirate = allAreas.filter(a => a.id !== area.id && a.emirate === area.emirate);
    
    if (!browsingContext.hasData || browsingContext.recentAreas.length === 0) {
      return sameEmirate
        .sort((a, b) => {
          const aBoost = (a.is_trending ? 10 : 0) + (a.is_high_demand ? 8 : 0) + (a.property_count || 0);
          const bBoost = (b.is_trending ? 10 : 0) + (b.is_high_demand ? 8 : 0) + (b.property_count || 0);
          return bBoost - aBoost;
        })
        .slice(0, 4);
    }

    const scored = sameEmirate.map(a => {
      let score = 0;
      if (browsingContext.recentAreas.some(ra => ra.toLowerCase() === a.name.toLowerCase())) score += 15;
      if (a.is_trending) score += 5;
      if (a.is_high_demand) score += 4;
      score += Math.min(a.property_count || 0, 10);
      if (a.image_url) score += 3;
      return { area: a, score };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 4).map(s => s.area);
  }, [allAreas, area, browsingContext]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#1A1A1A] animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading area...</p>
        </div>
      </div>
    );
  }

  if (!area && !isLoading) {
    return <Navigate to="/areas" replace />;
  }

  if (!area) return null;

  const filterBarContent = (
    <>
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] jj-filter-search-pill jj-emerald-metallic rounded-full overflow-hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" />
        <input
          type="text"
          placeholder="Search projects or developers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="allow-white w-full h-10 pl-9 pr-8 rounded-full bg-transparent border-0 text-white text-sm placeholder:text-white focus:outline-none focus:ring-0 transition-colors"
          style={{ fontSize: '16px' }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-white hover:text-white" />
          </button>
        )}
      </div>
    </>
  );

  const areaStickyTabs = [
    { id: "area-about", label: "Developer", icon: Info },
    { id: "area-projects", label: "Floor Plans", icon: Building2 },
    { id: "area-map", label: "Location", icon: MapPin },
    { id: "area-ai", label: "AI Analyzer", icon: Sparkles },
  ];

  const scrollToAreaSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 132;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    window.scrollTo({ top: Math.max(0, top), behavior: prefersReduced ? "auto" : "smooth" });
  };

  return (
    <div className={`min-h-screen bg-[#1A1A1A] flex ${isFixed && !bottomReached ? '' : ''}`}>
      {/* Vertical nav handled globally by MainLayout */}
      <div className="flex-1 transition-all duration-200">
      <SEOHead 
        title={`${area.name} - Real Estate in ${area.emirate} | JBJ`}
        description={area.description || `Explore properties in ${area.name}, ${area.emirate}.`}
        keywords={`${area.name} properties, ${area.emirate} real estate`}
        canonicalPath={`/area/${area.slug}`}
        breadcrumbItems={[
          { name: 'Home', path: '/' },
          { name: 'Areas', path: '/areas' },
          { name: area.name, path: `/area/${area.slug}` },
        ]}
      />
      <SchemaEntity kind="community" slug={area.slug || slug || ""} pageTitle={`${area.name} — Properties in ${area.emirate}`} />

      {/* Full-Screen Hero with Real Photo */}
      <AreaHeroSection area={area as any} liveProjectCount={liveProjectCount ?? undefined} dldAreaData={dldAreaData ?? undefined} />

      {isFixed && !bottomReached && (
        <div data-scoped-sticky-nav="area" className="jj-utility-shell fixed left-0 right-0 top-0 z-[9999] backdrop-blur-md transition-all duration-300">
          <div data-filter-clean="true" data-filter-bar-gold="area-detail" className="bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-b border-[#B89555]/20 py-2 px-2">
            <div className="max-w-full overflow-x-auto overscroll-x-contain scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-x pan-y' } as React.CSSProperties}>
              <FilterShortcutBar variant="light" filters={shortcutFilters} onFilterChange={setShortcutFilters} priorityFilter="areas" searchSlot={filterBarContent} hidePropertyType hideTrendingSort />
            </div>
          </div>
          <div className="bg-gradient-to-r from-[#EDE0C8] via-[#E2D4B8] to-[#D8C7A6] border-b-2 border-[#B89555] shadow-[0_4px_12px_rgba(200,167,102,0.25)]">
            <div className="jj-content-track overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-x' } as React.CSSProperties}>
              <div className="flex w-max min-w-max items-center gap-1 py-2.5">
                {areaStickyTabs.map((tab) => (
                  <button key={tab.id} type="button" onClick={() => scrollToAreaSection(tab.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap shrink-0 min-w-fit transition-all text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10 border border-transparent">
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About This Area */}
      <div id="area-about" className="scroll-mt-40">
        <AreaAboutSection area={area as any} />
      </div>

      {/* Sentinel for IntersectionObserver — sits just above inline bar */}
      <div ref={sentinelRef} className="h-0" />

      {/* Phase 1: Inline filter bar — always rendered in natural flow */}
      <div className="bg-gradient-to-r from-[#064E3B] via-[#042C1C] to-[#010806] backdrop-blur-md py-3 px-4 md:px-6 border-b border-white/18 shadow-[0_4px_20px_rgba(0,0,0,0.28)] transition-all duration-300">
        <div className="container mx-auto">
            <FilterShortcutBar
            variant="dark"
            filters={shortcutFilters}
            onFilterChange={setShortcutFilters}
            priorityFilter="areas"
            searchSlot={filterBarContent}
            hidePropertyType
            hideTrendingSort
          />
        </div>
      </div>






      {/* Projects Grid - edge to edge */}
      <div id="area-projects" className="scroll-mt-40">
        <AreaProjectsGrid areaName={area.name} areaSlug={area.slug} shortcutFilters={shortcutFilters} searchQuery={searchQuery} onClearFilters={() => { setSearchQuery(""); setShortcutFilters(defaultShortcutFilters); }} />
      </div>

      {/* Developers Bar - connected, no gap */}
      <AreaDevelopersBar areaName={area.name} />

      {/* Interactive Map */}
      <MapErrorBoundary>
        <div id="area-map" className="scroll-mt-40">
          <AreaMapSection areaName={area.name} areaLat={area.latitude} areaLng={area.longitude} />
        </div>
      </MapErrorBoundary>

      {/* DLD Market Intelligence */}
      <DLDMarketWidget highlightArea={area.name} />

      {/* AI Area Intelligence */}
      <div id="area-ai" className="scroll-mt-40">
        <AreaAIAnalyzer areaName={area.name} emirate={area.emirate} />
      </div>

      <CombinedContactNewsletter
        title={`Explore ${area.name} Properties?`}
        subtitle="Connect with our team for verified listings, area guidance, and a shortlist matched to your goals."
      />

      {/* Similar Areas — new tall photo card style */}
      {relatedAreas.length > 0 && (
        <section id="similar-areas" className="py-16 bg-[#0A0A0A]">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              {/* Header */}
              <div className="text-center mb-8">
                <span className="allow-white jj-pill-emerald-metallic inline-flex items-center gap-2 px-4 py-2 border-0 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4">
                  <MapPin className="w-3.5 h-3.5 text-white" />
                  <span className="text-white">Similar Areas</span>
                </span>
                <h2 className="text-white text-2xl md:text-3xl font-bold">
                  Explore More in {area.emirate}
                </h2>
              </div>

              {/* Photo Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
                {relatedAreas.map((relatedArea, index) => (
                  <motion.div
                    key={relatedArea.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.07 }}
                    whileHover={{ y: -6 }}
                  >
                    <Link
                      to={`/area/${relatedArea.slug}`}
                      className="group relative block h-[200px] md:h-[220px] rounded-xl overflow-hidden border border-white/18 hover:border-white/40 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
                    >
                      {/* Background photo or champagne fallback */}
                      {relatedArea.image_url ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                          style={{ backgroundImage: `url(${relatedArea.image_url})` }}
                        />
                      ) : (
                         <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] flex items-center justify-center">
                          <span className="text-6xl font-black text-[#1A1A1A] select-none" style={{ opacity: 0.1 }}>JBJ</span>
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        {relatedArea.is_trending && (
                          <span className="allow-white jj-pill-emerald-metallic inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[9px] font-bold uppercase tracking-wider shadow-lg">
                            Trending
                          </span>
                        )}
                        {relatedArea.is_high_demand && (
                          <span className="allow-white jj-pill-emerald-metallic inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[9px] font-bold uppercase tracking-wider shadow-lg">
                            High Demand
                          </span>
                        )}
                      </div>

                      {/* Bottom info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {relatedArea.property_count != null && relatedArea.property_count > 0 && (
                          <span className="allow-white inline-block mb-1.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-semibold tracking-wide border border-white/20">
                            {relatedArea.property_count} Projects
                          </span>
                        )}
                        <h3 className="text-white font-bold text-sm md:text-base leading-tight drop-shadow-lg group-hover:text-white transition-colors duration-300">
                          {relatedArea.name}
                        </h3>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* View All CTA */}
              <div className="text-center mt-8">
                <Link
                  to="/areas"
                  className="allow-white jj-pill-emerald-metallic inline-flex items-center gap-2 px-6 py-3 border-0 rounded-xl text-white font-semibold text-sm hover:-translate-y-0.5 transition-all duration-300 group"
                  style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.16)" }}
                >
                  <span>View All Areas</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}
      </div>
    </div>
  );
};

export default AreaDetail;