import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  RefreshCw, Download, CheckCircle, XCircle, 
  ExternalLink, Info, Zap, Database, CloudDownload, Play, ArrowRight, MapPin,
  Trash2, AlertTriangle
} from "lucide-react";

interface ApiSyncResult {
  success: boolean;
  total_available?: number;
  total_fetched?: number;
  total_published?: number;
  page_fetched?: number;
  page_published?: number;
  inserted?: number;
  updated?: number;
  skipped?: number;
  auto_approved?: number; // NEW: Count of auto-approved projects
  errors?: string[];
  message?: string;
  error?: string;
  next_cursor?: string | null;
  done?: boolean;
}

type RecentPendingImport = {
  id: string;
  name: string;
  slug: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

interface DevSyncResult {
  success: boolean;
  mode?: string;
  total_available?: number;
  processed?: number;
  inserted?: number;
  updated?: number;
  skipped?: number;
  errors?: number;
  error_details?: string[];
  error?: string;
}

interface AreasSyncResult {
  success: boolean;
  action?: string;
  emirates_count?: number;
  emirates?: string[];
  areas_count?: number;
  total_available?: number;
  processed?: number;
  inserted?: number;
  updated?: number;
  skipped?: number;
  errors?: number;
  error_details?: string[];
  error?: string;
}

interface CleanupResult {
  success: boolean;
  mode?: string;
  deleted?: {
    non_reelly_areas?: number;
    non_reelly_queue_items?: number;
  };
  remaining?: {
    areas?: number;
    queue_items?: number;
  };
  message?: string;
  error?: string;
}

export function ReellyImportPanel() {
  const navigate = useNavigate();
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [syncResult, setSyncResult] = useState<ApiSyncResult | null>(null);
  const [totalProjects, setTotalProjects] = useState<number | null>(null);
  const [syncProgress, setSyncProgress] = useState<{ fetched: number; total: number } | null>(null);
  const [syncStartedAt, setSyncStartedAt] = useState<string | null>(null);
  const [recentImports, setRecentImports] = useState<RecentPendingImport[]>([]);
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [isRecentLoading, setIsRecentLoading] = useState(false);
  
  // Developer sync state
  const [isSyncingDevs, setIsSyncingDevs] = useState(false);
  const [devSyncResult, setDevSyncResult] = useState<DevSyncResult | null>(null);
  const [totalDevelopers, setTotalDevelopers] = useState<number | null>(null);

  // Areas sync state
  const [isSyncingAreas, setIsSyncingAreas] = useState(false);
  const [areasSyncResult, setAreasSyncResult] = useState<AreasSyncResult | null>(null);
  const [totalAreas, setTotalAreas] = useState<number | null>(null);
  const [emiratesList, setEmiratesList] = useState<string[]>([]);

  // Clean & Sync state
  const [isCleaningAndSyncing, setIsCleaningAndSyncing] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [cleanupStep, setCleanupStep] = useState<string | null>(null);

  const goToApprovalQueue = () => {
    // Navigate to Reelly-filtered queue
    navigate("/listing-admin?view=sync&syncTab=approvals&source=reelly", { replace: true });
    // Trigger a small delay then force refresh the URL params
    setTimeout(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, 50);
  };

  /**
   * Clean & Sync Fresh - Removes non-Reelly data and triggers full sync
   */
  const handleCleanAndSync = async () => {
    if (!confirm("⚠️ This will:\n\n1. Delete all non-Reelly areas (32 records)\n2. Delete all non-Reelly queue items (16 records)\n3. Run a full sync of 1,803 projects from Reelly API\n\nContinue?")) {
      return;
    }

    setIsCleaningAndSyncing(true);
    setCleanupResult(null);
    setCleanupStep("cleanup");

    try {
      // Step 1: Clean non-Reelly data
      const { data: wipeData, error: wipeError } = await supabase.functions.invoke("wipe-and-rebuild", {
        body: { confirm: true, mode: "reelly_only" },
      });

      if (wipeError) throw wipeError;
      if (!wipeData?.success) throw new Error(wipeData?.error || "Cleanup failed");

      setCleanupResult(wipeData);
      toast.success(`Cleaned ${wipeData.deleted?.non_reelly_areas || 0} areas, ${wipeData.deleted?.non_reelly_queue_items || 0} queue items`);

      // Step 2: Full Reelly project sync
      setCleanupStep("syncing");
      await handleSyncProjects(true);

      // Step 3: Extract areas from synced projects
      setCleanupStep("areas");
      await handleSyncAreas("extract_from_projects");

      setCleanupStep("done");
      toast.success("✅ Clean & Sync completed! All data now from Reelly API.");
    } catch (err: any) {
      console.error("Clean & Sync error:", err);
      toast.error(err.message || "Clean & Sync failed");
      setCleanupResult({ success: false, error: err.message });
    } finally {
      setIsCleaningAndSyncing(false);
    }
  };

  const handleSyncDevelopers = async (mode: "test" | "quick" | "full") => {
    setIsSyncingDevs(true);
    setDevSyncResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("reelly-developers-sync", {
        body: { mode },
      });

      if (error) throw error;

      if (data?.success) {
        setDevSyncResult(data);
        if (data.total_available) {
          setTotalDevelopers(data.total_available);
        }
        if (mode === "test") {
          toast.success(`Developer API connected! ${data.total_available} developers available`);
        } else {
          toast.success(`Synced ${data.inserted} new, ${data.updated} updated developers`);
        }
      } else {
        setDevSyncResult({ success: false, error: data?.error });
        toast.error(data?.error || "Developer sync failed");
      }
    } catch (err: any) {
      console.error("Developer sync error:", err);
      setDevSyncResult({ success: false, error: err.message });
      toast.error(err.message || "Failed to sync developers");
    } finally {
      setIsSyncingDevs(false);
    }
  };

  const handleSyncAreas = async (action: "extract_from_projects") => {
    setIsSyncingAreas(true);
    setAreasSyncResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("reelly-areas-sync", {
        body: { action },
      });

      if (error) throw error;

      if (data?.success) {
        setAreasSyncResult(data);
        if (data.unique_areas_found) {
          setTotalAreas(data.unique_areas_found);
        }
        toast.success(`Extracted ${data.inserted} new areas from projects`);
      } else {
        setAreasSyncResult({ success: false, error: data?.error });
        toast.error(data?.error || "Areas sync failed");
      }
    } catch (err: any) {
      console.error("Areas sync error:", err);
      setAreasSyncResult({ success: false, error: err.message });
      toast.error(err.message || "Failed to sync areas");
    } finally {
      setIsSyncingAreas(false);
    }
  };

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

  const handleSyncProjects = async (fullSync: boolean = false) => {
    setIsSyncing(true);
    setSyncResult(null);
    setSyncProgress(null);
    const startedAt = new Date().toISOString();
    setSyncStartedAt(startedAt);
    setRecentImports([]);

    try {
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

        if (!fullSync) break;

        safety++;
        if (safety > 200) {
          throw new Error("Sync aborted (too many pages). Please contact support.");
        }
      } while (cursor);

      toast.success(fullSync ? "Full sync completed!" : (aggregated.message || "Sync completed!"));

      setIsRecentLoading(true);
      const { data: recent, error: recentErr } = await supabase
        .from("pending_project_imports")
        .select("id, name, slug, status, created_at, updated_at")
        .ilike("source_url", "%reelly_%")
        .gte("updated_at", startedAt)
        .order("updated_at", { ascending: false })
        .limit(200);

      if (recentErr) {
        console.error("Failed to fetch recent pending imports:", recentErr);
      } else {
        setRecentImports((recent || []) as RecentPendingImport[]);
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      toast.error(err.message || "Failed to sync projects");
      setSyncResult({ success: false, error: err.message });
    } finally {
      setIsRecentLoading(false);
      setIsSyncing(false);
    }
  };

  const syncPercent =
    syncProgress && syncProgress.total > 0
      ? Math.min(100, Math.round((syncProgress.fetched / syncProgress.total) * 100))
      : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Reelly Integration</h2>
        <p className="text-zinc-600">
          Import projects from Reelly via API
        </p>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                    <button
                      type="button"
                      className="bg-zinc-100 rounded-lg p-3 text-center hover:shadow-sm transition"
                      onClick={() => setIsRecentOpen(true)}
                    >
                      <p className="text-xl font-bold text-zinc-900">{syncResult.total_available?.toLocaleString() || '-'}</p>
                      <p className="text-xs text-zinc-500">Total Available</p>
                    </button>
                    <button
                      type="button"
                      className="bg-blue-50 rounded-lg p-3 text-center hover:shadow-sm transition"
                      onClick={() => setIsRecentOpen(true)}
                    >
                      <p className="text-xl font-bold text-blue-600">{syncResult.total_fetched?.toLocaleString() || '-'}</p>
                      <p className="text-xs text-zinc-500">Fetched</p>
                    </button>
                    <button
                      type="button"
                      className="bg-emerald-50 rounded-lg p-3 text-center hover:shadow-sm transition"
                      onClick={() => setIsRecentOpen(true)}
                    >
                      <p className="text-xl font-bold text-emerald-600">{syncResult.inserted || 0}</p>
                      <p className="text-xs text-zinc-500">New</p>
                    </button>
                    <button
                      type="button"
                      className="bg-amber-50 rounded-lg p-3 text-center hover:shadow-sm transition"
                      onClick={() => setIsRecentOpen(true)}
                    >
                      <p className="text-xl font-bold text-amber-600">{syncResult.updated || 0}</p>
                      <p className="text-xs text-zinc-500">Updated</p>
                    </button>
                    <button
                      type="button"
                      className="bg-green-100 rounded-lg p-3 text-center hover:shadow-sm transition border-2 border-green-300"
                      onClick={() => setIsRecentOpen(true)}
                    >
                      <p className="text-xl font-bold text-green-700">{syncResult.auto_approved || 0}</p>
                      <p className="text-xs text-green-600 font-medium">Auto-Approved ✓</p>
                    </button>
                    <button
                      type="button"
                      className="bg-zinc-100 rounded-lg p-3 text-center hover:shadow-sm transition"
                      onClick={() => setIsRecentOpen(true)}
                    >
                      <p className="text-xl font-bold text-zinc-500">{syncResult.skipped || 0}</p>
                      <p className="text-xs text-zinc-500">Skipped</p>
                    </button>
                  </div>

                  {/* Auto-Approved Success Banner */}
                  {(syncResult.auto_approved || 0) > 0 && (
                    <div className="p-5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl text-white shadow-lg mb-4">
                      <div className="flex items-center gap-4">
                        <CheckCircle className="w-10 h-10 text-white" />
                        <div>
                          <h4 className="font-bold text-xl">
                            🚀 {syncResult.auto_approved} Projects Auto-Published!
                          </h4>
                          <p className="text-green-100 text-sm mt-1">
                            Complete projects were automatically pushed to your live website.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CTA to Approval Queue for remaining pending */}
                  {((syncResult.inserted || 0) + (syncResult.updated || 0) - (syncResult.auto_approved || 0)) > 0 && (
                    <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <h4 className="font-bold text-xl flex items-center gap-2">
                            📋 {(syncResult.inserted || 0) + (syncResult.updated || 0) - (syncResult.auto_approved || 0)} projects need review
                          </h4>
                          <p className="text-blue-100 text-sm mt-1">
                            Some projects need more data before going live (floor plans, brochures, etc.)
                          </p>
                        </div>
                        <button
                          onClick={goToApprovalQueue}
                          className="flex-shrink-0 bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition shadow-md text-lg flex items-center gap-2"
                        >
                          Open Approval Queue
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <Alert className="mt-4 border-emerald-300 bg-emerald-50">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-emerald-700">
                      {syncResult.message}
                    </AlertDescription>
                  </Alert>

                  {(syncResult.auto_approved || 0) === 0 && (
                    <Alert className="mt-3 border-amber-300 bg-amber-50">
                      <Info className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-900">No Auto-Approvals?</AlertTitle>
                      <AlertDescription className="text-amber-700">
                        Projects need a developer link, description, cover image, and price to be auto-approved.
                        Missing data items will appear in the approval queue for manual review.
                      </AlertDescription>
                    </Alert>
                  )}

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

          <Dialog open={isRecentOpen} onOpenChange={setIsRecentOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Reelly projects processed in this sync</DialogTitle>
              </DialogHeader>

              <div className="text-sm text-zinc-600">
                {isRecentLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading…
                  </div>
                ) : recentImports.length === 0 ? (
                  <div>
                    No items found for this run.
                    {syncStartedAt ? (
                      <div className="text-xs text-zinc-500 mt-1">Looking for updates since {new Date(syncStartedAt).toLocaleString()}</div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
                    {recentImports.map((p) => {
                      const isNew = syncStartedAt
                        ? new Date(p.created_at).getTime() >= new Date(syncStartedAt).getTime()
                        : false;
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-3 border rounded-lg p-2">
                          <div className="min-w-0">
                            <div className="font-medium text-zinc-900 truncate">{p.name}</div>
                            <div className="text-xs text-zinc-500 truncate">{p.slug}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant={isNew ? "default" : "secondary"}>{isNew ? "New" : "Updated"}</Badge>
                            <Badge variant="outline">{p.status || "pending"}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button variant="outline" onClick={() => setIsRecentOpen(false)}>
                    Close
                  </Button>
                  <button 
                    onClick={() => { setIsRecentOpen(false); goToApprovalQueue(); }}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition"
                  >
                    Open Approval Queue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Clean & Sync Fresh - Reelly Only */}
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-red-900 flex items-center gap-2">
                Clean & Sync Fresh
                {cleanupStep === "done" && <CheckCircle className="h-5 w-5 text-green-500" />}
              </CardTitle>
              <CardDescription className="text-red-700">
                Delete non-Reelly data and sync fresh from API
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-300 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Destructive Action</AlertTitle>
            <AlertDescription className="text-amber-700">
              This will permanently delete all manually-created areas and non-Reelly queue items,
              then sync all 1,803 projects fresh from the Reelly API.
            </AlertDescription>
          </Alert>

          <div className="bg-white/80 rounded-xl p-4 border border-red-200">
            <h3 className="font-semibold text-zinc-900 mb-3">What will happen:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-700">
              <li>Delete ~32 areas without <code className="bg-zinc-100 px-1 rounded">reelly_id</code></li>
              <li>Delete ~16 queue items not from Reelly (Provident-sourced)</li>
              <li>Run full sync of all 1,803 Reelly projects</li>
              <li>Extract and update areas from synced projects</li>
            </ol>
          </div>

          {isCleaningAndSyncing && cleanupStep && (
            <div className="bg-white/80 rounded-xl p-4 border border-red-200">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-red-600 animate-spin" />
                <span className="font-medium text-zinc-900">
                  {cleanupStep === "cleanup" && "Step 1/3: Cleaning non-Reelly data..."}
                  {cleanupStep === "syncing" && "Step 2/3: Syncing projects from Reelly API..."}
                  {cleanupStep === "areas" && "Step 3/3: Extracting areas from projects..."}
                  {cleanupStep === "done" && "✅ All done!"}
                </span>
              </div>
              {cleanupStep === "syncing" && syncProgress && (
                <div className="mt-3">
                  <Progress value={syncPercent} className="h-2" />
                  <p className="text-sm text-zinc-500 mt-2">
                    Fetched {syncProgress.fetched.toLocaleString()} / {syncProgress.total.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {cleanupResult && cleanupResult.success && (
            <div className="bg-white/80 rounded-xl p-4 border border-green-200">
              <h3 className="font-semibold text-zinc-900 mb-3">Cleanup Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-red-600">{cleanupResult.deleted?.non_reelly_areas || 0}</p>
                  <p className="text-xs text-red-500">Areas Deleted</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-red-600">{cleanupResult.deleted?.non_reelly_queue_items || 0}</p>
                  <p className="text-xs text-red-500">Queue Deleted</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-600">{cleanupResult.remaining?.areas || 0}</p>
                  <p className="text-xs text-green-500">Areas Remaining</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-600">{cleanupResult.remaining?.queue_items || 0}</p>
                  <p className="text-xs text-green-500">Queue Remaining</p>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleCleanAndSync} 
            disabled={isCleaningAndSyncing || isSyncing}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {isCleaningAndSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Clean & Sync Fresh (Reelly Only)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Developer Sync Section */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-purple-900 flex items-center gap-2">
                Developer Sync
                {totalDevelopers && <CheckCircle className="h-5 w-5 text-purple-500" />}
              </CardTitle>
              <CardDescription className="text-purple-700">
                Sync developer profiles from Reelly API
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button 
              onClick={() => handleSyncDevelopers("test")} 
              disabled={isSyncingDevs}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              {isSyncingDevs ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            <Button 
              onClick={() => handleSyncDevelopers("quick")} 
              disabled={isSyncingDevs}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Quick Sync (50)
            </Button>
            <Button 
              onClick={() => handleSyncDevelopers("full")} 
              disabled={isSyncingDevs}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Full Sync
            </Button>
          </div>

          {totalDevelopers && (
            <div className="p-3 bg-purple-100 rounded-lg">
              <p className="text-purple-800 text-sm font-medium">
                ✓ {totalDevelopers.toLocaleString()} developers available in Reelly API
              </p>
            </div>
          )}

          {devSyncResult && devSyncResult.success && devSyncResult.mode !== "test" && (
            <div className="bg-white/80 rounded-xl p-4 border border-purple-200">
              <h3 className="font-semibold text-zinc-900 mb-3">Developer Sync Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-purple-900">{devSyncResult.processed || 0}</p>
                  <p className="text-xs text-purple-600">Processed</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-700">{devSyncResult.inserted || 0}</p>
                  <p className="text-xs text-emerald-600">New</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-700">{devSyncResult.updated || 0}</p>
                  <p className="text-xs text-blue-600">Updated</p>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-zinc-700">{devSyncResult.skipped || 0}</p>
                  <p className="text-xs text-zinc-600">Skipped</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${devSyncResult.errors && devSyncResult.errors > 0 ? 'bg-red-50' : 'bg-zinc-50'}`}>
                  <p className={`text-xl font-bold ${devSyncResult.errors && devSyncResult.errors > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                    {devSyncResult.errors || 0}
                  </p>
                  <p className={`text-xs ${devSyncResult.errors && devSyncResult.errors > 0 ? 'text-red-500' : 'text-zinc-500'}`}>Errors</p>
                </div>
              </div>
              {devSyncResult.error_details && devSyncResult.error_details.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-600 mb-2">Error Details:</p>
                  <div className="max-h-32 overflow-y-auto bg-red-50 rounded-lg p-3 border border-red-200">
                    {devSyncResult.error_details.map((err, i) => (
                      <p key={i} className="text-xs text-red-700 py-0.5">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {devSyncResult && !devSyncResult.success && (
            <Alert className="border-red-300 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {devSyncResult.error || "Developer sync failed"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Areas & Emirates Sync Section */}
      <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-cyan-900 flex items-center gap-2">
                Areas & Emirates Sync
                {totalAreas && <CheckCircle className="h-5 w-5 text-cyan-500" />}
              </CardTitle>
              <CardDescription className="text-cyan-700">
                Sync areas from Reelly project data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-cyan-300 bg-cyan-50">
            <Info className="h-4 w-4 text-cyan-600" />
            <AlertDescription className="text-cyan-700">
              This extracts unique area names from synced Reelly projects and adds them to your areas database.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => handleSyncAreas("extract_from_projects")} 
            disabled={isSyncingAreas}
            className="w-full bg-cyan-600 hover:bg-cyan-700"
          >
            {isSyncingAreas ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Extracting Areas...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Extract Areas from Projects
              </>
            )}
          </Button>

          {totalAreas && (
            <div className="p-3 bg-cyan-100 rounded-lg">
              <p className="text-cyan-800 text-sm font-medium">
                ✓ {totalAreas.toLocaleString()} unique areas found in project data
              </p>
            </div>
          )}

          {areasSyncResult && areasSyncResult.success && areasSyncResult.action === "extract_from_projects" && (
            <div className="bg-white/80 rounded-xl p-4 border border-cyan-200">
              <h3 className="font-semibold text-zinc-900 mb-3">Areas Extraction Results</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-cyan-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-cyan-900">{areasSyncResult.total_available || 0}</p>
                  <p className="text-xs text-cyan-600">Found</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-700">{areasSyncResult.inserted || 0}</p>
                  <p className="text-xs text-emerald-600">New</p>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-zinc-700">{areasSyncResult.skipped || 0}</p>
                  <p className="text-xs text-zinc-600">Already Exist</p>
                </div>
              </div>
              {areasSyncResult.errors && areasSyncResult.errors > 0 && (
                <p className="text-sm text-red-600 mt-2">⚠ {areasSyncResult.errors} errors occurred</p>
              )}
            </div>
          )}

          {areasSyncResult && !areasSyncResult.success && (
            <Alert className="border-red-300 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {areasSyncResult.error || "Areas sync failed"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

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

      <Alert className="border-zinc-300 bg-zinc-50">
        <Info className="h-4 w-4 text-zinc-500" />
        <AlertTitle className="text-zinc-600">Web Scraping (Deprecated)</AlertTitle>
        <AlertDescription className="text-zinc-500">
          The scraping approach no longer works since Reelly moved to a new platform.
          Use the official API above for reliable data access.
        </AlertDescription>
      </Alert>

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
