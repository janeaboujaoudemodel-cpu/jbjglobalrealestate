/**
 * AreaGuides Component - Database-Driven Areas Index
 * Displays only REAL areas from the database (database-synced)
 * No static/fake data - all areas come from useAreas() hook
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { MapPin, Building2, TrendingUp, Flame, ArrowRight, Loader2 } from "lucide-react";
import jbjMonogram from "@/assets/jbj-monogram-light-bg.png";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";

import { SEOHead } from "@/components/SEOHead";
import { useAreas, useEmiratesWithAreas, Area } from "@/hooks/useAreas";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";

const ProjectCountStat = () => {
  const { data: count } = useQuery({
    queryKey: ["total-published-projects"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true);
      if (error) throw error;
      return count || 0;
    },
    staleTime: 60 * 1000,
  });
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-gold">{(count || 0).toLocaleString()}</div>
      <div className="text-zinc-400 text-sm">Properties</div>
    </div>
  );
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const AreaGuides = () => {
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>({...defaultShortcutFilters, sortBy: 'most_projects'});
  const [isFixed, setIsFixed] = useState(false);
  const [bottomReached, setBottomReached] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch REAL areas from database
  const { data: areas, isLoading, error } = useAreas();
  const { data: emirates } = useEmiratesWithAreas();

  // Filter and sort areas from database
  const filteredAreas = useMemo(() => {
    if (!areas) return [];
    let filtered = [...areas];

    // Search filter
    const query = shortcutFilters.searchQuery?.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query) || 
        a.emirate?.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query)
      );
    }

    const sortBy = shortcutFilters.sortBy;
    switch (sortBy) {
      case "trending":
        filtered = [...filtered].sort((a, b) => {
          const aIsTrending = a.is_trending ? 0 : 1;
          const bIsTrending = b.is_trending ? 0 : 1;
          return aIsTrending - bIsTrending || (b.property_count ?? 0) - (a.property_count ?? 0);
        });
        break;
      case "alpha":
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "most_projects":
      default:
        filtered = [...filtered].sort((a, b) => (b.property_count ?? 0) - (a.property_count ?? 0));
        break;
    }

    return filtered;
  }, [areas, shortcutFilters.sortBy, shortcutFilters.searchQuery]);

  // IntersectionObserver for fixed positioning
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsFixed(!entry.isIntersecting && entry.boundingClientRect.top < 140),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Bottom sentinel: hide fixed bar when CTA section enters viewport
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
    if (isFixed && !bottomReached) {
      document.body.classList.add('filter-bar-fixed');
    } else {
      document.body.classList.remove('filter-bar-fixed');
    }
    return () => document.body.classList.remove('filter-bar-fixed');
  }, [isFixed, bottomReached]);

  return (
    <div className="min-h-screen bg-[hsl(var(--premium-bg))]">
      <SEOHead 
        title="Areas in Dubai & UAE | JBJ Global Real Estate"
        description="Explore real estate areas across Dubai and the UAE. Browse properties by neighborhood with verified data."
        keywords="Dubai areas, Dubai neighborhoods, UAE property areas, Dubai real estate locations"
        canonicalPath="/areas"
      />

      {/* Fullscreen Hero with Background Photo */}
      <section className="jj-hero-fullscreen relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
          alt="Dubai Skyline"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/40 rounded-full mb-6">
              <MapPin className="w-4 h-4 text-gold" />
              <span className="text-gold text-sm font-medium uppercase tracking-wider">Browse by Location</span>
            </div>

            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Explore <span className="text-gold">Areas</span> in the UAE
            </h1>

            <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Discover properties across {areas?.length || 0}+ verified neighborhoods
            </p>

            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gold">{areas?.length || 0}</div>
                <div className="text-zinc-400 text-sm">Areas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gold">{emirates?.length || 0}</div>
                <div className="text-zinc-400 text-sm">Emirates</div>
              </div>
              <ProjectCountStat />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sentinel for IntersectionObserver */}
      <div ref={sentinelRef} className="h-0 w-full" />

      {/* Filter bar - inline */}
      <section className="py-4 pb-16 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark">
        <div className="container mx-auto px-4 space-y-3">
          {/* FilterShortcutBar */}
          <FilterShortcutBar variant="light" filters={shortcutFilters} onFilterChange={setShortcutFilters} />
        </div>

      {/* Fixed portal copy — only when scrolled past sentinel */}
      {isFixed && !bottomReached && createPortal(
        <div className="fixed top-0 left-0 right-0 z-[9998] shadow-[0_4px_20px_rgba(200,167,102,0.15)] bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-b border-gold/20 py-3 transition-shadow duration-200">
          <div className="container mx-auto px-4 space-y-2">
            <FilterShortcutBar
              variant="light"
              filters={shortcutFilters}
              onFilterChange={setShortcutFilters}
            />
          </div>
        </div>,
        document.body
      )}

      </section>

      {/* Gold divider between filters and cards */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Areas Grid - distinct darker champagne zone */}
      <section className="pt-8 pb-16 bg-gradient-to-br from-[#F0E6D2] via-[#E8DCCA] to-[#DED0BC]">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
              <span className="ml-3 text-black/50">Loading areas...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500">Failed to load areas. Please try again.</p>
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="text-center py-20">
              <MapPin className="w-12 h-12 text-black/30 mx-auto mb-4" />
              <p className="text-black/50 text-lg">No areas found.</p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredAreas.map((area, index) => (
                <motion.div key={area.id} variants={fadeInUp}>
                  <Link to={`/area/${area.slug}`}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.3 }}
                      className="group rounded-xl overflow-hidden cursor-pointer flex flex-col h-full"
                      style={{
                        border: '3px solid hsl(42 45% 59%)',
                        boxShadow: `
                          0 8px 32px rgba(200,167,102,0.25),
                          0 4px 16px rgba(0,0,0,0.15),
                          inset 0 1px 0 rgba(255,255,255,0.1)
                        `,
                      }}
                    >
                      {/* Photo Section */}
                      <div className="relative h-[180px] flex-shrink-0">
                        {(area.hero_image_url || area.image_url) ? (
                          <img
                            src={area.hero_image_url || area.image_url}
                            alt={area.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading={index < 8 ? "eager" : "lazy"}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] flex items-center justify-center">
                            <img src={jbjMonogram} alt="" className="w-16 h-16 object-contain opacity-10" />
                          </div>
                        )}

                        {/* Trending + High Demand Badges */}
                        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-end">
                          {area.is_trending && (
                            <Badge className="bg-gradient-to-r from-amber-500 to-amber-400 text-black px-3 py-1 text-[10px] font-bold tracking-wider shadow-lg">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              TRENDING
                            </Badge>
                          )}
                          {area.is_high_demand && (
                            <Badge className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-3 py-1 text-[10px] font-bold tracking-wider shadow-lg">
                              <Flame className="w-3 h-3 mr-1" />
                              HIGH DEMAND
                            </Badge>
                          )}
                        </div>

                        {/* Emirate Label */}
                        <div className="absolute top-3 left-3 z-10">
                          <Badge className="bg-black/70 text-white px-3 py-1 text-[10px] font-medium tracking-wider shadow-lg border border-gold/30">
                            <MapPin className="w-3 h-3 mr-1" />
                            {area.emirate}
                          </Badge>
                        </div>
                      </div>

                      {/* Content Section - Champagne Background */}
                      <div className="p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex flex-col flex-1">
                        {/* Area Name */}
                        <h3 className="text-black font-bold text-lg mb-2 line-clamp-1 group-hover:text-gold transition-colors">
                          {area.name}
                        </h3>

                        {/* Description - Fixed 2 lines */}
                        <div className="flex-1 min-h-[40px]">
                          {area.description ? (
                            <p className="text-zinc-600 text-xs line-clamp-2">
                              {area.description
                                .replace(/!\[.*?\]\(.*?\)/g, '')
                                .replace(/provident\s*(estate)?/gi, '')
                                .replace(/reelly/gi, '')
                                .replace(/\s{2,}/g, ' ')
                                .trim()}
                            </p>
                          ) : (
                            <p className="text-zinc-400 text-xs italic">
                              Explore properties in {area.name}
                            </p>
                          )}
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-3 text-zinc-700 text-xs mt-3 pt-3 border-t border-gold/20">
                          {(area.property_count ?? 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-gold" />
                              <span>{area.property_count} Projects</span>
                            </div>
                          )}
                          {(area.developer_count ?? 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-500">{area.developer_count} Developers</span>
                            </div>
                          )}
                          {area.is_trending && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-amber-600">Trending</span>
                            </div>
                          )}
                          {area.is_high_demand && (
                            <div className="flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5 text-red-500" />
                              <span className="text-red-500">High Demand</span>
                            </div>
                          )}
                          {(area.property_count ?? 0) === 0 && (area.developer_count ?? 0) === 0 && !area.is_trending && (
                            <span className="text-zinc-500 text-xs">View area details</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          {!isLoading && filteredAreas.length > 0 && (
            <div className="text-center mt-8 text-black/40 text-sm">
              Showing {filteredAreas.length} of {areas?.length || 0} areas
            </div>
          )}
        </div>
      </section>

      {/* DLD Market Intelligence */}
      <DLDMarketWidget />

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Can't Find What You're Looking For?
          </h2>
          <p className="text-zinc-600 mb-6 max-w-xl mx-auto">
            Our team can help you discover the perfect area based on your lifestyle and investment goals.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-gold font-semibold rounded-xl border-2 border-gold hover:bg-gold hover:text-black transition-all"
          >
            Contact Our Team
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AreaGuides;
