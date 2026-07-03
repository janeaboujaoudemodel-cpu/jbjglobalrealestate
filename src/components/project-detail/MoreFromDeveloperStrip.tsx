import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/formatPrice";
import { deriveHandover } from "@/utils/handoverDerivation";

const formatHandoverDisplay = (v: string | null): string | null => {
  if (!v) return null;
  const s = v.trim();
  if (/^ready$/i.test(s)) return "Ready";
  const qm = s.match(/Q\s?([1-4])\s*[\/\-\s]?\s*(20\d{2})/i);
  if (qm) return `Q${qm[1]} ${qm[2]}`;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `Q${q} ${d.getFullYear()}`;
  }
  const ym = s.match(/^(20\d{2})$/);
  if (ym) return ym[1];
  return s;
};

const handoverYear = (v: string | null): number | null => {
  if (!v) return null;
  if (/^ready$/i.test(v.trim())) return 0;
  const ym = v.match(/(20\d{2})/);
  return ym ? parseInt(ym[1], 10) : null;
};

interface Props {
  developerId?: string | null;
  developerName?: string | null;
  developerSlug?: string | null;
  currentProjectId: string;
}

const INITIAL_VISIBLE = 6;

export default function MoreFromDeveloperStrip({
  developerId,
  developerName,
  developerSlug,
  currentProjectId,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [fArea, setFArea] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("all");
  const [fHandover, setFHandover] = useState<string>("all");
  const [fPrice, setFPrice] = useState<string>("all");
  const [fType, setFType] = useState<string>("all");

  const { data } = useQuery({
    enabled: !!(developerId || developerName),
    queryKey: ["more-from-developer", developerId, developerName, currentProjectId],
    queryFn: async () => {
      const select =
        "id, name, slug, location, area_name, emirate, price_from, cover_image_url, handover_date, expected_completion, construction_status, payment_plan, payment_breakdown, status_label, description, property_type_label, sale_status, developer_id, developer_name";

      // Primary lookup by developer_id
      let rows: any[] = [];
      if (developerId) {
        const { data } = await supabase
          .from("projects")
          .select(select)
          .eq("developer_id", developerId)
          .neq("id", currentProjectId)
          .eq("is_published", true)
          .limit(120);
        rows = data ?? [];
      }

      // Fallback by exact developer_name (covers projects where developer_id is null)
      if (rows.length === 0 && developerName) {
        const { data } = await supabase
          .from("projects")
          .select(select)
          .eq("developer_name", developerName)
          .neq("id", currentProjectId)
          .eq("is_published", true)
          .limit(120);
        rows = data ?? [];
      }
      return rows;
    },
    staleTime: 5 * 60 * 1000,
  });

  const all = data ?? [];

  // Build filter option lists
  const areaOptions = useMemo(() => {
    const s = new Set<string>();
    all.forEach((p: any) => p.location && s.add(p.location));
    return Array.from(s).sort();
  }, [all]);
  const typeOptions = useMemo(() => {
    const s = new Set<string>();
    all.forEach((p: any) => p.property_type_label && s.add(p.property_type_label));
    return Array.from(s).sort();
  }, [all]);
  const statusOptions = useMemo(() => {
    const s = new Set<string>();
    all.forEach((p: any) => p.sale_status && s.add(p.sale_status));
    return Array.from(s).sort();
  }, [all]);

  const filtered = useMemo(() => {
    return all.filter((p: any) => {
      if (fArea !== "all" && p.location !== fArea) return false;
      if (fStatus !== "all" && p.sale_status !== fStatus) return false;
      if (fType !== "all" && p.property_type !== fType) return false;
      if (fHandover !== "all") {
        const y = handoverYear(p.handover_date);
        if (fHandover === "ready" && y !== 0) return false;
        if (fHandover === "2026" && y !== 2026) return false;
        if (fHandover === "2027" && y !== 2027) return false;
        if (fHandover === "2028+" && !(y !== null && y >= 2028)) return false;
      }
      if (fPrice !== "all") {
        const v = p.price_from || 0;
        if (fPrice === "<2m" && !(v > 0 && v < 2_000_000)) return false;
        if (fPrice === "2-5m" && !(v >= 2_000_000 && v < 5_000_000)) return false;
        if (fPrice === "5-10m" && !(v >= 5_000_000 && v < 10_000_000)) return false;
        if (fPrice === "10m+" && !(v >= 10_000_000)) return false;
      }
      return true;
    });
  }, [all, fArea, fStatus, fType, fHandover, fPrice]);

  if ((!developerId && !developerName) || all.length === 0) return null;

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const anyFilter =
    fArea !== "all" || fStatus !== "all" || fType !== "all" || fHandover !== "all" || fPrice !== "all";

  return (
    <div className="mt-10">
      <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-lg md:text-xl font-semibold text-foreground">
          More projects by <span className="text-[#B89555]">{developerName || "this developer"}</span>
          <span className="ml-2 text-xs font-normal text-[#1A1A1A]/60">
            ({filtered.length}
            {filtered.length !== all.length ? ` of ${all.length}` : ""})
          </span>
        </h3>
        <div className="flex items-center gap-2">
          {expanded && (
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A1A1A] border border-[#B89555]/50 bg-[#F7F2EA] hover:bg-[#EFE6D6] rounded-full px-3 py-1.5 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {anyFilter && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#B89555]" />}
            </button>
          )}
          {developerSlug && (
            <Link
              to={`/developer/${developerSlug}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A1A1A] border border-[#B89555]/50 bg-[#F7F2EA] hover:bg-[#EFE6D6] rounded-full px-4 py-2 transition-colors"
            >
              View developer page
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {expanded && showFilters && (
        <div className="mb-4 rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-3 grid grid-cols-2 md:grid-cols-5 gap-2">
          <Select label="Area" value={fArea} onChange={setFArea} options={[["all", "All areas"], ...areaOptions.map((a) => [a, a] as [string, string])]} />
          <Select
            label="Price"
            value={fPrice}
            onChange={setFPrice}
            options={[
              ["all", "Any price"],
              ["<2m", "Under AED 2M"],
              ["2-5m", "AED 2 – 5M"],
              ["5-10m", "AED 5 – 10M"],
              ["10m+", "AED 10M+"],
            ]}
          />
          <Select
            label="Handover"
            value={fHandover}
            onChange={setFHandover}
            options={[
              ["all", "Any handover"],
              ["ready", "Ready"],
              ["2026", "2026"],
              ["2027", "2027"],
              ["2028+", "2028+"],
            ]}
          />
          <Select label="Status" value={fStatus} onChange={setFStatus} options={[["all", "Any status"], ...statusOptions.map((s) => [s, s] as [string, string])]} />
          <Select label="Property type" value={fType} onChange={setFType} options={[["all", "Any type"], ...typeOptions.map((t) => [t, t] as [string, string])]} />
          {anyFilter && (
            <button
              onClick={() => {
                setFArea("all");
                setFStatus("all");
                setFType("all");
                setFHandover("all");
                setFPrice("all");
              }}
              className="col-span-2 md:col-span-5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1A1A1A]/80 hover:text-[#1A1A1A]"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visible.map((p: any) => {
          const handover = formatHandoverDisplay(deriveHandover(p));
          const hasPrice = typeof p.price_from === "number" && p.price_from > 0;
          return (
            <Link
              key={p.id}
              to={`/project/${p.slug}`}
              className="rounded-xl overflow-hidden border border-[#B89555]/30 bg-card hover:shadow-lg hover:shadow-gold/20 hover:border-[#B89555]/60 transition-all"
            >
              <div className="aspect-[4/3] bg-[#EFE6D6] overflow-hidden">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy"  decoding="async" />
                ) : null}
              </div>
              <div className="p-3">
                {p.location && (
                  <p className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 truncate">{p.location}</p>
                )}
                <p className="text-sm font-semibold text-foreground mt-1 truncate">{p.name}</p>
                <div className="mt-1.5 flex items-end justify-between gap-2">
                  {hasPrice ? (
                    <p className="text-xs text-price-orange font-bold tabular-nums truncate">From {formatPrice(p.price_from)}</p>
                  ) : (
                    <span />
                  )}
                  {handover ? (
                    <p className="text-[11px] font-semibold tabular-nums text-[#1A1A1A] truncate">{handover}</p>
                  ) : (
                    <span />
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length > INITIAL_VISIBLE && (
        <div className="mt-5 flex justify-center">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A1A1A] border border-[#B89555]/50 bg-[#F7F2EA] hover:bg-[#EFE6D6] rounded-full px-5 py-2 transition-colors"
          >
            {expanded ? "Show less" : `View more (${filtered.length - INITIAL_VISIBLE})`}
            <ArrowRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 font-semibold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-[#B89555]/40 bg-white text-[#1A1A1A] text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#B89555]/40"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
