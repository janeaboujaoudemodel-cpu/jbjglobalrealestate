/**
 * BrokerageAgenciesDirectory — single-entity view of public.crm_brokerages.
 * No shared role-tab bar; click a row to open the brokerage hub drawer.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Globe, ExternalLink, Phone, Mail, Star } from "lucide-react";
import { CompanyHubDrawer } from "@/components/crm/CompanyHubDrawer";
import { sortBrokeragesForDirectory, normalizeForSearch } from "@/utils/brokerageRanking";

interface AgencyRow {
  id: string;
  company_name: string;
  emirate: string | null;
  country: string | null;
  office_location: string | null;
  office_address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  estimated_agent_count: number | null;
  star_rating: number | null;
  source: string | null;
  entry_source: string | null;
  database_source: string | null;
  upload_source: string | null;
  directory_rank: number | null;
  deal_count_cached: number | null;
  is_junk: boolean | null;
}

export default function BrokerageAgenciesDirectory() {
  const [rows, setRows] = useState<AgencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hubOpen, setHubOpen] = useState(false);
  const [hubName, setHubName] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const all: AgencyRow[] = [];
        let from = 0;
        const PAGE = 1000;
        for (let i = 0; i < 20; i++) {
          const { data, error } = await supabase
            .from("crm_brokerages")
            .select("id,company_name,emirate,country,office_location,office_address,phone,email,website,logo_url,estimated_agent_count,star_rating,source,entry_source,database_source,upload_source,directory_rank,deal_count_cached,is_junk")
            .is("deleted_at", null)
            .or("is_junk.is.null,is_junk.eq.false")
            .range(from, from + PAGE - 1);
          if (error) throw error;
          const batch = (data || []) as AgencyRow[];
          all.push(...batch);
          if (batch.length < PAGE) break;
          from += PAGE;
        }
        if (alive) setRows(sortBrokeragesForDirectory(all));
      } catch (e: any) {
        if (alive) setErr(e?.message || "Failed to load agencies");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(search);
    if (!q) return rows;
    return rows.filter(r =>
      normalizeForSearch(r.company_name).includes(q) ||
      normalizeForSearch(r.emirate || "").includes(q) ||
      normalizeForSearch(r.country || "").includes(q) ||
      normalizeForSearch(r.office_location || "").includes(q) ||
      normalizeForSearch(r.email || "").includes(q),
    );
  }, [rows, search]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (err) {
    return (
      <div className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-6 text-center">
        <p className="text-sm text-[#1A1A1A]">Could not load brokerage agencies.</p>
        <p className="text-xs text-[#1A1A1A]/60 mt-1">{err}</p>
      </div>
    );
  }

  const sourceLabel = (r: AgencyRow) =>
    [r.database_source, r.upload_source, r.source, r.entry_source].filter(Boolean).join(" · ") || "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Brokerage Agencies</h2>
          <p className="text-xs text-[#1A1A1A]/60">
            {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} agencies
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company, emirate, country, email…"
          className="h-9 w-80 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] px-3 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#B89555]"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#B89555]/30 bg-[#FDFBF7]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F7F2EA] text-[#1A1A1A]">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Agency</th>
              <th className="text-left px-4 py-2 font-semibold">Emirate</th>
              <th className="text-left px-4 py-2 font-semibold">Country</th>
              <th className="text-left px-4 py-2 font-semibold">Office</th>
              <th className="text-left px-4 py-2 font-semibold">Phone</th>
              <th className="text-left px-4 py-2 font-semibold">Email</th>
              <th className="text-right px-4 py-2 font-semibold">Agents</th>
              <th className="text-right px-4 py-2 font-semibold">Rating</th>
              <th className="text-left px-4 py-2 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B89555]/15">
            {filtered.slice(0, 1500).map((r) => (
              <tr
                key={r.id}
                onClick={() => { setHubName(r.company_name); setHubOpen(true); }}
                className="cursor-pointer hover:bg-[#F7F2EA]/60"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#F7F2EA] border border-[#B89555]/20 flex items-center justify-center overflow-hidden flex-none">
                      {r.logo_url
                        ? <img src={r.logo_url} alt="" className="max-w-full max-h-full object-contain" />
                        : <Building2 className="h-4 w-4 text-[#1A1A1A]/40" />}
                    </div>
                    <span className="font-semibold text-[#1A1A1A]">{r.company_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs">{r.emirate || "—"}</td>
                <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs">{r.country || "—"}</td>
                <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs">{r.office_location || r.office_address || "—"}</td>
                <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs">
                  {r.phone ? (
                    <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs">
                  {r.email ? (
                    <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-[#1A1A1A]">{r.estimated_agent_count ?? "—"}</td>
                <td className="px-4 py-3 text-right text-[#1A1A1A]/80 text-xs">
                  {r.star_rating ? (
                    <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" />{Number(r.star_rating).toFixed(1)}</span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-[#1A1A1A]/70 text-[11px]">{sourceLabel(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > 1500 && (
        <p className="text-xs text-[#1A1A1A]/60 text-right">
          Showing first 1,500 of {filtered.length.toLocaleString()} matches.
        </p>
      )}

      {hubName && (
        <CompanyHubDrawer
          open={hubOpen}
          onOpenChange={setHubOpen}
          type="brokerage"
          companyName={hubName}
        />
      )}
    </div>
  );
}
