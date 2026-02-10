import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RefreshCw, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

interface SyncJobRow {
  id: string;
  job_type: string;
  status: string;
  source: string | null;
  stats_created: number | null;
  stats_updated: number | null;
  stats_errors: number | null;
  error_log: any;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const AUTO_SYNC_TYPES = [
  "daily-reelly-auto-sync",
  "daily-provident-auto-sync",
];

export const SyncHistoryLog = () => {
  const [jobs, setJobs] = useState<SyncJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sync_jobs")
      .select("id, job_type, status, source, stats_created, stats_updated, stats_errors, error_log, started_at, completed_at, created_at")
      .in("job_type", AUTO_SYNC_TYPES)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error && data) {
      setJobs(data as SyncJobRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const statusBadge = (status: string) => {
    if (status === "completed") return <Badge className="bg-emerald-600 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
    if (status === "failed") return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
  };

  const sourceLabel = (job: SyncJobRow) => {
    if (job.job_type.includes("reelly")) return "Reelly";
    if (job.job_type.includes("provident")) return "Provident";
    return job.source || "Unknown";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Daily Auto-Sync History</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">No auto-sync runs recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead className="text-right">Updated</TableHead>
                <TableHead className="text-right">Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <Collapsible
                  key={job.id}
                  open={expandedId === job.id}
                  onOpenChange={(open) => setExpandedId(open ? job.id : null)}
                  asChild
                >
                  <>
                    <CollapsibleTrigger asChild>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          {expandedId === job.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {job.started_at
                            ? format(new Date(job.started_at), "MMM dd, yyyy HH:mm")
                            : format(new Date(job.created_at), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sourceLabel(job)}</Badge>
                        </TableCell>
                        <TableCell>{statusBadge(job.status)}</TableCell>
                        <TableCell className="text-right font-mono">{job.stats_created ?? 0}</TableCell>
                        <TableCell className="text-right font-mono">{job.stats_updated ?? 0}</TableCell>
                        <TableCell className="text-right font-mono">{job.stats_errors ?? 0}</TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/20 p-4">
                          {job.error_log ? (
                            <pre className="text-xs whitespace-pre-wrap max-h-48 overflow-auto rounded bg-background p-3 border">
                              {JSON.stringify(job.error_log, null, 2)}
                            </pre>
                          ) : (
                            <p className="text-sm text-muted-foreground">No errors — all steps completed successfully.</p>
                          )}
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
