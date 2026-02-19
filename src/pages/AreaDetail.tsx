/**
 * AreaDetail Component - Premium Area Detail Page
 * Full-screen hero, projects grid, developers, map, AI analyzer
 */

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link, Navigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Loader2, Phone, ArrowUpRight, Search, X } from "lucide-react";

import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useAreaBySlug, useAreas } from "@/hooks/useAreas";
import { AreaHeroSection } from "@/components/area-detail/AreaHeroSection";
import { AreaAboutSection } from "@/components/area-detail/AreaAboutSection";
import { AreaProjectsGrid } from "@/components/area-detail/AreaProjectsGrid";
import { AreaDevelopersBar } from "@/components/area-detail/AreaDevelopersBar";
import { AreaMapSection } from "@/components/area-detail/AreaMapSection";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { AreaAIAnalyzer } from "@/components/area-detail/AreaAIAnalyzer";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";
import PropertiesVerticalNav from "@/components/navigation/PropertiesVerticalNav";
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";

const AreaDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: area, isLoading } = useAreaBySlug(slug);
  const { data: allAreas } = useAreas({ limit: 20 });

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

  // Page-level filter state
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);
  const [searchQuery, setSearchQuery] = useState("");

  // Sticky filter bar logic
  const [isFixed, setIsFixed] = useState(false);
  const [bottomReached, setBottomReached] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for fixed positioning
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFixed(!entry.isIntersecting && entry.boundingClientRect.top < 140);
      },
      { threshold: 0, rootMargin: "-140px 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [area]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading area...</p>
        </div>
      </div>
    );
  }

  if (!area && !isLoading) {
    return <Navigate to="/areas" replace />;
  }

  if (!area) return null;

  const relatedAreas = allAreas?.filter(a => a.id !== area.id && a.emirate === area.emirate).slice(0, 4) || [];

  const filterBarContent = (
    <>
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
        <input
          type="text"
          placeholder="Search projects or developers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-8 rounded-xl bg-white/70 border-2 border-gold/30 text-black text-sm placeholder:text-black/30 focus:outline-none focus:border-gold/60 transition-colors"
          style={{ fontSize: '16px' }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-black/40 hover:text-black" />
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className={`min-h-screen bg-black flex ${isFixed && !bottomReached ? '' : ''}`}>
      {/* Vertical Nav when filter bar replaces header */}
      {isFixed && !bottomReached && (
        <div className="hidden lg:block fixed left-0 top-0 h-screen z-[9997]">
          <PropertiesVerticalNav />
        </div>
      )}
      <div className={`flex-1 ${isFixed && !bottomReached ? 'lg:ml-[200px]' : ''} transition-all duration-200`}>
      <SEOHead 
        title={`${area.name} - Real Estate in ${area.emirate} | JBJ`}
        description={area.description || `Explore properties in ${area.name}, ${area.emirate}.`}
        keywords={`${area.name} properties, ${area.emirate} real estate`}
        canonicalPath={`/area/${area.slug}`}
      />

      {/* Full-Screen Hero with Real Photo */}
      <AreaHeroSection area={area as any} liveProjectCount={liveProjectCount ?? undefined} />

      {/* About This Area */}
      <AreaAboutSection area={area as any} />

      {/* Sentinel for IntersectionObserver — sits just above inline bar */}
      <div ref={sentinelRef} className="h-0" />

      {/* Phase 1: Inline filter bar — always rendered in natural flow */}
      <div className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] py-3 px-4 md:px-6 border-b border-gold/20">
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center gap-3">
            {filterBarContent}
          </div>
          <div className="mt-3">
            <FilterShortcutBar variant="light" filters={shortcutFilters} onFilterChange={setShortcutFilters} />
          </div>
        </div>
      </div>

      {/* Phase 2: Fixed portal copy — only when scrolled past sentinel */}
      {isFixed && !bottomReached && createPortal(
        <div
          className="fixed top-0 left-0 right-0 z-[9998] shadow-[0_4px_20px_rgba(200,167,102,0.15)] bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-b border-gold/20 py-2 px-2 sm:py-3 sm:px-4 transition-all duration-200 lg:left-[200px]"
        >
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center gap-3">
              {filterBarContent}
            </div>
            <div className="mt-3">
              <FilterShortcutBar variant="light" filters={shortcutFilters} onFilterChange={setShortcutFilters} />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Projects Grid - edge to edge */}
      <AreaProjectsGrid areaName={area.name} areaSlug={area.slug} shortcutFilters={shortcutFilters} searchQuery={searchQuery} onClearFilters={() => { setSearchQuery(""); setShortcutFilters(defaultShortcutFilters); }} />

      {/* Developers Bar - connected, no gap */}
      <AreaDevelopersBar areaName={area.name} />

      {/* Interactive Map */}
      <MapErrorBoundary>
        <AreaMapSection areaName={area.name} areaLat={area.latitude} areaLng={area.longitude} />
      </MapErrorBoundary>

      {/* DLD Market Intelligence */}
      <DLDMarketWidget highlightArea={area.name} />

      {/* AI Area Intelligence */}
      <AreaAIAnalyzer areaName={area.name} emirate={area.emirate} />

      {/* CTA Section */}
      <section id="area-cta-section" className="py-20 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center rounded-3xl p-10 md:p-14 border-2 border-gold/30 relative overflow-hidden bg-white/70 backdrop-blur-sm"
            style={{
              boxShadow: '0 30px 80px -20px rgba(200,167,102,0.15), 0 0 60px rgba(200,167,102,0.05)',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
            
            <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-7 h-7 text-gold" />
            </div>
            <h2 className="text-black text-2xl md:text-3xl lg:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Properties in {area.name}
            </h2>
            <p className="text-black/50 text-lg mb-10 max-w-2xl mx-auto">
              Browse our curated collection of verified properties in this premium neighborhood.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to={`/properties?area=${area.slug}`}>
                <Button className="px-8 py-6 text-base bg-black text-white font-bold border border-black hover:bg-black/80 hover:shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:scale-105 transition-all duration-300 rounded-xl">
                  View Properties
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="secondary" className="border-2 border-black/20 text-black hover:bg-black hover:text-white px-8 py-6 text-base font-bold transition-all duration-300 rounded-xl bg-transparent">
                  <Phone className="w-5 h-5 mr-2" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Similar Areas — new tall photo card style */}
      {relatedAreas.length > 0 && (
        <section id="ready-to-get-started" className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              {/* Header */}
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4">
                  <MapPin className="w-3.5 h-3.5 text-gold" />
                  <span className="text-black">Similar Areas</span>
                </span>
                <h2 className="text-white text-2xl md:text-3xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
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
                      className="group relative block h-[200px] md:h-[220px] rounded-xl overflow-hidden border-[3px] border-transparent hover:border-gold transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.45)]"
                    >
                      {/* Background photo or champagne fallback */}
                      {relatedArea.image_url ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                          style={{ backgroundImage: `url(${relatedArea.image_url})` }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FDFBF7] via-[#E8DCC8] to-[#D4C4A8] flex items-center justify-center">
                          <span className="text-6xl font-black text-black select-none" style={{ opacity: 0.1, fontFamily: "Poppins, sans-serif" }}>JBJ</span>
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        {relatedArea.is_trending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#C8A766] to-[#E8DCC8] text-black text-[9px] font-bold uppercase tracking-wider shadow-lg">
                            Trending
                          </span>
                        )}
                        {relatedArea.is_high_demand && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-lg">
                            High Demand
                          </span>
                        )}
                      </div>

                      {/* Bottom info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {relatedArea.property_count != null && relatedArea.property_count > 0 && (
                          <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full bg-black/60 text-gold text-[9px] font-semibold tracking-wide border border-gold/30">
                            {relatedArea.property_count} Projects
                          </span>
                        )}
                        <h3 className="text-white font-bold text-sm md:text-base leading-tight drop-shadow-lg group-hover:text-gold transition-colors duration-300">
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-xl text-black font-semibold text-sm hover:shadow-[0_4px_20px_rgba(200,167,102,0.4)] hover:-translate-y-0.5 transition-all duration-300 group"
                  style={{ boxShadow: "0 6px 20px rgba(200,167,102,0.3), inset 0 2px 4px rgba(255,255,255,0.8)" }}
                >
                  <span>View All Areas</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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