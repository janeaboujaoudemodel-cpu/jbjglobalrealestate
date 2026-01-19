import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowUpRight, Compass, Building2, Users, Home, TrendingUp, Search, X, Flame, SortAsc, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { AREA_GUIDES, UAE_EMIRATES as EMIRATES_DATA } from "@/constants/areaGuides";
import { GuideNavigation, GUIDE_LINKS, GuideHero, GuideCTA } from "@/components/guides";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

// UAE Emirates for filter
const UAE_EMIRATES = [
  { id: "all", name: "All Emirates" },
  { id: "dubai", name: "Dubai" },
  { id: "abu-dhabi", name: "Abu Dhabi" },
  { id: "sharjah", name: "Sharjah" },
  { id: "ajman", name: "Ajman" },
  { id: "ras-al-khaimah", name: "Ras Al Khaimah" },
  { id: "fujairah", name: "Fujairah" },
  { id: "umm-al-quwain", name: "Umm Al Quwain" },
];

// Trending communities (based on market activity from DLD reports)
const TRENDING_COMMUNITIES = [
  "downtown-dubai",
  "dubai-marina", 
  "palm-jumeirah",
  "dubai-hills-estate",
  "dubai-creek-harbour",
  "business-bay",
  "jumeirah-village-circle",
  "mbr-city",
  "emaar-beachfront",
  "al-marjan-island"
];

// Sort options
type SortOption = "featured" | "newest" | "trending" | "alphabetical";

const AreaGuides = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmirate, setSelectedEmirate] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("featured");

  // Source: Dubai Land Department Annual Report 2024, Dubai Statistics Center
  const highlights = [
    { icon: Building2, value: "80+", label: "Communities" },
    { icon: Users, value: "200+", label: "Nationalities" },
    { icon: Home, value: "226K+", label: "Transactions (2024)" },
    { icon: TrendingUp, value: "7-9%", label: "Avg. Yield" },
  ];

  // Filter and sort guides
  const filteredGuides = useMemo(() => {
    let filtered = AREA_GUIDES.filter(area => {
      const matchesSearch = searchQuery === "" || 
        area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Check emirate filter using the EMIRATES_DATA
      if (selectedEmirate === "all") {
        return matchesSearch;
      }
      
      const emirate = EMIRATES_DATA.find(e => e.id === selectedEmirate);
      const matchesEmirate = emirate ? emirate.areas.includes(area.slug) : false;
      
      return matchesSearch && matchesEmirate;
    });

    // Apply sorting
    switch (sortBy) {
      case "trending":
        filtered = [...filtered].sort((a, b) => {
          const aIsTrending = TRENDING_COMMUNITIES.includes(a.slug) ? 0 : 1;
          const bIsTrending = TRENDING_COMMUNITIES.includes(b.slug) ? 0 : 1;
          return aIsTrending - bIsTrending;
        });
        break;
      case "alphabetical":
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
        // Reverse order (newest added last in array)
        filtered = [...filtered].reverse();
        break;
      case "featured":
      default:
        // Keep original order
        break;
    }

    return filtered;
  }, [searchQuery, selectedEmirate, sortBy]);

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Dubai Communities & Area Guides | Expert Local Insights | JBJ"
        description="Explore Dubai's most desirable neighborhoods with expert local insights. Comprehensive area guides for Downtown Dubai, Dubai Marina, Business Bay, and more premium communities."
        keywords="Dubai area guides, Dubai neighborhoods, Dubai communities, where to live in Dubai, Downtown Dubai guide, Dubai Marina guide, Business Bay guide, Palm Jumeirah"
        canonicalPath="/areas"
      />

      {/* Premium Hero Section */}
      <GuideHero
        badge="Dubai Community Guides"
        badgeIcon={Compass}
        title={
          <>
            Discover Dubai's Premier <br className="hidden md:block" />
            <span className="text-gold">Communities & Neighborhoods</span>
          </>
        }
        description="Expert insights into Dubai's most sought-after residential areas. From waterfront living to urban luxury, find the community that matches your lifestyle."
        backgroundImage="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=80"
        actions={
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              className="relative bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300"
              onClick={() => document.getElementById('area-grid')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span className="text-gold font-semibold">Explore All Areas</span>
              <ArrowUpRight className="w-4 h-4 ml-2 text-black" />
            </Button>
            <Link to="/properties">
              <Button className="relative bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300">
                <Building2 className="w-4 h-4 mr-2 text-black" />
                <span className="text-gold font-semibold">View Properties</span>
                <ArrowUpRight className="w-4 h-4 ml-2 text-black" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats Bar - White/Champagne Theme */}
      <section className="py-10 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border-y border-gold/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {highlights.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-black border border-gold/30 rounded-xl mb-3 shadow-md">
                  <item.icon className="w-6 h-6 text-gold" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-black">{item.value}</div>
                <div className="text-sm text-zinc-600">{item.label}</div>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-zinc-500 mt-4">Source: Dubai Land Department Annual Report 2024</p>
        </div>
      </section>

      {/* Area Cards Grid */}
      <section id="area-grid" className="py-20 relative scroll-mt-20">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
              Featured Communities
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto mb-8">
              Each area offers a unique lifestyle. Click to explore detailed guides with pricing, amenities, and local insights.
            </p>

            {/* Search & Filter Bar */}
            <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] rounded-2xl p-4 md:p-6 border border-gold/30 shadow-lg">
              {/* Search Input - Full Width */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search by community name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-10 h-12 bg-white border-gold/30 focus:border-gold text-black placeholder:text-zinc-500 w-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3 text-zinc-600" />
                  </button>
                )}
              </div>

                {/* Emirate Filter - Horizontally Scrollable */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {UAE_EMIRATES.map((emirate) => (
                    <button
                      key={emirate.id}
                      onClick={() => setSelectedEmirate(emirate.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                        selectedEmirate === emirate.id
                          ? "bg-black text-gold border border-gold/50"
                          : "bg-white text-zinc-600 border border-zinc-300 hover:border-gold/50 hover:text-gold"
                      }`}
                    >
                      {emirate.name}
                    </button>
                  ))}
                </div>

                {/* Sort Options - Using Global Active Color System */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-sm text-zinc-500 mr-2">Sort by:</span>
                  {[
                    { id: "featured" as SortOption, label: "Featured", icon: Star },
                    { id: "trending" as SortOption, label: "Trending", icon: Flame },
                    { id: "newest" as SortOption, label: "Newest", icon: Clock },
                    { id: "alphabetical" as SortOption, label: "A-Z", icon: SortAsc },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        sortBy === option.id
                          ? "jj-sort-active"
                          : "jj-sort-inactive"
                      }`}
                    >
                      <option.icon className={`w-3 h-3 ${sortBy === option.id ? "text-black" : ""}`} />
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Results Count */}
                <div className="mt-4 text-sm text-zinc-600 text-center">
                  Showing <span className="font-semibold text-gold">{filteredGuides.length}</span> communities
                  {selectedEmirate !== "all" && (
                    <span> in <span className="font-semibold">{UAE_EMIRATES.find(e => e.id === selectedEmirate)?.name}</span></span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {filteredGuides.map((area) => (
              <motion.div key={area.slug} variants={fadeInUp}>
                <Link 
                  to={`/area/${area.slug}`}
                  className="group block relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 hover:border-gold transition-all duration-500 hover:shadow-xl hover:shadow-gold/20 h-full flex flex-col"
                >
                  {/* Image - Fixed Height */}
                  <div className="relative h-48 overflow-hidden flex-shrink-0">
                    <img 
                      src={area.heroImage} 
                      alt={area.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                    
                    {/* Trending Badge */}
                    {TRENDING_COMMUNITIES.includes(area.slug) && (
                      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg">
                        <Flame className="w-3.5 h-3.5 text-white" />
                        <span className="text-xs font-bold text-white uppercase tracking-wide">Trending</span>
                      </div>
                    )}
                    
                    {/* Hover Arrow */}
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 border border-gold/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg">
                      <ArrowUpRight className="w-5 h-5 text-black" />
                    </div>

                    {/* Premium Badge */}
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm border border-gold/30 rounded-full text-xs text-black font-medium shadow-md">
                        Premium Community
                      </span>
                    </div>
                  </div>
                  
                  {/* Content - Flex Grow for Equal Height */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-gold" />
                      <span className="text-gold text-sm uppercase tracking-wider font-medium">Dubai, UAE</span>
                    </div>
                    
                    <h3 className="text-black text-xl font-bold mb-3 group-hover:text-gold transition-colors line-clamp-1">
                      {area.name}
                    </h3>
                    
                    <p className="text-zinc-600 text-sm leading-relaxed line-clamp-2 mb-4 flex-grow">
                      {area.shortDescription}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-200 mt-auto">
                      <span className="text-gold text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                        Read Full Guide
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* No Results */}
          {filteredGuides.length === 0 && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 border border-zinc-700 rounded-2xl mb-4">
                <Search className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-xl text-white mb-2">No communities found</h3>
              <p className="text-zinc-400 mb-4">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedEmirate("all");
                }}
                className="text-gold hover:underline"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <GuideCTA
            title="Ready to Find Your Perfect Community?"
            description="Our team specializes in matching homeowners with their ideal Dubai neighborhood. Get personalized recommendations based on your lifestyle and requirements."
            icon={Home}
            primaryAction={{
              label: "Browse Properties",
              href: "/properties",
              icon: Building2
            }}
          />
        </div>
      </section>

      {/* Guide Navigation */}
      <section className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-t border-zinc-200">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/areas" guides={GUIDE_LINKS} showStartHere />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AreaGuides;
