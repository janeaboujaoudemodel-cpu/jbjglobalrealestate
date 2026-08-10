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

const EMERALD = "#064E3B";
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
};

type LiveRef = { id: string; name: string | null; slug: string | null };

const DECISIONS = [
  { key: "merge", label: "Merge", icon: CheckCircle2 },
  { key: "keep_separate", label: "Keep separate", icon: Layers },
  { key: "ignore", label: "Ignore", icon: XCircle },
] as const;

const norm = (s: string | null | undefined) =>
  (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\b(the|by|at|residence|residences|tower|towers)\b/g, "").trim();

/** Scoped emerald styling so no bright green or black-on-hover can leak in. */
const EmeraldStyles = () => (
  <style>{`
    [data-mir] .mir-pill{border:1px solid rgba(6,78,59,0.25);background:#fff;color:${EMERALD};transition:background .15s,color .15s}
    [data-mir] .mir-pill:hover{background:${EMERALD_GRADIENT};color:#fff;border-color:transparent}
    [data-mir] .mir-pill:hover svg{color:#fff}
    [data-mir] .mir-pill-active{background:${EMERALD_GRADIENT} !important;color:#fff !important;border-color:transparent !important}
    [data-mir] .mir-pill-active svg{color:#fff !important}
    [data-mir] .mir-card{border:1px solid rgba(6,78,59,0.12);background:#fff;transition:border-color .15s,box-shadow .15s}
    [data-mir] .mir-card-click:hover{border-color:${EMERALD};box-shadow:0 8px 24px -14px rgba(6,78,59,.55)}
    [data-mir] .mir-link{color:${EMERALD};font-weight:600}
    [data-mir] .mir-link:hover{text-decoration:underline}
    [data-mir] .mir-row:hover{background:rgba(6,78,59,0.04)}
    [data-mir] .mir-solid{background:${EMERALD_GRADIENT};color:#fff;border-color:transparent}
    [data-mir] .mir-solid:hover{background:${EMERALD_GRADIENT};color:#fff;filter:brightness(1.08)}
    [data-mir] .mir-solid svg{color:#fff}
  `}</style>
);

const StatCard = ({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    style={{ display: "block" }}
    className={`mir-card w-full rounded-xl p-4 text-left ${onClick ? "mir-card-click cursor-pointer" : "cursor-default"}`}
  >
    <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
    {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    {onClick ? <p className="mt-2 text-[11px] mir-link">Open →</p> : null}
  </button>
);

/** Before / after panel for a match — live JBJ values vs staged market values. */
function MatchDiff({ match }: { match: MatchRow }) {
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

  if (isLoading) return <p className="mt-3 text-xs text-neutral-500">Loading before / after…</p>;
  if (!rows.length) return <p className="mt-3 text-xs text-neutral-500">Nothing to compare.</p>;

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-[rgba(6,78,59,0.15)]">
      <table className="w-full text-xs">
        <thead className="mir-solid text-left">
          <tr>
            <th className="px-3 py-2 font-semibold">Field</th>
            <th className="px-3 py-2 font-semibold">Before (JBJ now)</th>
            <th className="px-3 py-2 font-semibold">After merge</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="mir-row border-t border-[rgba(6,78,59,0.1)]">
              <td className="px-3 py-2 font-medium text-neutral-800">{r.key.replace(/_/g, " ")}</td>
              <td className="px-3 py-2 text-neutral-600">{r.before}</td>
              <td className="px-3 py-2 text-neutral-900">
                {r.state === "protected" ? (
                  <span className="text-neutral-500 italic">{r.before} — manual JBJ value protected</span>
                ) : (
                  <span style={{ color: EMERALD, fontWeight: 600 }}>{r.after}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

  const { data: matches = [], isFetching, refetch } = useQuery({
    queryKey: ["market-review-matches", entity],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_review_matches" as any)
        .select("*")
        .eq("entity_type", entity)
        .order("confidence", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data || []) as unknown as MatchRow[];
    },
  });

  const { data: stagedProjects = [] } = useQuery({
    queryKey: ["market-staged-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_staged_projects" as any)
        .select(
          "id,name,source_slug,source_url,developer_name,city,area,status,is_offplan,excluded_reason,review_decision,jbj_project_id",
        )
        .order("name")
        .limit(3000);
      if (error) throw error;
      return (data || []) as unknown as StagedProject[];
    },
  });

  const { data: stagedDevelopers = [] } = useQuery({
    queryKey: ["market-staged-developers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_staged_developers" as any)
        .select("id,name,source_slug,source_url,headquarters,total_projects,review_decision,jbj_developer_id")
        .order("name")
        .limit(2000);
      if (error) throw error;
      return (data || []) as unknown as StagedDeveloper[];
    },
  });

  // Live JBJ records, used to resolve "our own link" for every staged row.
  const { data: liveProjects = [] } = useQuery({
    queryKey: ["market-live-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id,name,slug").limit(5000);
      if (error) throw error;
      return (data || []) as unknown as LiveRef[];
    },
  });

  const { data: liveDevelopers = [] } = useQuery({
    queryKey: ["market-live-developers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("developers").select("id,name,slug").limit(5000);
      if (error) throw error;
      return (data || []) as unknown as LiveRef[];
    },
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
    () => new Set(matches.filter((m) => m.entity_type === "project").map((m) => m.staged_project_id)),
    [matches],
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
    qc.invalidateQueries({ queryKey: ["market-review-matches", entity] });
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
    qc.invalidateQueries({ queryKey: ["market-review-matches", entity] });
  };

  const bulkStaged = async (kind: "project" | "developer", decision: "approved" | "rejected" | "pending") => {
    const ids = Array.from(selected);
    if (!ids.length) return toast.error("Select at least one row first");
    setBulkBusy(true);
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
  }: {
    total: number;
    allIds: string[];
    actions: { label: string; onClick: () => void; solid?: boolean; icon?: any }[];
  }) => (
    <div className="mir-card flex flex-wrap items-center gap-2 rounded-xl p-3">
      <button type="button" className="mir-pill rounded-full px-3 py-1.5 text-xs font-semibold" onClick={() => setSelected(new Set(allIds))}>
        <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" aria-hidden /> Select all ({total})</span>
      </button>
      <button type="button" className="mir-pill rounded-full px-3 py-1.5 text-xs font-semibold" onClick={() => setSelected(new Set())}>
        <span className="inline-flex items-center gap-1"><Square className="h-3.5 w-3.5" aria-hidden /> Unselect all</span>
      </button>
      <span className="text-xs text-neutral-600">{selected.size} selected</span>
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
          onClick={() => setTab("newDevelopers")}
        />
        <StatCard
          label="Projects in scope"
          value={String(stats.total_projects_in_scope ?? stats.total_projects_discovered ?? stagedProjects.length)}
          hint={`incl. ${stats.ready_projects_included ?? 0} ready · ${stats.sold_out_projects_included ?? 0} sold out`}
          onClick={() => setTab("new")}
        />
        <StatCard
          label="Developers auto-merged"
          value={String(stats.developer_matches_auto_merged ?? "—")}
          hint={`${stats.developer_fields_filled ?? 0} empty fields filled`}
          onClick={() => { setEntity("developer"); setTab("matches"); }}
        />
        <StatCard
          label="Projects auto-merged"
          value={String(stats.project_exact_matches_auto_merged ?? "—")}
          hint={`${stats.project_fields_filled ?? 0} empty fields filled`}
          onClick={() => { setEntity("project"); setTab("matches"); }}
        />
        <StatCard
          label="New projects"
          value={String(newProjects.length || stats.new_projects_awaiting_approval || 0)}
          hint="awaiting your approval"
          onClick={() => setTab("new")}
        />
        <StatCard
          label="New developers"
          value={String(stats.new_developers ?? newDevelopers.length)}
          hint="awaiting your approval"
          onClick={() => setTab("newDevelopers")}
        />
        <StatCard label="Areas matched" value={String(stats.areas_matched ?? "—")} hint={`${stats.areas_geo_filled ?? 0} got map coordinates`} />
        <StatCard label="New area candidates" value={String(stats.area_candidates_not_in_jbj ?? "—")} hint="not created — your call" />
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
              <article key={m.id} className="mir-card rounded-xl p-4">
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
                    className="mir-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
                  >
                    {open ? <ChevronUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
                    Before / after
                  </button>
                </div>

                {open ? <MatchDiff match={m} /> : null}
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
            actions={[
              { label: "Approve selected", onClick: () => bulkStaged("project", "approved"), solid: true, icon: CheckCircle2 },
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
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">JBJ</th>
                </tr>
              </thead>
              <tbody>
                {newProjects.map((p) => {
                  const jbj = resolveProjectLink(p);
                  return (
                    <tr key={p.id} className="mir-row border-t border-[rgba(6,78,59,0.1)]">
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
            actions={[
              { label: "Approve selected", onClick: () => bulkStaged("developer", "approved"), solid: true, icon: CheckCircle2 },
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
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">JBJ</th>
                </tr>
              </thead>
              <tbody>
                {newDevelopers.map((d) => {
                  const jbj = resolveDeveloperLink(d);
                  return (
                    <tr key={d.id} className="mir-row border-t border-[rgba(6,78,59,0.1)]">
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
                      <td className="px-4 py-3 text-neutral-600">{d.headquarters || "—"}</td>
                      <td className="px-4 py-3 text-neutral-600">{d.total_projects ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${d.review_decision && d.review_decision !== "pending" ? "mir-solid" : "mir-pill"}`}>
                          {d.review_decision || "pending"}
                        </span>
                      </td>
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
