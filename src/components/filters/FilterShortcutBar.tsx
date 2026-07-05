/**
 * FilterShortcutBar - Premium connected 2-row filter toolbar
 * Row 1: Search + Map + Saved + Currency + Filter + Mode Investor (connected bar)
 * Row 2: Filter popovers + Sort pills + Hide Sold (last)
 */
import { useState, useCallback, useEffect, useRef, useMemo } from "react";

import { ChevronDown, X, Bookmark, Building2, Bed, Calendar, DollarSign, CreditCard, Activity, Map, Users, User, Briefcase, Trash2, ArrowUpDown, EyeOff, HardHat, Clock, ArrowUp, ArrowDown, SortAsc, SlidersHorizontal, Check, TrendingUp, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  filterPillBase,
  filterPillActive,
  pillInactive,
  togglePillBase,
  togglePillOff,
  togglePillOn,
  filterPopoverSurface,
  filterInput,
  filterLabel,
  filterHelpText,
  filterPrimaryButton,
  filterSecondaryButton,
  filterSearchPillWrapper,
  filterSearchPillInput,
  filterDivider,
  resetAllPill,
} from "./filterStyles";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SaveFilterModal from "./SaveFilterModal";
import { CONSTRUCTION_STATUS_OPTIONS } from "@/constants/constructionStatus";
import { VIEWS_OPTIONS } from "@/constants/filterConfig";
import AdvancedFilterPanel from "./AdvancedFilterPanel";

export interface ShortcutFilterState {
  priceMode: 'unit' | 'sqft' | 'sqm';
  priceMin: string;
  priceMax: string;
  paymentPlanMax: number;
  afterHandover: string;
  postHandoverOnly: boolean;
  handoverFrom: { quarter: string; year: string };
  handoverTo: { quarter: string; year: string };
  propertyCategory: 'residential' | 'commercial' | null;
  propertyTypes: string[];
  bedrooms: string[];
  bathrooms: string[];
  statuses: string[];
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'alpha' | 'most_projects' | 'trending' | null;
  hideSoldOut: boolean;
  constructionStatuses: string[];
  sizeMin: string;
  sizeMax: string;
  emirates: string[];
  areas: string[];
  developers: string[];
  searchQuery: string;
  views: string[];
  amenities: string[];
  verifiedOnly: boolean;
  virtualTourOnly: boolean;
  furnishing: string[];
}


export const defaultShortcutFilters: ShortcutFilterState = {
  priceMode: 'unit',
  priceMin: '',
  priceMax: '',
  paymentPlanMax: 100,
  afterHandover: '',
  postHandoverOnly: false,
  handoverFrom: { quarter: 'Q1', year: '2025' },
  handoverTo: { quarter: 'Q4', year: '2035' },
  propertyCategory: null,
  propertyTypes: [],
  bedrooms: [],
  bathrooms: [],
  statuses: [],
  sortBy: null,
  hideSoldOut: false,
  constructionStatuses: [],
  sizeMin: '',
  sizeMax: '',
  emirates: [],
  areas: [],
  developers: [],
  searchQuery: '',
  views: [],
  amenities: [],
  verifiedOnly: false,
  virtualTourOnly: false,
  furnishing: [],
};


interface FilterShortcutBarProps {
  variant: 'light' | 'dark';
  filters: ShortcutFilterState;
  onFilterChange: (filters: ShortcutFilterState) => void;
  isMapMode?: boolean;
  onMapToggle?: (active: boolean) => void;
  searchSlot?: React.ReactNode;
  priorityFilter?: 'developers' | 'areas' | 'emirates' | 'projects';
  /** Live results count — only displayed when `showResultsCount` is explicitly true. */
  resultsCount?: number;
  /** Label for the results count (default: "Results") */
  resultsLabel?: string;
  /** Show the live results badge inside the shortcut rail. Default false. */
  showResultsCount?: boolean;
  /** Hide the duplicate sort pills (Newest/Low-High/High-Low/A-Z/Trending) when a SortBySelect is used elsewhere. */
  hideSort?: boolean;
}

const PRICE_PRESETS = [
  { label: '500K', value: '500000' },
  { label: '1M', value: '1000000' },
  { label: '1.5M', value: '1500000' },
  { label: '3M', value: '3000000' },
  { label: '5M', value: '5000000' },
];

const RESIDENTIAL_TYPES = [
  { value: 'apartments', label: 'Apartments' },
  { value: 'villa', label: 'Villa' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'penthouse', label: 'Penthouse' },
];

const COMMERCIAL_TYPES = [
  { value: 'plot', label: 'Plot' },
  { value: 'retail', label: 'Retail' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'offices', label: 'Offices' },
];

const ALL_PROPERTY_TYPES = [...RESIDENTIAL_TYPES, ...COMMERCIAL_TYPES];

const BEDROOM_OPTIONS = [
  { value: 'studio', label: 'Studio' },
  { value: '1', label: '1 BR' },
  { value: '2', label: '2 BR' },
  { value: '3', label: '3 BR' },
  { value: '4', label: '4 BR' },
  { value: '5', label: '5 BR' },
  { value: '6', label: '6 BR' },
  { value: '7+', label: '7+ BR' },
];

const STATUS_OPTIONS: { value: string; label: string; dotClass: string }[] = [
  { value: 'Announced', label: 'Announced', dotClass: 'jj-pill-emerald-metallic' },
  { value: 'Presale (EOI)', label: 'Presale EOI', dotClass: 'jj-pill-emerald-metallic' },
  { value: 'Start of Sales', label: 'Start of Sales', dotClass: 'jj-pill-emerald-metallic' },
  { value: 'On Sale', label: 'On Sale', dotClass: 'jj-pill-emerald-metallic' },
  { value: 'Sold Out', label: 'Sold Out', dotClass: 'jj-pill-emerald-metallic' },
];

const CONSTRUCTION_OPTIONS = [
  { value: 'Completed', label: 'Completed' },
  { value: 'Under Construction', label: 'Under Construction' },
  { value: 'Presale', label: 'Presale' },
  { value: 'Resale Off-Plan', label: 'Resale Off-Plan' },
  { value: 'Ready Resale', label: 'Ready Resale' },
];

const SORT_OPTIONS: { value: ShortcutFilterState['sortBy']; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Low-High' },
  { value: 'price_desc', label: 'High-Low' },
  { value: 'alpha', label: 'A-Z' },
  
  { value: 'trending', label: 'Trending' },
];

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const YEARS = ['2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'];

// Currency conversion rates
const CURRENCY_RATES: Record<string, number> = {
  AED: 1, USD: 0.27, EUR: 0.25, GBP: 0.21, INR: 22.5,
  SAR: 1.02, CNY: 1.98, RUB: 24.5, CAD: 0.37, AUD: 0.42,
};
const SQFT_TO_SQM = 1 / 10.764;
const SQM_TO_SQFT = 10.764;

const FilterShortcutBar = ({ variant, filters, onFilterChange, isMapMode, onMapToggle, searchSlot, priorityFilter, resultsCount, resultsLabel, showResultsCount = false, hideSort = false }: FilterShortcutBarProps) => {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [prevCurrency, setPrevCurrency] = useState<string>('AED');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isDark = variant === 'dark';

  // Controlled popover open state — allows Apply to close them
  const [priceOpen, setPriceOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [propertyTypeOpen, setPropertyTypeOpen] = useState(false);
  const [bedroomsOpen, setBedroomsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [constructionOpen, setConstructionOpen] = useState(false);
  const [viewsOpen, setViewsOpen] = useState(false);

  // Local draft state for price popover (prevents per-keystroke re-render/navigation)
  const [draftPriceMin, setDraftPriceMin] = useState(filters.priceMin);
  const [draftPriceMax, setDraftPriceMax] = useState(filters.priceMax);

  // Local draft state for payments popover
  const [draftPaymentPlanMax, setDraftPaymentPlanMax] = useState(filters.paymentPlanMax);
  const [draftAfterHandover, setDraftAfterHandover] = useState(filters.afterHandover);
  const [draftPostHandoverOnly, setDraftPostHandoverOnly] = useState(filters.postHandoverOnly);

  // Sync drafts when popover opens
  const handlePriceOpenChange = useCallback((open: boolean) => {
    if (open) {
      setDraftPriceMin(filters.priceMin);
      setDraftPriceMax(filters.priceMax);
    }
    setPriceOpen(open);
  }, [filters.priceMin, filters.priceMax]);

  const handlePaymentsOpenChange = useCallback((open: boolean) => {
    if (open) {
      setDraftPaymentPlanMax(filters.paymentPlanMax);
      setDraftAfterHandover(filters.afterHandover);
      setDraftPostHandoverOnly(filters.postHandoverOnly);
    }
    setPaymentsOpen(open);
  }, [filters.paymentPlanMax, filters.afterHandover, filters.postHandoverOnly]);

  const applyPrice = useCallback(() => {
    onFilterChange({ ...filters, priceMin: draftPriceMin, priceMax: draftPriceMax });
    setPriceOpen(false);
  }, [filters, onFilterChange, draftPriceMin, draftPriceMax]);

  const applyPayments = useCallback(() => {
    onFilterChange({
      ...filters,
      paymentPlanMax: draftPaymentPlanMax,
      afterHandover: draftAfterHandover,
      postHandoverOnly: draftPostHandoverOnly,
    });
    setPaymentsOpen(false);
  }, [filters, onFilterChange, draftPaymentPlanMax, draftAfterHandover, draftPostHandoverOnly]);

  const update = useCallback((partial: Partial<ShortcutFilterState>) => {
    onFilterChange({ ...filters, ...partial });
  }, [filters, onFilterChange]);

  // Listen for currency changes and convert price filters
  useEffect(() => {
    const handler = (e: Event) => {
      const newCurrency = (e as CustomEvent).detail as string;
      const oldRate = CURRENCY_RATES[prevCurrency] || 1;
      const newRate = CURRENCY_RATES[newCurrency] || 1;
      const ratio = newRate / oldRate;
      const convertVal = (v: string) => {
        if (!v) return '';
        const num = Number(v);
        return isNaN(num) ? v : String(Math.round(num * ratio));
      };
      onFilterChange({
        ...filters,
        priceMin: convertVal(filters.priceMin),
        priceMax: convertVal(filters.priceMax),
      });
      setPrevCurrency(newCurrency);
    };
    window.addEventListener('currencyChange', handler);
    return () => window.removeEventListener('currencyChange', handler);
  }, [filters, onFilterChange, prevCurrency]);

  // Handle priceMode change (sqft/sqm) — convert size filters
  const handlePriceModeChange = useCallback((newMode: string) => {
    const oldMode = filters.priceMode;
    const convertSize = (v: string) => {
      if (!v) return '';
      const num = Number(v);
      if (isNaN(num)) return v;
      if (oldMode === 'sqft' && newMode === 'sqm') return String(Math.round(num * SQFT_TO_SQM));
      if (oldMode === 'sqm' && newMode === 'sqft') return String(Math.round(num * SQM_TO_SQFT));
      return v;
    };
    onFilterChange({
      ...filters,
      priceMode: newMode as any,
      sizeMin: convertSize(filters.sizeMin),
      sizeMax: convertSize(filters.sizeMax),
    });
  }, [filters, onFilterChange]);

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.priceMin !== '' ||
    filters.priceMax !== '' ||
    filters.sizeMin !== '' ||
    filters.sizeMax !== '' ||
    filters.paymentPlanMax < 100 ||
    filters.afterHandover ||
    filters.postHandoverOnly ||
    filters.propertyCategory !== null ||
    filters.propertyTypes.length > 0 ||
    filters.bedrooms.length > 0 ||
    filters.statuses.length > 0 ||
    filters.sortBy !== null ||
    filters.hideSoldOut ||
    filters.constructionStatuses.length > 0 ||
    filters.views.length > 0 ||
    filters.emirates.length > 0 ||
    filters.areas.length > 0 ||
    filters.developers.length > 0;

  /**
   * Single source of truth for "Reset all filters":
   *   1. Clear every filter back to the canonical defaults.
   *   2. Force every controlled popover (and the advanced panel / save
   *      modal) closed so the user isn't left with a stale UI surface
   *      hanging open over reset chips.
   *   3. Drop any draft state inside the price / payments popovers so
   *      reopening them shows zeroed inputs, not the previous typed values.
   *   4. Navigate to /properties with no query string so the user sees the
   *      full unfiltered results immediately, regardless of where they
   *      triggered reset from.
   *
   * This is the one control the user can rely on to "start over".
   */
  const resetAll = useCallback(() => {
    // 1. Reset filter state — propagates to URL via GlobalFilterBar's
    //    useEffect-driven encodeFilters/navigate pipeline.
    onFilterChange({ ...defaultShortcutFilters });

    // 2. Close every popover / sheet this component owns.
    setPriceOpen(false);
    setPaymentsOpen(false);
    setHandoverOpen(false);
    setPropertyTypeOpen(false);
    setBedroomsOpen(false);
    setStatusOpen(false);
    setConstructionOpen(false);
    setViewsOpen(false);
    setAdvancedOpen(false);
    setSaveModalOpen(false);

    // 3. Wipe popover drafts so reopening shows clean inputs.
    setDraftPriceMin('');
    setDraftPriceMax('');
    setDraftPaymentPlanMax(defaultShortcutFilters.paymentPlanMax);
    setDraftAfterHandover(defaultShortcutFilters.afterHandover);
    setDraftPostHandoverOnly(defaultShortcutFilters.postHandoverOnly);

    // 4. Navigate to the unfiltered listing. Defer one tick so popover
    //    close animations can settle before the route potentially
    //    unmounts the bar (mirrors GlobalFilterBar's navigation pattern).
    setTimeout(() => {
      navigate('/properties');
    }, 0);
  }, [onFilterChange, navigate]);


  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  // Pill styling — sourced from filterStyles so every filter surface looks identical.
  // The `pillBase` token already handles touch-manipulation and the focus-visible ring.
  const pillBase = filterPillBase;
  const pillInactiveCls = pillInactive(isDark ? "dark" : "light");
  const pillActive = filterPillActive;
  const popoverClass = filterPopoverSurface;
  const filterTabsList = "w-full mb-3 rounded-xl border border-[#B89555]/60 bg-gradient-to-b from-[#FDFBF7] via-[#F7F2EA] to-[#EADBB6] p-1";
  const filterTabTrigger = "flex-1 rounded-lg text-xs font-bold text-[#1A1A1A] data-[state=active]:bg-[#FDFBF7] data-[state=active]:text-[#1A1A1A] data-[state=active]:shadow-sm";
  const dropdownGhostChip = "bg-white border border-[#B89555]/55 text-[#1A1A1A] hover:bg-[#F7F2EA] hover:border-[#064E3B]/55";

  const handleSaveFilter = (name: string) => {
    const saved = JSON.parse(localStorage.getItem('jbj-saved-filters') || '[]');
    saved.push({ name, filters, createdAt: new Date().toISOString() });
    localStorage.setItem('jbj-saved-filters', JSON.stringify(saved));
  };

  const CountBadge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="ml-1 w-5 h-5 rounded-full jj-pill-emerald-metallic text-white text-[10px] font-bold flex items-center justify-center">
        +{count}
      </span>
    ) : null;

  const getPropertyTypeLabel = () => {
    if (filters.propertyTypes.length === 0) {
      if (filters.propertyCategory === 'residential') return t('filter.residential');
      if (filters.propertyCategory === 'commercial') return t('filter.commercial');
      return t('filter.propertyType');
    }
    const first = ALL_PROPERTY_TYPES.find(o => o.value === filters.propertyTypes[0])?.label || '';
    return first;
  };


  return (
    <>
      <div className="w-full" data-filter-clean="true">
        {/* Single merged row: Search + Filter Popovers + Sort + Map + Saved + Reset + Results */}
        {/*
          Mobile-first horizontal rail:
          - `overflow-x-auto` + `-webkit-overflow-scrolling: touch` = momentum
            scrolling on iOS Safari.
          - `overscroll-x-contain` stops swipes from triggering the browser's
            back-gesture or rubber-banding the parent page.
          - `touch-action: pan-x` locks the gesture axis so a quick horizontal
            flick on a chip doesn't fight the page's vertical scroll, and a
            vertical scroll doesn't get hijacked by the rail.
          - `px-1` keeps the first/last pills from sitting flush against the
            viewport edge, making them comfortably tappable.
        */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto overscroll-x-contain scrollbar-hide w-full px-1"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            touchAction: 'pan-x pan-y',
          } as React.CSSProperties}
        >

          {/* Search slot or built-in search */}
          {searchSlot ? (
            <div className="min-w-0 flex-1 min-w-[200px] max-w-[420px] flex-shrink" title="Search area, project, keyword">
              {searchSlot}
            </div>

          ) : (
            <div className={cn(
              isDark
                ? "min-w-0 flex-shrink-0 flex items-center px-3 rounded-full bg-[#021611]/82 border border-white/28 shadow-sm"
                : filterSearchPillWrapper,
              "w-[160px]"
            )}>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => update({ searchQuery: e.target.value })}
                placeholder={t('filter.searchPlaceholder')}
                className={cn(
                  filterSearchPillInput,
                  isDark && "allow-white text-white placeholder:text-white/70"
                )}
              />
            </div>
          )}
        <button
          type="button"
          onClick={() => setAdvancedOpen(true)}
          className={cn(pillBase, advancedOpen ? pillActive : pillInactiveCls)}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          More filters
        </button>
        {/* Price */}
        <Popover open={priceOpen} onOpenChange={handlePriceOpenChange}>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, (filters.priceMin || filters.priceMax) ? pillActive : pillInactiveCls)}>
              {t('filter.price')}
              <ChevronDown className="w-3 h-3 text-white opacity-100" />
            </button>
          </PopoverTrigger>
            <PopoverContent data-filter-dropdown="true" data-no-contrast-guard className={cn("w-80 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <Tabs value={filters.priceMode} onValueChange={handlePriceModeChange}>
              <TabsList className={filterTabsList}>
                <TabsTrigger value="unit" data-filter-selected={filters.priceMode === 'unit' ? "true" : undefined} className={filterTabTrigger}>{t('filter.perUnit')}</TabsTrigger>
                <TabsTrigger value="sqft" data-filter-selected={filters.priceMode === 'sqft' ? "true" : undefined} className={filterTabTrigger}>{t('filter.perSqft')}</TabsTrigger>
                <TabsTrigger value="sqm" data-filter-selected={filters.priceMode === 'sqm' ? "true" : undefined} className={filterTabTrigger}>{t('filter.perSqm')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={filterLabel}>{t('filter.minPrice')}</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    value={draftPriceMin}
                    onChange={(e) => setDraftPriceMin(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyPrice(); } }}
                    placeholder="0"
                    className={cn(filterInput, "pr-12")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#1A1A1A] font-bold">AED</span>
                </div>
              </div>
              <div>
                <label className={filterLabel}>{t('filter.maxPrice')}</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    value={draftPriceMax}
                    onChange={(e) => setDraftPriceMax(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyPrice(); } }}
                    placeholder="Any"
                    className={cn(filterInput, "pr-12")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#1A1A1A] font-bold">AED</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {PRICE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setDraftPriceMax(draftPriceMax === p.value ? '' : p.value)}
                  data-filter-selected={draftPriceMax === p.value ? "true" : undefined}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    draftPriceMax === p.value
                      ? "jj-pill-emerald-metallic filter-emerald-action text-white border-0 font-bold"
                      : dropdownGhostChip
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setDraftPriceMin(''); setDraftPriceMax(''); }}
                className={filterSecondaryButton}
              >
                {t('filter.reset') || 'Reset'}
              </Button>
              <Button
                type="button"
                onClick={applyPrice}
                className={cn(filterPrimaryButton, "flex-1")}
              >
                {t('filter.applyFilter')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Payments */}
        <Popover open={paymentsOpen} onOpenChange={handlePaymentsOpenChange}>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, (filters.paymentPlanMax < 100 || filters.postHandoverOnly) ? pillActive : pillInactiveCls)}>
              {t('filter.payments')}
              <ChevronDown className="w-3 h-3 text-white opacity-100" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            data-filter-dropdown="true"
            data-no-contrast-guard
            className={cn("w-80 p-4", popoverClass)}
            side="bottom"
            align="start"
            sideOffset={6}
            style={{
              ['--slider-track-bg' as any]: 'rgba(255,255,255,0.22)',
              ['--slider-range-bg' as any]: 'var(--jj-emerald-ombre)',
              ['--slider-thumb-bg' as any]: '#FFFFFF',
              ['--slider-thumb-shadow' as any]: '0 2px 10px rgba(6,78,59,0.45), 0 0 0 2px #064E3B inset',
            }}
          >
            <h4 data-filter-ink-label className="text-sm font-bold mb-3" style={{ color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A' }}>{t('filter.paymentsTitle')}</h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span data-filter-ink-label className="text-xs font-semibold" style={{ color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A' }}>{t('filter.maxPreHandover')}</span>
                  <span className="text-xs font-bold text-[#1A1A1A] bg-white px-2 py-0.5 rounded border border-[#B89555]/55">{draftPaymentPlanMax}%</span>
                </div>
                <Slider
                  value={[draftPaymentPlanMax]}
                  onValueChange={(v) => setDraftPaymentPlanMax(v[0])}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
              <div>
                <label data-filter-ink-label className={filterLabel} style={{ color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A' }}>{t('filter.afterHandover')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={draftAfterHandover}
                  onChange={(e) => setDraftAfterHandover(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyPayments(); } }}
                  placeholder="e.g. 30"
                  className={filterInput}
                />
              </div>
              <div className="flex items-center justify-between">
                <span data-filter-ink-label className="text-xs font-semibold" style={{ color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A' }}>{t('filter.postHandoverOnly')}</span>
                <Switch
                  checked={draftPostHandoverOnly}
                  onCheckedChange={(v) => setDraftPostHandoverOnly(v)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setDraftPaymentPlanMax(100); setDraftAfterHandover(''); setDraftPostHandoverOnly(false); }}
                  className={filterSecondaryButton}
                >
                  {t('filter.reset') || 'Reset'}
                </Button>
                <Button
                  type="button"
                  onClick={applyPayments}
                  className={cn(filterPrimaryButton, "flex-1")}
                >
                  {t('filter.applyFilter')}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Handover */}
        <Popover open={handoverOpen} onOpenChange={setHandoverOpen}>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, pillInactiveCls)}>
              {t('filter.handover')}
              <ChevronDown className="w-3 h-3 text-white opacity-100" />
            </button>
          </PopoverTrigger>
          <PopoverContent data-filter-dropdown="true" data-no-contrast-guard className={cn("w-80 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <h4 className="text-sm font-bold text-[#1A1A1A] mb-3">{t('filter.handoverTitle')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`${filterLabel} mb-2`}>{t('filter.from')}</label>
                <div className="flex gap-1 mb-2">
                  {QUARTERS.map(q => (
                    <button
                      key={q}
                      onClick={() => update({ handoverFrom: { ...filters.handoverFrom, quarter: q } })}
                      data-filter-selected={filters.handoverFrom.quarter === q ? "true" : undefined}
                    className={cn(
                        "flex-1 h-8 rounded-lg text-xs font-bold transition-all text-center",
                        filters.handoverFrom.quarter === q
                          ? "jj-pill-emerald-metallic text-white border-0 shadow-sm"
                          : dropdownGhostChip
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <select
                  value={filters.handoverFrom.year}
                  onChange={(e) => update({ handoverFrom: { ...filters.handoverFrom, year: e.target.value } })}
                  className={cn(filterInput, "appearance-none cursor-pointer")}
                  style={{ WebkitAppearance: 'none' }}
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className={`${filterLabel} mb-2`}>{t('filter.to')}</label>
                <div className="flex gap-1 mb-2">
                  {QUARTERS.map(q => (
                    <button
                      key={q}
                      onClick={() => update({ handoverTo: { ...filters.handoverTo, quarter: q } })}
                  data-filter-selected={filters.handoverTo.quarter === q ? "true" : undefined}
                      className={cn(
                        "flex-1 h-8 rounded-lg text-xs font-bold transition-all text-center",
                        filters.handoverTo.quarter === q
                          ? "jj-pill-emerald-metallic text-white border-0 shadow-sm"
                          : dropdownGhostChip
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <select
                  value={filters.handoverTo.year}
                  onChange={(e) => update({ handoverTo: { ...filters.handoverTo, year: e.target.value } })}
                  className={cn(filterInput, "appearance-none cursor-pointer")}
                  style={{ WebkitAppearance: 'none' }}
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Property Type */}
        <Popover open={propertyTypeOpen} onOpenChange={setPropertyTypeOpen}>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, (filters.propertyCategory || filters.propertyTypes.length > 0) ? pillActive : pillInactiveCls)}>
              {getPropertyTypeLabel()}
              {filters.propertyTypes.length > 1 && <CountBadge count={filters.propertyTypes.length - 1} />}
              <ChevronDown className="w-3 h-3 text-white opacity-100" />
            </button>
          </PopoverTrigger>
          <PopoverContent data-filter-dropdown="true" data-no-contrast-guard className={cn("w-72 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <Tabs
              value={filters.propertyCategory || 'residential'}
              onValueChange={(val) => {
                const category = val as 'residential' | 'commercial';
                update({ propertyCategory: category, propertyTypes: [] });
              }}
            >
              <TabsList className={filterTabsList}>
                <TabsTrigger value="residential" data-filter-selected={(filters.propertyCategory || 'residential') === 'residential' ? "true" : undefined} className={filterTabTrigger}>{t('filter.residential')}</TabsTrigger>
                <TabsTrigger value="commercial" data-filter-selected={filters.propertyCategory === 'commercial' ? "true" : undefined} className={filterTabTrigger}>{t('filter.commercial')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap gap-2">
              {(filters.propertyCategory === 'commercial' ? COMMERCIAL_TYPES : RESIDENTIAL_TYPES).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ propertyTypes: toggleArray(filters.propertyTypes, opt.value) })}
                  data-filter-selected={filters.propertyTypes.includes(opt.value) ? "true" : undefined}
                  className={cn(togglePillBase, filters.propertyTypes.includes(opt.value) ? togglePillOn : togglePillOff)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Bedrooms */}
        <Popover open={bedroomsOpen} onOpenChange={setBedroomsOpen}>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, filters.bedrooms.length > 0 ? pillActive : pillInactiveCls)}>
              {t('filter.bedrooms')}
              {filters.bedrooms.length > 0 && <CountBadge count={filters.bedrooms.length} />}
              <ChevronDown className="w-3 h-3 text-white opacity-100" />
            </button>
          </PopoverTrigger>
          <PopoverContent data-filter-dropdown="true" data-no-contrast-guard className={cn("w-72 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <div className="flex flex-wrap gap-2">
              {BEDROOM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ bedrooms: toggleArray(filters.bedrooms, opt.value) })}
                  data-filter-selected={filters.bedrooms.includes(opt.value) ? "true" : undefined}
                  className={cn(togglePillBase, filters.bedrooms.includes(opt.value) ? togglePillOn : togglePillOff)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button type="button" variant="outline" onClick={() => update({ bedrooms: [] })} className={filterSecondaryButton}>{t('filter.reset') || 'Reset'}</Button>
              <Button type="button" onClick={() => setBedroomsOpen(false)} className={cn(filterPrimaryButton, "flex-1")}>{t('filter.applyFilter') || 'Done'}</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Status */}
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, filters.statuses.length > 0 ? pillActive : pillInactiveCls)}>
              {t('filter.status')}
              {filters.statuses.length > 0 && <CountBadge count={filters.statuses.length} />}
              <ChevronDown className="w-3 h-3 text-white opacity-100" />
            </button>
          </PopoverTrigger>
          <PopoverContent data-filter-dropdown="true" data-no-contrast-guard className={cn("w-64 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ statuses: toggleArray(filters.statuses, opt.value) })}
                  data-filter-selected={filters.statuses.includes(opt.value) ? "true" : undefined}
                  className={cn(
                    togglePillBase,
                    filters.statuses.includes(opt.value) ? togglePillOn : togglePillOff,
                    "flex items-center gap-1.5"
                  )}
                >
                  <span className="w-2 h-2 rounded-full jj-status-dot" />
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button type="button" variant="outline" onClick={() => update({ statuses: [] })} className={filterSecondaryButton}>{t('filter.reset') || 'Reset'}</Button>
              <Button type="button" onClick={() => setStatusOpen(false)} className={cn(filterPrimaryButton, "flex-1")}>{t('filter.applyFilter') || 'Done'}</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Construction Status */}
        <Popover open={constructionOpen} onOpenChange={setConstructionOpen}>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, filters.constructionStatuses.length > 0 ? pillActive : pillInactiveCls)}>
              {t('filter.construction')}
              {filters.constructionStatuses.length > 0 && <CountBadge count={filters.constructionStatuses.length} />}
              <ChevronDown className="w-3 h-3 text-white opacity-100" />
            </button>
          </PopoverTrigger>
          <PopoverContent data-filter-dropdown="true" data-no-contrast-guard className={cn("w-64 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <div className="flex flex-wrap gap-2">
              {CONSTRUCTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ constructionStatuses: toggleArray(filters.constructionStatuses, opt.value) })}
                  data-filter-selected={filters.constructionStatuses.includes(opt.value) ? "true" : undefined}
                  className={cn(togglePillBase, filters.constructionStatuses.includes(opt.value) ? togglePillOn : togglePillOff)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button type="button" variant="outline" onClick={() => update({ constructionStatuses: [] })} className={filterSecondaryButton}>{t('filter.reset') || 'Reset'}</Button>
              <Button type="button" onClick={() => setConstructionOpen(false)} className={cn(filterPrimaryButton, "flex-1")}>{t('filter.applyFilter') || 'Done'}</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Views */}
        <Popover open={viewsOpen} onOpenChange={setViewsOpen}>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, filters.views.length > 0 ? pillActive : pillInactiveCls)}>
              <Eye className="w-3.5 h-3.5" />
              {t('filter.views')}
              {filters.views.length > 0 && <CountBadge count={filters.views.length} />}
              <ChevronDown className="w-3 h-3 text-white opacity-100" />
            </button>
          </PopoverTrigger>
          <PopoverContent data-filter-dropdown="true" data-no-contrast-guard className={cn("w-80 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <h4 className="text-sm font-bold text-[#1A1A1A] mb-3">{t('filter.propertyViews')}</h4>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
              {VIEWS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ views: toggleArray(filters.views, opt.value) })}
                  data-filter-selected={filters.views.includes(opt.value) ? "true" : undefined}
                  className={cn(togglePillBase, filters.views.includes(opt.value) ? togglePillOn : togglePillOff)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button type="button" variant="outline" onClick={() => update({ views: [] })} className={filterSecondaryButton}>{t('filter.reset') || 'Reset'}</Button>
              <Button type="button" onClick={() => setViewsOpen(false)} className={cn(filterPrimaryButton, "flex-1")}>{t('filter.applyFilter') || 'Done'}</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Hide Sold Out — permanently removed. Off-plan projects are never
            marked sold on this site (developer stock that sells out reappears
            in the secondary market). Only individual resale listings can be
            sold, and that surfaces in the resale UI, not here. */}
        <div className={filterDivider} />

        {/* Sort pills (hidden when consumer page uses a dedicated SortBySelect) */}
        {!hideSort && SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update({ sortBy: filters.sortBy === opt.value ? null : opt.value })}
            className={cn(
              pillBase, "px-2.5 py-1.5",
              filters.sortBy === opt.value ? pillActive : pillInactiveCls
            )}
          >
            {opt.value === 'trending' ? <TrendingUp className="w-3.5 h-3.5" /> : opt.label}
          </button>
        ))}

        {!hideSort && (
          <div className={filterDivider} />
        )}

        {/* Map toggle */}
        <button
          onClick={() => onMapToggle ? onMapToggle(!isMapMode) : navigate('/properties?view=map')}
          className={cn(pillBase, "px-2.5 py-1.5", isMapMode ? pillActive : pillInactiveCls)}
          title={t('filter.map')}
        >
          <Map className="w-3.5 h-3.5" />
          {isMapMode ? t('filter.list') : t('filter.map')}
        </button>

        {/* Saved Filters */}
        <ConnectedSavedButton variant={variant} onApplySavedFilter={onFilterChange} />

        {/* Reset All */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetAll}
            title={t('filter.resetAll') || 'Reset all filters'}
            aria-label={t('filter.resetAll') || 'Reset all filters'}
            className={cn(
              resetAllPill, "px-2.5 py-1.5"
            )}
          >
            <X className="w-3.5 h-3.5" />
            {t('filter.resetAll') || 'Reset all'}
          </button>
        )}

        {/* Live Results Count Badge — opt-in only via showResultsCount.
            Removed from default rails to avoid stray "54 / 054" numbers
            appearing in the search/filter area on the properties page. */}
        {showResultsCount && resultsCount !== undefined && (
          <div className="flex-shrink-0 ml-auto sticky right-0 pl-2">
            <div
              key={resultsCount}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all animate-in fade-in zoom-in-95 duration-300",
                "jj-pill-emerald-metallic text-white border-0 shadow-sm"
              )}
            >
              <Activity className="w-3.5 h-3.5 text-white" />
              <span className="tabular-nums">{resultsCount.toLocaleString()}</span>
              <span className="text-white/85 font-medium">{resultsLabel || 'Results'}</span>
            </div>
          </div>
        )}

        </div>
      </div>

      <SaveFilterModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        onSave={handleSaveFilter}
      />

      <AdvancedFilterPanel
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        filters={filters}
        onFilterChange={onFilterChange}
      />
    </>
  );
};

/* ---- Connected toolbar sub-components ---- */

interface SavedFilter {
  name: string;
  filters: ShortcutFilterState;
  createdAt: string;
}

function ConnectedSavedButton({ variant, onApplySavedFilter }: { variant: 'light' | 'dark'; onApplySavedFilter: (filters: ShortcutFilterState) => void }) {
  const { t } = useLanguage();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('jbj-saved-filters');
    if (raw) {
      try { setSavedFilters(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, [savedOpen]);

  const deleteSavedFilter = (index: number) => {
    const updated = savedFilters.filter((_, i) => i !== index);
    setSavedFilters(updated);
    localStorage.setItem('jbj-saved-filters', JSON.stringify(updated));
    setConfirmDeleteIndex(null);
  };

  const applySavedFilter = (filter: SavedFilter) => {
    onApplySavedFilter(filter.filters);
    setSavedOpen(false);
  };

  return (
    <Popover open={savedOpen} onOpenChange={setSavedOpen}>
      <PopoverTrigger asChild>
          <button className={cn(filterPillBase, pillInactive(variant), "px-3.5 py-1.5")} title="View saved filters">
          <Bookmark className={cn("w-3.5 h-3.5", variant === 'dark' ? "text-white fill-white" : "text-[#064E3B] fill-[#064E3B]")} />
          <span className="hidden sm:inline">{t('filter.savedFilters')}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-no-contrast-guard
        data-filter-dropdown="true"
        className={cn("w-72 p-3", filterPopoverSurface)}
        side="bottom"
        align="end"
        sideOffset={6}
      >
        <h4 className="text-sm font-bold text-[#1A1A1A] mb-2">{t('filter.savedFilters')}</h4>
        {savedFilters.length === 0 ? (
          <p className="text-xs text-[#1A1A1A] py-4 text-center">{t('filter.noSavedFilters')}</p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {savedFilters.map((sf, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-white cursor-pointer transition-colors group"
                onClick={() => applySavedFilter(sf)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#1A1A1A] truncate">{sf.name}</p>
                  <p className="text-[10px] text-[#1A1A1A]/70">{new Date(sf.createdAt).toLocaleDateString()}</p>
                </div>
                {confirmDeleteIndex === idx ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-[#1A1A1A] font-semibold whitespace-nowrap">Delete?</span>
                    <button
                      onClick={() => deleteSavedFilter(idx)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold jj-pill-emerald-metallic text-white transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeleteIndex(null)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white border border-[#B89555]/55 text-[#1A1A1A] hover:bg-[#F7F2EA] transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteIndex(idx); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/14 text-white transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default FilterShortcutBar;
