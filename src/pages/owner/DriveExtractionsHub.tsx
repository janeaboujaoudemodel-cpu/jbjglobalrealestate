/**
 * Drive Extractions Hub — shows everything created/enriched from Google Drive
 * enrichment jobs, split into: Developers · Projects · Communities · Areas.
 *
 * Data comes from:
 *   • developer_drive_jobs   → per-developer scan status + counts
 *   • developer_documents    → files pulled from Drive
 *   • projects (created via enrichment; joined to community + area)
 *   • project_documents      → per-project files pulled from Drive
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, FolderKanban, MapPin, Layers, FileText, ExternalLink, RefreshCw, Globe2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import DriveDropPanel from "./DriveDropPanel";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { getDeveloperLogoUrl } from "@/utils/developerLogo";

type Tab = "developers" | "projects" | "communities" | "areas" | "emirates";


interface Job {
  id: string;
  developer_id: string;
  folder_url: string;
  status: string;
  discovered_documents: number;
  discovered_projects: number;
  error: string | null;
  updated_at: string;
  developers?: { id: string; name: string; slug: string; logo_url: string | null } | null;
}

interface DriveProject {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  developer_id: string | null;
  community_id: string | null;
  area_id: string | null;
  developers?: { name: string; slug: string; logo_url: string | null } | null;
  communities?: { name: string; slug: string } | null;
  areas?: { name: string; slug: string } | null;
  documents?: { count: number }[];
}

const TABS: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: "developers",  label: "Developers",   icon: Building2 },
  { key: "projects",    label: "Projects",     icon: FolderKanban },
  { key: "communities", label: "Communities",  icon: Layers },
  { key: "areas",       label: "Areas",        icon: MapPin },
  { key: "emirates",    label: "Emirates",     icon: Globe2 },
];


export default function DriveExtractionsHub() {
  const [active, setActive] = useState<Tab>("developers");
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [projects, setProjects] = useState<DriveProject[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data: j }, { data: p }] = await Promise.all([
      supabase
        .from("developer_drive_jobs")
        .select("id,developer_id,folder_url,status,discovered_documents,discovered_projects,error,updated_at,developers(id,name,slug,logo_url)")
        .order("updated_at", { ascending: false })
        .limit(500),
      supabase
        .from("projects")
        .select("id,name,slug,created_at,developer_id,community_id,area_id,developers!inner(name,slug,logo_url,google_drive_url),communities(name,slug),areas(name,slug),project_documents(count)")
        .not("developers.google_drive_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
    setJobs((j as any) ?? []);
    setProjects((p as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    const okJobs = jobs.filter(j => j.status === "completed" || j.status === "ok" || j.status === "succeeded");
    const docs = jobs.reduce((s, j) => s + (j.discovered_documents || 0), 0);
    const projs = jobs.reduce((s, j) => s + (j.discovered_projects || 0), 0);
    const communities = new Set(projects.map(p => p.community_id).filter(Boolean));
    const areas = new Set(projects.map(p => p.area_id).filter(Boolean));
    return { jobs: jobs.length, okJobs: okJobs.length, docs, projs, communities: communities.size, areas: areas.size };
  }, [jobs, projects]);

  return (
    <div className="owner-hub-page" data-hub-page="true">
      <header className="owner-hub-page__header">
        <div className="owner-hub-page__header-left">
          <span className="owner-hub-page__icon" aria-hidden="true">
            <Inbox size={22} strokeWidth={2} />
          </span>
          <div style={{ minWidth: 0 }}>
            <p className="owner-hub-page__eyebrow">Owner console</p>
            <h1 className="owner-hub-page__title">Drive Extractions</h1>
            <p className="owner-hub-page__subtitle">
              Everything AI pulled from developer Google Drive folders — grouped by developer, project, community and area.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={load} className="rounded-md jj-surface-emerald text-white border-0">
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
      </header>

      <div className="owner-hub-page__insights">
        <div className="owner-hub-page__insight">
          <p className="owner-hub-page__insight-label">Developers scanned</p>
          <div className="owner-hub-page__insight-value">{totals.jobs}</div>
          <p className="owner-hub-page__insight-delta">{totals.okJobs} completed</p>
        </div>
        <div className="owner-hub-page__insight">
          <p className="owner-hub-page__insight-label">Documents pulled</p>
          <div className="owner-hub-page__insight-value">{totals.docs}</div>
        </div>
        <div className="owner-hub-page__insight">
          <p className="owner-hub-page__insight-label">Projects discovered</p>
          <div className="owner-hub-page__insight-value">{totals.projs}</div>
        </div>
        <div className="owner-hub-page__insight">
          <p className="owner-hub-page__insight-label">Communities · Areas</p>
          <div className="owner-hub-page__insight-value">{totals.communities} · {totals.areas}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm transition border"
              style={{
                background: isActive ? "var(--jj-emerald-ombre)" : "#FFFFFF",
                borderColor: isActive ? "transparent" : "rgba(6,78,59,0.20)",
                color: isActive ? "#FFFFFF" : "#111827",
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-6">
        <DriveDropPanel />
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : (
          <>
            {active === "developers"  && <DevelopersView jobs={jobs} />}
            {active === "projects"    && <ProjectsView projects={projects} />}
            {active === "communities" && <GroupedView mode="community" projects={projects} />}
            {active === "areas"       && <GroupedView mode="area" projects={projects} />}
            {active === "emirates"    && <EmiratesView />}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div data-no-contrast-guard className="allow-white rounded-lg border border-white/20 bg-white/10 backdrop-blur px-4 py-3 text-white">
      <div data-no-contrast-guard className="allow-white text-[11px] uppercase tracking-wider text-white/85">{label}</div>
      <div data-no-contrast-guard className="allow-white text-2xl font-semibold mt-1 text-white">{value}</div>
      {sub && <div data-no-contrast-guard className="allow-white text-[11px] mt-0.5 text-white/80">{sub}</div>}
    </div>
  );
}

function statusPill(status: string) {
  const s = status.toLowerCase();
  const tone =
    s === "completed" || s === "ok" || s === "succeeded" ? "bg-emerald-100 text-emerald-900 border-emerald-200"
    : s === "running" || s === "pending" ? "bg-amber-100 text-amber-900 border-amber-200"
    : s === "failed" || s === "error" ? "bg-red-100 text-red-900 border-red-200"
    : "bg-neutral-100 text-neutral-800 border-neutral-200";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${tone}`}>{status}</span>;
}

function DevelopersView({ jobs }: { jobs: Job[] }) {
  if (!jobs.length) return (
    <div className="rounded-xl border border-dashed border-[#B89555]/40 bg-white/60 p-8 text-center text-sm text-[#1A1A1A]/70">
      Drop a Drive folder above and it will appear here once processed. You can also attach a Drive
      folder directly on any developer or project card — the link is saved permanently on the record.
    </div>
  );
  return (
    <div className="rounded-xl border border-[#B89555]/30 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#F7F2EA] text-[#1A1A1A]/70 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3">Developer</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-right px-4 py-3">Documents</th>
            <th className="text-right px-4 py-3">Projects</th>
            <th className="text-left px-4 py-3">Drive folder</th>
            <th className="text-left px-4 py-3">Last run</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(j => (
            <tr key={j.id} className="border-t border-[#B89555]/15 hover:bg-[#FDFBF7]">
              <td className="px-4 py-3">
                <Link to={`/owner/developers/${j.developers?.slug ?? ""}`} className="inline-flex items-center gap-2 font-medium hover:underline" aria-label={j.developers?.name ?? "Open developer"}>
                  <DeveloperLogo src={getDeveloperLogoUrl(j.developers)} name={j.developers?.name} alt={j.developers?.name ?? "Developer"} variant="bare" size="micro" loading="lazy" />
                  {j.developers?.name ?? j.developer_id}
                </Link>
              </td>
              <td className="px-4 py-3">{statusPill(j.status)}{j.error && <div className="text-[11px] text-red-700 mt-1 max-w-[280px] truncate">{j.error}</div>}</td>
              <td className="px-4 py-3 text-right tabular-nums">{j.discovered_documents}</td>
              <td className="px-4 py-3 text-right tabular-nums">{j.discovered_projects}</td>
              <td className="px-4 py-3">
                <a href={j.folder_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-800 hover:underline">
                  Open <ExternalLink className="w-3 h-3" />
                </a>
              </td>
              <td className="px-4 py-3 text-[#1A1A1A]/70">{new Date(j.updated_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProjectsView({ projects }: { projects: DriveProject[] }) {
  if (!projects.length) return <Empty text="No projects have been created from Drive yet." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {projects.map(p => (
        <Link key={p.id} to={`/project/${p.slug}`} className="rounded-xl border border-[#B89555]/30 bg-white p-4 hover:border-[#B89555] hover:shadow-md transition">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold truncate">{p.name}</div>
              <div className="text-xs text-[#1A1A1A]/60 mt-0.5 truncate">
                {p.developers?.name ?? "—"}
                {p.communities?.name && <> · <span className="text-emerald-800">{p.communities.name}</span></>}
                {p.areas?.name && <> · {p.areas.name}</>}
              </div>
            </div>
            <DeveloperLogo src={getDeveloperLogoUrl(p.developers)} name={p.developers?.name} alt={p.developers?.name ?? "Developer"} variant="bare" size="micro" loading="lazy" />
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#1A1A1A]/60">
            <FileText className="w-3.5 h-3.5" />
            {p.documents?.[0]?.count ?? 0} documents
            <span className="ml-auto">{new Date(p.created_at).toLocaleDateString()}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function GroupedView({ mode, projects }: { mode: "community" | "area"; projects: DriveProject[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; items: DriveProject[] }>();
    for (const p of projects) {
      const ref = mode === "community" ? p.communities : p.areas;
      if (!ref) continue;
      const key = ref.slug;
      if (!map.has(key)) map.set(key, { name: ref.name, slug: ref.slug, items: [] });
      map.get(key)!.items.push(p);
    }
    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [mode, projects]);

  if (!groups.length) return <Empty text={`No ${mode === "community" ? "communities" : "areas"} were linked to projects extracted from Drive yet.`} />;

  return (
    <div className="space-y-4">
      {groups.map(g => (
        <div key={g.slug} className="rounded-xl border border-[#B89555]/30 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#F7F2EA]">
            <Link to={mode === "community" ? `/community/${g.slug}` : `/area/${g.slug}`} className="font-semibold hover:underline">
              {g.name}
            </Link>
            <span className="text-xs text-[#1A1A1A]/70">{g.items.length} project{g.items.length === 1 ? "" : "s"}</span>
          </div>
          <ul className="divide-y divide-[#B89555]/15">
            {g.items.map(p => (
              <li key={p.id} className="px-4 py-2 flex items-center gap-3 hover:bg-[#FDFBF7]">
                <DeveloperLogo src={getDeveloperLogoUrl(p.developers)} name={p.developers?.name} alt={p.developers?.name ?? "Developer"} variant="bare" size="micro" loading="lazy" />
                <Link to={`/project/${p.slug}`} className="text-sm hover:underline truncate">{p.name}</Link>
                <span className="ml-auto text-[11px] text-[#1A1A1A]/60">{p.developers?.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#B89555]/40 bg-white/60 p-10 text-center text-sm text-[#1A1A1A]/70">
      {text}
    </div>
  );
}

function EmiratesView() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("emirates").select("id,name,slug").order("name").then(({ data }) => setRows(data ?? []));
  }, []);
  if (!rows.length) return <Empty text="No emirates seeded yet. Drop a Drive folder above with entity type 'Emirates'." />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {rows.map((e) => (
        <div key={e.id} className="rounded-lg border border-[#B89555]/30 bg-white p-3">
          <div className="text-xs uppercase tracking-wider text-[#1A1A1A]/50">Emirate</div>
          <div className="font-semibold">{e.name}</div>
        </div>
      ))}
    </div>
  );
}
