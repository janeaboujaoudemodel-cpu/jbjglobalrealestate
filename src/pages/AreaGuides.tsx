/**
 * AreaGuides Component - Database-Driven Areas Index
 * Hero section on load, scroll-triggered vertical nav + filter bar
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Building2, TrendingUp, Flame, ArrowRight, Loader2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import jbjMonogram from "@/assets/jbj-monogram-nobuffer.png";
import { Badge } from "@/components/ui/badge";
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";
// PropertiesVerticalNav removed — handled globally by MainLayout

import { SEOHead } from "@/components/SEOHead";
import { useAreas, useEmiratesWithAreas, Area } from "@/hooks/useAreas";
import { optimizeStorageImageUrl } from "@/lib/imageUtils";
import ContinueSearching from "@/components/ContinueSearching";
import CombinedContactNewsletter from "@/components/CombinedContactNewsletter";

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
  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch REAL areas from database
  const { data: areas, isLoading, error } = useAreas();


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

  const areaIntelligence = useMemo(() => {
    const list = areas || [];
    return {
      topProjectAreas: [...list].sort((a, b) => (b.property_count ?? 0) - (a.property_count ?? 0)).slice(0, 8),
      highDemand: list.filter((a) => a.is_high_demand).slice(0, 6),
      trending: list.filter((a) => a.is_trending).slice(0, 6),
      totalProjects: list.reduce((sum, a) => sum + (a.property_count ?? 0), 0),
      totalDevelopers: list.reduce((sum, a) => sum + (a.developer_count ?? 0), 0),
    };
  }, [areas]);

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
    <div data-neon-page className="min-h-screen bg-[hsl(var(--premium-bg))]">
      <SEOHead
        title="Areas in Dubai & UAE | JBJ Global Real Estate"
        description="Explore real estate areas across Dubai and the UAE. Browse properties by neighborhood with verified data."
        keywords="Dubai areas, Dubai neighborhoods, UAE property areas, Dubai real estate locations"
        canonicalPath="/areas"
      />

      {/* ─── HERO SECTION ─── */}
      <section
        ref={heroRef}
        data-hero-dark
        data-no-contrast-guard
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A1020]"
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
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto" data-no-contrast-guard>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.35em] mb-6 block font-medium"
            style={{ color: "#FFFFFF" }}
          >
            Explore UAE
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            style={{ fontFamily: "Playfair Display, serif", color: "#FFFFFF" }}
          >
            UAE Communities
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Discover the UAE's most prestigious communities across all seven emirates
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            onClick={scrollToGrid}
            className="inline-flex items-center gap-2 px-8 py-4 border-2 font-medium rounded-xl transition-all"
            style={{ borderColor: "rgba(255,255,255,0.28)", color: "#FFFFFF", background: "linear-gradient(135deg,#064E3B 0%,#042C1C 56%,#010806 100%)" }}
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
          data-no-contrast-guard
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
                className="allow-white jj-pill-emerald-metallic flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer border-0 shadow-[0_10px_24px_rgba(0,0,0,0.34)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.42)]"
              >
                <MapPin className="w-3 h-3" style={{ color: "#FFFFFF" }} />
                <span className="text-xs font-medium" style={{ color: "#FFFFFF" }}>{emirate}</span>
                <span className="text-xs font-bold" style={{ color: "#FFFFFF" }}>{count}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/85"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* ─── POST-HERO LAYOUT ─── */}
      {/* Vertical nav handled globally by MainLayout */}


      <div ref={gridRef} className="w-full h-px bg-[#064E3B]" />

      <section
        data-filter-clean="true"
        className="relative z-40 py-4 border-y-0"
        style={{ background: "linear-gradient(180deg,#064E3B 0%,#042C1C 55%,#031E14 100%)" }}
      >
        <div className="w-full px-3 sm:px-4">
          <FilterShortcutBar
            variant="dark"
            filters={shortcutFilters}
            onFilterChange={setShortcutFilters}
            priorityFilter="areas"
            resultsCount={filteredAreas.length}
            resultsLabel="Areas"
            hideSort
          />
        </div>
      </section>

      {/* Areas Grid */}
      <section className="pt-8 pb-16 bg-gradient-to-br from-[#F0E6D2] via-[#E8DCCA] to-[#DED0BC] min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8">

          {/* Results count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-[#1A1A1A]/70">
              Showing <span className="text-[#1A1A1A] font-medium">{paginatedAreas.length}</span> of{" "}
              <span className="text-[#1A1A1A] font-medium">{filteredAreas.length}</span> areas
              {totalPages > 1 && (
                <span className="text-[#1A1A1A]/40 ml-2">· Page {currentPage} of {totalPages}</span>
              )}
            </p>
            {shortcutFilters.emirates && shortcutFilters.emirates.length > 0 && (
              <button
                onClick={() => setShortcutFilters(prev => ({ ...prev, emirates: [] }))}
                className="text-xs text-[#1A1A1A] hover:text-[#1A1A1A] flex items-center gap-1 transition-colors"
              >
                ✕ Clear emirate filter
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#1A1A1A] animate-spin" />
              <span className="ml-3 text-[#1A1A1A]/50">Loading areas...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500">Failed to load areas. Please try again.</p>
            </div>
          ) : paginatedAreas.length === 0 ? (
            <div className="text-center py-20">
              <MapPin className="w-12 h-12 text-[#1A1A1A]/30 mx-auto mb-4" />
              <p className="text-[#1A1A1A]/50 text-lg">No areas found.</p>
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
                          border: "1px solid rgba(6,78,59,0.30)",
                          boxShadow: `
                            0 8px 32px rgba(6,78,59,0.16),
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
                            <div className="w-full h-full bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] flex items-center justify-center">
                              <img src={jbjMonogram} alt="" className="w-16 h-16 object-contain opacity-35"  loading="lazy" decoding="async" />
                            </div>
                          )}

                          {/* Trending + High Demand Badges */}
                          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-end">
                            {area.is_trending && (
                              <Badge className="allow-white jj-pill-emerald-metallic text-white px-3 py-1 text-[10px] font-bold tracking-wider shadow-lg border-0">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                TRENDING
                              </Badge>
                            )}
                            {area.is_high_demand && (
                              <Badge className="allow-white jj-pill-emerald-metallic text-white px-3 py-1 text-[10px] font-bold tracking-wider shadow-lg border-0">
                                <Flame className="w-3 h-3 mr-1" />
                                HIGH DEMAND
                              </Badge>
                            )}
                          </div>

                          {/* Emirate Label (normalized) */}
                          <div className="absolute top-3 left-3 z-10">
                            <Badge className="allow-white jj-pill-emerald-metallic text-white px-3 py-1 text-[10px] font-medium tracking-wider shadow-lg border-0">
                              <MapPin className="w-3 h-3 mr-1" />
                              {normalizeEmirate(area.emirate || "")}
                            </Badge>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] flex flex-col flex-1">
                          <h3 className="text-[#1A1A1A] font-bold text-lg mb-2 line-clamp-1 group-hover:text-[#1A1A1A] transition-colors">
                            {area.name}
                          </h3>

                          <div className="flex-1 min-h-[40px]">
                            {area.description ? (
                              <p className="text-[#1A1A1A]/70 text-xs line-clamp-2">
                                {area.description
                                  .replace(/!\[.*?\]\(.*?\)/g, "")
                                  .replace(/provident\s*(estate)?/gi, "")
                                  .replace(/reelly/gi, "")
                                  .replace(/\s{2,}/g, " ")
                                  .trim()}
                              </p>
                            ) : (
                              <p className="text-[#1A1A1A]/70 text-xs italic">
                                Explore properties in {area.name}
                              </p>
                            )}
                          </div>

                          {/* Stats Row */}
                          <div className="flex items-center gap-3 text-[#1A1A1A]/70 text-xs mt-3 pt-3 border-t border-[#064E3B]/20">
                            {(area.property_count ?? 0) > 0 && (
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-[#1A1A1A]" />
                                <span>{area.property_count} Projects</span>
                              </div>
                            )}
                            {(area.developer_count ?? 0) > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-[#1A1A1A]/70">{area.developer_count} Developers</span>
                              </div>
                            )}
                            {area.is_trending && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5 text-[#064E3B]" />
                                <span className="text-[#064E3B] font-semibold">Trending</span>
                              </div>
                            )}
                            {area.is_high_demand && (
                              <div className="flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5 text-[#064E3B]" />
                                <span className="text-[#064E3B] font-semibold">High Demand</span>
                              </div>
                            )}
                            {(area.property_count ?? 0) === 0 && (area.developer_count ?? 0) === 0 && !area.is_trending && (
                              <span className="text-[#1A1A1A]/70 text-xs">View area details</span>
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
                    className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-[#064E3B]/30 bg-[#FDFBF7]/60 text-[#1A1A1A] hover:bg-[#EFE6D6] hover:text-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                    page === "ellipsis" ? (
                      <span key={`e-${idx}`} className="px-2 text-[#1A1A1A]/40">…</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          page === currentPage
                            ? "bg-[#EFE6D6] text-[#1A1A1A] shadow-md"
                            : "bg-[#FDFBF7]/60 border border-[#064E3B]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/20"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-[#064E3B]/30 bg-[#FDFBF7]/60 text-[#1A1A1A] hover:bg-[#EFE6D6] hover:text-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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

      {/* Area Intelligence */}
      <section className="py-10 md:py-14 bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806]">
        <div className="px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
          <div className="text-center mb-8">
            <div className="allow-white jj-pill-emerald-metallic inline-flex items-center gap-2 border-0 rounded-full px-4 py-1.5 mb-4">
              <MapPin className="w-4 h-4 text-white" />
              <span className="text-white text-xs uppercase tracking-[0.2em] font-semibold">Community Facts</span>
            </div>
            <h2 className="allow-white text-white text-2xl md:text-3xl font-bold mb-2">UAE Area Intelligence</h2>
            <p className="allow-white text-white text-sm font-medium max-w-2xl mx-auto">
              Live community coverage by emirate, development depth, project activity, and demand signals.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Areas Covered", value: (areas?.length || 0).toLocaleString() },
              { label: "Active Projects", value: areaIntelligence.totalProjects.toLocaleString() },
              { label: "Developer Presence", value: areaIntelligence.totalDevelopers.toLocaleString() },
              { label: "Emirates", value: Object.keys(emirateCounts).length.toLocaleString() },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/18 bg-white/8 p-5">
                <p className="allow-white text-white text-[10px] uppercase tracking-[0.16em] font-bold mb-2">{stat.label}</p>
                <p className="allow-white text-white text-2xl md:text-3xl font-extrabold">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[
              { title: "Top Areas by Projects", items: areaIntelligence.topProjectAreas, icon: Building2 },
              { title: "High Demand Communities", items: areaIntelligence.highDemand, icon: Flame },
              { title: "Trending Areas", items: areaIntelligence.trending, icon: TrendingUp },
            ].map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title} className="rounded-2xl border border-white/18 bg-white/8 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="jj-pill-emerald-metallic inline-flex w-9 h-9 items-center justify-center rounded-lg">
                      <Icon className="w-4 h-4 text-white" />
                    </span>
                    <h3 className="allow-white text-white font-bold text-sm">{group.title}</h3>
                  </div>
                  <div className="space-y-2">
                    {group.items.length > 0 ? group.items.map((area) => (
                      <Link key={area.id} to={`/area/${area.slug}`} className="group flex items-center justify-between gap-3 rounded-lg bg-black/22 border border-white/12 px-3 py-2.5 hover:bg-white/10 transition-colors">
                        <span className="allow-white text-white text-sm font-semibold truncate">{area.name}</span>
                        <span className="allow-white text-white text-xs font-bold shrink-0">{(area.property_count ?? area.developer_count ?? 0).toLocaleString()}</span>
                      </Link>
                    )) : (
                      <p className="allow-white text-white text-sm">No active signals yet.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CombinedContactNewsletter
        title="Need Help Choosing an Area?"
        subtitle="Tell our team what lifestyle, budget, and investment goals matter most, and we will shortlist the right communities."
      />

      {/* Continue Searching - Recently viewed areas */}
      <ContinueSearching type="area" />
    </div>
  );
};

export default AreaGuides;
