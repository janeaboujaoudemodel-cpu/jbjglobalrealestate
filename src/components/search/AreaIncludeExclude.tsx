/**
 * AreaIncludeExclude — searchable area picker with INCLUDE and EXCLUDE lists.
 *
 * "All of Dubai except International City and Deira" is a first-class case:
 * pick the Exclude tab and tick the areas to drop. Exclusions always win.
 */
import { useMemo, useState } from "react";
import { Check, Minus, Plus, Search, X } from "lucide-react";
import { getAreas, getRegions, hasRegionStep } from "@/data/geography";

const EMERALD_PAIR = "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)";

interface Props {
  country: string;
  region: string | null;
  include: string[];
  exclude: string[];
  onChange: (next: { include: string[]; exclude: string[]; region?: string | null }) => void;
}

export default function AreaIncludeExclude({ country, region, include, exclude, onChange }: Props) {
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

  const nameOf = (slug: string) => areas.find((a) => a.slug === slug)?.name ?? slug;

  return (
    <div className="p-3">
      {/* Emirate / region step */}
      {hasRegionStep(country) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => onChange({ include: [], exclude: [], region: null })}
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={
              !region
                ? { backgroundImage: EMERALD_PAIR, color: "#FFF" }
                : { background: "#FDFBF7", color: "#1A1A1A", border: "1px solid rgba(184,149,85,0.35)" }
            }
          >
            All
          </button>
          {regions.map((r) => (
            <button
              key={r.slug}
              type="button"
              onClick={() => onChange({ include: [], exclude: [], region: r.slug })}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={
                region === r.slug
                  ? { backgroundImage: EMERALD_PAIR, color: "#FFF" }
                  : { background: "#FDFBF7", color: "#1A1A1A", border: "1px solid rgba(184,149,85,0.35)" }
              }
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {/* Include / Exclude tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl mb-2" style={{ background: "#F2EBDC" }}>
        {(["include", "exclude"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            data-emerald={mode === m ? "true" : undefined}
            className="h-8 rounded-lg text-xs font-semibold capitalize flex items-center justify-center gap-1"
            style={
              mode === m
                ? m === "include"
                  ? { backgroundImage: EMERALD_PAIR, color: "#FFF" }
                  : { background: "#7F1D1D", color: "#FFF" }
                : { color: "#1A1A1A" }
            }
          >
            {m === "include" ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {m}
          </button>
        ))}
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 h-9 px-2.5 rounded-lg mb-2"
        style={{ background: "#FDFBF7", border: "1px solid rgba(184,149,85,0.35)" }}
      >
        <Search className="w-3.5 h-3.5 opacity-60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search areas to ${mode}`}
          className="flex-1 bg-transparent text-xs outline-none"
        />
      </div>

      {/* Chips of current selection */}
      {(include.length > 0 || exclude.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {include.map((s) => (
            <span
              key={`i-${s}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
              style={{ backgroundImage: EMERALD_PAIR }}
            >
              + {nameOf(s)}
              <button type="button" onClick={() => onChange({ include: include.filter((x) => x !== s), exclude })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {exclude.map((s) => (
            <span
              key={`e-${s}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: "#FDE8E8", color: "#7F1D1D", border: "1px solid #7F1D1D33" }}
            >
              − {nameOf(s)}
              <button type="button" onClick={() => onChange({ include, exclude: exclude.filter((x) => x !== s) })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Area list */}
      <div className="max-h-[220px] overflow-y-auto pr-1 space-y-0.5">
        {filtered.map((a) => {
          const inc = include.includes(a.slug);
          const exc = exclude.includes(a.slug);
          const on = mode === "include" ? inc : exc;
          return (
            <button
              key={a.slug}
              type="button"
              onClick={() => toggle(a.slug)}
              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs text-left hover:bg-[#F7F2EA]"
            >
              <span className="truncate" style={{ color: exc ? "#7F1D1D" : "#1A1A1A" }}>
                {a.name}
              </span>
              <span
                className="w-4 h-4 rounded-[5px] flex items-center justify-center shrink-0"
                style={
                  on
                    ? mode === "include"
                      ? { backgroundImage: EMERALD_PAIR }
                      : { background: "#7F1D1D" }
                    : { border: "1px solid rgba(26,26,26,0.3)" }
                }
              >
                {on && <Check className="w-3 h-3 text-white" />}
              </span>
            </button>
          );
        })}
        {!filtered.length && <p className="text-xs opacity-60 px-2 py-3">No areas match “{query}”.</p>}
      </div>
    </div>
  );
}
