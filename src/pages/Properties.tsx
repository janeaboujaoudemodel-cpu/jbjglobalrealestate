import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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
import { ActiveFilterIndicator } from "@/components/properties/ActiveFilterIndicator";

// DisplayModeToggle removed — user mode already chosen globally in header
import { SettingsDropdown } from "@/components/filters/SettingsDropdown";
import { SortBySelect } from "@/components/filters/SortBySelect";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";


import ProjectCard from "@/components/ProjectCard";
import { useProjectsListing, useCommunities, useDevelopers } from "@/hooks/useProjects";
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
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";
import { applyShortcutFilters } from "@/utils/applyShortcutFilters";
import PropertiesMapView from "@/components/maps/PropertiesMapView";
// PropertiesVerticalNav removed — handled globally by MainLayout

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

const isReadyProject = (project: object) => {
  const p = project as {
    construction_status?: unknown;
    status?: unknown;
    status_label?: unknown;
    handover_date?: unknown;
    availability_status?: unknown;
  };
  const statusText = [
    p.construction_status,
    p.status,
    p.status_label,
    p.handover_date,
    p.availability_status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /\b(ready|completed|complete|delivered)\b/.test(statusText);
};

const prioritizeOffPlan = <T extends object>(projects: T[]): T[] =>
  [...projects].sort((a, b) => Number(isReadyProject(a)) - Number(isReadyProject(b)));

// Sale status options with color dots
const SALE_STATUS = [
  { value: "all", label: "All Sale Statuses", dotClass: null },
  { value: "Announced", label: "Announced", dotClass: "bg-pink-400" },
  { value: "Presale (EOI)", label: "Pre-sale (EOI)", dotClass: "jj-surface-emerald" },
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
  const { data: projects, isLoading } = useProjectsListing();
  const { data: communities } = useCommunities();
  const { data: developers } = useDevelopers();
  const { data: areas } = useAreas();
  const { t } = useLanguage();
  
  const [filters, setFilters] = useState<ExtendedFilterState>(defaultExtendedFilters);
  const [appliedFilters, setAppliedFilters] = useState<ExtendedFilterState>(defaultExtendedFilters);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  // displayMode state removed — toggle no longer rendered on Properties page
  const [isFilterFixed, setIsFilterFixed] = useState(false);
  const filterSentinelRef = useRef<HTMLDivElement>(null);
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);

  // Listen for global filter changes from the header bar
  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent<ShortcutFilterState>).detail;
      if (next) setShortcutFilters(next);
    };
    window.addEventListener('globalFilterChange', handler);
    return () => window.removeEventListener('globalFilterChange', handler);
  }, []);
  const [isMapMode, setIsMapMode] = useState(false);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const cardListRef = useRef<HTMLDivElement>(null);

  // Two-phase scroll-to-fix filter logic
  useEffect(() => {
    const sentinel = filterSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFilterFixed(!entry.isIntersecting && entry.boundingClientRect.top < 140);
      },
      { threshold: 0, rootMargin: "-140px 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Detect ?view=map from URL
  useEffect(() => {
    if (searchParams.get('view') === 'map') {
      setIsMapMode(true);
    }
  }, [searchParams]);

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

    // New params from HeroSearchBar
    const bedsParam = searchParams.get('beds');
    const typeParam = searchParams.get('type');
    const priceMinParam = searchParams.get('priceMin');
    const priceMaxParam = searchParams.get('priceMax');
    const sizeMinParam = searchParams.get('sizeMin');
    const sizeMaxParam = searchParams.get('sizeMax');
    const sizeUnitParam = searchParams.get('sizeUnit') as 'sqft' | 'sqm' | null;
    const currencyParam = searchParams.get('currency') as ExtendedCurrency | null;
    const emirateParam = searchParams.get('emirate');
    const saleStatusParam = searchParams.get('saleStatus');
    const communityParam = searchParams.get('community');
    const sortParam = searchParams.get('sort');

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
      }
    }

    // Resolve communityId from param (accepts id/name; area slugs route to trendingArea)
    let communityIdFromUrl: string | null = null;
    if (communityParam && communities && communities.length > 0) {
      const normalized = communityParam.toLowerCase().trim();
      const matched = communities.find((c) => c.id === communityParam) ||
        communities.find((c) => c.name.toLowerCase() === normalized) ||
        communities.find((c) => c.name.toLowerCase().includes(normalized));
      if (matched) communityIdFromUrl = matched.id;
    }

    const tx: ExtendedFilterState['transactionType'] =
      newTransaction === 'rent' ? 'rent' : 'buy';

    const normalizedAreaParam = areaParam?.toLowerCase().trim() || null;
    const resolvedAreaName = normalizedAreaParam && areas?.length
      ? areas.find((a) => a.slug?.toLowerCase() === normalizedAreaParam || a.name?.toLowerCase() === normalizedAreaParam)?.name || areaParam
      : areaParam;

    const fallbackKeyword = keywordParam || (!developerIdFromUrl && developerParam ? developerParam : "");

    const hasAnyParam = newTransaction || newStatus || developerParam || keywordParam || areaParam ||
      bedsParam || typeParam || priceMinParam || priceMaxParam || sizeMinParam || sizeMaxParam ||
      currencyParam || emirateParam || saleStatusParam || communityIdFromUrl || sortParam;

    // Apply filters if any URL params exist
    if (hasAnyParam) {
      const bedroomsMin = bedsParam ? (bedsParam === 'studio' ? 0 : bedsParam === 'any' ? null : parseInt(bedsParam) || null) : null;

      const updated: ExtendedFilterState = {
        ...defaultExtendedFilters,
        transactionType: tx,
        completionStatus: newStatus || null,
        developerId: developerIdFromUrl,
        search: fallbackKeyword,
        trendingArea: resolvedAreaName || null,
        bedroomsMin: bedroomsMin,
        propertyType: typeParam && typeParam !== 'all' ? typeParam : null,
        priceMin: priceMinParam ? Number(priceMinParam) : 0,
        priceMax: priceMaxParam ? Number(priceMaxParam) : 500000000,
        sizeMin: sizeMinParam ? Number(sizeMinParam) : 0,
        sizeMax: sizeMaxParam ? Number(sizeMaxParam) : 50000,
        sizeUnit: sizeUnitParam || 'sqft',
        currency: (currencyParam || 'AED') as ExtendedCurrency,
        emirate: emirateParam && emirateParam !== 'all' ? emirateParam : null,
        saleStatus: saleStatusParam && saleStatusParam !== 'all' ? saleStatusParam : null,
        communityId: communityIdFromUrl,
      };
      setFilters(updated);
      setAppliedFilters(updated);
      if (sortParam) setSortBy(sortParam);
    } else if (searchParams.toString() === '') {
      // No URL params at all — ensure defaults show all projects
      setFilters(defaultExtendedFilters);
      setAppliedFilters(defaultExtendedFilters);
    }
  }, [searchParams, developers, communities, areas]);
  
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
    if (appliedFilters.completionStatus !== 'ready') {
      sorted = prioritizeOffPlan(sorted);
    }
    return sorted;
  }, [filteredProjects, sortBy, appliedFilters.completionStatus]);


  // Apply shortcut filters (price, bedrooms, status, construction, handover, etc.) reactively
  const finalProjects = useMemo(() => {
    const filtered = applyShortcutFilters(sortedProjects, shortcutFilters);
    return appliedFilters.completionStatus === 'ready' ? filtered : prioritizeOffPlan(filtered);
  }, [sortedProjects, shortcutFilters, appliedFilters.completionStatus]);
  // Pagination — 12 per page with numeric page controls
  const PAGE_SIZE = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(finalProjects.length / PAGE_SIZE));
  useEffect(() => { setCurrentPage(1); }, [finalProjects.length]);
  const safePage = Math.min(currentPage, totalPages);
  const visibleProjects = useMemo(
    () => finalProjects.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [finalProjects, safePage],
  );

  // Brief "filtering" skeleton state — keeps the UI responsive on slow devices
  // when users change filters/sort so results never feel frozen.
  // Skeletons only on initial fetch; filter/sort changes apply synchronously.
  const showSkeletons = isLoading;

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
      <div data-surface="page" className="min-h-screen bg-[hsl(var(--premium-bg))]">
      
      
      {/* Hero Section - Multi-Scene Cinematic Video */}
      <PropertiesHeroVideo>
        <div className="relative z-10 container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Heading */}
            <h1 
              className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 tracking-[-0.02em]"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.7)' }}
            >
              Curated Listings. Global Standard.
            </h1>
            
            {/* Subtitle */}
            <p
              className="text-white text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-light"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.7)' }}
            >
              Exclusive investment-grade properties with trusted advisory.
            </p>
          </motion.div>
        </div>
      </PropertiesHeroVideo>

      {/* Scroll sentinel for two-phase filter fix */}
      <div ref={filterSentinelRef} className="h-0" />

      {/* Filters Section - sticks below the 88px header on scroll */}
      <section
        data-map-shell={isMapMode ? true : undefined}
        className={`sticky top-[88px] z-40 py-3 md:py-4 ${isMapMode ? "jj-properties-map-filter" : "border-b border-white/12"}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          background: isMapMode ? undefined : "linear-gradient(180deg,#064E3B 0%,#042C1C 55%,#031E14 100%)",
        }}
      >
        <div className="container mx-auto px-3 sm:px-4">
          {/* Active Champagne Layer with thin black contour visible at edges */}
          <div className={isMapMode ? "jj-map-command-bar rounded-2xl p-4 sm:p-5" : "bg-transparent border border-white/12 rounded-2xl p-4 sm:p-5 shadow-lg"} style={{ overflow: 'visible' }}>
          {/* Active deep-link filter chips (status / category) */}
          <ActiveFilterIndicator
            transactionType={appliedFilters.transactionType}
            completionStatus={appliedFilters.completionStatus}
            propertyType={appliedFilters.propertyType}
            onClearStatus={() => {
              updateFilter("completionStatus", null);
              setAppliedFilters((prev) => ({ ...prev, completionStatus: null }));
            }}
            onClearType={() => {
              updateFilter("propertyType", null);
              setAppliedFilters((prev) => ({ ...prev, propertyType: null }));
            }}
            onClearAll={() => {
              updateFilter("completionStatus", null);
              updateFilter("propertyType", null);
              setAppliedFilters((prev) => ({
                ...prev,
                completionStatus: null,
                propertyType: null,
              }));
            }}
          />
          {/* Compact action row: [Intent | Sort By] unified pill + [Search icon] + [Filters] */}
          {(() => {
            const tx = appliedFilters.transactionType;
            const cs = appliedFilters.completionStatus;
            const intentValue =
              tx === 'rent'
                ? 'rent'
                : cs === 'ready'
                ? 'buy-ready'
                : cs === 'off-plan'
                ? 'buy-offplan'
                : 'buy';
            const setIntent = (val: string) => {
              if (val === 'rent') {
                updateFilter('transactionType', 'rent');
                updateFilter('completionStatus', null);
                setAppliedFilters((p) => ({ ...p, transactionType: 'rent', completionStatus: null }));
              } else if (val === 'buy-ready') {
                updateFilter('transactionType', 'buy');
                updateFilter('completionStatus', 'ready');
                setAppliedFilters((p) => ({ ...p, transactionType: 'buy', completionStatus: 'ready' }));
              } else if (val === 'buy-offplan') {
                updateFilter('transactionType', 'buy');
                updateFilter('completionStatus', 'off-plan');
                setAppliedFilters((p) => ({ ...p, transactionType: 'buy', completionStatus: 'off-plan' }));
              } else {
                updateFilter('transactionType', 'buy');
                updateFilter('completionStatus', null);
                setAppliedFilters((p) => ({ ...p, transactionType: 'buy', completionStatus: null }));
              }
            };
            return (
              <div data-no-contrast-guard className="flex items-center gap-2">
                {/* Unified pill: Intent (left half) | Sort By (right half) */}
                  <div
                    className={isMapMode ? "jj-map-segmented-control flex items-stretch h-11 rounded-xl overflow-hidden flex-shrink-0" : "flex items-stretch h-11 rounded-xl border border-white/18 bg-[#04241C] overflow-hidden flex-shrink-0"}
                  data-no-contrast-guard
                >
                  <div className="flex-1 min-w-[110px]">
                    <Select value={intentValue} onValueChange={setIntent}>
                      <SelectTrigger
                        className={isMapMode ? "jj-map-segment h-full w-full px-3 border-0 rounded-none shadow-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus:ring-offset-0 text-[13px] font-semibold" : "allow-white h-full w-full px-3 bg-transparent border-0 rounded-none shadow-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus:ring-offset-0 text-[13px] font-semibold text-white hover:bg-white/10 [&>svg]:text-white"}
                        aria-label="Transaction intent"
                        data-surface={isMapMode ? "emerald" : undefined}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="buy-ready">Buy Ready</SelectItem>
                        <SelectItem value="buy-offplan">Buy Off-Plan</SelectItem>
                        <SelectItem value="rent">Rent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-px bg-white/18 flex-shrink-0" />
                  <div className="flex-1 min-w-[110px] [&_*]:!ring-0 [&_*]:!ring-offset-0 [&_button]:!outline-none">
                    <SortBySelect
                      value={sortBy}
                      onChange={setSortBy}
                      iconOnly
                      borderless
                      size="default"
                      className="h-full w-full rounded-none border-0 shadow-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    />
                  </div>

                </div>


                {/* Search — icon only; opens a popover with the search input */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      data-no-contrast-guard
                      aria-label="Search properties"
                      className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white transition-colors flex-shrink-0"
                      style={{ color: '#FFFFFF' }}
                    >
                      <Search className="w-4 h-4 allow-white" style={{ color: '#FFFFFF' }} strokeWidth={2.2} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={8}
                    data-map-shell={isMapMode ? true : undefined}
                    className={isMapMode ? "w-[320px] sm:w-[380px] p-3 jj-map-command-bar" : "w-[320px] sm:w-[380px] p-3 bg-white border border-[#064E3B]/25"}
                  >
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
                      role="search"
                      className="flex items-center gap-2"
                    >
                      <div className={isMapMode ? "flex flex-1 items-center px-3 h-10 rounded-lg jj-map-search-input" : "flex flex-1 items-center px-3 h-10 rounded-lg border border-[#064E3B]/30 bg-white"}>
                        <Search className="w-4 h-4 mr-2 text-[#1A1A1A]/60" strokeWidth={2} />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search by project name, developer, location…"
                          value={filters.search}
                          onChange={(e) => {
                            const next = e.target.value;
                            updateFilter("search", next);
                            setAppliedFilters((prev) => ({ ...prev, search: next }));
                          }}
                          data-no-contrast-guard
                          className="flex-1 min-w-0 h-full bg-transparent border-0 outline-none text-[14px] tracking-[-0.005em] font-normal"
                          style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}
                        />
                      </div>
                      <button
                        type="submit"
                        data-no-contrast-guard
                        className={isMapMode ? "jj-map-details-button h-10 px-4 rounded-lg text-[13px] font-semibold flex-shrink-0 allow-white" : "h-10 px-4 rounded-lg bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-[13px] font-semibold flex-shrink-0 allow-white"}
                        style={{ color: '#FFFFFF' }}
                      >
                        Search
                      </button>
                    </form>
                  </PopoverContent>
                </Popover>

                {/* Filters — opens the unified filter modal (contains Intent + Search + everything) */}
                <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      data-no-contrast-guard
                      aria-label="Open all filters"
                      className={isMapMode ? "jj-map-details-button inline-flex items-center justify-center gap-2 h-11 px-4 sm:px-5 rounded-xl text-[13px] sm:text-sm font-semibold transition-colors flex-shrink-0 allow-white" : "inline-flex items-center justify-center gap-2 h-11 px-4 sm:px-5 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-[13px] sm:text-sm font-semibold transition-colors flex-shrink-0 allow-white"}
                      style={{ color: '#FFFFFF' }}
                    >
                      <SlidersHorizontal
                        className="w-4 h-4 allow-white"
                        style={{ color: '#FFFFFF' }}
                        data-no-contrast-guard
                        strokeWidth={2.2}
                      />
                      <span
                        className="allow-white"
                        style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
                      >
                        Filters
                      </span>
                      {activeFilterCount > 0 && (
                        <span
                          className="allow-white inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-[#0A0A0A] text-white ring-1 ring-white/25"
                          style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
                          data-no-contrast-guard
                        >
                          {activeFilterCount}
                        </span>
                      )}

                    </button>
                  </DialogTrigger>

                  <DialogContent data-map-shell={isMapMode ? true : undefined} className={isMapMode ? "max-w-2xl jj-map-command-bar p-0" : "max-w-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#064E3B]/30 text-[#1A1A1A] p-0"}>
                    <DialogHeader className={isMapMode ? "p-6 border-b border-white/14" : "p-6 border-b border-[#064E3B]/20 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]"}>
                      <DialogTitle className="text-xl font-semibold text-[#1A1A1A]">
                        Filters
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh]">
                      <div className={isMapMode ? "p-6 space-y-6" : "p-6 space-y-6 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]"}>
                        {/* Search */}
                        <div>
                          <label className="text-sm text-[#1A1A1A] font-medium mb-2 block">Search</label>
                          <div className="flex items-center h-12 px-3 bg-[#F7F2EA] border border-[#064E3B]/30 rounded-lg">
                            <Search className="w-4 h-4 mr-2 text-[#1A1A1A]/60" strokeWidth={2} />
                            <input
                              type="text"
                              placeholder="Project name, developer, location…"
                              value={filters.search}
                              onChange={(e) => {
                                const next = e.target.value;
                                updateFilter("search", next);
                                setAppliedFilters((prev) => ({ ...prev, search: next }));
                              }}
                              data-no-contrast-guard
                              className="flex-1 min-w-0 h-full bg-transparent border-0 outline-none text-[14px] text-[#1A1A1A]"
                              style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}
                            />
                          </div>
                        </div>

                        {/* Intent (Buy / Buy Ready / Buy Off-Plan / Rent) */}
                        <div>
                          <label className="text-sm text-[#1A1A1A] font-medium mb-2 block">Intent</label>
                          <Select value={intentValue} onValueChange={setIntent}>
                              <SelectTrigger className="w-full h-auto min-h-12 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buy">Buy</SelectItem>
                              <SelectItem value="buy-ready">Buy Ready</SelectItem>
                              <SelectItem value="buy-offplan">Buy Off-Plan</SelectItem>
                              <SelectItem value="rent">Rent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Emirate + Area */}
                        <div className="grid grid-cols-2 gap-4">

                          <div>
                            <label className="text-sm text-[#1A1A1A] font-medium mb-2 block">Emirate</label>
                            <Select
                              value={filters.emirate || "all"}
                              onValueChange={(value) => updateFilter("emirate", value === "all" ? null : value)}
                            >
                              <SelectTrigger className="w-full h-12 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A]">
                                <MapPin className="w-4 h-4 mr-2 text-[#1A1A1A]" />
                                <SelectValue />
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
                          </div>
                          <div>
                            <label className="text-sm text-[#1A1A1A] font-medium mb-2 block">Area / Community</label>
                            <Select
                              value={filters.communityId || "all"}
                              onValueChange={(value) => updateFilter("communityId", value === "all" ? null : value)}
                            >
                              <SelectTrigger className="w-full h-12 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A]">
                                <Home className="w-4 h-4 mr-2 text-[#1A1A1A]" />
                                <SelectValue placeholder="All Areas" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                <SelectItem value="all">All Areas</SelectItem>
                                {allAreasSorted?.map((area) => (
                                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Developer */}
                        <div>
                          <label className="text-sm text-[#1A1A1A] font-medium mb-2 block">Developer</label>
                          <Select
                            value={filters.developerId || "all"}
                            onValueChange={(value) => updateFilter("developerId", value === "all" ? null : value)}
                          >
                            <SelectTrigger className="w-full h-12 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A]">
                              <Building2 className="w-4 h-4 mr-2 text-[#1A1A1A]" />
                              <SelectValue placeholder="All Developers" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                              <SelectItem value="all">All Developers</SelectItem>
                              {allDevelopersSorted?.map((dev) => (
                                <SelectItem key={dev.id} value={dev.id}>
                                  <span data-developer-name className="block min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">
                                    {dev.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Property Type */}
                        <div>
                          <label className="text-sm text-[#1A1A1A] font-medium mb-2 block">Property Type</label>
                          <Select
                            value={filters.propertyType || "all"}
                            onValueChange={(value) => updateFilter("propertyType", value === "all" ? null : value)}
                          >
                            <SelectTrigger className="w-full h-12 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROPERTY_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Bedrooms & Bathrooms */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-[#1A1A1A] font-medium mb-2 block">Bedrooms</label>
                            <Select
                              value={filters.bedroomsMin === null ? "all" : filters.bedroomsMin === 0 ? "studio" : String(filters.bedroomsMin)}
                              onValueChange={(value) => {
                                if (value === "all") updateFilter("bedroomsMin", null);
                                else if (value === "studio") updateFilter("bedroomsMin", 0);
                                else updateFilter("bedroomsMin", parseInt(value));
                              }}
                            >
                              <SelectTrigger className="w-full h-12 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A]">
                                <Bed className="w-4 h-4 mr-2 text-[#1A1A1A]" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BEDROOM_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm text-[#1A1A1A] font-medium mb-2 block">Bathrooms</label>
                            <Select
                              value={filters.bathroomsMin === null ? "all" : String(filters.bathroomsMin)}
                              onValueChange={(value) => updateFilter("bathroomsMin", value === "all" ? null : parseInt(value))}
                            >
                              <SelectTrigger className="w-full h-12 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A]">
                                <Bath className="w-4 h-4 mr-2 text-[#1A1A1A]" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BATHROOM_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Size Range + Unit */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm text-[#1A1A1A] font-medium block">Size ({filters.sizeUnit})</label>
                            <Select
                              value={filters.sizeUnit}
                              onValueChange={(value) => updateFilter("sizeUnit", value as 'sqft' | 'sqm')}
                            >
                              <SelectTrigger className="w-[170px] h-9 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A] text-xs">
                                <Maximize2 className="w-3.5 h-3.5 mr-2 text-[#1A1A1A]" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sqft">Square Feet (sq ft)</SelectItem>
                                <SelectItem value="sqm">Square Meters (sq m)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={filters.sizeMin || ""}
                              onChange={(e) => updateFilter("sizeMin", parseInt(e.target.value) || 0)}
                              className="h-12 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/85"
                            />
                            <Input
                              type="number"
                              placeholder="Max"
                              value={filters.sizeMax < 50000 ? filters.sizeMax : ""}
                              onChange={(e) => updateFilter("sizeMax", parseInt(e.target.value) || 50000)}
                              className="h-12 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/85"
                            />
                          </div>
                        </div>

                        {/* Price Range + Currency */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm text-[#1A1A1A] font-medium block">Price Range ({filters.currency})</label>
                            <Select
                              value={filters.currency}
                              onValueChange={(value) => updateFilter("currency", value as ExtendedCurrency)}
                            >
                              <SelectTrigger className="w-[160px] h-9 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A] text-xs">
                                <SelectValue />
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
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              type="text"
                              placeholder="Min"
                              value={filters.priceMin > 0 ? filters.priceMin.toLocaleString() : ""}
                              onChange={(e) => updateFilter("priceMin", parseInt(e.target.value.replace(/,/g, '')) || 0)}
                              className="h-12 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/85"
                            />
                            <Input
                              type="text"
                              placeholder="Max"
                              value={filters.priceMax < 500000000 ? filters.priceMax.toLocaleString() : ""}
                              onChange={(e) => updateFilter("priceMax", parseInt(e.target.value.replace(/,/g, '')) || 500000000)}
                              className="h-12 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/85"
                            />
                          </div>
                        </div>

                        {/* Completion Status */}
                        <div>
                          <label className="text-sm text-[#1A1A1A] font-medium mb-2 block">Completion Status</label>
                          <Select
                            value={filters.completionStatus || "all"}
                            onValueChange={(value) => updateFilter("completionStatus", value === "all" ? null : value)}
                          >
                            <SelectTrigger className="w-full h-12 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A]">
                              <Calendar className="w-4 h-4 mr-2 text-[#1A1A1A]" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COMPLETION_STATUS.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Sale Status */}
                        <div>
                          <label className="text-sm text-[#1A1A1A] font-medium mb-2 block">Sale Status</label>
                          <Select
                            value={filters.saleStatus || "all"}
                            onValueChange={(value) => {
                              updateFilter("saleStatus", value === "all" ? null : value);
                              setAppliedFilters((prev) => ({ ...prev, saleStatus: value === "all" ? null : value }));
                            }}
                          >
                            <SelectTrigger className="w-full h-12 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A]">
                              <CheckCircle className="w-4 h-4 mr-2 text-[#1A1A1A]" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SALE_STATUS.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Investment Type */}
                        <div>
                          <label className="text-sm text-[#1A1A1A] font-medium mb-2 block">Investment Type</label>
                          <Select
                            value={filters.investmentType || "all"}
                            onValueChange={(value) => updateFilter("investmentType", value === "all" ? null : value)}
                          >
                            <SelectTrigger className="w-full h-12 bg-[#F7F2EA] border-[#064E3B]/30 text-[#1A1A1A]">
                              <Home className="w-4 h-4 mr-2 text-[#1A1A1A]" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INVESTMENT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Quick toggles: Premium + Hide Sold Out */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <label className="flex items-center justify-between gap-2 h-12 px-4 bg-[#F7F2EA] border border-[#064E3B]/30 rounded-lg cursor-pointer hover:border-[#064E3B]/55 transition-all">
                            <span className="flex items-center gap-2 text-sm text-[#1A1A1A] font-medium">
                              <Crown className="w-4 h-4" />
                              Premium Only
                            </span>
                            <Switch
                              checked={!!filters.premiumOnly}
                              onCheckedChange={(checked) => {
                                updateFilter("premiumOnly", checked);
                                setAppliedFilters((prev) => ({ ...prev, premiumOnly: checked }));
                              }}
                            />
                          </label>
                          {/* Hide Sold Out toggle removed site-wide — resale
                              always covers stock that leaves the primary market. */}

                        </div>
                      </div>
                    </ScrollArea>
                    <div className="p-6 border-t border-[#064E3B]/20 flex justify-between bg-gradient-to-r from-[#F7F2EA] to-[#FBF8F3]">
                      <Button
                        variant="ghost"
                        onClick={clearFilters}
                        className="text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
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
              </div>
            );
          })()}

          {/* Premium shortcut chip bar (same as header) */}
          <div className="mt-3">
            <FilterShortcutBar
              variant="light"
              filters={shortcutFilters}
              onFilterChange={setShortcutFilters}
              isMapMode={isMapMode}
              onMapToggle={setIsMapMode}
              hideSort
            />
          </div>

          </div>
        </div>
      </section>

      {/* Fixed filter bar removed — handled globally by GlobalFilterBar in MainLayout */}

      {!isMapMode && <div className="h-px bg-white/70" />}

      {/* Results Section - Split-screen map mode or standard grid */}
      {isMapMode ? (
        <section data-map-shell className="bg-[#03251F]">
          <div className="flex" style={{ height: 'calc(100vh - 80px)' }}>
            {/* Vertical nav handled globally by MainLayout */}

            {/* Left: Scrollable card list */}
            <div ref={cardListRef} className="jj-map-side-list w-[55%] flex-shrink-0 overflow-y-auto">
              {/* Results Count (hidden while initial fetch in flight) */}
              <div className="px-4 pt-4 pb-2 flex items-center justify-between min-h-[24px]">
                {!showSkeletons && (
                  <p className="text-[#1A1A1A]/70 text-sm">
                    Showing <span className="text-[#1A1A1A] font-medium">{finalProjects.length}</span> properties
                  </p>
                )}
              </div>

              {/* Cards Grid - 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
                {showSkeletons ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-2xl h-[350px] animate-pulse border-2 border-[#B89555]/30" />
                  ))
                ) : finalProjects.length > 0 ? (
                  finalProjects.map((project) => (
                    <div
                      key={project.id}
                      id={`map-card-${project.id}`}
                      onMouseEnter={() => setHoveredProjectId(project.id)}
                      onMouseLeave={() => setHoveredProjectId(null)}
                      className={`transition-all duration-200 rounded-2xl ${hoveredProjectId === project.id ? 'ring-2 ring-white/40 shadow-lg scale-[1.01]' : ''}`}
                    >
                      <ProjectCard
                        project={project}
                        currency={filters.currency}
                        sizeUnit={filters.sizeUnit}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-20">
                    <Search className="w-10 h-10 text-[#1A1A1A] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">We Couldn't Find an Exact Match</h3>
                    <p className="text-[#1A1A1A]/70 mb-4">Try adjusting your filters to discover available properties</p>
                    <Button onClick={clearFilters} variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                      <X className="w-4 h-4 mr-2" />
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Map */}
            <div className="flex-1 min-w-0">
              <PropertiesMapView
                projects={finalProjects}
                hoveredProjectId={hoveredProjectId}
                onProjectHover={setHoveredProjectId}
                onProjectClick={(id) => {
                  const el = document.getElementById(`map-card-${id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setHoveredProjectId(id);
                }}
              />
            </div>
          </div>
        </section>
      ) : (
        <section id="properties-results" className="py-12 bg-[#FDFBF7] scroll-mt-[104px]">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex">
              {/* Vertical nav handled globally by MainLayout */}
            {/* OUTER LAYER - Active Champagne with thin black contour visible at edges */}
            <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#B89555]/30 rounded-2xl p-4 sm:p-5 flex-1 min-w-0">
              
              {/* Header Section - Off-plan properties message */}
              {appliedFilters.transactionType === 'buy' && appliedFilters.completionStatus !== 'ready' && (
                <div className="px-4 pt-4 pb-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2">
                    Off-plan properties for sale in Dubai
                  </h2>
                  <p className="text-[#1A1A1A] text-sm md:text-base flex items-start gap-2 font-medium">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1A1A1A] text-white text-xs flex-shrink-0 mt-0.5 font-bold">i</span>
                    <span>
                      Looking for off-plan properties for sale in Dubai? Contact <span className="font-bold text-[#A68444]">JBJ Global Real Estate</span> in Dubai to find the right property for you.
                    </span>
                  </p>
                </div>
              )}
              
              {/* Results Count - Inside active layer (hidden while initial fetch in flight) */}
              <div className="mb-6 flex items-center justify-between px-4 pt-4 min-h-[28px]">
                {!showSkeletons && (
                  <p className="text-[#1A1A1A]/70">
                    Showing <span className="text-[#1A1A1A] font-medium">{finalProjects.length}</span> properties
                    {appliedFilters.transactionType === 'rent' && ' for rent'}
                    {appliedFilters.transactionType === 'buy' && ' for sale'}
                  </p>
                )}
                {!showSkeletons && activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear all filters
                  </Button>
                )}
              </div>

              {/* Projects Grid - Inside active layer - 2-3 cards per row for wider balanced layout */}
              {showSkeletons ? (
                <div data-projects-shell data-page-gutter className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 py-6 sm:py-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-2xl h-[400px] sm:h-[460px] animate-pulse border-2 border-[#B89555]/30" />
                  ))}
                </div>
              ) : finalProjects.length > 0 ? (
                <div data-projects-shell data-page-gutter className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 py-6 sm:py-8">
                  {visibleProjects.flatMap((project, index) => {
                    const adAfterIndex = [5, 11, 17];
                    const adIndex = adAfterIndex.indexOf(index);
                    const featuredAd = adIndex !== -1 && FEATURED_ADS[adIndex] ? FEATURED_ADS[adIndex] : null;

                    const nodes: JSX.Element[] = [
                      <ProjectCard
                        key={project.id}
                        project={project}
                        currency={filters.currency}
                        sizeUnit={filters.sizeUnit}
                      />,
                    ];
                    if (featuredAd) {
                      nodes.push(
                        <FeaturedProjectAd
                          key={`ad-${featuredAd.id}`}
                          title={featuredAd.title}
                          subtitle={featuredAd.subtitle}
                          description={featuredAd.description}
                          imageUrl={featuredAd.imageUrl}
                          projectSlug={featuredAd.projectSlug}
                          ctaText={featuredAd.ctaText}
                        />
                      );
                    }
                    return nodes;
                  })}
                </div>
              ) : null}

              {/* Pagination — numeric page controls + total count */}
              {!showSkeletons && finalProjects.length > PAGE_SIZE && (
                <div className="px-2 sm:px-4 pt-4 pb-2">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[12px] text-[#1A1A1A]/70 font-medium">
                      Showing <span className="text-[#1A1A1A] font-semibold">{(safePage - 1) * PAGE_SIZE + 1}</span>–
                      <span className="text-[#1A1A1A] font-semibold">{Math.min(safePage * PAGE_SIZE, finalProjects.length)}</span> of{" "}
                      <span className="text-[#1A1A1A] font-semibold">{finalProjects.length}</span> properties · Page{" "}
                      <span className="text-[#1A1A1A] font-semibold">{safePage}</span> of{" "}
                      <span className="text-[#1A1A1A] font-semibold">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); document.getElementById("properties-results")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                        disabled={safePage === 1}
                        className="h-9 px-3 rounded-md border border-[#B89555]/40 bg-[#FDFBF7] text-[13px] font-medium text-[#1A1A1A] hover:bg-[#EFE6D6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                        .flatMap((p, idx, arr) => {
                          const prev = arr[idx - 1];
                          const gap = prev && p - prev > 1;
                          return [
                            gap ? (
                              <span key={`gap-${p}`} className="px-1 text-[#1A1A1A]/50 text-[13px]">…</span>
                            ) : null,
                            <button
                              key={p}
                              type="button"
                              onClick={() => { setCurrentPage(p); document.getElementById("properties-results")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                              className={`h-9 min-w-[36px] px-2 rounded-md border text-[13px] font-semibold tabular-nums transition-colors ${
 p === safePage
 ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A]"
 : "bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
 }`}
                              aria-current={p === safePage ? "page" : undefined}
                            >
                              {p}
                            </button>,
                          ];
                        })}
                      <button
                        type="button"
                        onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); document.getElementById("properties-results")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                        disabled={safePage === totalPages}
                        className="h-9 px-3 rounded-md border border-[#B89555]/40 bg-[#FDFBF7] text-[13px] font-medium text-[#1A1A1A] hover:bg-[#EFE6D6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {finalProjects.length === 0 && !showSkeletons && (
                <div className="py-12 px-4">
                  {/* Premium No Results UI */}
                  <div className="text-center mb-10">
                    {appliedFilters.developerId && developers?.find(d => d.id === appliedFilters.developerId) ? (
                      <>
                        <div className="w-24 h-24 bg-gradient-to-br from-gold/20 to-gold/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#B89555]/30">
                          <Building2 className="w-12 h-12 text-[#1A1A1A]" />
                        </div>
                        <h3 className="text-2xl font-semibold text-[#1A1A1A] mb-3">
                          No Listings Yet for {developers.find(d => d.id === appliedFilters.developerId)?.name}
                        </h3>
                        <p className="text-[#1A1A1A]/70 mb-6 max-w-md mx-auto">
                          We're currently adding properties from this developer to our portfolio. 
                          Register your interest to be notified when listings become available.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
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
                          <Button 
                            onClick={() => {
                              clearFilters();
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} 
                            variant="outline" 
                            className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#F7F2EA] h-12 px-6 cursor-pointer"
                          >
                            Browse All Properties
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#B89555]/30 shadow-[0_0_30px_rgba(200,167,102,0.3)]">
                          <Search className="w-10 h-10 text-[#1A1A1A] drop-shadow-[0_0_8px_rgba(200,167,102,0.5)]" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3">
                          We Couldn't Find an Exact Match
                        </h3>
                        <p className="text-[#1A1A1A]/70 mb-6 max-w-lg mx-auto">
                          No properties matched your current filters. Try adjusting your search, or explore our curated selection below.
                        </p>
                        <Button
                          onClick={() => {
                            clearFilters();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          variant="outline"
                          className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 h-11 px-6"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Clear All Filters
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Suggested Properties Section */}
                  {projects && projects.length > 0 && (
                    <div className="mt-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-full">
                          <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
                          <span className="text-sm font-semibold text-[#1A1A1A]">Explore Other Properties</span>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                        {projects.slice(0, 6).map((project) => (
                          <ProjectCard 
                            key={project.id} 
                            project={project} 
                            currency={filters.currency}
                            sizeUnit={filters.sizeUnit}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>
        </section>
      )}

      {/* CONSOLIDATED: Unified "Confused About Where to Buy" Section with Consultation Form */}
      <section className="jj-band jj-band--surface py-16 sm:py-20">
        <div className="container mx-auto px-4">
          {/* Top: centered content */}
          <div className="max-w-3xl mx-auto text-center">
            <div className="jj-cta-gold-metallic inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider mb-5">
              <HelpCircle className="w-3 h-3" />
              Get Expert Guidance
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-4">
              Confused About Where to <span className="text-[#1A1A1A]">Buy or Invest</span> in Dubai?
            </h2>
            <p className="text-[#1A1A1A]/70 mb-8 max-w-2xl mx-auto">
              Our experienced advisors help you navigate Dubai's dynamic real estate market.
              Get personalized recommendations based on your goals, budget, and timeline.
            </p>
            <ul className="grid sm:grid-cols-3 gap-4 text-sm text-[#1A1A1A]/80 mb-10 text-left sm:text-center">
              <li className="flex items-start sm:items-center sm:flex-col gap-2 sm:gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B89555] mt-1.5 sm:mt-0 shrink-0" />
                Flexible payment plans tailored to your investment timeline
              </li>
              <li className="flex items-start sm:items-center sm:flex-col gap-2 sm:gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B89555] mt-1.5 sm:mt-0 shrink-0" />
                Trusted developers: Emaar, Damac, Sobha, Nakheel &amp; more
              </li>
              <li className="flex items-start sm:items-center sm:flex-col gap-2 sm:gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B89555] mt-1.5 sm:mt-0 shrink-0" />
                ROI projections and market insights included
              </li>
            </ul>
          </div>

          {/* Bottom: centered consultation form */}
          <div className="max-w-2xl mx-auto">
            <ConsultationRequestForm
              title="Request a Consultation"
              subtitle="Connect with our expert team for personalized guidance."
            />
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
