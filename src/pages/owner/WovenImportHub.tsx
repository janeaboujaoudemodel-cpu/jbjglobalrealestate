/**
 * Owner backend — Woven Enrichment Import Preview.
 *
 * LOCKED RULE: nothing crawled from Woven is written to the live directory
 * automatically. Everything lands in a staging area first, is scored against
 * the existing JBJ record, and only moves after the owner picks
 * MERGE / KEEP SEPARATE / IGNORE here. Manually edited JBJ fields always win.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

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
};

const DECISIONS = [
  { key: "merge", label: "Merge", icon: CheckCircle2 },
  { key: "keep_separate", label: "Keep separate", icon: Layers },
  { key: "ignore", label: "Ignore", icon: XCircle },
] as const;

const StatCard = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="rounded-xl border border-border/60 bg-card p-4">
    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
  </div>
);

export default function WovenImportHub() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"summary" | "matches" | "new">("summary");
  const [entity, setEntity] = useState<"project" | "developer">("project");
  const [q, setQ] = useState("");

  const { data: run } = useQuery({
    queryKey: ["woven-import-run"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("woven_import_runs" as any)
        .select("*")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Run | null;
    },
  });

  const { data: matches = [], isFetching, refetch } = useQuery({
    queryKey: ["woven-review-matches", entity],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("woven_review_matches" as any)
        .select("*")
        .eq("entity_type", entity)
        .order("confidence", { ascending: false })
        .limit(1500);
      if (error) throw error;
      return (data || []) as unknown as MatchRow[];
    },
  });

  const { data: stagedProjects = [] } = useQuery({
    queryKey: ["woven-staged-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("woven_staged_projects" as any)
        .select("id,name,source_slug,source_url,developer_name,city,area,status,is_offplan,excluded_reason")
        .order("name")
        .limit(2000);
      if (error) throw error;
      return (data || []) as unknown as StagedProject[];
    },
  });

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

  const visibleMatches = useMemo(
    () =>
      matches.filter(
        (m) => !q || (m.jbj_name || "").toLowerCase().includes(q.toLowerCase()),
      ),
    [matches, q],
  );

  const stats = (run?.stats || {}) as Record<string, number | string>;

  const decide = async (id: string, decision: string) => {
    const { error } = await supabase
      .from("woven_review_matches" as any)
      .update({ decision, decided_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Could not save the decision");
      return;
    }
    toast.success(`Marked as ${decision.replace("_", " ")}`);
    qc.invalidateQueries({ queryKey: ["woven-review-matches", entity] });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Enrichment source</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Sparkles className="h-5 w-5" aria-hidden /> Woven import preview
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Developer-built projects only — off-plan, ready and sold-out. Resale listings, agency inventory and
            individual apartments are never imported; availability stays “On Request”. Exact matches were auto-merged
            into the gaps; everything else waits for your decision.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm text-foreground hover:bg-accent"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden /> Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Developers discovered" value={String(stats.total_developers_discovered ?? "—")} />
        <StatCard label="Projects in scope" value={String(stats.total_projects_in_scope ?? stats.total_projects_discovered ?? "—")} hint={`incl. ${stats.ready_projects_included ?? 0} ready · ${stats.sold_out_projects_included ?? 0} sold out`} />
        <StatCard label="Developers auto-merged" value={String(stats.developer_matches_auto_merged ?? "—")} hint={`${stats.developer_fields_filled ?? 0} empty fields filled`} />
        <StatCard label="Projects auto-merged" value={String(stats.project_exact_matches_auto_merged ?? "—")} hint={`${stats.project_fields_filled ?? 0} empty fields filled`} />
        <StatCard label="New projects" value={String(stats.new_projects_awaiting_approval ?? stats.new_projects ?? "—")} hint="awaiting your approval" />
        <StatCard label="New developers" value={String(stats.new_developers ?? "—")} hint="awaiting your approval" />
        <StatCard label="Areas matched" value={String(stats.areas_matched ?? "—")} hint={`${stats.areas_geo_filled ?? 0} got map coordinates`} />
        <StatCard label="New area candidates" value={String(stats.area_candidates_not_in_jbj ?? "—")} hint="not created — your call" />
      </div>


      <div className="rounded-xl border border-border/60 bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ShieldCheck className="h-4 w-4" aria-hidden /> Protection rules in force
        </p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Any JBJ field you edited manually always wins and is never overwritten.</li>
          <li>• Per-field provenance (manual / Woven / earlier source) is recorded on every merge.</li>
          <li>• No Woven phone numbers, emails, WhatsApp numbers or agents are copied — contact stays JBJ’s.</li>
          <li>• Unit-level and resale inventory is excluded at the source; only project totals are used.</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["summary", "matches", "new"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm capitalize ${
              tab === t ? "bg-primary text-primary-foreground" : "border border-border/60 text-foreground hover:bg-accent"
            }`}
          >
            {t === "new" ? "New records" : t === "matches" ? "Review matches" : "Summary"}
          </button>
        ))}
        {tab !== "summary" ? (
          <div className="ml-auto flex items-center gap-2">
            {tab === "matches" ? (
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value as "project" | "developer")}
                className="rounded-full border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="project">Projects</option>
                <option value="developer">Developers</option>
              </select>
            ) : null}
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name"
                className="rounded-full border border-border/60 bg-background py-2 pl-9 pr-4 text-sm text-foreground"
              />
            </label>
          </div>
        ) : null}
      </div>

      {tab === "summary" ? (
        <div className="rounded-xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
          <p className="text-foreground">
            Crawl finished{run?.finished_at ? ` ${new Date(run.finished_at).toLocaleString()}` : ""}. Countries covered:
            UAE and Türkiye.
          </p>
          <p className="mt-3">
            Work the <strong className="text-foreground">Review matches</strong> tab first — those are staged Woven
            records that probably already exist on JBJ. Choose Merge to fill only the gaps, Keep separate if they are
            genuinely different projects, or Ignore to drop the staged record. Then approve the
            <strong className="text-foreground"> New records</strong> tab in batches.
          </p>
        </div>
      ) : null}

      {tab === "matches" ? (
        <div className="space-y-3">
          {visibleMatches.length === 0 ? (
            <p className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
              Nothing to review here.
            </p>
          ) : null}
          {visibleMatches.slice(0, 300).map((m) => (
            <article key={m.id} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {m.entity_type === "developer" ? <Building2 className="h-4 w-4" aria-hidden /> : <Layers className="h-4 w-4" aria-hidden />}
                    {m.jbj_name || "Unnamed JBJ record"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Confidence {Math.round(Number(m.confidence))}% · {(m.match_reasons || []).join(" · ") || "name similarity"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    m.decision === "pending"
                      ? "border border-border/60 text-muted-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {m.decision.replace("_", " ")}
                </span>
              </div>

              {(m.differences || []).length ? (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {(m.differences || []).map((d, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {d.startsWith("protected") ? (
                        <ShieldCheck className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden />
                      ) : (
                        <AlertTriangle className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden />
                      )}
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">No gaps detected — Woven adds nothing new.</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {DECISIONS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => decide(m.id, key)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${
                      m.decision === key
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/60 text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "new" ? (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {newProjects.slice(0, 400).map((p) => (
                <tr key={p.id} className="border-b border-border/40">
                  <td className="px-4 py-3 text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.developer_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[p.area, p.city].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.status || "—"}</td>
                  <td className="px-4 py-3">
                    <a
                      href={p.source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      View <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {newProjects.length > 400 ? (
            <p className="p-4 text-xs text-muted-foreground">
              Showing the first 400 of {newProjects.length} new projects.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
