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
            {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} developers · click any row for full hub, contacts, tasks &amp; calendar
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
              <th className="text-left px-4 py-2 font-semibold">Developer</th>
              <th className="text-left px-4 py-2 font-semibold">Headquarters</th>
              <th className="text-left px-4 py-2 font-semibold">CEO</th>
              <th className="text-left px-4 py-2 font-semibold">License</th>
              <th className="text-right px-4 py-2 font-semibold">Done</th>
              <th className="text-right px-4 py-2 font-semibold">Off-plan</th>
              <th className="text-right px-4 py-2 font-semibold">Founded</th>
              <th className="text-left px-4 py-2 font-semibold">Status</th>
              <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B89555]/15">
            {filtered.slice(0, 1000).map((d) => {
              const logo = getDeveloperLogoUrl(d);
              const wa = waLink(d.whatsapp || d.office_phone);
              const maps = mapsLink(d);
              return (
                <tr
                  key={d.id}
                  onClick={() => { setHubName(d.name); setHubOpen(true); }}
                  className="cursor-pointer hover:bg-[#F7F2EA]/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-[#F7F2EA] border border-[#B89555]/20 flex items-center justify-center overflow-hidden flex-none">
                        {logo
                          ? <img src={logo} alt="" className="max-w-full max-h-full object-contain" />
                          : <Building2 className="h-4 w-4 text-[#1A1A1A]/40" />}
                      </div>
                      <span className="font-semibold text-[#1A1A1A] truncate">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">
                    {maps ? (
                      <a href={maps} target="_blank" rel="noreferrer" onClick={stop}
                         className="inline-flex items-center gap-1 hover:underline">
                        <MapPin className="h-3 w-3" />
                        {d.headquarters || d.office_address || "View"}
                      </a>
                    ) : (d.headquarters || "—")}
                  </td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">{d.ceo_name || "—"}</td>
                  <td className="px-4 py-3 text-[#1A1A1A]/80 text-xs whitespace-nowrap">{d.license_number || "—"}</td>
                  <td className="px-4 py-3 text-right text-[#1A1A1A] whitespace-nowrap">{d.completed_projects ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-[#1A1A1A] whitespace-nowrap">{d.offplan_projects ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-[#1A1A1A]/80 text-xs whitespace-nowrap">{d.founded_year || "—"}</td>
                  <td className="px-4 py-3">
                    {d.registration_status ? (
                      <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] text-[10px] capitalize">
                        {d.registration_status}
                      </Badge>
                    ) : <span className="text-[#1A1A1A]/40 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <IconLink href={d.website_url} title="Website"><Globe className="h-3.5 w-3.5" /></IconLink>
                      <IconLink href={d.admin_email ? `mailto:${d.admin_email}` : null} title="Email"><Mail className="h-3.5 w-3.5" /></IconLink>
                      <IconLink href={d.office_phone ? `tel:${d.office_phone}` : null} title="Phone"><Phone className="h-3.5 w-3.5" /></IconLink>
                      <IconLink href={wa} title="WhatsApp"><MessageCircle className="h-3.5 w-3.5" /></IconLink>
                      <IconLink href={d.instagram_url} title="Instagram"><Instagram className="h-3.5 w-3.5" /></IconLink>
                      <IconLink href={d.linkedin_url} title="LinkedIn"><Linkedin className="h-3.5 w-3.5" /></IconLink>
                      {d.website_url ? (
                        <a href={d.website_url} target="_blank" rel="noreferrer" onClick={stop}
                           className="inline-flex items-center gap-1 text-[#1A1A1A]/50 hover:text-[#1A1A1A] text-[10px] ml-1">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
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
