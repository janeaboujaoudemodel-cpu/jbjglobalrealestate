/**
 * PropertySearchBar — the ONE property filter bar used across the site
 * (homepage hero, /properties, /rent, /resale, /distress, area + developer
 * pages, portal inventory). Project pages keep their dedicated filters.
 *
 * Segments: [Purpose] [Location + include/exclude] [Type] [Beds & Baths]
 *           [Price] [Status] [More filters (n)] [Show N properties]
 *
 * Colour contract: emerald is ALWAYS the pair gradient
 * (#064E3B → #042c1c → #000) — never flat #064E3B alone.
 */
import { TIER_LABELS, type DeveloperTier } from "@/utils/developerTier";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, Crown, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { useTypewriter } from "@/hooks/useTypewriter";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getRegions } from "@/data/geography";
import { GEO_COUNTRIES } from "@/data/geography";
import AreaIncludeExclude from "./AreaIncludeExclude";
import PropertyFilterScreen from "./PropertyFilterScreen";
import InlineCurrencySelect from "@/components/search/InlineCurrencySelect";
import { usePropertyCount } from "@/hooks/usePropertyCount";
import { useAreaUnit, setAreaUnitGlobal, type AreaUnit } from "@/hooks/useAreaUnit";
import {
  BATHS,
  BEDS,
  CATEGORY_TYPES,
  EMPTY_SEARCH,
  PROJECT_STATUSES,
  PURPOSES,
  SORT_OPTIONS,
  compactPrice,
  countExtraFilters,
  currencyFor,
  type PropertySearch,
  type SearchCategory,
} from "@/lib/propertySearch";

const EMERALD_PAIR = "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)";
/** Readable frosted emerald surface for segments placed over the hero video. */
const DARK_SURFACE = "linear-gradient(180deg,rgba(6,78,59,0.82) 0%,rgba(4,44,28,0.90) 55%,rgba(0,0,0,0.92) 100%)";


const SEG =
  "flex items-center justify-between gap-1.5 h-11 lg:h-16 px-2.5 lg:px-3 rounded-lg text-[12.5px] lg:text-sm font-medium tracking-tight min-w-0 w-full transition-colors";

function Seg({
  label,
  active,
  icon,
  dark,
  children,
  wide,
  spanClass,
}: {
  label: string;
  active?: boolean;
  icon?: React.ReactNode;
  dark: boolean;
  children: React.ReactNode;
  wide?: boolean;
  spanClass?: string;
}) {
  const ink = dark ? "#FFFFFF" : "#1A1A1A";
  const muted = dark ? "rgba(255,255,255,0.92)" : "rgba(26,26,26,0.62)";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          data-search-segment
          className={`${SEG} ${spanClass ?? ""}`}
          data-no-contrast-guard
          style={{
            backgroundImage: dark ? DARK_SURFACE : undefined,
            background: dark ? undefined : "#FDFBF7",
            backdropFilter: dark ? "blur(10px)" : undefined,
            border: `1.5px solid ${dark ? "rgba(255,255,255,0.44)" : "rgba(184,149,85,0.58)"}`,
            color: ink,
            WebkitTextFillColor: dark ? "#FFFFFF" : undefined,
          }}
        >

          <span className="flex items-center gap-2 min-w-0">
            {icon}
            <span
              className="truncate leading-none"
              style={{
                color: active ? ink : muted,
                WebkitTextFillColor: active ? ink : muted,
                whiteSpace: "nowrap",
                wordBreak: "keep-all",
                overflowWrap: "normal",
                hyphens: "none",
              }}
            >

              {label}
            </span>
          </span>
          <ChevronDown className="w-4 h-4 shrink-0 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        data-surface="light"
        data-search-dropdown
        className={`${wide ? "w-[min(94vw,30rem)]" : "w-[min(92vw,22rem)]"} p-0 z-[70]`}
        style={{ background: "#FFFFFF", border: "1px solid rgba(184,149,85,0.35)", color: "#1A1A1A" }}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

function Chip({
  on,
  onClick,
  circle,
  children,
}: {
  on?: boolean;
  onClick: () => void;
  /** Perfect circle — one single shape for every numeric option site-wide. */
  circle?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-surface={on ? "emerald" : "light"}
      data-numeric-chip={circle ? "true" : undefined}
      className={
        circle
          ? "h-10 w-10 min-w-10 min-h-10 shrink-0 grow-0 basis-10 aspect-square rounded-full p-0 leading-none text-xs font-semibold inline-flex items-center justify-center"
          : "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
      }
      style={
        on
          ? { backgroundImage: EMERALD_PAIR, color: "#FFFFFF", border: "1px solid #042c1c", borderRadius: circle ? "9999px" : undefined }
          : { background: "#FDFBF7", color: "#1A1A1A", border: "1px solid rgba(184,149,85,0.35)", borderRadius: circle ? "9999px" : undefined }
      }
    >
      {children}
    </button>
  );
}


interface Props {
  value?: PropertySearch;
  onChange?: (next: PropertySearch) => void;
  onSubmit: (next: PropertySearch) => void;
  dark?: boolean;
  className?: string;
  /** Animated typewriter placeholder phrases for the keyword field. */
  typewriterPhrases?: string[];
  /** Rendered inside the bar (hero usage: Free Consultation CTA). */
  onConsultation?: () => void;
  /** Called when the visitor picks the "Sell" purpose — hero redirects instantly. */
  onSellSelected?: () => void;
  /** Adds the unified "Sort" segment (listing pages: properties, projects, areas, developers…). */
  showSort?: boolean;
  /** Optional custom sort options for non-property listings. */
  sortOptions?: readonly { slug: string; label: string }[];
  /**
   * Authoritative result count from the page that owns the listing grid.
   * When provided, the "Show N" button mirrors the page result total exactly
   * so the bar and the grid can never disagree.
   */
  countOverride?: number | null;
  /** Noun used in the count button, e.g. "properties" | "developers". */
  countNoun?: string;
  /** Shows the active-filter chip row + Reset control under the bar. */
  showTiers?: boolean;
  showActiveSummary?: boolean;
}

export default function PropertySearchBar({
  value,
  onChange,
  onSubmit,
  dark = false,
  className = "",
  typewriterPhrases,
  onConsultation,
  onSellSelected,
  showSort = false,
  sortOptions = SORT_OPTIONS,
  showTiers = false,
  countOverride,
  countNoun = "properties",
  showActiveSummary = false,
}: Props) {


  const [internal, setInternal] = useState<PropertySearch>(value ?? EMPTY_SEARCH);
  const f = value ?? internal;
  const [moreOpen, setMoreOpen] = useState(false);
  const [draft, setDraft] = useState<PropertySearch>(f);
  const [qFocused, setQFocused] = useState(false);
  const animatedPlaceholder = useTypewriter(typewriterPhrases ?? [], {
    paused: !typewriterPhrases?.length || qFocused || !!f.q,
  });


  useEffect(() => {
    if (value) setInternal(value);
  }, [value]);

  const set = (patch: Partial<PropertySearch>) => {
    const next = { ...f, ...patch };
    setInternal(next);
    onChange?.(next);
  };

  const toggleIn = <T extends string>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const { count: liveCount } = usePropertyCount(f);
  const count = countOverride !== undefined ? countOverride : liveCount;

  const { areaUnit } = useAreaUnit();
  const cur = currencyFor(f.country);
  const extras = countExtraFilters(f);
  /* Both rows share the same lg column count so every card edge lines up. */
  const GRID_KEY = showSort ? "27" : "24";
  const KEYWORD_SPAN = showSort ? "jj-sspan-12" : "jj-sspan-9";

  const setAreaUnit = (unit: AreaUnit) => setAreaUnitGlobal(unit);


  const locationLabel = useMemo(() => {
    if (f.areasInclude.length)
      return `${f.areasInclude.length} area${f.areasInclude.length > 1 ? "s" : ""}${
        f.areasExclude.length ? ` · −${f.areasExclude.length}` : ""
      }`;
    if (f.areasExclude.length) return `All except ${f.areasExclude.length}`;
    if (f.region) return getRegions(f.country).find((r) => r.slug === f.region)?.name ?? "Location";
    const c = GEO_COUNTRIES.find((x) => x.slug === f.country);
    return c ? (c.slug === "uae" ? "UAE — all areas" : c.name) : "Location";
  }, [f]);

  const typeLabel = f.types.length
    ? f.types.length === 1
      ? f.types[0]
      : `${f.category === "commercial" ? "Commercial" : "Residential"} · ${f.types.length}`
    : f.category === "commercial"
      ? "Commercial"
      : "Type";

  const bedLabel =
    f.beds.length || f.baths.length
      ? [f.beds.join("/"), f.baths.length ? `${f.baths.join("/")} bath` : ""].filter(Boolean).join(" · ")
      : "Beds";

  const priceLabel =
    f.priceMin != null || f.priceMax != null
      ? `${f.priceMin != null ? compactPrice(f.priceMin, cur) : "Any"} – ${
          f.priceMax != null ? compactPrice(f.priceMax, cur) : "Any"
        }`
      : `Price`;

  const statusLabel = f.statuses.length
    ? f.statuses.map((s) => PROJECT_STATUSES.find((x) => x.slug === s)?.label ?? s).join(", ")
    : "Status";

  const numInput = "h-10 w-full rounded-lg px-3 text-sm bg-[#FDFBF7] border border-[#B89555]/35 outline-none";

  /** Every filter currently narrowing the results, each individually clearable. */
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: Partial<PropertySearch> }[] = [];
    if (f.q.trim()) chips.push({ key: "q", label: `“${f.q.trim()}”`, clear: { q: "" } });
    if (f.category === "commercial")
      chips.push({ key: "category", label: "Commercial", clear: { category: "residential", types: [] } });
    if (f.areasInclude.length || f.areasExclude.length || f.region)
      chips.push({ key: "loc", label: locationLabel, clear: { areasInclude: [], areasExclude: [], region: null } });
    for (const t of f.types) chips.push({ key: `type-${t}`, label: t, clear: { types: f.types.filter((x) => x !== t) } });
    for (const b of f.beds) chips.push({ key: `bed-${b}`, label: `${b} bed`, clear: { beds: f.beds.filter((x) => x !== b) } });
    for (const b of f.baths) chips.push({ key: `bath-${b}`, label: `${b} bath`, clear: { baths: f.baths.filter((x) => x !== b) } });
    if (f.priceMin != null || f.priceMax != null) chips.push({ key: "price", label: priceLabel, clear: { priceMin: null, priceMax: null } });
    for (const s of f.statuses)
      chips.push({
        key: `status-${s}`,
        label: PROJECT_STATUSES.find((x) => x.slug === s)?.label ?? s,
        clear: { statuses: f.statuses.filter((x) => x !== s) },
      });
    if (f.developerTier) chips.push({ key: "tier", label: TIER_LABELS[f.developerTier as DeveloperTier] || "Tier", clear: { developerTier: null } });
    for (const l of f.labels) chips.push({ key: `label-${l}`, label: l, clear: { labels: f.labels.filter((x) => x !== l) } });
    if (f.developer) chips.push({ key: "dev", label: f.developer, clear: { developer: null } });
    if (f.sizeMin != null || f.sizeMax != null) chips.push({ key: "size", label: "Size", clear: { sizeMin: null, sizeMax: null } });
    return chips;
  }, [f, locationLabel, priceLabel]);


  return (
    <div data-property-search-bar className={`grid gap-1.5 lg:block ${className}`} style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
      {/* Row 1 — equal-height purpose, keyword, and detached consultation controls */}
      <div className={`contents lg:grid lg:grid-cols-[minmax(14.5rem,auto)_minmax(0,1fr)] lg:items-stretch lg:gap-2 lg:mb-2`} data-search-grid={GRID_KEY}>
        <div
          className="order-1 lg:order-none col-span-2 flex h-10 lg:h-16 min-w-0 lg:col-span-1 jj-sspan-6 items-center rounded-lg overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]"

          data-surface={dark ? "dark" : "light"}
          data-search-segment
          style={{
            backgroundImage: dark ? DARK_SURFACE : undefined,
            background: dark ? undefined : "#F2EBDC",
            backdropFilter: dark ? "blur(10px)" : undefined,
            border: dark ? "1.5px solid rgba(255,255,255,0.44)" : "1.5px solid rgba(184,149,85,0.58)",
          }}
        >
          {PURPOSES.map((p, index) => (
            <button
              key={p.slug}
              type="button"
              data-no-contrast-guard
              data-surface={f.purpose === p.slug ? "emerald" : undefined}
              onClick={() => {
                if (p.slug === "sell") {
                  set({ purpose: p.slug });
                  onSellSelected?.();
                  return;
                }
                set({ purpose: p.slug });
              }}
                className="allow-white relative h-full min-w-0 flex-1 px-2 lg:px-4 text-[12.5px] lg:text-sm font-semibold whitespace-nowrap rounded-none"
              style={
                f.purpose === p.slug
                  ? { backgroundImage: EMERALD_PAIR, color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", whiteSpace: "nowrap", borderRadius: 0 }
                  : {
                      color: dark ? "#FFFFFF" : "#1A1A1A",
                      WebkitTextFillColor: dark ? "#FFFFFF" : undefined,
                      whiteSpace: "nowrap",
                      borderRadius: 0,
                    }
              }
            >
              {p.label}
              {index < PURPOSES.length - 1 ? (
                 <span aria-hidden="true" className="absolute right-0 top-1/2 h-5 w-px -translate-y-1/2 bg-white/45" />
              ) : null}
            </button>
          ))}
        </div>

        <div
          className={`order-10 relative flex items-center gap-2 h-12 lg:h-16 px-3 lg:px-3.5 rounded-lg min-w-0 col-span-2 lg:order-none lg:col-span-1 ${KEYWORD_SPAN}`}
          data-surface={dark ? "dark" : "light"}
          data-search-segment
          style={{
            backgroundImage: dark ? DARK_SURFACE : undefined,
            background: dark ? undefined : "#FDFBF7",
            backdropFilter: dark ? "blur(10px)" : undefined,
            border: `1.5px solid ${dark ? "rgba(255,255,255,0.44)" : "rgba(184,149,85,0.58)"}`,
          }}
        >
          <Search className="w-4 h-4 shrink-0 opacity-80" style={{ color: dark ? "#FFF" : "#1A1A1A" }} />
          {!f.q && !qFocused && typewriterPhrases?.length ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-8 lg:left-10 top-1/2 -translate-y-1/2 text-[12.5px] lg:text-base whitespace-nowrap overflow-hidden"
              style={{
                color: dark ? "rgba(255,255,255,0.82)" : "rgba(26,26,26,0.6)",
                WebkitTextFillColor: dark ? "rgba(255,255,255,0.82)" : undefined,
                maxWidth: "calc(100% - 48px)",
              }}
            >
              {animatedPlaceholder}
              <span className="jj-type-caret">|</span>
            </span>
          ) : null}
          <input
            value={f.q}
            onChange={(e) => set({ q: e.target.value })}
            onFocus={() => setQFocused(true)}
            onBlur={() => setQFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit(f)}
            placeholder={typewriterPhrases?.length ? "" : "Project, developer, community or keyword"}
            data-no-contrast-guard
            className="flex-1 min-w-0 bg-transparent text-[12.5px] lg:text-base outline-none"
            style={{
              color: dark ? "#FFFFFF" : "#1A1A1A",
              WebkitTextFillColor: dark ? "#FFFFFF" : undefined,
              caretColor: dark ? "#FFFFFF" : "#1A1A1A",
            }}
          />
          {f.q ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                const next = { ...f, q: "" };
                setInternal(next);
                onChange?.(next);
                onSubmit(next);
              }}
              data-no-contrast-guard
              className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: dark ? "rgba(255,255,255,0.14)" : "rgba(184,149,85,0.16)" }}
            >
              <X className="w-3.5 h-3.5" style={{ color: dark ? "#FFFFFF" : "#1A1A1A" }} />
            </button>
          ) : null}
        </div>

        {showTiers && (
          <div className="order-2 lg:order-none flex h-10 lg:h-16 min-w-0 items-center overflow-hidden rounded-lg col-span-1 jj-sspan-3">
            <Seg
              label={f.developerTier ? (TIER_LABELS[f.developerTier as DeveloperTier] || "Tier") : "All Tiers"}
              active={!!f.developerTier}
              icon={<Crown className="w-4 h-4" />}
              dark={dark}
              spanClass="w-full border-0 rounded-none h-full"
            >
              <div className="p-2 grid grid-cols-1 gap-1">
                <button
                  onClick={() => set({ developerTier: null })}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-[#F2EBDC] transition-colors"
                  style={{ background: !f.developerTier ? "#F2EBDC" : "transparent" }}
                >
                  All Tiers
                </button>
                {Object.entries(TIER_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => set({ developerTier: value })}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-[#F2EBDC] transition-colors"
                    style={{ background: f.developerTier === value ? "#F2EBDC" : "transparent" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Seg>
          </div>
        )}
        <div
          className="order-2 lg:order-none flex h-10 lg:h-16 min-w-0 items-center overflow-hidden rounded-lg col-span-1 jj-sspan-3"
          data-search-utility-controls
          data-surface={dark ? "dark" : "light"}
          style={{
            backgroundImage: dark ? DARK_SURFACE : undefined,
            background: dark ? undefined : "#FDFBF7",
            backdropFilter: dark ? "blur(10px)" : undefined,
            border: `1.5px solid ${dark ? "rgba(255,255,255,0.44)" : "rgba(184,149,85,0.58)"}`,
          }}
        >
          <InlineCurrencySelect dark={dark} />
        </div>

        {/* Mobile/tablet: area unit sits beside currency. Desktop keeps the aligned utility pair. */}
        <div
          className="contents lg:grid lg:gap-2 lg:col-span-2 lg:order-none jj-sspan-6 min-w-0"
          style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
        >
          {/* Keeps the sq ft / sq m pair in the same column as "Show N" below. */}
          {!onConsultation ? <div aria-hidden="true" className="hidden lg:block" /> : null}
          <div
            className={`order-3 lg:order-none flex h-10 lg:h-16 w-full justify-self-stretch min-w-0 items-stretch overflow-hidden rounded-lg`}
            data-search-utility-controls
            data-surface={dark ? "dark" : "light"}
            style={{
              backgroundImage: dark ? DARK_SURFACE : undefined,
              background: dark ? undefined : "#FDFBF7",
              backdropFilter: dark ? "blur(10px)" : undefined,
              border: `1.5px solid ${dark ? "rgba(255,255,255,0.44)" : "rgba(184,149,85,0.58)"}`,
            }}
          >
            {(["sqft", "sqm"] as const).map((unit, i) => {
              const on = areaUnit === unit;
              return (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setAreaUnit(unit)}
                  aria-pressed={on}
                  data-no-contrast-guard
                  data-surface={on ? "emerald" : undefined}
                  className="relative min-w-0 flex-1 flex items-center justify-center text-[11.5px] lg:text-sm font-semibold leading-none tracking-[0.04em] whitespace-nowrap transition-colors duration-200"
                  style={{
                    backgroundImage: on ? EMERALD_PAIR : undefined,
                    background: on ? undefined : "transparent",
                    borderRadius: 0,
                    color: on ? "#FFFFFF" : dark ? "#FFFFFF" : "#1A1A1A",
                    WebkitTextFillColor: on ? "#FFFFFF" : dark ? "#FFFFFF" : undefined,
                  }}
                >
                  {unit === "sqft" ? "sq ft" : "sq m"}
                  {i === 0 ? (
                    <span aria-hidden="true" className="absolute right-0 top-1/2 h-5 w-px -translate-y-1/2 bg-white/45" />
                  ) : null}
                </button>
              );
            })}
          </div>



          {onConsultation ? (
            <button
              type="button"
              onClick={onConsultation}
              data-surface="emerald"
              data-search-segment
              data-desktop-consultation
              className="jj-emerald-action jj-shine-cta relative hidden lg:inline-flex h-16 w-full items-center justify-center gap-1 overflow-hidden rounded-lg px-1.5 text-xs font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.24)]"
              style={{ backgroundImage: EMERALD_PAIR }}
            >
              <span className="text-[11px] leading-tight tracking-tight text-center whitespace-nowrap">Consultation</span>
            </button>
          ) : null}
        </div>

      </div>


      {/* Row 2 — segments */}
      <div className={`contents lg:grid lg:gap-2`} data-search-grid={GRID_KEY}>
        <div className="order-4 lg:order-none col-span-1 jj-sspan-6 min-w-0">
          <Seg label={locationLabel} active={!!(f.areasInclude.length || f.areasExclude.length || f.region)} dark={dark} wide icon={<MapPin className="w-4 h-4 opacity-70" />}>
            <AreaIncludeExclude
              country={f.country}
              region={f.region}
              include={f.areasInclude}
              exclude={f.areasExclude}
              onCountryChange={(slug) => set({ country: slug, region: null, areasInclude: [], areasExclude: [] })}
              onChange={({ include, exclude, region }) =>
                set({
                  areasInclude: include,
                  areasExclude: exclude,
                  ...(region !== undefined ? { region } : {}),
                })
              }
            />
          </Seg>
        </div>

        <Seg label={typeLabel} active={f.types.length > 0} dark={dark} spanClass="order-5 lg:order-none jj-sspan-3">
          <div className="p-3">
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl mb-2" style={{ background: "#F2EBDC" }}>
              {(Object.keys(CATEGORY_TYPES) as SearchCategory[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set({ category: c, types: [] })}
                  data-surface={f.category === c ? "emerald" : "light"}
                  className="h-8 rounded-lg text-xs font-semibold capitalize"
                  style={f.category === c ? { backgroundImage: EMERALD_PAIR, color: "#FFF" } : { color: "#1A1A1A" }}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-[240px] overflow-y-auto">
              {CATEGORY_TYPES[f.category].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set({ types: toggleIn(f.types, t) })}
                  data-surface={f.types.includes(t) ? "emerald" : "light"}
                  className="h-9 rounded-full text-xs font-medium"
                  style={
                    f.types.includes(t)
                      ? { backgroundImage: EMERALD_PAIR, color: "#FFF" }
                      : { background: "#FDFBF7", color: "#1A1A1A", border: "1px solid rgba(184,149,85,0.35)" }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-3">
              <button type="button" className="text-xs font-semibold opacity-70" onClick={() => set({ types: [] })}>
                Reset
              </button>
            </div>
          </div>
        </Seg>

        <Seg label={bedLabel} active={f.beds.length > 0 || f.baths.length > 0} dark={dark} spanClass="order-6 lg:order-none jj-sspan-3">
          <div className="p-3 space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider opacity-60 mb-1.5">Bedrooms</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {BEDS.map((b) => (
                  <Chip key={b} circle={b.length <= 2} on={f.beds.includes(b)} onClick={() => set({ beds: toggleIn(f.beds, b) })}>
                    {b}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider opacity-60 mb-1.5">Bathrooms</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {BATHS.map((b) => (
                  <Chip key={b} circle={b.length <= 2} on={f.baths.includes(b)} onClick={() => set({ baths: toggleIn(f.baths, b) })}>
                    {b}
                  </Chip>
                ))}
              </div>

            </div>
          </div>
        </Seg>

        <Seg label={priceLabel} active={f.priceMin != null || f.priceMax != null} dark={dark} spanClass="order-7 lg:order-none jj-sspan-3">
          <div className="p-3 grid grid-cols-2 gap-2">
            <input
              className={numInput}
              inputMode="numeric"
              placeholder="Min"
              value={f.priceMin ?? ""}
              onChange={(e) => set({ priceMin: e.target.value ? Number(e.target.value) : null })}
            />
            <input
              className={numInput}
              inputMode="numeric"
              placeholder="Max"
              value={f.priceMax ?? ""}
              onChange={(e) => set({ priceMax: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </Seg>

        <Seg label={statusLabel} active={f.statuses.length > 0} dark={dark} spanClass="order-8 lg:order-none jj-sspan-3">
          <div className="p-3 flex flex-wrap gap-1.5">
            {PROJECT_STATUSES.map((s) => (
              <Chip
                key={s.slug}
                on={f.statuses.includes(s.slug)}
                onClick={() => set({ statuses: toggleIn(f.statuses, s.slug) })}
              >
                {s.label}
              </Chip>
            ))}
          </div>
        </Seg>

        {showSort ? (
          <Seg
            label={sortOptions.find((s) => s.slug === f.sort)?.label ?? "Sort"}
            active
            dark={dark}
            spanClass="jj-sspan-3"
            icon={<ArrowUpDown className="w-4 h-4 opacity-70" />}
          >
            <div className="p-1.5">
              {sortOptions.map((s) => {
                const on = f.sort === s.slug;
                return (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => set({ sort: s.slug as PropertySearch["sort"] })}
                    data-surface={on ? "emerald" : "light"}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#F7F2EA]"
                    style={on ? { backgroundImage: EMERALD_PAIR, color: "#FFFFFF" } : { color: "#1A1A1A" }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </Seg>
        ) : null}



        <div
          className="contents lg:grid lg:gap-2 lg:col-span-2 jj-sspan-6 min-w-0"
          style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
        >
          <button
            type="button"
            onClick={() => {
              setDraft(f);
              setMoreOpen(true);
            }}
            className={`${SEG} order-9 lg:order-none`}
            data-no-contrast-guard
            data-search-segment
            style={{
              backgroundImage: dark ? DARK_SURFACE : undefined,
              background: dark ? undefined : "#FDFBF7",
              backdropFilter: dark ? "blur(10px)" : undefined,
              border: `1.5px solid ${dark ? "rgba(255,255,255,0.44)" : "rgba(184,149,85,0.58)"}`,
              color: dark ? "#FFFFFF" : "#1A1A1A",
              WebkitTextFillColor: dark ? "#FFFFFF" : undefined,
            }}

          >
            <span className="flex items-center gap-2 min-w-0">
              <SlidersHorizontal className="w-4 h-4 opacity-70" />
              <span className="truncate" style={{ whiteSpace: "nowrap" }}>
                More{extras ? ` (${extras})` : ""}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSubmit(f)}
             data-surface="emerald"
             data-search-segment
            className="order-11 lg:order-none col-span-2 lg:col-span-1 h-12 lg:h-16 w-full rounded-lg text-[13px] lg:text-sm font-semibold text-white px-2 whitespace-nowrap"
            style={{ backgroundImage: EMERALD_PAIR }}
          >
            {count == null ? "Search" : (
              <>
                Show {count.toLocaleString()}
                <span className="hidden xl:inline"> {countNoun}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active filter summary — tells the visitor exactly what is filtering
          the results, and gives one clear reset. */}
      {showActiveSummary && activeChips.length > 0 ? (
        <div
          className="order-12 col-span-2 lg:col-span-none mt-2 flex flex-wrap items-center gap-1.5"
          data-active-filter-summary
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: dark ? "rgba(255,255,255,0.72)" : "rgba(26,26,26,0.6)" }}
          >
            Active
          </span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => {
                const next = { ...f, ...chip.clear };
                setInternal(next);
                onChange?.(next);
                onSubmit(next);
              }}
              data-no-contrast-guard
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11.5px] font-semibold"
              style={{
                backgroundImage: EMERALD_PAIR,
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.32)",
              }}
            >
              {chip.label}
              <span aria-hidden="true" style={{ opacity: 0.8 }}>×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const next = { ...EMPTY_SEARCH, purpose: f.purpose, country: f.country, sort: f.sort, view: f.view };
              setInternal(next);
              onChange?.(next);
              onSubmit(next);
            }}
            data-no-contrast-guard
            className="inline-flex items-center h-7 px-2.5 rounded-full text-[11.5px] font-semibold"
            style={{
              background: dark ? "rgba(255,255,255,0.10)" : "#FDFBF7",
              color: dark ? "#FFFFFF" : "#1A1A1A",
              WebkitTextFillColor: dark ? "#FFFFFF" : undefined,
              border: `1px solid ${dark ? "rgba(255,255,255,0.42)" : "rgba(184,149,85,0.45)"}`,
            }}
          >
            Reset all filters
          </button>
        </div>
      ) : null}



      {/* More filters — the SAME full filter screen as the header filter */}
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent
           data-surface="light"
           data-search-dropdown
          className="max-w-[min(96vw,44rem)] p-0 gap-0 z-[80]"
          style={{ background: "#FFFFFF", border: "1px solid rgba(184,149,85,0.35)", color: "#1A1A1A" }}
        >
          <div className="px-4 pt-4">
            <h2 className="text-lg font-semibold">All filters</h2>
          </div>
          <MoreFiltersBody
            draft={draft}
            setDraft={setDraft}
            onApply={(applied) => {
              setInternal(applied);
              onChange?.(applied);
              setMoreOpen(false);
              requestAnimationFrame(() => onSubmit(applied));
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MoreFiltersBody({
  draft,
  setDraft,
  onApply,
}: {
  draft: PropertySearch;
  setDraft: (v: PropertySearch) => void;
  onApply: (v: PropertySearch) => void;
}) {
  const { count } = usePropertyCount(draft);
  return (
    <PropertyFilterScreen
      value={draft}
      onChange={setDraft}
      count={count}
      onReset={() => setDraft({ ...EMPTY_SEARCH, purpose: draft.purpose, country: draft.country })}
      onApply={() => onApply(draft)}
    />
  );
}
