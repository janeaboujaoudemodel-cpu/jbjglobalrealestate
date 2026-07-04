/**
 * AdvancedFilterPanel - Centered dialog with all filter sections, developer logos, UAE-only locations
 */
import { useState, useEffect, useCallback, forwardRef, type CSSProperties } from "react";
import { X, Search, Heart, Check, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { EMIRATES_OPTIONS, VIEWS_OPTIONS } from "@/constants/filterConfig";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { getDeveloperLogoUrl } from "@/utils/developerLogo";
import type { ShortcutFilterState } from "./FilterShortcutBar";
import { defaultShortcutFilters } from "./FilterShortcutBar";
import {
  filterInput,
  filterLabel,
  filterPrimaryButton,
  filterSecondaryButton,
} from "./filterStyles";
import { applyShortcutFilters } from "@/utils/applyShortcutFilters";

interface AdvancedFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ShortcutFilterState;
  onFilterChange: (filters: ShortcutFilterState) => void;
  anchorRect?: DOMRect | null;
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const YEARS = ['2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'];

const STATUS_OPTIONS = [
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

const UNIT_TYPE_OPTIONS = [
  { value: 'apartments', label: 'Apartments' },
  { value: 'villa', label: 'Villa' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'penthouse', label: 'Penthouse' },
];

const BEDROOM_OPTIONS = [
  { value: 'studio', label: 'Studio' },
  { value: '1', label: '1 BR' },
  { value: '2', label: '2 BR' },
  { value: '3', label: '3 BR' },
  { value: '4', label: '4 BR' },
  { value: '5+', label: '5+ BR' },
];

// UAE-only emirates
const UAE_EMIRATES = EMIRATES_OPTIONS.filter(e => e.country === 'UAE');

// Premium UAE developers — surfaced first in the By Developer dropdown.
const PREMIUM_UAE_DEVELOPERS = [
  'emaar', 'damac', 'sobha', 'nakheel', 'aldar', 'meraas', 'dubai properties',
  'select group', 'majid al futtaim', 'ellington', 'omniyat', 'bloom holding',
  'mag', 'azizi', 'dar al arkan', 'binghatti', 'arada', 'object 1',
];
const premiumRank = (name: string) => {
  const n = name.toLowerCase();
  const idx = PREMIUM_UAE_DEVELOPERS.findIndex((p) => n.includes(p));
  return idx === -1 ? 999 : idx;
};
const canonicalDeveloperKey = (name: string) => {
  const n = name.toLowerCase();
  const premium = PREMIUM_UAE_DEVELOPERS.find((p) => n.includes(p));
  if (premium) return premium.replace(/[^a-z0-9]/g, '');
  return n
    .replace(/\b(properties|property|realty|real estate|developers?|developments?|holding|holdings|group|llc|pjsc|psc)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
};
const FORBIDDEN_DEVELOPER_NAME = /\b(bayut|dubizzle|property\s*finder)\b/i;

// Short label — drops generic legal/suffix words so "Damac Properties" → "Damac",
// "Arada Properties" → "Arada", "Ellington Properties" → "Ellington", etc.
const DEV_SUFFIX = /\b(developments?|developers?|properties|property|realty|real\s*estate|holdings?|holding|group|llc|fz-?llc|pjsc|psc|inc|co|company|international|investments?)\b/gi;
const shortDeveloperName = (raw: string) => {
  const cleaned = (raw || '').replace(DEV_SUFFIX, '').replace(/\s{2,}/g, ' ').trim();
  return cleaned || (raw || '').split(/\s+/)[0] || raw || '';
};


interface DeveloperEntry {
  name: string;
  logo_url: string | null;
  slug?: string | null;
}

interface AreaEntry {
  name: string;
  emirate: string;
}

const AdvancedFilterPanel = forwardRef<HTMLDivElement, AdvancedFilterPanelProps>(function AdvancedFilterPanel({ open, onOpenChange, filters, onFilterChange, anchorRect = null }, _ref) {
  const [localFilters, setLocalFilters] = useState<ShortcutFilterState>(filters);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [countRows, setCountRows] = useState<Record<string, unknown>[]>([]);
  const [developers, setDevelopers] = useState<DeveloperEntry[]>([]);
  const [allAreas, setAllAreas] = useState<AreaEntry[]>([]);
  const [devSearch, setDevSearch] = useState('');
  const [emirateSearch, setEmirateSearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [emiratesOpen, setEmiratesOpen] = useState(false);
  const [devsOpen, setDevsOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [contentReady, setContentReady] = useState(false);

  // Sync local filters when panel opens
  useEffect(() => {
    if (open) setLocalFilters(filters);
  }, [open, filters]);

  // Open the panel shell immediately, then mount the heavier controls on the
  // next tick so the header button click is never blocked by filter rendering.
  useEffect(() => {
    if (!open) {
      setContentReady(false);
      return;
    }
    setContentReady(false);
    const timer = window.setTimeout(() => setContentReady(true), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Fetch canonical developer identities only. Logos must come from developers.logo_url;
  // project photos or generated initials are never used as logo fallbacks.
  useEffect(() => {
    if (!open || !contentReady) return;
    supabase
      .from('developers')
      .select('name, slug, logo_url')
      .order('name')
      .then(({ data }) => {
        if (data) {
          const byName = new Map<string, DeveloperEntry>();
          for (const d of data) {
            const name = String(d.name || '').trim();
            if (!name) continue;
            if (FORBIDDEN_DEVELOPER_NAME.test(name)) continue;
            const logo = getDeveloperLogoUrl(d);
            const key = canonicalDeveloperKey(name);
            const existing = byName.get(key);
            // Prefer an entry that HAS a logo over one without; otherwise prefer premium-ranked names.
            if (
              !existing ||
              (!existing.logo_url && logo) ||
              (((!existing.logo_url) === (!logo)) && premiumRank(name) < premiumRank(existing.name))
            ) {
              byName.set(key, { name, slug: d.slug, logo_url: logo });
            }
          }
          setDevelopers(Array.from(byName.values()));
        }
      });
  }, [open, contentReady]);

  // Fetch all active areas grouped by emirate
  useEffect(() => {
    if (!open || !contentReady) return;
    supabase
      .from('areas')
      .select('name, emirate')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data) setAllAreas(data as AreaEntry[]);
      });
  }, [open, contentReady]);

  // Fetch one lightweight listing snapshot for instant, accurate local counts.
  // This avoids a backend round-trip on every chip/slider click and lets views,
  // handover range, post-handover and local search all affect the visible count.
  useEffect(() => {
    if (!open || !contentReady) return;
    let cancelled = false;
    supabase
      .from('projects')
      .select('id,name,description,price_from,bedrooms_min,bedrooms_max,size_min,size_max,handover_date,payment_plan,status,construction_status,availability_status,property_type_label,status_label,sale_status,emirate,area_name,developer_name,views,down_payment_percent,expected_completion')
      .eq('is_published', true)
      .or('listing_kind.is.null,listing_kind.neq.leasing')
      .limit(1500)
      .then(({ data }) => {
        if (!cancelled) setCountRows((data || []) as Record<string, unknown>[]);
      });
    return () => { cancelled = true; };
  }, [open, contentReady]);

  // Live count with a short debounce — computed locally for immediate feedback.
  useEffect(() => {
    if (!open || !contentReady) return;
    const timer = setTimeout(async () => {
      try {
        if (countRows.length === 0) return;
        setProjectCount(applyShortcutFilters(countRows, localFilters).length);
      } catch {
        setProjectCount(null);
      }
    }, 90);
    return () => clearTimeout(timer);
  }, [open, contentReady, localFilters, countRows]);

  const update = useCallback((partial: Partial<ShortcutFilterState>) => {
    setLocalFilters(prev => ({ ...prev, ...partial }));
  }, []);

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const handleApply = () => {
    onFilterChange(localFilters);
    onOpenChange(false);
  };

  const handleClearAll = () => {
    setLocalFilters({ ...defaultShortcutFilters });
  };

  // Tokens — selected state uses the locked Emerald system (white text/icons via global guard).
  const togglePillBase =
    "px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--emerald-1)] focus-visible:ring-offset-1 focus-visible:ring-offset-[#FDFBF7]";
  const togglePillOff =
    "border-[#B89555]/45 text-[#1A1A1A] bg-white hover:border-[#064E3B]/55 hover:bg-[#064E3B]/6";
  const togglePillOn =
    "allow-white jj-pill-emerald-metallic text-white border-0 font-bold";
  const sectionTitle = "text-sm font-bold text-[#1A1A1A] mb-3 tracking-tight";
  const inputClass = `${filterInput} h-10 rounded-xl font-medium`;
  const dropdownPanel =
    "mt-2 rounded-xl border border-[#B89555]/45 bg-white p-3 shadow-[0_14px_35px_-24px_rgba(26,26,26,0.35)]";
  const optionRow =
    "group flex items-center gap-3 w-full min-h-11 rounded-md px-3 py-2 text-left transition-none hover:bg-[#064E3B] focus:bg-[#064E3B] overflow-visible text-[#1A1A1A] hover:text-white focus:text-white data-[state=active]:bg-[#064E3B] data-[state=active]:text-white";
  const selectedBox = "allow-white jj-pill-emerald-metallic border-0";

  // Filter panel is always CENTERED on screen (user requested — do not anchor to trigger).
  const centeredPanelStyle = {
    ['--slider-track-bg' as any]: 'rgba(6,78,59,0.14)',
    ['--slider-range-bg' as any]: 'var(--jj-emerald-ombre)',
    ['--slider-thumb-bg' as any]: '#FFFFFF',
    ['--slider-thumb-shadow' as any]: '0 2px 10px rgba(6,78,59,0.45), 0 0 0 2px #064E3B inset',
  } as CSSProperties;


  const filteredEmirates = UAE_EMIRATES.filter(e =>
    !emirateSearch || e.label.toLowerCase().includes(emirateSearch.toLowerCase())
  );

  const filteredDevs = developers
    .filter(d => !devSearch || d.name.toLowerCase().includes(devSearch.toLowerCase()))
    .sort((a, b) => {
      const ra = premiumRank(a.name);
      const rb = premiumRank(b.name);
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });


  // Filter areas by search, then group by emirate
  const filteredAreasList = allAreas.filter(a =>
    !areaSearch || a.name.toLowerCase().includes(areaSearch.toLowerCase()) || a.emirate.toLowerCase().includes(areaSearch.toLowerCase())
  );
  const areasGroupedByEmirate = filteredAreasList.reduce<Record<string, string[]>>((acc, a) => {
    const em = a.emirate || 'Other';
    if (!acc[em]) acc[em] = [];
    acc[em].push(a.name);
    return acc;
  }, {});

  return (
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-advanced-filter-panel="true"
        data-filter-clean="true"
        className="max-w-3xl w-[calc(100vw-3rem)] max-h-[calc(100dvh-4rem)] p-0 bg-gradient-to-b from-[#FDFBF7] via-[#F7F2EA] to-[#F2EBDC] border border-[#B89555]/55 text-[#1A1A1A] flex flex-col overflow-hidden shadow-[0_25px_80px_-12px_rgba(0,0,0,0.20),0_0_0_1px_rgba(184,149,85,0.18)] duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none"
        style={centeredPanelStyle}
      >


        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#B89555]/40 flex-shrink-0 bg-white/40">

          <div className="flex items-center justify-between mb-3">
            <div>
              <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">New Off Plan Projects</DialogTitle>
              {projectCount !== null ? (
                <span className="text-sm font-bold text-[#1A1A1A]/70">
                  {projectCount.toLocaleString()} live projects
                </span>
              ) : (
                <span className="text-sm text-[#1A1A1A]/70">Loading...</span>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]" />
            <input
              type="text"
              value={localFilters.searchQuery}
              onChange={(e) => update({ searchQuery: e.target.value })}
              placeholder="Type a project, developer or district"
              className={cn(inputClass, "pl-9")}
            />
          </div>
        </div>

        {contentReady ? (
        <>
        {/* Scrollable body */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-6">
            {/* Location - UAE Only */}
            <section>
              <h4 className={sectionTitle}>Location</h4>
              <button
                onClick={() => { setEmiratesOpen(!emiratesOpen); setAreasOpen(false); setDevsOpen(false); }}
                className={cn(inputClass, "flex items-center justify-between cursor-pointer text-left")}
              >
                <span className="text-[#1A1A1A]">
                  {localFilters.emirates.length === 0 ? "All Emirates" : `${localFilters.emirates.length} selected`}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-[#1A1A1A] transition-transform", emiratesOpen && "rotate-180")} />
              </button>
              {emiratesOpen && (
                <div className={dropdownPanel}>
                  <input
                    type="text"
                    value={emirateSearch}
                    onChange={(e) => setEmirateSearch(e.target.value)}
                    placeholder="Search emirate..."
                    className={cn(inputClass, "mb-2 h-9 text-xs")}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1">
                    {filteredEmirates.map((em) => {
                      const isSelected = localFilters.emirates.includes(em.value);
                      return (
                        <button
                          key={em.value}
                          data-filter-option-row="true"
                          onClick={() => update({ emirates: toggleArray(localFilters.emirates, em.value) })}
                          className={optionRow}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                            isSelected ? selectedBox : "border-[#B89555]/60 bg-white"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-sm text-[#1A1A1A] group-hover:text-white group-focus:text-white">{em.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* By Area */}
            <section>
              <h4 className={sectionTitle}>By Area</h4>
              <button
                onClick={() => { setAreasOpen(!areasOpen); setEmiratesOpen(false); setDevsOpen(false); }}
                className={cn(inputClass, "flex items-center justify-between cursor-pointer text-left")}
              >
                <span className="text-[#1A1A1A]">
                  {!localFilters.areas || localFilters.areas.length === 0
                    ? "All Areas"
                    : `${localFilters.areas.length} area${localFilters.areas.length > 1 ? 's' : ''} selected`}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-[#1A1A1A] transition-transform", areasOpen && "rotate-180")} />
              </button>
              {areasOpen && (
                <div className={dropdownPanel}>
                  <input
                    type="text"
                    value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                    placeholder="Search area or emirate..."
                    className={cn(inputClass, "mb-2 h-9 text-xs")}
                  />
                  {allAreas.length === 0 ? (
                    <div className="py-4 text-center text-xs text-[#1A1A1A]/70">Loading areas...</div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {Object.entries(areasGroupedByEmirate).sort(([a], [b]) => a.localeCompare(b)).map(([emirate, areaNames]) => (
                        <div key={emirate}>
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider">{emirate}</span>
                            <div className="flex-1 h-px bg-[#B89555]/30" />
                            <span className="text-[10px] text-[#1A1A1A]/70 font-semibold">{areaNames.length}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {areaNames.map(areaName => {
                              const isSelected = (localFilters.areas || []).includes(areaName);
                              return (
                                <button
                                  key={areaName}
                                  data-filter-option-row="true"
                                  onClick={() => update({ areas: toggleArray(localFilters.areas || [], areaName) })}
                                  className={optionRow}
                                >
                                  <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                                     isSelected ? selectedBox : "border-[#B89555]/60 bg-white"
                                  )}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <span className="text-sm text-[#1A1A1A] group-hover:text-white group-focus:text-white text-left">{areaName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* By Developer */}
            <section>
              <h4 className={sectionTitle}>By Developer</h4>
              <button
                onClick={() => { setDevsOpen(!devsOpen); setEmiratesOpen(false); setAreasOpen(false); }}
                className={cn(inputClass, "flex items-center justify-between cursor-pointer text-left")}
              >
                <span className="text-[#1A1A1A]">
                  {localFilters.developers.length === 0 ? "All Developers" : `${localFilters.developers.length} selected`}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-[#1A1A1A] transition-transform", devsOpen && "rotate-180")} />
              </button>
              {devsOpen && (
                <div className={dropdownPanel}>
                  <input
                    type="text"
                    value={devSearch}
                    onChange={(e) => setDevSearch(e.target.value)}
                    placeholder="Search developer..."
                    className={cn(inputClass, "mb-2 h-9 text-xs")}
                  />
                  <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto pr-1">
                    {filteredDevs.map((dev) => {
                      const isSelected = localFilters.developers.includes(dev.name);
                      return (
                        <button
                          key={dev.name}
                          data-developer-option
                          data-filter-option-row="true"
                          onClick={() => update({ developers: toggleArray(localFilters.developers, dev.name) })}
                          className={optionRow}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                              isSelected ? selectedBox : "border-[#B89555]/60 bg-white"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <DeveloperLogo
                            src={dev.logo_url}
                            alt={dev.name}
                            name={dev.name}
                            variant="bare"
                            className="!w-12 !h-12 !rounded-lg !p-[3px] flex-shrink-0"
                            renderFallback
                          />
                          <span data-developer-name className="text-sm leading-snug text-[#1A1A1A] group-hover:text-white group-focus:text-white text-left whitespace-normal break-words [overflow-wrap:anywhere] flex-1 min-w-0 overflow-visible" title={dev.name}>
                            {dev.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Payment Plan */}
            <section>
              <h4 className={sectionTitle}>Projects Payment Plan</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#1A1A1A] font-semibold">Maximum pre-handover</span>
                  <span className="text-xs font-bold text-[#1A1A1A] bg-white px-2 py-0.5 rounded border border-[#B89555]/45">
                    {localFilters.paymentPlanMax}%
                  </span>
                </div>
                <Slider
                  value={[localFilters.paymentPlanMax]}
                  onValueChange={(v) => update({ paymentPlanMax: v[0] })}
                  min={0}
                  max={100}
                  step={5}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#1A1A1A] font-semibold">Post handover plans only</span>
                  <Switch
                    checked={localFilters.postHandoverOnly}
                    onCheckedChange={(v) => update({ postHandoverOnly: v })}
                  />
                </div>
              </div>
            </section>

            {/* Property Price */}
            <section>
              <h4 className={sectionTitle}>Property Price</h4>
              <Tabs value={localFilters.priceMode} onValueChange={(v) => update({ priceMode: v as any })}>
                <TabsList className="w-full mb-3 bg-white border border-[#B89555]/35">
                  <TabsTrigger data-filter-price-mode data-surface={localFilters.priceMode === 'unit' ? 'emerald' : undefined} value="unit" className="flex-1 text-xs text-[#1A1A1A] data-[state=active]:jj-pill-emerald-metallic data-[state=active]:text-white">Per unit</TabsTrigger>
                  <TabsTrigger data-filter-price-mode data-surface={localFilters.priceMode === 'sqft' ? 'emerald' : undefined} value="sqft" className="flex-1 text-xs text-[#1A1A1A] data-[state=active]:jj-pill-emerald-metallic data-[state=active]:text-white">Per sqft</TabsTrigger>
                  <TabsTrigger data-filter-price-mode data-surface={localFilters.priceMode === 'sqm' ? 'emerald' : undefined} value="sqm" className="flex-1 text-xs text-[#1A1A1A] data-[state=active]:jj-pill-emerald-metallic data-[state=active]:text-white">Per sqm</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={filterLabel}>Min Price</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={localFilters.priceMin}
                      onChange={(e) => update({ priceMin: e.target.value.replace(/[^0-9]/g, '') })}
                      placeholder="0"
                      className={cn(inputClass, "h-9 pr-12")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#1A1A1A]/70 font-bold">AED</span>
                  </div>
                </div>
                <div>
                  <label className={filterLabel}>Max Price</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={localFilters.priceMax}
                      onChange={(e) => update({ priceMax: e.target.value.replace(/[^0-9]/g, '') })}
                      placeholder="Any"
                      className={cn(inputClass, "h-9 pr-12")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#1A1A1A]/70 font-bold">AED</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Property Size */}
            <section>
              <h4 className={sectionTitle}>Property Size</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={filterLabel}>Min sqft</label>
                  <input
                    type="text"
                    value={localFilters.sizeMin}
                    onChange={(e) => update({ sizeMin: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="0"
                    className={cn(inputClass, "h-9")}
                  />
                </div>
                <div>
                  <label className={filterLabel}>Max sqft</label>
                  <input
                    type="text"
                    value={localFilters.sizeMax}
                    onChange={(e) => update({ sizeMax: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="Any"
                    className={cn(inputClass, "h-9")}
                  />
                </div>
              </div>
            </section>

            {/* Development Status */}
            <section>
              <h4 className={sectionTitle}>Development Status</h4>
              <div className="flex flex-wrap gap-2">
                {CONSTRUCTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update({ constructionStatuses: toggleArray(localFilters.constructionStatuses, opt.value) })}
                            data-filter-selected={localFilters.constructionStatuses.includes(opt.value) ? "true" : undefined}
                    className={cn(togglePillBase, localFilters.constructionStatuses.includes(opt.value) ? togglePillOn : togglePillOff)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Unit Type */}
            <section>
              <h4 className={sectionTitle}>Unit Type</h4>
              <div className="flex flex-wrap gap-2">
                {UNIT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update({ propertyTypes: toggleArray(localFilters.propertyTypes, opt.value) })}
                            data-filter-selected={localFilters.propertyTypes.includes(opt.value) ? "true" : undefined}
                    className={cn(togglePillBase, localFilters.propertyTypes.includes(opt.value) ? togglePillOn : togglePillOff)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Bedrooms */}
            <section>
              <h4 className={sectionTitle}>Bedrooms</h4>
              <div className="flex flex-wrap gap-2">
                {BEDROOM_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update({ bedrooms: toggleArray(localFilters.bedrooms, opt.value) })}
                            data-filter-selected={localFilters.bedrooms.includes(opt.value) ? "true" : undefined}
                    className={cn(togglePillBase, localFilters.bedrooms.includes(opt.value) ? togglePillOn : togglePillOff)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Sales Status */}
            <section>
              <h4 className={sectionTitle}>Sales Status</h4>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update({ statuses: toggleArray(localFilters.statuses, opt.value) })}
                            data-filter-selected={localFilters.statuses.includes(opt.value) ? "true" : undefined}
                    className={cn(
                      togglePillBase,
                      localFilters.statuses.includes(opt.value) ? togglePillOn : togglePillOff,
                      "flex items-center gap-1.5"
                    )}
                  >
                    <span className={cn("w-2.5 h-2.5 rounded-full", opt.dotClass)} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Project Handover By */}
            <section>
              <h4 className={sectionTitle}>Project Handover By</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${filterLabel} mb-2`}>From</label>
                  <div className="flex gap-1 mb-2">
                    {QUARTERS.map(q => (
                      <button
                        key={q}
                        onClick={() => update({ handoverFrom: { ...localFilters.handoverFrom, quarter: q } })}
                        className={cn(
                          "flex-1 h-8 rounded-lg text-xs font-bold transition-all text-center",
                          localFilters.handoverFrom.quarter === q
                            ? "allow-white jj-pill-emerald-metallic text-white border-0 font-bold"
                            : "bg-white border border-[#B89555]/45 text-[#1A1A1A] hover:border-[#064E3B]/55"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <select
                    value={localFilters.handoverFrom.year}
                    onChange={(e) => update({ handoverFrom: { ...localFilters.handoverFrom, year: e.target.value } })}
                    className="w-full h-9 px-3 bg-white border border-[#B89555]/50 rounded-lg text-sm text-[#1A1A1A] font-medium appearance-none cursor-pointer"
                    style={{ WebkitAppearance: 'none' }}
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`${filterLabel} mb-2`}>To</label>
                  <div className="flex gap-1 mb-2">
                    {QUARTERS.map(q => (
                      <button
                        key={q}
                        onClick={() => update({ handoverTo: { ...localFilters.handoverTo, quarter: q } })}
                        className={cn(
                          "flex-1 h-8 rounded-lg text-xs font-bold transition-all text-center",
                          localFilters.handoverTo.quarter === q
                            ? "allow-white jj-pill-emerald-metallic text-white border-0 font-bold"
                            : "bg-white border border-[#B89555]/45 text-[#1A1A1A] hover:border-[#064E3B]/55"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <select
                    value={localFilters.handoverTo.year}
                    onChange={(e) => update({ handoverTo: { ...localFilters.handoverTo, year: e.target.value } })}
                    className="w-full h-9 px-3 bg-white border border-[#B89555]/50 rounded-lg text-sm text-[#1A1A1A] font-medium appearance-none cursor-pointer"
                    style={{ WebkitAppearance: 'none' }}
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Property Views */}
            <section>
              <h4 className={sectionTitle}>Property Views</h4>
              <div className="flex flex-wrap gap-2">
                {VIEWS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update({ views: toggleArray(localFilters.views || [], opt.value) })}
                          data-filter-selected={(localFilters.views || []).includes(opt.value) ? "true" : undefined}
                    className={cn(togglePillBase, (localFilters.views || []).includes(opt.value) ? togglePillOn : togglePillOff)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>

        {/* Sticky Footer */}
        <div className="px-6 py-4 border-t border-[#B89555]/35 flex-shrink-0 flex items-center gap-3 bg-white/35">
          <button
            onClick={handleClearAll}
            className="allow-white jj-pill-emerald-metallic h-11 px-5 rounded-full inline-flex items-center justify-center font-bold text-sm text-white border-0 transition-none"
          >
            Clear all
          </button>
          <button
            aria-label="Save to favourites"
            data-emerald-ok="icon"
            className="allow-white jj-pill-emerald-metallic h-11 w-11 p-0 rounded-full inline-flex items-center justify-center shrink-0"
          >
            <Heart className="w-4 h-4" fill="currentColor" />
          </button>
          <button
            onClick={handleApply}
            className="allow-white jj-pill-emerald-metallic flex-1 py-3 rounded-full font-bold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--emerald-1)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7] transition-all"
          >
            Show {projectCount !== null ? projectCount.toLocaleString() : '...'} projects
          </button>

        </div>
        </>
        ) : (
          <div className="flex-1 min-h-[420px] px-5 py-5 space-y-4" aria-busy="true">
            <div className="h-3 w-24 rounded-full bg-[#B89555]/20" />
            <div className="h-11 rounded-xl border border-[#B89555]/35 bg-white" />
            <div className="h-3 w-20 rounded-full bg-[#B89555]/20" />
            <div className="h-11 rounded-xl border border-[#B89555]/35 bg-white" />
            <div className="h-3 w-32 rounded-full bg-[#B89555]/20" />
            <div className="h-24 rounded-xl border border-[#B89555]/35 bg-white" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

export default AdvancedFilterPanel;
