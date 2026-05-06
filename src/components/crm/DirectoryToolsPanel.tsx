import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Globe2,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Job = {
  id: string;
  kind: string;
  emirate: string | null;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  inserted_count: number;
  updated_count: number;
  message: string | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
};

const KIND_LABEL: Record<string, string> = {
  brokerage_seed: "Discovering brokerages",
  brokerage_enrich: "Enriching brokerages",
  developer_enrich: "Enriching developers",
};

/**
 * Background-only directory health card.
 * Filters jobs by `kinds` so the Brokerage tab and Developer tab each see
 * their own pipeline only.
 */
type Props = {
  kinds?: string[];
  title?: string;
};
export const DirectoryToolsPanel = ({
  kinds = ["brokerage_seed", "brokerage_enrich", "developer_enrich"],
  title = "UAE Brokerage & Developer Directory",
}: Props = {}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("crm_directory_jobs")
      .select("*")
      .in("kind", kinds)
      .order("started_at", { ascending: false })
      .limit(6);
    if (!error) setJobs(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, expanded ? 4000 : 15000);
    return () => clearInterval(t);
  }, [expanded]);

  const anyActive = jobs.some(
    (j) => j.status === "running" || j.status === "queued",
  );

  const refresh = async () => {
    if (refreshing || anyActive) {
      toast.info("A background sync is already running.");
      return;
    }
    setRefreshing(true);
    try {
      const { error } = await (supabase as any).functions.invoke(
        "directory-job-runner",
        { body: { action: "cron" } },
      );
      if (error) throw error;
      toast.success("Refresh started — populating in background.");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Could not start refresh");
    } finally {
      setRefreshing(false);
    }
  };

  const latestByKind = kinds.map((kind) => {
    const j = jobs.find((x) => x.kind === kind);
    return { kind, job: j };
  });
  const allFinished = latestByKind.every(
    ({ job }) => job && job.status === "completed",
  );
  const anyFailed = latestByKind.some(({ job }) => job && job.status === "failed");
  const anyChanges = latestByKind.some(
    ({ job }) =>
      job && ((job.inserted_count || 0) + (job.updated_count || 0)) > 0,
  );
  const allDoneWithChanges = allFinished && anyChanges && !anyFailed;
  const allDoneNoChanges = allFinished && !anyChanges && !anyFailed;

  const refreshDisabled = refreshing || anyActive;
  const refreshLabel = anyActive
    ? "Running…"
    : refreshing
      ? "Starting…"
      : "Refresh now";

  return (
    <Card className="border-[#B89555]/30 bg-[#FDFBF7]">
      <CardContent className="p-4 space-y-3">
        {/* Compact header — always visible */}
        <div className="flex items-center gap-2 flex-wrap">
          <Globe2 className="w-4 h-4 text-[#B89555]" />
          <h3 className="text-sm font-semibold text-[#1A1A1A]">
            {title}
          </h3>
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
            Auto-runs daily
          </Badge>
          {anyActive && (
            <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing…
            </Badge>
          )}
          {!anyActive && allDoneWithChanges && (
            <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Up to date · new data
            </Badge>
          )}
          {!anyActive && allDoneNoChanges && (
            <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Up to date
            </Badge>
          )}
          {!anyActive && anyFailed && (
            <Badge className="bg-red-50 text-red-800 border border-red-300 inline-flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Needs attention
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={refresh}
              disabled={refreshDisabled}
              className="border-[#B89555]/40 disabled:opacity-100 disabled:bg-white disabled:text-[#1A1A1A]/70 disabled:cursor-not-allowed"
              title={
                anyActive
                  ? "A sync is already running"
                  : "Start a fresh sync across all UAE emirates"
              }
            >
              {refreshDisabled ? (
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              ) : (
                <RefreshCcw className="w-3.5 h-3.5 mr-2" />
              )}
              {refreshLabel}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label={expanded ? "Hide details" : "Show details"}
              className="text-[#1A1A1A]"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {expanded && (
          <>
            <p className="text-xs text-[#1A1A1A]/70">
              Each day the system automatically scans publicly-listed UAE (United Arab Emirates) brokerages and developers by emirate and fills in any
              missing phone, email, website, Instagram, office address &amp; map link. You don't need to click anything — this card just shows progress.
              A run that finishes with <strong>0 new</strong> means the public sources had no new contact info to add this cycle, not an error.
            </p>

            <div className="grid sm:grid-cols-3 gap-2">
              {latestByKind.map(({ kind, job }) => {
                const hasNewRecords = (job?.inserted_count || 0) > 0;
                const isDoneWithNew = job?.status === "completed" && hasNewRecords;
                const isDoneNoNew = job?.status === "completed" && !hasNewRecords;
                const isFailed = job?.status === "failed";
                const isRunning =
                  job && (job.status === "running" || job.status === "queued");

                return (
                  <div
                    key={kind}
                    className={`rounded-lg border px-3 py-2 text-xs flex items-start gap-2 ${
                      isDoneWithNew
                        ? "border-emerald-300 bg-emerald-50"
                        : isDoneNoNew
                          ? "border-[#B89555]/40 bg-[#EFE6D6]"
                          : isFailed
                            ? "border-red-300 bg-red-50"
                            : "border-[#B89555]/30 bg-white"
                    }`}
                  >
                    <div className="mt-0.5">
                      {isDoneWithNew ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      ) : isDoneNoNew ? (
                        <CheckCircle2 className="w-4 h-4 text-[#1A1A1A]/60" />
                      ) : isFailed ? (
                        <AlertCircle className="w-4 h-4 text-red-700" />
                      ) : isRunning ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#B89555]" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-[#1A1A1A]/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[#1A1A1A]">
                        {KIND_LABEL[kind]}
                      </div>
                      <div className="text-[#1A1A1A]/70 truncate">
                        {isDoneWithNew
                          ? "Completed — new records added"
                          : isDoneNoNew
                            ? "Completed — up to date"
                            : isFailed
                              ? job?.error || "Failed"
                              : isRunning
                                ? "In progress…"
                                : "Awaiting next run"}
                      </div>
                      {job && (job.inserted_count || job.updated_count) ? (
                        <div className="text-[#1A1A1A]/60 mt-0.5">
                          {job.inserted_count > 0 ? `+${job.inserted_count} new` : "0 new"} · {job.updated_count} updated
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[#1A1A1A]/70">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading jobs…
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-xs text-[#1A1A1A]/60">
                No background jobs yet — click "Refresh now".
              </div>
            ) : (
              <ul className="space-y-2">
                {jobs.map((j) => (
                  <li
                    key={j.id}
                    className="flex items-start gap-2 text-xs border-t border-[#B89555]/15 pt-2 first:border-t-0 first:pt-0"
                  >
                    <div className="mt-0.5">
                      {j.status === "completed" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      ) : j.status === "failed" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-red-700" />
                      ) : (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B89555]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#1A1A1A]">
                        {KIND_LABEL[j.kind] ?? j.kind}
                        {j.emirate ? ` — ${j.emirate}` : ""}
                      </div>
                      <div className="text-[#1A1A1A]/70 truncate">
                        {j.message ??
                          (j.status === "queued"
                            ? "Queued…"
                            : j.status === "running"
                              ? "Running…"
                              : j.status)}
                        {j.inserted_count || j.updated_count
                          ? ` · +${j.inserted_count} new, ${j.updated_count} updated`
                          : ""}
                      </div>
                      {j.error && <div className="text-red-700 truncate">{j.error}</div>}
                    </div>
                    <div className="text-[#1A1A1A]/50">
                      {new Date(j.started_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const BrokerageDirectoryPanel = () => (
  <DirectoryToolsPanel
    kinds={["brokerage_seed", "brokerage_enrich"]}
    title="UAE Brokerage Directory"
  />
);

export const DeveloperDirectoryPanel = () => (
  <DirectoryToolsPanel
    kinds={["developer_enrich"]}
    title="UAE Developer Directory"
  />
);
