/**
 * DevelopersDirectory — institutional directory of public.developers.
 * Click any row to open the company hub drawer with full clickable contact rail.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Globe, ExternalLink, Phone, Mail, MessageCircle,
  Instagram, Linkedin, MapPin,
} from "lucide-react";
import { CompanyHubDrawer } from "@/components/crm/CompanyHubDrawer";
import { getDeveloperLogoUrl } from "@/utils/developerLogo";
import { useEntityTotal } from "@/hooks/useEntityTotal";

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
  instagram_url: string | null;
  linkedin_url: string | null;
  office_phone: string | null;
  whatsapp: string | null;
  admin_email: string | null;
  office_address: string | null;
  google_maps_url: string | null;
  registration_status: string | null;
}

const SELECT =
  "id,name,slug,logo_url,headquarters,license_number,website_url,ceo_name," +
  "completed_projects,offplan_projects,rank,founded_year,instagram_url," +
  "linkedin_url,office_phone,whatsapp,admin_email,office_address," +
  "google_maps_url,registration_status";

function waLink(num?: string | null) {
  if (!num) return null;
  const digits = num.replace(/[^0-9]/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}
function mapsLink(d: DeveloperRow) {
  if (d.google_maps_url) return d.google_maps_url;
  const q = d.office_address || d.headquarters;
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

const stop = (e: React.MouseEvent) => e.stopPropagation();

const IconLink = ({ href, title, children }: { href: string | null; title: string; children: React.ReactNode }) =>
  href ? (
    <a
      href={href} target="_blank" rel="noreferrer" title={title}
      onClick={stop}
      className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-[#B89555]/30 text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]"
    >{children}</a>
  ) : null;

const norm = (s: string | null | undefined) =>
  (s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();

export default function DevelopersDirectory() {
  const [rows, setRows] = useState<DeveloperRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hubOpen, setHubOpen] = useState(false);
  const [hubName, setHubName] = useState<string | null>(null);
  const [leadCounts, setLeadCounts] = useState<Map<string, number>>(new Map());
  const { total: dbTotal } = useEntityTotal("developers", (q) => q.eq("is_hidden", false));

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
            const k = norm(r.company_name);
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
        const all: DeveloperRow[] = [];
        let from = 0;
        const PAGE = 1000;
        // Cap initial load at 2 batches (2 000 rows) — the UI is search/scroll, not export.
        // Previously this pulled up to 5 000 rows on every mount which made Developers tab feel frozen.
        for (let i = 0; i < 2; i++) {
          const { data, error } = await supabase
            .from("developers")
            .select(SELECT)
            .eq("is_hidden", false)
            .order("rank", { ascending: true, nullsFirst: false })
            .order("name", { ascending: true })
            .range(from, from + PAGE - 1);
          if (error) throw error;
          const batch = ((data || []) as unknown) as DeveloperRow[];
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
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Developers</h2>
          <p className="text-xs text-[#1A1A1A]/60">
            {filtered.length.toLocaleString()} of {(dbTotal ?? rows.length).toLocaleString()} developers · click any row for full hub, contacts, tasks &amp; calendar
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search developer, HQ, CEO…"
          className="h-9 w-72 max-w-full rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] px-3 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#B89555]"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#B89555]/30 bg-[#FDFBF7]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F7F2EA] text-[#1A1A1A]">
            <tr>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap sticky left-0 bg-[#F7F2EA] z-10">Developer</th>
              <th className="text-left px-4 py-2 font-semibold">Headquarters</th>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">CEO</th>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">License</th>
              <th className="text-right px-4 py-2 font-semibold whitespace-nowrap">Leads</th>
              <th className="text-right px-4 py-2 font-semibold whitespace-nowrap">Completed projects</th>
              <th className="text-right px-4 py-2 font-semibold whitespace-nowrap">Off-plan projects</th>
              <th className="text-right px-4 py-2 font-semibold whitespace-nowrap">Founded</th>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Registration status</th>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Website</th>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B89555]/20">
            {filtered.slice(0, 1000).map((d) => {
              const logo = getDeveloperLogoUrl(d);
              const wa = waLink(d.whatsapp || d.office_phone);
              const maps = mapsLink(d);
              const websiteDomain = d.website_url
                ? d.website_url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "")
                : null;
              const prettyStatus = d.registration_status
                ? d.registration_status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                : null;
              return (
                <tr
                  key={d.id}
                  onClick={() => { setHubName(d.name); setHubOpen(true); }}
                  className="cursor-pointer hover:bg-[#F7F2EA]/60"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-[#F7F2EA] border border-[#B89555]/20 flex items-center justify-center overflow-hidden flex-none">
                        {logo
                          ? <img src={logo} alt="" className="max-w-full max-h-full object-contain"  loading="lazy" decoding="async" />
                          : <Building2 className="h-4 w-4 text-[#1A1A1A]/40" />}
                      </div>
                      <span className="font-semibold text-[#1A1A1A] truncate">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs max-w-[260px] leading-snug">
                    {maps ? (
                      <a href={maps} target="_blank" rel="noreferrer" onClick={stop} title={d.headquarters || d.office_address || ""}
                         className="inline-flex items-center gap-1 hover:underline max-w-full">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{d.headquarters || d.office_address || "View on map"}</span>
                      </a>
                    ) : <span className="block truncate" title={d.headquarters || ""}>{d.headquarters || "—"}</span>}
                  </td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">{d.ceo_name || "—"}</td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">{d.license_number || "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {(() => {
                      const c = leadCounts.get(norm(d.name)) || 0;
                      return c > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 tabular-nums">
                          {c.toLocaleString()}
                        </span>
                      ) : <span className="text-[#1A1A1A]/40 text-xs">0</span>;
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right text-[#1A1A1A] whitespace-nowrap">{d.completed_projects ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-[#1A1A1A] whitespace-nowrap">{d.offplan_projects ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-[#1A1A1A]/80 text-xs whitespace-nowrap">{d.founded_year || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {prettyStatus ? (
                      <Badge variant="outline" className="border-[#B89555]/40 bg-[#EFE6D6]/40 text-[#1A1A1A] text-[10px] font-semibold">
                        {prettyStatus}
                      </Badge>
                    ) : <span className="text-[#1A1A1A]/40 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap max-w-[200px]">
                    {websiteDomain && d.website_url ? (
                      <a href={d.website_url} target="_blank" rel="noreferrer" onClick={stop}
                         className="inline-flex items-center gap-1 text-[#1A1A1A] hover:underline truncate">
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="truncate">{websiteDomain}</span>
                      </a>
                    ) : <span className="text-[#1A1A1A]/40">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 flex-nowrap">
                      <IconLink href={d.admin_email ? `mailto:${d.admin_email}` : null} title={d.admin_email || "Email"}><Mail className="h-3.5 w-3.5" /></IconLink>
                      <IconLink href={d.office_phone ? `tel:${d.office_phone}` : null} title={d.office_phone || "Phone"}><Phone className="h-3.5 w-3.5" /></IconLink>
                      <IconLink href={wa} title="WhatsApp"><MessageCircle className="h-3.5 w-3.5" /></IconLink>
                      <IconLink href={d.instagram_url} title="Instagram"><Instagram className="h-3.5 w-3.5" /></IconLink>
                      <IconLink href={d.linkedin_url} title="LinkedIn"><Linkedin className="h-3.5 w-3.5" /></IconLink>
                    </div>
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
