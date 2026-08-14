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
import { ArrowUpDown, BedDouble, Building2, Check, ChevronDown, CircleDot, Crown, Home, MapPin, Minus, Search, SlidersHorizontal, Tag, X } from "lucide-react";
import { useTypewriter } from "@/hooks/useTypewriter";
import { useNavigate } from "react-router-dom";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getRegions } from "@/data/geography";
import { GEO_COUNTRIES } from "@/data/geography";
import AreaIncludeExclude from "./AreaIncludeExclude";
import DeveloperIncludeExclude from "./DeveloperIncludeExclude";
import FilterMultiSelect from "./FilterMultiSelect";
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
  sanitizeSearchForPurpose,
  statusOptionsFor,
  SORT_OPTIONS,
  sortOptionsFor,

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
  "flex items-center justify-between gap-1 h-11 lg:h-16 px-2.5 lg:px-2 rounded-lg text-[13px] lg:text-[12px] font-medium tracking-tight min-w-0 w-full transition-colors overflow-visible shadow-none";


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
  const [open, setOpen] = useState(false);
  // PASS 339 — phone layout gets a centred, near-full-width sheet.
  const [isPhoneLayout, setIsPhoneLayout] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023.98px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023.98px)");
    const sync = () => setIsPhoneLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);


  // PASS 339 — the panel is anchored to THIS button. A page scroll dismisses it
  // so it can never detach and float over the page (PASS 301), but a scroll or
  // tap that happens INSIDE the panel must never close it: on phones the panel
  // is a scrollable sheet, and the old capture-phase listener swallowed every
  // interaction ("I click a field and it just closes").
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const t = e.target as Node | null;
      if (t && t instanceof Element && t.closest("[data-search-dropdown]")) return;
      setOpen(false);
    };
    window.addEventListener("scroll", close, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", close, { capture: true } as EventListenerOptions);
  }, [open]);


  // Long active labels ("Emaar Properties", "My Properties") shrink to fit their
  // box instead of being cropped. Never split a word.
  const fit = label.length > 18 ? "10px" : label.length > 13 ? "11px" : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          data-search-segment
          className={`${SEG} ${spanClass ?? ""}`}
          data-no-contrast-guard
          style={{
            backgroundImage: dark ? DARK_SURFACE : undefined,
            background: dark ? undefined : "#FFFFFF",
            backdropFilter: dark ? "blur(10px)" : undefined,
            border: `1.5px solid ${dark ? "rgba(255,255,255,0.44)" : "var(--jj-seg-hairline, rgba(184,149,85,0.58))"}`,
            color: ink,
            WebkitTextFillColor: dark ? "#FFFFFF" : undefined,
          }}
        >

          {/* PASS 330/331 — one geometry on EVERY device: a fixed 3-column track
              [icon | label | chevron]. Desktop uses slightly tighter side
              tracks so long labels ("Developers", "Status") never crop while
              every icon and chevron still shares one inset. */}
          <span className="grid w-full min-w-0 grid-cols-[18px_minmax(0,1fr)_18px] lg:grid-cols-[15px_minmax(0,1fr)_13px] items-center gap-0">
            {icon ? (
              <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>
            ) : (
              <span aria-hidden="true" className="inline-flex" />
            )}
            <span
              className="min-w-0 leading-none text-center lg:text-[11px] lg:tracking-[-0.01em] lg:px-0.5"
              style={{
                color: active ? ink : muted,
                WebkitTextFillColor: active ? ink : muted,
                whiteSpace: "nowrap",
                wordBreak: "keep-all",
                overflowWrap: "normal",
                hyphens: "none",
                fontSize: fit,
                textOverflow: "clip",
              }}
            >

              {label}
            </span>
            <ChevronDown className="h-3.5 w-3.5 lg:h-3 lg:w-3 shrink-0 opacity-70 col-start-3 justify-self-end" />
          </span>



        </button>
      </PopoverTrigger>
      <PopoverContent
        align={isPhoneLayout ? "center" : "start"}
        side="bottom"
        sideOffset={8}
        avoidCollisions={isPhoneLayout}
        collisionPadding={10}
        data-surface="light"
        data-search-dropdown
        onOpenAutoFocus={(e) => {
          // Phones must not scroll the page to focus the first control.
          if (isPhoneLayout) e.preventDefault();
        }}
        className={`${wide ? "w-auto max-w-[94vw]" : "w-auto max-w-[92vw]"} max-h-[52vh] overflow-y-auto overscroll-contain p-0 z-[70]`}
        style={{
          background: "#FFFFFF",
          border: "1px solid var(--jj-panel-hairline, rgba(184,149,85,0.35))",
          color: "#1A1A1A",
        }}
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
  sortOptions,
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

  const navigate = useNavigate();
  const goSell = () => {
    if (onSellSelected) onSellSelected();
    else navigate("/list-property?purpose=sale&mode=manual");
  };

  const set = (patch: Partial<PropertySearch>) => {
    const next = sanitizeSearchForPurpose({ ...f, ...patch });
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
  /* Both rows share the same lg column count so every card edge lines up.
     Column contract (PASS 281 — one grid, both rows, zero drift):
       Row 2: area(6) type(3) beds(3) price(3) status(3) [sort(3)] More(3) Show(3)
       Row 1: purposes(6) keyword(rest) [tiers(3)] currency(3) sqft(3)[+CTA(3)]
     → purposes sits over "UAE — all areas", keyword ends on the Status edge,
       tiers sits over Sort, currency over More, sq ft / sq m over "Show N". */
  const GRID_TOTAL = showSort ? 30 : 27;
  const GRID_KEY = String(GRID_TOTAL);
  const UTILITY_COLS = onConsultation ? 6 : 3;
  const KEYWORD_COLS = GRID_TOTAL - 9 - 3 - UTILITY_COLS;
  const KEYWORD_SPAN = `jj-sspan-${KEYWORD_COLS}`;
  const ROW1_UTILITY_SPAN = `jj-sspan-${UTILITY_COLS}`;
  /* PASS 298 — row 2 opens with three 2-col segments so they sit exactly under
     Buy (location), Rent (developers) and Sell (tiers). */
  const AREA_SPAN = "jj-sspan-3";
  const ROW2_UTILITY_SPAN = "jj-sspan-6";
  const dividerColor = dark ? "rgba(255,255,255,0.45)" : "rgba(184,149,85,0.62)";

  const setAreaUnit = (unit: AreaUnit) => setAreaUnitGlobal(unit);


  const locationLabel = useMemo(() => {
    if (f.areasInclude.length)
      return `${f.areasInclude.length} area${f.areasInclude.length > 1 ? "s" : ""}${
        f.areasExclude.length ? ` · −${f.areasExclude.length}` : ""
      }`;
    if (f.areasExclude.length) return `All except ${f.areasExclude.length}`;
    if (f.region) return getRegions(f.country).find((r) => r.slug === f.region)?.name ?? "Location";
    const c = GEO_COUNTRIES.find((x) => x.slug === f.country);
    return c ? (c.slug === "uae" ? "UAE" : c.name) : "Location";
  }, [f]);

  const developersLabel = f.developersInclude.length
    ? f.developersInclude.length === 1
      ? f.developersInclude[0]
      : `${f.developersInclude.length} developers`
    : f.developersExclude.length
      ? `All except ${f.developersExclude.length}`
      : "Developers";

  const tiersLabel = f.tiersInclude.length
    ? f.tiersInclude.length === 1
      ? TIER_LABELS[f.tiersInclude[0] as DeveloperTier] || "Tier"
      : `${f.tiersInclude.length} tiers`
    : f.tiersExclude.length
      ? `All except ${f.tiersExclude.length}`
      : "Tiers";

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
      : "Bedrooms";

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
    <div data-property-search-bar data-search-tone={dark ? "dark" : "light"} className={`grid gap-1.5 lg:block ${className}`} style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
      {/* Row 1 — equal-height purpose, keyword, and detached consultation controls */}
      <div className={`contents lg:grid lg:grid-cols-[minmax(14.5rem,auto)_minmax(0,1fr)] lg:items-stretch lg:gap-2 lg:mb-2`} data-search-grid={GRID_KEY}>
        <div
          className="order-1 lg:order-none col-span-2 flex h-10 lg:h-16 min-w-0 lg:col-span-1 jj-sspan-9 items-center rounded-lg overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]"

          data-surface={dark ? "dark" : "light"}
          data-search-segment
          style={{
            backgroundImage: dark ? DARK_SURFACE : undefined,
            background: dark ? undefined : "#FDFBF7",
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
                  // Sell is an intent, never a filter: go straight to listing.
                  goSell();
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
                 <span
                   aria-hidden="true"
                   className="absolute right-0 top-1/2 h-6 w-px -translate-y-1/2 rounded-full"
                   style={{
                     background: `linear-gradient(180deg,transparent 0%,${dividerColor} 22%,${dividerColor} 78%,transparent 100%)`,
                   }}
                 />
              ) : null}
            </button>
          ))}
        </div>

        <div
          className={`order-2 relative flex items-center gap-2 h-12 lg:h-16 px-3 lg:px-3.5 rounded-lg min-w-0 col-span-2 lg:order-none lg:col-span-1 shadow-none ${KEYWORD_SPAN}`}
          data-surface={dark ? "dark" : "light"}
          data-search-segment
          style={{
            backgroundImage: dark ? DARK_SURFACE : undefined,
            background: dark ? undefined : "#FFFFFF",
            backdropFilter: dark ? "blur(10px)" : undefined,
            border: `1.5px solid ${dark ? "rgba(255,255,255,0.44)" : "rgba(6,78,59,0.28)"}`,
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

        {/* PASS 298 — tiers moved to row 2 (under "Sell") as a multi-select
            include/exclude segment. No duplicated tier control in row 1. */}
        <div
          className="order-10 lg:order-none flex h-10 lg:h-16 min-w-0 items-center overflow-hidden rounded-lg col-span-1 jj-sspan-3"
          data-search-utility-controls
          data-surface={dark ? "dark" : "light"}
          style={{
            backgroundImage: dark ? DARK_SURFACE : undefined,
            background: dark ? undefined : "#FFFFFF",
            backdropFilter: dark ? "blur(10px)" : undefined,
            border: `1.5px solid ${dark ? "rgba(255,255,255,0.44)" : "rgba(184,149,85,0.58)"}`,
          }}
        >
          <InlineCurrencySelect dark={dark} />
        </div>

        {/* Mobile/tablet: area unit sits beside currency. Desktop: sq ft / sq m
            occupies exactly the "Show N" column below (plus the hero CTA). */}
        <div
          className={`contents lg:grid lg:gap-2 lg:col-span-2 lg:order-none ${ROW1_UTILITY_SPAN} min-w-0`}
          style={{ gridTemplateColumns: onConsultation ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)" }}
        >

          <div
            className={`order-10 lg:order-none flex h-10 lg:h-16 w-full justify-self-stretch min-w-0 items-stretch overflow-hidden rounded-lg`}
            data-search-utility-controls
            data-surface={dark ? "dark" : "light"}
            style={{
              backgroundImage: dark ? DARK_SURFACE : undefined,
              background: dark ? undefined : "#FFFFFF",
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
                  className="relative min-w-0 flex-1 flex items-center justify-center text-center text-[11.5px] lg:text-sm font-semibold leading-none tracking-[0.04em] whitespace-nowrap transition-colors duration-200 py-0 self-stretch"
                  style={{
                    backgroundImage: on ? EMERALD_PAIR : undefined,
                    background: on ? undefined : "transparent",
                    borderRadius: 0,
                    color: on ? "#FFFFFF" : dark ? "#FFFFFF" : "#1A1A1A",
                    WebkitTextFillColor: on ? "#FFFFFF" : dark ? "#FFFFFF" : undefined,
                  }}
                >
                  {unit === "sqft" ? "sq\u00A0ft" : "sq\u00A0m"}
                  {i === 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute right-0 top-1/2 h-6 w-px -translate-y-1/2 rounded-full"
                      style={{
                        background: `linear-gradient(180deg,transparent 0%,${dividerColor} 22%,${dividerColor} 78%,transparent 100%)`,
                      }}
                    />
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
        <div className={`order-4 lg:order-none col-span-1 ${AREA_SPAN} min-w-0`}>
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

        <div className="order-4 lg:order-none col-span-1 jj-sspan-3 min-w-0">
          <Seg
            label={developersLabel}
            icon={<Building2 className="w-4 h-4 opacity-70" />}
            active={!!(f.developersInclude.length || f.developersExclude.length)}
            dark={dark}
            wide
          >
            <DeveloperIncludeExclude
              include={f.developersInclude}
              exclude={f.developersExclude}
              onChange={({ include, exclude }) => set({ developersInclude: include, developersExclude: exclude })}
            />
          </Seg>
        </div>

        <div className="order-4 lg:order-none col-span-1 jj-sspan-3 min-w-0">
          <Seg
            label={tiersLabel}
            icon={<Crown className="w-4 h-4 opacity-70" />}
            active={!!(f.tiersInclude.length || f.tiersExclude.length)}
            dark={dark}
            wide
          >
            <FilterMultiSelect
              options={(Object.entries(TIER_LABELS) as [DeveloperTier, string][]).map(([value, label]) => ({
                value,
                label,
              }))}
              include={f.tiersInclude}
              exclude={f.tiersExclude}
              onChange={({ include, exclude }) => set({ tiersInclude: include, tiersExclude: exclude })}
              emptyLabel="No tiers"
              clearLabel="Clear tiers"
              width={280}
            />

          </Seg>
        </div>

        <Seg label={typeLabel} active={f.types.length > 0} dark={dark} icon={<Home className="w-4 h-4 opacity-70" />} spanClass="order-5 lg:order-none jj-sspan-3">
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

        <Seg label={bedLabel} active={f.beds.length > 0 || f.baths.length > 0} dark={dark} icon={<BedDouble className="w-4 h-4 opacity-70" />} spanClass="order-6 lg:order-none jj-sspan-3">
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

        <Seg label={priceLabel} active={f.priceMin != null || f.priceMax != null} dark={dark} icon={<Tag className="w-4 h-4 opacity-70" />} spanClass="order-7 lg:order-none jj-sspan-3">
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

        <Seg label={statusLabel} active={f.statuses.length > 0} dark={dark} icon={<CircleDot className="w-4 h-4 opacity-70" />} spanClass="order-8 lg:order-none jj-sspan-3">
          <div className="p-3 flex flex-wrap gap-1.5">
            {statusOptionsFor(f.purpose).map((s) => (
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
            label={(sortOptions ?? sortOptionsFor(f.purpose)).find((s) => s.slug === f.sort)?.label ?? "Sort"}
            active
            dark={dark}
            spanClass="jj-sspan-3"
          >
            <div className="p-1.5">
              {(sortOptions ?? sortOptionsFor(f.purpose)).map((s) => {
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
          className={`contents lg:grid lg:gap-2 lg:col-span-2 ${ROW2_UTILITY_SPAN} min-w-0`}
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
               background: dark ? undefined : "#FFFFFF",
              backdropFilter: dark ? "blur(10px)" : undefined,
              border: `1.5px solid ${dark ? "rgba(255,255,255,0.44)" : "rgba(184,149,85,0.58)"}`,
              color: dark ? "#FFFFFF" : "#1A1A1A",
              WebkitTextFillColor: dark ? "#FFFFFF" : undefined,
            }}

          >
            {/* PASS 332 — "More" shares the EXACT segment geometry (icon | label |
                trailing track) on every device, so its icon lines up with Price,
                Type, Developers and the rest of the bar instead of hugging the label. */}
            <span className="grid w-full min-w-0 grid-cols-[18px_minmax(0,1fr)_18px] lg:grid-cols-[15px_minmax(0,1fr)_13px] items-center gap-0">
              <SlidersHorizontal className="h-4 w-4 lg:h-3.5 lg:w-3.5 shrink-0 opacity-70 justify-self-center" />
              <span className="min-w-0 text-center leading-none lg:text-[11px]" style={{ whiteSpace: "nowrap" }}>
                More{extras ? ` (${extras})` : ""}
              </span>
              <ChevronDown className="h-3.5 w-3.5 lg:h-3 lg:w-3 shrink-0 opacity-70 col-start-3 justify-self-end" />
            </span>


          </button>

          <button
            type="button"
            onClick={() => onSubmit(f)}
             data-surface="emerald"
             data-search-segment
             data-no-contrast-guard
            className="order-11 lg:order-none col-span-2 lg:col-span-1 h-11 lg:h-16 w-full min-w-0 rounded-lg font-semibold px-3 py-0 leading-none tracking-tight text-center flex flex-row items-center justify-center gap-1 overflow-hidden"
            style={{
              backgroundImage: EMERALD_PAIR,
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              whiteSpace: "nowrap",
              wordBreak: "keep-all",
            }}
          >
            {count == null ? (
              <span className="text-[13px] lg:text-[12px] font-semibold leading-none">Search</span>
            ) : (
              <>
                <span className="text-[13px] font-semibold leading-none whitespace-nowrap lg:hidden">
                  Show {count.toLocaleString()} {countNoun}
                </span>
                <span className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-[2px] lg:text-[12px] lg:font-semibold lg:leading-[1.1]">
                  <span className="whitespace-nowrap">Show {count.toLocaleString()}</span>
                  <span className="whitespace-nowrap">{countNoun}</span>
                </span>
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
               data-active-filter-chip
               data-surface="emerald"
               data-photo-copy-lock
               className="allow-white inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11.5px] font-semibold !text-white [&_*]:!text-white"
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
          className="max-w-[min(96vw,44rem)] p-0 gap-0 top-[calc(50%+1.75rem)] max-h-[calc(100dvh-8rem)] overflow-y-auto"
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
            onSellSelected={() => {
              setMoreOpen(false);
              goSell();
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
  onSellSelected,
}: {
  draft: PropertySearch;
  setDraft: (v: PropertySearch) => void;
  onApply: (v: PropertySearch) => void;
  onSellSelected?: () => void;
}) {
  const { count } = usePropertyCount(draft);
  return (
    <PropertyFilterScreen
      value={draft}
      onChange={setDraft}
      count={count}
      onReset={() => setDraft({ ...EMPTY_SEARCH, purpose: draft.purpose, country: draft.country })}
      onApply={() => onApply(draft)}
      onSellSelected={onSellSelected}
    />
  );
}
