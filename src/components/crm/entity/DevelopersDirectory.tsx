/**
 * DevelopersDirectory — single-entity view of public.developers.
 * No shared role-tab bar; click a row to open the developer hub drawer.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Globe, ExternalLink } from "lucide-react";
import { CompanyHubDrawer } from "@/components/crm/CompanyHubDrawer";
import { getDeveloperLogoUrl } from "@/utils/developerLogo";

interface DeveloperRow {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  headquarters: string | null;
  license_number: string | null;
  website_url: string | null;
  ceo_name: string | null;
  completed_projects: number | null;
  offplan_projects: number | null;
  rank: number | null;
  founded_year: number | null;
}

export default function DevelopersDirectory() {
  const [rows, setRows] = useState<DeveloperRow[]>([]);
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
        const all: DeveloperRow[] = [];
        let from = 0;
        const PAGE = 1000;
        for (let i = 0; i < 5; i++) {
          const { data, error } = await supabase
            .from("developers")
            .select("id,name,slug,logo_url,headquarters,license_number,website_url,ceo_name,completed_projects,offplan_projects,rank,founded_year")
            .eq("is_hidden", false)
            .order("rank", { ascending: true, nullsFirst: false })
            .order("name", { ascending: true })
            .range(from, from + PAGE - 1);
          if (error) throw error;
          const batch = (data || []) as DeveloperRow[];
          all.push(...batch);
          if (batch.length < PAGE) break;
          from += PAGE;
        }
        if (alive) setRows(all);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Failed to load developers");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(d =>
      (d.name || "").toLowerCase().includes(q) ||
      (d.headquarters || "").toLowerCase().includes(q) ||
      (d.ceo_name || "").toLowerCase().includes(q) ||
      (d.slug || "").toLowerCase().includes(q),
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
        <p className="text-sm text-[#1A1A1A]">Could not load developers.</p>
        <p className="text-xs text-[#1A1A1A]/60 mt-1">{err}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Developers</h2>
          <p className="text-xs text-[#1A1A1A]/60">
            {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} developers
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search developer, HQ, CEO…"
          className="h-9 w-72 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] px-3 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#B89555]"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#B89555]/30 bg-[#FDFBF7]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F7F2EA] text-[#1A1A1A]">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Developer</th>
              <th className="text-left px-4 py-2 font-semibold">Headquarters</th>
              <th className="text-left px-4 py-2 font-semibold">CEO</th>
              <th className="text-left px-4 py-2 font-semibold">License</th>
              <th className="text-right px-4 py-2 font-semibold">Completed</th>
              <th className="text-right px-4 py-2 font-semibold">Off-plan</th>
              <th className="text-right px-4 py-2 font-semibold">Founded</th>
              <th className="text-left px-4 py-2 font-semibold">Web</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B89555]/15">
            {filtered.slice(0, 1000).map((d) => {
              const logo = getDeveloperLogoUrl(d);
              return (
                <tr
                  key={d.id}
                  onClick={() => { setHubName(d.name); setHubOpen(true); }}
                  className="cursor-pointer hover:bg-[#F7F2EA]/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#F7F2EA] border border-[#B89555]/20 flex items-center justify-center overflow-hidden flex-none">
                        {logo
                          ? <img src={logo} alt="" className="max-w-full max-h-full object-contain" />
                          : <Building2 className="h-4 w-4 text-[#1A1A1A]/40" />}
                      </div>
                      <span className="font-semibold text-[#1A1A1A]">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs">{d.headquarters || "—"}</td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs">{d.ceo_name || "—"}</td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs">{d.license_number || "—"}</td>
                  <td className="px-4 py-3 text-right text-[#1A1A1A]">{d.completed_projects ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-[#1A1A1A]">{d.offplan_projects ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-[#1A1A1A]/80 text-xs">{d.founded_year || "—"}</td>
                  <td className="px-4 py-3">
                    {d.website_url ? (
                      <a
                        href={d.website_url}
                        target="_blank" rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[#1A1A1A]/80 hover:text-[#1A1A1A] text-xs"
                      >
                        <Globe className="h-3 w-3" />
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : <span className="text-[#1A1A1A]/40 text-xs">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > 1000 && (
        <p className="text-xs text-[#1A1A1A]/60 text-right">
          Showing first 1,000 of {filtered.length.toLocaleString()} matches.
        </p>
      )}

      {hubName && (
        <CompanyHubDrawer
          open={hubOpen}
          onOpenChange={setHubOpen}
          type="developer"
          companyName={hubName}
        />
      )}
    </div>
  );
}
