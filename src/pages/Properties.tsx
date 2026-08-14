import { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { Switch } from "@/components/ui/switch";
import { Link, useLocation, useSearchParams } from "react-router-dom";
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
import PropertySearchBar from "@/components/search/PropertySearchBar";
import "@/components/search/property-filter-refined.css";
import ResultsToolbar from "@/components/search/ResultsToolbar";

import { EMPTY_SEARCH, paramsToSearch, searchToParams, type ProjectStatus, type PropertySearch } from "@/lib/propertySearch";
import { findAreaExact } from "@/lib/areaResolver";
import { getCountry } from "@/data/geography";
import { applyShortcutFilters } from "@/utils/applyShortcutFilters";

/**
 * URL params can carry either geography SLUGS ("dubai-marina", emitted by the
 * smart search) or DISPLAY NAMES ("Dubai Marina", emitted by the legacy filter
 * bar). The results engine matches on display names, so every incoming value is
 * normalised here — otherwise a slug silently applies no filter at all.
 */
const toDisplayNames = (values: string[]): string[] =>
  values
    .map((v) => findAreaExact(v)?.name ?? v.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .filter(Boolean);

const PropertiesMapView = lazy(() => import("@/components/maps/PropertiesMapView"));
import { CURRENCY_RATES, CURRENCY_SYMBOLS } from "@/hooks/useCurrency";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";
// PropertiesVerticalNav removed — handled globally by MainLayout

type ExtendedCurrency = string;

const CURRENCY_KEY = 'jj_currency';

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
    p.availability_status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /\b(ready|completed|complete|delivered)\b/.test(statusText);
};

const prioritizeOffPlan = <T extends object>(projects: T[]): T[] =>
  [...projects].sort((a, b) => Number(isReadyProject(a)) - Number(isReadyProject(b)));

const hasCardText = (value: unknown) => typeof value === "string" && value.trim().length > 0;

const projectQualityScore = (project: any) => {
  let score = 0;
  if (project.cover_image_url || project.card_image_url || project.hero_image_url || project.images?.some?.((img: any) => img?.image_url)) score += 20;
  if (isValidDeveloperLogoUrl(project.developer?.logo_url)) score += 18;
  if (project.developer?.id || project.developer_id) score += 10;
  if (typeof project.price_from === "number" && project.price_from > 0) score += 16;
  if (hasCardText(project.description) || hasCardText(project.short_description)) score += 14;
  if (hasCardText(project.handover_date) || hasCardText(project.expected_completion)) score += 10;
  if (hasCardText(project.payment_plan) || project.payment_breakdown) score += 8;
  if (project.is_featured) score += 6;
  if (project.is_premium) score += 4;
  return score;
};

const compareByQualityThenFreshness = (a: any, b: any) => {
  const qualityDiff = projectQualityScore(b) - projectQualityScore(a);
  if (qualityDiff !== 0) return qualityDiff;
  return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
};

const searchRelevance = (project: { name?: string | null; developer_name?: string | null; developer?: { name?: string | null } | null }, query: string) => {
  const q = query.toLowerCase().trim();
  if (!q) return 99;
  const name = (project.name || "").toLowerCase().trim();
  const developer = (project.developer?.name || project.developer_name || "").toLowerCase().trim();
  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  if (name.split(/\s+/).includes(q)) return 2;
  if (name.includes(q)) return 3;
  if (developer === q) return 5;
  if (developer.startsWith(q)) return 6;
  if (developer.includes(q)) return 7;
  return 20 + Math.abs(name.length - q.length) / 100;
};

// Sale status options with color dots
const SALE_STATUS = [
  { value: "all", label: "All Sale Statuses", dotClass: null },
  { value: "Announced", label: "Announced", dotClass: "jj-pill-emerald-metallic" },
  { value: "Presale (EOI)", label: "Pre-sale (EOI)", dotClass: "jj-pill-emerald-metallic" },
  { value: "Start of Sales", label: "Start of Sales", dotClass: "jj-pill-emerald-metallic" },
  { value: "On Sale", label: "On Sale", dotClass: "jj-pill-emerald-metallic" },
  { value: "Sold Out", label: "Sold Out", dotClass: "jj-pill-emerald-metallic" },
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

/**
 * `preset` turns /resale and /distress into first-class status presets of this
 * same page (PASS 368). They used to be `<Navigate>` redirects, which cost a
 * second navigation, threw away any query the visitor arrived with and made the
 * canonical URL /properties. Now the preset route renders the search directly
 * and stays on its own path.
 */
const Properties = ({ preset }: { preset?: ProjectStatus } = {}) => {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const hydrate = useCallback(
    (p: URLSearchParams): PropertySearch => {
      const next = paramsToSearch(p);
      if (!preset || p.get("status")) return next;
      return { ...next, purpose: "buy", statuses: [preset] };
    },
    [preset],
  );
  /** Unified Bayut-grade search model, hydrated from the URL. */
  const [search, setSearch] = useState<PropertySearch>(() => hydrate(searchParams));
  useEffect(() => {
    setSearch(hydrate(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), hydrate]);
  const submitSearch = useCallback((next: PropertySearch) => {
    const qs = searchToParams(next).toString();
    window.history.replaceState(null, "", `${pathname}${qs ? `?${qs}` : ""}`);
    setSearch(next);
    window.dispatchEvent(new CustomEvent("jbj:property-search", { detail: next }));
  }, [pathname]);


  /**
   * Markets we are still onboarding hold no inventory yet. Saying "0 properties"
   * there reads like a broken search, so those searches show an honest
   * "coming soon" notice instead.
   */
  const selectedCountry = getCountry(search.country);
  const marketComingSoon = !!selectedCountry && selectedCountry.live === false;

  const { data: projects, isLoading } = useProjectsListing(search.purpose === "rent" ? "rent" : "buy");
  const { data: communities } = useCommunities();
  const { data: developers } = useDevelopers();
  const { data: areas } = useAreas();
  const { t } = useLanguage();
  
  const [filters, setFilters] = useState<ExtendedFilterState>(defaultExtendedFilters);
  const [appliedFilters, setAppliedFilters] = useState<ExtendedFilterState>(defaultExtendedFilters);
  const [sortBy, setSortBy] = useState<string>("newest");
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
  const [isMapMode, setIsMapMode] = useState(search.view === "map");
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const cardListRef = useRef<HTMLDivElement>(null);

  /** List / Grid / Map toolbar controls drive the real layout. */
  useEffect(() => {
    setIsMapMode(search.view === "map");
  }, [search.view]);
  const resultsGridClass =
    search.view === "list"
      ? "grid grid-cols-1 gap-4 sm:gap-5 py-6 sm:py-8"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 py-6 sm:py-8";


  useEffect(() => {
    const applyGlobalCurrency = (code: string | null) => {
      if (!code || !(code in CURRENCY_RATES)) return;
      const next = code as ExtendedCurrency;
      setFilters(prev => ({ ...prev, currency: next }));
      setAppliedFilters(prev => ({ ...prev, currency: next }));
    };
    applyGlobalCurrency(localStorage.getItem(CURRENCY_KEY));
    const handler = (e: Event) => applyGlobalCurrency((e as CustomEvent).detail);
    window.addEventListener('currencyChange', handler);
    return () => window.removeEventListener('currencyChange', handler);
  }, []);

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
    const shortcutSortParam = searchParams.get('sortBy') as ShortcutFilterState['sortBy'] | null;
    const shortcutFiltersFromUrl: ShortcutFilterState = {
      ...defaultShortcutFilters,
      searchQuery: keywordParam || "",
      priceMin: priceMinParam || "",
      priceMax: priceMaxParam || "",
      bedrooms: searchParams.get('bedrooms')?.split(',').filter(Boolean) || (bedsParam ? [bedsParam] : []),
      emirates: toDisplayNames(searchParams.get('emirates')?.split(',').filter(Boolean) || (emirateParam ? [emirateParam] : [])),
      areas: toDisplayNames(
        searchParams.get('areas')?.split(',').filter(Boolean)
          || searchParams.get('areaSlugs')?.split(',').filter(Boolean)
          || (areaParam ? [areaParam] : []),
      ),

      developers: searchParams.get('developers')?.split(',').filter(Boolean) || [],
      propertyTypes: searchParams.get('propertyTypes')?.split(',').filter(Boolean) || (typeParam && typeParam !== 'all' ? [typeParam] : []),
      statuses: searchParams.get('statuses')?.split(',').filter(Boolean) || (saleStatusParam && saleStatusParam !== 'all' ? [saleStatusParam] : []),
      constructionStatuses: searchParams.get('constructionStatuses')?.split(',').filter(Boolean) || (newStatus ? [newStatus] : []),
      sortBy: shortcutSortParam,
      hideSoldOut: searchParams.get('hideSoldOut') === '1',
      sizeMin: sizeMinParam || "",
      sizeMax: sizeMaxParam || "",
      views: searchParams.get('views')?.split(',').filter(Boolean) || [],
      paymentPlanMax: searchParams.get('paymentPlanMax') ? Number(searchParams.get('paymentPlanMax')) : defaultShortcutFilters.paymentPlanMax,
      postHandoverOnly: searchParams.get('postHandoverOnly') === '1',
      handoverFrom: searchParams.get('handoverFrom')
        ? { quarter: searchParams.get('handoverFrom')!.split('-')[0] || 'Q1', year: searchParams.get('handoverFrom')!.split('-')[1] || '2025' }
        : defaultShortcutFilters.handoverFrom,
      handoverTo: searchParams.get('handoverTo')
        ? { quarter: searchParams.get('handoverTo')!.split('-')[0] || 'Q4', year: searchParams.get('handoverTo')!.split('-')[1] || '2035' }
        : defaultShortcutFilters.handoverTo,
      // Residential is the catalogue default, not an active narrowing filter.
      // The shared homepage search serialises it for taxonomy consistency, so
      // only commercial should activate the legacy shortcut filter engine.
      propertyCategory: searchParams.get('category') === 'commercial' ? 'commercial' : null,
    };

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
      currencyParam || emirateParam || saleStatusParam || communityIdFromUrl || sortParam || shortcutSortParam ||
      searchParams.get('developers') || searchParams.get('emirates') || searchParams.get('areas') ||
      searchParams.get('areaSlugs') || searchParams.get('region') ||

      searchParams.get('propertyTypes') || searchParams.get('statuses') || searchParams.get('constructionStatuses') ||
      searchParams.get('views') || searchParams.get('paymentPlanMax') || searchParams.get('postHandoverOnly') ||
      searchParams.get('handoverFrom') || searchParams.get('handoverTo') || searchParams.get('category');

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
        sizeUnit: sizeUnitParam || (typeof window !== 'undefined' ? ((localStorage.getItem('jj_area_unit') as 'sqft' | 'sqm') || 'sqft') : 'sqft'),
        currency: (currencyParam || 'AED') as ExtendedCurrency,
        emirate: emirateParam && emirateParam !== 'all' ? emirateParam : null,
        saleStatus: saleStatusParam && saleStatusParam !== 'all' ? saleStatusParam : null,
        communityId: communityIdFromUrl,
      };
      setFilters(updated);
      setAppliedFilters(updated);
      setShortcutFilters(shortcutFiltersFromUrl);
      if (sortParam) setSortBy(sortParam);
      if (shortcutSortParam === 'price_asc') setSortBy('price-low');
      if (shortcutSortParam === 'price_desc') setSortBy('price-high');
      if (shortcutSortParam === 'newest') setSortBy('newest');
    } else if (searchParams.toString() === '') {
      // No URL params at all — ensure defaults show all projects
      setFilters(defaultExtendedFilters);
      setAppliedFilters(defaultExtendedFilters);
      setShortcutFilters(defaultShortcutFilters);
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

  // Sort projects
  const sortedProjects = useMemo(() => {
    let sorted = [...filteredProjects];
    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => (a.price_from ?? Number.POSITIVE_INFINITY) - (b.price_from ?? Number.POSITIVE_INFINITY));
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
        sorted.sort(compareByQualityThenFreshness);
    }
    if (appliedFilters.completionStatus !== 'ready') {
      sorted = prioritizeOffPlan(sorted);
    }
    return sorted;
  }, [filteredProjects, sortBy, appliedFilters.completionStatus]);


  // Apply shortcut filters (price, bedrooms, status, construction, handover, etc.) reactively
  const finalProjects = useMemo(() => {
    const filtered = applyShortcutFilters(sortedProjects, shortcutFilters);
    const base = appliedFilters.completionStatus === 'ready' ? filtered : prioritizeOffPlan(filtered);
    const q = (appliedFilters.search || shortcutFilters.searchQuery || "").trim();
    if (!q) return base;
    return [...base].sort((a, b) => searchRelevance(a, q) - searchRelevance(b, q));
  }, [sortedProjects, shortcutFilters, appliedFilters.completionStatus, appliedFilters.search]);
  const hasShortcutFilters = useMemo(() => {
    return (
      shortcutFilters.priceMin !== '' ||
      shortcutFilters.priceMax !== '' ||
      shortcutFilters.paymentPlanMax < 100 ||
      shortcutFilters.postHandoverOnly ||
      shortcutFilters.propertyCategory !== null ||
      shortcutFilters.propertyTypes.length > 0 ||
      shortcutFilters.bedrooms.length > 0 ||
      shortcutFilters.bathrooms.length > 0 ||
      shortcutFilters.statuses.length > 0 ||
      shortcutFilters.constructionStatuses.length > 0 ||
      shortcutFilters.sizeMin !== '' ||
      shortcutFilters.sizeMax !== '' ||
      shortcutFilters.emirates.length > 0 ||
      shortcutFilters.areas.length > 0 ||
      shortcutFilters.developers.length > 0 ||
      shortcutFilters.searchQuery.trim() !== '' ||
      shortcutFilters.views.length > 0 ||
      shortcutFilters.amenities.length > 0 ||
      shortcutFilters.verifiedOnly ||
      shortcutFilters.virtualTourOnly ||
      shortcutFilters.furnishing.length > 0 ||
      shortcutFilters.handoverFrom.year !== defaultShortcutFilters.handoverFrom.year ||
      shortcutFilters.handoverFrom.quarter !== defaultShortcutFilters.handoverFrom.quarter ||
      shortcutFilters.handoverTo.year !== defaultShortcutFilters.handoverTo.year ||
      shortcutFilters.handoverTo.quarter !== defaultShortcutFilters.handoverTo.quarter
    );
  }, [shortcutFilters]);
  // Keep first paint light: rich cards are expensive and additional inventory
  // remains immediately available through pagination.
  const PAGE_SIZE = 24;
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
    if (key === "currency" && typeof value === "string") {
      localStorage.setItem(CURRENCY_KEY, value);
      window.dispatchEvent(new CustomEvent('currencyChange', { detail: value }));
    }
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters when search button is clicked
  const handleSearch = () => {
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    const resetSearch: PropertySearch = {
      ...EMPTY_SEARCH,
      purpose: search.purpose,
      country: search.country,
      view: search.view,
    };
    setFilters(defaultExtendedFilters);
    setAppliedFilters(defaultExtendedFilters);
    setShortcutFilters(defaultShortcutFilters);
    setSortBy("newest");
    submitSearch(resetSearch);
  };

  // Format price with currency
  const formatPrice = (value: number) => {
    const converted = value * (CURRENCY_RATES[filters.currency] ?? 1);
    const symbol = CURRENCY_SYMBOLS[filters.currency] ?? filters.currency;
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
  const hasAnyActiveFilter = activeFilterCount > 0 || hasShortcutFilters;
  // Always report the real number of listings rendered by the grid. Never a
  // hardcoded headline figure — the toolbar, the pager and the search bar must
  // agree with what the visitor can actually open.
  const displayedResultCount = finalProjects.length;
  // Dynamic SEO based on transaction type per Master Blueprint
  const dynamicSEO = search.purpose === 'rent'
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
              {search.purpose === "rent"
                ? (finalProjects.length > 0
                    ? "Homes for Rent. Verified and Ready."
                    : "Rentals. Sourced On Request.")
                : "Curated Listings. Global Standard."}
            </h1>
            
            {/* Subtitle */}
            <p
              className="text-white text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-light"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.7)' }}
            >
              {search.purpose === "rent"
                ? (finalProjects.length > 0
                    ? "Verified rental inventory with clear pricing periods and trusted advisory."
                    : "We do not publish a public rental list. Tell us what you need and our advisors source ready and resale-ready stock directly.")
                : "Exclusive investment-grade properties with trusted advisory."}

            </p>
          </motion.div>
        </div>
      </PropertiesHeroVideo>

      {/* Scroll sentinel for two-phase filter fix */}
      <div ref={filterSentinelRef} className="h-0" />

      {/* Filters Section - sticks below the 88px header on scroll */}
      <section
        data-filter-clean="true"
        data-filter-band-light={isMapMode ? undefined : "true"}
        data-map-shell={isMapMode ? true : undefined}
        className={`sticky top-[88px] z-40 py-3 md:py-4 ${isMapMode ? "jj-properties-map-filter" : "border-b border-[#B89555]/28"}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          background: isMapMode ? undefined : "linear-gradient(180deg,#FFFFFF 0%,#FDFBF7 58%,#F7F2EA 100%)",
        }}
      >
        <div className="container mx-auto px-3 sm:px-4">
          {/* ONE premium container for the whole filter system (jjpf-shell) */}
            <div
              className={isMapMode ? "jj-map-command-bar rounded-2xl p-4 sm:p-5" : "jjpf-shell"}
              style={{ overflow: 'visible' }}
            >


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
          {/* The shared PropertySearchBar below is the only filter interface.
              Its More control opens the same in-place panel on every route. */}
          {/* Unified property search bar — the ONE filter for this page.
              Its "Show N" mirrors the grid total exactly, and its active-chip
              row is the single place a visitor resets filters. */}
          <div>

            <PropertySearchBar
              value={search}
              onChange={setSearch}
              onSubmit={submitSearch}
              showTiers
              countOverride={showSkeletons ? null : displayedResultCount}
              countNoun="properties"
              typewriterPhrases={[
                "Search by developer — Emaar, Nakheel, DAMAC…",
                "Try “Dubai Marina 2 bed under 2M”",
                "Try “Emaar off-plan handover 2027”",
                "Try “Business Bay distress deal”",
                "Try “Ras Al Khaimah beachfront”",
              ]}
              showActiveSummary
            />
          </div>

          {/* Results toolbar — sort, view mode, alerts only.
              Status quick-chips live in the search bar, so they are hidden here
              (no duplicated filter on one screen). */}
          <div className="jjpf-sub">
            <ResultsToolbar
              value={search}
              onChange={submitSearch}
              total={showSkeletons ? finalProjects.length : displayedResultCount}
              hideQuickChips
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
                   <p className="text-[#1A1A1A] text-sm">
                    Showing <span className="text-[#1A1A1A] font-medium">{displayedResultCount}</span> {hasAnyActiveFilter ? 'matching ' : ''}properties
                  </p>
                )}
              </div>

              {/* Cards Grid - 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
                {showSkeletons ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-2xl h-[350px] animate-pulse border border-[#064E3B]/30" />
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
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-20">
                    <Search className="w-10 h-10 text-[#1A1A1A] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">We Couldn't Find an Exact Match</h3>
                    <p className="text-[#1A1A1A]/70 mb-4">Try adjusting your filters to discover available properties</p>
                    <Button onClick={clearFilters} variant="outline" className="border-[#064E3B]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                      <X className="w-4 h-4 mr-2" />
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Map */}
            <div className="flex-1 min-w-0">
              <Suspense fallback={<div className="h-full min-h-[520px] bg-[#03251F]" />}>
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
              </Suspense>
            </div>
          </div>
        </section>
      ) : (
        <section id="properties-results" className="py-12 bg-[#FDFBF7] scroll-mt-[104px]">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex">
              {/* Vertical nav handled globally by MainLayout */}
            {/* Content sits directly on the mother-of-pearl page background —
                no nested beige wrapper, listings stretch full container width. */}
            <div className="flex-1 min-w-0">

              
              {/* Header Section - Off-plan properties message */}
              {appliedFilters.transactionType === 'buy' && appliedFilters.completionStatus !== 'ready' && (
                <div className="pt-2 pb-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2">
                    Off-plan properties for sale in Dubai
                  </h2>
                  <p className="text-[#1A1A1A] text-sm md:text-base flex items-start gap-2 font-medium">
                    <span className="allow-white jj-pill-emerald-metallic inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs flex-shrink-0 mt-0.5 font-bold">i</span>
                    <span>
                      Looking for off-plan properties for sale in Dubai? Contact{" "}
                      <Link to="/contact" className="jj-gold-link font-bold" data-no-contrast-guard>
                        JBJ Global Real Estate
                      </Link>{" "}
                      in Dubai to find the right property for you.

                    </span>
                  </p>
                </div>
              )}

              {/* Results Count — single authoritative line, no duplicated intent wording */}
              <div className="mb-6 flex items-center justify-between pt-2 min-h-[28px]">
                {!showSkeletons && (
                   <p className="text-[#1A1A1A]">
                    Showing <span className="text-[#1A1A1A] font-medium">{displayedResultCount}</span> {hasAnyActiveFilter ? 'matching ' : ''}properties
                  </p>
                )}

                {!showSkeletons && activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                     className="text-[#1A1A1A] hover:text-[#1A1A1A]"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear all filters
                  </Button>
                )}
              </div>

              {/* Projects Grid - Inside active layer - 2-3 cards per row for wider balanced layout */}
              {showSkeletons ? (
                <div data-projects-shell data-page-gutter className={resultsGridClass}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-2xl h-[400px] sm:h-[460px] animate-pulse border border-[#064E3B]/30" />
                  ))}
                </div>
              ) : finalProjects.length > 0 ? (
                <div data-projects-shell data-page-gutter className={resultsGridClass}>
                  {visibleProjects.flatMap((project, index) => {
                    const adAfterIndex = [5, 11, 17];
                    const adIndex = adAfterIndex.indexOf(index);
                    const featuredAd = adIndex !== -1 && FEATURED_ADS[adIndex] ? FEATURED_ADS[adIndex] : null;

                    const nodes: JSX.Element[] = [
                      <ProjectCard
                        key={project.id}
                        project={project}
                        currency={filters.currency}
                        priority={index < 6}
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
                     <p className="text-[12px] text-[#1A1A1A] font-medium">
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
                        className="h-9 px-3 rounded-md border border-[#064E3B]/40 bg-[#FDFBF7] text-[13px] font-medium text-[#1A1A1A] hover:bg-[#EFE6D6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
 ? "allow-white jj-pill-emerald-metallic border-0 text-white"
 : "bg-[#FDFBF7] border-[#064E3B]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
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
                        className="h-9 px-3 rounded-md border border-[#064E3B]/40 bg-[#FDFBF7] text-[13px] font-medium text-[#1A1A1A] hover:bg-[#EFE6D6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                        <div className="w-24 h-24 bg-gradient-to-br from-[#064E3B]/20 to-[#064E3B]/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#064E3B]/30">
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
                            className="border-[#064E3B]/30 text-[#1A1A1A] hover:bg-[#F7F2EA] h-12 px-6 cursor-pointer"
                          >
                            Browse All Properties
                          </Button>
                        </div>
                      </>
                    ) : marketComingSoon ? (
                      <>
                        <div className="w-20 h-20 bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#064E3B]/30 shadow-[0_0_30px_rgba(6,78,59,0.18)]">
                          <MapPin className="w-10 h-10 text-[#1A1A1A]" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3">
                          {selectedCountry?.name} — Coming Soon
                        </h3>
                        <p className="text-[#1A1A1A]/70 mb-6 max-w-lg mx-auto">
                          We are onboarding inventory in {selectedCountry?.name} right now. Tell our
                          advisory desk what you are looking for and we will bring you matching
                          opportunities the moment this market goes live.
                        </p>
                        <Button
                          onClick={() => window.dispatchEvent(new CustomEvent("jbj:open-inquiry"))}
                          variant="outline"
                          className="border-[#064E3B]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 h-11 px-6"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Register my requirement
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#064E3B]/30 shadow-[0_0_30px_rgba(6,78,59,0.18)]">
                          <Search className="w-10 h-10 text-[#1A1A1A] drop-shadow-[0_0_8px_rgba(6,78,59,0.25)]" />
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
                          className="border-[#064E3B]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 h-11 px-6"
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
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#064E3B]/30 to-transparent" />
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#064E3B]/10 border border-[#064E3B]/30 rounded-full">
                          <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
                          <span className="text-sm font-semibold text-[#1A1A1A]">Explore Other Properties</span>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#064E3B]/30 to-transparent" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                        {projects.slice(0, 6).map((project) => (
                          <ProjectCard 
                            key={project.id} 
                            project={project} 
                            currency={filters.currency}
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
            <div className="allow-white jj-pill-emerald-metallic inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider mb-5 text-white">
              <HelpCircle className="w-3 h-3 text-white" />
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
              <span className="w-1.5 h-1.5 rounded-full bg-[#064E3B] mt-1.5 sm:mt-0 shrink-0" />
                Flexible payment plans tailored to your investment timeline
              </li>
              <li className="flex items-start sm:items-center sm:flex-col gap-2 sm:gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#064E3B] mt-1.5 sm:mt-0 shrink-0" />
                Trusted developers: Emaar, Damac, Sobha, Nakheel &amp; more
              </li>
              <li className="flex items-start sm:items-center sm:flex-col gap-2 sm:gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#064E3B] mt-1.5 sm:mt-0 shrink-0" />
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
