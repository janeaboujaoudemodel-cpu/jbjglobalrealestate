/**
 * FilterMultiSelect — the ONE include/exclude list picker used by every
 * segment of the unified search bar (areas, developers, tiers).
 *
 * Row contract (locked):
 *   idle      → neutral surface, black ink, hairline checkbox
 *   included  → emerald pair gradient fill, PURE WHITE label + white tick box
 *   excluded  → red hairline, red minus filled, strikethrough label
 *
 * Never green. Never black ink on emerald. Rows are a fixed height in a real
 * grid so the boxes can never touch or drift out of alignment, and the
 * exclude control is a full 32px hit target that reacts on the first tap.
 */
import { memo, useMemo, useState, type ReactNode } from "react";
import { Check, Minus, Search, X } from "lucide-react";

const EMERALD_PAIR = "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)";
const RED = "#B91C1C";

export interface FilterOption {
  /** Stable value stored in the search state. */
  value: string;
  /** Human label rendered in the row. */
  label: string;
  /** Optional leading media (developer logo plate) — same size on every row. */
  media?: ReactNode;
}

interface Props {
  options: FilterOption[];
  include: string[];
  exclude: string[];
  onChange: (next: { include: string[]; exclude: string[] }) => void;
  /** Show the search field (long lists only). */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** True while the source list is still loading — suppresses the empty state. */
  loading?: boolean;
  emptyLabel?: string;
  clearLabel?: string;
  /** Panel width; the popover already caps to the viewport. */
  width?: number;
}

function FilterMultiSelect({
  options,
  include,
  exclude,
  onChange,
  searchable = false,
  searchPlaceholder = "Search",
  loading = false,
  emptyLabel = "No match",
  clearLabel = "Clear selection",
  width = 320,
}: Props) {
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [options, q]);

  const toggle = (value: string, mode: "include" | "exclude") => {
    const inInclude = include.includes(value);
    const inExclude = exclude.includes(value);
    if (mode === "include") {
      onChange({
        include: inInclude ? include.filter((v) => v !== value) : [...include, value],
        exclude: exclude.filter((v) => v !== value),
      });
    } else {
      onChange({
        include: include.filter((v) => v !== value),
        exclude: inExclude ? exclude.filter((v) => v !== value) : [...exclude, value],
      });
    }
  };

  const hasSelection = include.length > 0 || exclude.length > 0;

  return (
    <div className="p-2" style={{ width: `min(92vw, ${width}px)` }}>
      {searchable ? (
        <div
          className="mb-2 flex h-9 items-center gap-2 rounded-lg px-2.5"
          style={{ background: "#FFFFFF", border: "1px solid rgba(6,78,59,0.25)" }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "#064E3B" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            data-no-contrast-guard
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
            style={{ color: "#1A1A1A" }}
          />
          {q ? (
            <button type="button" aria-label="Clear search" onClick={() => setQ("")}>
              <X className="h-3.5 w-3.5" style={{ color: "#1A1A1A" }} />
            </button>
          ) : null}
        </div>
      ) : null}

      {hasSelection ? (
        <button
          type="button"
          onClick={() => onChange({ include: [], exclude: [] })}
          data-no-contrast-guard
          className="mb-2 h-8 w-full rounded-md px-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ border: "1px solid rgba(6,78,59,0.25)", color: "#064E3B", background: "#FFFFFF" }}
        >
          {clearLabel}
        </button>
      ) : null}

      <div className="max-h-[300px] overflow-y-auto overflow-x-hidden pr-0.5" data-filter-options>
        {loading ? (
          <div className="flex flex-col gap-1.5 py-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded-md" style={{ background: "rgba(6,78,59,0.08)" }} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="px-2 py-3 text-[12px]" style={{ color: "rgba(26,26,26,0.6)" }}>
            {q.trim() ? `${emptyLabel} “${q.trim()}”.` : `${emptyLabel}.`}
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {visible.map((opt) => {
              const on = include.includes(opt.value);
              const off = exclude.includes(opt.value);
              return (
                <div
                  key={opt.value}
                  className="grid min-h-11 w-full items-center gap-2"
                  style={{ gridTemplateColumns: "minmax(0,1fr) 32px" }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(opt.value, "include")}
                    aria-pressed={on}
                    data-no-contrast-guard
                    className="flex min-h-11 min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] leading-tight"
                    style={{
                      backgroundImage: on ? EMERALD_PAIR : undefined,
                      background: on ? undefined : "transparent",
                      border: `1px solid ${on ? "rgba(255,255,255,0.28)" : off ? "rgba(185,28,28,0.35)" : "rgba(6,78,59,0.14)"}`,
                      color: on ? "#FFFFFF" : off ? RED : "#1A1A1A",
                      WebkitTextFillColor: on ? "#FFFFFF" : off ? RED : "#1A1A1A",
                    }}
                  >
                    <span
                      className="grid h-[18px] w-[18px] min-h-[18px] min-w-[18px] shrink-0 place-items-center rounded-[4px]"
                      style={{
                        border: `1px solid ${on ? "#FFFFFF" : off ? RED : "rgba(6,78,59,0.4)"}`,
                        background: on ? "#FFFFFF" : "transparent",
                      }}
                    >
                      {on ? <Check className="h-4 w-4" style={{ color: "#064E3B" }} /> : null}
                    </span>
                    {opt.media ? <span className="shrink-0 inline-flex items-center">{opt.media}</span> : null}
                    <span
                      className="min-w-0 flex-1 whitespace-normal break-words"
                      style={{ textDecoration: off ? "line-through" : undefined }}
                    >
                      {opt.label}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(opt.value, "exclude")}
                    aria-label={`Exclude ${opt.label}`}
                    aria-pressed={off}
                    data-no-contrast-guard
                    className="grid h-8 w-8 min-h-8 min-w-8 shrink-0 place-items-center rounded-md border-0 bg-transparent p-0"
                    style={{
                      border: "0",
                      background: "transparent",
                    }}
                  >
                    <span
                      className="grid h-[18px] w-[18px] place-items-center rounded-[4px]"
                      style={{
                        border: `1px solid ${off ? RED : "rgba(185,28,28,0.48)"}`,
                        background: off ? RED : "transparent",
                      }}
                    >
                      <Minus className="h-3 w-3" style={{ color: off ? "#FFFFFF" : RED }} />
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(FilterMultiSelect);
