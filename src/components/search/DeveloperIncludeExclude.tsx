/**
 * DeveloperIncludeExclude — multi-select developer picker for the unified
 * search bar (PASS 298). Mirrors AreaIncludeExclude: searchable list, tap to
 * INCLUDE (emerald), tap the minus to EXCLUDE (red), both clearable.
 */
import { useMemo, useState } from "react";
import { Check, Minus, Search, X } from "lucide-react";
import { useDevelopers } from "@/hooks/useProjects";
import { compareDevelopersByPriority } from "@/utils/developerTier";

const EMERALD_PAIR = "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)";

interface Props {
  include: string[];
  exclude: string[];
  onChange: (next: { include: string[]; exclude: string[] }) => void;
}

export default function DeveloperIncludeExclude({ include, exclude, onChange }: Props) {
  const [q, setQ] = useState("");
  const { data: developers } = useDevelopers();

  const options = useMemo(() => {
    const list = (developers || [])
      .filter((d: { name?: string | null }) => Boolean(d.name))
      .slice()
      .sort(compareDevelopersByPriority)
      .map((d: { name: string }) => d.name);
    const seen = new Set<string>();
    const unique = list.filter((name) => {
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const needle = q.trim().toLowerCase();
    return needle ? unique.filter((n) => n.toLowerCase().includes(needle)) : unique;
  }, [developers, q]);

  const toggle = (name: string, mode: "include" | "exclude") => {
    const inInclude = include.includes(name);
    const inExclude = exclude.includes(name);
    if (mode === "include") {
      onChange({
        include: inInclude ? include.filter((n) => n !== name) : [...include, name],
        exclude: exclude.filter((n) => n !== name),
      });
    } else {
      onChange({
        include: include.filter((n) => n !== name),
        exclude: inExclude ? exclude.filter((n) => n !== name) : [...exclude, name],
      });
    }
  };

  return (
    <div className="w-[300px] max-w-[90vw] p-2">
      <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#064E3B]/25 bg-white px-2.5 h-9">
        <Search className="h-3.5 w-3.5 shrink-0 text-[#064E3B]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search developer"
          data-no-contrast-guard
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
          style={{ color: "#1A1A1A" }}
        />
        {q ? (
          <button type="button" aria-label="Clear developer search" onClick={() => setQ("")}>
            <X className="h-3.5 w-3.5 text-[#1A1A1A]" />
          </button>
        ) : null}
      </div>

      {include.length || exclude.length ? (
        <button
          type="button"
          onClick={() => onChange({ include: [], exclude: [] })}
          className="mb-2 w-full rounded-md border border-[#064E3B]/25 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#064E3B]"
        >
          Clear developers
        </button>
      ) : null}

      <div className="max-h-[280px] overflow-y-auto pr-0.5">
        {options.length === 0 ? (
          <p className="px-2 py-3 text-[12px] text-[#1A1A1A]/60">No developer matches “{q}”.</p>
        ) : (
          options.map((name) => {
            const on = include.includes(name);
            const off = exclude.includes(name);
            return (
              <div key={name} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggle(name, "include")}
                  aria-pressed={on}
                  data-no-contrast-guard
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-[13px]"
                  style={{
                    backgroundImage: on ? EMERALD_PAIR : undefined,
                    color: on ? "#FFFFFF" : off ? "rgba(185,28,28,0.9)" : "#1A1A1A",
                    WebkitTextFillColor: on ? "#FFFFFF" : undefined,
                    textDecoration: off ? "line-through" : undefined,
                  }}
                >
                  <span
                    className="grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border"
                    style={{
                      borderColor: on ? "#FFFFFF" : off ? "#B91C1C" : "rgba(6,78,59,0.4)",
                      background: on ? "#FFFFFF" : "transparent",
                    }}
                  >
                    {on ? <Check className="h-3 w-3" style={{ color: "#064E3B" }} /> : null}
                  </span>
                  <span className="truncate">{name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggle(name, "exclude")}
                  aria-label={`Exclude ${name}`}
                  aria-pressed={off}
                  data-no-contrast-guard
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md border"
                  style={{
                    borderColor: off ? "#B91C1C" : "rgba(185,28,28,0.35)",
                    background: off ? "#B91C1C" : "transparent",
                  }}
                >
                  <Minus className="h-3.5 w-3.5" style={{ color: off ? "#FFFFFF" : "#B91C1C" }} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
