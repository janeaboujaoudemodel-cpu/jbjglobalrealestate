/**
 * FilterShortcutBar - Premium connected 2-row filter toolbar
 * Row 1: Search + Map + Saved + Currency + Filter + Mode Investor (connected bar)
 * Row 2: Filter popovers + Sort pills + Hide Sold (last)
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight as ChevronRightIcon, X, Heart, Building2, Bed, Calendar, DollarSign, CreditCard, Activity, Map, Users, Trash2, ArrowUpDown, EyeOff, HardHat, Clock, ArrowUp, ArrowDown, SortAsc, SlidersHorizontal, Check, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { SUPPORTED_CURRENCIES } from "@/components/CurrencySwitcher";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SaveFilterModal from "./SaveFilterModal";
import { CONSTRUCTION_STATUS_OPTIONS } from "@/constants/constructionStatus";
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
};

interface FilterShortcutBarProps {
  variant: 'light' | 'dark';
  filters: ShortcutFilterState;
  onFilterChange: (filters: ShortcutFilterState) => void;
  isMapMode?: boolean;
  onMapToggle?: (active: boolean) => void;
  searchSlot?: React.ReactNode;
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

const FilterShortcutBar = ({ variant, filters, onFilterChange, isMapMode, onMapToggle, searchSlot }: FilterShortcutBarProps) => {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [prevCurrency, setPrevCurrency] = useState<string>('AED');
  const navigate = useNavigate();
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
    filters.constructionStatuses.length > 0;

  const resetAll = () => onFilterChange({ ...defaultShortcutFilters });

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  // Pill styling
  const pillBase = "inline-flex items-center justify-center gap-1.5 px-3.5 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap select-none overflow-hidden text-ellipsis max-w-[200px] flex-shrink-0";
  const pillInactive = isDark
    ? "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
    : "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 text-black hover:border-gold/60";
  const pillActive = isDark
    ? "bg-white text-black border border-white shadow-lg"
    : "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black font-bold shadow-md";

  const popoverClass = "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 z-[10200] shadow-xl";

  const togglePillBase = "px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer";
  const togglePillOff = "border-gold/30 text-black/70 bg-white/60 hover:bg-white";
  const togglePillOn = "border-2 border-gold bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black font-bold";

  const handleSaveFilter = (name: string) => {
    const saved = JSON.parse(localStorage.getItem('jbj-saved-filters') || '[]');
    saved.push({ name, filters, createdAt: new Date().toISOString() });
    localStorage.setItem('jbj-saved-filters', JSON.stringify(saved));
  };

  const CountBadge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="ml-1 w-5 h-5 rounded-full bg-gradient-to-r from-[#D4C4A8] to-[#C8A766] text-white text-[10px] font-bold flex items-center justify-center">
        +{count}
      </span>
    ) : null;

  const getPropertyTypeLabel = () => {
    if (filters.propertyTypes.length === 0) {
      if (filters.propertyCategory === 'residential') return 'Residential';
      if (filters.propertyCategory === 'commercial') return 'Commercial';
      return 'Property Type';
    }
    const first = ALL_PROPERTY_TYPES.find(o => o.value === filters.propertyTypes[0])?.label || '';
    return first;
  };

  // Scroll indicator refs
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const [row1CanScroll, setRow1CanScroll] = useState(false);
  const [row2CanScroll, setRow2CanScroll] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (row1Ref.current) {
        const el = row1Ref.current;
        setRow1CanScroll(el.scrollWidth > el.clientWidth && el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
      }
      if (row2Ref.current) {
        const el = row2Ref.current;
        setRow2CanScroll(el.scrollWidth > el.clientWidth && el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
      }
    };
    checkScroll();
    const r1 = row1Ref.current;
    const r2 = row2Ref.current;
    r1?.addEventListener('scroll', checkScroll, { passive: true });
    r2?.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      r1?.removeEventListener('scroll', checkScroll);
      r2?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scrollRow = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        {/* Row 1: Connected toolbar - Search + Sort Pills + Map + Saved + Currency + Filter + Mode */}
        <div className="relative">
          <div ref={row1Ref} className="flex items-center w-full overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
            <div className="flex items-center w-full min-w-max border border-gold/30 rounded-lg overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
              {/* Search slot or built-in search */}
              {searchSlot ? (
                <div className="min-w-0 max-w-[220px] border-r border-gold/20">
                  {searchSlot}
                </div>
              ) : (
                <div className="min-w-0 max-w-[220px] border-r border-gold/20 flex items-center px-3">
                  <input
                    type="text"
                    value={filters.searchQuery}
                    onChange={(e) => update({ searchQuery: e.target.value })}
                    placeholder="Search..."
                    className="w-full h-full py-2.5 bg-transparent text-xs text-black placeholder:text-black/40 outline-none"
                  />
                </div>
              )}
              {/* Sort pills inline in Row 1 */}
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ sortBy: filters.sortBy === opt.value ? null : opt.value })}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-r border-gold/20",
                    filters.sortBy === opt.value ? "bg-gold/20 text-black font-bold" : "text-black/70 hover:bg-gold/10"
                  )}
                >
                  {opt.value === 'trending' ? <TrendingUp className="w-3.5 h-3.5" /> : opt.label}
                </button>
              ))}
              {/* Map toggle */}
              <button
                onClick={() => onMapToggle ? onMapToggle(!isMapMode) : navigate('/properties?view=map')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-r border-gold/20",
                  isMapMode ? "bg-gold/20 text-black" : "text-black/70 hover:bg-gold/10"
                )}
                title="Map View"
              >
                <Map className="w-3.5 h-3.5" />
                {isMapMode ? 'List' : 'Map'}
              </button>
              {/* Saved */}
              <ConnectedSavedButton variant={variant} onApplySavedFilter={onFilterChange} />
              {/* Currency */}
              <ConnectedCurrencyButton />
              {/* Filter */}
              <button
                onClick={() => setAdvancedOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-r border-gold/20 text-black/70 hover:bg-gold/10"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filter
              </button>
              {/* Mode Investor - compact, no stretch */}
              <ConnectedModeButton />
              {/* Spacer to fill remaining width on desktop */}
              <div className="flex-1 min-w-0" />
            </div>
          </div>
          {/* Scroll indicator arrow for Row 1 */}
          {row1CanScroll && (
            <button 
              onClick={() => scrollRow(row1Ref)}
              className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gradient-to-l from-[#EDE4D3] via-[#EDE4D3]/95 to-transparent pointer-events-auto z-10"
            >
              <span className="w-7 h-7 rounded-full bg-gold flex items-center justify-center shadow-lg">
                <ChevronRightIcon className="w-4 h-4 text-black" />
              </span>
            </button>
          )}
        </div>

        {/* Row 2: Filter popovers + Sort pills */}
        <div className="relative">
          <div ref={row2Ref} className="flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-1 -mb-1 w-full" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
        {/* Price */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, (filters.priceMin || filters.priceMax) ? pillActive : pillInactive)}>
              Price
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-80 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <Tabs value={filters.priceMode} onValueChange={handlePriceModeChange}>
              <TabsList className="w-full mb-3 bg-white/60">
                <TabsTrigger value="unit" className="flex-1 text-xs">Per unit</TabsTrigger>
                <TabsTrigger value="sqft" className="flex-1 text-xs">Per sqft</TabsTrigger>
                <TabsTrigger value="sqm" className="flex-1 text-xs">Per sqm</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] font-semibold text-black/50 uppercase mb-1 block">Min Price</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.priceMin}
                    onChange={(e) => update({ priceMin: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="0"
                    className="w-full h-9 px-3 pr-12 bg-white border border-gold/30 rounded-lg text-sm text-black"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-black/40 font-medium">AED</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-black/50 uppercase mb-1 block">Max Price</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.priceMax}
                    onChange={(e) => update({ priceMax: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="Any"
                    className="w-full h-9 px-3 pr-12 bg-white border border-gold/30 rounded-lg text-sm text-black"
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
                      ? "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black font-bold"
                      : "bg-white/80 text-black border-gold/30 hover:border-gold"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Button
              onClick={() => {}}
              className="w-full h-9 bg-gradient-to-r from-gold to-gold-dark text-black font-bold text-xs rounded-lg hover:brightness-110"
            >
              Apply filter
            </Button>
          </PopoverContent>
        </Popover>

        {/* Payments */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, (filters.paymentPlanMax < 100 || filters.postHandoverOnly) ? pillActive : pillInactive)}>
              Payments
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-80 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <h4 className="text-sm font-bold text-black mb-3">Projects payment plan</h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-black/60">Maximum pre-handover</span>
                  <span className="text-xs font-bold text-black bg-white/80 px-2 py-0.5 rounded border border-gold/30">{filters.paymentPlanMax}%</span>
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
                <label className="text-xs text-black/60 mb-1 block">After handover (%)</label>
                <input
                  type="text"
                  value={filters.afterHandover}
                  onChange={(e) => update({ afterHandover: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="e.g. 30"
                  className="w-full h-9 px-3 bg-white border border-gold/30 rounded-lg text-sm text-black"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-black/70">Post handover plans only</span>
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
              Handover
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-80 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <h4 className="text-sm font-bold text-black mb-3">Project handover by</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-black/50 uppercase mb-1 block">From</label>
                <div className="flex gap-2">
                  <select
                    value={filters.handoverFrom.quarter}
                    onChange={(e) => update({ handoverFrom: { ...filters.handoverFrom, quarter: e.target.value } })}
                    className="min-w-[52px] flex-1 h-9 px-2 bg-white border border-gold/30 rounded text-sm text-black font-medium"
                  >
                    {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                  <select
                    value={filters.handoverFrom.year}
                    onChange={(e) => update({ handoverFrom: { ...filters.handoverFrom, year: e.target.value } })}
                    className="min-w-[80px] flex-1 h-9 px-2 bg-white border border-gold/30 rounded text-sm text-black font-medium"
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-black/50 uppercase mb-1 block">To</label>
                <div className="flex gap-2">
                  <select
                    value={filters.handoverTo.quarter}
                    onChange={(e) => update({ handoverTo: { ...filters.handoverTo, quarter: e.target.value } })}
                    className="min-w-[52px] flex-1 h-9 px-2 bg-white border border-gold/30 rounded text-sm text-black font-medium"
                  >
                    {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                  <select
                    value={filters.handoverTo.year}
                    onChange={(e) => update({ handoverTo: { ...filters.handoverTo, year: e.target.value } })}
                    className="min-w-[80px] flex-1 h-9 px-2 bg-white border border-gold/30 rounded text-sm text-black font-medium"
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
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
                <TabsTrigger value="residential" className="flex-1 text-xs">Residential</TabsTrigger>
                <TabsTrigger value="commercial" className="flex-1 text-xs">Commercial</TabsTrigger>
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
              Bedrooms
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
              Status
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
              Construction
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

        {/* Divider */}
        <div className="w-px h-6 bg-gold/30 flex-shrink-0" />

        {/* Hide Sold Out - LAST */}
        <button
          onClick={() => update({ hideSoldOut: !filters.hideSoldOut })}
          className={cn(
            pillBase, "px-3 py-1.5",
            filters.hideSoldOut
              ? "bg-red-50 border-2 border-red-500 text-red-600 font-bold shadow-md"
              : "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-red-300/50 text-red-600/80 hover:border-red-400"
          )}
        >
          Hide Sold
        </button>

        {/* Reset All */}
        {hasActiveFilters && (
          <button
            onClick={resetAll}
            className={cn(
              pillBase,
              "bg-red-500/10 border border-red-400/40 text-red-600 hover:bg-red-500/20"
            )}
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}

        </div>
          {/* Scroll indicator arrow for Row 2 */}
          {row2CanScroll && (
            <button 
              onClick={() => scrollRow(row2Ref)}
              className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gradient-to-l from-[#EDE4D3] via-[#EDE4D3]/95 to-transparent pointer-events-auto z-10"
            >
              <span className="w-7 h-7 rounded-full bg-gold flex items-center justify-center shadow-lg">
                <ChevronRightIcon className="w-4 h-4 text-black" />
              </span>
            </button>
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

const CURRENCY_KEY = 'jj_currency';

function ConnectedCurrencyButton() {
  const [currency, setCurrencyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CURRENCY_KEY) || 'AED';
    }
    return 'AED';
  });
  const [open, setOpen] = useState(false);

  const setCurrency = (code: string) => {
    setCurrencyState(code);
    localStorage.setItem(CURRENCY_KEY, code);
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: code }));
    setOpen(false);
  };

  const currentCurrency = SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-r border-gold/20 text-black/70 hover:bg-gold/10">
          <span>{currentCurrency.flag}</span>
          <span>{currentCurrency.code}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[10200] min-w-[280px] rounded-xl shadow-2xl p-0 border-2 border-gold/40"
        style={{ background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)' }}
        align="end"
        sideOffset={12}
      >
        <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
        <div className="px-4 py-3 border-b border-gold/20">
          <p className="text-xs font-semibold text-black/60 uppercase tracking-wider">Select Currency</p>
        </div>
        <div className="p-2 max-h-80 overflow-y-auto">
          {SUPPORTED_CURRENCIES.map((curr) => (
            <button
              key={curr.code}
              onClick={() => setCurrency(curr.code)}
              className={cn(
                "w-full flex items-center justify-between cursor-pointer rounded-lg px-4 py-3 my-0.5 transition-colors",
                currency === curr.code
                  ? 'bg-gold/15 border border-gold/30'
                  : 'hover:bg-[#F5EBD7]'
              )}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{curr.flag}</span>
                <span className={cn("text-sm font-semibold", currency === curr.code ? 'text-gold' : 'text-black')}>{curr.name}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-black/50 text-sm">{curr.symbol}</span>
                {currency === curr.code && <Check className="w-4 h-4 text-gold" />}
              </span>
            </button>
          ))}
        </div>
        <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
      </PopoverContent>
    </Popover>
  );
}

interface SavedFilter {
  name: string;
  filters: ShortcutFilterState;
  createdAt: string;
}

function ConnectedSavedButton({ variant, onApplySavedFilter }: { variant: 'light' | 'dark'; onApplySavedFilter: (filters: ShortcutFilterState) => void }) {
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
        <button className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-r border-gold/20 text-black/70 hover:bg-gold/10" title="Saved Filters">
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          <span className="hidden sm:inline">Saved</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-3 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 z-[10200] shadow-xl"
        side="bottom"
        align="end"
        sideOffset={6}
      >
        <h4 className="text-sm font-bold text-black mb-2">Saved Filters</h4>
        {savedFilters.length === 0 ? (
          <p className="text-xs text-black/50 py-4 text-center">No saved filters yet</p>
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

function ConnectedModeButton() {
  const { mode, setMode } = useUserModeContext();
  const [modeOpen, setModeOpen] = useState(false);
  const modeLabel = mode === 'broker' ? 'Broker' : mode === 'investor_broker' ? 'Both' : 'Investor';

  const MODE_OPTIONS: { value: typeof mode; label: string }[] = [
    { value: 'investor', label: 'Investor' },
    { value: 'broker', label: 'Broker' },
    { value: 'investor_broker', label: 'Both' },
  ];

  return (
    <Popover open={modeOpen} onOpenChange={setModeOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors text-black/70 hover:bg-gold/10 flex-shrink-0 max-w-fit" title="Switch Mode">
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mode: {modeLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-44 p-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 z-[10200] shadow-xl"
        side="bottom"
        align="end"
        sideOffset={6}
      >
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setMode(opt.value); setModeOpen(false); }}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors",
              mode === opt.value
                ? "bg-gold/20 text-gold border border-gold/40"
                : "text-black/80 hover:bg-white/60"
            )}
          >
            {opt.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export default FilterShortcutBar;
