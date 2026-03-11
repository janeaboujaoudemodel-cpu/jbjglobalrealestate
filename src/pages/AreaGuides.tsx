/**
 * AreaGuides Component - Database-Driven Areas Index
 * Hero section on load, scroll-triggered vertical nav + filter bar
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Building2, TrendingUp, Flame, ArrowRight, Loader2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import jbjMonogram from "@/assets/jbj-monogram-light-bg.png";
import { Badge } from "@/components/ui/badge";
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";
// PropertiesVerticalNav removed — handled globally by MainLayout

import { SEOHead } from "@/components/SEOHead";
import { useAreas, useEmiratesWithAreas, Area } from "@/hooks/useAreas";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";
import { optimizeStorageImageUrl } from "@/lib/imageUtils";
import ContinueSearching from "@/components/ContinueSearching";

const ITEMS_PER_PAGE = 24;

/** Normalize emirate label variants to canonical names */
function normalizeEmirate(raw: string): string {
  const lower = (raw || "").toLowerCase().trim();
  if (lower.includes("abu dhabi")) return "Abu Dhabi";
  if (lower.includes("ras al") || lower.includes("ras-al")) return "Ras Al Khaimah";
  if (lower.includes("sharjah")) return "Sharjah";
  if (lower.includes("ajman")) return "Ajman";
  if (lower.includes("fujairah")) return "Fujairah";
  if (lower.includes("umm")) return "Umm Al Quwain";
  if (lower.includes("dubai")) return "Dubai";
  return raw;
}

/** Generate page numbers with ellipsis */
function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [];
  pages.push(1);
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("ellipsis");
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
  const navigate = useNavigate();
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>({...defaultShortcutFilters, sortBy: "most_projects"});
  const [currentPage, setCurrentPage] = useState(1);
  const [pastHero, setPastHero] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch REAL areas from database
  const { data: areas, isLoading, error } = useAreas();

  // Hero intersection observer — switch header/nav when user scrolls past hero
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const heroVisible = entry.isIntersecting;
        setPastHero(!heroVisible);
        if (heroVisible) {
          document.body.classList.remove("filter-bar-fixed");
        } else {
          document.body.classList.add("filter-bar-fixed");
        }
      },
      { threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => {
      observer.disconnect();
      document.body.classList.remove("filter-bar-fixed");
    };
  }, []);

  const scrollToGrid = () => {
    gridRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Count areas per emirate for hero badges
  const emirateCounts = useMemo(() => {
    if (!areas) return {};
    const counts: Record<string, number> = {};
    areas.forEach(a => {
      const name = normalizeEmirate(a.emirate || "");
      counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }, [areas]);

  const heroEmiratesOrder = ["Dubai", "Abu Dhabi", "Sharjah", "Ras Al Khaimah", "Ajman", "Fujairah", "Umm Al Quwain"];

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

    // Filter by selected emirates (normalized)
    if (shortcutFilters.emirates && shortcutFilters.emirates.length > 0) {
      filtered = filtered.filter(a =>
        shortcutFilters.emirates.some(e =>
          normalizeEmirate(a.emirate || "").toLowerCase() === e.toLowerCase() ||
          (a.emirate || "").toLowerCase().includes(e.toLowerCase())
        )
      );
    }

    // Filter by selected areas
    if (shortcutFilters.areas && shortcutFilters.areas.length > 0) {
      filtered = filtered.filter(a =>
        shortcutFilters.areas.some(sel => a.name.toLowerCase() === sel.toLowerCase())
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
  }, [areas, shortcutFilters.sortBy, shortcutFilters.searchQuery, shortcutFilters.emirates, shortcutFilters.areas]);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--premium-bg))]">
      <SEOHead
        title="Areas in Dubai & UAE | JBJ Global Real Estate"
        description="Explore real estate areas across Dubai and the UAE. Browse properties by neighborhood with verified data."
        keywords="Dubai areas, Dubai neighborhoods, UAE property areas, Dubai real estate locations"
        canonicalPath="/areas"
      />

      {/* ─── HERO SECTION ─── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
      >
        {/* Background — UAE aerial */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=85')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/85" />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[hsl(var(--gold))] text-xs uppercase tracking-[0.35em] mb-6 block font-medium"
          >
            Explore UAE
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-white text-5xl md:text-7xl font-bold mb-6 leading-tight"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            UAE Communities
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-10"
          >
            Discover the UAE's most prestigious communities across all seven emirates
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            onClick={scrollToGrid}
            className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gold text-gold font-medium rounded-xl hover:bg-gold hover:text-black transition-all"
          >
            Explore Areas
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Emirates Count Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="absolute bottom-10 left-0 right-0 flex justify-center flex-wrap gap-3 px-4"
        >
          {heroEmiratesOrder.map(emirate => {
            const count = emirateCounts[emirate];
            if (!count) return null;
            return (
              <button
                key={emirate}
                onClick={() => {
                  setShortcutFilters(prev => ({ ...prev, emirates: [emirate] }));
                  scrollToGrid();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full hover:bg-gold/20 hover:border-gold/50 transition-all cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-[hsl(var(--gold))]" />
                <span className="text-white text-xs font-medium">{emirate}</span>
                <span className="text-[hsl(var(--gold))] text-xs font-bold">{count}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* ─── POST-HERO LAYOUT ─── */}
      {/* Vertical nav handled globally by MainLayout */}

      {/* Filter bar — show inline below hero always, then fixed at top when past hero */}
      <section
        className={`${pastHero
          ? "fixed top-0 right-0 z-[9998] shadow-[0_4px_20px_rgba(200,167,102,0.15)]"
          : "relative w-full z-[10]"
        } bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-b border-gold/20 py-3`}
        style={pastHero ? { left: "200px" } : {}}
      >
        <div className="px-4 space-y-2">
          <FilterShortcutBar
            variant="light"
            filters={shortcutFilters}
            onFilterChange={setShortcutFilters}
            priorityFilter="areas"
          />
        </div>
      </section>
      {/* Spacer for fixed filter bar */}
      {pastHero && <div className="h-[60px]" />}

      {/* Gold divider */}
      <div ref={gridRef} className="w-full h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Areas Grid */}
      <section className={`pt-8 pb-16 bg-gradient-to-br from-[#F0E6D2] via-[#E8DCCA] to-[#DED0BC] min-h-screen ${pastHero ? "lg:pl-[200px]" : ""}`}>
        <div className="px-4 sm:px-6 lg:px-8">

          {/* Results count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-black/70">
              Showing <span className="text-gold font-medium">{paginatedAreas.length}</span> of{" "}
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
                        whileHover={{ y: -6, rotateX: 2, rotateY: -1 }}
                        transition={{ duration: 0.3 }}
                        className="group rounded-xl overflow-hidden cursor-pointer flex flex-col h-full"
                        style={{
                          border: "3px solid hsl(42 45% 59%)",
                          boxShadow: `
                            0 8px 32px rgba(200,167,102,0.25),
                            0 4px 16px rgba(0,0,0,0.15),
                            inset 0 1px 0 rgba(255,255,255,0.1)
                          `,
                          perspective: "1000px",
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
                              onError={(e) => {
                                // Fall back to raw URL if optimization endpoint fails
                                const rawUrl = area.hero_image_url || area.image_url;
                                if (rawUrl && e.currentTarget.src !== rawUrl) {
                                  e.currentTarget.src = rawUrl;
                                }
                              }}
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

                          {/* Emirate Label (normalized) */}
                          <div className="absolute top-3 left-3 z-10">
                            <Badge className="bg-black/70 text-white px-3 py-1 text-[10px] font-medium tracking-wider shadow-lg border border-gold/30">
                              <MapPin className="w-3 h-3 mr-1" />
                              {normalizeEmirate(area.emirate || "")}
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
                                  .replace(/!\[.*?\]\(.*?\)/g, "")
                                  .replace(/provident\s*(estate)?/gi, "")
                                  .replace(/reelly/gi, "")
                                  .replace(/\s{2,}/g, " ")
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
                    page === "ellipsis" ? (
                      <span key={`e-${idx}`} className="px-2 text-black/40">…</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          page === currentPage
                            ? "bg-gold text-black shadow-md"
                            : "bg-white/60 border border-gold/30 text-black/70 hover:bg-gold/20"
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
      <div className={pastHero ? "lg:pl-[200px]" : ""}>
        <DLDMarketWidget />
      </div>

      {/* CTA Section */}
      <section id="ready-to-get-started" className={`py-16 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark ${pastHero ? "lg:pl-[200px]" : ""}`}>
        <div className="px-4 text-center">
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

      {/* Continue Searching - Recently viewed areas */}
      <ContinueSearching type="area" />
    </div>
  );
};

export default AreaGuides;
