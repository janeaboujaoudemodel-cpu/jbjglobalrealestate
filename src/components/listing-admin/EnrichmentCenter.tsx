import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Play, Pause, RefreshCw, Loader2, Database, Image,
  FileText, Layers, CheckCircle2, AlertCircle, Zap, Globe, CloudOff
} from "lucide-react";

interface EnrichStats {
  total_projects: number;
  enriched: number;
  remaining: number;
  total_images: number;
  total_documents: number;
}

interface EnrichmentJob {
  id: string;
  status: string;
  total_projects: number;
  processed: number;
  images_added: number;
  docs_added: number;
  fields_updated: number;
  errors: number;
  stop_requested: boolean;
  started_at: string;
  completed_at: string | null;
  log: Array<{ time: string; msg: string }>;
}

// ========== REELLY ENRICHMENT PANEL (BACKGROUND MODE) ==========
const ReellyEnrichmentPanel = () => {
  const [stats, setStats] = useState<EnrichStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [job, setJob] = useState<EnrichmentJob | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const { data, error } = await supabase.functions.invoke("reelly-auto-enrich", {
        body: { action: "stats" },
      });
      if (error) throw error;
      setStats({
        total_projects: data.total_projects,
        enriched: data.enriched_with_raw_data ?? data.enriched ?? 0,
        remaining: data.remaining,
        total_images: data.total_images,
        total_documents: data.total_documents,
      });
    } catch (e: any) {
      toast.error("Failed to fetch stats: " + e.message);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const pollStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("background-enrichment-runner", {
        body: { action: "status" },
      });
      if (error) throw error;
      setIsActive(data.active);
      if (data.job) setJob(data.job);
      if (!data.active && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        fetchStats(); // Refresh stats when done
      }
    } catch {
      // Non-fatal
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(pollStatus, 5000);
    pollStatus();
  }, [pollStatus]);

  useEffect(() => {
    fetchStats();
    // Check if there's already an active job
    pollStatus().then(() => {
      // If active, start polling
    });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Auto-start polling if job is active
  useEffect(() => {
    if (isActive && !pollRef.current) {
      startPolling();
    }
  }, [isActive, startPolling]);

  const startBackgroundEnrich = async () => {
    setIsStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke("background-enrichment-runner", {
        body: { action: "start" },
      });
      if (error) throw error;

      if (data.already_running) {
        toast.info("Enrichment already running in background");
      } else {
        toast.success("Background enrichment started! Safe to navigate away.");
      }
      startPolling();
    } catch (e: any) {
      toast.error("Failed to start: " + e.message);
    } finally {
      setIsStarting(false);
    }
  };

  const stopEnrichment = async () => {
    try {
      await supabase.functions.invoke("background-enrichment-runner", {
        body: { action: "stop" },
      });
      toast.info("Stop requested — will finish current project");
    } catch {
      // Non-fatal
    }
  };

  const progress = job?.total_projects
    ? Math.round((job.processed / Math.max(job.total_projects, 1)) * 100)
    : stats
      ? Math.round((stats.enriched / Math.max(stats.total_projects, 1)) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Background mode banner */}
      {isActive && (
        <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          <div className="flex-1">
            <p className="text-foreground font-semibold text-sm">Enrichment running in background</p>
            <p className="text-muted-foreground text-xs">Safe to navigate away — processing continues on the server.</p>
          </div>
          <Button onClick={stopEnrichment} variant="destructive" size="sm">
            <Pause className="w-3 h-3 mr-1" /> Stop
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-card border border-gold/20">
          <CardContent className="p-4 text-center">
            <Database className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Total Projects</p>
            <p className="text-2xl font-bold text-foreground">{stats?.total_projects?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-gold/20">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Enriched</p>
            <p className="text-2xl font-bold text-emerald-600">{stats?.enriched?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-gold/20">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-2xl font-bold text-amber-600">{stats?.remaining?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-gold/20">
          <CardContent className="p-4 text-center">
            <Image className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Total Images</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.total_images?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-gold/20">
          <CardContent className="p-4 text-center">
            <FileText className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Total Docs</p>
            <p className="text-2xl font-bold text-purple-600">{stats?.total_documents?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {job && isActive ? `Processing: ${job.processed}/${job.total_projects}` : "Enrichment Progress"}
          </span>
          <span className="text-foreground font-semibold">{progress}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isActive ? (
          <Button
            onClick={startBackgroundEnrich}
            disabled={isStarting}
            className="bg-gold hover:bg-gold/90 text-foreground font-semibold"
          >
            {isStarting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Start Background Enrichment
          </Button>
        ) : (
          <Button onClick={stopEnrichment} variant="destructive">
            <Pause className="w-4 h-4 mr-2" /> Stop After Current
          </Button>
        )}
        <Button onClick={fetchStats} disabled={isLoadingStats} variant="outline" className="border-gold/30">
          {isLoadingStats ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh Stats
        </Button>
      </div>

      {/* Job progress stats */}
      {job && (job.status === "running" || job.status === "completed" || job.status === "stopped") && (
        <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            {isActive && <Loader2 className="w-4 h-4 animate-spin text-gold" />}
            {job.status === "completed" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {job.status === "stopped" && <CloudOff className="w-4 h-4 text-amber-600" />}
            <span className="text-foreground font-semibold text-sm">
              {job.status === "running" ? "Processing..." : job.status === "completed" ? "Completed" : "Stopped"}
              {" "}— {job.processed}/{job.total_projects} projects
            </span>
            <Badge variant={job.status === "completed" ? "default" : "secondary"} className="ml-auto text-xs">
              {job.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div><p className="text-xs text-muted-foreground">Processed</p><p className="text-lg font-bold text-foreground">{job.processed}</p></div>
            <div><p className="text-xs text-muted-foreground">Images Added</p><p className="text-lg font-bold text-blue-600">+{job.images_added}</p></div>
            <div><p className="text-xs text-muted-foreground">Docs Added</p><p className="text-lg font-bold text-purple-600">+{job.docs_added}</p></div>
            <div><p className="text-xs text-muted-foreground">Fields Updated</p><p className="text-lg font-bold text-emerald-600">+{job.fields_updated}</p></div>
            <div><p className="text-xs text-muted-foreground">Errors</p><p className={`text-lg font-bold ${job.errors > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>{job.errors}</p></div>
          </div>
        </div>
      )}

      {/* Live log */}
      {job?.log && job.log.length > 0 && (
        <Card className="bg-zinc-950 border border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-300 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Live Enrichment Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-72 overflow-y-auto p-4 font-mono text-xs space-y-0.5">
              {job.log.map((entry, i) => (
                <div key={i} className={`${
                  entry.msg.includes("❌") ? "text-red-400" :
                  entry.msg.includes("✅") ? "text-emerald-400" :
                  entry.msg.includes("🎉") ? "text-yellow-300" :
                  entry.msg.includes("⚠️") ? "text-amber-400" :
                  "text-zinc-400"
                }`}>
                  <span className="text-zinc-600">[{new Date(entry.time).toLocaleTimeString()}]</span> {entry.msg}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ========== PROVIDENT ENRICHMENT PANEL ==========
const ProvidentEnrichmentPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [batchCount, setBatchCount] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalMatched, setTotalMatched] = useState(0);
  const [totalImagesAdded, setTotalImagesAdded] = useState(0);
  const [totalDocsAdded, setTotalDocsAdded] = useState(0);
  const [totalFieldsUpdated, setTotalFieldsUpdated] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [gapStats, setGapStats] = useState<{ total: number; gaps: number } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const stopRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev.slice(-100), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const fetchGapStats = async () => {
    setIsLoadingStats(true);
    try {
      const { count: total } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");

      const { count: gaps } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .or("amenities.is.null,payment_plan.is.null,payment_breakdown.is.null,faqs.is.null,location_distances.is.null");

      setGapStats({ total: total ?? 0, gaps: gaps ?? 0 });
    } catch {
      // Non-fatal
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => { fetchGapStats(); }, []);

  const startProvidentEnrich = async () => {
    stopRef.current = false;
    setIsRunning(true);
    setBatchCount(0);
    setTotalProcessed(0);
    setTotalMatched(0);
    setTotalImagesAdded(0);
    setTotalDocsAdded(0);
    setTotalFieldsUpdated(0);
    setLog([]);
    addLog("🚀 Provident enrichment started...");

    let batch = 0;
    let offset = 0;

    while (!stopRef.current) {
      batch++;
      addLog(`📦 Batch #${batch} starting (offset ${offset})...`);

      try {
        const { data, error } = await supabase.functions.invoke("provident-enrich-projects", {
          body: { batch_size: 10, offset },
        });

        if (error) throw error;
        if (!data?.results || data.results.length === 0) {
          addLog("🎉 No more projects to enrich!");
          break;
        }

        const matched = data.results.filter((r: any) => r.slug_matched).length;
        const imgs = data.summary?.images_added ?? 0;
        const docs = data.summary?.documents_added ?? 0;
        const fields = data.summary?.fields_updated ?? 0;

        setBatchCount(batch);
        setTotalProcessed(prev => prev + data.results.length);
        setTotalMatched(prev => prev + matched);
        setTotalImagesAdded(prev => prev + imgs);
        setTotalDocsAdded(prev => prev + docs);
        setTotalFieldsUpdated(prev => prev + fields);

        for (const r of data.results) {
          const icon = r.slug_matched ? "✅" : "⚠️";
          addLog(`  ${icon} ${r.project_name}: ${r.slug_matched || "no match"} (+${r.images_added} imgs, +${r.documents_added} docs, ${r.fields_updated.join(",")})`);
        }

        addLog(`📦 Batch #${batch} done: ${data.results.length} processed, ${matched} matched`);
        offset += data.results.length;

        addLog("⏳ Waiting 3s...");
        await new Promise(r => setTimeout(r, 3000));
      } catch (err: any) {
        addLog(`❌ Batch #${batch} error: ${err.message}`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }

    if (stopRef.current) addLog("⏸️ Paused by user.");
    setIsRunning(false);
    fetchGapStats();
  };

  const gapProgress = gapStats ? Math.round(((gapStats.total - gapStats.gaps) / Math.max(gapStats.total, 1)) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="bg-card border border-gold/20">
          <CardContent className="p-4 text-center">
            <Database className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Published Projects</p>
            <p className="text-2xl font-bold text-foreground">{gapStats?.total?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-gold/20">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Missing Data</p>
            <p className="text-2xl font-bold text-amber-600">{gapStats?.gaps?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-gold/20">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Complete</p>
            <p className="text-2xl font-bold text-emerald-600">{gapStats ? (gapStats.total - gapStats.gaps).toLocaleString() : "—"}</p>
          </CardContent>
        </Card>
      </div>

      {gapStats && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Data Completeness</span>
            <span className="text-foreground font-semibold">{gapProgress}%</span>
          </div>
          <Progress value={gapProgress} className="h-3" />
        </div>
      )}

      <p className="text-muted-foreground text-sm">
        Enriches published projects by finding matching Provident pages and filling gaps: amenities, payment plans,
        FAQs, USPs, floor plans, location distances, images, and documents.
      </p>

      <div className="flex items-center gap-3">
        {!isRunning ? (
          <Button onClick={startProvidentEnrich} className="bg-gold hover:bg-gold/90 text-foreground font-semibold">
            <Play className="w-4 h-4 mr-2" />
            Start Provident Enrichment
          </Button>
        ) : (
          <Button onClick={() => { stopRef.current = true; }} variant="destructive">
            <Pause className="w-4 h-4 mr-2" />
            Stop
          </Button>
        )}
        <Button onClick={fetchGapStats} disabled={isLoadingStats} variant="outline" className="border-gold/30">
          {isLoadingStats ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {(isRunning || batchCount > 0) && (
        <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            {isRunning && <Loader2 className="w-4 h-4 animate-spin text-gold" />}
            <span className="text-foreground font-semibold text-sm">
              {isRunning ? "Running..." : "Completed"} — Batch #{batchCount}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div><p className="text-xs text-muted-foreground">Processed</p><p className="text-lg font-bold text-foreground">{totalProcessed}</p></div>
            <div><p className="text-xs text-muted-foreground">Matched</p><p className="text-lg font-bold text-emerald-600">{totalMatched}</p></div>
            <div><p className="text-xs text-muted-foreground">Images</p><p className="text-lg font-bold text-blue-600">+{totalImagesAdded}</p></div>
            <div><p className="text-xs text-muted-foreground">Docs</p><p className="text-lg font-bold text-purple-600">+{totalDocsAdded}</p></div>
            <div><p className="text-xs text-muted-foreground">Fields</p><p className="text-lg font-bold text-emerald-600">+{totalFieldsUpdated}</p></div>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <Card className="bg-zinc-950 border border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-300 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Provident Enrichment Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-72 overflow-y-auto p-4 font-mono text-xs space-y-0.5">
              {log.map((line, i) => (
                <div key={i} className={`${
                  line.includes("❌") ? "text-red-400" :
                  line.includes("✅") ? "text-emerald-400" :
                  line.includes("🎉") ? "text-yellow-300" :
                  line.includes("⚠️") ? "text-amber-400" :
                  line.includes("📦") ? "text-blue-400" :
                  "text-zinc-400"
                }`}>{line}</div>
              ))}
              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ========== MAIN ENRICHMENT CENTER ==========
export const EnrichmentCenter = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30 rounded-xl p-5">
        <h2 className="text-foreground font-bold text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-gold" />
          Project Enrichment Center
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Automatically enrich all projects from multiple sources — images, documents, floor plans, amenities,
          payment plans, unit types, descriptions, and more. Runs in background — safe to navigate away.
        </p>
      </div>

      <Tabs defaultValue="reelly" className="space-y-4">
        <TabsList className="bg-gradient-to-r from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30 p-1">
          <TabsTrigger
            value="reelly"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:border-gold/40 data-[state=active]:text-foreground"
          >
            <Globe className="w-4 h-4 mr-2" />
            Reelly API Enrichment
          </TabsTrigger>
          <TabsTrigger
            value="provident"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:border-gold/40 data-[state=active]:text-foreground"
          >
            <Database className="w-4 h-4 mr-2" />
            Provident Website Enrichment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reelly" className="mt-0">
          <Card className="bg-card border-2 border-gold/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <Globe className="w-5 h-5 text-gold" />
                Reelly API Auto-Enrichment (Background)
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Runs entirely on the server — processes all projects even if you close this page.
                You'll receive notifications every 50 projects and when complete.
              </p>
            </CardHeader>
            <CardContent>
              <ReellyEnrichmentPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provident" className="mt-0">
          <Card className="bg-card border-2 border-gold/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-gold" />
                Provident Website Enrichment
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Synchronizes published projects with Provident's page-data API to fill gaps in amenities, payment plans,
                FAQs, USPs, floor plans, location distances, images, and documents.
              </p>
            </CardHeader>
            <CardContent>
              <ProvidentEnrichmentPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnrichmentCenter;
