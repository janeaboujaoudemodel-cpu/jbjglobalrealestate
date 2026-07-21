import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Inbox, Check, X, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type PendingRow = {
  id: string;
  dld_office_number: string | null;
  company_name: string;
  company_name_ar: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: string;
  source: string;
  created_at: string;
};

/**
 * Pending Brokerage Imports — net-new agencies discovered from the latest
 * DLD Broker Offices upload, held for owner approval before being merged
 * into crm_brokerages.
 */
export default function PendingBrokerageImportsSection() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const pendingQ = useQuery({
    queryKey: ["pending-brokerage-imports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_pending_brokerage_imports" as any)
        .select("id,dld_office_number,company_name,company_name_ar,email,phone,website,status,source,created_at")
        .eq("status", "pending")
        .order("company_name", { ascending: true })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as unknown as PendingRow[];
    },
  });

  const rows = pendingQ.data ?? [];
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.company_name, r.email, r.phone, r.dld_office_number, r.company_name_ar]
        .some((v) => String(v ?? "").toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((r) => next.delete(r.id));
      else visible.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const approve = useMutation({
    mutationFn: async (ids: string[]) => {
      const chunk = 200;
      for (let i = 0; i < ids.length; i += chunk) {
        const slice = ids.slice(i, i + chunk);
        const { data: pending, error: fetchErr } = await supabase
          .from("crm_pending_brokerage_imports" as any)
          .select("id,dld_office_number,company_name,email,phone,website")
          .in("id", slice);
        if (fetchErr) throw fetchErr;
        const inserts = (pending ?? []).map((p: any) => ({
          company_name: p.company_name,
          dld_office_number: p.dld_office_number,
          email: p.email,
          phone: p.phone,
          website: p.website,
          entry_source: "dld_broker_offices_xls",
        }));
        if (inserts.length) {
          const { error: insErr } = await supabase.from("crm_brokerages" as any).insert(inserts as any);
          if (insErr) throw insErr;
        }
        const { error: updErr } = await supabase
          .from("crm_pending_brokerage_imports" as any)
          .update({ status: "approved", reviewed_at: new Date().toISOString() } as any)
          .in("id", slice);
        if (updErr) throw updErr;
      }
    },
    onSuccess: (_d, ids) => {
      toast.success(`Approved ${ids.length} brokerage${ids.length === 1 ? "" : "s"} and merged into directory.`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["pending-brokerage-imports"] });
      qc.invalidateQueries({ queryKey: ["brokerage-portal-brokerages"] });
      qc.invalidateQueries({ queryKey: ["brokerage-portal-stats"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to approve"),
  });

  const reject = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("crm_pending_brokerage_imports" as any)
        .update({ status: "rejected", reviewed_at: new Date().toISOString() } as any)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_d, ids) => {
      toast.success(`Rejected ${ids.length} entry${ids.length === 1 ? "" : "ies"}.`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["pending-brokerage-imports"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to reject"),
  });

  const runBulk = async (fn: (ids: string[]) => Promise<any>) => {
    if (!selected.size) return;
    setBusy(true);
    try {
      await fn(Array.from(selected));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30 shadow-[0_18px_45px_-34px_rgba(26,26,26,0.35)]">
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <span data-surface="emerald" className="allow-white shrink-0 size-11 rounded-2xl jj-emerald-metallic flex items-center justify-center">
            <Inbox className="size-5 text-white" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] font-black text-[#B89555]">Pending Approval · DLD Merge</p>
            <h2 className="text-lg md:text-xl font-black text-[#1A1A1A] tracking-tight">
              Missing brokerages from the latest upload
            </h2>
            <p className="text-sm text-[#1A1A1A]/70 mt-1 max-w-3xl">
              Net-new agencies detected against your existing directory — duplicates were automatically skipped. Approve to merge into the main brokerage list, or reject to discard.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
            {rows.length.toLocaleString()} pending
          </Badge>
          <Badge variant="outline" className="border-[#064E3B]/40 text-[#064E3B]">
            {selected.size} selected
          </Badge>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search company, email, phone, office #…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-80 bg-[#FDFBF7] text-[#1A1A1A]"
        />
        <Button size="sm" variant="outline" onClick={toggleAll} disabled={!visible.length}>
          {allVisibleSelected ? "Clear selection" : `Select all (${visible.length})`}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="gold"
            disabled={!selected.size || busy}
            onClick={() => runBulk((ids) => approve.mutateAsync(ids))}
            className="gap-1"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Approve selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!selected.size || busy}
            onClick={() => runBulk((ids) => reject.mutateAsync(ids))}
            className="gap-1"
          >
            <X className="size-4" /> Reject
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="sticky top-0 bg-[#EFE6D6] z-10">
            <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#1A1A1A]/70">
              <th className="px-3 py-2 w-10"></th>
              <th className="px-3 py-2">Brokerage</th>
              <th className="px-3 py-2 whitespace-nowrap">Office #</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2 whitespace-nowrap">Phone</th>
              <th className="px-3 py-2">Website</th>
            </tr>
          </thead>
          <tbody>
            {pendingQ.isLoading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-[#1A1A1A]/60">Loading pending imports…</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#1A1A1A]/60">
                {rows.length === 0 ? "No pending brokerages — all uploaded rows already exist in the directory." : "No matches for this search."}
              </td></tr>
            ) : visible.map((r) => (
              <tr key={r.id} className="border-t border-[#B89555]/15 hover:bg-[#F7F2EA]/60">
                <td className="px-3 py-2">
                  <Checkbox
                    checked={selected.has(r.id)}
                    onCheckedChange={() => toggleOne(r.id)}
                    aria-label={`Select ${r.company_name}`}
                  />
                </td>
                <td className="px-3 py-2 font-black text-[#1A1A1A]">
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="size-4 text-[#064E3B] shrink-0" />
                    <span className="truncate max-w-[280px]" title={r.company_name}>{r.company_name}</span>
                  </span>
                  {r.company_name_ar && (
                    <div className="text-[11px] text-[#1A1A1A]/55 mt-0.5 truncate max-w-[280px]" dir="rtl">{r.company_name_ar}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-[#1A1A1A] whitespace-nowrap">{r.dld_office_number || "—"}</td>
                <td className="px-3 py-2 text-[#1A1A1A]">{r.email || "—"}</td>
                <td className="px-3 py-2 text-[#1A1A1A] whitespace-nowrap">{r.phone || "—"}</td>
                <td className="px-3 py-2 text-[#1A1A1A]">
                  {r.website ? (
                    <a
                      href={r.website.startsWith("http") ? r.website : `https://${r.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#064E3B] underline decoration-[#B89555]/60 hover:decoration-[#064E3B]"
                    >
                      {r.website}
                    </a>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
