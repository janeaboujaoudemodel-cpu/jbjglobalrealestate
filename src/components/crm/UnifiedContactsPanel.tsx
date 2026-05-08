/**
 * UnifiedContactsPanel — single source-of-truth view of every CRM contact
 * (brokers, agents, developer reps, investors, partners) drawn from
 * `vw_crm_contacts`. Includes source filter chips and a one-click export
 * via the `crm-export` edge function.
 *
 * Reuses existing canonical tables — no parallel CRM DB.
 */
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Download, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ContactRow = {
  id: string;
  kind: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  company_kind: string | null;
  company_name: string | null;
  source: string | null;
  labels: string[] | null;
  last_interaction_at: string | null;
  created_at: string | null;
};

const KIND_LABEL: Record<string, string> = {
  broker: "Broker",
  brokerage_agent: "Agent",
  developer_rep: "Dev Rep",
  investor: "Investor",
  partner: "Partner",
};

export function UnifiedContactsPanel() {
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [activeKind, setActiveKind] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("vw_crm_contacts" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          toast.error(error.message);
          setRows([]);
        } else {
          setRows((data || []) as ContactRow[]);
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const sources = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.source) set.add(r.source);
    return Array.from(set).sort();
  }, [rows]);

  const kinds = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.kind) set.add(r.kind);
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (activeKind && r.kind !== activeKind) return false;
      if (activeSource && r.source !== activeSource) return false;
      if (!q) return true;
      return (
        (r.name || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        (r.phone || "").toLowerCase().includes(q) ||
        (r.company_name || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, activeKind, activeSource]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const body: Record<string, unknown> = { format: "csv" };
      if (activeSource) {
        body.scope = "source";
        body.value = activeSource;
      } else {
        body.scope = "all";
      }
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-export`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? ""}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `crm-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`Exported ${filtered.length} contacts`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-xl p-4 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-[#1A1A1A]">Unified Contacts</h3>
          <p className="text-xs text-[#1A1A1A]/70">
            All brokers, agents, developer reps, investors and partners — one view.
          </p>
        </div>
        <Button variant="gold" size="sm" onClick={exportCsv} disabled={exporting || filtered.length === 0}>
          {exporting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
          Export {filtered.length > 0 ? `(${filtered.length})` : ""}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company…"
            className="pl-8 bg-[#F7F2EA] border-[#B89555]/30 text-[#1A1A1A]"
          />
        </div>
      </div>

      {kinds.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-[#1A1A1A]/60" />
          <Badge
            variant={activeKind === null ? "default" : "outline"}
            onClick={() => setActiveKind(null)}
            className="cursor-pointer"
          >
            All kinds
          </Badge>
          {kinds.map((k) => (
            <Badge
              key={k}
              variant={activeKind === k ? "default" : "outline"}
              onClick={() => setActiveKind(activeKind === k ? null : k)}
              className="cursor-pointer"
            >
              {KIND_LABEL[k] ?? k}
            </Badge>
          ))}
        </div>
      )}

      {sources.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60">Source</span>
          <Badge
            variant={activeSource === null ? "default" : "outline"}
            onClick={() => setActiveSource(null)}
            className="cursor-pointer"
          >
            All
          </Badge>
          {sources.map((s) => (
            <Badge
              key={s}
              variant={activeSource === s ? "default" : "outline"}
              onClick={() => setActiveSource(activeSource === s ? null : s)}
              className="cursor-pointer"
            >
              {s}
            </Badge>
          ))}
        </div>
      )}

      <div className="border border-[#B89555]/20 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-[#B89555]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-[#1A1A1A]/60">
            No contacts match the current filters.
          </div>
        ) : (
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#EFE6D6] text-[#1A1A1A]">
                <tr className="text-left">
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Kind</th>
                  <th className="px-3 py-2 font-semibold">Company</th>
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Phone</th>
                  <th className="px-3 py-2 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 500).map((r) => (
                  <tr key={`${r.kind}-${r.id}`} className="border-t border-[#B89555]/10 hover:bg-[#F7F2EA]">
                    <td className="px-3 py-2 text-[#1A1A1A]">{r.name || "—"}</td>
                    <td className="px-3 py-2 text-[#1A1A1A]/80">{KIND_LABEL[r.kind] ?? r.kind}</td>
                    <td className="px-3 py-2 text-[#1A1A1A]/80">{r.company_name || "—"}</td>
                    <td className="px-3 py-2 text-[#1A1A1A]/80">{r.email || "—"}</td>
                    <td className="px-3 py-2 text-[#1A1A1A]/80">{r.phone || "—"}</td>
                    <td className="px-3 py-2 text-[#1A1A1A]/70 text-xs">{r.source || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 500 && (
              <div className="px-3 py-2 text-xs text-[#1A1A1A]/60 border-t border-[#B89555]/20 bg-[#F7F2EA]">
                Showing first 500 of {filtered.length}. Refine filters or export to see all.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
