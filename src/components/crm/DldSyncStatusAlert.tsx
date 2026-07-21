/**
 * DldSyncStatusAlert
 * ──────────────────
 * Reads the latest row of `dld_daily_sync_runs` and surfaces a highly-visible
 * banner when the nightly scrape has failed, gone stale (> 26h), or never ran.
 *
 * Runs automatically nightly at 03:00 UTC via pg_cron — this panel is the
 * owner's alert surface. No manual trigger is exposed.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

type Run = {
  id: string;
  status: string | null;
  run_started_at: string | null;
  run_finished_at: string | null;
  error_message: string | null;
  raw_summary: any;
};

export function DldSyncStatusAlert() {
  const q = useQuery({
    queryKey: ["dld-sync-latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dld_daily_sync_runs" as any)
        .select("id,status,run_started_at,run_finished_at,error_message,raw_summary")
        .order("run_started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Run | null;
    },
    refetchInterval: 60_000,
  });

  if (q.isLoading) {
    return (
      <div className="rounded-lg border border-[#B89555]/40 bg-white p-3 flex items-center gap-2 text-[12px] text-[#4B5D55]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking DLD sync status…
      </div>
    );
  }

  const run = q.data ?? null;
  const startedAt = run?.run_started_at ? new Date(run.run_started_at) : null;
  const hoursSince = startedAt ? (Date.now() - startedAt.getTime()) / 3_600_000 : Infinity;

  const failed = !run || run.status === "failed" || (run.status === "partial" && !!run.error_message);
  const stale = !!startedAt && hoursSince > 26;
  const problem = failed || stale;

  if (problem) {
    const heading = !run
      ? "DLD scraper has never completed a run"
      : failed
      ? "DLD scraper is not pulling data"
      : "DLD scraper is stale — no successful run in the last 26 hours";
    const detail = run?.error_message
      ? run.error_message
      : !run
      ? "The nightly scraper hasn't logged a run yet. It runs automatically at 03:00 UTC via pg_cron; if this alert stays visible after the next 03:00 UTC window, contact support."
      : "Data on DLD's public site may be temporarily unavailable, or Firecrawl returned an error. This will retry automatically at the next 03:00 UTC window.";

    return (
      <div
        className="rounded-lg border-2 p-4 flex gap-3"
        style={{ borderColor: "#7F1D1D", background: "rgba(127,29,29,0.06)" }}
      >
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#7F1D1D" }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black" style={{ color: "#7F1D1D" }}>
            {heading}
          </p>
          <p className="text-[12px] mt-1 text-[#4B5D55]">{detail}</p>
          {startedAt && (
            <p className="text-[11px] mt-1 text-[#4B5D55]">
              Last attempt: {formatDistanceToNow(startedAt, { addSuffix: true })}
              {run?.status ? ` · status: ${run.status}` : ""}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Healthy last run — show a compact confirmation strip.
  const segs = (run?.raw_summary?.segments ?? {}) as Record<string, any>;
  const totals = Object.entries(segs)
    .map(([k, v]: [string, any]) => `${k}: ${v?.staged ?? 0}`)
    .join(" · ");

  return (
    <div
      className="rounded-lg border p-3 flex gap-3 items-center"
      style={{ borderColor: "#064E3B", background: "rgba(6,78,59,0.06)" }}
    >
      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#064E3B" }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-black" style={{ color: "#064E3B" }}>
          DLD scraper healthy · runs automatically nightly at 03:00 UTC
        </p>
        <p className="text-[11px] mt-0.5 text-[#4B5D55] truncate">
          Last run {startedAt ? formatDistanceToNow(startedAt, { addSuffix: true }) : "—"}
          {totals ? ` · staged rows → ${totals}` : ""}
        </p>
      </div>
    </div>
  );
}

export default DldSyncStatusAlert;
