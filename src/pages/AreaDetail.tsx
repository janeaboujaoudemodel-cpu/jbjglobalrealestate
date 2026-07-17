/**
 * AreaDetail Component - Premium Area Detail Page
 * Full-screen hero, projects grid, developers, map, AI analyzer
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link, Navigate } from "react-router-dom";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useUserBrowsingContext } from "@/hooks/useUserBrowsingContext";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Loader2, Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";

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
import { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";
import AdvancedFilterPanel from "@/components/filters/AdvancedFilterPanel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [searchScope, setSearchScope] = useState<"area" | "emirate" | "community" | "developer" | "project">("project");
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
          <Loader2 className="w-10 h-10 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading area...</p>
        </div>
      </div>
    );
  }

  if (!area && !isLoading) {
    return <Navigate to="/areas" replace />;
  }

  if (!area) return null;

  const filterButtonStyle = { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' } as React.CSSProperties;
  const filterScopes = [
    { id: "area" as const, label: "Area" },
    { id: "emirate" as const, label: "Emirate" },
    { id: "community" as const, label: "Community" },
    { id: "developer" as const, label: "Developer" },
    { id: "project" as const, label: "Project Name" },
  ];

  // Single custom area filter bar. It deliberately avoids the shared full rail
  // because that rail exposes too many chips for this compact area page header.
  const filterBarBlock = (
    <div
      className="area-filter-bar shadow-[0_18px_42px_rgba(0,0,0,0.36)]"
      data-surface="dark"
      data-scoped-sticky-nav="area"
      style={{ background: 'linear-gradient(135deg, #064E3B 0%, #042C1C 56%, #010806 100%)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.12)' }}
    >
      <div className="px-3 sm:px-4 md:px-5 py-2">
        <div className="flex items-center gap-2 overflow-x-auto overflow-y-visible whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative h-10 w-[250px] sm:w-[280px] lg:w-[320px] flex-none rounded-lg overflow-hidden border border-white/20 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
            <input
              type="text"
              placeholder="Type to filter"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-no-contrast-guard
              className="allow-white w-full h-full pl-10 pr-9 bg-transparent border-0 text-sm focus:outline-none focus:ring-0 placeholder:text-white/82"
              style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-full bg-white/12" aria-label="Clear search">
                <X className="w-4 h-4" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
              </button>
            )}
          </div>

          <div className="flex flex-none items-center gap-1.5 rounded-lg border border-white/14 bg-black/16 p-1">
            {filterScopes.map((scope) => (
              <button
                key={scope.id}
                type="button"
                onClick={() => setSearchScope(scope.id)}
                data-active={searchScope === scope.id ? "true" : "false"}
                data-no-contrast-guard
                className="allow-white h-8 flex-none rounded-md px-3 text-xs font-extrabold transition-colors data-[active=true]:bg-white/18 hover:bg-white/12"
                style={filterButtonStyle}
              >
                {scope.label}
              </button>
            ))}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                data-no-contrast-guard
                className="allow-white h-10 flex-none inline-flex items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-bold border border-white/16 bg-white/10 hover:bg-white/16 transition-colors"
                style={filterButtonStyle}
              >
                <span>Price</span>
                <ChevronDown className="w-4 h-4" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
              </button>
            </PopoverTrigger>
            <PopoverContent data-no-contrast-guard align="start" sideOffset={8} className="w-80 border border-white/16 p-4 text-white shadow-2xl" style={{ background: 'linear-gradient(135deg, #064E3B 0%, #042C1C 60%, #010806 100%)', color: '#FFFFFF' }}>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-xs font-bold uppercase tracking-[0.12em]" style={filterButtonStyle}>
                  Min
                  <input
                    inputMode="numeric"
                    value={shortcutFilters.priceMin}
                    onChange={(e) => setShortcutFilters({ ...shortcutFilters, priceMin: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="0"
                    className="mt-1 h-10 w-full rounded-lg border border-white/24 bg-white/12 px-3 text-sm outline-none placeholder:text-white/60"
                    style={filterButtonStyle}
                  />
                </label>
                <label className="space-y-1 text-xs font-bold uppercase tracking-[0.12em]" style={filterButtonStyle}>
                  Max
                  <input
                    inputMode="numeric"
                    value={shortcutFilters.priceMax}
                    onChange={(e) => setShortcutFilters({ ...shortcutFilters, priceMax: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="Any"
                    className="mt-1 h-10 w-full rounded-lg border border-white/24 bg-white/12 px-3 text-sm outline-none placeholder:text-white/60"
                    style={filterButtonStyle}
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShortcutFilters({ ...shortcutFilters, priceMin: '', priceMax: '' })}
                className="mt-3 h-9 w-full rounded-lg border border-white/16 bg-white/10 text-xs font-bold"
                style={filterButtonStyle}
              >
                Reset price
              </button>
            </PopoverContent>
          </Popover>

          <button
            type="button"
            onClick={() => setAdvancedOpen(true)}
            data-no-contrast-guard
            className="allow-white h-10 flex-none inline-flex items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-bold border border-white/16 bg-white/10 hover:bg-white/16 transition-colors"
            style={filterButtonStyle}
          >
            <SlidersHorizontal className="w-4 h-4" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
            <span>Filters</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full min-w-0" data-surface="dark" data-area-detail-page="true" style={{ background: 'linear-gradient(180deg, #064E3B 0%, #042C1C 38%, #010806 100%)' }}>
      <div className="w-full min-w-0 transition-all duration-200">
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

      {/* Full-Screen Hero */}
      <AreaHeroSection area={area as any} liveProjectCount={liveProjectCount ?? undefined} dldAreaData={dldAreaData ?? undefined} />

      {/* Single sticky filter bar — no fixed clone, no duplication, no gold divider. */}
      <div className="sticky top-0 z-[60] w-full min-w-0" data-area-sticky-filter-shell>
        {filterBarBlock}
      </div>

      <AdvancedFilterPanel
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        filters={shortcutFilters}
        onFilterChange={setShortcutFilters}
      />

      {/* About This Area */}
      <div id="area-about" className="scroll-mt-40">
        <AreaAboutSection area={area as any} />
      </div>

      {/* Projects Grid - edge to edge */}
      <div id="area-projects" className="scroll-mt-40">
        <AreaProjectsGrid areaName={area.name} areaSlug={area.slug} shortcutFilters={shortcutFilters} searchQuery={searchQuery} searchScope={searchScope} onClearFilters={() => { setSearchQuery(""); setShortcutFilters(defaultShortcutFilters); }} />
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

      {/* Similar Areas moved BEFORE the CTA — CTA is the final block on the page */}


      {/* Similar Areas — new tall photo card style */}
      {relatedAreas.length > 0 && (
        <section id="similar-areas" data-surface="champagne" className="py-16" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 50%, #EFE6D6 100%)' }}>
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              {/* Header */}
              <div className="text-center mb-8">
                <span className="allow-white jj-pill-emerald-metallic inline-flex items-center gap-2 px-4 py-2 border-0 rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4">
                  <MapPin className="w-3.5 h-3.5 text-white" />
                  <span className="text-white">Similar Areas</span>
                </span>
                <h2 data-no-contrast-guard style={{ color: '#0A0A0A', WebkitTextFillColor: '#0A0A0A' }} className="text-2xl md:text-3xl font-bold">
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
                      className="group relative block h-[200px] md:h-[220px] rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_18px_42px_rgba(0,0,0,0.48)]"
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
                          <span className="allow-white inline-block mb-1.5 px-2 py-0.5 rounded-full bg-black/75 text-white text-[9px] font-semibold tracking-wide">
                            {relatedArea.property_count} verified projects
                          </span>
                        )}
                        <h3 className="text-white font-bold text-sm md:text-base leading-tight drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] group-hover:text-white transition-colors duration-300">
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

      {/* Final CTA — always last on the page — champagne background band */}
      <div data-surface="champagne" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 50%, #EFE6D6 100%)' }} className="py-10">
      <CombinedContactNewsletter
        title={`Explore ${area.name} Properties?`}
        subtitle="Connect with our team for verified listings, area guidance, and a shortlist matched to your goals."
      />
      </div>
      </div>
    </div>
  );
};

export default AreaDetail;