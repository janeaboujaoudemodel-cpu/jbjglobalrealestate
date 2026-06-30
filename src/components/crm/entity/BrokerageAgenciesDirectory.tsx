/**
 * BrokerageAgenciesDirectory — single-entity view of public.crm_brokerages.
 * No shared role-tab bar; click a row to open the brokerage hub drawer.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Globe, Phone, Mail, Star } from "lucide-react";
import { CompanyHubDrawer } from "@/components/crm/CompanyHubDrawer";
import { sortBrokeragesForDirectory, normalizeForSearch } from "@/utils/brokerageRanking";
import { useEntityTotal } from "@/hooks/useEntityTotal";

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
  const [leadCounts, setLeadCounts] = useState<Map<string, number>>(new Map());
  const { total: dbTotal } = useEntityTotal("crm_brokerages", (q) => q.is("deleted_at", null).or("is_junk.is.null,is_junk.eq.false"));

  // Fetch lead counts per brokerage (matched by lowercased company_name)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const counts = new Map<string, number>();
        let from = 0;
        const PAGE = 1000;
        for (let i = 0; i < 30; i++) {
          const { data, error } = await supabase
            .from("crm_leads")
            .select("company_name")
            .not("company_name", "is", null)
            .range(from, from + PAGE - 1);
          if (error) break;
          const batch = (data || []) as Array<{ company_name: string | null }>;
          for (const r of batch) {
            const k = normalizeForSearch(r.company_name || "");
            if (!k) continue;
            counts.set(k, (counts.get(k) || 0) + 1);
          }
          if (batch.length < PAGE) break;
          from += PAGE;
        }
        if (alive) setLeadCounts(counts);
      } catch { /* non-fatal */ }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const all: AgencyRow[] = [];
        let from = 0;
        const PAGE = 1000;
        // Cap initial load to 2 batches (2 000 rows). The previous loop fetched up to
        // 20 000 rows on mount which made the Brokerage Agencies tab unusable.
        for (let i = 0; i < 2; i++) {
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

  // Emirate shortcut counts
  const emirateCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = (r.emirate || "").trim();
      if (!k) continue;
      m.set(k, (m.get(k) || 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const [emirate, setEmirate] = useState<string | null>(null);
  const finalRows = useMemo(() => {
    if (!emirate) return filtered;
    const k = emirate.toLowerCase();
    return filtered.filter(r => (r.emirate || "").toLowerCase() === k);
  }, [filtered, emirate]);

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

  const sourceLabel = (r: AgencyRow) => {
    const parts = [r.database_source, r.upload_source, r.source, r.entry_source]
      .filter(Boolean)
      .map((s) => /dld/i.test(String(s)) ? "DLD" : String(s).replace(/_/g, " "));
    return parts.length ? Array.from(new Set(parts)).join(" · ") : "—";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Brokerage Agencies</h2>
          <p className="text-xs text-[#1A1A1A]/60">
            {finalRows.length.toLocaleString()} of {(dbTotal ?? rows.length).toLocaleString()} agencies
            {emirate ? ` · filtered: ${emirate}` : ""}
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

      {/* Emirate shortcut chips */}
      {emirateCounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setEmirate(null)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
              !emirate
                ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60"
                : "bg-[#FDFBF7] text-[#1A1A1A]/80 border-[#B89555]/25 hover:bg-[#F7F2EA]"
            }`}
          >
            All <span className="text-[10px] tabular-nums opacity-70">{(dbTotal ?? rows.length).toLocaleString()}</span>
          </button>
          {emirateCounts.map(([name, count]) => (
            <button
              key={name}
              onClick={() => setEmirate(emirate === name ? null : name)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
                emirate === name
                  ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60"
                  : "bg-[#FDFBF7] text-[#1A1A1A]/80 border-[#B89555]/25 hover:bg-[#F7F2EA]"
              }`}
            >
              {name} <span className="text-[10px] tabular-nums opacity-70">{count.toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-[#B89555]/30 bg-[#FDFBF7]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F7F2EA] text-[#1A1A1A]">
            <tr>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap sticky left-0 bg-[#F7F2EA] z-10">Agency</th>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Country</th>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Emirate</th>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Office</th>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Phone</th>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Email</th>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Website</th>
              <th className="text-right px-4 py-2 font-semibold whitespace-nowrap">Leads</th>
              <th className="text-right px-4 py-2 font-semibold whitespace-nowrap">Agents</th>
              <th className="text-right px-4 py-2 font-semibold whitespace-nowrap">Rating</th>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B89555]/15">
            {finalRows.slice(0, 1500).map((r) => {
              const mapsHref = (r.office_address || r.office_location)
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.office_address || r.office_location || "")}`
                : null;
              return (
              <tr
                key={r.id}
                onClick={() => { setHubName(r.company_name); setHubOpen(true); }}
                className="cursor-pointer hover:bg-[#F7F2EA]/60"
              >
                <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-[#FDFBF7] group-hover:bg-[#F7F2EA]/60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#F7F2EA] border border-[#B89555]/20 flex items-center justify-center overflow-hidden flex-none">
                      {r.logo_url
                        ? <img src={r.logo_url} alt="" className="max-w-full max-h-full object-contain"  loading="lazy" decoding="async" />
                        : <Building2 className="h-4 w-4 text-[#1A1A1A]/40" />}
                    </div>
                    <span className="font-semibold text-[#1A1A1A]">{r.company_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">{r.country || "—"}</td>
                <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">{r.emirate || "—"}</td>
                <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs max-w-[280px] leading-snug">
                  {mapsHref ? (
                    <a href={mapsHref} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} title={r.office_location || r.office_address || ""} className="block truncate hover:underline">
                      {r.office_location || r.office_address}
                    </a>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">
                  {r.phone ? (
                    <a href={`tel:${r.phone}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 hover:underline"><Phone className="h-3 w-3" />{r.phone}</a>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap max-w-[220px]">
                  {r.email ? (
                    <a href={`mailto:${r.email}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 hover:underline truncate" title={r.email}><Mail className="h-3 w-3 flex-shrink-0" /><span className="truncate">{r.email}</span></a>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-xs whitespace-nowrap max-w-[200px]">
                  {(() => {
                    const w = r.website;
                    if (!w) return <span className="text-[#1A1A1A]/40">—</span>;
                    const href = /^https?:\/\//i.test(w) ? w : `https://${w}`;
                    const domain = w.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
                    return (
                      <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                         className="inline-flex items-center gap-1 text-[#1A1A1A] hover:underline truncate">
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="truncate">{domain}</span>
                      </a>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {(() => {
                    const c = leadCounts.get(normalizeForSearch(r.company_name)) || 0;
                    return c > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 tabular-nums">
                        {c.toLocaleString()}
                      </span>
                    ) : <span className="text-[#1A1A1A]/40 text-xs">0</span>;
                  })()}
                </td>
                <td className="px-4 py-3 text-right text-[#1A1A1A] whitespace-nowrap">{r.estimated_agent_count ?? "—"}</td>
                <td className="px-4 py-3 text-right text-[#1A1A1A]/80 text-xs whitespace-nowrap">
                  {r.star_rating ? (
                    <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" />{Number(r.star_rating).toFixed(1)}</span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-[#1A1A1A]/70 text-[11px] whitespace-nowrap">{sourceLabel(r)}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {finalRows.length > 1500 && (
        <p className="text-xs text-[#1A1A1A]/60 text-right">
          Showing first 1,500 of {finalRows.length.toLocaleString()} matches.
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
