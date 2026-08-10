/**
 * Owner backend — Market Import Review.
 *
 * LOCKED RULE: nothing crawled from the market source is written to the live directory
 * automatically. Everything lands in a staging area first, is scored against
 * the existing JBJ record, and only moves after the owner picks
 * MERGE / KEEP SEPARATE / IGNORE here. Manually edited JBJ fields always win.
 *
 * LOCKED: every filled accent, active state and hover state uses the official
 * emerald → deep emerald → black gradient with pure white text; never flat green.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Square,
  XCircle,
} from "lucide-react";

/**
 * Market sources deliver headquarters as a raw list/map string, e.g.
 * `[{'address': 'Office 701, Prime Tower, Business Bay', 'city': 'Dubai', ...}]`.
 * The queue only ever shows a clean, human address line.
 */
const formatHeadquarters = (raw?: string | null) => {
  const text = (raw || "").trim();
  if (!text) return "—";
  if (!/^[[{]/.test(text)) return text;
  const address = text.match(/['"]address['"]\s*:\s*['"]([^'"]+)['"]/i)?.[1]?.trim();
  const city = text.match(/['"]city['"]\s*:\s*['"]([^'"]+)['"]/i)?.[1]?.trim();
  const country = text.match(/['"]country['"]\s*:\s*['"]([^'"]+)['"]/i)?.[1]?.trim();
  const parts = [address, city, country].filter(Boolean) as string[];
  const seen = new Set<string>();
  const unique = parts.filter((part) => {
    const key = part.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.length ? unique.join(", ").replace(/,\s*,/g, ",") : "—";
};

const EMERALD = "#042c1c";
const EMERALD_GRADIENT = "linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)";

type Run = {
  id: string;
  started_at: string;
  finished_at: string | null;
  phase: string;
  stats: Record<string, unknown>;
  notes: string | null;
};

type MatchRow = {
  id: string;
  entity_type: "project" | "developer";
  staged_project_id: string | null;
  staged_developer_id: string | null;
  jbj_project_id: string | null;
  jbj_developer_id: string | null;
  jbj_name: string | null;
  confidence: number;
  match_reasons: string[] | null;
  differences: string[] | null;
  decision: string;
};

type StagedProject = {
  id: string;
  name: string;
  source_slug: string;
  source_url: string;
  developer_name: string | null;
  city: string | null;
  area: string | null;
  status: string | null;
  is_offplan: boolean;
  excluded_reason: string | null;
  review_decision: string | null;
  jbj_project_id: string | null;
  publish_status?: string | null;
  published_at?: string | null;
  publish_error?: string | null;
};

type StagedDeveloper = {
  id: string;
  name: string;
  source_slug: string;
  source_url: string;
  headquarters: string | null;
  total_projects: number | null;
  review_decision: string | null;
  jbj_developer_id: string | null;
  publish_status?: string | null;
  published_at?: string | null;
  publish_error?: string | null;
};

type LiveRef = { id: string; name: string | null; slug: string | null };

const DECISIONS = [
  { key: "merge", label: "Merge", icon: CheckCircle2 },
  { key: "keep_separate", label: "Keep separate", icon: Layers },
  { key: "ignore", label: "Ignore", icon: XCircle },
] as const;

/**
 * Permanent publish record for a staged row — approving publishes it live and the row
 * stays here forever with its status, so any developer or project can be followed up.
 */
const PublishCell = ({
  status,
  at,
  error,
}: {
  status?: string | null;
  at?: string | null;
  error?: string | null;
}) => {
  const state = status || "not_published";
  const label = state === "published" ? "Published live" : state === "failed" ? "Publish failed" : "Not published";
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${state === "published" ? "mir-solid" : "mir-pill"}`}>
        {label}
      </span>
      {state === "published" && at ? (
        <span className="text-[10px] text-neutral-500">{new Date(at).toLocaleDateString()}</span>
      ) : null}
      {state === "failed" && error ? <span className="text-[10px] text-red-700">{error}</span> : null}
    </span>
  );
};

const norm = (s: string | null | undefined) =>
  (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\b(the|by|at|residence|residences|tower|towers)\b/g, "").trim();

/** Scoped emerald styling — pure white on every emerald fill, never black. */
const EmeraldStyles = () => (
  <style>{`
    [data-mir] .mir-pill{border:1px solid rgba(6,78,59,0.25);background:#fff;color:${EMERALD};transition:background .15s,color .15s}
    [data-mir] .mir-pill:hover,[data-mir] .mir-pill:hover *{background-color:transparent;color:#fff !important;-webkit-text-fill-color:#fff !important}
    [data-mir] .mir-pill:hover{background:${EMERALD_GRADIENT} !important;border-color:transparent}
    [data-mir] .mir-pill:hover svg{color:#fff !important;stroke:#fff !important}
    [data-mir] .mir-pill-active,[data-mir] .mir-pill-active:hover{background:${EMERALD_GRADIENT} !important;border-color:transparent !important}
    [data-mir] .mir-pill-active,[data-mir] .mir-pill-active *{color:#fff !important;-webkit-text-fill-color:#fff !important}
    [data-mir] .mir-pill-active svg{color:#fff !important;stroke:#fff !important}
    [data-mir] .mir-card{border:1px solid rgba(6,78,59,0.12);background:#fff;transition:border-color .15s,box-shadow .15s}
    [data-mir] .mir-card-click:hover{border-color:${EMERALD};box-shadow:0 8px 24px -14px rgba(6,78,59,.55)}
    [data-mir] .mir-link{color:${EMERALD};font-weight:600}
    [data-mir] .mir-link:hover{text-decoration:underline}
    [data-mir] .mir-row:hover{background:rgba(6,78,59,0.04)}
    [data-mir] .mir-row-selected{background:rgba(6,78,59,0.10) !important;box-shadow:inset 3px 0 0 0 ${EMERALD}}
    [data-mir] .mir-row-selected:hover{background:rgba(6,78,59,0.14) !important}
    [data-mir] .mir-solid,[data-mir] .mir-solid:hover{background:${EMERALD_GRADIENT} !important;border-color:transparent}
    [data-mir] .mir-solid,[data-mir] .mir-solid *{color:#fff !important;-webkit-text-fill-color:#fff !important}
    [data-mir] .mir-solid svg{color:#fff !important;stroke:#fff !important}
    [data-mir] .mir-solid:hover{filter:brightness(1.1)}
  `}</style>
);

/**
 * Supabase caps every response at 1000 rows. The review queue must show TRUE totals,
 * so every staging/live read is paginated until the table is fully loaded — otherwise
 * "Found" silently under-reports (e.g. 1000 instead of 1749).
 */
async function fetchAllRows<T>(table: string, columns: string, orderBy = "name"): Promise<T[]> {
  const PAGE = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table as any)
      .select(columns)
      .order(orderBy, { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data || []) as unknown as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

/** Found in the market source / published live on JBJ / still remaining. */

type Progress = { found: number; published: number };

const ProgressChips = ({ found, published }: Progress) => {
  const remaining = Math.max(0, found - published);
  return (
    <span className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="mir-pill rounded-full px-2 py-0.5 text-[10px] font-semibold">Found {found}</span>
      <span className="mir-solid rounded-full px-2 py-0.5 text-[10px] font-semibold">Published {published}</span>
      <span className="mir-pill rounded-full px-2 py-0.5 text-[10px] font-semibold">Remaining {remaining}</span>
    </span>
  );
};

const StatCard = ({
  label,
  value,
  hint,
  onClick,
  progress,
}: {
  label: string;
  value: string | number;
  hint?: string;
  onClick?: () => void;
  progress?: Progress;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{ display: "block" }}
    className="mir-card mir-card-click w-full cursor-pointer rounded-xl p-4 text-left"
  >
    <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
    {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    {progress ? <ProgressChips {...progress} /> : null}
  </button>
);



/** Side-by-side comparison — our live JBJ card vs the market-source card. */
function MatchDiff({ match, jbjHref }: { match: MatchRow; jbjHref?: string | null }) {
  const isDev = match.entity_type === "developer";
  const { data, isLoading } = useQuery({
    queryKey: ["market-match-diff", match.id],
    queryFn: async () => {
      const liveTable = isDev ? "developers" : "projects";
      const liveId = isDev ? match.jbj_developer_id : match.jbj_project_id;
      const stagedTable = isDev ? "market_staged_developers" : "market_staged_projects";
      const stagedId = isDev ? match.staged_developer_id : match.staged_project_id;
      const [live, staged] = await Promise.all([
        liveId
          ? supabase.from(liveTable as any).select("*").eq("id", liveId).maybeSingle()
          : Promise.resolve({ data: null, error: null } as any),
        stagedId
          ? supabase.from(stagedTable as any).select("*").eq("id", stagedId).maybeSingle()
          : Promise.resolve({ data: null, error: null } as any),
      ]);
      return {
        live: (live?.data || null) as Record<string, any> | null,
        staged: (staged?.data || null) as Record<string, any> | null,
      };
    },
  });

  const rows = useMemo(() => {
    const live = data?.live || {};
    const staged = data?.staged || {};
    const skip = new Set([
      "id", "run_id", "created_at", "updated_at", "payload", "source_id",
      "review_decision", "reviewed_at", "reviewed_by", "extraction_status", "extraction_error",
      "jbj_project_id", "jbj_developer_id", "source_url", "source_slug", "developer_source_slug",
    ]);
    const keys = Object.keys(staged).filter((k) => !skip.has(k));
    return keys
      .map((k) => {
        const after = staged[k];
        const before = live[k];
        const empty = (v: any) =>
          v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
        const fmt = (v: any) =>
          empty(v) ? "—" : Array.isArray(v) ? v.slice(0, 6).map(String).join(", ") : typeof v === "object" ? JSON.stringify(v).slice(0, 180) : String(v).slice(0, 220);
        const state = empty(after) ? "none" : empty(before) ? "fill" : "protected";
        return { key: k, before: fmt(before), after: fmt(after), state };
      })
      .filter((r) => r.state !== "none");
  }, [data]);

  if (isLoading) return <p className="mt-3 text-xs text-neutral-500">Loading comparison…</p>;

  const live = data?.live || null;
  const staged = data?.staged || null;
  const sourceHref = (staged?.source_url as string) || null;
  const img = (r: Record<string, any> | null) =>
    (r?.cover_image_url || r?.cover_image || r?.logo_url || r?.image_url || r?.hero_image_url || null) as string | null;
  const line = (r: Record<string, any> | null) =>
    [r?.developer_name, r?.area, r?.city, r?.country].filter(Boolean).join(" · ") || "—";

  const Side = ({
    title,
    record,
    href,
    hrefLabel,
    tone,
  }: {
    title: string;
    record: Record<string, any> | null;
    href: string | null;
    hrefLabel: string;
    tone: "jbj" | "source";
  }) => (
    <div className="mir-card mir-card-click rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${tone === "jbj" ? "mir-solid" : "mir-pill"}`}
        >
          {title}
        </span>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer noopener" className="mir-link inline-flex items-center gap-1 text-xs">
            {hrefLabel} <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : (
          <span className="text-xs text-neutral-400">No link</span>
        )}
      </div>
      <div className="mt-3 flex gap-3">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-[rgba(6,78,59,0.06)]">
          {img(record) ? (
            <img src={img(record) as string} alt={String(record?.name || title)} className="h-full w-full object-cover" loading="lazy" />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-900">{record?.name || "—"}</p>
          <p className="mt-1 text-xs text-neutral-600">{line(record)}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {record?.status || (record?.headquarters ? formatHeadquarters(record.headquarters) : null) || record?.sale_status || "Status not set"}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Side title="JBJ listing (current)" record={live} href={jbjHref || null} hrefLabel="Open JBJ page" tone="jbj" />
        <Side title="Market source" record={staged} href={sourceHref} hrefLabel="Open source page" tone="source" />
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-neutral-500">Field-by-field: nothing new to add — JBJ already holds every value.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[rgba(6,78,59,0.15)]">
          <table className="w-full text-xs">
            <thead className="mir-solid text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Field</th>
                <th className="px-3 py-2 font-semibold">JBJ now</th>
                <th className="px-3 py-2 font-semibold">Market source</th>
                <th className="px-3 py-2 font-semibold">Result if you merge</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="mir-row border-t border-[rgba(6,78,59,0.1)]">
                  <td className="px-3 py-2 font-medium text-neutral-800">{r.key.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2 text-neutral-600">{r.before}</td>
                  <td className="px-3 py-2 text-neutral-600">{r.after}</td>
                  <td className="px-3 py-2">
                    {r.state === "protected" ? (
                      <span className="text-neutral-500">Keeps JBJ value — protected</span>
                    ) : (
                      <span style={{ color: EMERALD, fontWeight: 600 }}>Fills empty field: {r.after}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


export default function MarketDataImportHub() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"summary" | "matches" | "new" | "newDevelopers">("summary");
  const [entity, setEntity] = useState<"project" | "developer">("project");
  const [q, setQ] = useState("");
  const [openDiff, setOpenDiff] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [matchLimit, setMatchLimit] = useState(100);

  useEffect(() => setSelected(new Set()), [tab, entity]);

  const { data: run } = useQuery({
    queryKey: ["market-import-run"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_import_runs" as any)
        .select("*")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Run | null;
    },
  });

  // All matches, both entities, fully paginated so the counters are exact.
  const { data: allMatches = [], isFetching, refetch } = useQuery({
    queryKey: ["market-review-matches-all"],
    queryFn: () => fetchAllRows<MatchRow>("market_review_matches", "*", "confidence"),
  });

  const matches = useMemo(() => allMatches.filter((m) => m.entity_type === entity), [allMatches, entity]);

  const { data: stagedProjects = [] } = useQuery({
    queryKey: ["market-staged-projects"],
    queryFn: () =>
      fetchAllRows<StagedProject>(
        "market_staged_projects",
        "id,name,source_slug,source_url,developer_name,city,area,status,is_offplan,excluded_reason,review_decision,jbj_project_id,publish_status,published_at,publish_error",
      ),
  });

  const { data: stagedDevelopers = [] } = useQuery({
    queryKey: ["market-staged-developers"],
    queryFn: () =>
      fetchAllRows<StagedDeveloper>(
        "market_staged_developers",
        "id,name,source_slug,source_url,headquarters,total_projects,review_decision,jbj_developer_id,publish_status,published_at,publish_error",
      ),
  });

  // Live JBJ records, used to resolve "our own link" for every staged row.
  const { data: liveProjects = [] } = useQuery({
    queryKey: ["market-live-projects"],
    queryFn: () => fetchAllRows<LiveRef>("projects", "id,name,slug"),
  });

  const { data: liveDevelopers = [] } = useQuery({
    queryKey: ["market-live-developers"],
    queryFn: () => fetchAllRows<LiveRef>("developers", "id,name,slug"),
  });


  const projectIndex = useMemo(() => {
    const byId = new Map<string, LiveRef>();
    const byName = new Map<string, LiveRef>();
    for (const p of liveProjects) {
      byId.set(p.id, p);
      const k = norm(p.name);
      if (k && !byName.has(k)) byName.set(k, p);
    }
    return { byId, byName };
  }, [liveProjects]);

  const developerIndex = useMemo(() => {
    const byId = new Map<string, LiveRef>();
    const byName = new Map<string, LiveRef>();
    for (const d of liveDevelopers) {
      byId.set(d.id, d);
      const k = norm(d.name);
      if (k && !byName.has(k)) byName.set(k, d);
    }
    return { byId, byName };
  }, [liveDevelopers]);

  const resolveProjectLink = (p: StagedProject) => {
    const hit = (p.jbj_project_id && projectIndex.byId.get(p.jbj_project_id)) || projectIndex.byName.get(norm(p.name));
    return hit?.slug ? { href: `/project/${hit.slug}`, label: hit.name || hit.slug } : null;
  };

  const resolveDeveloperLink = (d: StagedDeveloper) => {
    const hit = (d.jbj_developer_id && developerIndex.byId.get(d.jbj_developer_id)) || developerIndex.byName.get(norm(d.name));
    return hit?.slug ? { href: `/developer/${hit.slug}`, label: hit.name || hit.slug } : null;
  };

  const matchedStagedIds = useMemo(
    () => new Set(allMatches.filter((m) => m.entity_type === "project").map((m) => m.staged_project_id)),
    [allMatches],
  );

  const newProjects = useMemo(
    () =>
      stagedProjects.filter(
        (p) => p.is_offplan && !matchedStagedIds.has(p.id) && (!q || p.name.toLowerCase().includes(q.toLowerCase())),
      ),
    [stagedProjects, matchedStagedIds, q],
  );

  const newDevelopers = useMemo(
    () => stagedDevelopers.filter((d) => !q || d.name.toLowerCase().includes(q.toLowerCase())),
    [stagedDevelopers, q],
  );

  const visibleMatches = useMemo(
    () => matches.filter((m) => !q || (m.jbj_name || "").toLowerCase().includes(q.toLowerCase())),
    [matches, q],
  );

  const stats = (run?.stats || {}) as Record<string, number | string>;

  /**
   * Publish progress per bucket: how many rows the crawl found, how many are already
   * live on JBJ, and how many still remain to be approved & published.
   */
  const progress = useMemo(() => {
    const pub = (rows: { publish_status?: string | null; jbj_project_id?: string | null; jbj_developer_id?: string | null }[]) =>
      rows.filter((r) => r.publish_status === "published").length;

    const offplan = stagedProjects.filter((p) => p.is_offplan);
    const newProj = offplan.filter((p) => !matchedStagedIds.has(p.id));
    const mergedProj = offplan.filter((p) => matchedStagedIds.has(p.id));
    const matchedDevIds = new Set(
      allMatches.filter((m) => m.entity_type === "developer").map((m) => m.staged_developer_id),
    );
    const mergedDevs = stagedDevelopers.filter((d) => matchedDevIds.has(d.id));

    return {
      developers: { found: stagedDevelopers.length, published: pub(stagedDevelopers) },
      projects: { found: stagedProjects.length, published: pub(stagedProjects) },
      newProjects: { found: newProj.length, published: pub(newProj) },
      newDevelopers: { found: stagedDevelopers.length, published: pub(stagedDevelopers) },
      mergedProjects: { found: mergedProj.length, published: pub(mergedProj) },
      mergedDevelopers: { found: mergedDevs.length, published: pub(mergedDevs) },
    };
  }, [stagedProjects, stagedDevelopers, allMatches, matchedStagedIds]);


  const decide = async (id: string, decision: string) => {
    const { error } = await supabase
      .from("market_review_matches" as any)
      .update({ decision, decided_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Could not save the decision");
      return;
    }
    toast.success(`Marked as ${decision.replace("_", " ")}`);
    qc.invalidateQueries({ queryKey: ["market-review-matches-all"] });
  };

  const bulkDecideMatches = async (decision: string) => {
    const ids = visibleMatches.filter((m) => selected.has(m.id)).map((m) => m.id);
    if (!ids.length) return toast.error("Select at least one card first");
    setBulkBusy(true);
    const { error } = await supabase
      .from("market_review_matches" as any)
      .update({ decision, decided_at: new Date().toISOString() })
      .in("id", ids);
    setBulkBusy(false);
    if (error) return toast.error("Bulk update failed");
    toast.success(`${ids.length} card${ids.length === 1 ? "" : "s"} marked as ${decision.replace("_", " ")}`);
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["market-review-matches-all"] });
  };

  /**
   * RULE — Approve = Publish (LOCKED).
   * Approving a staged market record publishes it straight into live JBJ inventory in the
   * same click. The staged row is never removed: it keeps its review + publish status and a
   * link to the live JBJ page, so any developer or project can always be followed up here.
   */
  const publishApproved = async (kind: "project" | "developer", ids: string[]) => {
    const { data, error } = await supabase.functions.invoke("market-import-publish", {
      body: { kind, ids },
    });
    if (error) throw error;
    return data as { published: number; failed: number };
  };

  const bulkStaged = async (kind: "project" | "developer", decision: "approved" | "rejected" | "pending") => {
    const ids = Array.from(selected);
    if (!ids.length) return toast.error("Select at least one row first");
    setBulkBusy(true);

    if (decision === "approved") {
      try {
        const res = await publishApproved(kind, ids);
        toast.success(
          `${res.published} ${kind === "project" ? "project" : "developer"}${res.published === 1 ? "" : "s"} approved and published live${res.failed ? ` · ${res.failed} failed` : ""}`,
        );
      } catch (e) {
        toast.error(`Publishing failed: ${e instanceof Error ? e.message : "unknown error"}`);
      }
      setBulkBusy(false);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: [kind === "project" ? "market-staged-projects" : "market-staged-developers"] });
      qc.invalidateQueries({ queryKey: [kind === "project" ? "market-live-projects" : "market-live-developers"] });
      return;
    }

    const table = kind === "project" ? "market_staged_projects" : "market_staged_developers";
    const { error } = await supabase
      .from(table as any)
      .update({ review_decision: decision, reviewed_at: new Date().toISOString() })
      .in("id", ids);
    setBulkBusy(false);
    if (error) return toast.error("Bulk update failed");
    toast.success(`${ids.length} record${ids.length === 1 ? "" : "s"} set to ${decision}`);
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: [kind === "project" ? "market-staged-projects" : "market-staged-developers"] });
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const BulkBar = ({
    total,
    allIds,
    actions,
    subsets = [],
  }: {
    total: number;
    allIds: string[];
    actions: { label: string; onClick: () => void; solid?: boolean; icon?: any }[];
    subsets?: { label: string; ids: string[] }[];
  }) => (
    <div className="mir-card flex flex-wrap items-center gap-2 rounded-xl p-3">
      <button type="button" className="mir-pill rounded-full px-3 py-1.5 text-xs font-semibold" onClick={() => setSelected(new Set(allIds))}>
        <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" aria-hidden /> Select all ({total})</span>
      </button>
      <button type="button" className="mir-pill rounded-full px-3 py-1.5 text-xs font-semibold" onClick={() => setSelected(new Set())}>
        <span className="inline-flex items-center gap-1"><Square className="h-3.5 w-3.5" aria-hidden /> Unselect all</span>
      </button>
      {subsets.map((sub) => (
        <button
          key={sub.label}
          type="button"
          className="mir-pill rounded-full px-3 py-1.5 text-xs font-semibold"
          onClick={() => setSelected(new Set(sub.ids))}
        >
          <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" aria-hidden /> {sub.label} ({sub.ids.length})</span>
        </button>
      ))}
      <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selected.size ? "mir-solid" : "mir-pill"}`}>
        {selected.size} selected of {total}
      </span>
      <span className="ml-auto flex flex-wrap items-center gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            disabled={bulkBusy}
            onClick={a.onClick}
            className={`${a.solid ? "mir-solid" : "mir-pill"} rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50`}
          >
            <span className="inline-flex items-center gap-1">{a.icon ? <a.icon className="h-3.5 w-3.5" aria-hidden /> : null} {a.label}</span>
          </button>
        ))}
      </span>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6" data-mir data-no-contrast-guard>
      <EmeraldStyles />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Owner review queue</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-neutral-900">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg mir-solid">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            Market Import Review
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Developer-built projects only — off-plan, ready and sold-out. Resale listings, agency inventory and
            individual apartments are never imported; availability stays “On Request”. Exact matches were auto-merged
            into the gaps; everything else waits for your decision.
          </p>
        </div>
        <button type="button" onClick={() => refetch()} className="mir-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden /> Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Developers discovered"
          value={String(stats.total_developers_discovered ?? stagedDevelopers.length)}
          progress={progress.developers}
          onClick={() => setTab("newDevelopers")}
        />
        <StatCard
          label="Projects in scope"
          value={String(stats.total_projects_in_scope ?? stats.total_projects_discovered ?? stagedProjects.length)}
          hint={`incl. ${stats.ready_projects_included ?? 0} ready · ${stats.sold_out_projects_included ?? 0} sold out`}
          progress={progress.projects}
          onClick={() => setTab("new")}
        />
        <StatCard
          label="Developers auto-merged"
          value={String(progress.mergedDevelopers.found)}
          hint={`${stats.developer_fields_filled ?? 0} empty fields filled`}
          progress={progress.mergedDevelopers}
          onClick={() => { setEntity("developer"); setTab("matches"); }}
        />
        <StatCard
          label="Projects auto-merged"
          value={String(progress.mergedProjects.found)}
          hint={`${stats.project_fields_filled ?? 0} empty fields filled`}
          progress={progress.mergedProjects}
          onClick={() => { setEntity("project"); setTab("matches"); }}
        />
        <StatCard
          label="New projects"
          value={String(newProjects.length || stats.new_projects_awaiting_approval || 0)}
          hint="awaiting your approval"
          progress={progress.newProjects}
          onClick={() => setTab("new")}
        />
        <StatCard
          label="New developers"
          value={String(stats.new_developers ?? newDevelopers.length)}
          hint="awaiting your approval"
          progress={progress.newDevelopers}
          onClick={() => setTab("newDevelopers")}
        />

        <StatCard label="Areas matched" value={String(stats.areas_matched ?? "—")} hint={`${stats.areas_geo_filled ?? 0} got map coordinates`} onClick={() => { setEntity("project"); setTab("matches"); }} />
        <StatCard label="New area candidates" value={String(stats.area_candidates_not_in_jbj ?? "—")} hint="not created — your call" onClick={() => setTab("new")} />
      </div>

      <div className="mir-card rounded-xl p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-neutral-900">
          <ShieldCheck className="h-4 w-4" style={{ color: EMERALD }} aria-hidden /> Protection rules in force
        </p>
        <ul className="mt-2 space-y-1 text-sm text-neutral-600">
          <li>• Any JBJ field you edited manually always wins and is never overwritten.</li>
          <li>• Per-field provenance (manual / imported / earlier source) is recorded on every merge.</li>
          <li>• No external phone numbers, emails, WhatsApp numbers or agents are copied — contact stays JBJ’s.</li>
          <li>• Unit-level and resale inventory is excluded at the source; only project totals are used.</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["summary", "matches", "new", "newDevelopers"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`mir-pill rounded-full px-4 py-2 text-sm ${tab === t ? "mir-pill-active" : ""}`}
          >
            {t === "new" ? "New projects" : t === "newDevelopers" ? "New developers" : t === "matches" ? "Review matches" : "Summary"}
          </button>
        ))}
        {tab !== "summary" ? (
          <div className="ml-auto flex items-center gap-2">
            {tab === "matches" ? (
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value as "project" | "developer")}
                className="rounded-full border border-[rgba(6,78,59,0.25)] bg-white px-3 py-2 text-sm text-neutral-900"
              >
                <option value="project">Projects</option>
                <option value="developer">Developers</option>
              </select>
            ) : null}
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name"
                className="rounded-full border border-[rgba(6,78,59,0.25)] bg-white py-2 pl-9 pr-4 text-sm text-neutral-900"
              />
            </label>
          </div>
        ) : null}
      </div>

      {tab === "summary" ? (
        <div className="mir-card rounded-xl p-5 text-sm text-neutral-600">
          <p className="text-neutral-900">
            Crawl finished{run?.finished_at ? ` ${new Date(run.finished_at).toLocaleString()}` : ""}. Countries covered:
            UAE and Türkiye.
          </p>
          <p className="mt-3">
            Work the <strong className="text-neutral-900">Review matches</strong> tab first — those are staged market
            records that probably already exist on JBJ. Each card opens a full <strong className="text-neutral-900">before / after</strong>{" "}
            comparison, links to the market source and to our own JBJ page. Then approve or reject the{" "}
            <strong className="text-neutral-900">New projects</strong> and <strong className="text-neutral-900">New developers</strong> tabs in bulk.
          </p>
        </div>
      ) : null}

      {tab === "matches" ? (
        <div className="space-y-3">
          <BulkBar
            total={visibleMatches.length}
            allIds={visibleMatches.map((m) => m.id)}
            actions={[
              { label: "Merge selected", onClick: () => bulkDecideMatches("merge"), solid: true, icon: CheckCircle2 },
              { label: "Keep separate", onClick: () => bulkDecideMatches("keep_separate"), icon: Layers },
              { label: "Reject selected", onClick: () => bulkDecideMatches("ignore"), icon: XCircle },
            ]}
          />
          {visibleMatches.length === 0 ? (
            <p className="mir-card rounded-xl p-6 text-sm text-neutral-600">Nothing to review here.</p>
          ) : null}
          {visibleMatches.slice(0, matchLimit).map((m) => {
            const liveRef =
              m.entity_type === "developer"
                ? m.jbj_developer_id
                  ? developerIndex.byId.get(m.jbj_developer_id)
                  : developerIndex.byName.get(norm(m.jbj_name))
                : m.jbj_project_id
                ? projectIndex.byId.get(m.jbj_project_id)
                : projectIndex.byName.get(norm(m.jbj_name));
            const jbjHref = liveRef?.slug
              ? m.entity_type === "developer"
                ? `/developer/${liveRef.slug}`
                : `/project/${liveRef.slug}`
              : null;
            const open = !!openDiff[m.id];
            return (
              <article key={m.id} className={`mir-card rounded-xl p-4 ${selected.has(m.id) ? "mir-row-selected" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <button
                      type="button"
                      aria-label={selected.has(m.id) ? "Unselect" : "Select"}
                      onClick={() => toggle(m.id)}
                      className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded ${selected.has(m.id) ? "mir-solid" : "mir-pill"}`}
                    >
                      {selected.has(m.id) ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                    </button>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                        {m.entity_type === "developer" ? <Building2 className="h-4 w-4" style={{ color: EMERALD }} aria-hidden /> : <Layers className="h-4 w-4" style={{ color: EMERALD }} aria-hidden />}
                        {m.jbj_name || "Unnamed JBJ record"}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Confidence {Math.round(Number(m.confidence))}% · {(m.match_reasons || []).join(" · ") || "name similarity"}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                        {jbjHref ? (
                          <a href={jbjHref} target="_blank" rel="noreferrer noopener" className="mir-link inline-flex items-center gap-1">
                            JBJ page <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                        ) : (
                          <span className="text-neutral-400">No JBJ page yet</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${m.decision === "pending" ? "mir-pill" : "mir-solid"}`}>
                    {m.decision.replace("_", " ")}
                  </span>
                </div>

                {(m.differences || []).length ? (
                  <ul className="mt-3 space-y-1 text-xs text-neutral-600">
                    {(m.differences || []).map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {d.startsWith("protected") ? (
                          <ShieldCheck className="mt-[2px] h-3.5 w-3.5 shrink-0" style={{ color: EMERALD }} aria-hidden />
                        ) : (
                          <AlertTriangle className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden />
                        )}
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-neutral-500">No gaps detected — the market source adds nothing new.</p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {DECISIONS.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => decide(m.id, key)}
                      className={`mir-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${m.decision === key ? "mir-pill-active" : ""}`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setOpenDiff((s) => ({ ...s, [m.id]: !s[m.id] }))}
                    className={`mir-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${open ? "mir-pill-active" : ""}`}
                  >
                    {open ? <ChevronUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
                    Compare side by side
                  </button>
                </div>

                {open ? <MatchDiff match={m} jbjHref={jbjHref} /> : null}
              </article>
            );
          })}
          {visibleMatches.length > matchLimit ? (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setMatchLimit((n) => n + 200)} className="mir-pill rounded-full px-4 py-2 text-sm">
                Load 200 more ({matchLimit} of {visibleMatches.length})
              </button>
              <button type="button" onClick={() => setMatchLimit(visibleMatches.length)} className="mir-solid rounded-full px-4 py-2 text-sm">
                Show all {visibleMatches.length}
              </button>
            </div>
          ) : (
            <p className="text-xs text-neutral-500">Showing all {visibleMatches.length} matched cards.</p>
          )}
        </div>
      ) : null}

      {tab === "new" ? (
        <div className="space-y-3">
          <BulkBar
            total={newProjects.length}
            allIds={newProjects.map((p) => p.id)}
            subsets={[
              { label: "Select only not on JBJ", ids: newProjects.filter((p) => !resolveProjectLink(p)).map((p) => p.id) },
              { label: "Select only already on JBJ", ids: newProjects.filter((p) => !!resolveProjectLink(p)).map((p) => p.id) },
            ]}
            actions={[
              { label: "Approve & publish selected", onClick: () => bulkStaged("project", "approved"), solid: true, icon: CheckCircle2 },
              { label: "Reject selected", onClick: () => bulkStaged("project", "rejected"), icon: XCircle },
              { label: "Reset to pending", onClick: () => bulkStaged("project", "pending"), icon: RefreshCw },
            ]}
          />
          <div className="mir-card overflow-x-auto rounded-xl">
            <table className="w-full text-sm">
              <thead className="mir-solid text-left text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3 w-10"> </th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Developer</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Review</th>
                  <th className="px-4 py-3">Live status</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">JBJ</th>
                </tr>
              </thead>
              <tbody>
                {newProjects.map((p) => {
                  const jbj = resolveProjectLink(p);
                  return (
                    <tr key={p.id} className={`mir-row border-t border-[rgba(6,78,59,0.1)] ${selected.has(p.id) ? "mir-row-selected" : ""}`}>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          aria-label={selected.has(p.id) ? "Unselect row" : "Select row"}
                          onClick={() => toggle(p.id)}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded ${selected.has(p.id) ? "mir-solid" : "mir-pill"}`}
                        >
                          {selected.has(p.id) ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-neutral-900">{p.name}</td>
                      <td className="px-4 py-3 text-neutral-600">{p.developer_name || "—"}</td>
                      <td className="px-4 py-3 text-neutral-600">{[p.area, p.city].filter(Boolean).join(", ") || "—"}</td>
                      <td className="px-4 py-3 text-neutral-600">{p.status || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.review_decision && p.review_decision !== "pending" ? "mir-solid" : "mir-pill"}`}>
                          {p.review_decision || "pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3"><PublishCell status={p.publish_status} at={p.published_at} error={p.publish_error} /></td>
                      <td className="px-4 py-3">
                        <a href={p.source_url} target="_blank" rel="noreferrer noopener" className="mir-link inline-flex items-center gap-1">
                          Source <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        {jbj ? (
                          <a href={jbj.href} target="_blank" rel="noreferrer noopener" className="mir-link inline-flex items-center gap-1">
                            JBJ listing <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        ) : (
                          <span className="text-xs text-neutral-400">Not on JBJ yet</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="p-4 text-xs text-neutral-500">Showing all {newProjects.length} new projects.</p>
          </div>
        </div>
      ) : null}

      {tab === "newDevelopers" ? (
        <div className="space-y-3">
          <BulkBar
            total={newDevelopers.length}
            allIds={newDevelopers.map((d) => d.id)}
            subsets={[
              { label: "Select only not on JBJ", ids: newDevelopers.filter((d) => !resolveDeveloperLink(d)).map((d) => d.id) },
              { label: "Select only already on JBJ", ids: newDevelopers.filter((d) => !!resolveDeveloperLink(d)).map((d) => d.id) },
            ]}
            actions={[
              { label: "Approve & publish selected", onClick: () => bulkStaged("developer", "approved"), solid: true, icon: CheckCircle2 },
              { label: "Reject selected", onClick: () => bulkStaged("developer", "rejected"), icon: XCircle },
              { label: "Reset to pending", onClick: () => bulkStaged("developer", "pending"), icon: RefreshCw },
            ]}
          />
          <div className="mir-card overflow-x-auto rounded-xl">
            <table className="w-full text-sm">
              <thead className="mir-solid text-left text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3 w-10"> </th>
                  <th className="px-4 py-3">Developer</th>
                  <th className="px-4 py-3">Headquarters</th>
                  <th className="px-4 py-3">Projects</th>
                  <th className="px-4 py-3">Review</th>
                  <th className="px-4 py-3">Live status</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">JBJ</th>
                </tr>
              </thead>
              <tbody>
                {newDevelopers.map((d) => {
                  const jbj = resolveDeveloperLink(d);
                  return (
                    <tr key={d.id} className={`mir-row border-t border-[rgba(6,78,59,0.1)] ${selected.has(d.id) ? "mir-row-selected" : ""}`}>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          aria-label={selected.has(d.id) ? "Unselect row" : "Select row"}
                          onClick={() => toggle(d.id)}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded ${selected.has(d.id) ? "mir-solid" : "mir-pill"}`}
                        >
                          {selected.has(d.id) ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-neutral-900">{d.name}</td>
                      <td className="px-4 py-3 text-neutral-600">{formatHeadquarters(d.headquarters)}</td>
                      <td className="px-4 py-3 text-neutral-600">{d.total_projects ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${d.review_decision && d.review_decision !== "pending" ? "mir-solid" : "mir-pill"}`}>
                          {d.review_decision || "pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3"><PublishCell status={d.publish_status} at={d.published_at} error={d.publish_error} /></td>
                      <td className="px-4 py-3">
                        <a href={d.source_url} target="_blank" rel="noreferrer noopener" className="mir-link inline-flex items-center gap-1">
                          Source <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        {jbj ? (
                          <a href={jbj.href} target="_blank" rel="noreferrer noopener" className="mir-link inline-flex items-center gap-1">
                            JBJ profile <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        ) : (
                          <span className="text-xs text-neutral-400">Not on JBJ yet</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="p-4 text-xs text-neutral-500">Showing all {newDevelopers.length} developers from the staging area.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
