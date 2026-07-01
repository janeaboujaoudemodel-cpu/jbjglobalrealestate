/**
 * Generic JBJ CRM module page.
 * - For modules bound to a Zoho module, fetches live via zoho-crm-proxy
 *   and mirrors the payload to localStorage so it survives disconnect.
 * - For JBJ-only modules, shows an empty-state scaffold.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, RefreshCw, Search, Plus, ChevronLeft, ChevronRight, X,
  Mail, Phone, Building2, LayoutList, Kanban, Table as TableIcon, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  JBJ_CRM_MODULES, COLUMNS_BY_ZOHO, readMirror, writeMirror,
  type JbjCrmSection, type ZohoModuleId,
} from "./jbjCrmConfig";

const EMERALD_PILL: React.CSSProperties = {
  background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #043528 100%)",
  border: "1px solid #10B981",
  boxShadow: "inset 0 1px 0 rgba(110,231,183,0.55), inset 0 -1px 0 rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.35)",
  color: "#FFFFFF",
};

const PER_PAGE = 50;

function formatCell(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "object") {
    const o = v as { name?: string; id?: string };
    return o.name ?? o.id ?? "—";
  }
  return String(v);
}

type View = "list" | "kanban" | "table" | "chart";

interface Props { section: JbjCrmSection; }

export default function JbjCrmModulePage({ section }: Props) {
  const params = useParams();
  const activeSection: JbjCrmSection = (params.section as JbjCrmSection) || section;
  const module = useMemo(
    () => JBJ_CRM_MODULES.find((m) => m.id === activeSection),
    [activeSection]
  );

  const [view, setView] = useState<View>("list");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [info, setInfo] = useState<{ count?: number; more_records?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromMirror, setFromMirror] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);

  const zoho: ZohoModuleId | undefined = module?.zohoModule;
  const cols = zoho ? COLUMNS_BY_ZOHO[zoho] : [];

  useEffect(() => { setPage(1); setSelected(null); setError(null); setQuery(""); }, [activeSection]);

  useEffect(() => {
    if (!zoho) return;
    let alive = true;

    // Hydrate from mirror instantly.
    const cached = readMirror(zoho, page);
    if (cached) {
      setRows(cached.data ?? []);
      setInfo(cached.info ?? null);
      setFromMirror(true);
    } else {
      setRows([]); setInfo(null); setFromMirror(false);
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("zoho-crm-proxy", {
          body: { module: zoho, per_page: PER_PAGE, page },
        });
        if (!alive) return;
        if (fnErr) throw new Error(fnErr.message);
        if ((data as any)?.error) throw new Error((data as any).error);
        const nextRows = (data?.data ?? []) as Record<string, unknown>[];
        const nextInfo = (data?.info ?? null) as any;
        setRows(nextRows); setInfo(nextInfo); setFromMirror(false);
        writeMirror(zoho, page, { data: nextRows, info: nextInfo });
      } catch (e) {
        if (!alive) return;
        // Keep mirror rows visible; only surface the error banner if we have nothing.
        setError((e as Error).message || "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [zoho, page]);

  const filteredRows = useMemo(() => {
    if (!query.trim() || !cols.length) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => cols.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q)));
  }, [rows, query, cols]);

  if (!module) return <div className="p-8 text-[#5A5346]">Unknown module.</div>;
  const Icon = module.icon;

  return (
    <div className="min-h-full">
      {/* Sticky top bar (module header) */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E7DDC8]">

        <div className="flex items-center gap-3 px-5 py-3">
          <div className="h-8 w-8 rounded-lg inline-flex items-center justify-center" style={EMERALD_PILL}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">{module.label}</h1>
            <p className="text-[11px] text-[#5A5346]">
              {zoho ? (
                <>Synced from Zoho · {info?.count != null ? `${info.count}${info.more_records ? "+" : ""} records` : "—"}
                {fromMirror ? " · cached" : ""}</>
              ) : "JBJ workspace"}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {zoho ? (
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5A5346]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${module.label.toLowerCase()}…`}
                  className="pl-7 pr-3 py-1.5 rounded-lg text-[12px] text-[#1A1A1A] bg-[#F7F2EA] border border-[#E7DDC8] outline-none w-[200px] focus:border-[#064E3B]"
                />
              </div>
            ) : null}
            {zoho ? (
              <button
                onClick={() => { setPage((p) => p); /* trigger fetch via effect */ }}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-[#1A1A1A] bg-white border border-[#E7DDC8] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Sync
              </button>
            ) : null}
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={EMERALD_PILL}>
              <Plus className="h-3.5 w-3.5" /> Create
            </button>
          </div>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-1 px-5 pb-2">
          {([
            ["list", LayoutList, "List"], ["kanban", Kanban, "Kanban"],
            ["table", TableIcon, "Table"], ["chart", BarChart3, "Chart"],
          ] as const).map(([v, VIcon, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-semibold",
                view === v ? "text-white" : "text-[#1A1A1A] hover:bg-[#F7F2EA]"
              )}
              style={view === v ? EMERALD_PILL : undefined}
            >
              <VIcon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {error ? (
          <div className="mb-3 p-3 text-[12px] text-red-800 bg-red-50 border border-red-200 rounded-lg">{error}</div>
        ) : null}

        {!zoho ? (
          <EmptyModule label={module.label} />
        ) : view !== "list" && view !== "table" ? (
          <div className="rounded-2xl bg-white border border-[#E7DDC8] p-10 text-center text-[13px] text-[#5A5346]">
            {view === "kanban" ? "Kanban view lands in the next iteration." : "Chart view lands in the next iteration."}
          </div>
        ) : loading && rows.length === 0 ? (
          <div className="p-10 flex items-center justify-center text-[#5A5346] text-[13px]">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading {module.label}…
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E7DDC8] p-10 text-center text-[13px] text-[#5A5346]">
            No {module.label.toLowerCase()} {query ? "match your search" : "yet"}.
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-[#E7DDC8] shadow-[0_6px_18px_-16px_rgba(6,78,59,0.35)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-[#F7F2EA] text-[11px] uppercase tracking-wider text-[#5A5346]">
                    {cols.map((c) => (
                      <th key={c.key} className="text-left font-semibold px-4 py-2.5 whitespace-nowrap">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[#1A1A1A]">
                  {filteredRows.map((row, i) => (
                    <tr
                      key={(row.id as string) ?? i}
                      onClick={() => setSelected(row)}
                      className={cn(
                        "border-t border-[#EFE6D6] cursor-pointer hover:bg-[#F7F2EA] transition-colors",
                        i % 2 === 1 && "bg-[#FBF7EF]"
                      )}
                    >
                      {cols.map((c) => (
                        <td key={c.key} className="px-4 py-2.5 whitespace-nowrap">{formatCell(row[c.key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {zoho && (view === "list" || view === "table") ? (
          <div className="mt-3 flex items-center justify-end gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-[#1A1A1A] bg-white border border-[#E7DDC8] disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-[12px] text-[#1A1A1A] font-semibold px-2">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!info?.more_records || loading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-[#1A1A1A] bg-white border border-[#E7DDC8] disabled:opacity-50"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Detail drawer */}
      {selected ? (
        <div className="fixed inset-0 z-50 flex" onClick={() => setSelected(null)}>
          <div className="flex-1 bg-black/40" />
          <div
            className="w-full max-w-[520px] h-full bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 flex items-center justify-between text-white" style={{ background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #041F16 100%)" }}>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/75">{module.label.slice(0, -1) || module.label}</p>
                <p className="text-[15px] font-semibold text-white">
                  {formatCell(
                    (selected as any).Full_Name ?? (selected as any).Deal_Name ?? (selected as any).Account_Name ??
                    (selected as any).Product_Name ?? (selected as any).Subject ?? "Record"
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-white"
                style={EMERALD_PILL}
              ><X className="h-4 w-4" /></button>
            </div>

            <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-[#EFE6D6] bg-[#FBF7EF]">
              {(selected as any).Email ? (
                <a href={`mailto:${(selected as any).Email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={EMERALD_PILL}>
                  <Mail className="h-3.5 w-3.5" /> Email
                </a>
              ) : null}
              {(selected as any).Phone ? (
                <a href={`tel:${(selected as any).Phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={EMERALD_PILL}>
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
              ) : null}
              {(selected as any).Company || (selected as any).Account_Name ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#1A1A1A] bg-[#EFE6D6]">
                  <Building2 className="h-3.5 w-3.5" /> {formatCell((selected as any).Company ?? (selected as any).Account_Name)}
                </span>
              ) : null}
            </div>

            <div className="p-5">
              <dl className="grid grid-cols-1 gap-3">
                {Object.entries(selected).filter(([k]) => !k.startsWith("$") && k !== "id").map(([k, v]) => (
                  <div key={k} className="border-b border-[#EFE6D6] pb-2">
                    <dt className="text-[10px] uppercase tracking-wider text-[#5A5346] font-semibold">{k.replace(/_/g, " ")}</dt>
                    <dd className="text-[13px] text-[#1A1A1A] mt-0.5 break-words">{formatCell(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyModule({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-white border border-[#E7DDC8] p-12 text-center">
      <p className="text-[13px] font-semibold text-[#1A1A1A]">{label}</p>
      <p className="text-[12px] text-[#5A5346] mt-1 max-w-md mx-auto">
        This module lives inside JBJ CRM. Start creating {label.toLowerCase()} or connect a source in Integrations.
      </p>
    </div>
  );
}
