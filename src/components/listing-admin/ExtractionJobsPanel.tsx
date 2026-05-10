import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Play, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface DataSource {
  id: string;
  name: string;
  source_type: string;
  base_url: string;
  is_active: boolean;
  extraction_schedule: string;
  last_extraction_at: string | null;
}

interface JobLog {
  id: string;
  source_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  records_found: number;
  records_matched: number;
  records_pending: number;
  error_message: string | null;
}

export function ExtractionJobsPanel() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningSource, setRunningSource] = useState<string | null>(null);
  const [reellyDisabled, setReellyDisabled] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sourcesRes, jobsRes, settingRes] = await Promise.all([
        supabase
          .from("external_data_sources")
          .select("*")
          .order("name"),
        supabase
          .from("extraction_job_logs")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(10),
        supabase
          .from("app_settings")
          .select("value")
          .eq("key", "reelly_sync_enabled")
          .maybeSingle(),
      ]);

      if (sourcesRes.error) throw sourcesRes.error;
      if (jobsRes.error) throw jobsRes.error;

      setSources(sourcesRes.data || []);
      setRecentJobs(jobsRes.data || []);
      setReellyDisabled(settingRes.data?.value === "false");
    } catch (error) {
      console.error("Error fetching extraction data:", error);
      toast({
        title: "Error",
        description: "Failed to load extraction data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runExtraction = async (sourceId: string) => {
    setRunningSource(sourceId);
    try {
      const { data, error } = await supabase.functions.invoke("scheduled-extraction", {
        body: { sourceId, manual: true },
      });

      if (error) throw error;

      toast({
        title: "Extraction Started",
        description: data.message || "The extraction job has been triggered",
      });

      // Refresh after a short delay
      setTimeout(fetchData, 2000);
    } catch (error) {
      console.error("Error running extraction:", error);
      toast({
        title: "Extraction Failed",
        description: "Failed to start extraction job",
        variant: "destructive",
      });
    } finally {
      setRunningSource(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "running":
        return <Badge className="bg-blue-500">Running</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const parseSchedule = (cron: string) => {
    // Simple cron parser for display
    if (cron === "0 6 * * *") return "Daily at 6:00 AM";
    if (cron === "0 7 * * *") return "Daily at 7:00 AM";
    if (cron === "0 */4 * * *") return "Every 4 hours";
    return cron;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Sources & Extraction Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Sources */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-foreground">Data Sources</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchData} className="border-[#B89555]/30 hover:bg-[#EFE6D6]/10">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No data sources configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{source.name.replace(/external\s*/i, "").replace(/source\s*a/i, "Reelly API").replace(/source\s*b/i, "Provident") || source.name}</span>
                      <Badge variant={source.is_active ? "default" : "secondary"}>
                        {source.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {reellyDisabled && source.name.toLowerCase().includes("reelly") && (
                        <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                          Disabled by admin
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span>{parseSchedule(source.extraction_schedule)}</span>
                      {source.last_extraction_at && (
                        <span className="ml-3">
                          Last run: {formatDistanceToNow(new Date(source.last_extraction_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runExtraction(source.id)}
                    disabled={runningSource === source.id || !source.is_active}
                  >
                    {runningSource === source.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    <span className="ml-2">Run Now</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Recent Extraction Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No extraction jobs yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {recentJobs.map((job) => {
                  const source = sources.find(s => s.id === job.source_id);
                  return (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="font-medium">{source?.name || "Unknown Source"}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(job.started_at), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {job.status === "completed" && (
                          <div className="text-xs text-muted-foreground text-right">
                            <p>Found: {job.records_found}</p>
                            <p>Matched: {job.records_matched}</p>
                            <p>Pending: {job.records_pending}</p>
                          </div>
                        )}
                        {getStatusBadge(job.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
