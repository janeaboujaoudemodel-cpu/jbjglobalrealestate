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
import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, CalendarCheck, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useTypewriter } from "@/hooks/useTypewriter";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getRegions } from "@/data/geography";
import { GEO_COUNTRIES } from "@/data/geography";
import AreaIncludeExclude from "./AreaIncludeExclude";
import PropertyFilterScreen from "./PropertyFilterScreen";
import ConsultationRequestForm from "@/components/ConsultationRequestForm";
import CurrencySwitcher from "@/components/CurrencySwitcher";
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
  "flex items-center justify-between gap-2 h-14 sm:h-16 px-3 rounded-lg text-sm font-medium tracking-tight min-w-0 w-full transition-colors";

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
            border: `1px solid ${dark ? "rgba(255,255,255,0.34)" : "rgba(184,149,85,0.30)"}`,
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
}: Props) {

  const [internal, setInternal] = useState<PropertySearch>(value ?? EMPTY_SEARCH);
  const f = value ?? internal;
  const [moreOpen, setMoreOpen] = useState(false);
  const [consultOpen, setConsultOpen] = useState(false);
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

  const { count } = usePropertyCount(f);
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

  return (
    <div data-property-search-bar className={`w-full ${className}`}>
      {/* Row 1 — equal-height purpose, keyword, and detached consultation controls */}
      <div className={`grid grid-cols-1 sm:grid-cols-[minmax(14.5rem,auto)_minmax(0,1fr)] items-stretch gap-2 mb-2`} data-search-grid={GRID_KEY}>
        <div
          className="flex h-14 sm:h-16 min-w-0 jj-sspan-6 items-center rounded-lg overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]"

          data-surface={dark ? "dark" : "light"}
          data-search-segment
          style={{
            backgroundImage: dark ? DARK_SURFACE : undefined,
            background: dark ? undefined : "#F2EBDC",
            backdropFilter: dark ? "blur(10px)" : undefined,
            border: dark ? "1px solid rgba(255,255,255,0.34)" : "1px solid rgba(184,149,85,0.3)",
          }}
        >
          {PURPOSES.map((p, index) => (
            <button
              key={p.slug}
              type="button"
              data-no-contrast-guard
              onClick={() => {
                if (p.slug === "sell") {
                  set({ purpose: p.slug });
                  onSellSelected?.();
                  return;
                }
                set({ purpose: p.slug });
              }}
                className="relative h-full min-w-0 flex-1 px-3 sm:px-4 text-sm font-semibold whitespace-nowrap rounded-none"
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
          className={`relative flex items-center gap-2 h-14 sm:h-16 px-3.5 rounded-lg min-w-0 ${KEYWORD_SPAN}`}
          data-surface={dark ? "dark" : "light"}
          data-search-segment
          style={{
            backgroundImage: dark ? DARK_SURFACE : undefined,
            background: dark ? undefined : "#FDFBF7",
            backdropFilter: dark ? "blur(10px)" : undefined,
            border: `1px solid ${dark ? "rgba(255,255,255,0.34)" : "rgba(184,149,85,0.30)"}`,
          }}
        >
          <Search className="w-4 h-4 shrink-0 opacity-80" style={{ color: dark ? "#FFF" : "#1A1A1A" }} />
          {!f.q && !qFocused && typewriterPhrases?.length ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm sm:text-base whitespace-nowrap overflow-hidden"
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
            className="flex-1 min-w-0 bg-transparent text-sm sm:text-base outline-none"
            style={{
              color: dark ? "#FFFFFF" : "#1A1A1A",
              WebkitTextFillColor: dark ? "#FFFFFF" : undefined,
              caretColor: dark ? "#FFFFFF" : "#1A1A1A",
            }}
          />
        </div>

        <div
          className="flex h-14 sm:h-16 min-w-0 items-center overflow-hidden rounded-lg jj-sspan-3"
          data-search-utility-controls
          data-surface={dark ? "dark" : "light"}
          style={{
            backgroundImage: dark ? DARK_SURFACE : undefined,
            background: dark ? undefined : "#FDFBF7",
            backdropFilter: dark ? "blur(10px)" : undefined,
            border: `1px solid ${dark ? "rgba(255,255,255,0.34)" : "rgba(184,149,85,0.30)"}`,
          }}
        >
          <InlineCurrencySelect dark={dark} />
        </div>

        {/* sq ft / sq m sits above "More" and Consultation above "Show N" — same widths */}
        <div className="grid grid-cols-2 gap-2 sm:col-span-2 jj-sspan-6 min-w-0">
          <div
            className="flex h-14 sm:h-16 min-w-0 flex-col justify-center overflow-hidden rounded-lg px-2"
            data-search-utility-controls
            data-surface={dark ? "dark" : "light"}
            style={{
              backgroundImage: dark ? DARK_SURFACE : undefined,
              background: dark ? undefined : "#FDFBF7",
              backdropFilter: dark ? "blur(10px)" : undefined,
              border: `1px solid ${dark ? "rgba(255,255,255,0.34)" : "rgba(184,149,85,0.30)"}`,
            }}
          >
            <span
              className="text-[9px] uppercase tracking-[0.14em] whitespace-nowrap"
              style={{ color: dark ? "rgba(255,255,255,0.68)" : "rgba(26,26,26,0.62)" }}
            >
              Area unit
            </span>
            <div className="flex min-w-0 items-center gap-3">
              {(["sqft", "sqm"] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setAreaUnit(unit)}
                  aria-pressed={areaUnit === unit}
                  data-no-contrast-guard
                  className="min-w-0 bg-transparent p-0 text-[13px] font-semibold whitespace-nowrap"
                  style={{
                    borderRadius: 0,
                    color:
                      areaUnit === unit
                        ? dark
                          ? "#FFFFFF"
                          : "#042C1C"
                        : dark
                          ? "rgba(255,255,255,0.55)"
                          : "rgba(26,26,26,0.50)",
                    borderBottom:
                      areaUnit === unit
                        ? `2px solid ${dark ? "#FFFFFF" : "#042C1C"}`
                        : "2px solid transparent",
                  }}
                >
                  {unit === "sqft" ? "sq ft" : "sq m"}
                </button>
              ))}
            </div>
          </div>


          {onConsultation ? (
            <button
              type="button"
              onClick={() => setConsultOpen(true)}
              data-surface="emerald"
              data-search-segment
              className="jj-emerald-action jj-shine-cta relative overflow-hidden inline-flex h-14 sm:h-16 w-full items-center justify-center gap-1 rounded-lg px-1.5 text-xs font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.24)]"
              style={{ backgroundImage: EMERALD_PAIR }}
            >
              <CalendarCheck className="w-4 h-4 shrink-0" />
              <span className="text-[11px] leading-tight tracking-tight text-center whitespace-nowrap">Consultation</span>
            </button>
          ) : null}
        </div>

      </div>


      {/* Row 2 — segments */}
      <div className={`grid grid-cols-2 md:grid-cols-3 gap-2`} data-search-grid={GRID_KEY}>
        <div className="col-span-2 jj-sspan-6 min-w-0">
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

        <Seg label={typeLabel} active={f.types.length > 0} dark={dark} spanClass="jj-sspan-3">
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

        <Seg label={bedLabel} active={f.beds.length > 0 || f.baths.length > 0} dark={dark} spanClass="jj-sspan-3">
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

        <Seg label={priceLabel} active={f.priceMin != null || f.priceMax != null} dark={dark} spanClass="jj-sspan-3">
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

        <Seg label={statusLabel} active={f.statuses.length > 0} dark={dark} spanClass="jj-sspan-3">
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



        <div className="grid grid-cols-2 gap-2 col-span-2 jj-sspan-6 min-w-0">
          <button
            type="button"
            onClick={() => {
              setDraft(f);
              setMoreOpen(true);
            }}
            className={SEG}
            data-no-contrast-guard
            data-search-segment
            style={{
              backgroundImage: dark ? DARK_SURFACE : undefined,
              background: dark ? undefined : "#FDFBF7",
              backdropFilter: dark ? "blur(10px)" : undefined,
              border: `1px solid ${dark ? "rgba(255,255,255,0.34)" : "rgba(184,149,85,0.30)"}`,
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
            className="h-14 sm:h-16 w-full rounded-lg text-sm font-semibold text-white px-2 whitespace-nowrap"
            style={{ backgroundImage: EMERALD_PAIR }}
          >
            {count == null ? "Search" : `Show ${count.toLocaleString()}`}
          </button>
        </div>
      </div>

      {/* Free consultation — same in-page frame + styling as the "More" screen */}
      <Dialog open={consultOpen} onOpenChange={setConsultOpen}>
        <DialogContent
          data-surface="light"
          data-search-dropdown
          className="max-w-[min(96vw,44rem)] max-h-[88vh] overflow-y-auto p-0 gap-0 z-[80]"
          style={{ background: "#FFFFFF", border: "1px solid rgba(184,149,85,0.35)", color: "#1A1A1A" }}
        >
          <div className="px-4 pt-4">
            <h2 className="text-lg font-semibold">Free consultation</h2>
          </div>
          <div className="p-4">
            <ConsultationRequestForm showHeader={false} formSource="hero_search_bar" />
          </div>
        </DialogContent>
      </Dialog>

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
              onSubmit(applied);
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
