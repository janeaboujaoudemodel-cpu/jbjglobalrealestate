/**
 * AreaGuides Component - Database-Driven Areas Index
 * Instant layout: no hero, filter bar fixed from load, vertical nav always visible
 */

import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Building2, TrendingUp, Flame, ArrowRight, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import jbjMonogram from "@/assets/jbj-monogram-light-bg.png";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";
import PropertiesVerticalNav from "@/components/navigation/PropertiesVerticalNav";

import { SEOHead } from "@/components/SEOHead";
import { useAreas, useEmiratesWithAreas, Area } from "@/hooks/useAreas";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";
import { optimizeStorageImageUrl } from "@/lib/imageUtils";

const ITEMS_PER_PAGE = 24;

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
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch REAL areas from database
  const { data: areas, isLoading, error } = useAreas();
  const { data: emirates } = useEmiratesWithAreas();

  // Immediately set filter-bar-fixed on mount — no hero, instant layout
  useEffect(() => {
    document.body.classList.add('filter-bar-fixed');
    return () => document.body.classList.remove('filter-bar-fixed');
  }, []);

  // Filter and sort areas from database
  const filteredAreas = useMemo(() => {
    if (!areas) return [];
    let filtered = [...areas];

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

  // Pagination
  const totalPages = Math.ceil(filteredAreas.length / ITEMS_PER_PAGE);
  const paginatedAreas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAreas.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAreas, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [shortcutFilters]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--premium-bg))]">
      {/* Vertical Nav — always visible on desktop */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-[9997]">
        <PropertiesVerticalNav />
      </div>

      <SEOHead 
        title="Areas in Dubai & UAE | JBJ Global Real Estate"
        description="Explore real estate areas across Dubai and the UAE. Browse properties by neighborhood with verified data."
        keywords="Dubai areas, Dubai neighborhoods, UAE property areas, Dubai real estate locations"
        canonicalPath="/areas"
      />

      {/* Filter bar — always fixed top-0 */}
      <section 
        className="fixed top-0 right-0 z-[9998] shadow-[0_4px_20px_rgba(200,167,102,0.15)] bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-b border-gold/20 py-3"
        style={{ left: '200px' }}
      >
        <div className="container mx-auto px-4 space-y-2">
          <FilterShortcutBar
            variant="light"
            filters={shortcutFilters}
            onFilterChange={setShortcutFilters}
          />
        </div>
      </section>

      {/* Spacer for fixed filter bar */}
      <div className="h-[60px]" />

      {/* Gold divider between filters and cards */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Areas Grid — edge-to-edge background */}
      <section className="pt-8 pb-16 bg-gradient-to-br from-[#F0E6D2] via-[#E8DCCA] to-[#DED0BC] min-h-screen">
        <div className="lg:pl-[200px] px-4 sm:px-6 lg:px-8">
          
          {/* Results count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-black/70">
              Showing <span className="text-gold font-medium">{paginatedAreas.length}</span> of{' '}
              <span className="text-gold font-medium">{filteredAreas.length}</span> areas
              {totalPages > 1 && (
                <span className="text-black/40 ml-2">· Page {currentPage} of {totalPages}</span>
              )}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
              <span className="ml-3 text-black/50">Loading areas...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500">Failed to load areas. Please try again.</p>
            </div>
          ) : paginatedAreas.length === 0 ? (
            <div className="text-center py-20">
              <MapPin className="w-12 h-12 text-black/30 mx-auto mb-4" />
              <p className="text-black/50 text-lg">No areas found.</p>
            </div>
          ) : (
            <>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {paginatedAreas.map((area, index) => (
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
                              src={optimizeStorageImageUrl(area.hero_image_url || area.image_url, 600, 70)}
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

                        {/* Content Section */}
                        <div className="p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex flex-col flex-1">
                          <h3 className="text-black font-bold text-lg mb-2 line-clamp-1 group-hover:text-gold transition-colors">
                            {area.name}
                          </h3>

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
          )}
        </div>
      </section>

      {/* DLD Market Intelligence */}
      <div className="lg:pl-[200px]">
        <DLDMarketWidget />
      </div>

      {/* CTA Section */}
      <section id="ready-to-get-started" className="py-16 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark">
        <div className="lg:pl-[200px] px-4 text-center">
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
