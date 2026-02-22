import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Play, Pause, RefreshCw, Loader2, Database, Image,
  FileText, Layers, CheckCircle2, AlertCircle, Zap, Globe
} from "lucide-react";

interface EnrichStats {
  total_projects: number;
  enriched: number;
  remaining: number;
  total_images: number;
  total_documents: number;
}

interface BatchResult {
  processed: number;
  remaining: number;
  images_added: number;
  docs_added: number;
  fields_updated: number;
  errors: number;
  elapsed_ms: number;
  results: Array<{ name: string; status: string; images: number; docs: number; fields: number }>;
}

export const EnrichmentCenter = () => {
  const [stats, setStats] = useState<EnrichStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [batchCount, setBatchCount] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalImagesAdded, setTotalImagesAdded] = useState(0);
  const [totalDocsAdded, setTotalDocsAdded] = useState(0);
  const [totalFieldsUpdated, setTotalFieldsUpdated] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [currentBatchResults, setCurrentBatchResults] = useState<BatchResult | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const stopRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev.slice(-100), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const { data, error } = await supabase.functions.invoke("reelly-auto-enrich", {
        body: { action: "stats" },
      });
      if (error) throw error;
      setStats(data);
      addLog(`Stats: ${data.total_projects} total, ${data.enriched} enriched, ${data.remaining} remaining`);
    } catch (e: any) {
      toast.error("Failed to fetch stats: " + e.message);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Auto-fetch stats on mount
  useEffect(() => { fetchStats(); }, []);

  const runSingleBatch = async (): Promise<BatchResult | null> => {
    const { data, error } = await supabase.functions.invoke("reelly-auto-enrich", {
      body: { action: "run", batch_size: 10 },
    });
    if (error) throw error;
    return data as BatchResult;
  };

  const startAutoEnrich = async () => {
    stopRef.current = false;
    setIsRunning(true);
    setBatchCount(0);
    setTotalProcessed(0);
    setTotalImagesAdded(0);
    setTotalDocsAdded(0);
    setTotalFieldsUpdated(0);
    setTotalErrors(0);
    setLog([]);
    addLog("🚀 Auto-enrichment started. Running successive batches...");

    let batch = 0;
    let totalDone = 0;

    while (!stopRef.current) {
      batch++;
      addLog(`📦 Batch #${batch} starting...`);

      try {
        const result = await runSingleBatch();
        if (!result) {
          addLog("⚠️ Empty response from enrichment function");
          break;
        }

        totalDone += result.processed;
        setBatchCount(batch);
        setTotalProcessed(prev => prev + result.processed);
        setTotalImagesAdded(prev => prev + result.images_added);
        setTotalDocsAdded(prev => prev + result.docs_added);
        setTotalFieldsUpdated(prev => prev + result.fields_updated);
        setTotalErrors(prev => prev + result.errors);
        setCurrentBatchResults(result);

        // Log individual results
        for (const r of result.results) {
          const icon = r.status === "success" ? "✅" : r.status === "no_api_data" ? "⚠️" : "❌";
          addLog(`  ${icon} ${r.name}: +${r.images} imgs, +${r.docs} docs, +${r.fields} fields`);
        }

        addLog(`📦 Batch #${batch} done: ${result.processed} processed, ${result.remaining} remaining (${result.elapsed_ms}ms)`);

        if (result.remaining === 0 || result.processed === 0) {
          addLog("🎉 All projects fully enriched!");
          toast.success("All projects enriched successfully!");
          break;
        }

        // Brief pause between batches
        addLog("⏳ Waiting 3s before next batch...");
        await new Promise(r => setTimeout(r, 3000));

      } catch (err: any) {
        addLog(`❌ Batch #${batch} error: ${err.message}`);
        toast.error(`Batch ${batch} failed: ${err.message}`);
        // Wait and retry
        await new Promise(r => setTimeout(r, 5000));
      }
    }

    if (stopRef.current) {
      addLog("⏸️ Enrichment paused by user.");
    }

    setIsRunning(false);
    fetchStats();
  };

  const stopEnrich = () => {
    stopRef.current = true;
    addLog("🛑 Stop requested. Will finish current batch...");
  };

  const progress = stats ? Math.round(((stats.enriched) / Math.max(stats.total_projects, 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30 rounded-xl p-5">
        <h2 className="text-black font-bold text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-gold" />
          Project Enrichment Center
        </h2>
        <p className="text-zinc-600 text-sm mt-1">
          Automatically enrich all projects from the Reelly API — images, documents, floor plans, amenities, 
          payment plans, unit types, descriptions, and more. Add-only: never deletes existing data.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-white border border-gold/20">
          <CardContent className="p-4 text-center">
            <Database className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-xs text-zinc-500">Total Projects</p>
            <p className="text-2xl font-bold text-black">{stats?.total_projects?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gold/20">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xs text-zinc-500">Enriched</p>
            <p className="text-2xl font-bold text-emerald-600">{stats?.enriched?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gold/20">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xs text-zinc-500">Remaining</p>
            <p className="text-2xl font-bold text-amber-600">{stats?.remaining?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gold/20">
          <CardContent className="p-4 text-center">
            <Image className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-zinc-500">Total Images</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.total_images?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gold/20">
          <CardContent className="p-4 text-center">
            <FileText className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xs text-zinc-500">Total Docs</p>
            <p className="text-2xl font-bold text-purple-600">{stats?.total_documents?.toLocaleString() ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {stats && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600">Enrichment Progress</span>
            <span className="text-black font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      )}

      {/* Reelly Enrichment Controls */}
      <Card className="bg-white border-2 border-gold/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-black text-base flex items-center gap-2">
            <Globe className="w-5 h-5 text-gold" />
            Reelly API Auto-Enrichment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-600 text-sm">
            Runs successive batches automatically until all projects are enriched. Each batch processes ~10 projects 
            and extracts: gallery images, brochures, floor plans, amenities, unit types, payment plans, FAQs, 
            highlights, videos, location distances, service charges, and ROI estimates.
          </p>

          <div className="flex items-center gap-3">
            {!isRunning ? (
              <Button
                onClick={startAutoEnrich}
                className="bg-gold hover:bg-gold/90 text-black font-semibold"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Auto-Enrichment
              </Button>
            ) : (
              <Button
                onClick={stopEnrich}
                variant="destructive"
              >
                <Pause className="w-4 h-4 mr-2" />
                Stop After Current Batch
              </Button>
            )}
            <Button
              onClick={fetchStats}
              disabled={isLoadingStats}
              variant="outline"
              className="border-gold/30"
            >
              {isLoadingStats ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Refresh Stats
            </Button>
          </div>

          {/* Running Stats */}
          {(isRunning || batchCount > 0) && (
            <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                {isRunning && <Loader2 className="w-4 h-4 animate-spin text-gold" />}
                <span className="text-black font-semibold text-sm">
                  {isRunning ? "Running..." : "Completed"} — Batch #{batchCount}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                <div>
                  <p className="text-xs text-zinc-500">Processed</p>
                  <p className="text-lg font-bold text-black">{totalProcessed}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Images Added</p>
                  <p className="text-lg font-bold text-blue-600">+{totalImagesAdded}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Docs Added</p>
                  <p className="text-lg font-bold text-purple-600">+{totalDocsAdded}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Fields Updated</p>
                  <p className="text-lg font-bold text-emerald-600">+{totalFieldsUpdated}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Errors</p>
                  <p className={`text-lg font-bold ${totalErrors > 0 ? 'text-red-600' : 'text-zinc-400'}`}>{totalErrors}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Log */}
      {log.length > 0 && (
        <Card className="bg-zinc-950 border border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-300 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Live Enrichment Log
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
                }`}>
                  {line}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnrichmentCenter;
