import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Globe2, RefreshCcw, CheckCircle2, AlertCircle } from "lucide-react";
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
 *
 * - Shows the latest seed + enrich jobs and their live progress.
 * - No manual "Sync" or "Enrich batch of 5" buttons. The system runs daily
 *   via pg_cron + immediate kickoff after deploy.
 * - "Refresh now" calls the runner with action=cron and polls for status.
 */
export const DirectoryToolsPanel = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("crm_directory_jobs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(6);
    if (!error) setJobs(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const { error } = await (supabase as any).functions.invoke("directory-job-runner", {
        body: { action: "cron" },
      });
      if (error) throw error;
      toast.success("Refresh started — populating in background.");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Could not start refresh");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card className="border-[#B89555]/30 bg-[#FDFBF7]">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Globe2 className="w-4 h-4 text-[#B89555]" />
          <h3 className="text-sm font-semibold text-[#1A1A1A]">UAE Directory · Background sync</h3>
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">Auto-runs daily</Badge>
          <div className="ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={refresh}
              disabled={refreshing}
              className="border-[#B89555]/40 disabled:opacity-100 disabled:bg-white disabled:text-[#1A1A1A]/70 disabled:cursor-wait"
            >
              {refreshing ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5 mr-2" />}
              Refresh now
            </Button>
          </div>
        </div>

        <p className="text-xs text-[#1A1A1A]/70">
          The system automatically discovers UAE-licensed brokerages by emirate and fills missing
          phone, email, website, Instagram, office address & map link for both brokerages and
          developers. You don't need to click anything — this card just shows progress.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#1A1A1A]/70">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading jobs…
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-xs text-[#1A1A1A]/60">No background jobs yet — click "Refresh now".</div>
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
                    {j.message ?? (j.status === "queued" ? "Queued…" : j.status === "running" ? "Running…" : j.status)}
                    {j.inserted_count || j.updated_count
                      ? ` · +${j.inserted_count} new, ${j.updated_count} updated`
                      : ""}
                  </div>
                  {j.error && <div className="text-red-700 truncate">{j.error}</div>}
                </div>
                <div className="text-[#1A1A1A]/50">
                  {new Date(j.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
