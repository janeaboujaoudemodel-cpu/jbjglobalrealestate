import { useState, useMemo, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronDown,
  MapPin,
  Building2,
  Home,
  DollarSign,
  Maximize2,
  Calendar,
  Bath,
  Bed,
  CheckCircle,
  ArrowUpRight,
  MessageCircle,
  Phone,
  Filter,
  ExternalLink,
  Crown,
  Mail,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Briefcase,
  Settings
} from "lucide-react";
import { SaleStatusSelect } from "@/components/filters/SaleStatusFilter";
import { FilterToolbar } from "@/components/filters/FilterToolbar";
import { DisplayModeToggle } from "@/components/filters/DisplayModeToggle";
import { SettingsDropdown } from "@/components/filters/SettingsDropdown";
import { getSaleStatusConfig, type DisplayMode, type CurrencyCode, type AreaUnit } from "@/constants/filterConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";


import ProjectCard from "@/components/ProjectCard";
import { useProjects, useCommunities, useDevelopers } from "@/hooks/useProjects";
import { useAreas } from "@/hooks/useAreas";
import { useFilteredProjects, defaultFilters } from "@/hooks/useProjectFilters";
import type { FilterState } from "@/components/ProjectFilters";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import ActiveLeadBanner from "@/components/crm/ActiveLeadBanner";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
// OffPlanInquiryCTA removed - consolidated into single "Confused About Where to Buy" section
import { FeaturedProjectAd, FEATURED_ADS } from "@/components/FeaturedProjectAd";
import { blueprintPagesSEO, trackingEvents } from "@/types/blueprint";
import PropertiesHeroVideo from "@/components/PropertiesHeroVideo";
import ConsultationRequestForm from "@/components/ConsultationRequestForm";


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

// Extended currency type - 10 unified currencies
type ExtendedCurrency = 'AED' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'SAR' | 'CNY' | 'RUB' | 'CAD' | 'AUD';

interface ExtendedFilterState extends Omit<FilterState, 'currency'> {
  currency: ExtendedCurrency;
  propertyType: string | null;
  bathroomsMin: number | null;
  completionStatus: string | null;
  investmentType: string | null;
  areaId: string | null;
  hideSoldOut: boolean;
}

const defaultExtendedFilters: ExtendedFilterState = {
  ...defaultFilters,
  transactionType: 'buy',
  currency: 'AED' as ExtendedCurrency,
  propertyType: null,
  bathroomsMin: null,
  completionStatus: null,
  investmentType: null,
  saleStatus: null,
  areaId: null,
  hideSoldOut: false,
};

const PROPERTY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "duplex", label: "Duplex" },
  { value: "studio", label: "Studio" },
];

const COMPLETION_STATUS = [
  { value: "all", label: "All Status" },
  { value: "ready", label: "Ready to Move" },
  { value: "off-plan", label: "Off-Plan" },
  { value: "under-construction", label: "Under Construction" },
];

// Sale status options with color dots
const SALE_STATUS = [
  { value: "all", label: "All Sale Statuses", dotClass: null },
  { value: "Announced", label: "Announced", dotClass: "bg-pink-400" },
  { value: "Presale (EOI)", label: "Pre-sale (EOI)", dotClass: "bg-green-400" },
  { value: "Start of Sales", label: "Start of Sales", dotClass: "bg-yellow-400" },
  { value: "On Sale", label: "On Sale", dotClass: "bg-blue-400" },
  { value: "Sold Out", label: "Sold Out", dotClass: "bg-red-500" },
];

const INVESTMENT_TYPES = [
  { value: "all", label: "All Types" },
  { value: "homeowner", label: "Homeowner" },
  { value: "investment", label: "Investment" },
];

const BEDROOM_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "studio", label: "Studio" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5+" },
];

const BATHROOM_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

const Properties = () => {
  const [searchParams] = useSearchParams();
  const { data: projects, isLoading } = useProjects();
  const { data: communities } = useCommunities();
  const { data: developers } = useDevelopers();
  const { data: areas } = useAreas();
  const { t } = useLanguage();
  
  const [filters, setFilters] = useState<ExtendedFilterState>(defaultExtendedFilters);
  const [appliedFilters, setAppliedFilters] = useState<ExtendedFilterState>(defaultExtendedFilters);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('investor');
  
  // Update filters when URL params change (including developer from homepage marquee)
  useEffect(() => {
    const newTransaction = searchParams.get('transaction') as 'buy' | 'rent' | null;
    const newStatus = searchParams.get('status');
    const developerParam = searchParams.get('developer');
    const areaParam = searchParams.get('area');
    const keywordParam =
      searchParams.get('q') ||
      searchParams.get('keyword') ||
      searchParams.get('search');

    const hasDeveloperParam = !!developerParam;
    const developersLoaded = !!developers && developers.length > 0;

    // If there's a developer param but developers aren't loaded yet, wait
    if (hasDeveloperParam && !developersLoaded) {
      return;
    }

    // Resolve developerId from param (supports id, slug, or name)
    let developerIdFromUrl: string | null = null;
    if (developerParam && developersLoaded) {
      const normalized = developerParam.toLowerCase().trim();

      const matchedDeveloper =
        developers.find((d) => d.id === developerParam) ||
        developers.find((d) => (d.slug ?? "").toLowerCase() === normalized) ||
        developers.find((d) => (d.slug ?? "").toLowerCase().includes(normalized)) ||
        developers.find((d) => normalized.includes((d.slug ?? "").toLowerCase())) ||
        developers.find((d) => d.name.toLowerCase() === normalized) ||
        developers.find((d) => d.name.toLowerCase().includes(normalized));

      if (matchedDeveloper) {
        developerIdFromUrl = matchedDeveloper.id;
      } else {
        // If a developer param exists but we can't resolve it, don't clobber current filters
        return;
      }
    }

    const tx: ExtendedFilterState['transactionType'] =
      newTransaction === 'rent' ? 'rent' : 'buy';

    // Apply filters if any URL params exist
    if (newTransaction || newStatus || developerIdFromUrl || keywordParam || areaParam) {
      const updated: ExtendedFilterState = {
        ...defaultExtendedFilters,
        transactionType: tx,
        completionStatus: newStatus || null,
        developerId: developerIdFromUrl,
        search: keywordParam ?? "",
        trendingArea: areaParam || null,
      };
      setFilters(updated);
      setAppliedFilters(updated);
    }
  }, [searchParams, developers]);
  
  // Convert extended filters to standard FilterState for useFilteredProjects
  // Use appliedFilters instead of filters for actual filtering
  // Map completionStatus to handoverStatus
  const standardFilters: FilterState = {
    ...appliedFilters,
    currency: appliedFilters.currency as FilterState['currency'],
    handoverStatus: appliedFilters.completionStatus,
  };

  const filteredProjects = useFilteredProjects(projects, standardFilters);

  // Show ALL developers sorted by rank (top to lowest)
  const allDevelopersSorted = useMemo(() => {
    if (!developers) return [];
    return [...developers].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  }, [developers]);

  // Get all communities/areas sorted alphabetically
  const allAreasSorted = useMemo(() => {
    if (!communities) return [];
    return [...communities].sort((a, b) => a.name.localeCompare(b.name));
  }, [communities]);
  // Sort projects
  const sortedProjects = useMemo(() => {
    let sorted = [...filteredProjects];
    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
        break;
      case "price-high":
        sorted.sort((a, b) => (b.price_from || 0) - (a.price_from || 0));
        break;
      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case "newest":
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return sorted;
  }, [filteredProjects, sortBy]);

  const updateFilter = <K extends keyof ExtendedFilterState>(key: K, value: ExtendedFilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters when search button is clicked
  const handleSearch = () => {
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    setFilters(defaultExtendedFilters);
    setAppliedFilters(defaultExtendedFilters);
    setSortBy("newest");
  };

  // Format price with currency
  const formatPrice = (value: number) => {
    const converted = value * CURRENCY_RATES[filters.currency];
    const symbol = CURRENCY_SYMBOLS[filters.currency];
    if (converted >= 1000000000) return `${symbol} ${(converted / 1000000000).toFixed(1)}B`;
    if (converted >= 1000000) return `${symbol} ${(converted / 1000000).toFixed(0)}M`;
    if (converted >= 1000) return `${symbol} ${(converted / 1000).toFixed(0)}K`;
    return `${symbol} ${converted.toFixed(0)}`;
  };

  // Build SureForms URL with context
  const buildSureFormsUrl = () => {
    const baseUrl = CONTACT_INFO.inquiryFormUrl;
    const params = new URLSearchParams();
    
    if (filters.search) params.append('keyword', filters.search);
    if (filters.emirate) params.append('location', filters.emirate);
    if (filters.developerId) {
      const dev = developers?.find(d => d.id === filters.developerId);
      if (dev) params.append('developer', dev.name);
    }
    if (filters.priceMin > 0) params.append('price_min', String(filters.priceMin));
    if (filters.priceMax < 500000000) params.append('price_max', String(filters.priceMax));
    if (filters.sizeMin > 0) params.append('size_min', String(filters.sizeMin));
    if (filters.sizeMax < 50000) params.append('size_max', String(filters.sizeMax));
    params.append('size_unit', filters.sizeUnit);
    params.append('currency', filters.currency);
    if (sortBy !== 'newest') params.append('sort', sortBy);
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const handleInquirySubmit = () => {
    window.open(buildSureFormsUrl(), '_blank', 'noopener,noreferrer');
    setIsRequestFormOpen(false);
  };

  const activeFilterCount = [
    filters.search,
    filters.priceMin > 0 || filters.priceMax < 500000000,
    filters.sizeMin > 0 || filters.sizeMax < 50000,
    filters.bedroomsMin !== null,
    filters.communityId !== null,
    filters.developerId !== null,
    filters.emirate !== null,
    filters.propertyType !== null,
    filters.bathroomsMin !== null,
    filters.completionStatus !== null,
    filters.investmentType !== null,
    filters.saleStatus !== null,
  ].filter(Boolean).length;

  // Dynamic SEO based on transaction type per Master Blueprint
  const dynamicSEO = appliedFilters.transactionType === 'rent'
    ? blueprintPagesSEO.rentListings
    : blueprintPagesSEO.buyListings;

  return (
    <>
      <SEOHead 
        title={dynamicSEO.title}
        description={dynamicSEO.metaDescription}
      />
      <div className="min-h-screen bg-[hsl(var(--premium-bg))]">
      
      
      {/* Hero Section - Multi-Scene Cinematic Video */}
      <PropertiesHeroVideo>
        <div className="relative z-10 container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Label - Glass style with gold border, engraved look */}
            <button 
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 cursor-default"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(200,167,102,0.6)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Properties</span>
            </button>
            
            {/* Heading */}
            <h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-[-0.02em]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Curated Listings. Global Standard.
            </h1>
            
            {/* Subtitle */}
            <p className="text-zinc-300 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed">
              Exclusive investment-grade properties with trusted advisory.
            </p>
          </motion.div>
        </div>
      </PropertiesHeroVideo>

      {/* Filters Section - 3-Layer System: Black > Active Champagne > Pearl Filter Boxes */}
      <section className="sticky top-16 lg:top-[72px] z-40 bg-black py-4 border-b border-gold/30" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="container mx-auto px-3 sm:px-4">
          {/* Active Champagne Layer with thin black contour visible at edges */}
          <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl p-4 sm:p-5 shadow-lg" style={{ overflow: 'visible' }}>
          {/* Transaction Type Tabs - Buy / Rent */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-black/70 text-sm mr-2 font-medium">I want to:</span>
            {[
              { value: 'buy', label: 'Buy' },
              { value: 'rent', label: 'Rent' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={filters.transactionType === option.value ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  updateFilter("transactionType", option.value as 'buy' | 'rent');
                  updateFilter("completionStatus", null);
                  setAppliedFilters((prev) => ({
                    ...prev,
                    transactionType: option.value as 'buy' | 'rent',
                    completionStatus: null,
                  }));
                }}
                className="h-9 px-4 rounded-full"
              >
                {option.label}
              </Button>
            ))}

            {/* Buy-only Status Shortcuts */}
            {appliedFilters.transactionType === 'buy' && (
              <>
                <div className="w-px h-6 bg-gold/30 mx-2" />

                {/* All status */}
                <Button
                  variant={appliedFilters.completionStatus === null ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => {
                    updateFilter("completionStatus", null);
                    setAppliedFilters((prev) => ({ ...prev, completionStatus: null, transactionType: 'buy' }));
                  }}
                  className="h-9 px-4 rounded-full"
                >
                  All
                </Button>

                {/* Ready */}
                <Button
                  variant={appliedFilters.completionStatus === 'ready' ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => {
                    const newStatus = appliedFilters.completionStatus === 'ready' ? null : 'ready';
                    updateFilter("completionStatus", newStatus);
                    setAppliedFilters((prev) => ({ ...prev, completionStatus: newStatus, transactionType: 'buy' }));
                  }}
                  className="h-9 px-4 rounded-full flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Ready
                </Button>

                {/* Off-Plan */}
                <Button
                  variant={appliedFilters.completionStatus === 'off-plan' ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => {
                    const newStatus = appliedFilters.completionStatus === 'off-plan' ? null : 'off-plan';
                    updateFilter("completionStatus", newStatus);
                    setAppliedFilters((prev) => ({ ...prev, completionStatus: newStatus, transactionType: 'buy' }));
                  }}
                  className="h-9 px-4 rounded-full flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Off-Plan
                </Button>
              </>
            )}
          </div>
          
          {/* Keyword Search - Full Width */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
            <Input
              placeholder="Search by project name, developer, location..."
              value={filters.search}
              onChange={(e) => {
                const next = e.target.value;
                updateFilter("search", next);
                setAppliedFilters((prev) => ({ ...prev, search: next }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="h-12 pl-12 pr-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-zinc-500 focus:border-gold rounded-lg text-base shadow-sm w-full"
            />

          </div>

          {/* Second Row - All Filters in Two Lines for Readability */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            {/* Location - All 7 Emirates */}
            <Select
              value={filters.emirate || "all"}
              onValueChange={(value) => updateFilter("emirate", value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-lg text-sm shadow-sm">
                <MapPin className="w-4 h-4 mr-2 text-gold flex-shrink-0" />
                <span className="truncate text-left flex-1">{filters.emirate || "All Emirates"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Emirates</SelectItem>
                <SelectItem value="Dubai">Dubai</SelectItem>
                <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                <SelectItem value="Sharjah">Sharjah</SelectItem>
                <SelectItem value="Ajman">Ajman</SelectItem>
                <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                <SelectItem value="Fujairah">Fujairah</SelectItem>
                <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
              </SelectContent>
            </Select>

            {/* Area/Community */}
            <Select
              value={filters.communityId || "all"}
              onValueChange={(value) => updateFilter("communityId", value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-lg text-sm shadow-sm">
                <Home className="w-4 h-4 mr-2 text-gold flex-shrink-0" />
                <span className="truncate text-left flex-1">
                  {filters.communityId 
                    ? allAreasSorted?.find(a => a.id === filters.communityId)?.name || "All Areas"
                    : "All Areas"}
                </span>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Areas</SelectItem>
                {allAreasSorted?.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Developer - ALL developers sorted by rank */}
            <Select
              value={filters.developerId || "all"}
              onValueChange={(value) => updateFilter("developerId", value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-lg text-sm shadow-sm">
                <Building2 className="w-4 h-4 mr-2 text-gold flex-shrink-0" />
                <span className="truncate text-left flex-1">
                  {filters.developerId 
                    ? allDevelopersSorted?.find(d => d.id === filters.developerId)?.name || "All Developers"
                    : "All Developers"}
                </span>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All Developers</SelectItem>
                {allDevelopersSorted?.map((dev) => (
                  <SelectItem key={dev.id} value={dev.id}>
                    {dev.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Range - Full readable text */}
            <Select
              value={
                filters.priceMin === 0 && filters.priceMax === 500000000 
                  ? "all" 
                  : `${filters.priceMin}-${filters.priceMax}`
              }
              onValueChange={(value) => {
                if (value === "all") {
                  updateFilter("priceMin", 0);
                  updateFilter("priceMax", 500000000);
                } else {
                  const [min, max] = value.split("-").map(Number);
                  updateFilter("priceMin", min);
                  updateFilter("priceMax", max);
                }
              }}
            >
              <SelectTrigger className="w-full h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-lg text-sm shadow-sm">
                <DollarSign className="w-4 h-4 mr-2 text-gold flex-shrink-0" />
                <span className="truncate text-left flex-1">
                  {filters.priceMin === 0 && filters.priceMax === 500000000
                    ? "Any Price"
                    : filters.priceMax === 1000000
                    ? "Under AED 1M"
                    : filters.priceMax === 3000000
                    ? "AED 1M - 3M"
                    : filters.priceMax === 5000000
                    ? "AED 3M - 5M"
                    : filters.priceMax === 10000000
                    ? "AED 5M - 10M"
                    : "AED 10M+"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Price</SelectItem>
                <SelectItem value="0-1000000">Under AED 1M</SelectItem>
                <SelectItem value="1000000-3000000">AED 1M - 3M</SelectItem>
                <SelectItem value="3000000-5000000">AED 3M - 5M</SelectItem>
                <SelectItem value="5000000-10000000">AED 5M - 10M</SelectItem>
                <SelectItem value="10000000-500000000">AED 10M+</SelectItem>
              </SelectContent>
            </Select>

            {/* Size Unit */}
            <Select
              value={filters.sizeUnit}
              onValueChange={(value) => updateFilter("sizeUnit", value as 'sqft' | 'sqm')}
            >
              <SelectTrigger className="w-full h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-lg text-sm shadow-sm">
                <Maximize2 className="w-4 h-4 mr-2 text-gold flex-shrink-0" />
                <span className="truncate text-left flex-1">{filters.sizeUnit === 'sqft' ? 'Square Feet' : 'Square Meters'}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sqft">Square Feet (sq ft)</SelectItem>
                <SelectItem value="sqm">Square Meters (sq m)</SelectItem>
              </SelectContent>
            </Select>

            {/* Currency */}
            <Select
              value={filters.currency}
              onValueChange={(value) => updateFilter("currency", value as ExtendedCurrency)}
            >
              <SelectTrigger className="w-full h-11 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-lg text-sm shadow-sm">
                <span className="truncate text-left flex-1">
                  {filters.currency === 'AED' ? 'AED (Dirham)' 
                    : filters.currency === 'USD' ? 'USD (Dollar)' 
                    : filters.currency === 'EUR' ? 'EUR (Euro)' 
                    : filters.currency === 'GBP' ? 'GBP (Pound)' 
                    : 'INR (Rupee)'}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AED">AED (Dirham)</SelectItem>
                <SelectItem value="USD">USD (Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="GBP">GBP (Pound)</SelectItem>
                <SelectItem value="INR">INR (Rupee)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Third Row - Display Mode, Sale Status, Premium, Advanced Filters */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {/* Display Mode Toggle */}
            <DisplayModeToggle
              value={displayMode}
              onChange={setDisplayMode}
              variant="light"
              size="sm"
            />

            {/* Sale Status with colored dots */}
            <SaleStatusSelect
              value={filters.saleStatus}
              onChange={(val) => {
                updateFilter("saleStatus", val);
                setAppliedFilters(prev => ({ ...prev, saleStatus: val }));
              }}
              variant="light"
            />

            {/* Premium Filter Toggle */}
            <Button
              variant={filters.premiumOnly ? "default" : "outline"}
              onClick={() => {
                updateFilter("premiumOnly", !filters.premiumOnly);
                setAppliedFilters(prev => ({ ...prev, premiumOnly: !filters.premiumOnly }));
              }}
              className={`h-11 px-4 rounded-lg flex items-center gap-2 text-sm shadow-sm ${
                filters.premiumOnly 
                  ? "bg-gradient-to-r from-gold to-[#E8D5A3] text-black border-gold font-bold" 
                  : "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black hover:border-gold"
              }`}
            >
              <Crown className="w-4 h-4" />
              Premium Only
            </Button>

            {/* Hide Sold Out Toggle */}
            <label className="flex items-center gap-2 h-11 px-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-lg cursor-pointer hover:border-gold transition-all shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              <span className="text-sm text-black font-medium whitespace-nowrap">Hide Sold Out</span>
              <Switch
                checked={appliedFilters.hideSoldOut}
                onCheckedChange={(checked) => {
                  updateFilter("hideSoldOut", checked);
                  setAppliedFilters(prev => ({ ...prev, hideSoldOut: checked }));
                }}
              />
            </label>

            {/* Advanced Filters Button */}
            <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-11 px-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black hover:border-gold rounded-lg shadow-sm flex items-center gap-2"
                >
                  <Filter className="w-4 h-4 text-gold" />
                  <span>More Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-gold text-black text-xs font-bold rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border-gold/30 text-black p-0">
                <DialogHeader className="p-6 border-b border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                  <DialogTitle className="text-xl font-semibold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Advanced <span className="text-gold">Filters</span>
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                  <div className="p-6 space-y-6 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                    {/* Property Type */}
                    <div>
                      <label className="text-sm text-gold font-medium mb-2 block">Property Type</label>
                      <Select
                        value={filters.propertyType || "all"}
                        onValueChange={(value) => updateFilter("propertyType", value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-full h-12 bg-[#F5F0E6] border-gold/30 text-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPERTY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Bedrooms & Bathrooms */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gold font-medium mb-2 block">Bedrooms</label>
                        <Select
                          value={filters.bedroomsMin === null ? "all" : filters.bedroomsMin === 0 ? "studio" : String(filters.bedroomsMin)}
                          onValueChange={(value) => {
                            if (value === "all") updateFilter("bedroomsMin", null);
                            else if (value === "studio") updateFilter("bedroomsMin", 0);
                            else updateFilter("bedroomsMin", parseInt(value));
                          }}
                        >
                          <SelectTrigger className="w-full h-12 bg-[#F5F0E6] border-gold/30 text-black">
                            <Bed className="w-4 h-4 mr-2 text-gold" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BEDROOM_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-gold font-medium mb-2 block">Bathrooms</label>
                        <Select
                          value={filters.bathroomsMin === null ? "all" : String(filters.bathroomsMin)}
                          onValueChange={(value) => updateFilter("bathroomsMin", value === "all" ? null : parseInt(value))}
                        >
                          <SelectTrigger className="w-full h-12 bg-[#F5F0E6] border-gold/30 text-black">
                            <Bath className="w-4 h-4 mr-2 text-gold" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BATHROOM_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Size Range */}
                    <div>
                      <label className="text-sm text-gold font-medium mb-2 block">Size ({filters.sizeUnit})</label>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters.sizeMin || ""}
                          onChange={(e) => updateFilter("sizeMin", parseInt(e.target.value) || 0)}
                          className="h-12 bg-[#F5F0E6] border-gold/30 text-black placeholder:text-zinc-500"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters.sizeMax < 50000 ? filters.sizeMax : ""}
                          onChange={(e) => updateFilter("sizeMax", parseInt(e.target.value) || 50000)}
                          className="h-12 bg-[#F5F0E6] border-gold/30 text-black placeholder:text-zinc-500"
                        />
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="text-sm text-gold font-medium mb-2 block">Price Range ({filters.currency})</label>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <Input
                          type="text"
                          placeholder="Min"
                          value={filters.priceMin > 0 ? filters.priceMin.toLocaleString() : ""}
                          onChange={(e) => updateFilter("priceMin", parseInt(e.target.value.replace(/,/g, '')) || 0)}
                          className="h-12 bg-[#F5F0E6] border-gold/30 text-black placeholder:text-zinc-500"
                        />
                        <Input
                          type="text"
                          placeholder="Max"
                          value={filters.priceMax < 500000000 ? filters.priceMax.toLocaleString() : ""}
                          onChange={(e) => updateFilter("priceMax", parseInt(e.target.value.replace(/,/g, '')) || 500000000)}
                          className="h-12 bg-[#F5F0E6] border-gold/30 text-black placeholder:text-zinc-500"
                        />
                      </div>
                    </div>

                    {/* Completion Status */}
                    <div>
                      <label className="text-sm text-gold font-medium mb-2 block">Completion Status</label>
                      <Select
                        value={filters.completionStatus || "all"}
                        onValueChange={(value) => updateFilter("completionStatus", value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-full h-12 bg-[#F5F0E6] border-gold/30 text-black">
                          <Calendar className="w-4 h-4 mr-2 text-gold" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPLETION_STATUS.map((status) => (
                            <SelectItem key={status.value} value={status.value} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Investment Type */}
                    <div>
                      <label className="text-sm text-gold font-medium mb-2 block">Investment Type</label>
                      <Select
                        value={filters.investmentType || "all"}
                        onValueChange={(value) => updateFilter("investmentType", value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-full h-12 bg-[#F5F0E6] border-gold/30 text-black">
                          <Home className="w-4 h-4 mr-2 text-gold" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INVESTMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sale Status */}
                    <div>
                      <label className="text-sm text-gold font-medium mb-2 block">Sale Status</label>
                      <Select
                        value={filters.saleStatus || "all"}
                        onValueChange={(value) => updateFilter("saleStatus", value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-full h-12 bg-[#F5F0E6] border-gold/30 text-black">
                          <CheckCircle className="w-4 h-4 mr-2 text-gold" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SALE_STATUS.map((status) => (
                            <SelectItem key={status.value} value={status.value} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Area Filter */}
                    <div>
                      <label className="text-sm text-gold font-medium mb-2 block">Area</label>
                      <Select
                        value={filters.areaId || "all"}
                        onValueChange={(value) => updateFilter("areaId", value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-full h-12 bg-[#F5F0E6] border-gold/30 text-black">
                          <MapPin className="w-4 h-4 mr-2 text-gold" />
                          <SelectValue placeholder="All Areas" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="all" className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">All Areas</SelectItem>
                          {areas?.map((area) => (
                            <SelectItem key={area.id} value={area.id} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                              {area.name} ({area.emirate})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Community */}
                    <div>
                      <label className="text-sm text-gold font-medium mb-2 block">Community</label>
                      <Select
                        value={filters.communityId || "all"}
                        onValueChange={(value) => updateFilter("communityId", value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-full h-12 bg-[#F5F0E6] border-gold/30 text-black">
                          <MapPin className="w-4 h-4 mr-2 text-gold" />
                          <SelectValue placeholder="All Communities" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="all" className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">All Communities</SelectItem>
                          {communities?.map((comm) => (
                            <SelectItem key={comm.id} value={comm.id} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                              {comm.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </ScrollArea>
                <div className="p-6 border-t border-gold/20 flex justify-between bg-gradient-to-r from-[#F5F0E6] to-[#FBF8F3]">
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-zinc-600 hover:text-black"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={() => setIsAdvancedOpen(false)}
                    variant="primary"
                    className="px-8"
                  >
                    Apply Filters
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* SEARCH Button - 3D Premium Style */}
            <button 
              onClick={handleSearch}
              className="relative h-10 px-6 rounded-lg text-sm flex-shrink-0 font-bold transition-all duration-300 group overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                boxShadow: `
                  0 6px 20px rgba(200,167,102,0.4),
                  0 4px 10px rgba(0,0,0,0.15),
                  inset 0 2px 3px rgba(255,255,255,0.9),
                  inset 0 -2px 3px rgba(200,167,102,0.2),
                  0 0 15px rgba(200,167,102,0.3)
                `,
              }}
            >
              <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
              <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 30px rgba(200,167,102,0.6), inset 0 0 15px rgba(200,167,102,0.1)' }} />
              <span className="relative text-gold font-semibold">SEARCH</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 mt-5">
            {[
              { value: "newest", label: "Newest" },
              { value: "oldest", label: "Oldest" },
              { value: "price-low", label: "Low → High" },
              { value: "price-high", label: "High → Low" },
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
          </div>
          </div>
        </div>
      </section>

      {/* Divider between Search and Results */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Results Section - 3-Layer System: Black > Active Champagne > Listings */}
      <section className="py-12 bg-black">
        <div className="container mx-auto px-3 sm:px-4">
          {/* OUTER LAYER - Active Champagne with thin black contour visible at edges */}
          <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl p-4 sm:p-5">
            
            {/* Header Section - Off-plan properties message */}
            {appliedFilters.transactionType === 'buy' && appliedFilters.completionStatus !== 'ready' && (
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-2xl md:text-3xl font-bold text-black mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Off-plan properties for sale in Dubai
                </h2>
                <p className="text-black/70 text-sm md:text-base flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-gold/50 text-gold text-xs flex-shrink-0 mt-0.5">i</span>
                  <span>
                    Looking for off-plan properties for sale in Dubai? Contact <span className="font-semibold text-gold">JBJ Global Real Estate</span> in Dubai to find the right property for you.
                  </span>
                </p>
              </div>
            )}
            
            {/* Results Count - Inside active layer */}
            <div className="mb-6 flex items-center justify-between px-4 pt-4">
              <p className="text-black/70">
                Showing <span className="text-gold font-medium">{sortedProjects.length}</span> properties
                {appliedFilters.transactionType === 'rent' && ' for rent'}
                {appliedFilters.transactionType === 'buy' && ' for sale'}
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

            {/* Projects Grid - Inside active layer - 2-3 cards per row for wider balanced layout */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-2xl h-[480px] animate-pulse border-2 border-gold/30" />
                ))}
              </div>
            ) : sortedProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-4">
                {sortedProjects.map((project, index) => {
                  // Insert featured ads after specific positions (after 6, 12, 18 cards)
                  const adAfterIndex = [5, 11, 17]; // 0-indexed: after 6th, 12th, 18th card
                  const adIndex = adAfterIndex.indexOf(index);
                  const featuredAd = adIndex !== -1 && FEATURED_ADS[adIndex] ? FEATURED_ADS[adIndex] : null;
                  
                  return (
                    <>
                      <ProjectCard 
                        key={project.id} 
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
                    </>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 px-4">
                {/* Developer Selected but No Listings */}
                {appliedFilters.developerId && developers?.find(d => d.id === appliedFilters.developerId) ? (
                  <>
                    <div className="w-24 h-24 bg-gradient-to-br from-gold/20 to-gold/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/30">
                      <Building2 className="w-12 h-12 text-gold" />
                    </div>
                    <h3 className="text-2xl font-semibold text-black mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                      No Listings Yet for {developers.find(d => d.id === appliedFilters.developerId)?.name}
                    </h3>
                    <p className="text-zinc-600 mb-6 max-w-md mx-auto">
                      We're currently adding properties from this developer to our portfolio. 
                      Register your interest to be notified when listings become available.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button asChild variant="primary" className="h-12 px-8">
                        <a 
                          href={getWhatsAppUrl(`Hi, I'm interested in properties from ${developers.find(d => d.id === appliedFilters.developerId)?.name}. Please let me know when listings become available.`)}
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Register Interest via WhatsApp
                        </a>
                      </Button>
                      <Button onClick={clearFilters} variant="outline" className="border-zinc-300 text-black hover:bg-zinc-100 h-12 px-6">
                        Browse All Properties
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/30 shadow-[0_0_30px_rgba(200,167,102,0.3)]">
                      <Search className="w-10 h-10 text-gold drop-shadow-[0_0_8px_rgba(200,167,102,0.5)]" />
                    </div>
                    {appliedFilters.transactionType === 'rent' ? (
                      <>
                        <h3 className="text-xl font-semibold text-black mb-2">No Rental Listings Available</h3>
                        <p className="text-zinc-600 mb-4">We currently do not have rental properties listed. Please check back soon or contact us for assistance.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                          <a href={`tel:${CONTACT_INFO.phoneRaw}`} className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors">
                            <Phone className="w-4 h-4" />
                            <span className="font-medium">{CONTACT_INFO.phone}</span>
                          </a>
                          <span className="hidden sm:inline text-zinc-400">|</span>
                          <a href={`mailto:${CONTACT_INFO.email}`} className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors">
                            <Mail className="w-4 h-4" />
                            <span className="font-medium">{CONTACT_INFO.email}</span>
                          </a>
                        </div>
                      </>
                    ) : appliedFilters.transactionType === 'buy' && appliedFilters.completionStatus === 'ready' ? (
                      <>
                        <h3 className="text-xl font-semibold text-black mb-2">No Ready Properties Found</h3>
                        <p className="text-zinc-600 mb-6">Try adjusting your filters or search criteria to find available ready properties.</p>
                      </>
                    ) : appliedFilters.transactionType === 'buy' && appliedFilters.completionStatus === 'off-plan' ? (
                      <>
                        <h3 className="text-xl font-semibold text-black mb-2">No Off-Plan Properties Found</h3>
                        <p className="text-zinc-600 mb-6">Try adjusting your filters or search criteria to find available off-plan properties.</p>
                      </>
                    ) : appliedFilters.transactionType === 'buy' ? (
                      <>
                        <h3 className="text-xl font-semibold text-black mb-2">No Properties for Sale Found</h3>
                        <p className="text-zinc-600 mb-6">Try adjusting your filters or search criteria to find available properties.</p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold text-black mb-2">No properties found</h3>
                        <p className="text-zinc-600 mb-6">Try adjusting your filters or search criteria</p>
                      </>
                    )}
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="border-border text-foreground hover:bg-muted"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CONSOLIDATED: Unified "Confused About Where to Buy" Section with Consultation Form */}
      <section className="py-16 sm:py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="jj-layer-2 p-6 sm:p-8 md:p-10 rounded-2xl">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left: Content */}
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-xs uppercase tracking-wider text-gold mb-4">
                    <HelpCircle className="w-3 h-3" />
                    Get Expert Guidance
                  </div>
                  <h2 
                    className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-4"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Confused About Where to <span className="text-gold">Buy or Invest</span> in Dubai?
                  </h2>
                  <p className="text-zinc-600 mb-6">
                    Our experienced advisors help you navigate Dubai's dynamic real estate market. 
                    Get personalized recommendations based on your goals, budget, and timeline.
                  </p>
                  <ul className="space-y-2 text-sm text-zinc-600 mb-6">
                    <li className="flex items-center gap-2 justify-center md:justify-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                      Flexible payment plans tailored to your investment timeline
                    </li>
                    <li className="flex items-center gap-2 justify-center md:justify-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                      Trusted developers: Emaar, Damac, Sobha, Nakheel & more
                    </li>
                    <li className="flex items-center gap-2 justify-center md:justify-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                      ROI projections and market insights included
                    </li>
                  </ul>
                </div>

                {/* Right: Consultation Form */}
                <div>
                  <ConsultationRequestForm
                    title="Request a Consultation"
                    subtitle="Connect with our expert team for personalized guidance."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Active Lead Banner for CRM linking */}
      <ActiveLeadBanner showAddToShortlist={false} />
      </div>
    </>
  );
};

export default Properties;
