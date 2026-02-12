/**
 * AdvancedFilterPanel - Full advanced filter sheet with all sections, live count, champagne styling
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Search, Heart, Building2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { EMIRATES_OPTIONS } from "@/constants/filterConfig";
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
  { value: 'Sold Out', label: 'Sold Out', dotClass: 'bg-zinc-400' },
];

const CONSTRUCTION_OPTIONS = [
  { value: 'Completed', label: 'Completed' },
  { value: 'Under Construction', label: 'Under Construction' },
  { value: 'Presale', label: 'Presale' },
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

export default function AdvancedFilterPanel({ open, onOpenChange, filters, onFilterChange }: AdvancedFilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<ShortcutFilterState>(filters);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [developers, setDevelopers] = useState<string[]>([]);
  const [devSearch, setDevSearch] = useState('');
  const [emirateSearch, setEmirateSearch] = useState('');

  // Sync local filters when panel opens
  useEffect(() => {
    if (open) setLocalFilters(filters);
  }, [open, filters]);

  // Fetch distinct developers
  useEffect(() => {
    if (!open) return;
    supabase
      .from('projects')
      .select('developer_name')
      .not('developer_name', 'is', null)
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map(d => d.developer_name).filter(Boolean))] as string[];
          unique.sort((a, b) => a.localeCompare(b));
          setDevelopers(unique);
        }
      });
  }, [open]);

  // Live count with debounce
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      try {
        const { count } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true });
        setProjectCount(count ?? 0);
      } catch {
        setProjectCount(null);
      }
    }, 500);
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

  const togglePillBase = "px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer";
  const togglePillOff = "border-gold/30 text-black/70 bg-white/60 hover:bg-gold/10 hover:border-gold/50 hover:shadow-sm";
  const togglePillOn = "border-2 border-gold bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black font-bold";
  const sectionTitle = "text-sm font-bold text-black mb-3";
  const inputClass = "w-full h-10 px-3 bg-white border border-gold/30 rounded-lg text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30";

  const filteredEmirates = EMIRATES_OPTIONS.filter(e =>
    !emirateSearch || e.label.toLowerCase().includes(emirateSearch.toLowerCase())
  );

  const filteredDevs = developers.filter(d =>
    !devSearch || d.toLowerCase().includes(devSearch.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-l-2 border-gold/40 flex flex-col"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gold/20 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <SheetTitle className="text-lg font-bold text-black">New Off Plan Projects</SheetTitle>
              {projectCount !== null && (
                <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#C8A766] to-[#D4AF37]">
                  {projectCount.toLocaleString()} live projects
                </span>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="w-5 h-5 text-black/60" />
            </button>
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
            {/* Location */}
            <section>
              <h4 className={sectionTitle}>Location</h4>
              <input
                type="text"
                value={emirateSearch}
                onChange={(e) => setEmirateSearch(e.target.value)}
                placeholder="Search emirate..."
                className={cn(inputClass, "mb-2 h-9 text-xs")}
              />
              <div className="flex flex-wrap gap-2">
                {filteredEmirates.map((em) => (
                  <button
                    key={em.value}
                    onClick={() => update({ emirates: toggleArray(localFilters.emirates, em.value) })}
                    className={cn(togglePillBase, localFilters.emirates.includes(em.value) ? togglePillOn : togglePillOff)}
                  >
                    {em.label}
                  </button>
                ))}
              </div>
            </section>

            {/* By Company */}
            <section>
              <h4 className={sectionTitle}>By Company</h4>
              <input
                type="text"
                value={devSearch}
                onChange={(e) => setDevSearch(e.target.value)}
                placeholder="Search developer..."
                className={cn(inputClass, "mb-2 h-9 text-xs")}
              />
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {filteredDevs.slice(0, 50).map((dev) => (
                  <button
                    key={dev}
                    onClick={() => update({ developers: toggleArray(localFilters.developers, dev) })}
                    className={cn(
                      togglePillBase, "text-[11px]",
                      localFilters.developers.includes(dev) ? togglePillOn : togglePillOff
                    )}
                  >
                    <Building2 className="w-3 h-3 inline mr-1 opacity-50" />
                    {dev}
                  </button>
                ))}
              </div>
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
                  <label className="text-[10px] font-semibold text-black/50 uppercase mb-1 block">From</label>
                  <div className="flex gap-2">
                    <select
                      value={localFilters.handoverFrom.quarter}
                      onChange={(e) => update({ handoverFrom: { ...localFilters.handoverFrom, quarter: e.target.value } })}
                      className="flex-1 h-9 px-2 bg-white border border-gold/30 rounded text-sm text-black font-medium"
                    >
                      {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                    <select
                      value={localFilters.handoverFrom.year}
                      onChange={(e) => update({ handoverFrom: { ...localFilters.handoverFrom, year: e.target.value } })}
                      className="flex-1 h-9 px-2 bg-white border border-gold/30 rounded text-sm text-black font-medium"
                    >
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-black/50 uppercase mb-1 block">To</label>
                  <div className="flex gap-2">
                    <select
                      value={localFilters.handoverTo.quarter}
                      onChange={(e) => update({ handoverTo: { ...localFilters.handoverTo, quarter: e.target.value } })}
                      className="flex-1 h-9 px-2 bg-white border border-gold/30 rounded text-sm text-black font-medium"
                    >
                      {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                    <select
                      value={localFilters.handoverTo.year}
                      onChange={(e) => update({ handoverTo: { ...localFilters.handoverTo, year: e.target.value } })}
                      className="flex-1 h-9 px-2 bg-white border border-gold/30 rounded text-sm text-black font-medium"
                    >
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        {/* Sticky Footer */}
        <div className="px-5 py-4 border-t border-gold/20 flex-shrink-0 flex items-center gap-3">
          <button
            onClick={handleClearAll}
            className="px-4 py-2.5 rounded-full border border-gold/40 text-xs font-semibold text-black/70 hover:bg-white/60 transition-colors"
          >
            Clear all
          </button>
          <button className="p-2.5 rounded-full border border-gold/40 hover:bg-white/60 transition-colors">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#C8A766] to-[#D4AF37] text-black font-bold text-sm shadow-lg hover:brightness-110 transition-all"
          >
            Show {projectCount !== null ? projectCount.toLocaleString() : '...'} projects
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
