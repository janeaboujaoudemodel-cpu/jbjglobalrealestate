import { useState, useMemo, useEffect, Fragment, useCallback, useRef } from "react";
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
import { useDevelopers, useProjectsListing } from "@/hooks/useProjects";
import { useLocalProjectSearch } from "@/hooks/useLocalProjectSearch";
import { mapDbProjectToReellyProject } from "@/utils/mapDbToReellyProject";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import { SEOHead } from "@/components/SEOHead";
import { FeaturedProjectAd, FEATURED_ADS } from "@/components/FeaturedProjectAd";
import { blueprintPagesSEO } from "@/types/blueprint";
import PropertiesHeroVideo from "@/components/PropertiesHeroVideo";
import { CurrencyTooltip } from "@/components/CurrencyTooltip";
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";
import PropertiesVerticalNav from "@/components/navigation/PropertiesVerticalNav";
import PropertiesMapView from "@/components/maps/PropertiesMapView";
import type { UnifiedProject } from "@/types/unifiedProject";
import type { ReellyProject } from "@/hooks/useReellyProjects";

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

/** Convert ReellyProject to UnifiedProject for map component */
function toUnifiedProject(p: ReellyProject): UnifiedProject {
  return {
    id: String(p.id),
    name: p.name,
    slug: p.slug,
    source: 'reelly',
    developer_name: p.developer_name,
    latitude: p.latitude,
    longitude: p.longitude,
    price_from: p.price_from,
    handover_date: p.handover_date,
    cover_image_url: p.thumbnail || (p.images?.[0]?.image_url ?? null),
    created_at: '',
    updated_at: '',
  };
}

const PropertiesReelly = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const { data: developers } = useDevelopers();
  
  // Database as PRIMARY source (always available, 2,410+ projects)
  const { data: dbProjects, isLoading: isDbLoading } = useProjectsListing();
  
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>("newest");

  // Map mode state
  const [isMapMode, setIsMapMode] = useState(searchParams.get('view') === 'map');

  // Filter shortcut bar state
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);

  // Fixed filter / header replacement
  const [isFilterFixed, setIsFilterFixed] = useState(false);
  const filterSentinelRef = useRef<HTMLDivElement>(null);

  // Map hover state
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  // Toggle map mode and update URL
  const handleMapToggle = useCallback((active: boolean) => {
    setIsMapMode(active);
    const params = new URLSearchParams(searchParams);
    if (active) {
      params.set('view', 'map');
    } else {
      params.delete('view');
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  // IntersectionObserver for filter fixed state
  useEffect(() => {
    const sentinel = filterSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsFilterFixed(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Sync body class for GlobalHeader hide
  useEffect(() => {
    if (isFilterFixed) {
      document.body.classList.add('filter-bar-fixed');
    } else {
      document.body.classList.remove('filter-bar-fixed');
    }
    return () => document.body.classList.remove('filter-bar-fixed');
  }, [isFilterFixed]);

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

  // Convert DB projects to ReellyProject format
  const dbProjectsMapped = useMemo(() => {
    if (!dbProjects?.length) return [];
    return dbProjects.map(mapDbProjectToReellyProject);
  }, [dbProjects]);

  // Flatten paginated API data
  const reellyProjects = flattenReellyProjects(data);
  const reellyTotal = getReellyProjectsTotal(data);

  // Merge: DB is primary, API enriches/overrides when available
  const projects = useMemo(() => {
    // If API returned data, merge: API data takes priority by slug
    if (reellyProjects.length > 0) {
      const apiBySlug = new Map(reellyProjects.map(p => [p.slug, p]));
      const merged = new Map<string, ReellyProject>();
      
      // Start with DB projects
      for (const dbP of dbProjectsMapped) {
        const apiP = apiBySlug.get(dbP.slug);
        merged.set(dbP.slug, apiP || dbP); // API overrides if available
      }
      // Add any API-only projects not in DB
      for (const apiP of reellyProjects) {
        if (!merged.has(apiP.slug)) {
          merged.set(apiP.slug, apiP);
        }
      }
      return Array.from(merged.values());
    }
    
    // API returned nothing (expired/unavailable) — use DB projects only
    // Apply client-side filtering since API isn't doing server-side filtering
    let filtered = [...dbProjectsMapped];
    
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.developer_name?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.emirate?.toLowerCase().includes(q)
      );
    }
    if (filters.emirate) {
      filtered = filtered.filter(p => p.emirate === filters.emirate);
    }
    if (filters.saleStatus) {
      filtered = filtered.filter(p => {
        const status = p.sale_status || p.status_label || '';
        return status === filters.saleStatus;
      });
    }
    if (filters.constructionStatus) {
      filtered = filtered.filter(p => p.construction_status === filters.constructionStatus);
    }
    if (filters.developerName) {
      filtered = filtered.filter(p => p.developer_name === filters.developerName);
    }
    
    return filtered;
  }, [dbProjectsMapped, reellyProjects, debouncedSearch, filters.emirate, filters.saleStatus, filters.constructionStatus, filters.developerName]);

  // Total count: use API total if available, otherwise DB count
  const totalCount = reellyTotal > 0 ? reellyTotal : (dbProjectsMapped.length || 0);

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
    // Always push sold-out projects to the bottom regardless of sort order
    sorted.sort((a, b) => {
      const aIsSold = (a.sale_status || a.status_label || '').toLowerCase();
      const bIsSold = (b.sale_status || b.status_label || '').toLowerCase();
      const aSold = aIsSold.includes('sold') || aIsSold.includes('out of stock');
      const bSold = bIsSold.includes('sold') || bIsSold.includes('out of stock');
      if (aSold === bSold) return 0;
      return aSold ? 1 : -1;
    });
    return sorted;
  }, [projects, sortBy]);

  // Convert for map — use the merged+sorted projects
  const unifiedProjects = useMemo(() => 
    sortedProjects.map(toUnifiedProject),
    [sortedProjects]
  );

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
               {totalCount > 0 ? `${totalCount.toLocaleString()} properties available` : (isLoading || isDbLoading) ? 'Loading properties...' : 'Browse our collection'}
            </p>
          </motion.div>
        </div>
      </PropertiesHeroVideo>

      {/* Sentinel for IntersectionObserver - marks where filter section starts */}
      <div ref={filterSentinelRef} className="h-0 w-full" />

      {/* Filters Section */}
      <section className={`${isFilterFixed ? 'fixed top-0 left-0 right-0 z-[9998]' : 'sticky top-14 sm:top-16 md:top-20 lg:top-[72px] z-40'} bg-black py-3 md:py-4 border-b border-gold/30`} style={{ WebkitOverflowScrolling: 'touch' }}>
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
                          <img src={dev.logo_url} alt="" className="w-5 h-5 object-contain rounded-sm flex-shrink-0" />
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

      {/* FilterShortcutBar */}
      <section className="bg-black py-2 border-b border-gold/20">
        <div className="container mx-auto px-3 sm:px-4">
          <FilterShortcutBar
            variant="light"
            filters={shortcutFilters}
            onFilterChange={setShortcutFilters}
            isMapMode={isMapMode}
            onMapToggle={handleMapToggle}
          />
        </div>
      </section>

      {/* Divider */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Results Section - split-screen in map mode */}
      {isMapMode ? (
        <section className="bg-black" style={{ height: 'calc(100vh - 80px)' }}>
          <div className="flex h-full">
            {/* Vertical Nav (desktop only) */}
            <div className="hidden lg:block flex-shrink-0">
              <PropertiesVerticalNav />
            </div>

            {/* Left: Scrollable card list */}
            <div className="w-full lg:w-[55%] h-full overflow-y-auto bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark">
              <div className="p-4">
                {/* Results Count */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-black/70 text-sm">
                    Showing <span className="text-gold font-medium">{sortedProjects.length}</span> of{' '}
                    <span className="text-gold font-medium">{totalCount.toLocaleString()}</span> properties
                  </p>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" onClick={clearFilters} className="text-zinc-600 hover:text-black text-xs h-8">
                      <X className="w-3 h-3 mr-1" /> Clear
                    </Button>
                  )}
                </div>

                {(isLoading && isDbLoading) ? (
                  <ProjectGridSkeleton count={4} />
                ) : sortedProjects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sortedProjects.map((project) => (
                      <ReellyProjectCard
                        key={project.id}
                        project={project}
                        currency={filters.currency}
                        sizeUnit={filters.sizeUnit}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="w-10 h-10 text-gold mx-auto mb-3" />
                    <p className="text-black/60">No properties found</p>
                  </div>
                )}

                {hasNextPage && (
                  <div className="flex justify-center py-6">
                    <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="primary" className="h-10 px-6 gap-2">
                      {isFetchingNextPage ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> : 'Load More'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Map */}
            <div className="hidden lg:block flex-1 h-full">
              <PropertiesMapView
                projects={unifiedProjects}
                hoveredProjectId={hoveredProjectId}
                onProjectHover={setHoveredProjectId}
                onProjectClick={(id) => {
                  const project = reellyProjects.find(p => String(p.id) === id);
                  if (project) window.open(`/project/${project.slug}`, '_blank');
                }}
              />
            </div>
          </div>
        </section>
      ) : (
        /* Standard list mode */
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
              {(isLoading && isDbLoading) ? (
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
      )}
       <CurrencyTooltip />
       </div>
     </>
   );
};

export default PropertiesReelly;
