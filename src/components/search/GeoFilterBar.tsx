/**
 * GeoFilterBar — global multi-country property filter bar.
 *
 * Segments: [Intent] [Country] [Region*] [Area] [Category] [Beds & Baths]
 *           [Price] [More Filters (n)] [Search]
 *   * the Region step renders ONLY for countries that declare `regions`
 *     (see src/data/geography.ts). Never hardcode "Emirate" here.
 *
 * Mounted above the hero search bar on the homepage (visually connected to it)
 * and inside the portal for filtering developers / inventory.
 *
 * Colour contract: emerald is ALWAYS the pair gradient
 * (#064E3B → #042c1c → #000) — never flat #064E3B alone.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  BATH_OPTIONS,
  BED_OPTIONS,
  COMPLETION_OPTIONS,
  FURNISHING_OPTIONS,
  GEO_COUNTRIES,
  LISTING_INTENTS,
  PROPERTY_CATEGORIES,
  getAreas,
  getCountry,
  getRegions,
  hasRegionStep,
} from "@/data/geography";
import {
  EMPTY_FILTERS,
  compactPrice,
  countMoreFilters,
  currencyFor,
  type GeoSearchFilters,
} from "@/lib/searchFilters";

const EMERALD_PAIR = "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)";


/* --------------------------------------------------------------- primitives */

const SEG_CLASS =
  "flex items-center justify-between gap-2 h-11 sm:h-12 px-3 sm:px-3.5 rounded-xl text-[13px] sm:text-sm font-medium tracking-tight transition-colors min-w-0 w-full";

/** One dropdown step of the filter bar. Module-level so its identity is stable
 *  and Radix popovers survive ancestor re-renders (hero typewriter, etc.). */
function Seg({
  label,
  active,
  icon,
  children,
  dark,
}: {
  label: string;
  active?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  dark: boolean;
}) {
  const ink = dark ? "#FFFFFF" : "#1A1A1A";
  const muted = dark ? "rgba(255,255,255,0.72)" : "rgba(26,26,26,0.62)";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={SEG_CLASS}
          aria-label={label}
          style={{
            background: dark ? "rgba(255,255,255,0.06)" : "#FDFBF7",
            border: `1px solid ${dark ? "rgba(255,255,255,0.18)" : "rgba(184,149,85,0.30)"}`,
            color: ink,
          }}
        >
          <span className="flex items-center gap-2 min-w-0">
            {icon}
            <span
              className="truncate"
              style={{ color: active ? ink : muted, whiteSpace: "nowrap", wordBreak: "normal" }}
            >
              {label}
            </span>
          </span>

          <ChevronDown className="w-4 h-4 shrink-0 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(92vw,22rem)] p-0 z-[70]"
        style={{ background: "#FFFFFF", border: "1px solid rgba(184,149,85,0.35)", color: "#1A1A1A" }}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

function Pill({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all"
      style={
        selected
          ? { backgroundImage: EMERALD_PAIR, color: "#FFFFFF", border: "1px solid #042c1c" }
          : { background: "#FDFBF7", color: "#1A1A1A", border: "1px solid rgba(184,149,85,0.35)" }
      }
    >
      {children}
    </button>
  );
}

export interface GeoFilterBarProps {
  value?: GeoSearchFilters;
  onChange?: (next: GeoSearchFilters) => void;
  onSearch?: (filters: GeoSearchFilters) => void;
  /** `dark` = on hero video / emerald. `light` = champagne portal surfaces. */
  variant?: "dark" | "light";
  /** Hide the trailing Search button when the parent owns submission. */
  showSearchButton?: boolean;
  className?: string;
  searchLabel?: string;
}

export default function GeoFilterBar({
  value,
  onChange,
  onSearch,
  variant = "dark",
  showSearchButton = true,
  className = "",
  searchLabel = "Search",
}: GeoFilterBarProps) {
  const [internal, setInternal] = useState<GeoSearchFilters>(value ?? EMPTY_FILTERS);
  const filters = value ?? internal;

  const set = (patch: Partial<GeoSearchFilters>) => {
    const next = { ...filters, ...patch };
    setInternal(next);
    onChange?.(next);
  };

  const dark = variant === "dark";
  const country = getCountry(filters.country);
  const regions = getRegions(filters.country);
  const areas = useMemo(() => getAreas(filters.country, filters.region), [filters.country, filters.region]);
  const showRegion = hasRegionStep(filters.country);
  const currency = currencyFor(filters.country);
  const moreCount = countMoreFilters(filters);

  /* ---------------------------------------------------------------- styles */
  const shell: React.CSSProperties = dark
    ? {
        background: "rgba(8,12,10,0.80)",
        WebkitBackdropFilter: "blur(18px) saturate(160%)",
        backdropFilter: "blur(18px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 16px 38px rgba(0,0,0,0.42)",
      }
    : {
        background: "#FFFFFF",
        border: "1px solid rgba(184,149,85,0.35)",
        boxShadow: "0 10px 26px -18px rgba(4,44,28,0.35)",
      };

  const ink = dark ? "#FFFFFF" : "#1A1A1A";
  const muted = dark ? "rgba(255,255,255,0.72)" : "rgba(26,26,26,0.62)";
  const segBorder = dark ? "rgba(255,255,255,0.18)" : "rgba(184,149,85,0.30)";




  // NOTE: `Seg` and `Pill` are module-level components on purpose. Defining
  // them inside this function gave them a new identity on every render, which
  // remounted (and instantly closed) every Radix popover whenever an ancestor
  // re-rendered — e.g. the hero typewriter ticking once per frame.



  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  /* --------------------------------------------------------------- labels */
  const countryLabel = country ? (country.slug === "uae" ? "UAE" : country.name) : "Country";
  const regionLabel = filters.region
    ? regions.find((r) => r.slug === filters.region)?.name ?? country?.regionLabel ?? "Region"
    : country?.regionLabel ?? "Region";
  const areaLabel =
    filters.areas.length === 0
      ? country?.areaLabel ?? "Area"
      : filters.areas.length === 1
        ? areas.find((x) => x.slug === filters.areas[0])?.name ?? "1 area"
        : `${filters.areas.length} areas`;
  const bedsLabel =
    filters.beds.length || filters.baths.length
      ? [filters.beds.length ? `${filters.beds.join("/")} bed` : null, filters.baths.length ? `${filters.baths.join("/")} bath` : null]
          .filter(Boolean)
          .join(" · ")
      : "Bedrooms";
  const priceLabel =
    filters.priceMin == null && filters.priceMax == null
      ? "Price"
      : `${filters.priceMin != null ? compactPrice(filters.priceMin, currency) : "Any"} – ${
          filters.priceMax != null ? compactPrice(filters.priceMax, currency) : "Any"
        }`;

  return (
    <div className={`w-full ${className}`} data-geo-filter-bar={variant}>
      <div className="rounded-2xl p-2 sm:p-2.5" style={shell}>

        {/* Row 1 — intent + category segmented switches */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-0.5 pb-2">
          <div
            className="inline-flex items-center rounded-full p-0.5"
            style={{
              background: dark ? "rgba(255,255,255,0.08)" : "#F7F2EA",
              border: `1px solid ${segBorder}`,
            }}
          >
            {LISTING_INTENTS.map((i) => {
              const on = filters.intent === i.slug;
              return (
                <button
                  key={i.slug}
                  type="button"
                  onClick={() => set({ intent: i.slug })}
                  className="px-3 sm:px-3.5 h-8 rounded-full text-xs sm:text-[13px] font-semibold tracking-tight transition-all"
                  style={
                    on
                      ? { backgroundImage: EMERALD_PAIR, color: "#FFFFFF" }
                      : { background: "transparent", color: dark ? "rgba(255,255,255,0.78)" : "#1A1A1A" }
                  }
                >
                  {i.label}
                </button>
              );
            })}
          </div>

          <div
            className="inline-flex items-center rounded-full p-0.5"
            style={{
              background: dark ? "rgba(255,255,255,0.08)" : "#F7F2EA",
              border: `1px solid ${segBorder}`,
            }}
          >
            {PROPERTY_CATEGORIES.map((c) => {
              const on = filters.category === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => set({ category: c.slug })}
                  className="px-3 sm:px-3.5 h-8 rounded-full text-xs sm:text-[13px] font-semibold tracking-tight transition-all"
                  style={
                    on
                      ? { backgroundImage: EMERALD_PAIR, color: "#FFFFFF" }
                      : { background: "transparent", color: dark ? "rgba(255,255,255,0.78)" : "#1A1A1A" }
                  }
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2 — cascading selects */}
        <div className="grid grid-cols-2 md:flex md:items-center md:flex-nowrap gap-1.5 sm:gap-2">
          {/* Country */}
          <div className="min-w-0 md:w-auto md:min-w-[8rem] md:flex-1">
            <Seg dark={dark} label={countryLabel} active={!!filters.country} icon={<MapPin className="w-4 h-4 opacity-80" />}>
              <div className="p-2">
                {GEO_COUNTRIES.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => set({ country: c.slug, region: null, areas: [] })}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-[#F7F2EA]"
                    style={{ color: "#1A1A1A", fontWeight: filters.country === c.slug ? 700 : 500 }}
                  >
                    <span>{c.name}</span>
                    {!c.live && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#F7F2EA", color: "#7A6230", border: "1px solid rgba(184,149,85,0.35)" }}
                      >
                        Coming soon
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Seg>
          </div>

          {/* Region (conditional) */}
          {showRegion && (
            <div className="min-w-0 md:w-auto md:min-w-[6.75rem] md:flex-1">
              <Seg dark={dark} label={regionLabel} active={!!filters.region}>
                <div className="p-2 max-h-72 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => set({ region: null, areas: [] })}
                    className="w-full px-3 py-2 rounded-lg text-sm text-left hover:bg-[#F7F2EA]"
                  >
                    All {country?.regionLabel?.toLowerCase() ?? "regions"}s
                  </button>
                  {regions.map((r) => (
                    <button
                      key={r.slug}
                      type="button"
                      onClick={() => set({ region: r.slug, areas: [] })}
                      className="w-full px-3 py-2 rounded-lg text-sm text-left hover:bg-[#F7F2EA]"
                      style={{ fontWeight: filters.region === r.slug ? 700 : 500 }}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </Seg>
            </div>
          )}

          {/* Areas (multi) */}
          <div className="min-w-0 md:flex-1 md:min-w-[6.5rem]">
            <Seg dark={dark} label={areaLabel} active={filters.areas.length > 0}>
              <AreaPicker
                areas={areas}
                selected={filters.areas}
                onToggle={(slug) => set({ areas: toggle(filters.areas, slug) })}
                onClear={() => set({ areas: [] })}
                label={country?.areaLabel ?? "Area"}
              />
            </Seg>
          </div>

          {/* Beds & Baths */}
          <div className="min-w-0 md:w-auto md:min-w-[7.25rem] md:flex-1">
            <Seg dark={dark} label={bedsLabel} active={filters.beds.length > 0 || filters.baths.length > 0}>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#7A6230" }}>
                    Bedrooms
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {BED_OPTIONS.map((b) => (
                      <Pill key={b} selected={filters.beds.includes(b)} onClick={() => set({ beds: toggle(filters.beds, b) })}>
                        {b}
                      </Pill>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#7A6230" }}>
                    Bathrooms
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {BATH_OPTIONS.map((b) => (
                      <Pill key={b} selected={filters.baths.includes(b)} onClick={() => set({ baths: toggle(filters.baths, b) })}>
                        {b}
                      </Pill>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set({ beds: [], baths: [] })}
                  className="text-xs underline"
                  style={{ color: "#1A1A1A" }}
                >
                  Reset
                </button>
              </div>
            </Seg>
          </div>

          {/* Price */}
          <div className="min-w-0 md:w-auto md:min-w-[7.25rem] md:flex-1">
            <Seg dark={dark} label={priceLabel} active={filters.priceMin != null || filters.priceMax != null}>
              <div className="p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7A6230" }}>
                  Price ({currency})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    placeholder="Min"
                    value={filters.priceMin}
                    onChange={(v) => set({ priceMin: v })}
                  />
                  <NumberField
                    placeholder="Max"
                    value={filters.priceMax}
                    onChange={(v) => set({ priceMax: v })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => set({ priceMin: null, priceMax: null })}
                  className="text-xs underline"
                  style={{ color: "#1A1A1A" }}
                >
                  Reset
                </button>
              </div>
            </Seg>
          </div>

          {/* More filters */}
          <div className="min-w-0 md:w-auto md:min-w-[7.25rem] md:flex-1">
            <Seg
              dark={dark}
              label={moreCount ? `Filters (${moreCount})` : "More Filters"}
              active={moreCount > 0}
              icon={<SlidersHorizontal className="w-4 h-4 opacity-80" />}
            >
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#7A6230" }}>
                    Property type
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(PROPERTY_CATEGORIES.find((c) => c.slug === filters.category)?.types ?? []).map((t) => (
                      <Pill
                        key={t}
                        selected={filters.developer === t}
                        onClick={() => set({ developer: filters.developer === t ? null : t })}
                      >
                        {t}
                      </Pill>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#7A6230" }}>
                    Completion
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {COMPLETION_OPTIONS.map((o) => (
                      <Pill
                        key={o.slug}
                        selected={filters.completion === o.slug}
                        onClick={() => set({ completion: filters.completion === o.slug ? null : o.slug })}
                      >
                        {o.label}
                      </Pill>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#7A6230" }}>
                    Furnishing
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {FURNISHING_OPTIONS.map((o) => (
                      <Pill key={o.slug} selected={filters.furnishing === o.slug} onClick={() => set({ furnishing: o.slug })}>
                        {o.label}
                      </Pill>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#7A6230" }}>
                    Size (sqft)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField placeholder="Min" value={filters.sizeMin} onChange={(v) => set({ sizeMin: v })} />
                    <NumberField placeholder="Max" value={filters.sizeMax} onChange={(v) => set({ sizeMax: v })} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    set({ sizeMin: null, sizeMax: null, completion: null, furnishing: null, developer: null })
                  }
                  className="text-xs underline"
                  style={{ color: "#1A1A1A" }}
                >
                  Reset all
                </button>
              </div>
            </Seg>
          </div>

          {/* Search */}
          {showSearchButton && (
            <div className="col-span-2 md:col-auto md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => onSearch?.(filters)}
                className="w-full md:w-auto shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-5 rounded-xl text-sm font-semibold tracking-tight transition-transform hover:-translate-y-0.5"
                style={{
                  backgroundImage: EMERALD_PAIR,
                  color: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.28)",
                  boxShadow: "0 10px 24px -12px rgba(4,44,28,0.9)",
                }}
              >
                <Search className="w-4 h-4" strokeWidth={2.25} />
                {searchLabel}
              </button>
            </div>
          )}
        </div>

        {/* Selected areas chips */}
        {filters.areas.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 px-0.5">
            {filters.areas.map((slug) => {
              const name = areas.find((x) => x.slug === slug)?.name ?? slug;
              return (
                <span
                  key={slug}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    background: dark ? "rgba(255,255,255,0.12)" : "#F7F2EA",
                    color: dark ? "#FFFFFF" : "#1A1A1A",
                    border: `1px solid ${segBorder}`,
                  }}
                >
                  {name}
                  <button type="button" onClick={() => set({ areas: filters.areas.filter((s) => s !== slug) })} aria-label={`Remove ${name}`}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ pieces */

function NumberField({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw === "" ? null : Number(raw));
      }}
      className="h-10 px-3 rounded-lg text-sm w-full bg-transparent"
      style={{ border: "1px solid rgba(184,149,85,0.45)", color: "#1A1A1A" }}
    />
  );
}

function AreaPicker({
  areas,
  selected,
  onToggle,
  onClear,
  label,
}: {
  areas: { slug: string; name: string }[];
  selected: string[];
  onToggle: (slug: string) => void;
  onClear: () => void;
  label: string;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const list = useMemo(
    () => areas.filter((x) => x.name.toLowerCase().includes(q.trim().toLowerCase())),
    [areas, q],
  );

  return (
    <div className="p-3">
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`Search ${label.toLowerCase()}…`}
        className="h-10 w-full px-3 rounded-lg text-sm bg-transparent mb-2"
        style={{ border: "1px solid rgba(184,149,85,0.45)", color: "#1A1A1A" }}
      />
      <div className="max-h-64 overflow-y-auto">
        {list.length === 0 && (
          <p className="px-2 py-3 text-sm" style={{ color: "rgba(26,26,26,0.6)" }}>
            No areas match — try another spelling.
          </p>
        )}
        {list.map((x) => {
          const on = selected.includes(x.slug);
          return (
            <button
              key={x.slug}
              type="button"
              onClick={() => onToggle(x.slug)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-[#F7F2EA]"
              style={{ color: "#1A1A1A", fontWeight: on ? 700 : 500 }}
            >
              <span
                className="w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0"
                style={
                  on
                    ? { backgroundImage: EMERALD_PAIR, border: "1px solid #042c1c" }
                    : { border: "1px solid rgba(184,149,85,0.55)" }
                }
              >
                {on && <span className="w-1.5 h-1.5 rounded-[1px]" style={{ background: "#FFFFFF" }} />}
              </span>
              {x.name}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <button type="button" onClick={onClear} className="mt-2 text-xs underline" style={{ color: "#1A1A1A" }}>
          Clear {selected.length} selected
        </button>
      )}
    </div>
  );
}
