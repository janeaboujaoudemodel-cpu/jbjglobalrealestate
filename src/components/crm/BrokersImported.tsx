/**
 * BrokersImported — staged broker individuals from `crm_broker_import_staging`.
 * The directory view lives in BrokersRegistry; this view exposes the bulk
 * imported broker dataset (~33k rows) with search and pagination.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface StagingRow {
  id: string;
  raw: any;
  normalized: any;
  decision: string;
  match_confidence: number;
  created_at: string;
}

const PAGE = 50;

function pickField(row: StagingRow, ...keys: string[]): string | null {
  for (const src of [row.normalized, row.raw]) {
    if (!src || typeof src !== "object") continue;
    for (const k of keys) {
      const v = src[k];
      if (v != null && String(v).trim()) return String(v);
    }
  }
  return null;
}

export default function BrokersImported() {
  const [rows, setRows] = useState<StagingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const from = page * PAGE;
        const to = from + PAGE - 1;
        let q = supabase
          .from("crm_broker_import_staging")
          .select("id, raw, normalized, decision, match_confidence, created_at", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(from, to);
        // best-effort search across normalized.name / email
        if (search.trim()) {
          const s = `%${search.trim()}%`;
          q = q.or(`normalized->>name.ilike.${s},normalized->>email.ilike.${s},normalized->>company.ilike.${s}`);
        }
        const { data, error, count } = await q;
        if (!alive) return;
        if (error) throw error;
        setRows((data as any) || []);
        setTotal(count || 0);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Failed to load brokers");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [page, search]);

  const lastPage = Math.max(0, Math.ceil(total / PAGE) - 1);

  const items = useMemo(() => rows.map((r) => ({
    id: r.id,
    name: pickField(r, "name", "full_name", "display_name") || "Unnamed",
    email: pickField(r, "email"),
    phone: pickField(r, "phone", "mobile"),
    company: pickField(r, "company", "agency", "brokerage", "custom_label"),
    rera: pickField(r, "rera", "rera_no", "rera_number"),
    decision: r.decision,
    confidence: Math.round((r.match_confidence || 0) * 100),
    date: new Date(r.created_at).toLocaleDateString(),
  })), [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
            <Users className="h-5 w-5" /> Imported Brokers
          </h2>
          <p className="text-xs text-[#1A1A1A]/60">
            {total.toLocaleString()} rows in staging · page {page + 1} of {lastPage + 1}
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search name, email, agency…"
          className="h-9 w-64 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] px-3 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#B89555]"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : err ? (
        <div className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-6 text-center text-sm text-[#1A1A1A]">
          Could not load imported brokers. <span className="text-[#1A1A1A]/60">{err}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-10 text-center text-sm text-[#1A1A1A]/70">
          No imported brokers yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#B89555]/30 bg-[#FDFBF7]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F7F2EA] text-[#1A1A1A]">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Name</th>
                <th className="text-left px-4 py-2 font-semibold">Agency</th>
                <th className="text-left px-4 py-2 font-semibold">Email</th>
                <th className="text-left px-4 py-2 font-semibold">Phone</th>
                <th className="text-left px-4 py-2 font-semibold">RERA</th>
                <th className="text-left px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B89555]/15">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-[#F7F2EA]/60">
                  <td className="px-4 py-2 font-semibold text-[#1A1A1A]">{it.name}</td>
                  <td className="px-4 py-2 text-[#1A1A1A]/80">{it.company || "—"}</td>
                  <td className="px-4 py-2 text-[#1A1A1A]/80 text-xs">{it.email || "—"}</td>
                  <td className="px-4 py-2 text-[#1A1A1A]/80 text-xs">{it.phone || "—"}</td>
                  <td className="px-4 py-2 text-[#1A1A1A]/80 text-xs">{it.rera || "—"}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[#B89555]/40 bg-[#EFE6D6]/60 text-[#1A1A1A]">
                      {it.decision}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page === 0 || loading}
          onClick={() => setPage(p => Math.max(0, p - 1))}
          className="border-[#B89555]/40 text-[#1A1A1A]"
        >
          Previous
        </Button>
        <div className="text-xs text-[#1A1A1A]/60">
          {page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} of {total.toLocaleString()}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= lastPage || loading}
          onClick={() => setPage(p => p + 1)}
          className="border-[#B89555]/40 text-[#1A1A1A]"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
