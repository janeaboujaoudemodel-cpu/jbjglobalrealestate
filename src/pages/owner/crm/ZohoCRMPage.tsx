import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, ExternalLink, Database } from "lucide-react";
import { cn } from "@/lib/utils";

type ZohoModule = "Leads" | "Contacts" | "Accounts" | "Deals" | "Tasks";

const MODULES: { id: ZohoModule; label: string }[] = [
  { id: "Leads", label: "Leads" },
  { id: "Contacts", label: "Contacts" },
  { id: "Accounts", label: "Accounts" },
  { id: "Deals", label: "Deals" },
  { id: "Tasks", label: "Tasks" },
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
};

function formatCell(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "object") {
    // Zoho returns { name, id } lookups
    const v = value as { name?: string; id?: string };
    return v.name ?? v.id ?? "—";
  }
  return String(value);
}

export default function ZohoCRMPage() {
  const [module, setModule] = useState<ZohoModule>("Leads");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [info, setInfo] = useState<{ count?: number; more_records?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const cols = useMemo(() => COLUMNS[module], [module]);

  async function load(mod: ZohoModule) {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("zoho-crm-proxy", {
        body: { module: mod, per_page: 50, page: 1 },
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
    load(module);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module]);

  return (
    <div className="min-h-screen bg-[#F7F2EA]">
      {/* Emerald header band */}
      <div
        data-emerald="true"
        data-allow-dark-cta
        data-no-contrast-guard
        className="jj-emerald-metallic allow-white w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-white"
        style={{
          background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #041F16 100%)",
        }}
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
              <h1 className="text-xl sm:text-2xl font-semibold text-white" style={{ color: "#FFFFFF" }}>
                Zoho CRM
              </h1>
              <p className="text-[13px] text-emerald-100/80 mt-0.5">
                Read-only view of your Zoho workspace. Your internal CRM stays as your source of truth.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(module)}
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
            <a
              href="https://crm.zoho.com"
              target="_blank"
              rel="noreferrer"
              className="allow-white inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white"
              style={{
                background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #043528 100%)",
                border: "1px solid #10B981",
                boxShadow: "inset 0 1px 0 rgba(110,231,183,0.55), inset 0 -1px 0 rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.35)",
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open in Zoho
            </a>
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
            {info?.count != null ? (
              <>Showing <span className="font-semibold text-[#1A1A1A]">{rows.length}</span> of {info.count}{info.more_records ? "+" : ""} records</>
            ) : (
              <>—</>
            )}
          </div>
          <div>{lastFetched ? `Updated ${lastFetched.toLocaleTimeString()}` : ""}</div>
        </div>

        {/* Table card */}
        <div className="mt-3 rounded-2xl bg-white border border-[#E7DDC8] shadow-[0_6px_18px_-16px_rgba(6,78,59,0.35)] overflow-hidden">
          {error ? (
            <div className="p-6 text-[13px] text-red-700 bg-red-50 border-b border-red-100">
              {error}
            </div>
          ) : null}

          {loading && rows.length === 0 ? (
            <div className="p-10 flex items-center justify-center text-[#5A5346] text-[13px]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading {module}…
            </div>
          ) : rows.length === 0 && !error ? (
            <div className="p-10 text-center text-[13px] text-[#5A5346]">
              No {module.toLowerCase()} found in your Zoho workspace.
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
                  {rows.map((row, i) => (
                    <tr
                      key={(row.id as string) ?? i}
                      className={cn("border-t border-[#EFE6D6]", i % 2 === 1 && "bg-[#FBF7EF]")}
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

        <p className="mt-3 mb-8 text-[11px] text-[#5A5346]">
          Read-only view via Lovable Cloud connector gateway. No data is written to Zoho from this page.
        </p>
      </div>
    </div>
  );
}
