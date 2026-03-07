/**
 * AdvancedFilterPanel - Centered dialog with all filter sections, developer logos, UAE-only locations
 */
import { useState, useEffect, useCallback } from "react";
import { X, Search, Heart, Check, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { EMIRATES_OPTIONS, VIEWS_OPTIONS } from "@/constants/filterConfig";
import { SafeImage } from "@/components/SafeImage";
import type { ShortcutFilterState } from "./FilterShortcutBar";
import { defaultShortcutFilters } from "./FilterShortcutBar";

interface AdvancedFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ShortcutFilterState;
  onFilterChange: (filters: ShortcutFilterState) => void;
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const YEARS = ['2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'];

const STATUS_OPTIONS = [
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

interface DeveloperEntry {
  name: string;
  logo_url: string | null;
}

interface AreaEntry {
  name: string;
  emirate: string;
}

export default function AdvancedFilterPanel({ open, onOpenChange, filters, onFilterChange }: AdvancedFilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<ShortcutFilterState>(filters);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [developers, setDevelopers] = useState<DeveloperEntry[]>([]);
  const [allAreas, setAllAreas] = useState<AreaEntry[]>([]);
  const [devSearch, setDevSearch] = useState('');
  const [emirateSearch, setEmirateSearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [emiratesOpen, setEmiratesOpen] = useState(false);
  const [devsOpen, setDevsOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);

  // Sync local filters when panel opens
  useEffect(() => {
    if (open) setLocalFilters(filters);
  }, [open, filters]);

  // Fetch developers with logos from developers table
  useEffect(() => {
    if (!open) return;
    supabase
      .from('developers')
      .select('name, logo_url')
      .order('name')
      .then(({ data }) => {
        if (data) {
          setDevelopers(data.map(d => ({ name: d.name, logo_url: d.logo_url })));
        }
      });
  }, [open]);

  // Fetch all active areas grouped by emirate
  useEffect(() => {
    if (!open) return;
    supabase
      .from('areas')
      .select('name, emirate')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data) setAllAreas(data as AreaEntry[]);
      });
  }, [open]);

  // Live count with debounce — reflects current filters (fast 200ms debounce)
  useEffect(() => {
    if (!open) return;
    setProjectCount(null);
    const timer = setTimeout(async () => {
      try {
        let query = supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', true);

        if (localFilters.searchQuery?.trim()) {
          query = query.or(`name.ilike.%${localFilters.searchQuery.trim()}%,developer_name.ilike.%${localFilters.searchQuery.trim()}%,area_name.ilike.%${localFilters.searchQuery.trim()}%`);
        }
        if (localFilters.emirates.length > 0) {
          query = query.in('emirate', localFilters.emirates);
        }
        if (localFilters.developers.length > 0) {
          query = query.in('developer_name', localFilters.developers);
        }
        if (localFilters.areas && localFilters.areas.length > 0) {
          query = query.in('area_name', localFilters.areas);
        }
        if (localFilters.priceMin) {
          query = query.gte('price_from', Number(localFilters.priceMin));
        }
        if (localFilters.priceMax) {
          query = query.lte('price_from', Number(localFilters.priceMax));
        }
        if (localFilters.constructionStatuses.length > 0) {
          query = query.in('construction_status', localFilters.constructionStatuses);
        }
        if (localFilters.statuses.length > 0) {
          query = query.in('status_label', localFilters.statuses);
        }
        if (localFilters.propertyTypes.length > 0) {
          query = query.in('property_type_label', localFilters.propertyTypes);
        }

        const { count } = await query;
        setProjectCount(count ?? 0);
      } catch {
        setProjectCount(null);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [open, localFilters]);

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

  const togglePillBase = "px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer";
  const togglePillOff = "border-gold/25 text-black/70 bg-white/80 hover:bg-gold/10 hover:border-gold/50 hover:shadow-sm";
  const togglePillOn = "border-2 border-gold bg-gradient-to-r from-[#C8A766]/20 via-[#D4AF37]/15 to-[#C8A766]/20 text-black font-bold shadow-[0_2px_8px_rgba(200,167,102,0.2)]";
  const sectionTitle = "text-sm font-bold text-black mb-3 tracking-tight";
  const inputClass = "w-full h-10 px-3 bg-white/90 border border-gold/25 rounded-xl text-sm text-black placeholder:text-black/35 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all";

  const filteredEmirates = UAE_EMIRATES.filter(e =>
    !emirateSearch || e.label.toLowerCase().includes(emirateSearch.toLowerCase())
  );

  const filteredDevs = developers.filter(d =>
    !devSearch || d.name.toLowerCase().includes(devSearch.toLowerCase())
  );

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl w-[calc(100vw-3rem)] max-h-[calc(100dvh-4rem)] p-0 bg-gradient-to-br from-[#FEFCF9] via-[#FAF6EE] to-[#F3EDD9] border-2 border-gold/50 flex flex-col overflow-hidden shadow-[0_25px_80px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(200,167,102,0.2)]"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gold/30 flex-shrink-0 bg-gradient-to-r from-transparent via-gold/[0.04] to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div>
              <DialogTitle className="text-xl font-bold text-black tracking-tight">New Off Plan Projects</DialogTitle>
              {projectCount !== null ? (
                <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#B8964A] to-[#D4AF37]">
                  {projectCount.toLocaleString()} live projects
                </span>
              ) : (
                <span className="text-sm text-black/30">Loading...</span>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
            <input
              type="text"
              value={localFilters.searchQuery}
              onChange={(e) => update({ searchQuery: e.target.value })}
              placeholder="Type a project, developer or district"
              className={cn(inputClass, "pl-9")}
            />
          </div>
        </div>

        {/* Scrollable body */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-6">
            {/* Location - UAE Only */}
            <section>
              <h4 className={sectionTitle}>Location</h4>
              <button
                onClick={() => setEmiratesOpen(!emiratesOpen)}
                className={cn(inputClass, "flex items-center justify-between cursor-pointer text-left")}
              >
                <span className={localFilters.emirates.length > 0 ? "text-black" : "text-black/40"}>
                  {localFilters.emirates.length === 0 ? "All Emirates" : `${localFilters.emirates.length} selected`}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-black/40 transition-transform", emiratesOpen && "rotate-180")} />
              </button>
              {emiratesOpen && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={emirateSearch}
                    onChange={(e) => setEmirateSearch(e.target.value)}
                    placeholder="Search emirate..."
                    className={cn(inputClass, "mb-2 h-9 text-xs")}
                  />
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {filteredEmirates.map((em) => {
                      const isSelected = localFilters.emirates.includes(em.value);
                      return (
                        <button
                          key={em.value}
                          onClick={() => update({ emirates: toggleArray(localFilters.emirates, em.value) })}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gold/10 transition-colors"
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                            isSelected ? "border-gold bg-gold/20" : "border-gold/40"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-black" />}
                          </div>
                          <span className="text-sm text-black">{em.label}</span>
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
                onClick={() => setAreasOpen(!areasOpen)}
                className={cn(inputClass, "flex items-center justify-between cursor-pointer text-left")}
              >
                <span className={localFilters.areas && localFilters.areas.length > 0 ? "text-black" : "text-black/40"}>
                  {!localFilters.areas || localFilters.areas.length === 0
                    ? "All Areas"
                    : `${localFilters.areas.length} area${localFilters.areas.length > 1 ? 's' : ''} selected`}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-black/40 transition-transform", areasOpen && "rotate-180")} />
              </button>
              {areasOpen && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                    placeholder="Search area or emirate..."
                    className={cn(inputClass, "mb-2 h-9 text-xs")}
                  />
                  {allAreas.length === 0 ? (
                    <div className="py-4 text-center text-xs text-black/40">Loading areas...</div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto">
                      {Object.entries(areasGroupedByEmirate).sort(([a], [b]) => a.localeCompare(b)).map(([emirate, areaNames]) => (
                        <div key={emirate}>
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-[10px] font-bold text-black/50 uppercase tracking-wider">{emirate}</span>
                            <div className="flex-1 h-px bg-gold/20" />
                            <span className="text-[10px] text-black/30">{areaNames.length}</span>
                          </div>
                          <div className="space-y-0.5">
                            {areaNames.map(areaName => {
                              const isSelected = (localFilters.areas || []).includes(areaName);
                              return (
                                <button
                                  key={areaName}
                                  onClick={() => update({ areas: toggleArray(localFilters.areas || [], areaName) })}
                                  className="flex items-center gap-3 w-full px-3 py-1.5 rounded-lg hover:bg-gold/10 transition-colors"
                                >
                                  <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                                    isSelected ? "border-gold bg-gold/20" : "border-gold/40"
                                  )}>
                                    {isSelected && <Check className="w-3 h-3 text-black" />}
                                  </div>
                                  <span className="text-sm text-black text-left">{areaName}</span>
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
                onClick={() => setDevsOpen(!devsOpen)}
                className={cn(inputClass, "flex items-center justify-between cursor-pointer text-left")}
              >
                <span className={localFilters.developers.length > 0 ? "text-black" : "text-black/40"}>
                  {localFilters.developers.length === 0 ? "All Developers" : `${localFilters.developers.length} selected`}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-black/40 transition-transform", devsOpen && "rotate-180")} />
              </button>
              {devsOpen && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={devSearch}
                    onChange={(e) => setDevSearch(e.target.value)}
                    placeholder="Search developer..."
                    className={cn(inputClass, "mb-2 h-9 text-xs")}
                  />
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {filteredDevs.map((dev) => {
                      const isSelected = localFilters.developers.includes(dev.name);
                      return (
                        <button
                          key={dev.name}
                          onClick={() => update({ developers: toggleArray(localFilters.developers, dev.name) })}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gold/10 transition-colors"
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                            isSelected ? "border-gold bg-gold/20" : "border-gold/40"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-black" />}
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-white border border-gold/20 p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                            {dev.logo_url ? (
                              <img
                                src={dev.logo_url}
                                alt={dev.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<span style="font-size:9px;font-weight:700;color:rgba(0,0,0,0.4)">${dev.name.charAt(0)}</span>`;
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-[9px] font-bold text-black/40">{dev.name.charAt(0)}</span>
                            )}
                          </div>
                          <span className="text-sm text-black text-left truncate flex-1">{dev.name}</span>
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
                  <span className="text-xs text-black/60">Maximum pre-handover</span>
                  <span className="text-xs font-bold text-black bg-white/80 px-2 py-0.5 rounded border border-gold/30">
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
                  <span className="text-xs text-black/70">Post handover plans only</span>
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
                <TabsList className="w-full mb-3 bg-white/60">
                  <TabsTrigger value="unit" className="flex-1 text-xs">Per unit</TabsTrigger>
                  <TabsTrigger value="sqft" className="flex-1 text-xs">Per sqft</TabsTrigger>
                  <TabsTrigger value="sqm" className="flex-1 text-xs">Per sqm</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-black/50 uppercase mb-1 block">Min Price</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={localFilters.priceMin}
                      onChange={(e) => update({ priceMin: e.target.value.replace(/[^0-9]/g, '') })}
                      placeholder="0"
                      className={cn(inputClass, "h-9 pr-12")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-black/40 font-medium">AED</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-black/50 uppercase mb-1 block">Max Price</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={localFilters.priceMax}
                      onChange={(e) => update({ priceMax: e.target.value.replace(/[^0-9]/g, '') })}
                      placeholder="Any"
                      className={cn(inputClass, "h-9 pr-12")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-black/40 font-medium">AED</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Property Size */}
            <section>
              <h4 className={sectionTitle}>Property Size</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-black/50 uppercase mb-1 block">Min sqft</label>
                  <input
                    type="text"
                    value={localFilters.sizeMin}
                    onChange={(e) => update({ sizeMin: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="0"
                    className={cn(inputClass, "h-9")}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-black/50 uppercase mb-1 block">Max sqft</label>
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
                  <label className="text-[10px] font-semibold text-black/50 uppercase mb-2 block">From</label>
                  <div className="flex gap-1 mb-2">
                    {QUARTERS.map(q => (
                      <button
                        key={q}
                        onClick={() => update({ handoverFrom: { ...localFilters.handoverFrom, quarter: q } })}
                        className={cn(
                          "flex-1 h-8 rounded-lg text-xs font-bold transition-all text-center",
                          localFilters.handoverFrom.quarter === q
                            ? "bg-gradient-to-br from-[#C8A766]/25 via-[#D4AF37]/20 to-[#C8A766]/25 border-2 border-gold text-black shadow-sm"
                            : "bg-white/80 border border-gold/25 text-black/60 hover:bg-gold/10 hover:border-gold/50"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <select
                    value={localFilters.handoverFrom.year}
                    onChange={(e) => update({ handoverFrom: { ...localFilters.handoverFrom, year: e.target.value } })}
                    className="w-full h-9 px-3 bg-white border border-gold/30 rounded-lg text-sm text-black font-medium appearance-none cursor-pointer"
                    style={{ WebkitAppearance: 'none' }}
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-black/50 uppercase mb-2 block">To</label>
                  <div className="flex gap-1 mb-2">
                    {QUARTERS.map(q => (
                      <button
                        key={q}
                        onClick={() => update({ handoverTo: { ...localFilters.handoverTo, quarter: q } })}
                        className={cn(
                          "flex-1 h-8 rounded-lg text-xs font-bold transition-all text-center",
                          localFilters.handoverTo.quarter === q
                            ? "bg-gradient-to-br from-[#C8A766]/25 via-[#D4AF37]/20 to-[#C8A766]/25 border-2 border-gold text-black shadow-sm"
                            : "bg-white/80 border border-gold/25 text-black/60 hover:bg-gold/10 hover:border-gold/50"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <select
                    value={localFilters.handoverTo.year}
                    onChange={(e) => update({ handoverTo: { ...localFilters.handoverTo, year: e.target.value } })}
                    className="w-full h-9 px-3 bg-white border border-gold/30 rounded-lg text-sm text-black font-medium appearance-none cursor-pointer"
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
        <div className="px-6 py-4 border-t border-gold/30 flex-shrink-0 flex items-center gap-3 bg-gradient-to-r from-transparent via-gold/[0.04] to-transparent">
          <button
            onClick={handleClearAll}
            className="px-5 py-2.5 rounded-full border border-gold/40 text-xs font-bold text-black/70 hover:bg-gold/10 hover:border-gold/60 transition-all"
          >
            Clear all
          </button>
          <button className="p-2.5 rounded-full border border-gold/40 hover:bg-gold/10 hover:border-gold/60 transition-all">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 rounded-full bg-gradient-to-r from-[#C8A766] via-[#D4AF37] to-[#C8A766] text-white font-bold text-sm shadow-[0_4px_20px_rgba(200,167,102,0.4)] hover:shadow-[0_6px_28px_rgba(200,167,102,0.55)] hover:brightness-105 transition-all"
          >
            Show {projectCount !== null ? projectCount.toLocaleString() : '...'} projects
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
