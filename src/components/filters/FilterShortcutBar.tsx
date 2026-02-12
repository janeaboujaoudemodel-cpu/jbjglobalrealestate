/**
 * FilterShortcutBar - Reelly-style pill filter buttons with popovers
 * Supports 'light' (Properties page) and 'dark' (Hero) variants
 */
import { useState, useCallback, useEffect } from "react";
import { ChevronDown, X, Heart, Building2, Bed, Calendar, DollarSign, CreditCard, Activity, Map, Users, Trash2, ArrowUpDown, EyeOff, HardHat, Clock, ArrowUp, ArrowDown, SortAsc } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserModeContext } from "@/contexts/UserModeContext";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SaveFilterModal from "./SaveFilterModal";
import { CONSTRUCTION_STATUS_OPTIONS } from "@/constants/constructionStatus";

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
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'alpha' | null;
  hideSoldOut: boolean;
  constructionStatuses: string[];
}

export const defaultShortcutFilters: ShortcutFilterState = {
  priceMode: 'unit',
  priceMin: '',
  priceMax: '',
  paymentPlanMax: 100,
  afterHandover: '',
  postHandoverOnly: false,
  handoverFrom: { quarter: 'Q1', year: '2025' },
  handoverTo: { quarter: 'Q4', year: '2028' },
  propertyCategory: null,
  propertyTypes: [],
  bedrooms: [],
  statuses: [],
  sortBy: null,
  hideSoldOut: false,
  constructionStatuses: [],
};

interface FilterShortcutBarProps {
  variant: 'light' | 'dark';
  filters: ShortcutFilterState;
  onFilterChange: (filters: ShortcutFilterState) => void;
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
  { value: 'Sold Out', label: 'Out of Stock', dotClass: 'bg-zinc-400' },
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
];

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const YEARS = ['2025', '2026', '2027', '2028', '2029', '2030'];

const FilterShortcutBar = ({ variant, filters, onFilterChange }: FilterShortcutBarProps) => {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const isDark = variant === 'dark';

  const update = useCallback((partial: Partial<ShortcutFilterState>) => {
    onFilterChange({ ...filters, ...partial });
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
  const pillBase = "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap select-none";
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

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        {/* Row 1: Utility buttons left, Sort/Toggle shortcuts right */}
        <div className="flex items-center justify-between w-full gap-2">
          <UtilityButtons variant={variant} onApplySavedFilter={onFilterChange} />
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {/* Sort pills (radio-style) */}
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update({ sortBy: filters.sortBy === opt.value ? null : opt.value })}
                className={cn(pillBase, "px-3 py-1.5", filters.sortBy === opt.value ? pillActive : pillInactive)}
              >
                {opt.label}
              </button>
            ))}

            {/* Hide Sold Out */}
            <button
              onClick={() => update({ hideSoldOut: !filters.hideSoldOut })}
              className={cn(pillBase, "px-3 py-1.5", filters.hideSoldOut ? pillActive : pillInactive)}
            >
              <EyeOff className="w-3.5 h-3.5" />
              Hide Sold
            </button>

            {/* Save Filter */}
            <button
              onClick={() => setSaveModalOpen(true)}
              className={cn(pillBase, "px-3 py-1.5", pillInactive)}
            >
              <Heart className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>

        {/* Row 2: Core filter popovers */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
        {/* Price */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(pillBase, (filters.priceMin || filters.priceMax) ? pillActive : pillInactive)}>
              <DollarSign className="w-3.5 h-3.5" />
              Price
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className={cn("w-80 p-4", popoverClass)} side="bottom" align="start" sideOffset={6}>
            <Tabs value={filters.priceMode} onValueChange={(v) => update({ priceMode: v as any })}>
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
              <CreditCard className="w-3.5 h-3.5" />
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
              <Calendar className="w-3.5 h-3.5" />
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
              <Building2 className="w-3.5 h-3.5" />
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
              <Bed className="w-3.5 h-3.5" />
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
              <Activity className="w-3.5 h-3.5" />
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
              <HardHat className="w-3.5 h-3.5" />
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
            Reset All
          </button>
        )}

        </div>
      </div>

      <SaveFilterModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        onSave={handleSaveFilter}
      />
    </>
  );
};

/* ---- Reelly-style corner utility buttons ---- */
interface SavedFilter {
  name: string;
  filters: ShortcutFilterState;
  createdAt: string;
}

function UtilityButtons({ variant, onApplySavedFilter }: { variant: 'light' | 'dark'; onApplySavedFilter: (filters: ShortcutFilterState) => void }) {
  const navigate = useNavigate();
  const { mode, setMode } = useUserModeContext();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);

  const isDark = variant === 'dark';
  const btnBase = cn(
    "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap select-none",
    isDark
      ? "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
      : "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 text-black hover:border-gold/60"
  );

  const toggleMode = () => {
    const next = mode === 'investor' ? 'broker' : 'investor';
    setMode(next);
  };

  const modeLabel = mode === 'broker' ? 'Broker' : mode === 'investor_broker' ? 'Both' : 'Investor';

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
  };

  const applySavedFilter = (filter: SavedFilter) => {
    onApplySavedFilter(filter.filters);
    setSavedOpen(false);
  };

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <button onClick={() => navigate('/properties?view=map')} className={btnBase} title="Map View">
        <Map className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Map</span>
      </button>

      {/* Saved Filters Popover */}
      <Popover open={savedOpen} onOpenChange={setSavedOpen}>
        <PopoverTrigger asChild>
          <button className={btnBase} title="Saved Filters">
            <Heart className="w-3.5 h-3.5" />
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
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSavedFilter(idx); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>

      <CurrencySwitcher variant="icon-only" />

      <button onClick={toggleMode} className={btnBase} title="Client Mode">
        <Users className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Mode: {modeLabel}</span>
      </button>
    </div>
  );
}

export default FilterShortcutBar;
