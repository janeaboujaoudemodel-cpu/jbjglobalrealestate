/**
 * PropertyFilterScreen — the ONE full filter surface.
 *
 * Rendered both by the header/bar "More filters" and by any page-level
 * "Filters" button, so the user always sees the identical screen (plan §5).
 */
import { GEO_COUNTRIES } from "@/data/geography";
import AreaIncludeExclude from "./AreaIncludeExclude";
import {
  BATHS,
  BEDS,
  CATEGORY_TYPES,
  COMPLETION_YEARS,
  FURNISHINGS,
  LISTING_LABELS,
  PAYMENT_OPTIONS,
  PURPOSES,
  sanitizeSearchForPurpose,
  statusOptionsFor,
  supportsOffPlanAxes,
  RENT_PERIODS,
  currencyFor,
  type PropertySearch,
  type SearchCategory,
} from "@/lib/propertySearch";

function Chip({
  on,
  onClick,
  children,
}: {
  on?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-surface={on ? "emerald" : "pearl"}
      className={on ? "jj-cta-emerald px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap" : "jj-cta-outline px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-[#B89555]/25 last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-2 text-[#1A1A1A]/60">
        {title}
      </p>
      {children}
    </div>
  );
}

const numInput =
  "h-10 w-full rounded-lg px-3 text-sm bg-[#FDFBF7] border border-[#B89555]/35 outline-none";

interface Props {
  value: PropertySearch;
  onChange: (next: PropertySearch) => void;
  /** Live match count for the Apply button. */
  count?: number | null;
  onApply?: () => void;
  onReset?: () => void;
  /** Called when the visitor picks "Sell" — the host closes and routes to /sell. */
  onSellSelected?: () => void;
}

export default function PropertyFilterScreen({ value: f, onChange, count, onApply, onReset, onSellSelected }: Props) {
  const set = (patch: Partial<PropertySearch>) => onChange(sanitizeSearchForPurpose({ ...f, ...patch }));
  const offPlanAxes = supportsOffPlanAxes(f.purpose);
  const toggleIn = <T extends string>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  const cur = currencyFor(f.country);
  const types = CATEGORY_TYPES[f.category];

  return (
    <div className="flex flex-col max-h-[80vh]">
      <div className="overflow-y-auto px-4 pb-2">
        <Section title="Purpose">
          <div className="flex flex-wrap gap-1.5">
            {PURPOSES.map((p) => (
              <Chip
                key={p.slug}
                on={p.slug !== "sell" && f.purpose === p.slug}
                onClick={() => {
                  if (p.slug === "sell") {
                    onSellSelected?.();
                    return;
                  }
                  set({ purpose: p.slug });
                }}
              >
                {p.label}
              </Chip>
            ))}
          </div>
          {f.purpose === "rent" && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {RENT_PERIODS.map((p) => (
                <Chip key={p.slug} on={f.rentPeriod === p.slug} onClick={() => set({ rentPeriod: p.slug })}>
                  {p.label}
                </Chip>
              ))}
            </div>
          )}
        </Section>

        <Section title={offPlanAxes ? "Project status (multi-select)" : "Availability"}>
          <div className="flex flex-wrap gap-1.5">
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
        </Section>

        {offPlanAxes ? (
        <Section title="Completion by">
          <div className="flex flex-wrap gap-1.5">
            <Chip on={!f.completionTo} onClick={() => set({ completionTo: null })}>
              Any
            </Chip>
            {COMPLETION_YEARS.map((y) => (
              <Chip key={y} on={f.completionTo === y} onClick={() => set({ completionTo: y })}>
                {y}
              </Chip>
            ))}
          </div>
        </Section>
        ) : null}



        {offPlanAxes ? (
        <Section title="Payment">
          <div className="flex flex-wrap gap-1.5">
            {PAYMENT_OPTIONS.map((p) => (
              <Chip key={p.slug} on={f.payment === p.slug} onClick={() => set({ payment: p.slug })}>
                {p.label}
              </Chip>
            ))}
          </div>
        </Section>
        ) : null}

        <Section title="Property type">
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl mb-2 bg-muted">
            {(Object.keys(CATEGORY_TYPES) as SearchCategory[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set({ category: c, types: [] })}
                className="h-8 rounded-lg text-xs font-semibold capitalize"
                data-surface={f.category === c ? "emerald" : "pearl"}
                className={`h-8 rounded-lg text-xs font-semibold capitalize ${f.category === c ? "jj-cta-emerald" : "text-foreground"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set({ types: toggleIn(f.types, t) })}
                data-surface={f.types.includes(t) ? "emerald" : "pearl"}
                className={f.types.includes(t) ? "jj-cta-emerald h-9 rounded-full text-xs font-medium" : "jj-cta-outline h-9 rounded-full text-xs font-medium"}
              >
                {t}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Beds & baths">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {BEDS.map((b) => (
              <Chip key={b} on={f.beds.includes(b)} onClick={() => set({ beds: toggleIn(f.beds, b) })}>
                {b}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BATHS.map((b) => (
              <Chip key={b} on={f.baths.includes(b)} onClick={() => set({ baths: toggleIn(f.baths, b) })}>
                {b} bath
              </Chip>
            ))}
          </div>
        </Section>

        <Section title={`Price (${cur})`}>
          <div className="grid grid-cols-2 gap-2">
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
        </Section>

        <Section title="Size (sqft)">
          <div className="grid grid-cols-2 gap-2">
            <input
              className={numInput}
              inputMode="numeric"
              placeholder="Min"
              value={f.sizeMin ?? ""}
              onChange={(e) => set({ sizeMin: e.target.value ? Number(e.target.value) : null })}
            />
            <input
              className={numInput}
              inputMode="numeric"
              placeholder="Max"
              value={f.sizeMax ?? ""}
              onChange={(e) => set({ sizeMax: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </Section>

        <Section title="Country">
          <div className="flex flex-wrap gap-1.5">
            {GEO_COUNTRIES.map((c) => (
              <Chip
                key={c.slug}
                on={f.country === c.slug}
                onClick={() => set({ country: c.slug, region: null, areasInclude: [], areasExclude: [] })}
              >
                {c.slug === "uae" ? "UAE" : c.name}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Areas — include / exclude">
          <div className="rounded-xl" style={{ border: "1px solid rgba(184,149,85,0.3)" }}>
            <AreaIncludeExclude
              country={f.country}
              region={f.region}
              include={f.areasInclude}
              exclude={f.areasExclude}
              onChange={({ include, exclude, region }) =>
                set({
                  areasInclude: include,
                  areasExclude: exclude,
                  ...(region !== undefined ? { region } : {}),
                })
              }
            />
          </div>
        </Section>

        <Section title="Furnishing">
          <div className="flex flex-wrap gap-1.5">
            {FURNISHINGS.map((o) => (
              <Chip key={o.slug} on={f.furnishing === o.slug} onClick={() => set({ furnishing: o.slug as never })}>
                {o.label}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Labels">
          <div className="flex flex-wrap gap-1.5">
            {LISTING_LABELS.map((l) => (
              <button
                key={l.slug}
                type="button"
                onClick={() => set({ labels: toggleIn(f.labels, l.slug) })}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
                style={
                  f.labels.includes(l.slug)
                    ? { backgroundImage: l.background, color: l.color }
                    : { background: "#FDFBF7", color: "#1A1A1A", border: "1px solid rgba(184,149,85,0.35)" }
                }
              >
                {l.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Developer">
          <input
            className={numInput}
            placeholder="Any developer"
            value={f.developer ?? ""}
            onChange={(e) => set({ developer: e.target.value || null })}
          />
        </Section>
      </div>

      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#B89555]/30"
        style={{ background: "#FBF8F3" }}
      >
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onApply}
          data-surface="emerald"
          className="jj-cta-emerald h-10 px-5 rounded-xl text-sm font-semibold"
        >
          {count == null ? "Apply filters" : `Show ${count.toLocaleString()} propert${count === 1 ? "y" : "ies"}`}
        </button>
      </div>
    </div>
  );
}
