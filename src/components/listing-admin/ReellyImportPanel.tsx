import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSyncJobs } from "@/hooks/useSyncJobs";
import { 
  RefreshCw, Download, CheckCircle, XCircle, 
  ExternalLink, Info, Zap, Database, CloudDownload, Play, ArrowRight, MapPin,
  Trash2, AlertTriangle, RotateCcw, Shield, Pause, Clock, AlertCircle
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
  
  // Use persistent sync jobs hook
  const { 
    activeJob, 
    recentJobs, 
    liveCounts, 
    createJob, 
    updateJobProgress, 
    completeJob, 
    cancelJob,
    setApiTotal,
    refreshCounts 
  } = useSyncJobs();
  
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [syncResult, setSyncResult] = useState<ApiSyncResult | null>(null);
  const [totalProjects, setTotalProjects] = useState<number | null>(null);
  const [syncProgress, setSyncProgress] = useState<{ fetched: number; total: number } | null>(null);
  const [syncStartTime, setSyncStartTime] = useState<number | null>(null);
  const [syncStartedAt, setSyncStartedAt] = useState<string | null>(null);
  const [recentImports, setRecentImports] = useState<RecentPendingImport[]>([]);
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [isRecentLoading, setIsRecentLoading] = useState(false);
  
  // Sync reconciliation state - STRICT ACCOUNTING
  const [syncReconciliation, setSyncReconciliation] = useState<{
    requested: number;
    fetched: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: string[];
    isReconciled: boolean;
  } | null>(null);
  
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
  
  // Destructive action confirmation dialog
  const [showDestructiveDialog, setShowDestructiveDialog] = useState(false);
  const [destructiveConfirmed, setDestructiveConfirmed] = useState(false);

  // Data Integrity / Restore state
  const [isLoadingIntegrityStats, setIsLoadingIntegrityStats] = useState(false);
  const [integrityStats, setIntegrityStats] = useState<{
    projects_from_reelly: number;
    projects_with_provident_enrichments: number;
    provident_images: number;
    provident_documents: number;
    pending_provident_suggestions: number;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{
    success: boolean;
    restored?: { projects: number; images_deleted: number; documents_deleted: number; pending_deleted: number };
    error?: string;
  } | null>(null);
  
  // Sync live counts on mount and after sync
  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);
  
  // Use live API total if available, otherwise use queue count
  const displayTotalProjects = totalProjects ?? liveCounts?.reelly_total_api ?? liveCounts?.reelly_pending_queue ?? null;

  /**
   * Fetch data integrity stats from restore-to-reelly edge function
   */
  const handleLoadIntegrityStats = async () => {
    setIsLoadingIntegrityStats(true);
    try {
      const { data, error } = await supabase.functions.invoke("restore-to-reelly", {
        body: { mode: "stats" },
      });

      if (error) throw error;

      if (data?.success) {
        setIntegrityStats(data.stats);
      } else {
        toast.error(data?.error || "Failed to load integrity stats");
      }
    } catch (err: any) {
      console.error("Integrity stats error:", err);
      toast.error(err.message || "Failed to load integrity stats");
    } finally {
      setIsLoadingIntegrityStats(false);
    }
  };

  /**
   * Restore all projects to Reelly-only state
   */
  const handleGlobalRestore = async () => {
    // First, preview what will be affected
    const { data: preview } = await supabase.functions.invoke("restore-to-reelly", {
      body: { mode: "global", confirm: false },
    });

    if (!preview?.preview) {
      toast.error("Failed to preview restore operation");
      return;
    }

    const confirmMsg = 
      `⚠️ RESTORE TO REELLY-ONLY\n\n` +
      `This will:\n` +
      `• Restore ${preview.projects_to_restore} projects to Reelly-only state\n` +
      `• Delete ${preview.images_to_delete} Provident-added images\n` +
      `• Delete ${preview.documents_to_delete} Provident-added documents\n` +
      `• Delete ${preview.pending_to_delete} pending Provident suggestions\n\n` +
      `Continue?`;

    if (!confirm(confirmMsg)) return;

    setIsRestoring(true);
    setRestoreResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("restore-to-reelly", {
        body: { mode: "global", confirm: true },
      });

      if (error) throw error;

      if (data?.success) {
        setRestoreResult(data);
        toast.success(`Restored ${data.restored?.projects || 0} projects to Reelly-only state`);
        // Refresh stats
        handleLoadIntegrityStats();
      } else {
        setRestoreResult({ success: false, error: data?.error });
        toast.error(data?.error || "Restore failed");
      }
    } catch (err: any) {
      console.error("Restore error:", err);
      setRestoreResult({ success: false, error: err.message });
      toast.error(err.message || "Failed to restore");
    } finally {
      setIsRestoring(false);
    }
  };

  /**
   * Clear only pending Provident suggestions
   */
  const handleClearPendingSuggestions = async () => {
    // First, preview what will be affected
    const { data: preview } = await supabase.functions.invoke("restore-to-reelly", {
      body: { mode: "pending_only", confirm: false },
    });

    if (!preview?.preview) {
      toast.error("Failed to preview operation");
      return;
    }

    if (preview.pending_to_delete === 0) {
      toast.info("No pending Provident suggestions to delete");
      return;
    }

    if (!confirm(`Delete ${preview.pending_to_delete} pending Provident suggestions?`)) return;

    try {
      const { data, error } = await supabase.functions.invoke("restore-to-reelly", {
        body: { mode: "pending_only", confirm: true },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Deleted ${data.deleted_pending} pending Provident suggestions`);
        handleLoadIntegrityStats();
      } else {
        toast.error(data?.error || "Failed to clear suggestions");
      }
    } catch (err: any) {
      console.error("Clear suggestions error:", err);
      toast.error(err.message || "Failed to clear suggestions");
    }
  };

  const goToApprovalQueue = () => {
    // Navigate to Reelly-filtered queue
    navigate("/listing-admin?view=sync&syncTab=approvals&source=reelly", { replace: true });
    // Trigger a small delay then force refresh the URL params
    setTimeout(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, 50);
  };

  /**
   * Clean & Sync Fresh - Opens confirmation dialog first
   */
  const handleCleanAndSyncClick = () => {
    setDestructiveConfirmed(false);
    setShowDestructiveDialog(true);
  };
  
  /**
   * Execute Clean & Sync after confirmation
   */
  const executeCleanAndSync = async () => {
    if (!destructiveConfirmed) {
      toast.error("Please confirm you understand what will be deleted");
      return;
    }
    
    setShowDestructiveDialog(false);

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
    // Only reset result for non-test mode to preserve previous results
    if (mode !== "test") {
      setDevSyncResult(null);
    }

    try {
      const { data, error } = await supabase.functions.invoke("reelly-developers-sync", {
        body: { mode },
      });

      if (error) throw error;

      if (data?.success) {
        setDevSyncResult(data);
        if (data.total_available) {
          setTotalDevelopers(data.total_available);
          // Update cache with developer count
          const cached = localStorage.getItem('reelly-api-cache');
          const cacheData = cached ? JSON.parse(cached) : {};
          localStorage.setItem('reelly-api-cache', JSON.stringify({
            ...cacheData,
            totalDevelopers: data.total_available,
            lastTested: Date.now()
          }));
        }
        if (mode === "test") {
          toast.success(`Developer API connected! ${data.total_available} developers available`);
        } else {
          toast.success(`Synced ${data.inserted} new, ${data.updated} updated developers (processed ${data.processed} of ${data.total_available})`);
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

  // Load cached API results on mount
  useEffect(() => {
    const cached = localStorage.getItem('reelly-api-cache');
    if (cached) {
      try {
        const { totalProjects: cachedProjects, totalDevelopers: cachedDevs, apiConnected: cachedConnected, lastTested } = JSON.parse(cached);
        // Use cache if less than 1 hour old
        if (lastTested && Date.now() - lastTested < 3600000) {
          if (cachedProjects) setTotalProjects(cachedProjects);
          if (cachedDevs) setTotalDevelopers(cachedDevs);
          if (cachedConnected !== undefined) setApiConnected(cachedConnected);
        }
      } catch (e) {
        console.warn("Failed to parse cached API results:", e);
      }
    }
  }, []);

  const handleTestApiConnection = async () => {
    setIsTestingApi(true);
    // Don't reset apiConnected here - keep previous result visible

    try {
      const { data, error } = await supabase.functions.invoke("reelly-api-sync", {
        body: { action: "test" },
      });

      if (error) throw error;

      if (data?.success) {
        setApiConnected(true);
        const apiTotal = data.total_available || null;
        setTotalProjects(apiTotal);
        // Update global live counts with API total
        if (apiTotal) {
          setApiTotal(apiTotal);
        }
        // Cache results
        localStorage.setItem('reelly-api-cache', JSON.stringify({
          totalProjects: apiTotal,
          totalDevelopers: totalDevelopers,
          apiConnected: true,
          lastTested: Date.now()
        }));
        toast.success(`API connected! ${apiTotal?.toLocaleString()} projects available`);
        // Refresh database counts too
        refreshCounts();
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
    setSyncStartTime(Date.now());
    setRecentImports([]);

    try {
      const pageSize = fullSync ? 100 : 100; // Increased batch size for faster sync
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
      {/* API Diagnostics Card - Connection Status Dashboard */}
      <Card className="border-2 border-gold/40 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark">
        <CardHeader className="pb-2">
          <CardTitle className="text-black flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold" />
            API Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Indicator */}
            <div className="text-center p-3 bg-white/50 rounded-lg border border-gold/20">
              <p className="text-xs text-zinc-500 mb-1">Connection</p>
              <Badge 
                variant={apiConnected === true ? "default" : apiConnected === false ? "destructive" : "secondary"}
                className={apiConnected === true ? "bg-green-500" : ""}
              >
                {apiConnected === null ? "Not Tested" : apiConnected ? "✓ Connected" : "✗ Failed"}
              </Badge>
            </div>
            
            {/* Projects Available */}
            <div className="text-center p-3 bg-white/50 rounded-lg border border-gold/20">
              <p className="text-xs text-zinc-500 mb-1">Projects Available</p>
              <p className="text-2xl font-bold text-black">
                {displayTotalProjects?.toLocaleString() || "—"}
              </p>
            </div>
            
            {/* Queue Count */}
            <div className="text-center p-3 bg-white/50 rounded-lg border border-gold/20">
              <p className="text-xs text-zinc-500 mb-1">Pending Queue</p>
              <p className="text-2xl font-bold text-black">
                {liveCounts?.reelly_pending_queue?.toLocaleString() || "0"}
              </p>
            </div>
            
            {/* Last Error */}
            <div className="text-center p-3 bg-white/50 rounded-lg border border-gold/20">
              <p className="text-xs text-zinc-500 mb-1">Last Error</p>
              <p className="text-sm text-red-600 truncate">
                {syncResult?.error || areasSyncResult?.error || devSyncResult?.error || "None"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Reelly Integration</h2>
        <p className="text-zinc-600">
          Import projects from Reelly via API
        </p>
      </div>
      
      {/* Live Counts Banner - Single Source of Truth */}
      {liveCounts && (
        <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Live Database Counts
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              Updated: {new Date(liveCounts.last_updated).toLocaleTimeString()}
              <Button variant="ghost" size="sm" onClick={refreshCounts} className="h-6 px-2">
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
              <p className="text-2xl font-bold text-emerald-600">
                {displayTotalProjects?.toLocaleString() || '—'}
              </p>
              <p className="text-xs text-slate-500">Reelly API Total</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
              <p className="text-2xl font-bold text-blue-600">
                {liveCounts.reelly_pending_queue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Pending Queue</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
              <p className="text-2xl font-bold text-green-600">
                {liveCounts.reelly_approved.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Approved</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
              <p className="text-2xl font-bold text-amber-600">
                {liveCounts.provident_pending_queue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Provident Queue</p>
            </div>
          </div>
        </div>
      )}

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
              {syncProgress && syncStartTime ? (() => {
                const elapsedMs = Date.now() - syncStartTime;
                const elapsedSec = elapsedMs / 1000;
                const projectsPerSec = elapsedSec > 0 ? syncProgress.fetched / elapsedSec : 0;
                const remaining = syncProgress.total - syncProgress.fetched;
                const estimatedSecondsLeft = projectsPerSec > 0 ? Math.ceil(remaining / projectsPerSec) : null;
                
                return (
                  <p className="text-sm text-zinc-500 mt-2">
                    Fetched {syncProgress.fetched.toLocaleString()} / {syncProgress.total.toLocaleString()} ({syncPercent}%)
                    {projectsPerSec > 0 && (
                      <span className="ml-2">
                        • ~{projectsPerSec.toFixed(0)}/sec
                        {estimatedSecondsLeft !== null && estimatedSecondsLeft > 0 && (
                          <span> • ~{estimatedSecondsLeft < 60 ? `${estimatedSecondsLeft}s` : `${Math.ceil(estimatedSecondsLeft / 60)}m`} remaining</span>
                        )}
                      </span>
                    )}
                  </p>
                );
              })() : (
                <p className="text-sm text-zinc-500 mt-2">Starting sync…</p>
              )}
            </div>
          )}

          {syncResult && (
            <div className="bg-white/80 rounded-xl p-4 border border-emerald-200">
              <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                Sync Results
                {syncResult.success && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                    Reconciled
                  </Badge>
                )}
              </h3>
              
              {syncResult.success ? (
                <>
                  {/* Strict Reconciliation Display */}
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">Sync Reconciliation</span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>
                        <strong>Requested:</strong> {syncResult.total_fetched?.toLocaleString() || 0} projects fetched from API
                      </p>
                      <p>
                        <strong>Accounted:</strong> {((syncResult.inserted || 0) + (syncResult.updated || 0) + (syncResult.skipped || 0) + (syncResult.errors?.length || 0)).toLocaleString()} = 
                        {' '}{syncResult.inserted || 0} new + {syncResult.updated || 0} updated + {syncResult.skipped || 0} skipped + {syncResult.errors?.length || 0} failed
                      </p>
                      {((syncResult.total_fetched || 0) === ((syncResult.inserted || 0) + (syncResult.updated || 0) + (syncResult.skipped || 0) + (syncResult.errors?.length || 0))) ? (
                        <p className="text-emerald-600 font-medium">✓ 100% reconciled - all projects accounted for</p>
                      ) : (
                        <p className="text-amber-600 font-medium">
                          ⚠ Difference of {Math.abs((syncResult.total_fetched || 0) - ((syncResult.inserted || 0) + (syncResult.updated || 0) + (syncResult.skipped || 0) + (syncResult.errors?.length || 0)))} projects
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <button
                      type="button"
                      className="bg-zinc-100 rounded-lg p-3 text-center hover:shadow-sm transition"
                      onClick={() => setIsRecentOpen(true)}
                    >
                      <p className="text-xl font-bold text-zinc-900">{syncResult.total_available?.toLocaleString() || '-'}</p>
                      <p className="text-xs text-zinc-500">API Total</p>
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
                      className="bg-zinc-100 rounded-lg p-3 text-center hover:shadow-sm transition"
                      onClick={() => setIsRecentOpen(true)}
                    >
                      <p className="text-xl font-bold text-zinc-500">{syncResult.skipped || 0}</p>
                      <p className="text-xs text-zinc-500">Skipped (Already Approved)</p>
                    </button>
                  </div>

                  {/* Errors count if any */}
                  {syncResult.errors && syncResult.errors.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-700">
                          {syncResult.errors.length} Failed
                        </span>
                      </div>
                      <div className="mt-2 max-h-24 overflow-y-auto">
                        {syncResult.errors.slice(0, 5).map((err, i) => (
                          <p key={i} className="text-xs text-red-600 truncate">{err}</p>
                        ))}
                        {syncResult.errors.length > 5 && (
                          <p className="text-xs text-red-500 mt-1">...and {syncResult.errors.length - 5} more errors</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CTA to Approval Queue - All projects need manual review */}
                  {((syncResult.inserted || 0) + (syncResult.updated || 0)) > 0 && (
                    <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <h4 className="font-bold text-xl flex items-center gap-2">
                            📋 {(syncResult.inserted || 0) + (syncResult.updated || 0)} projects ready for review
                          </h4>
                          <p className="text-blue-100 text-sm mt-1">
                            All synced projects are in the approval queue. Review and approve to publish.
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
            <AlertTitle className="text-amber-900">Confirmation Required</AlertTitle>
            <AlertDescription className="text-amber-700">
              This action requires explicit confirmation. Click the button below to review what will be affected.
            </AlertDescription>
          </Alert>

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
            onClick={handleCleanAndSyncClick} 
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
      
      {/* Destructive Action Confirmation Dialog */}
      <Dialog open={showDestructiveDialog} onOpenChange={setShowDestructiveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Destructive Action
            </DialogTitle>
            <DialogDescription>
              Please review carefully before proceeding.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">What WILL be deleted:</h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                <li>Areas that were manually created (not from Reelly API)</li>
                <li>Queue items from Provident or other non-Reelly sources</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">What will NOT be deleted:</h4>
              <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                <li>Areas synced from Reelly API (have reelly_id)</li>
                <li>Queue items from Reelly API</li>
                <li>Approved/published projects</li>
                <li>Your manually created listings (in projects table)</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">After cleanup:</h4>
              <p className="text-sm text-blue-700">
                Full sync of all {displayTotalProjects?.toLocaleString() || "~1,804"} projects from Reelly API will run.
              </p>
            </div>
            
            <div className="flex items-start gap-3 pt-2">
              <Checkbox 
                id="confirm-delete" 
                checked={destructiveConfirmed}
                onCheckedChange={(checked) => setDestructiveConfirmed(checked === true)}
              />
              <label htmlFor="confirm-delete" className="text-sm text-zinc-700 cursor-pointer">
                I understand what will be deleted and want to proceed with the clean & sync operation.
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDestructiveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={executeCleanAndSync}
              disabled={!destructiveConfirmed}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Proceed with Clean & Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Integrity Section */}
      <Card className="bg-gradient-to-br from-slate-50 to-zinc-50 border-slate-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-600">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                Data Integrity
                {integrityStats && integrityStats.projects_with_provident_enrichments === 0 && (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                )}
              </CardTitle>
              <CardDescription className="text-slate-700">
                Reelly is the primary source. Restore to Reelly-only state anytime.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-slate-300 bg-slate-100">
            <Info className="h-4 w-4 text-slate-600" />
            <AlertDescription className="text-slate-700">
              <strong>Reelly = Primary Source.</strong> Provident data is optional enrichment only.
              Use "Restore to Reelly-Only" to remove any Provident additions.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleLoadIntegrityStats}
            disabled={isLoadingIntegrityStats}
            variant="outline"
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            {isLoadingIntegrityStats ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading Stats...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Load Integrity Stats
              </>
            )}
          </Button>

          {integrityStats && (
            <div className="bg-white/80 rounded-xl p-4 border border-slate-200">
              <h3 className="font-semibold text-zinc-900 mb-3">Current State</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-700">{integrityStats.projects_from_reelly.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600">From Reelly</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${integrityStats.projects_with_provident_enrichments > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                  <p className={`text-xl font-bold ${integrityStats.projects_with_provident_enrichments > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                    {integrityStats.projects_with_provident_enrichments}
                  </p>
                  <p className={`text-xs ${integrityStats.projects_with_provident_enrichments > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                    Provident Enriched
                  </p>
                </div>
                <div className={`rounded-lg p-3 text-center ${integrityStats.provident_images > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                  <p className={`text-xl font-bold ${integrityStats.provident_images > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                    {integrityStats.provident_images}
                  </p>
                  <p className={`text-xs ${integrityStats.provident_images > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                    Provident Images
                  </p>
                </div>
                <div className={`rounded-lg p-3 text-center ${integrityStats.provident_documents > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                  <p className={`text-xl font-bold ${integrityStats.provident_documents > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                    {integrityStats.provident_documents}
                  </p>
                  <p className={`text-xs ${integrityStats.provident_documents > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                    Provident Docs
                  </p>
                </div>
                <div className={`rounded-lg p-3 text-center ${integrityStats.pending_provident_suggestions > 0 ? 'bg-blue-50' : 'bg-slate-50'}`}>
                  <p className={`text-xl font-bold ${integrityStats.pending_provident_suggestions > 0 ? 'text-blue-700' : 'text-slate-500'}`}>
                    {integrityStats.pending_provident_suggestions}
                  </p>
                  <p className={`text-xs ${integrityStats.pending_provident_suggestions > 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                    Pending Suggestions
                  </p>
                </div>
              </div>
            </div>
          )}

          {restoreResult && restoreResult.success && restoreResult.restored && (
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <h3 className="font-semibold text-emerald-900 mb-3">✅ Restore Complete</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-700">{restoreResult.restored.projects}</p>
                  <p className="text-xs text-emerald-600">Projects Restored</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-red-600">{restoreResult.restored.images_deleted}</p>
                  <p className="text-xs text-red-500">Images Deleted</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-red-600">{restoreResult.restored.documents_deleted}</p>
                  <p className="text-xs text-red-500">Docs Deleted</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-red-600">{restoreResult.restored.pending_deleted}</p>
                  <p className="text-xs text-red-500">Pending Deleted</p>
                </div>
              </div>
            </div>
          )}

          {restoreResult && !restoreResult.success && (
            <Alert className="border-red-300 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {restoreResult.error || "Restore failed"}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleGlobalRestore}
              disabled={isRestoring || isLoadingIntegrityStats}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore All to Reelly-Only
                </>
              )}
            </Button>
            <Button
              onClick={handleClearPendingSuggestions}
              disabled={isRestoring || isLoadingIntegrityStats}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Pending Suggestions Only
            </Button>
          </div>
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
