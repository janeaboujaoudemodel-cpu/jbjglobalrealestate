/**
 * AreaIncludeExclude — searchable area picker with INCLUDE and EXCLUDE lists.
 *
 * "All of Dubai except International City and Deira" is a first-class case:
 * pick the Exclude tab and tick the areas to drop. Exclusions always win.
 *
 * Selection is shown ONLY by the emerald tick on each row — no duplicate chips.
 */
import { useMemo, useState } from "react";
import { Check, Minus, Plus, Search } from "lucide-react";
import { getAreas, getRegions, hasRegionStep, GEO_COUNTRIES } from "@/data/geography";

const EMERALD_PAIR = "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)";

/** One shape + one size for every pill in this panel. */
const PILL = "h-9 px-4 rounded-full text-xs font-semibold inline-flex items-center justify-center whitespace-nowrap";

interface Props {
  country: string;
  region: string | null;
  include: string[];
  exclude: string[];
  onChange: (next: { include: string[]; exclude: string[]; region?: string | null }) => void;
  onCountryChange?: (slug: string) => void;
}

export default function AreaIncludeExclude({
  country,
  region,
  include,
  exclude,
  onChange,
  onCountryChange,
}: Props) {
  const [mode, setMode] = useState<"include" | "exclude">("include");
  const [query, setQuery] = useState("");

  const regions = getRegions(country);
  const areas = useMemo(() => getAreas(country, region), [country, region]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? areas.filter((a) => a.name.toLowerCase().includes(q)) : areas;
  }, [areas, query]);

  const toggle = (slug: string) => {
    if (mode === "include") {
      const next = include.includes(slug) ? include.filter((s) => s !== slug) : [...include, slug];
      onChange({ include: next, exclude: exclude.filter((s) => s !== slug) });
    } else {
      const next = exclude.includes(slug) ? exclude.filter((s) => s !== slug) : [...exclude, slug];
      onChange({ include: include.filter((s) => s !== slug), exclude: next });
    }
  };

  const activeStyle = { backgroundImage: EMERALD_PAIR, color: "#FFF", border: "1px solid #042c1c" };
  const idleStyle = { background: "#FDFBF7", color: "#1A1A1A", border: "1px solid rgba(184,149,85,0.35)" };

  return (
    <div className="p-3.5">
      {/* Country step — UAE live, the rest coming soon */}
      <div className="flex flex-wrap gap-2 mb-3">
        {GEO_COUNTRIES.map((c) => {
          const on = country === c.slug;
          return (
            <button
              key={c.slug}
              type="button"
              disabled={!c.live}
              onClick={() => c.live && onCountryChange?.(c.slug)}
              data-surface={on ? "emerald" : "light"}
              data-emerald={on ? "true" : undefined}
              data-on-dark={on ? "true" : undefined}
              className={`${PILL} ${c.live ? "" : "opacity-60 cursor-not-allowed"}`}
              style={on ? activeStyle : idleStyle}
            >
              {c.slug === "uae" ? "UAE" : c.name}
              {!c.live ? <span className="ml-1.5 text-[10px] font-medium opacity-70">Coming soon</span> : null}
            </button>
          );
        })}
      </div>

      {/* Emirate / region step */}
      {hasRegionStep(country) && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => onChange({ include: [], exclude: [], region: null })}
            data-surface={!region ? "emerald" : "light"}
            data-emerald={!region ? "true" : undefined}
            data-on-dark={!region ? "true" : undefined}
            className={PILL}
            style={!region ? activeStyle : idleStyle}
          >
            All
          </button>
          {regions.map((r) => (
            <button
              key={r.slug}
              type="button"
              onClick={() => onChange({ include: [], exclude: [], region: r.slug })}
              data-surface={region === r.slug ? "emerald" : "light"}
              data-emerald={region === r.slug ? "true" : undefined}
              data-on-dark={region === r.slug ? "true" : undefined}
              className={PILL}
              style={region === r.slug ? activeStyle : idleStyle}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {/* Include / Exclude tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl mb-2.5" style={{ background: "#F2EBDC" }}>
        {(["include", "exclude"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            data-emerald={mode === m && m === "include" ? "true" : undefined}
            data-on-dark={mode === m ? "true" : undefined}
            className="h-10 rounded-lg text-sm font-semibold capitalize flex items-center justify-center gap-1.5"
            style={
              mode === m
                ? m === "include"
                  ? { backgroundImage: EMERALD_PAIR, color: "#FFF" }
                  : { background: "#7F1D1D", color: "#FFF" }
                : { color: "#1A1A1A" }
            }
          >
            {m === "include" ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            {m}
          </button>
        ))}
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 h-11 px-3 rounded-lg mb-2"
        style={{ background: "#FDFBF7", border: "1px solid rgba(184,149,85,0.35)" }}
      >
        <Search className="w-4 h-4 opacity-60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search areas to ${mode}`}
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      {/* Area list — the tick is the ONLY selected-state indicator */}
      <div className="max-h-[280px] overflow-y-auto pr-1 space-y-0.5">
        {filtered.map((a) => {
          const inc = include.includes(a.slug);
          const exc = exclude.includes(a.slug);
          const on = mode === "include" ? inc : exc;
          return (
            <button
              key={a.slug}
              type="button"
              onClick={() => toggle(a.slug)}
              className="w-full flex items-center justify-between gap-2 px-2 py-2.5 rounded-lg text-sm text-left hover:bg-[#F7F2EA]"
            >
              <span className="truncate" style={{ color: exc ? "#7F1D1D" : "#1A1A1A" }}>
                {a.name}
              </span>
              <span
                data-surface={on ? "emerald" : undefined}
                data-emerald={on && mode === "include" ? "true" : undefined}
                data-on-dark={on ? "true" : undefined}
                className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0"
                style={
                  on
                    ? mode === "include"
                      ? { backgroundImage: EMERALD_PAIR }
                      : { background: "#7F1D1D" }
                    : { border: "1px solid rgba(26,26,26,0.3)" }
                }
              >
                {on && (
                  <Check
                    className="w-3.5 h-3.5"
                    style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
                    strokeWidth={3}
                  />
                )}
              </span>
            </button>
          );
        })}
        {!filtered.length && <p className="text-sm opacity-60 px-2 py-3">No areas match “{query}”.</p>}
      </div>
    </div>
  );
}
