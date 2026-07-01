import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, Database, Search, ChevronLeft, ChevronRight, X, Mail, Phone, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ZohoModule =
  | "Leads" | "Contacts" | "Accounts" | "Deals"
  | "Tasks" | "Cases" | "Products" | "Quotes" | "Invoices";

const MODULES: { id: ZohoModule; label: string }[] = [
  { id: "Leads", label: "Leads" },
  { id: "Contacts", label: "Contacts" },
  { id: "Accounts", label: "Accounts" },
  { id: "Deals", label: "Deals" },
  { id: "Tasks", label: "Tasks" },
  { id: "Cases", label: "Cases" },
  { id: "Products", label: "Products" },
  { id: "Quotes", label: "Quotes" },
  { id: "Invoices", label: "Invoices" },
];

const COLUMNS: Record<ZohoModule, { key: string; label: string }[]> = {
  Leads: [
    { key: "Full_Name", label: "Name" },
    { key: "Company", label: "Company" },
    { key: "Email", label: "Email" },
    { key: "Phone", label: "Phone" },
    { key: "Lead_Status", label: "Status" },
    { key: "Lead_Source", label: "Source" },
  ],
  Contacts: [
    { key: "Full_Name", label: "Name" },
    { key: "Account_Name", label: "Account" },
    { key: "Email", label: "Email" },
    { key: "Phone", label: "Phone" },
    { key: "Title", label: "Title" },
  ],
  Accounts: [
    { key: "Account_Name", label: "Account" },
    { key: "Industry", label: "Industry" },
    { key: "Account_Type", label: "Type" },
    { key: "Phone", label: "Phone" },
    { key: "Website", label: "Website" },
  ],
  Deals: [
    { key: "Deal_Name", label: "Deal" },
    { key: "Account_Name", label: "Account" },
    { key: "Stage", label: "Stage" },
    { key: "Amount", label: "Amount" },
    { key: "Probability", label: "Prob %" },
    { key: "Closing_Date", label: "Close Date" },
  ],
  Tasks: [
    { key: "Subject", label: "Subject" },
    { key: "Status", label: "Status" },
    { key: "Priority", label: "Priority" },
    { key: "Due_Date", label: "Due" },
  ],
  Cases: [
    { key: "Subject", label: "Subject" },
    { key: "Status", label: "Status" },
    { key: "Priority", label: "Priority" },
    { key: "Account_Name", label: "Account" },
    { key: "Case_Origin", label: "Origin" },
  ],
  Products: [
    { key: "Product_Name", label: "Product" },
    { key: "Product_Code", label: "Code" },
    { key: "Product_Category", label: "Category" },
    { key: "Unit_Price", label: "Unit Price" },
    { key: "Qty_in_Stock", label: "Stock" },
  ],
  Quotes: [
    { key: "Subject", label: "Subject" },
    { key: "Quote_Stage", label: "Stage" },
    { key: "Grand_Total", label: "Total" },
    { key: "Account_Name", label: "Account" },
    { key: "Valid_Till", label: "Valid Till" },
  ],
  Invoices: [
    { key: "Subject", label: "Subject" },
    { key: "Status", label: "Status" },
    { key: "Grand_Total", label: "Total" },
    { key: "Account_Name", label: "Account" },
    { key: "Due_Date", label: "Due" },
  ],
};

function formatCell(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "object") {
    const v = value as { name?: string; id?: string };
    return v.name ?? v.id ?? "—";
  }
  return String(value);
}

const PER_PAGE = 50;

export default function ZohoCRMPage() {
  const [module, setModule] = useState<ZohoModule>("Leads");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [info, setInfo] = useState<{ count?: number; more_records?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);

  const cols = useMemo(() => COLUMNS[module], [module]);

  async function load(mod: ZohoModule, pg: number) {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("zoho-crm-proxy", {
        body: { module: mod, per_page: PER_PAGE, page: pg },
      });
      if (fnErr) throw new Error(fnErr.message);
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setRows((data?.data ?? []) as Record<string, unknown>[]);
      setInfo((data?.info ?? null) as { count?: number; more_records?: boolean } | null);
      setLastFetched(new Date());
    } catch (e) {
      setError((e as Error).message || "Failed to load Zoho CRM");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(module, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, page]);

  useEffect(() => { setPage(1); }, [module]);

  const filteredRows = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      cols.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q))
    );
  }, [rows, query, cols]);

  return (
    <div className="min-h-screen bg-[#F7F2EA]">
      {/* Emerald header band */}
      <div
        data-emerald="true"
        data-allow-dark-cta
        data-no-contrast-guard
        className="jj-emerald-metallic allow-white w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-white"
        style={{ background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #041F16 100%)" }}
      >
        <div className="mx-auto max-w-[1400px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="h-11 w-11 rounded-xl inline-flex items-center justify-center border border-emerald-400/60"
              style={{ background: "linear-gradient(180deg,#0B5F46,#043528)", boxShadow: "inset 0 1px 0 rgba(110,231,183,0.55)" }}
            >
              <Database className="h-5 w-5" style={{ color: "#FFFFFF" }} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/90">Integration · Live</p>
              <h1 className="text-xl sm:text-2xl font-semibold text-white" style={{ color: "#FFFFFF" }}>Zoho CRM</h1>
              <p className="text-[13px] text-emerald-100/80 mt-0.5">
                Your Zoho workspace embedded here — click any row for full details.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-200/80" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${module.toLowerCase()}…`}
                className="allow-white pl-7 pr-3 py-2 rounded-lg text-[12px] text-white placeholder:text-emerald-200/60 outline-none w-[220px]"
                style={{
                  background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #043528 100%)",
                  border: "1px solid #10B981",
                  boxShadow: "inset 0 1px 0 rgba(110,231,183,0.55), inset 0 -1px 0 rgba(0,0,0,0.35)",
                }}
              />
            </div>
            <button
              onClick={() => load(module, page)}
              disabled={loading}
              className="allow-white inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
              style={{
                background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #043528 100%)",
                border: "1px solid #10B981",
                boxShadow: "inset 0 1px 0 rgba(110,231,183,0.55), inset 0 -1px 0 rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.35)",
              }}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Module tabs */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-5">
        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-[#F7F2EA] border border-[#E7DDC8]">
          {MODULES.map((m) => {
            const active = m.id === module;
            return (
              <button
                key={m.id}
                onClick={() => setModule(m.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors",
                  active ? "text-white" : "text-[#1A1A1A] hover:bg-[#EFE6D6]"
                )}
                style={
                  active
                    ? {
                        background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #043528 100%)",
                        border: "1px solid #10B981",
                        boxShadow: "inset 0 1px 0 rgba(110,231,183,0.55), inset 0 -1px 0 rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.35)",
                        color: "#FFFFFF",
                      }
                    : undefined
                }
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Meta strip */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5A5346]">
          <div>
            Showing <span className="font-semibold text-[#1A1A1A]">{filteredRows.length}</span>
            {info?.count != null && !query ? <> of {info.count}{info.more_records ? "+" : ""}</> : null} records
            {query ? <> · filtered from {rows.length}</> : null}
          </div>
          <div>{lastFetched ? `Updated ${lastFetched.toLocaleTimeString()}` : ""}</div>
        </div>

        {/* Table card */}
        <div className="mt-3 rounded-2xl bg-white border border-[#E7DDC8] shadow-[0_6px_18px_-16px_rgba(6,78,59,0.35)] overflow-hidden">
          {error ? (
            <div className="p-6 text-[13px] text-red-700 bg-red-50 border-b border-red-100">{error}</div>
          ) : null}

          {loading && rows.length === 0 ? (
            <div className="p-10 flex items-center justify-center text-[#5A5346] text-[13px]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading {module}…
            </div>
          ) : filteredRows.length === 0 && !error ? (
            <div className="p-10 text-center text-[13px] text-[#5A5346]">
              No {module.toLowerCase()} {query ? "match your search" : "found in your Zoho workspace"}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-[#F7F2EA] text-[11px] uppercase tracking-wider text-[#5A5346]">
                    {cols.map((c) => (
                      <th key={c.key} className="text-left font-semibold px-4 py-2.5 whitespace-nowrap">
                        {c.label}
                      </th>
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
                        <td key={c.key} className="px-4 py-2.5 whitespace-nowrap">
                          {formatCell(row[c.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-3 mb-8 flex items-center justify-between">
          <p className="text-[11px] text-[#5A5346]">
            Read-only view via Lovable Cloud connector gateway. Writes stay in your Zoho workspace.
          </p>
          <div className="flex items-center gap-1.5">
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
        </div>
      </div>

      {/* Detail drawer */}
      {selected ? (
        <div className="fixed inset-0 z-50 flex" onClick={() => setSelected(null)}>
          <div className="flex-1 bg-black/40" />
          <div
            className="w-full max-w-[520px] h-full bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="allow-white px-5 py-4 flex items-center justify-between text-white"
              style={{ background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #041F16 100%)" }}
            >
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/90">{module.slice(0, -1)}</p>
                <p className="text-[15px] font-semibold text-white">
                  {formatCell(selected.Full_Name ?? selected.Deal_Name ?? selected.Account_Name ?? selected.Product_Name ?? selected.Subject ?? "Record")}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="allow-white h-8 w-8 inline-flex items-center justify-center rounded-lg text-white"
                style={{ background: "linear-gradient(180deg,#0B5F46,#043528)", border: "1px solid #10B981" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick actions */}
            <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-[#EFE6D6] bg-[#FBF7EF]">
              {selected.Email ? (
                <a
                  href={`mailto:${selected.Email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
                  style={{ background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #043528 100%)", border: "1px solid #10B981" }}
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </a>
              ) : null}
              {selected.Phone ? (
                <a
                  href={`tel:${selected.Phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
                  style={{ background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #043528 100%)", border: "1px solid #10B981" }}
                >
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
              ) : null}
              {selected.Company || selected.Account_Name ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#1A1A1A] bg-[#EFE6D6]">
                  <Building2 className="h-3.5 w-3.5" /> {formatCell(selected.Company ?? selected.Account_Name)}
                </span>
              ) : null}
            </div>

            {/* All fields */}
            <div className="p-5">
              <dl className="grid grid-cols-1 gap-3">
                {Object.entries(selected)
                  .filter(([k]) => !k.startsWith("$") && k !== "id")
                  .map(([k, v]) => (
                    <div key={k} className="border-b border-[#EFE6D6] pb-2">
                      <dt className="text-[10px] uppercase tracking-wider text-[#5A5346] font-semibold">
                        {k.replace(/_/g, " ")}
                      </dt>
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
