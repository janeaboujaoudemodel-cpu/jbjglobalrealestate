import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Building2, 
  MapPin, 
  Calendar,
  ArrowRight,
  Search,
  Crown,
  Star,
  TrendingUp,
  Briefcase,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDevelopers, useProjects } from "@/hooks/useProjects";
import { SafeImage } from "@/components/SafeImage";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

// Developer tier badges based on rank
const getTierInfo = (rank: number | null) => {
  if (!rank) return { label: "Partner", color: "bg-zinc-700", icon: Building2 };
  if (rank === 1) return { label: "Elite", color: "bg-gradient-to-r from-amber-500 to-yellow-400", icon: Crown };
  if (rank <= 3) return { label: "Premium", color: "bg-gradient-to-r from-purple-500 to-indigo-500", icon: Star };
  if (rank <= 6) return { label: "Top Tier", color: "bg-gradient-to-r from-blue-500 to-cyan-500", icon: TrendingUp };
  if (rank <= 10) return { label: "Established", color: "bg-gradient-to-r from-emerald-500 to-teal-500", icon: Briefcase };
  return { label: "Partner", color: "bg-zinc-700", icon: Building2 };
};

// Format large numbers
const formatNumber = (num: number | null) => {
  if (!num) return null;
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

const Developers = () => {
  const { data: developers, isLoading: loadingDevelopers } = useDevelopers();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("rank");
  const [filterTier, setFilterTier] = useState<string>("all");

  // Count projects per developer (developer-direct only)
  const projectCounts = useMemo(() => {
    if (!projects) return {};
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      if (p.developer?.id) {
        counts[p.developer.id] = (counts[p.developer.id] || 0) + 1;
      }
    });
    return counts;
  }, [projects]);

  // Filter and sort developers
  const filteredDevelopers = useMemo(() => {
    if (!developers) return [];
    
    let filtered = [...developers];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(term) ||
        d.headquarters?.toLowerCase().includes(term)
      );
    }
    
    // Tier filter
    if (filterTier !== "all") {
      filtered = filtered.filter(d => {
        const tier = getTierInfo(d.rank);
        return tier.label.toLowerCase() === filterTier.toLowerCase();
      });
    }
    
    // Sort
    switch (sortBy) {
      case "rank":
        filtered.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "projects":
        filtered.sort((a, b) => (projectCounts[b.id] || 0) - (projectCounts[a.id] || 0));
        break;
      case "founded":
        filtered.sort((a, b) => (a.founded_year ?? 0) - (b.founded_year ?? 0));
        break;
    }
    
    return filtered;
  }, [developers, searchTerm, sortBy, filterTier, projectCounts]);

  const isLoading = loadingDevelopers || loadingProjects;

  return (
    <>
      <SEOHead 
        title="UAE Property Developers | JBJ Global Real Estate"
        description="Explore trusted UAE property developers offering off-plan and ready properties. Direct from developers - no secondary market listings."
        keywords="UAE developers, Dubai developers, Emaar, Nakheel, DAMAC, off-plan properties, new developments"
      />
      
      <div className="min-h-screen bg-black">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-to-b from-zinc-900 to-black overflow-hidden">
          {/* Background elements */}
          <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Label */}
              <div 
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(200,167,102,0.6)',
                }}
              >
                <Building2 className="w-4 h-4 text-gold" />
                <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                  Developer-Direct Properties
                </span>
              </div>
              
              <h1 
                className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-[-0.02em]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                UAE's Premier Developers
              </h1>
              
              <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Explore off-plan and ready properties directly from UAE's most trusted developers. 
                No secondary market — only developer-direct listings.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters */}
        <section className="sticky top-16 lg:top-[72px] z-40 bg-black/95 backdrop-blur-md border-b border-gold/20 py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="Search developers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Select value={filterTier} onValueChange={setFilterTier}>
                  <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-700 text-white">
                    <Filter className="w-4 h-4 mr-2 text-zinc-500" />
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="top tier">Top Tier</SelectItem>
                    <SelectItem value="established">Established</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px] bg-zinc-900 border-zinc-700 text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="rank">By Rank</SelectItem>
                    <SelectItem value="name">By Name</SelectItem>
                    <SelectItem value="projects">By Projects</SelectItem>
                    <SelectItem value="founded">By Founded Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Developer Grid */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            {/* Stats */}
            <div className="flex items-center gap-6 mb-8 text-sm text-zinc-500">
              <span>{filteredDevelopers.length} Developers</span>
              <span className="w-1 h-1 rounded-full bg-zinc-600" />
              <span>{projects?.length || 0} Developer-Direct Projects</span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-xl bg-zinc-900" />
                ))}
              </div>
            ) : filteredDevelopers.length === 0 ? (
              <div className="text-center py-20">
                <Building2 className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl text-white mb-2">No developers found</h3>
                <p className="text-zinc-500 mb-6">Try adjusting your search or filters</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterTier("all");
                  }}
                  className="border-gold/50 text-gold hover:bg-gold/10"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDevelopers.map((developer, index) => {
                  const tier = getTierInfo(developer.rank);
                  const TierIcon = tier.icon;
                  const projectCount = projectCounts[developer.id] || 0;
                  
                  return (
                    <motion.div
                      key={developer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <Link
                        to={`/developer/${developer.slug}`}
                        className="group block bg-zinc-900/50 border-2 border-gold/30 rounded-xl overflow-hidden hover:border-gold transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.15)]"
                      >
                        {/* Header with Logo */}
                        <div className="p-6 border-b border-zinc-800">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                              {developer.logo_url ? (
                                <SafeImage
                                  src={developer.logo_url}
                                  alt={developer.name}
                                  className="w-full h-full object-contain p-2"
                                />
                              ) : (
                                <Building2 className="w-8 h-8 text-gold" />
                              )}
                            </div>
                            
                            {/* Tier Badge */}
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${tier.color}`}>
                              <TierIcon className="w-3.5 h-3.5" />
                              {tier.label}
                            </div>
                          </div>
                          
                          <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors mb-1">
                            {developer.name}
                          </h3>
                          
                          {developer.headquarters && (
                            <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                              <MapPin className="w-3.5 h-3.5" />
                              {developer.headquarters}
                            </div>
                          )}
                        </div>
                        
                        {/* Stats */}
                        <div className="p-6">
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className="text-xl font-bold text-gold">{projectCount}</div>
                              <div className="text-xs text-zinc-500">Projects</div>
                            </div>
                            {developer.founded_year && (
                              <div>
                                <div className="text-xl font-bold text-white">{developer.founded_year}</div>
                                <div className="text-xs text-zinc-500">Founded</div>
                              </div>
                            )}
                            {developer.completed_projects && (
                              <div>
                                <div className="text-xl font-bold text-white">{developer.completed_projects}</div>
                                <div className="text-xs text-zinc-500">Completed</div>
                              </div>
                            )}
                          </div>
                          
                          {developer.description && (
                            <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                              {developer.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                            <span className="text-sm text-gold">View Projects</span>
                            <ArrowRight className="w-4 h-4 text-gold group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Legal Notice */}
        <section className="py-8 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <p className="text-xs text-zinc-600 text-center max-w-3xl mx-auto">
              Content protected under UAE law. Unauthorized use is subject to legal action. 
              All listings shown are developer-direct off-plan or ready properties only. 
              No secondary market or resale listings are included.
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Developers;
