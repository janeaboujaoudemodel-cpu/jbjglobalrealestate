/**
 * AreaGuides Component - Database-Driven Areas Index
 * Displays only REAL areas from the database (Reelly-synced)
 * No static/fake data - all areas come from useAreas() hook
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Building2, TrendingUp, Search, X, Flame, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { SEOHead } from "@/components/SEOHead";
import { useAreas, useEmiratesWithAreas, Area } from "@/hooks/useAreas";

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

type SortOption = "property_count" | "trending" | "alphabetical";

const AreaGuides = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmirate, setSelectedEmirate] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("property_count");

  // Fetch REAL areas from database
  const { data: areas, isLoading, error } = useAreas();
  const { data: emirates } = useEmiratesWithAreas();

  // Filter and sort areas from database
  const filteredAreas = useMemo(() => {
    if (!areas) return [];
    
    let filtered = areas.filter((area) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        area.name.toLowerCase().includes(q) ||
        (area.description ?? "").toLowerCase().includes(q);
      
      const matchesEmirate = 
        selectedEmirate === "all" || 
        area.emirate.toLowerCase() === selectedEmirate.toLowerCase();
      
      return matchesSearch && matchesEmirate;
    });

    switch (sortBy) {
      case "trending":
        filtered = [...filtered].sort((a, b) => {
          const aIsTrending = a.is_trending ? 0 : 1;
          const bIsTrending = b.is_trending ? 0 : 1;
          return aIsTrending - bIsTrending || (b.property_count ?? 0) - (a.property_count ?? 0);
        });
        break;
      case "alphabetical":
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "property_count":
      default:
        filtered = [...filtered].sort((a, b) => (b.property_count ?? 0) - (a.property_count ?? 0));
        break;
    }

    return filtered;
  }, [areas, searchQuery, selectedEmirate, sortBy]);

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
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gold">
                  {areas?.reduce((sum, a) => sum + (a.property_count ?? 0), 0).toLocaleString() || 0}
                </div>
                <div className="text-zinc-400 text-sm">Properties</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="py-8 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border-b border-gold/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <Input
                placeholder="Search areas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-white border-gold/30 focus:border-gold"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedEmirate("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedEmirate === "all"
                    ? "bg-black text-gold border border-gold"
                    : "bg-white border border-gold/30 text-zinc-700 hover:border-gold"
                }`}
              >
                All Emirates
              </button>
              {emirates?.map((emirate) => (
                <button
                  key={emirate}
                  onClick={() => setSelectedEmirate(emirate)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedEmirate === emirate
                      ? "bg-black text-gold border border-gold"
                      : "bg-white border border-gold/30 text-zinc-700 hover:border-gold"
                  }`}
                >
                  {emirate}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("property_count")}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  sortBy === "property_count"
                    ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold text-black"
                    : "bg-white border border-gold/30 text-zinc-700"
                }`}
              >
                <Building2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSortBy("trending")}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  sortBy === "trending"
                    ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold text-black"
                    : "bg-white border border-gold/30 text-zinc-700"
                }`}
              >
                <Flame className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSortBy("alphabetical")}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  sortBy === "alphabetical"
                    ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold text-black"
                    : "bg-white border border-gold/30 text-zinc-700"
                }`}
              >
                A-Z
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Areas Grid */}
      <section className="py-16 bg-[hsl(var(--premium-bg))]">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
              <span className="ml-3 text-zinc-600">Loading areas...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500">Failed to load areas. Please try again.</p>
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="text-center py-20">
              <MapPin className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
              <p className="text-zinc-600 text-lg">No areas found matching your criteria.</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-gold hover:underline"
                >
                  Clear search
                </button>
              )}
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
                      <div className="relative h-[200px] flex-shrink-0">
                        {area.image_url ? (
                          <img
                            src={area.image_url}
                            alt={area.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading={index < 8 ? "eager" : "lazy"}
                          />
                        ) : (
                          <div className="w-full h-full relative">
                            <img
                              src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80"
                              alt="Dubai Skyline"
                              className="w-full h-full object-cover opacity-70"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <MapPin className="w-10 h-10 text-gold/70 mx-auto mb-2" />
                                <span className="text-gold/90 text-xs font-medium tracking-wider uppercase">Area</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Trending Badge */}
                        {area.is_trending && (
                          <div className="absolute top-3 right-3 z-10">
                            <Badge className="bg-gradient-to-r from-amber-500 to-amber-400 text-black px-3 py-1 text-[10px] font-bold tracking-wider shadow-lg">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              TRENDING
                            </Badge>
                          </div>
                        )}

                        {/* Emirate Label */}
                        <div className="absolute top-3 left-3 z-10">
                          <Badge className="bg-black/70 text-white px-3 py-1 text-[10px] font-medium tracking-wider shadow-lg border border-gold/30">
                            <MapPin className="w-3 h-3 mr-1" />
                            {area.emirate}
                          </Badge>
                        </div>
                      </div>

                      {/* Content Section - Champagne Background */}
                      <div className="flex-1 p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex flex-col">
                        {/* Area Name */}
                        <h3 className="text-black font-bold text-lg mb-2 line-clamp-1 group-hover:text-gold transition-colors">
                          {area.name}
                        </h3>

                        {/* Description - Fixed 2 lines */}
                        <div className="flex-1 min-h-[40px]">
                          {area.description ? (
                            <p className="text-zinc-600 text-xs line-clamp-2">
                              {area.description}
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
            <div className="text-center mt-8 text-zinc-600 text-sm">
              Showing {filteredAreas.length} of {areas?.length || 0} areas
            </div>
          )}
        </div>
      </section>

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
