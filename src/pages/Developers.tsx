import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Crown,
  Filter,
  MapPin,
  Search,
  Star,
  TrendingUp,
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

import developersHeroVideo from "@/assets/videos/dubai-landmarks-hero.mp4";

// Elite developers (Master developers)
const ELITE_DEVELOPERS = [
  "emaar", "sobha", "meraas", "aldar", "nakheel", "omniyat"
];

// Premium developers
const PREMIUM_DEVELOPERS = [
  "ellington", "damac"
];

// Top Tier developers
const TOP_TIER_DEVELOPERS = [
  "binghatti", "majid-al-futtaim"
];

// Established developers
const ESTABLISHED_DEVELOPERS = [
  "danube", "azizi"
];

// Developer tier badges based on specific developer classification
const getTierInfo = (slug: string | null) => {
  const normalizedSlug = slug?.toLowerCase() || "";
  
  if (ELITE_DEVELOPERS.some(d => normalizedSlug.includes(d))) {
    return {
      label: "Elite",
      badgeClassName: "bg-premium-card border border-gold/50 text-gold",
      icon: Crown,
    };
  }
  
  if (PREMIUM_DEVELOPERS.some(d => normalizedSlug.includes(d))) {
    return {
      label: "Premium",
      badgeClassName: "bg-premium-card border border-gold/35 text-primary-foreground",
      icon: Star,
    };
  }
  
  if (TOP_TIER_DEVELOPERS.some(d => normalizedSlug.includes(d))) {
    return {
      label: "Top Tier",
      badgeClassName: "bg-premium-card border border-gold/30 text-primary-foreground",
      icon: TrendingUp,
    };
  }
  
  if (ESTABLISHED_DEVELOPERS.some(d => normalizedSlug.includes(d))) {
    return {
      label: "Established",
      badgeClassName: "bg-premium-card border border-gold/25 text-primary-foreground",
      icon: Briefcase,
    };
  }
  
  return {
    label: "Developer",
    badgeClassName: "bg-premium-card border border-gold/20 text-primary-foreground",
    icon: Building2,
  };
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
        const tier = getTierInfo(d.slug);
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
      
      <div className="min-h-screen bg-premium-bg text-primary-foreground">
        {/* Hero Section - Full-width Video */}
        <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
          {/* Video Background */}
          <div className="absolute inset-0 bg-black">
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src={developersHeroVideo}
              muted
              playsInline
              autoPlay
              loop
              preload="metadata"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
          </div>
          
          {/* Floating gold accent orbs */}
          <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/15 rounded-full blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Label */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border border-gold/40 bg-black/30 backdrop-blur-md">
                <Building2 className="w-4 h-4 text-gold" />
                <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                  Developer-Direct Properties
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-[-0.02em]">
                UAE's Premier Developers
              </h1>
              
              <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Explore off-plan and ready properties directly from UAE's most trusted developers. 
                No secondary market — only developer-direct listings.
              </p>
            </motion.div>
          </div>
          
          {/* Scroll indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <span className="text-gold/60 text-xs tracking-widest uppercase">Explore</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
          </motion.div>
        </section>

        {/* Filters */}
        <section className="sticky top-16 lg:top-[72px] z-40 bg-premium-bg/95 backdrop-blur-md border-b border-gold/20 py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search developers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-premium-card border-gold/20 text-primary-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Select value={filterTier} onValueChange={setFilterTier}>
                  <SelectTrigger className="w-[140px] bg-premium-card border-gold/20 text-primary-foreground">
                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent className="bg-premium-card border-gold/20 text-primary-foreground">
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="top tier">Top Tier</SelectItem>
                    <SelectItem value="established">Established</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px] bg-premium-card border-gold/20 text-primary-foreground">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-premium-card border-gold/20 text-primary-foreground">
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

        {/* Developer Grid - Placeholder for extraction */}
        <section className="py-12 md:py-16">
          <div className="jj-layer-2">
              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-8 text-sm text-foreground/70">
                <span>
                  <span className="text-gold font-semibold">{filteredDevelopers.length}</span> Developers
                </span>
                <span className="w-1 h-1 rounded-full bg-gold/40" />
                <span>
                  <span className="text-gold font-semibold">{projects?.length || 0}</span> Developer-Direct Projects
                </span>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 rounded-xl bg-champagne/50" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-gold/30 rounded-xl bg-premium-card/50">
                  <Building2 className="w-20 h-20 text-gold/40 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Developer Extraction in Progress</h3>
                  <p className="text-foreground/70 max-w-lg mx-auto mb-6">
                    We're re-extracting all developer listings with high-resolution images and complete data directly from source. 
                    This ensures accurate, up-to-date information for all 1,324+ properties.
                  </p>
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gold/40 bg-black/30 backdrop-blur-md">
                    <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                    <span className="text-gold font-semibold text-xs uppercase tracking-[0.15em]">
                      Coming Soon
                    </span>
                  </div>
                </div>
              )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Developers;
