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
};

interface FilterShortcutBarProps {
  variant: 'light' | 'dark';
  filters: ShortcutFilterState;
  onFilterChange: (filters: ShortcutFilterState) => void;
  isMapMode?: boolean;
  onMapToggle?: (active: boolean) => void;
  searchSlot?: React.ReactNode;
  priorityFilter?: 'developers' | 'areas' | 'emirates' | 'projects';
  /** Live results count — displayed as a sticky badge at the end of row 2 */
  resultsCount?: number;
  /** Label for the results count (default: "Results") */
  resultsLabel?: string;
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
  { value: 'Announced', label: 'Announced', dotClass: 'bg-pink-400' },
  { value: 'Presale (EOI)', label: 'Presale EOI', dotClass: 'bg-green-400' },
  { value: 'Start of Sales', label: 'Start of Sales', dotClass: 'bg-blue-400' },
  { value: 'On Sale', label: 'On Sale', dotClass: 'bg-yellow-400' },
  { value: 'Sold Out', label: 'Sold Out', dotClass: 'bg-red-500' },
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

const FilterShortcutBar = ({ variant, filters, onFilterChange, isMapMode, onMapToggle, searchSlot, priorityFilter, resultsCount, resultsLabel }: FilterShortcutBarProps) => {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [prevCurrency, setPrevCurrency] = useState<string>('AED');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isDark = variant === 'dark';

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
    filters.priceMin !== '' ||
    filters.priceMax !== '' ||
    filters.paymentPlanMax < 100 ||
    filters.postHandoverOnly ||
    filters.propertyCategory !== null ||
    filters.propertyTypes.length > 0 ||
    filters.bedrooms.length > 0 ||
    filters.statuses.length > 0 ||
    filters.sortBy !== null ||
    filters.hideSoldOut ||
    filters.constructionStatuses.length > 0 ||
    filters.views.length > 0;

  const resetAll = () => onFilterChange({ ...defaultShortcutFilters });

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  // Pill styling
  const pillBase = "inline-flex items-center justify-center gap-1.5 px-3.5 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap select-none overflow-hidden text-ellipsis max-w-[200px] flex-shrink-0";
  const pillInactive = isDark
    ? "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
    : "bg-white border border-gray-300 text-black hover:border-gray-400 hover:bg-gray-50";
  const pillActive = isDark
    ? "bg-white text-black border border-white shadow-lg"
    : "bg-black text-white border border-black font-bold shadow-sm";

  const popoverClass = "bg-white border border-gray-200 z-[10200] shadow-xl";

  const togglePillBase = "px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer";
  const togglePillOff = "border-gray-300 text-gray-700 bg-white hover:bg-gray-50";
  const togglePillOn = "border-black bg-black text-white font-bold";

  const handleSaveFilter = (name: string) => {
    const saved = JSON.parse(localStorage.getItem('jbj-saved-filters') || '[]');
    saved.push({ name, filters, createdAt: new Date().toISOString() });
    localStorage.setItem('jbj-saved-filters', JSON.stringify(saved));
  };

  const CountBadge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="ml-1 w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
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
      <div className="w-full">
        {/* Single merged row: Search + Filter Popovers + Sort + Map + Saved + Reset + Results */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide w-full" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
          {/* Search slot or built-in search */}
          {searchSlot ? (
            <div className="min-w-0 max-w-[180px] flex-shrink-0" title="Search area, project, keyword">
              {searchSlot}
            </div>
          ) : (
            <div className="min-w-0 w-[160px] flex-shrink-0 flex items-center px-2 border border-gray-300 rounded-full bg-white">
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => update({ searchQuery: e.target.value })}
                placeholder={t('filter.searchPlaceholder')}
                className="w-full py-1.5 bg-transparent text-xs text-black placeholder:text-black/40 outline-none"
              />
            </div>
          )}
        {/* Price */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, (filters.priceMin || filters.priceMax) ? pillActive : pillInactive)}>
              {t('filter.price')}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-80 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <Tabs value={filters.priceMode} onValueChange={handlePriceModeChange}>
              <TabsList className="w-full mb-3 bg-white/60">
                <TabsTrigger value="unit" className="flex-1 text-xs">{t('filter.perUnit')}</TabsTrigger>
                <TabsTrigger value="sqft" className="flex-1 text-xs">{t('filter.perSqft')}</TabsTrigger>
                <TabsTrigger value="sqm" className="flex-1 text-xs">{t('filter.perSqm')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] font-semibold text-black/50 uppercase mb-1 block">{t('filter.minPrice')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.priceMin}
                    onChange={(e) => update({ priceMin: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="0"
                    className="w-full h-9 px-3 pr-12 bg-white border border-gray-300 rounded-lg text-sm text-black"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-black/40 font-medium">AED</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-black/50 uppercase mb-1 block">{t('filter.maxPrice')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.priceMax}
                    onChange={(e) => update({ priceMax: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="Any"
                    className="w-full h-9 px-3 pr-12 bg-white border border-gray-300 rounded-lg text-sm text-black"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-black/40 font-medium">AED</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {PRICE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => update({ priceMax: p.value })}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                    filters.priceMax === p.value
                      ? "bg-black text-white border-black font-bold"
                      : "bg-white text-black border-gray-300 hover:border-gray-400"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Button
              onClick={() => {}}
              className="w-full h-9 bg-black text-white font-bold text-xs rounded-lg hover:bg-gray-800"
            >
              {t('filter.applyFilter')}
            </Button>
          </PopoverContent>
        </Popover>

        {/* Payments */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, (filters.paymentPlanMax < 100 || filters.postHandoverOnly) ? pillActive : pillInactive)}>
              {t('filter.payments')}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-80 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <h4 className="text-sm font-bold text-black mb-3">{t('filter.paymentsTitle')}</h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-black/60">{t('filter.maxPreHandover')}</span>
                  <span className="text-xs font-bold text-black bg-white px-2 py-0.5 rounded border border-gray-300">{filters.paymentPlanMax}%</span>
                </div>
                <Slider
                  value={[filters.paymentPlanMax]}
                  onValueChange={(v) => update({ paymentPlanMax: v[0] })}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
              <div>
                <label className="text-xs text-black/60 mb-1 block">{t('filter.afterHandover')}</label>
                <input
                  type="text"
                  value={filters.afterHandover}
                  onChange={(e) => update({ afterHandover: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="e.g. 30"
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm text-black"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-black/70">{t('filter.postHandoverOnly')}</span>
                <Switch
                  checked={filters.postHandoverOnly}
                  onCheckedChange={(v) => update({ postHandoverOnly: v })}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Handover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, pillInactive)}>
              {t('filter.handover')}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-80 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <h4 className="text-sm font-bold text-black mb-3">{t('filter.handoverTitle')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-black/50 uppercase mb-2 block">{t('filter.from')}</label>
                <div className="flex gap-1 mb-2">
                  {QUARTERS.map(q => (
                    <button
                      key={q}
                      onClick={() => update({ handoverFrom: { ...filters.handoverFrom, quarter: q } })}
                      className={cn(
                        "flex-1 h-8 rounded-lg text-xs font-bold transition-all text-center",
                        filters.handoverFrom.quarter === q
                          ? "bg-black text-white border border-black shadow-sm"
                          : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <select
                  value={filters.handoverFrom.year}
                  onChange={(e) => update({ handoverFrom: { ...filters.handoverFrom, year: e.target.value } })}
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm text-black font-medium appearance-none cursor-pointer"
                  style={{ WebkitAppearance: 'none' }}
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-black/50 uppercase mb-2 block">{t('filter.to')}</label>
                <div className="flex gap-1 mb-2">
                  {QUARTERS.map(q => (
                    <button
                      key={q}
                      onClick={() => update({ handoverTo: { ...filters.handoverTo, quarter: q } })}
                      className={cn(
                        "flex-1 h-8 rounded-lg text-xs font-bold transition-all text-center",
                        filters.handoverTo.quarter === q
                          ? "bg-black text-white border border-black shadow-sm"
                          : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <select
                  value={filters.handoverTo.year}
                  onChange={(e) => update({ handoverTo: { ...filters.handoverTo, year: e.target.value } })}
                  className="w-full h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm text-black font-medium appearance-none cursor-pointer"
                  style={{ WebkitAppearance: 'none' }}
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Property Type */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, (filters.propertyCategory || filters.propertyTypes.length > 0) ? pillActive : pillInactive)}>
              {getPropertyTypeLabel()}
              {filters.propertyTypes.length > 1 && <CountBadge count={filters.propertyTypes.length - 1} />}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-72 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <Tabs
              value={filters.propertyCategory || 'residential'}
              onValueChange={(val) => {
                const category = val as 'residential' | 'commercial';
                update({ propertyCategory: category, propertyTypes: [] });
              }}
            >
              <TabsList className="w-full mb-3 bg-white/60">
                <TabsTrigger value="residential" className="flex-1 text-xs data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-sm">{t('filter.residential')}</TabsTrigger>
                <TabsTrigger value="commercial" className="flex-1 text-xs data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-sm">{t('filter.commercial')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap gap-2">
              {(filters.propertyCategory === 'commercial' ? COMMERCIAL_TYPES : RESIDENTIAL_TYPES).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ propertyTypes: toggleArray(filters.propertyTypes, opt.value) })}
                  className={cn(togglePillBase, filters.propertyTypes.includes(opt.value) ? togglePillOn : togglePillOff)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Bedrooms */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, filters.bedrooms.length > 0 ? pillActive : pillInactive)}>
              {t('filter.bedrooms')}
              {filters.bedrooms.length > 0 && <CountBadge count={filters.bedrooms.length} />}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-72 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <div className="flex flex-wrap gap-2">
              {BEDROOM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ bedrooms: toggleArray(filters.bedrooms, opt.value) })}
                  className={cn(togglePillBase, filters.bedrooms.includes(opt.value) ? togglePillOn : togglePillOff)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Status */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, filters.statuses.length > 0 ? pillActive : pillInactive)}>
              {t('filter.status')}
              {filters.statuses.length > 0 && <CountBadge count={filters.statuses.length} />}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-64 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ statuses: toggleArray(filters.statuses, opt.value) })}
                  className={cn(
                    togglePillBase,
                    filters.statuses.includes(opt.value) ? togglePillOn : togglePillOff,
                    "flex items-center gap-1.5"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", opt.dotClass)} />
                  {opt.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Construction Status */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, filters.constructionStatuses.length > 0 ? pillActive : pillInactive)}>
              {t('filter.construction')}
              {filters.constructionStatuses.length > 0 && <CountBadge count={filters.constructionStatuses.length} />}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-64 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <div className="flex flex-wrap gap-2">
              {CONSTRUCTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ constructionStatuses: toggleArray(filters.constructionStatuses, opt.value) })}
                  className={cn(togglePillBase, filters.constructionStatuses.includes(opt.value) ? togglePillOn : togglePillOff)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Views */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, filters.views.length > 0 ? pillActive : pillInactive)}>
              <Eye className="w-3.5 h-3.5" />
              {t('filter.views')}
              {filters.views.length > 0 && <CountBadge count={filters.views.length} />}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-80 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <h4 className="text-sm font-bold text-black mb-3">{t('filter.propertyViews')}</h4>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
              {VIEWS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ views: toggleArray(filters.views, opt.value) })}
                  className={cn(togglePillBase, filters.views.includes(opt.value) ? togglePillOn : togglePillOff)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-300 flex-shrink-0" />

        {/* Hide Sold Out */}
        <button
          onClick={() => update({ hideSoldOut: !filters.hideSoldOut })}
          className={cn(
            pillBase, "px-3 py-1.5",
            filters.hideSoldOut
              ? "bg-black text-white border border-black font-bold shadow-sm"
              : "bg-white border border-gray-300 text-gray-600 hover:border-gray-400"
          )}
        >
          {t('filter.hideSold')}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gold/30 flex-shrink-0" />

        {/* Sort pills */}
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update({ sortBy: filters.sortBy === opt.value ? null : opt.value })}
            className={cn(
              pillBase, "px-2.5 py-1.5",
              filters.sortBy === opt.value ? pillActive : pillInactive
            )}
          >
            {opt.value === 'trending' ? <TrendingUp className="w-3.5 h-3.5" /> : opt.label}
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-5 bg-gold/30 flex-shrink-0" />

        {/* Map toggle */}
        <button
          onClick={() => onMapToggle ? onMapToggle(!isMapMode) : navigate('/properties?view=map')}
          className={cn(pillBase, "px-2.5 py-1.5", isMapMode ? pillActive : pillInactive)}
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
            onClick={resetAll}
            className={cn(
              pillBase, "px-2.5 py-1.5",
              "bg-red-500/10 border border-red-400/40 text-red-600 hover:bg-red-500/20"
            )}
          >
            <X className="w-3.5 h-3.5" />
            {t('filter.reset')}
          </button>
        )}

        {/* Live Results Count Badge */}
        {resultsCount !== undefined && (
          <div className="flex-shrink-0 ml-auto sticky right-0 pl-2">
            <div
              key={resultsCount}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all animate-in fade-in zoom-in-95 duration-300",
                "bg-gradient-to-r from-gold/20 to-gold/10 border-2 border-gold/50 text-black shadow-sm"
              )}
            >
              <Activity className="w-3.5 h-3.5 text-gold" />
              <span className="tabular-nums">{resultsCount.toLocaleString()}</span>
              <span className="text-black/60 font-medium">{resultsLabel || 'Results'}</span>
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
        <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-black/70 hover:border-gold/60 flex-shrink-0" title="View saved filters">
          <Bookmark className="w-3.5 h-3.5 text-black fill-black" />
          <span className="hidden sm:inline">{t('filter.savedFilters')}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-3 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-gold/40 z-[10200] shadow-xl"
        side="bottom"
        align="end"
        sideOffset={6}
      >
        <h4 className="text-sm font-bold text-black mb-2">{t('filter.savedFilters')}</h4>
        {savedFilters.length === 0 ? (
          <p className="text-xs text-black/50 py-4 text-center">{t('filter.noSavedFilters')}</p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {savedFilters.map((sf, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-white/60 cursor-pointer transition-colors group"
                onClick={() => applySavedFilter(sf)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-black truncate">{sf.name}</p>
                  <p className="text-[10px] text-black/40">{new Date(sf.createdAt).toLocaleDateString()}</p>
                </div>
                {confirmDeleteIndex === idx ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-red-600 font-semibold whitespace-nowrap">Delete?</span>
                    <button
                      onClick={() => deleteSavedFilter(idx)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeleteIndex(null)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white border border-gold/40 text-black hover:bg-gold/10 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteIndex(idx); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-red-500 transition-all"
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
