/**
 * Owner backend — Developer Data Gaps.
 *
 * Projects are never hidden because of a missing developer or missing developer
 * logo. They publish, and each one is flagged here with the developer name
 * written on the project so the team knows exactly who to contact.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { AlertTriangle, Building2, ExternalLink, ImageOff, RefreshCw, Search, UserX } from "lucide-react";

type GapRow = {
  project_id: string;
  project_name: string | null;
  slug: string | null;
  developer_id: string | null;
  developer_name: string | null;
  developer_website: string | null;
  developer_gap_reason: string;
  is_published: boolean;
};

const REASON_LABEL: Record<string, string> = {
  no_developer_record: "No developer profile",
  developer_has_no_logo: "Developer has no logo",
};

export default function DeveloperGapsQueue() {
  const [filter, setFilter] = useState<"all" | "no_developer_record" | "developer_has_no_logo">("all");
  const [q, setQ] = useState("");

  const { data: rows = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["project-developer-gaps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_developer_gaps" as any)
        .select("*")
        .limit(2000);
      if (error) throw error;
      return (data || []) as unknown as GapRow[];
    },
  });

  const { data: wordmarks = [] } = useQuery({
    queryKey: ["developer-wordmark-gaps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_logo_wordmark_gaps" as any)
        .select("*")
        .limit(1000);
      if (error) throw error;
      return (data || []) as unknown as WordmarkRow[];
    },
  });

  const visibleWordmarks = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return wordmarks
      .filter((w) => !needle || (w.developer_name || "").toLowerCase().includes(needle))
      .sort((a, b) => (b.published_projects || 0) - (a.published_projects || 0));
  }, [wordmarks, q]);


  const byDeveloper = useMemo(() => {
    const map = new Map<string, { name: string; reason: string; website: string | null; projects: GapRow[] }>();
    rows
      .filter((r) => filter === "all" || r.developer_gap_reason === filter)
      .filter((r) => {
        if (!q.trim()) return true;
        const needle = q.toLowerCase();
        return (
          (r.developer_name || "").toLowerCase().includes(needle) ||
          (r.project_name || "").toLowerCase().includes(needle)
        );
      })
      .forEach((r) => {
        const key = (r.developer_name || "Unknown developer").trim();
        const entry = map.get(key) || {
          name: key,
          reason: r.developer_gap_reason,
          website: r.developer_website,
          projects: [] as GapRow[],
        };
        entry.projects.push(r);
        map.set(key, entry);
      });
    return Array.from(map.values()).sort((a, b) => b.projects.length - a.projects.length);
  }, [rows, filter, q]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      no_developer_record: rows.filter((r) => r.developer_gap_reason === "no_developer_record").length,
      developer_has_no_logo: rows.filter((r) => r.developer_gap_reason === "developer_has_no_logo").length,
    }),
    [rows],
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl text-foreground md:text-3xl">Developer data gaps</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          These projects are live on the site. They are missing a developer profile or a developer logo — contact the
          developer below to collect the missing brand assets.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", `All gaps (${counts.all})`],
            ["no_developer_record", `No developer profile (${counts.no_developer_record})`],
            ["developer_has_no_logo", `No logo (${counts.developer_has_no_logo})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
              filter === key
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}

        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search developer or project"
            className="h-10 w-64 rounded-full border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground hover:bg-muted"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading gaps…</p>
      ) : byDeveloper.length === 0 ? (
        <p className="text-sm text-muted-foreground">No developer gaps. Every live project has a developer and a logo.</p>
      ) : (
        <div className="space-y-4">
          {byDeveloper.map((dev) => (
            <section key={dev.name} className="rounded-2xl border border-border bg-card p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 className="flex items-center gap-2 font-serif text-lg text-foreground">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="break-words">{dev.name}</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 font-medium text-destructive">
                      {dev.reason === "no_developer_record" ? (
                        <UserX className="h-3.5 w-3.5" />
                      ) : (
                        <ImageOff className="h-3.5 w-3.5" />
                      )}
                      {REASON_LABEL[dev.reason] || dev.reason}
                    </span>
                    <span className="text-muted-foreground">
                      {dev.projects.length} live project{dev.projects.length === 1 ? "" : "s"}
                    </span>
                    {dev.website && (
                      <a
                        href={dev.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        Website <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5" /> Needs brand assets
                </span>
              </div>

              <ul className="mt-3 flex flex-wrap gap-2">
                {dev.projects.map((p) => (
                  <li key={p.project_id}>
                    <Link
                      to={p.slug ? `/project/${p.slug}` : "#"}
                      className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/70"
                    >
                      <span className="break-words">{p.project_name || "Untitled project"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
