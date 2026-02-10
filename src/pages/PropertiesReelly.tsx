import { useState, useMemo, useEffect, Fragment, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  MapPin,
  Building2,
  Home,
  Calendar,
  CheckCircle,
  MessageCircle,
  Loader2
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";

import ReellyProjectCard from "@/components/ReellyProjectCard";
import { ProjectGridSkeleton } from "@/components/ProjectCardSkeleton";
import { useReellyProjects, flattenReellyProjects, getReellyProjectsTotal } from "@/hooks/useReellyProjects";
import { useDevelopers } from "@/hooks/useProjects";
import { useLocalProjectSearch } from "@/hooks/useLocalProjectSearch";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import { SEOHead } from "@/components/SEOHead";
import { FeaturedProjectAd, FEATURED_ADS } from "@/components/FeaturedProjectAd";
import { blueprintPagesSEO } from "@/types/blueprint";
import PropertiesHeroVideo from "@/components/PropertiesHeroVideo";
import { CurrencyTooltip } from "@/components/CurrencyTooltip";

// Currency conversion rates - 10 unified currencies
const CURRENCY_RATES: Record<string, number> = {
  AED: 1,
  USD: 0.27,
  EUR: 0.25,
  GBP: 0.21,
  INR: 22.5,
  SAR: 1.02,
  CNY: 1.98,
  RUB: 24.5,
  CAD: 0.37,
  AUD: 0.42,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: 'AED',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  SAR: 'SAR',
  CNY: '¥',
  RUB: '₽',
  CAD: 'C$',
  AUD: 'A$',
};

type ExtendedCurrency = 'AED' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'SAR' | 'CNY' | 'RUB' | 'CAD' | 'AUD';

interface FilterState {
  search: string;
  emirate: string | null;
  developerName: string | null;
  saleStatus: string | null;
  constructionStatus: string | null;
  currency: ExtendedCurrency;
  sizeUnit: 'sqft' | 'sqm';
  hideSoldOut: boolean;
}

const defaultFilters: FilterState = {
  search: '',
  emirate: null,
  developerName: null,
  saleStatus: null,
  constructionStatus: null,
  currency: 'AED',
  sizeUnit: 'sqft',
  hideSoldOut: false,
};

const EMIRATES = [
  { value: "all", label: "All Emirates" },
  { value: "Dubai", label: "Dubai" },
  { value: "Abu Dhabi", label: "Abu Dhabi" },
  { value: "Sharjah", label: "Sharjah" },
  { value: "Ajman", label: "Ajman" },
  { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
];

 const SALE_STATUS = [
   { value: "all", label: "All Sale Statuses", dotClass: "" },
   { value: "Announced", label: "Announced", dotClass: "bg-gold" },
   { value: "Presale (EOI)", label: "Presale (EOI)", dotClass: "bg-amber-500" },
   { value: "Start of Sales", label: "Start of Sales", dotClass: "bg-blue-500" },
   { value: "On Sale", label: "On Sale", dotClass: "bg-emerald-500" },
   { value: "Sold Out", label: "Sold Out", dotClass: "bg-red-500" },
 ];

const CONSTRUCTION_STATUS = [
  { value: "all", label: "All Statuses" },
  { value: "Completed", label: "Completed" },
  { value: "Under Construction", label: "Under Construction" },
  { value: "Presale", label: "Presale" },
];

const PropertiesReelly = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { data: developers } = useDevelopers();
  
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>("newest");

  // Developers sorted by rank
  const allDevelopersSorted = useMemo(() => {
    if (!developers) return [];
    return [...developers].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  }, [developers]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);
  
  // Fetch projects — filters applied instantly (no Search button needed)
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReellyProjects({
    search: debouncedSearch || undefined,
    emirate: filters.emirate || undefined,
    saleStatus: filters.saleStatus || undefined,
    constructionStatus: filters.constructionStatus || undefined,
    developerName: filters.developerName || undefined,
  });

  // Local DB fallback search (for projects not found in Reelly API)
  const { data: localResults } = useLocalProjectSearch(debouncedSearch);

  // Flatten paginated data and merge with local results
  const reellyProjects = flattenReellyProjects(data);
  const reellyTotal = getReellyProjectsTotal(data);

  const projects = useMemo(() => {
    if (!debouncedSearch || !localResults?.length) return reellyProjects;
    const reellySlugs = new Set(reellyProjects.map(p => p.slug));
    const uniqueLocal = localResults.filter(p => !reellySlugs.has(p.slug));
    return [...reellyProjects, ...uniqueLocal];
  }, [reellyProjects, localResults, debouncedSearch]);

  const totalCount = debouncedSearch && localResults?.length
    ? reellyTotal + (localResults.filter(p => !reellyProjects.some(rp => rp.slug === p.slug)).length)
    : reellyTotal;

  // Apply URL params on mount
  useEffect(() => {
    const keywordParam = searchParams.get('q') || searchParams.get('keyword') || searchParams.get('search');
    const emirateParam = searchParams.get('emirate') || searchParams.get('location');
    const areaParam = searchParams.get('area');
    const statusParam = searchParams.get('saleStatus') || searchParams.get('status');
    const constructionParam = searchParams.get('constructionStatus');
    const developerParam = searchParams.get('developer');
    
    const areaSearch = areaParam
      ? areaParam.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : null;
    
    if (keywordParam || emirateParam || statusParam || constructionParam || areaSearch || developerParam) {
      setFilters(prev => ({
        ...prev,
        search: keywordParam ?? areaSearch ?? '',
        emirate: emirateParam,
        saleStatus: statusParam,
        constructionStatus: constructionParam,
        developerName: developerParam,
      }));
    }
  }, [searchParams]);

  // Sort and filter projects client-side
  const sortedProjects = useMemo(() => {
    let sorted = [...projects];
    
    // Hide sold out filter
    if (filters.hideSoldOut) {
      sorted = sorted.filter(p => {
        const status = (p.sale_status || p.status_label || '').toLowerCase();
        return !status.includes('sold') && !status.includes('out of stock');
      });
    }
    
    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
        break;
      case "price-high":
        sorted.sort((a, b) => (b.price_from || 0) - (a.price_from || 0));
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        break;
    }
    // Always show available projects first, sold out last (skip if user filtered them out)
    if (!filters.hideSoldOut) {
      sorted.sort((a, b) => {
        const aIsSold = (a.sale_status || a.status_label || '').toLowerCase();
        const bIsSold = (b.sale_status || b.status_label || '').toLowerCase();
        const aSold = aIsSold.includes('sold') || aIsSold.includes('out of stock');
        const bSold = bIsSold.includes('sold') || bIsSold.includes('out of stock');
        if (aSold === bSold) return 0;
        return aSold ? 1 : -1;
      });
    }
    return sorted;
  }, [projects, sortBy, filters.hideSoldOut]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setSortBy("newest");
  };

  const activeFilterCount = [
    filters.search,
    filters.emirate !== null,
    filters.developerName !== null,
    filters.saleStatus !== null,
    filters.constructionStatus !== null,
  ].filter(Boolean).length;

  const dynamicSEO = blueprintPagesSEO.buyListings;

  return (
    <>
      <SEOHead 
        title={dynamicSEO.title}
        description={dynamicSEO.metaDescription}
      />
      <div className="min-h-screen bg-[hsl(var(--premium-bg))]">
      
      {/* Hero Section */}
      <PropertiesHeroVideo>
        <div className="relative z-10 container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
           <div 
               className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
               style={{
                 background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                 backdropFilter: 'blur(20px)',
                 border: '1.5px solid rgba(200,167,102,0.6)',
                 boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)',
               }}
             >
               <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
               <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Premium Curated Listings</span>
             </div>
            
            <h1 
              className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 tracking-[-0.02em]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Curated Listings. Global Standard.
            </h1>
            
            <p className="text-zinc-300 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed">
              {totalCount > 0 ? `${totalCount.toLocaleString()} properties available` : 'Loading properties...'}
            </p>
          </motion.div>
        </div>
      </PropertiesHeroVideo>

      {/* Filters Section */}
      <section className="sticky top-14 sm:top-16 md:top-20 lg:top-[72px] z-40 bg-black py-3 md:py-4 border-b border-gold/30" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="container mx-auto px-3 sm:px-4">
          <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl p-4 sm:p-5 shadow-lg" style={{ overflow: 'visible' }}>
            
            {/* Search Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative col-span-2 sm:col-span-3 md:flex-1 md:min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/70" />
                <Input
                  type="text"
                  placeholder="Search projects, developers, areas..."
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  className="pl-10 h-10 bg-[#F5F0E6] border-gold/30 text-black placeholder:text-zinc-500"
                />
              </div>

              {/* Emirate Select */}
              <Select
                value={filters.emirate || "all"}
                onValueChange={(value) => updateFilter("emirate", value === "all" ? null : value)}
              >
                <SelectTrigger className="w-full md:w-[140px] h-10 bg-[#F5F0E6] border-gold/30 text-black">
                  <MapPin className="w-4 h-4 mr-2 text-gold" />
                  <SelectValue placeholder="Emirate" />
                </SelectTrigger>
                <SelectContent>
                  {EMIRATES.map((e) => (
                    <SelectItem key={e.value} value={e.value} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sale Status Select */}
              <Select
                value={filters.saleStatus || "all"}
                onValueChange={(value) => updateFilter("saleStatus", value === "all" ? null : value)}
              >
                <SelectTrigger className="w-full md:w-[160px] h-10 bg-[#F5F0E6] border-gold/30 text-black">
                  <CheckCircle className="w-4 h-4 mr-2 text-gold" />
                  <SelectValue placeholder="Sale Status" />
                </SelectTrigger>
                 <SelectContent>
                   {SALE_STATUS.map((s) => (
                     <SelectItem key={s.value} value={s.value} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                       <span className="flex items-center gap-2">
                         {s.dotClass && <span className={`w-2.5 h-2.5 rounded-full ${s.dotClass} flex-shrink-0`} />}
                         {s.label}
                       </span>
                     </SelectItem>
                   ))}
                 </SelectContent>
              </Select>

              {/* Construction Status */}
              <Select
                value={filters.constructionStatus || "all"}
                onValueChange={(value) => updateFilter("constructionStatus", value === "all" ? null : value)}
              >
                <SelectTrigger className="w-full md:w-[170px] h-10 bg-[#F5F0E6] border-gold/30 text-black">
                  <Building2 className="w-4 h-4 mr-2 text-gold" />
                  <SelectValue placeholder="Construction" />
                </SelectTrigger>
                <SelectContent>
                  {CONSTRUCTION_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Developer Select with Logos */}
              <Select
                value={filters.developerName || "all"}
                onValueChange={(value) => updateFilter("developerName", value === "all" ? null : value)}
              >
                <SelectTrigger className="w-full md:w-[170px] h-10 bg-[#F5F0E6] border-gold/30 text-black">
                  <Building2 className="w-4 h-4 mr-2 text-gold" />
                  <SelectValue placeholder="Developer" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all" className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                    All Developers
                  </SelectItem>
                  {allDevelopersSorted.map((dev) => (
                    <SelectItem key={dev.id} value={dev.name} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                      <span className="flex items-center gap-2">
                        {dev.logo_url ? (
                          <img src={dev.logo_url} alt="" className="w-5 h-5 object-fill rounded-sm flex-shrink-0" />
                        ) : (
                          <Building2 className="w-4 h-4 text-gold/60 flex-shrink-0" />
                        )}
                        {dev.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Currency */}
              <Select
                value={filters.currency}
                onValueChange={(value) => updateFilter("currency", value as ExtendedCurrency)}
              >
                <SelectTrigger className="w-full md:w-[90px] h-10 bg-[#F5F0E6] border-gold/30 text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CURRENCY_SYMBOLS).map((curr) => (
                    <SelectItem key={curr} value={curr} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                      {CURRENCY_SYMBOLS[curr]} ({curr})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Size Unit */}
              <Select
                value={filters.sizeUnit}
                onValueChange={(value) => updateFilter("sizeUnit", value as 'sqft' | 'sqm')}
              >
                <SelectTrigger className="w-full md:w-[80px] h-10 bg-[#F5F0E6] border-gold/30 text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft" className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">sqft</SelectItem>
                  <SelectItem value="sqm" className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">sqm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options + Hide Sold Out */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-5 flex-wrap">
              {[
                { value: "newest", label: "Newest" },
                { value: "price-low", label: "Low → High" },
                { value: "price-high", label: "High → Low" },
                { value: "name", label: "A-Z" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border-2 ${
                    sortBy === option.value
                      ? "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black border-gold shadow-[0_0_18px_rgba(200,167,102,0.25)]"
                      : "bg-transparent text-black border-gold/30 hover:border-gold"
                  }`}
                >
                  {option.label}
                </button>
              ))}

              <div className="w-px h-6 bg-gold/30 mx-1" />

              {/* Hide Sold Out Toggle */}
              <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-full cursor-pointer hover:border-gold transition-all">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-xs text-black font-semibold whitespace-nowrap">Hide Sold Out</span>
                <Switch
                  checked={filters.hideSoldOut}
                  onCheckedChange={(checked) => updateFilter("hideSoldOut", checked)}
                  className="scale-75"
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Results Section */}
      <section className="py-12 bg-black">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl p-4 sm:p-5">
            
            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between px-4 pt-4">
              <p className="text-black/70">
                Showing <span className="text-gold font-medium">{sortedProjects.length}</span> of{' '}
                <span className="text-gold font-medium">{totalCount.toLocaleString()}</span> properties
              </p>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-zinc-600 hover:text-black"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear all filters
                </Button>
              )}
            </div>

            {/* Projects Grid */}
            {isLoading ? (
              <ProjectGridSkeleton count={6} />
            ) : isError ? (
              <div className="text-center py-20 px-4">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-200">
                  <X className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">Failed to Load Properties</h3>
                <p className="text-zinc-600 mb-4">{error?.message || 'Something went wrong. Please try again.'}</p>
                <Button onClick={() => window.location.reload()} variant="primary">
                  Retry
                </Button>
              </div>
            ) : sortedProjects.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 p-4">
                  {sortedProjects.map((project, index) => {
                    const adAfterIndex = [5, 11, 17];
                    const adIndex = adAfterIndex.indexOf(index);
                    const featuredAd = adIndex !== -1 && FEATURED_ADS[adIndex] ? FEATURED_ADS[adIndex] : null;
                    
                    return (
                      <Fragment key={project.id}>
                        <ReellyProjectCard 
                          project={project} 
                          currency={filters.currency}
                          sizeUnit={filters.sizeUnit}
                        />
                        {featuredAd && (
                          <FeaturedProjectAd
                            key={`ad-${featuredAd.id}`}
                            title={featuredAd.title}
                            subtitle={featuredAd.subtitle}
                            description={featuredAd.description}
                            imageUrl={featuredAd.imageUrl}
                            projectSlug={featuredAd.projectSlug}
                            ctaText={featuredAd.ctaText}
                          />
                        )}
                      </Fragment>
                    );
                  })}
                </div>

                {/* Load More Button */}
                {hasNextPage && (
                  <div className="flex justify-center py-8">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      variant="primary"
                      className="h-12 px-8 gap-2"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading more...
                        </>
                      ) : (
                        <>
                          Load More Projects
                          <span className="text-xs opacity-70">
                            ({totalCount - sortedProjects.length} remaining)
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {isFetchingNextPage && <ProjectGridSkeleton count={3} />}
              </>
            ) : (
              <div className="text-center py-20 px-4">
                <div className="w-20 h-20 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/30 shadow-[0_0_30px_rgba(200,167,102,0.3)]">
                  <Search className="w-10 h-10 text-gold drop-shadow-[0_0_8px_rgba(200,167,102,0.5)]" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">No Properties Found</h3>
                <p className="text-zinc-600 mb-4">Try adjusting your search filters or browse all properties.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button onClick={clearFilters} variant="primary" className="h-12 px-8">
                    Browse All Properties
                  </Button>
                  <Button asChild variant="outline" className="border-zinc-300 text-black hover:bg-zinc-100 h-12 px-6">
                    <a 
                      href={getWhatsAppUrl("Hi, I'm looking for properties but couldn't find what I need. Can you help?")}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact Us
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
       <CurrencyTooltip />
       </div>
     </>
   );
};

export default PropertiesReelly;
