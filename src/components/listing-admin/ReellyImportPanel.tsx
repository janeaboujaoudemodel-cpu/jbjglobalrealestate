import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  RefreshCw, Download, CheckCircle, XCircle, AlertCircle, 
  ExternalLink, Info, Zap, Database, CloudDownload, Play
} from "lucide-react";
import { Link } from "react-router-dom";

interface ApiSyncResult {
  success: boolean;
  total_available?: number;
  // Aggregated totals (computed client-side during full sync)
  total_fetched?: number;
  total_published?: number;
  // Per-page values returned by backend
  page_fetched?: number;
  page_published?: number;
  inserted?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
  message?: string;
  error?: string;
  next_cursor?: string | null;
  done?: boolean;
}

export function ReellyImportPanel() {
  // API Sync State
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [syncResult, setSyncResult] = useState<ApiSyncResult | null>(null);
  const [totalProjects, setTotalProjects] = useState<number | null>(null);
  const [syncProgress, setSyncProgress] = useState<{ fetched: number; total: number } | null>(null);

  // Test API Connection
  const handleTestApiConnection = async () => {
    setIsTestingApi(true);
    setApiConnected(null);

    try {
      const { data, error } = await supabase.functions.invoke("reelly-api-sync", {
        body: { action: "test" },
      });

      if (error) throw error;

      if (data?.success) {
        setApiConnected(true);
        setTotalProjects(data.total_available || null);
        toast.success(`API connected! ${data.total_available} projects available`);
      } else {
        setApiConnected(false);
        toast.error(data?.error || "API connection failed");
      }
    } catch (err: any) {
      console.error("API test error:", err);
      setApiConnected(false);
      toast.error(err.message || "Failed to test API connection");
    } finally {
      setIsTestingApi(false);
    }
  };

  // Sync projects from API
  const handleSyncProjects = async (fullSync: boolean = false) => {
    setIsSyncing(true);
    setSyncResult(null);
    setSyncProgress(null);

    try {
      // IMPORTANT: Full sync can take several minutes; do it in small pages to avoid browser timeouts.
      const pageSize = fullSync ? 50 : 100;
      let cursor: string | null = null;
      let safety = 0;

      let aggregated: ApiSyncResult = {
        success: true,
        total_available: totalProjects ?? undefined,
        total_fetched: 0,
        total_published: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: [],
      };

      do {
        const { data, error } = await supabase.functions.invoke("reelly-api-sync", {
          body: {
            action: "sync",
            limit: pageSize,
            cursor,
            // legacy flag (ignored server-side but harmless)
            fullSync,
          },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Sync failed");

        aggregated = {
          ...aggregated,
          total_available: data.total_available ?? aggregated.total_available,
          total_fetched: (aggregated.total_fetched || 0) + (data.page_fetched || 0),
          total_published: (aggregated.total_published || 0) + (data.page_published || 0),
          inserted: (aggregated.inserted || 0) + (data.inserted || 0),
          updated: (aggregated.updated || 0) + (data.updated || 0),
          skipped: (aggregated.skipped || 0) + (data.skipped || 0),
          errors: [...(aggregated.errors || []), ...(data.errors || [])].slice(0, 10),
          message: data.message,
          next_cursor: data.next_cursor,
          done: data.done,
        };

        setSyncResult(aggregated);

        if (aggregated.total_available && aggregated.total_fetched != null) {
          setSyncProgress({ fetched: aggregated.total_fetched, total: aggregated.total_available });
        }

        cursor = data.next_cursor ?? null;

        // Quick sync = one page only
        if (!fullSync) break;

        safety++;
        if (safety > 200) {
          throw new Error("Sync aborted (too many pages). Please contact support.");
        }
      } while (cursor);

      toast.success(fullSync ? "Full sync completed!" : (aggregated.message || "Sync completed!"));
    } catch (err: any) {
      console.error("Sync error:", err);
      toast.error(err.message || "Failed to sync projects");
      setSyncResult({ success: false, error: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const syncPercent =
    syncProgress && syncProgress.total > 0
      ? Math.min(100, Math.round((syncProgress.fetched / syncProgress.total) * 100))
      : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Reelly Integration</h2>
        <p className="text-zinc-600">
          Import projects from Reelly via API or web scraping
        </p>
      </div>

      {/* ===== API SYNC SECTION (NEW) ===== */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-emerald-900 flex items-center gap-2">
                Reelly API Sync
                {apiConnected === true && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                {apiConnected === false && <XCircle className="h-5 w-5 text-red-500" />}
              </CardTitle>
              <CardDescription className="text-emerald-700">
                Direct API integration — fast, reliable, complete data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Test Connection */}
            <div className="bg-white/80 rounded-xl p-4 border border-emerald-200">
              <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                Step 1: Test Connection
              </h3>
              <Button 
                onClick={handleTestApiConnection} 
                disabled={isTestingApi}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {isTestingApi ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Test API Connection
                  </>
                )}
              </Button>
              {apiConnected === true && totalProjects && (
                <div className="mt-3 p-3 bg-emerald-100 rounded-lg">
                  <p className="text-emerald-800 text-sm font-medium">
                    ✓ Connected to Reelly API
                  </p>
                  <p className="text-emerald-700 text-2xl font-bold">
                    {totalProjects.toLocaleString()} projects available
                  </p>
                </div>
              )}
            </div>

            {/* Sync Projects */}
            <div className="bg-white/80 rounded-xl p-4 border border-emerald-200">
              <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                <CloudDownload className="w-4 h-4 text-emerald-600" />
                Step 2: Sync Projects
              </h3>
              <div className="space-y-2">
                <Button 
                  onClick={() => handleSyncProjects(false)} 
                  disabled={isSyncing || apiConnected !== true}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Quick Sync (100 projects)
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => handleSyncProjects(true)} 
                  disabled={isSyncing || apiConnected !== true}
                  variant="outline"
                  className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Full Sync (All Projects)
                </Button>
              </div>
            </div>
          </div>

          {/* Sync Results */}
          {isSyncing && (
            <div className="bg-white/80 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-3 mb-3">
                <RefreshCw className="h-5 w-5 text-emerald-600 animate-spin" />
                <span className="font-medium text-zinc-900">Syncing projects from Reelly API...</span>
              </div>
              <Progress value={syncPercent} className="h-2" />
              {syncProgress ? (
                <p className="text-sm text-zinc-500 mt-2">
                  Fetched {syncProgress.fetched.toLocaleString()} / {syncProgress.total.toLocaleString()} ({syncPercent}%)
                </p>
              ) : (
                <p className="text-sm text-zinc-500 mt-2">Starting sync…</p>
              )}
            </div>
          )}

          {syncResult && (
            <div className="bg-white/80 rounded-xl p-4 border border-emerald-200">
              <h3 className="font-semibold text-zinc-900 mb-3">Sync Results</h3>
              
              {syncResult.success ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <div className="bg-zinc-100 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-zinc-900">{syncResult.total_available?.toLocaleString() || '-'}</p>
                      <p className="text-xs text-zinc-500">Total Available</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-blue-600">{syncResult.total_fetched?.toLocaleString() || '-'}</p>
                      <p className="text-xs text-zinc-500">Fetched</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-emerald-600">{syncResult.inserted || 0}</p>
                      <p className="text-xs text-zinc-500">New</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-amber-600">{syncResult.updated || 0}</p>
                      <p className="text-xs text-zinc-500">Updated</p>
                    </div>
                    <div className="bg-zinc-100 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-zinc-500">{syncResult.skipped || 0}</p>
                      <p className="text-xs text-zinc-500">Skipped</p>
                    </div>
                  </div>
                  
                  <Alert className="border-emerald-300 bg-emerald-50">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-emerald-700">
                      {syncResult.message}
                    </AlertDescription>
                  </Alert>

                  {syncResult.errors && syncResult.errors.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-amber-600 mb-2">
                        {syncResult.errors.length} errors (showing first 10):
                      </p>
                      <div className="max-h-32 overflow-y-auto bg-amber-50 rounded-lg p-3 border border-amber-200">
                        {syncResult.errors.slice(0, 10).map((err, i) => (
                          <p key={i} className="text-xs text-amber-700 truncate">{err}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Alert className="border-red-300 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {syncResult.error || "Sync failed"}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Quick Link to Approval Queue */}
          {syncResult?.success && (syncResult.inserted || 0) > 0 && (
            <Alert className="border-blue-300 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Projects Ready for Review</AlertTitle>
              <AlertDescription className="text-blue-700">
                {syncResult.inserted} new projects have been added to the pending imports queue.
                <Link 
                  to="/listing-admin" 
                  onClick={() => {
                    // This will navigate to sync tab which has approval queue
                  }}
                  className="ml-2 font-semibold underline hover:no-underline"
                >
                  Go to Approval Queue →
                </Link>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-300" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-zinc-100 px-4 text-sm text-zinc-500">
            Legacy Methods (Deprecated)
          </span>
        </div>
      </div>

      {/* ===== LEGACY SCRAPING SECTION ===== */}
      <Alert className="border-zinc-300 bg-zinc-50">
        <Info className="h-4 w-4 text-zinc-500" />
        <AlertTitle className="text-zinc-600">Web Scraping (Deprecated)</AlertTitle>
        <AlertDescription className="text-zinc-500">
          The scraping approach no longer works since Reelly moved to a new platform.
          Use the official API above for reliable data access.
        </AlertDescription>
      </Alert>

      {/* Legacy Get API Key Card */}
      <Card className="bg-white border-zinc-200 opacity-60">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-500">Need a Reelly API Key?</CardTitle>
          <CardDescription>Get a free API key for testing (20 projects)</CardDescription>
        </CardHeader>
        <CardContent>
          <a 
            href="https://jtoq1zj8zqz.typeform.com/to/ztWlQc0l?plan=free" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-zinc-600 text-white px-4 py-2 rounded-md font-medium hover:bg-zinc-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Request Free API Key
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
