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
import type { Json } from "@/integrations/supabase/types";
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

// ── Enrichment Test Types ──
interface EnrichmentSnapshot {
  amenities_count: number;
  usp_count: number;
  distances_count: number;
  images_count: number;
  documents_count: number;
  faqs_count: number;
  floor_plans_count: number;
  unit_types_count: number;
  has_description: boolean;
  has_video: boolean;
  has_payment_plan: boolean;
  highlights_count: number;
  has_service_charge: boolean;
  has_roi_estimate: boolean;
  new_images?: number;
  new_documents?: number;
  gallery_preview?: string[];
}

interface EnrichmentTestResult {
  success: boolean;
  project?: { id: string; name: string; slug: string; reelly_id: number | null; cover_image_url?: string; developer_name?: string; area_name?: string; price_from?: number; price_to?: number };
  before?: EnrichmentSnapshot;
  after?: EnrichmentSnapshot;
  sources?: {
    reelly: { available: boolean; url?: string; fields_found?: Record<string, number>; reason?: string };
  };
  applied?: boolean;
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
  
  // Fetch missing details state
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [detailsFetchResult, setDetailsFetchResult] = useState<{
    success: boolean;
    processed?: number;
    updated?: number;
    remaining?: number;
    failed?: number;
    errors?: string[];
    message?: string;
    error?: string;
  } | null>(null);
  
  // AI Interior Generation state
  const [isGeneratingInteriors, setIsGeneratingInteriors] = useState(false);
  const [interiorsResult, setInteriorsResult] = useState<{
    success: boolean;
    generated?: number;
    failed?: number;
    remaining?: number;
    error?: string;
  } | null>(null);

  // Bulk Enrichment state
  const [isBulkEnriching, setIsBulkEnriching] = useState(false);
  const [bulkEnrichResult, setBulkEnrichResult] = useState<{
    success: boolean;
    processed?: number;
    images_added?: number;
    docs_added?: number;
    fields_updated?: number;
    errors?: number;
    error_details?: string[];
    results?: Array<{ name: string; status: string; images: number; docs: number; fields: number }>;
    message?: string;
    error?: string;
  } | null>(null);
  const [bulkEnrichStats, setBulkEnrichStats] = useState<{
    total_projects_with_reelly_id: number;
    projects_with_documents: number;
    projects_needing_enrichment: number;
    total_images: number;
    total_documents: number;
  } | null>(null);
  const [isLoadingBulkStats, setIsLoadingBulkStats] = useState(false);

  // Provident per-project results
  const [providentProjectResults, setProvidentProjectResults] = useState<Array<{
    id: string; name: string; slug: string; pdfs_found: number; images_found: number;
    docs_inserted: number; images_inserted: number; errors: string[];
  }>>([]);

  // AI Content Generation state
  const [isAiEnriching, setIsAiEnriching] = useState(false);
  const [aiEnrichResult, setAiEnrichResult] = useState<{
    success: boolean;
    processed?: number;
    enriched?: number;
    errors?: number;
    error_details?: string[];
    results?: Array<{ name: string; status: string; fields: string[] }>;
    message?: string;
    error?: string;
  } | null>(null);
  const [aiEnrichStats, setAiEnrichStats] = useState<{
    total_published: number;
    missing_faqs: number;
    missing_highlights: number;
    with_faqs: number;
    with_highlights: number;
    with_usp: number;
    with_payment: number;
    with_distances: number;
  } | null>(null);
  const [isLoadingAiStats, setIsLoadingAiStats] = useState(false);

  // Provident Document Extraction state
  const [isProvidentExtracting, setIsProvidentExtracting] = useState(false);
  const [providentResult, setProvidentResult] = useState<{
    processed?: number;
    total_pdfs_found?: number;
    total_images_found?: number;
    total_docs_inserted?: number;
    total_images_inserted?: number;
    errors?: number;
    error?: string;
  } | null>(null);
  
  // Full enrichment loop state
  const [isFullAiRunning, setIsFullAiRunning] = useState(false);
  const [fullAiProgress, setFullAiProgress] = useState({ processed: 0, enriched: 0, errors: 0 });
  const [fullAiStopRequested, setFullAiStopRequested] = useState(false);
  const [isFullProvidentRunning, setIsFullProvidentRunning] = useState(false);
  const [fullProvidentProgress, setFullProvidentProgress] = useState({ processed: 0, docs: 0, images: 0, errors: 0 });
  const [fullProvidentStopRequested, setFullProvidentStopRequested] = useState(false);
  
  // Backfill state - for backfilling approved projects with missing details
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillStats, setBackfillStats] = useState<{
    total_projects: number;
    missing_floor_plans: number;
    missing_amenities: number;
    missing_documents: number;
    missing_any: number;
  } | null>(null);
  const [backfillResult, setBackfillResult] = useState<{
    success: boolean;
    processed?: number;
    updated?: number;
    failed?: number;
    remaining?: number;
    errors?: string[];
    message?: string;
    error?: string;
  } | null>(null);
  const [backfillProjectList, setBackfillProjectList] = useState<Array<{ name: string; slug?: string; status: string; images?: number; docs?: number }>>([]);
  const [isBackfillListOpen, setIsBackfillListOpen] = useState(false);
  const [backfillListFilter, setBackfillListFilter] = useState<"all" | "success" | "failed">("all");
  
  // Resume sync state
  const [hasResumableJob, setHasResumableJob] = useState(false);
  const [resumableJobInfo, setResumableJobInfo] = useState<{
    id: string;
    status: string;
    current_page: number;
    total_pages: number;
    next_cursor: string | null;
  } | null>(null);
  
  // Full extraction state
  const [isFullExtracting, setIsFullExtracting] = useState(false);
  const [fullExtractionStep, setFullExtractionStep] = useState<string | null>(null);
  
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
  // Enrichment test state
  const [enrichTestSlug, setEnrichTestSlug] = useState("binghatti-titania-binghatti-3012");
  const [isEnrichTesting, setIsEnrichTesting] = useState(false);
  const [enrichTestResult, setEnrichTestResult] = useState<EnrichmentTestResult | null>(null);
  const [isEnrichApplying, setIsEnrichApplying] = useState(false);
  
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{
    success: boolean;
    restored?: { projects: number; images_deleted: number; documents_deleted: number; pending_deleted: number };
    error?: string;
  } | null>(null);
  
  // Sync live counts on mount, check for resumable jobs, and load persisted backfill results
  useEffect(() => {
    refreshCounts();
    checkForResumableJob();
    loadPersistedBackfillResults();
  }, [refreshCounts]);
  
  // Load persisted backfill results from sync_jobs table
  const loadPersistedBackfillResults = async () => {
    try {
      const { data, error } = await supabase
        .from("sync_jobs")
        .select("*")
        .eq("job_type", "reelly_backfill")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data) {
        const errorLog = data.error_log as Array<{ name: string; status: string; images?: number; docs?: number }> | null;
        const results = errorLog || [];
        const updated = data.stats_updated || 0;
        const failed = data.stats_errors || 0;
        setBackfillResult({
          success: data.status === "completed" || data.status === "running",
          processed: updated + failed,
          updated,
          failed,
          remaining: data.stats_skipped || 0,
          message: data.status === "completed" ? `Backfill complete! Updated ${updated} projects.` : `Backfill in progress...`,
        });
        setBackfillProjectList(results);
      }
    } catch {
      // No persisted results yet
    }
  };

  // Check for interrupted sync jobs that can be resumed
  const checkForResumableJob = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("reelly-api-sync", {
        body: { action: "check_resume" },
      });
      
      if (!error && data?.has_active_job && data.job?.next_cursor) {
        setHasResumableJob(true);
        setResumableJobInfo(data.job);
      } else {
        setHasResumableJob(false);
        setResumableJobInfo(null);
      }
    } catch (err) {
      console.error("Error checking for resumable jobs:", err);
    }
  };
  
  // Clear stuck jobs that are paused with no cursor (non-resumable)
  const handleClearStuckJobs = async () => {
    try {
      // Cancel all paused jobs with no next_cursor (these are stuck and can't resume)
      const { data, error } = await supabase
        .from("sync_jobs")
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString()
        })
        .eq("status", "paused")
        .is("next_cursor", null)
        .select("id");
      
      if (error) throw error;
      
      const clearedCount = data?.length || 0;
      if (clearedCount > 0) {
        toast.success(`Cleared ${clearedCount} stuck sync jobs`);
        // Refresh state
        checkForResumableJob();
        refreshCounts();
      } else {
        toast.info("No stuck jobs found to clear");
      }
    } catch (err: any) {
      console.error("Error clearing stuck jobs:", err);
      toast.error(err.message || "Failed to clear stuck jobs");
    }
  };
  
  // Resume an interrupted sync job
  const handleResumeSync = async () => {
    if (!resumableJobInfo?.next_cursor) {
      toast.error("No resumable job found");
      return;
    }
    
    toast.info(`Resuming sync from page ${resumableJobInfo.current_page}...`);
    
    // Continue the full sync from where it left off
    await handleSyncProjects(true, resumableJobInfo.next_cursor, resumableJobInfo.id);
    
    // Clear resumable state after completion
    setHasResumableJob(false);
    setResumableJobInfo(null);
  };
  
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
    // Navigate to Data Ops view with Approvals tab
    navigate("/listing-admin?view=data-ops&syncTab=approvals", { replace: true });
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

  /**
   * Fetch Missing Details - batch fetch gallery, docs, amenities for projects in queue
   */
  const handleFetchMissingDetails = async () => {
    setIsFetchingDetails(true);
    setDetailsFetchResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("reelly-backfill-projects", {
        body: { mode: "batch", batch_size: 50 },
      });

      if (error) throw error;

      if (data?.success) {
        setDetailsFetchResult(data);
        if (data.updated > 0) {
          toast.success(`Updated ${data.updated} projects with detailed data`);
        } else if (data.remaining === 0) {
          toast.success("All projects already have complete details!");
        } else {
          toast.info(data.message || "Fetch completed");
        }
      } else {
        setDetailsFetchResult({ success: false, error: data?.error });
        toast.error(data?.error || "Failed to fetch details");
      }
    } catch (err: any) {
      console.error("Fetch details error:", err);
      setDetailsFetchResult({ success: false, error: err.message });
      toast.error(err.message || "Failed to fetch details");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  /**
   * Test Details API - check if detail endpoint returns extra data
   */
  const handleTestDetailsApi = async () => {
    setIsFetchingDetails(true);
    setDetailsFetchResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("reelly-fetch-details", {
        body: { mode: "test" },
      });

      if (error) throw error;

      if (data?.success) {
        setDetailsFetchResult(data);
        if (data.has_detail) {
          toast.success(`Detail API works! Test project has ${data.detail_fields?.images_count || 0} images, ${data.detail_fields?.amenities_count || 0} amenities`);
        } else {
          toast.info("Detail endpoint accessible but returned no extra data");
        }
      } else {
        setDetailsFetchResult({ success: false, error: data?.error });
        toast.error(data?.error || "Details API test failed");
      }
    } catch (err: any) {
      console.error("Details API test error:", err);
      setDetailsFetchResult({ success: false, error: err.message });
      toast.error(err.message || "Failed to test details API");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  /**
   * Load backfill stats - count of projects missing detailed data
   */
  const handleLoadBackfillStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("reelly-backfill-projects", {
        body: { mode: "stats" },
      });

      if (error) throw error;

      if (data?.success && data.stats) {
        setBackfillStats(data.stats);
        toast.success(`Found ${data.stats.missing_any} projects needing backfill`);
      } else {
        toast.error(data?.error || "Failed to load backfill stats");
      }
    } catch (err: any) {
      console.error("Backfill stats error:", err);
      toast.error(err.message || "Failed to load backfill stats");
    }
  };

  /**
   * Run backfill - fetch missing details for approved projects
   */
  const handleRunBackfill = async (mode: "batch" | "all" = "batch") => {
    if (mode === "all") {
      if (!confirm("🔄 FULL BACKFILL\n\nThis will fetch detailed data (floor plans, amenities, documents, etc.) for ALL approved projects from Reelly API.\n\nThis may take 10-20 minutes. Continue?")) {
        return;
      }
    }

    setIsBackfilling(true);

    // Capture start time ONCE for the entire run so progress tracking works
    const backfillStartedAt = new Date().toISOString();

    try {
      // Load previous progress from most recent backfill job
      const { data: prevJob } = await supabase
        .from("sync_jobs")
        .select("*")
        .eq("job_type", "reelly_backfill")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Don't accumulate from previous jobs - start fresh each run
      // Previous job data is only for reference, not for adding to current counts
      let aggregated = { processed: 0, updated: 0, failed: 0, remaining: 999 };
      let allResults: Array<{ name: string; slug?: string; status: string; images?: number; docs?: number }> = [];
      setBackfillResult({
        success: true,
        ...aggregated,
        message: `Starting backfill...`,
      });
      setBackfillProjectList(allResults);

      let batches = 0;
      const maxBatches = mode === "all" ? 100 : 1;

      // Reuse existing job row or create new one
      let jobId: string | undefined;
      if (prevJob?.id && prevJob?.status !== "completed") {
        jobId = prevJob.id;
        await supabase
          .from("sync_jobs")
          .update({ status: "running", updated_at: new Date().toISOString() })
          .eq("id", jobId);
      } else {
        const { data: jobRow } = await supabase
          .from("sync_jobs")
          .insert({
            job_type: "reelly_backfill",
            status: "running",
            stats_updated: 0,
            stats_errors: 0,
            stats_skipped: 0,
            error_log: [] as unknown as Json[],
          })
          .select("id")
          .single();
        jobId = jobRow?.id;
      }

      while (aggregated.remaining > 0 && batches < maxBatches) {
        const { data, error } = await supabase.functions.invoke("reelly-backfill-projects", {
        body: { mode: "batch", batch_size: 50, force_refresh: true, started_at: backfillStartedAt },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Backfill failed");

        // Collect per-project results from the edge function
        const batchResults = (data.results || []) as Array<{ name: string; slug?: string; status: string; images?: number; docs?: number }>;
        allResults = [...allResults, ...batchResults];

        aggregated = {
          processed: aggregated.processed + (data.processed || 0),
          updated: aggregated.updated + (data.updated || 0),
          failed: aggregated.failed + (data.failed || 0),
          remaining: data.remaining || 0,
        };

        setBackfillResult({
          success: true,
          ...aggregated,
          message: `Processing batch ${batches + 1}...`,
        });
        setBackfillProjectList(allResults);

        // Persist progress to sync_jobs
        if (jobId) {
          await supabase
            .from("sync_jobs")
            .update({
              stats_updated: aggregated.updated,
              stats_errors: aggregated.failed,
              stats_skipped: aggregated.remaining,
              error_log: allResults.slice(-500) as unknown as Json[],
              updated_at: new Date().toISOString(),
            })
            .eq("id", jobId);
        }

        batches++;
        
        // Small delay between batches
        if (aggregated.remaining > 0 && batches < maxBatches) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setBackfillResult({
        success: true,
        ...aggregated,
        message: `Backfill complete! Updated ${aggregated.updated} projects.`,
      });

      // Mark job as completed
      if (jobId) {
        await supabase
          .from("sync_jobs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            stats_updated: aggregated.updated,
            stats_errors: aggregated.failed,
            stats_skipped: aggregated.remaining,
            error_log: allResults.slice(-500) as unknown as Json[],
          })
          .eq("id", jobId);
      }

      toast.success(`Backfilled ${aggregated.updated} projects with detailed data`);
      
      // Refresh stats
      handleLoadBackfillStats();
    } catch (err: any) {
      console.error("Backfill error:", err);
      setBackfillResult({ success: false, error: err.message });
      toast.error(err.message || "Backfill failed");
    } finally {
      setIsBackfilling(false);
    }
  };

  /**
   * FULL EXTRACTION - Run all sync steps in sequence
   */
  const handleFullExtraction = async () => {
    if (!confirm("🚀 FULL EXTRACTION\n\nThis will run all sync steps:\n1. Test API Connection\n2. Sync All Projects (1,805)\n3. Sync All Developers (549)\n4. Backfill Missing Details (floor plans, amenities, docs)\n5. Fetch Gallery Details\n6. Extract Areas\n7. Generate AI Interiors\n\nThis may take 15-30 minutes. Continue?")) {
      return;
    }

    setIsFullExtracting(true);
    setFullExtractionStep("testing");

    try {
      // Step 1: Test API - use direct result, not stale state
      setFullExtractionStep("Step 1/7: Testing API connection...");
      const isConnected = await handleTestApiConnection();
      
      if (!isConnected) {
        throw new Error("API connection failed. Please check your API key.");
      }

      // Step 2: Sync All Projects
      setFullExtractionStep("Step 2/7: Syncing all projects...");
      await handleSyncProjects(true);

      // Step 3: Sync All Developers
      setFullExtractionStep("Step 3/7: Syncing all developers...");
      await handleSyncDevelopers("full");

      // Step 4: Backfill Missing Details (NEW - runs on approved projects)
      setFullExtractionStep("Step 4/7: Backfilling missing details to approved projects...");
      let backfillRemaining = 999;
      let backfillBatches = 0;
      const maxBackfillBatches = 50;
      
      while (backfillRemaining > 0 && backfillBatches < maxBackfillBatches) {
        const { data } = await supabase.functions.invoke("reelly-backfill-projects", {
        body: { mode: "batch", batch_size: 50, force_refresh: true },
        });
        
        if (!data?.success) break;
        backfillRemaining = data.remaining || 0;
        backfillBatches++;
        
        setFullExtractionStep(`Step 4/7: Backfilling details (batch ${backfillBatches}, ${backfillRemaining} remaining)...`);
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Step 5: Fetch Missing Details for pending imports
      setFullExtractionStep("Step 5/7: Fetching missing details for queue...");
      let remainingDetails = 999;
      let detailBatches = 0;
      const maxDetailBatches = 50; // Safety limit
      
      while (remainingDetails > 0 && detailBatches < maxDetailBatches) {
        const { data } = await supabase.functions.invoke("reelly-fetch-details", {
          body: { mode: "batch", batch_size: 50 },
        });
        
        if (!data?.success) break;
        remainingDetails = data.remaining || 0;
        detailBatches++;
        
        setFullExtractionStep(`Step 5/7: Fetching details (batch ${detailBatches}, ${remainingDetails} remaining)...`);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 6: Extract Areas
      setFullExtractionStep("Step 6/7: Extracting areas...");
      await handleSyncAreas("extract_from_projects");

      // Step 7: Generate AI Interior Images
      setFullExtractionStep("Step 7/7: Generating AI interior visuals...");
      let remainingInteriors = 999;
      let interiorBatches = 0;
      const maxInteriorBatches = 50; // Safety limit
      
      while (remainingInteriors > 0 && interiorBatches < maxInteriorBatches) {
        const { data } = await supabase.functions.invoke("batch-generate-interiors", {
          body: { mode: "batch", batch_size: 5 }, // Smaller batches for AI generation
        });
        
        if (!data?.success) break;
        remainingInteriors = data.remaining || 0;
        interiorBatches++;
        
        setFullExtractionStep(`Step 7/7: Generating interiors (batch ${interiorBatches}, ${remainingInteriors} remaining)...`);
        
        // Longer delay between AI batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Limit to first 100 projects for initial sync to avoid excessive cost
        if (interiorBatches >= 20) {
          setFullExtractionStep("Step 7/7: Interior generation paused (limit reached)...");
          break;
        }
      }

      setFullExtractionStep("✅ Full extraction complete!");
      toast.success("🎉 Full extraction complete! All projects synced with complete data and AI interiors.");
      
      // Refresh counts
      refreshCounts();
      checkForResumableJob();

    } catch (err: any) {
      console.error("Full extraction error:", err);
      setFullExtractionStep(`❌ Failed: ${err.message}`);
      toast.error(err.message || "Full extraction failed");
    } finally {
      setIsFullExtracting(false);
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

  const handleTestApiConnection = async (): Promise<boolean> => {
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
        return true;
      } else {
        setApiConnected(false);
        toast.error(data?.error || "API connection failed");
        return false;
      }
    } catch (err: any) {
      console.error("API test error:", err);
      setApiConnected(false);
      toast.error(err.message || "Failed to test API connection");
      return false;
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleSyncProjects = async (fullSync: boolean = false, resumeCursor?: string, jobId?: string) => {
    setIsSyncing(true);
    setSyncResult(null);
    setSyncProgress(null);
    const startedAt = new Date().toISOString();
    setSyncStartedAt(startedAt);
    setSyncStartTime(Date.now());
    setRecentImports([]);

    try {
      const pageSize = fullSync ? 100 : 100; // Increased batch size for faster sync
      let cursor: string | null = resumeCursor || null;
      let currentJobId: string | null = jobId || null;
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
            job_id: currentJobId,
            resume_cursor: cursor,
            force_overwrite: fullSync, // Full sync always overwrites ALL records
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

      {/* Resume Sync Banner - Shows if there's an interrupted job */}
      {hasResumableJob && resumableJobInfo && (
        <Alert className="border-amber-400 bg-amber-50">
          <RotateCcw className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Interrupted Sync Detected</AlertTitle>
          <AlertDescription className="text-amber-700">
            <div className="flex items-center justify-between gap-4 flex-wrap mt-2">
              <span>
                Sync was interrupted at page {resumableJobInfo.current_page}. 
                Progress has been saved - you can resume from where you left off.
              </span>
              <Button 
                onClick={handleResumeSync}
                disabled={isSyncing}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Resume Sync
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Clear Stuck Jobs Button - Admin maintenance tool */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Reelly Integration</h2>
          <p className="text-zinc-600">
            Import projects from Reelly via API
          </p>
        </div>
        <Button 
          onClick={handleClearStuckJobs}
          variant="outline"
          size="sm"
          className="text-amber-700 border-amber-300 hover:bg-amber-50"
          title="Clear paused sync jobs that cannot be resumed"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Clear Stuck Jobs
        </Button>
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

      {/* Backfill Missing Details - For Approved Projects */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-purple-900 flex items-center gap-2">
                Backfill Missing Details
                {backfillStats?.missing_any === 0 && <CheckCircle className="h-5 w-5 text-emerald-500" />}
              </CardTitle>
              <CardDescription className="text-purple-700">
                Fetch floor plans, amenities, documents for approved projects
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-purple-300 bg-purple-50/50">
            <Info className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-700">
              This fetches detailed data from Reelly API for projects that were approved before detail enrichment.
              Use this to populate floor plans, amenities, brochures, payment plans, and unit types.
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleLoadBackfillStats}
              disabled={isBackfilling}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Missing Data
            </Button>
            <Button
              onClick={() => handleRunBackfill("batch")}
              disabled={isBackfilling}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isBackfilling ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Backfilling...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Backfill Batch (50)
                </>
              )}
            </Button>
            <Button
              onClick={() => handleRunBackfill("all")}
              disabled={isBackfilling}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              <Download className="h-4 w-4 mr-2" />
              Backfill All
            </Button>
          </div>

          {backfillStats && (
            <div className="bg-white/80 rounded-xl p-4 border border-purple-200">
              <h3 className="font-semibold text-zinc-900 mb-3">Projects Needing Backfill</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-purple-700">{backfillStats.total_projects.toLocaleString()}</p>
                  <p className="text-xs text-purple-600">Total Projects</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${backfillStats.missing_floor_plans > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                  <p className={`text-xl font-bold ${backfillStats.missing_floor_plans > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {backfillStats.missing_floor_plans.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-600">Missing Floor Plans</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${backfillStats.missing_amenities > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                  <p className={`text-xl font-bold ${backfillStats.missing_amenities > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {backfillStats.missing_amenities.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-600">Missing Amenities</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${backfillStats.missing_documents > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                  <p className={`text-xl font-bold ${backfillStats.missing_documents > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {backfillStats.missing_documents.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-600">Missing Brochures</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${backfillStats.missing_any > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                  <p className={`text-xl font-bold ${backfillStats.missing_any > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {backfillStats.missing_any.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-600">Not Yet Fetched</p>
                </div>
              </div>
              {/* Warning: All fetched but many have empty data */}
              {backfillStats.missing_any === 0 && (backfillStats.missing_amenities > 0 || backfillStats.missing_floor_plans > 0 || backfillStats.missing_documents > 0) && (
                <Alert className="mt-3 border-amber-300 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    <strong>All {backfillStats.total_projects.toLocaleString()} projects were fetched</strong> but many have empty data.
                    {backfillStats.missing_amenities > 0 && ` ${backfillStats.missing_amenities.toLocaleString()} missing amenities.`}
                    {backfillStats.missing_floor_plans > 0 && ` ${backfillStats.missing_floor_plans.toLocaleString()} missing floor plans.`}
                    {backfillStats.missing_documents > 0 && ` ${backfillStats.missing_documents.toLocaleString()} missing documents.`}
                    <br />
                    <strong>Use "Backfill Batch" or "Backfill All" to force re-fetch from Reelly API</strong> — these buttons already use force refresh mode.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {backfillResult && (
            <div className={`bg-white/80 rounded-xl p-4 border ${backfillResult.success ? 'border-purple-200' : 'border-red-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-900">Backfill Results</h3>
                {backfillProjectList.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBackfillResult(null);
                      setBackfillProjectList([]);
                      // Also clear from DB
                      supabase
                        .from("sync_jobs")
                        .delete()
                        .eq("job_type", "reelly_backfill")
                        .then(() => {});
                    }}
                    className="text-xs text-zinc-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              {backfillResult.success ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      type="button"
                      className="bg-blue-50 rounded-lg p-3 text-center hover:shadow-md transition cursor-pointer"
                      onClick={() => { setBackfillListFilter("all"); setIsBackfillListOpen(true); }}
                    >
                      <p className="text-xl font-bold text-blue-600">{backfillResult.processed || 0}</p>
                      <p className="text-xs text-zinc-500">Processed</p>
                    </button>
                    <button
                      type="button"
                      className="bg-emerald-50 rounded-lg p-3 text-center hover:shadow-md transition cursor-pointer"
                      onClick={() => { setBackfillListFilter("success"); setIsBackfillListOpen(true); }}
                    >
                      <p className="text-xl font-bold text-emerald-600">{backfillResult.updated || 0}</p>
                      <p className="text-xs text-zinc-500">Updated</p>
                    </button>
                    <button
                      type="button"
                      className="bg-red-50 rounded-lg p-3 text-center hover:shadow-md transition cursor-pointer"
                      onClick={() => { setBackfillListFilter("failed"); setIsBackfillListOpen(true); }}
                    >
                      <p className="text-xl font-bold text-red-600">{backfillResult.failed || 0}</p>
                      <p className="text-xs text-zinc-500">Failed</p>
                    </button>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-amber-600">{backfillResult.remaining || 0}</p>
                      <p className="text-xs text-zinc-500">Remaining</p>
                    </div>
                  </div>
                  {backfillProjectList.length > 0 && (
                    <p className="text-xs text-purple-600 mt-2 text-center cursor-pointer hover:underline" onClick={() => { setBackfillListFilter("all"); setIsBackfillListOpen(true); }}>
                      Click any count to see project details →
                    </p>
                  )}
                </>
              ) : (
                <Alert className="border-red-300 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {backfillResult.error || "Backfill failed"}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Backfill Project List Dialog */}
          <Dialog open={isBackfillListOpen} onOpenChange={setIsBackfillListOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Backfill Results — {backfillListFilter === "all" ? "All" : backfillListFilter === "success" ? "Updated" : "Failed"} Projects
                </DialogTitle>
              </DialogHeader>
              <div className="flex gap-2 mb-3">
                {(["all", "success", "failed"] as const).map(f => (
                  <Button
                    key={f}
                    variant={backfillListFilter === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBackfillListFilter(f)}
                  >
                    {f === "all" ? `All (${backfillProjectList.length})` : f === "success" ? `Updated (${backfillProjectList.filter(p => p.status === "success").length})` : `Failed (${backfillProjectList.filter(p => p.status !== "success").length})`}
                  </Button>
                ))}
              </div>
              <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-2">
                {backfillProjectList
                  .filter(p => backfillListFilter === "all" ? true : backfillListFilter === "success" ? p.status === "success" : p.status !== "success")
                  .map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 border rounded-lg p-2 hover:bg-zinc-50 transition-colors">
                      <div className="min-w-0">
                        {p.slug ? (
                          <a href={`/project/${p.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-zinc-900 truncate text-sm hover:text-blue-600 hover:underline flex items-center gap-1">
                            {p.name}
                            <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-50" />
                          </a>
                        ) : (
                          <div className="font-medium text-zinc-900 truncate text-sm">{p.name}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {p.status === "success" ? (
                          <>
                            {(p.images ?? 0) > 0 && <Badge variant="outline" className="text-xs">{p.images} imgs</Badge>}
                            {(p.docs ?? 0) > 0 && <Badge variant="outline" className="text-xs">{p.docs} docs</Badge>}
                            <Badge className="bg-emerald-500 text-xs">✓</Badge>
                          </>
                        ) : (
                          <Badge variant="destructive" className="text-xs">{p.status}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                {backfillProjectList.filter(p => backfillListFilter === "all" ? true : backfillListFilter === "success" ? p.status === "success" : p.status !== "success").length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">No projects in this category</p>
                )}
              </div>
              <div className="flex justify-end mt-2">
                <Button variant="outline" onClick={() => setIsBackfillListOpen(false)}>Close</Button>
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

      {/* Fetch Missing Details Section */}
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500">
              <CloudDownload className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-orange-900 flex items-center gap-2">
                Fetch Missing Details
                {detailsFetchResult?.remaining === 0 && <CheckCircle className="h-5 w-5 text-orange-500" />}
              </CardTitle>
              <CardDescription className="text-orange-700">
                Fetch gallery images, documents, amenities, floor plans for existing projects
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-300 bg-orange-50">
            <Info className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              After syncing projects, use this to fetch complete data from the detail endpoint 
              (gallery images, videos, brochures, floor plans, amenities, unit types).
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              onClick={handleTestDetailsApi} 
              disabled={isFetchingDetails}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {isFetchingDetails ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Test Details API
                </>
              )}
            </Button>
            <Button 
              onClick={handleFetchMissingDetails} 
              disabled={isFetchingDetails || apiConnected !== true}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isFetchingDetails ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Fetching Details...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Fetch Missing Details (Batch 50)
                </>
              )}
            </Button>
          </div>

          {detailsFetchResult && detailsFetchResult.success && (
            <div className="bg-white/80 rounded-xl p-4 border border-orange-200">
              <h3 className="font-semibold text-zinc-900 mb-3">Details Fetch Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-orange-900">{detailsFetchResult.processed || 0}</p>
                  <p className="text-xs text-orange-600">Processed</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-700">{detailsFetchResult.updated || 0}</p>
                  <p className="text-xs text-emerald-600">Updated</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-red-600">{detailsFetchResult.failed || 0}</p>
                  <p className="text-xs text-red-500">Failed</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-700">{detailsFetchResult.remaining || 0}</p>
                  <p className="text-xs text-blue-600">Remaining</p>
                </div>
              </div>
              {detailsFetchResult.remaining && detailsFetchResult.remaining > 0 && (
                <p className="text-sm text-orange-700 mt-3">
                  Click "Fetch Missing Details" again to process the next batch of {Math.min(50, detailsFetchResult.remaining)} projects.
                </p>
              )}
            </div>
          )}

          {detailsFetchResult && !detailsFetchResult.success && (
            <Alert className="border-red-300 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {detailsFetchResult.error || "Details fetch failed"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* FULL EXTRACTION - One Click to Rule Them All */}
      <Card className="bg-gradient-to-br from-gold/30 to-champagne border-gold shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div>
              <CardTitle className="text-xl text-black flex items-center gap-2">
                🚀 FULL EXTRACTION
                {fullExtractionStep === "✅ Full extraction complete!" && <CheckCircle className="h-5 w-5 text-emerald-500" />}
              </CardTitle>
              <CardDescription className="text-zinc-700">
                One-click to sync ALL 1,805 projects with complete data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white/80 rounded-xl p-4 border border-gold/50">
            <h4 className="font-semibold text-zinc-900 mb-2">This will run:</h4>
            <ol className="list-decimal list-inside text-sm text-zinc-700 space-y-1">
              <li>Test API Connection</li>
              <li>Sync All Projects (~1,805)</li>
              <li>Sync All Developers (~549)</li>
              <li>Fetch Missing Details (gallery, docs, amenities)</li>
              <li>Extract Areas from Projects</li>
            </ol>
            <p className="text-xs text-zinc-500 mt-3">Estimated time: 5-10 minutes</p>
          </div>

          {isFullExtracting && fullExtractionStep && (
            <div className="bg-white/80 rounded-xl p-4 border border-gold">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-gold animate-spin" />
                <span className="font-medium text-zinc-900">{fullExtractionStep}</span>
              </div>
            </div>
          )}

          <Button 
            onClick={handleFullExtraction} 
            disabled={isFullExtracting || isSyncing || isSyncingDevs || isFetchingDetails || isSyncingAreas}
            className="w-full bg-gold hover:bg-gold/90 text-black font-bold text-lg py-6"
          >
            {isFullExtracting ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Full Extraction in Progress...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Start Full Extraction
              </>
            )}
          </Button>
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

      {/* ── ENRICHMENT TEST SECTION ── */}
      <Card className="bg-white border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Test Project Enrichment
          </CardTitle>
          <CardDescription>
            Preview enrichment from Reelly + Provident for a single project before bulk applying
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter full project slug (e.g. binghatti-crescent-binghatti-44)"
              value={enrichTestSlug}
              onChange={(e) => setEnrichTestSlug(e.target.value)}
              className="flex-1 px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              variant="outline"
              size="sm"
              className="text-xs whitespace-nowrap"
              onClick={async () => {
                try {
                  const { data, error } = await supabase
                    .from("projects")
                    .select("slug")
                    .not("reelly_id", "is", null)
                    .not("cover_image_url", "is", null)
                    .limit(50);
                  if (error) throw error;
                  if (data && data.length > 0) {
                    const random = data[Math.floor(Math.random() * data.length)];
                    setEnrichTestSlug(random.slug);
                    toast.success(`Selected: ${random.slug}`);
                  } else {
                    toast.error("No projects with Reelly IDs found");
                  }
                } catch (err: any) {
                  toast.error(err.message || "Failed to pick random project");
                }
              }}
            >
              🎲 Random
            </Button>
            <Button
              onClick={async () => {
                if (!enrichTestSlug.trim()) { toast.error("Enter a project slug"); return; }
                setIsEnrichTesting(true);
                setEnrichTestResult(null);
                try {
                  const { data, error } = await supabase.functions.invoke("enrich-project-test", {
                    body: { slug: enrichTestSlug.trim() },
                  });
                  if (error) throw error;
                  setEnrichTestResult(data);
                } catch (err: any) {
                  toast.error(err.message || "Enrichment test failed");
                  setEnrichTestResult({ success: false, error: err.message });
                } finally {
                  setIsEnrichTesting(false);
                }
              }}
              disabled={isEnrichTesting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEnrichTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isEnrichTesting ? "Testing..." : "Test"}
            </Button>
          </div>
            <p className="text-xs text-zinc-500">💡 Use full slug format from the database (e.g. <code>binghatti-crescent-binghatti-44</code>). Click "🎲 Random" to pick a valid slug.</p>
          </div>

          {/* Enrichment Results with Card Preview */}
          {enrichTestResult && enrichTestResult.success && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold text-sm">
                {enrichTestResult.project?.name} 
                <span className="text-xs text-zinc-500 ml-2">(Reelly ID: {enrichTestResult.project?.reelly_id || "none"})</span>
              </h4>

              {/* Sources */}
              <div className="flex gap-3 text-xs">
                {enrichTestResult.sources?.reelly?.available ? (
                  <a href={enrichTestResult.sources.reelly.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Reelly Source
                  </a>
                ) : (
                  <span className="text-zinc-400">Reelly: {enrichTestResult.sources?.reelly?.reason}</span>
                )}
              </div>

              {/* Visual Card Preview - Before & After */}
              <div className="grid grid-cols-2 gap-4">
                {/* BEFORE Card */}
                <a href={`/project/${enrichTestResult.project?.slug}`} target="_blank" rel="noopener noreferrer" className="block border border-red-200 rounded-xl overflow-hidden bg-white hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="bg-red-50 px-3 py-1.5 border-b border-red-200">
                    <h5 className="text-xs font-bold text-red-700">BEFORE <ExternalLink className="h-3 w-3 inline ml-1" /></h5>
                  </div>
                  {enrichTestResult.project?.cover_image_url && (
                    <img src={enrichTestResult.project.cover_image_url} alt={enrichTestResult.project.name} className="w-full h-32 object-cover" />
                  )}
                  <div className="p-3 space-y-1">
                    <p className="font-semibold text-sm truncate">{enrichTestResult.project?.name}</p>
                    <p className="text-xs text-zinc-500">{enrichTestResult.project?.developer_name || "—"} • {enrichTestResult.project?.area_name || "—"}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-zinc-500 pt-1 border-t">
                      <span>📷 {enrichTestResult.before?.images_count || 0} images</span>
                      <span>📄 {enrichTestResult.before?.documents_count || 0} docs</span>
                      <span>🏗️ {enrichTestResult.before?.amenities_count || 0} amenities</span>
                      <span>📍 {enrichTestResult.before?.distances_count || 0} distances</span>
                      <span>⭐ {enrichTestResult.before?.usp_count || 0} USPs</span>
                      <span>❓ {enrichTestResult.before?.faqs_count || 0} FAQs</span>
                      <span>🏠 {enrichTestResult.before?.floor_plans_count || 0} floor plans</span>
                      <span>🔑 {enrichTestResult.before?.unit_types_count || 0} unit types</span>
                      <span>📝 {enrichTestResult.before?.has_description ? "✅" : "❌"} description</span>
                      <span>🎬 {enrichTestResult.before?.has_video ? "✅" : "❌"} video</span>
                      <span>💰 {enrichTestResult.before?.has_payment_plan ? "✅" : "❌"} payment</span>
                      <span>✨ {enrichTestResult.before?.highlights_count || 0} highlights</span>
                    </div>
                  </div>
                </a>

                {/* AFTER Card */}
                <a href={`/project/${enrichTestResult.project?.slug}`} target="_blank" rel="noopener noreferrer" className="block border border-green-200 rounded-xl overflow-hidden bg-white hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="bg-green-50 px-3 py-1.5 border-b border-green-200">
                    <h5 className="text-xs font-bold text-green-700">AFTER ENRICHMENT <ExternalLink className="h-3 w-3 inline ml-1" /></h5>
                  </div>
                  {enrichTestResult.project?.cover_image_url && (
                    <img src={enrichTestResult.project.cover_image_url} alt={enrichTestResult.project.name} className="w-full h-32 object-cover" />
                  )}
                  <div className="p-3 space-y-1">
                    <p className="font-semibold text-sm truncate">{enrichTestResult.project?.name}</p>
                    <p className="text-xs text-zinc-500">{enrichTestResult.project?.developer_name || "—"} • {enrichTestResult.project?.area_name || "—"}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] pt-1 border-t">
                      <span className={(enrichTestResult.after?.images_count || 0) > (enrichTestResult.before?.images_count || 0) ? "text-green-600 font-bold" : "text-zinc-500"}>
                        📷 {enrichTestResult.after?.images_count || 0} images {(enrichTestResult.after?.new_images || 0) > 0 && `(+${enrichTestResult.after!.new_images})`}
                      </span>
                      <span className={(enrichTestResult.after?.documents_count || 0) > (enrichTestResult.before?.documents_count || 0) ? "text-green-600 font-bold" : "text-zinc-500"}>
                        📄 {enrichTestResult.after?.documents_count || 0} docs {(enrichTestResult.after?.new_documents || 0) > 0 && `(+${enrichTestResult.after!.new_documents})`}
                      </span>
                      <span className={(enrichTestResult.after?.amenities_count || 0) > (enrichTestResult.before?.amenities_count || 0) ? "text-green-600 font-bold" : "text-zinc-500"}>
                        🏗️ {enrichTestResult.after?.amenities_count || 0} amenities
                      </span>
                      <span className={(enrichTestResult.after?.distances_count || 0) > (enrichTestResult.before?.distances_count || 0) ? "text-green-600 font-bold" : "text-zinc-500"}>
                        📍 {enrichTestResult.after?.distances_count || 0} distances
                      </span>
                      <span className={(enrichTestResult.after?.usp_count || 0) > (enrichTestResult.before?.usp_count || 0) ? "text-green-600 font-bold" : "text-zinc-500"}>
                        ⭐ {enrichTestResult.after?.usp_count || 0} USPs
                      </span>
                      <span className={(enrichTestResult.after?.faqs_count || 0) > (enrichTestResult.before?.faqs_count || 0) ? "text-green-600 font-bold" : "text-zinc-500"}>
                        ❓ {enrichTestResult.after?.faqs_count || 0} FAQs
                      </span>
                      <span className={(enrichTestResult.after?.floor_plans_count || 0) > (enrichTestResult.before?.floor_plans_count || 0) ? "text-green-600 font-bold" : "text-zinc-500"}>
                        🏠 {enrichTestResult.after?.floor_plans_count || 0} floor plans
                      </span>
                      <span className={(enrichTestResult.after?.unit_types_count || 0) > (enrichTestResult.before?.unit_types_count || 0) ? "text-green-600 font-bold" : "text-zinc-500"}>
                        🔑 {enrichTestResult.after?.unit_types_count || 0} unit types
                      </span>
                      <span className={enrichTestResult.after?.has_description && !enrichTestResult.before?.has_description ? "text-green-600 font-bold" : "text-zinc-500"}>
                        📝 {enrichTestResult.after?.has_description ? "✅" : "❌"} description
                      </span>
                      <span className={enrichTestResult.after?.has_video && !enrichTestResult.before?.has_video ? "text-green-600 font-bold" : "text-zinc-500"}>
                        🎬 {enrichTestResult.after?.has_video ? "✅" : "❌"} video
                      </span>
                      <span className={enrichTestResult.after?.has_payment_plan && !enrichTestResult.before?.has_payment_plan ? "text-green-600 font-bold" : "text-zinc-500"}>
                        💰 {enrichTestResult.after?.has_payment_plan ? "✅" : "❌"} payment
                      </span>
                      <span className={(enrichTestResult.after?.highlights_count || 0) > (enrichTestResult.before?.highlights_count || 0) ? "text-green-600 font-bold" : "text-zinc-500"}>
                        ✨ {enrichTestResult.after?.highlights_count || 0} highlights
                      </span>
                    </div>
                  </div>
                  {/* Gallery Preview */}
                  {(enrichTestResult.after?.gallery_preview?.length || 0) > 0 && (
                    <div className="px-3 pb-3">
                      <p className="text-[10px] text-green-600 font-semibold mb-1">New images found:</p>
                      <div className="flex gap-1">
                        {enrichTestResult.after!.gallery_preview!.map((url: string, i: number) => (
                          <img key={i} src={url} alt={`New ${i+1}`} className="w-16 h-12 object-cover rounded border border-green-300" />
                        ))}
                      </div>
                    </div>
                  )}
                </a>
              </div>

              {/* Enrichment Summary */}
              {(enrichTestResult.after?.amenities_count || 0) > 0 && (
                <div className="text-xs">
                  <p className="font-semibold mb-1">Enrichment summary: {enrichTestResult.after?.amenities_count || 0} amenities, {enrichTestResult.after?.faqs_count || 0} FAQs, {enrichTestResult.after?.floor_plans_count || 0} floor plans, {enrichTestResult.after?.unit_types_count || 0} unit types found</p>
                </div>
              )}

              {/* Apply Button */}
              {!enrichTestResult.applied && (
                <Button
                  onClick={async () => {
                    setIsEnrichApplying(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("enrich-project-test", {
                        body: { slug: enrichTestSlug.trim(), action: "apply" },
                      });
                      if (error) throw error;
                      if (data?.success) {
                        toast.success(`Enrichment applied! Updated: ${data.updates_applied?.join(", ") || "none"}, +${data.new_images} images, +${data.new_documents} docs`);
                        setEnrichTestResult(prev => prev ? { ...prev, applied: true } : prev);
                      } else {
                        toast.error(data?.error || "Apply failed");
                      }
                    } catch (err: any) {
                      toast.error(err.message || "Apply failed");
                    } finally {
                      setIsEnrichApplying(false);
                    }
                  }}
                  disabled={isEnrichApplying}
                  className="bg-green-600 hover:bg-green-700 text-white w-full"
                >
                  {isEnrichApplying ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve & Apply Enrichment
                </Button>
              )}
              {enrichTestResult.applied && (
                <Alert className="bg-green-50 border-green-300">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-700">Enrichment Applied</AlertTitle>
                  <AlertDescription className="text-green-600">
                    Data has been written to the database. View the project to verify.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {enrichTestResult && !enrichTestResult.success && (
            <Alert className="bg-red-50 border-red-300">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-700">Test Failed</AlertTitle>
              <AlertDescription className="text-red-600">{enrichTestResult.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ── AI Content Generation Section ── */}
      <Card className="bg-white border-2 border-purple-400">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            AI Content Generation
          </CardTitle>
          <CardDescription>
            Generate FAQs, highlights, USP bullets, payment breakdowns, and location distances using AI.
            Non-destructive — only fills empty fields. Processes 10 projects per batch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Stats */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setIsLoadingAiStats(true);
                try {
                  const { data, error } = await supabase.functions.invoke("ai-bulk-enrich", {
                    body: { action: "stats" },
                  });
                  if (error) throw error;
                  if (data?.success) {
                    setAiEnrichStats(data.stats);
                  } else {
                    toast.error(data?.error || "Failed to load AI stats");
                  }
                } catch (err: any) {
                  toast.error(err.message || "Failed to load AI stats");
                } finally {
                  setIsLoadingAiStats(false);
                }
              }}
              disabled={isLoadingAiStats}
            >
              {isLoadingAiStats ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Database className="h-4 w-4 mr-1" />}
              Check Status
            </Button>
            {aiEnrichStats && (
              <div className="text-xs text-zinc-600 space-x-2">
                <span><strong>{aiEnrichStats.missing_faqs}</strong> missing FAQs</span>
                <span>•</span>
                <span><strong>{aiEnrichStats.missing_highlights}</strong> missing highlights</span>
                <span>•</span>
                <span>{aiEnrichStats.with_payment} have payment plans</span>
                <span>•</span>
                <span>{aiEnrichStats.with_distances} have distances</span>
              </div>
            )}
          </div>

          {/* Run AI Enrichment - Single Batch */}
          <Button
            onClick={async () => {
              setIsAiEnriching(true);
              setAiEnrichResult(null);
              toast.info("Starting AI content generation... This may take 1-2 minutes per batch.");
              try {
                const { data, error } = await supabase.functions.invoke("ai-bulk-enrich", {
                  body: { limit: 25 },
                });
                if (error) throw error;
                setAiEnrichResult(data);
                if (data?.success) {
                  toast.success(`AI enriched ${data.enriched} of ${data.processed} projects`);
                } else {
                  toast.error(data?.error || "AI enrichment failed");
                }
              } catch (err: any) {
                toast.error(err.message || "AI enrichment failed");
                setAiEnrichResult({ success: false, error: err.message });
              } finally {
                setIsAiEnriching(false);
              }
            }}
            disabled={isAiEnriching || isFullAiRunning}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50 w-full"
          >
            {isAiEnriching ? (
              <><RefreshCw className="h-4 w-4 animate-spin mr-2" /> Generating AI Content...</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" /> Generate Content (AI) — 25 projects</>
            )}
          </Button>

          {/* FULL AI Enrichment Button */}
          {!isFullAiRunning ? (
            <Button
              onClick={async () => {
                setIsFullAiRunning(true);
                setFullAiStopRequested(false);
                setFullAiProgress({ processed: 0, enriched: 0, errors: 0 });
                setAiEnrichResult(null);
                toast.info("Starting FULL AI enrichment — processing ALL projects...");
                
                let totalProcessed = 0;
                let totalEnriched = 0;
                let totalErrors = 0;
                let keepGoing = true;
                
                while (keepGoing) {
                  try {
                    const { data, error } = await supabase.functions.invoke("ai-bulk-enrich", {
                      body: { limit: 25 },
                    });
                    if (error) throw error;
                    
                    const batchProcessed = data?.processed || 0;
                    const batchEnriched = data?.enriched || 0;
                    const batchErrors = data?.errors || 0;
                    
                    totalProcessed += batchProcessed;
                    totalEnriched += batchEnriched;
                    totalErrors += batchErrors;
                    
                    setFullAiProgress({ processed: totalProcessed, enriched: totalEnriched, errors: totalErrors });
                    
                    // Stop conditions
                    if (batchProcessed === 0 || batchEnriched === 0) {
                      toast.success(`Full AI enrichment complete! Enriched ${totalEnriched} projects total.`);
                      keepGoing = false;
                    }
                    
                    // Check for rate limit / credit exhaustion
                    if (data?.results?.some((r: any) => r.status === "rate_limited" || r.status === "credits_exhausted")) {
                      toast.warning("Rate limited or credits exhausted. Stopping.");
                      keepGoing = false;
                    }
                  } catch (err: any) {
                    totalErrors++;
                    setFullAiProgress({ processed: totalProcessed, enriched: totalEnriched, errors: totalErrors });
                    toast.error(`Batch error: ${err.message}`);
                    // Wait and retry once, then stop
                    await new Promise(r => setTimeout(r, 5000));
                    keepGoing = false;
                  }
                  
                  // Check stop flag (use ref-like check via DOM)
                  if ((document.getElementById("ai-stop-flag") as HTMLInputElement)?.value === "stop") {
                    toast.info(`AI enrichment stopped by user. Enriched ${totalEnriched} projects.`);
                    keepGoing = false;
                  }
                }
                
                setIsFullAiRunning(false);
                setAiEnrichResult({
                  success: true,
                  processed: totalProcessed,
                  enriched: totalEnriched,
                  errors: totalErrors,
                  message: `Full run complete: ${totalEnriched} enriched, ${totalErrors} errors`,
                });
              }}
              disabled={isAiEnriching}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full font-bold"
            >
              <Zap className="h-4 w-4 mr-2" /> 🚀 FULL AI Enrichment — ALL Projects
            </Button>
          ) : (
            <div className="space-y-2">
              <input type="hidden" id="ai-stop-flag" value={fullAiStopRequested ? "stop" : ""} />
              <div className="bg-purple-50 border border-purple-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-purple-800 text-sm flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" /> AI Enrichment Running...
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setFullAiStopRequested(true)}
                  >
                    <Pause className="h-3 w-3 mr-1" /> Stop
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-white rounded p-2">
                    <p className="text-xl font-bold text-purple-700">{fullAiProgress.processed}</p>
                    <p className="text-xs text-zinc-500">Processed</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-xl font-bold text-emerald-600">{fullAiProgress.enriched}</p>
                    <p className="text-xs text-zinc-500">Enriched</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-xl font-bold text-red-500">{fullAiProgress.errors}</p>
                    <p className="text-xs text-zinc-500">Errors</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Results */}
          {aiEnrichResult && aiEnrichResult.success && (
            <Alert className="bg-purple-50 border-purple-300">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <AlertTitle className="text-purple-700">AI Generation Complete</AlertTitle>
              <AlertDescription className="text-purple-600 space-y-1">
                <p><strong>{aiEnrichResult.processed}</strong> projects processed, <strong>{aiEnrichResult.enriched}</strong> enriched</p>
                {aiEnrichResult.results && aiEnrichResult.results.filter(r => r.status === "success").length > 0 && (
                  <div className="text-xs mt-1 max-h-32 overflow-y-auto">
                    {aiEnrichResult.results.filter(r => r.status === "success").map((r, i) => (
                      <p key={i}>✅ {r.name}: {r.fields.join(", ")}</p>
                    ))}
                  </div>
                )}
                {(aiEnrichResult.errors || 0) > 0 && (
                  <p className="text-amber-600">⚠️ {aiEnrichResult.errors} errors</p>
                )}
                {aiEnrichResult.message && <p className="italic">{aiEnrichResult.message}</p>}
              </AlertDescription>
            </Alert>
          )}

          {aiEnrichResult && !aiEnrichResult.success && (
            <Alert className="bg-red-50 border-red-300">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-700">AI Generation Failed</AlertTitle>
              <AlertDescription className="text-red-600">{aiEnrichResult.error}</AlertDescription>
            </Alert>
          )}

          {aiEnrichResult?.error_details && aiEnrichResult.error_details.length > 0 && (
            <div className="text-xs text-zinc-500 max-h-32 overflow-y-auto bg-zinc-50 p-2 rounded border">
              <p className="font-semibold mb-1">Error details:</p>
              {aiEnrichResult.error_details.map((e, i) => <p key={i}>• {e}</p>)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Provident Document Extraction Section ── */}
      <Card className="bg-white border-2 border-teal-400">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CloudDownload className="h-5 w-5 text-teal-500" />
            Fetch Images & Docs (Provident)
          </CardTitle>
          <CardDescription>
            Fetch brochures, floor plans, payment plan PDFs from Provident's free page-data endpoint. 
            Images fetched via Firecrawl if available. Processes 25 projects per batch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Single Batch */}
          <Button
            onClick={async () => {
              setIsProvidentExtracting(true);
              setProvidentResult(null);
              setProvidentProjectResults([]);
              toast.info("Starting Provident document extraction...");
              try {
                const { data, error } = await supabase.functions.invoke("provident-batch-extract", {
                  body: { limit: 25 },
                });
                if (error) throw error;
                setProvidentResult(data);
                if (data?.results) setProvidentProjectResults(data.results);
                if (data?.total_docs_inserted > 0 || data?.total_images_inserted > 0) {
                  toast.success(`Provident: +${data.total_docs_inserted} docs, +${data.total_images_inserted} images from ${data.processed} projects`);
                } else {
                  toast.info(`Processed ${data?.processed || 0} projects. No new docs/images matched.`);
                }
              } catch (err: any) {
                toast.error(err.message || "Provident extraction failed");
                setProvidentResult({ error: err.message });
              } finally {
                setIsProvidentExtracting(false);
              }
            }}
            disabled={isProvidentExtracting || isFullProvidentRunning}
            variant="outline"
            className="border-teal-300 text-teal-700 hover:bg-teal-50 w-full"
          >
            {isProvidentExtracting ? (
              <><RefreshCw className="h-4 w-4 animate-spin mr-2" /> Extracting from Provident...</>
            ) : (
              <><CloudDownload className="h-4 w-4 mr-2" /> Fetch Images & Docs (Provident) — 25 projects</>
            )}
          </Button>

          {/* FULL Provident Extraction */}
          {!isFullProvidentRunning ? (
            <Button
              onClick={async () => {
                setIsFullProvidentRunning(true);
                setFullProvidentStopRequested(false);
                setFullProvidentProgress({ processed: 0, docs: 0, images: 0, errors: 0 });
                setProvidentResult(null);
                toast.info("Starting FULL Provident extraction — processing ALL projects...");
                
                let totalProcessed = 0;
                let totalDocs = 0;
                let totalImages = 0;
                let totalErrors = 0;
                let keepGoing = true;
                
                while (keepGoing) {
                  try {
                    const { data, error } = await supabase.functions.invoke("provident-batch-extract", {
                      body: { limit: 25 },
                    });
                    if (error) throw error;
                    
                    const batchProcessed = data?.processed || 0;
                    totalProcessed += batchProcessed;
                    totalDocs += data?.total_docs_inserted || 0;
                    totalImages += data?.total_images_inserted || 0;
                    totalErrors += data?.errors || 0;
                    
                    // Accumulate per-project results
                    if (data?.results) {
                      setProvidentProjectResults(prev => [...prev, ...data.results]);
                    }
                    
                    setFullProvidentProgress({ processed: totalProcessed, docs: totalDocs, images: totalImages, errors: totalErrors });
                    
                    if (batchProcessed === 0) {
                      toast.success(`Full Provident extraction complete! +${totalDocs} docs, +${totalImages} images from ${totalProcessed} projects.`);
                      keepGoing = false;
                    }
                    
                    // Check for Firecrawl credit exhaustion
                    if (data?.results?.some((r: any) => r.errors?.includes("FIRECRAWL_CREDITS_EXHAUSTED"))) {
                      toast.warning("Firecrawl credits exhausted. Documents still extracted. Stopping image fetch.");
                      keepGoing = false;
                    }
                  } catch (err: any) {
                    totalErrors++;
                    setFullProvidentProgress({ processed: totalProcessed, docs: totalDocs, images: totalImages, errors: totalErrors });
                    toast.error(`Batch error: ${err.message}`);
                    await new Promise(r => setTimeout(r, 5000));
                    keepGoing = false;
                  }
                  
                  if ((document.getElementById("provident-stop-flag") as HTMLInputElement)?.value === "stop") {
                    toast.info(`Provident extraction stopped. +${totalDocs} docs, +${totalImages} images.`);
                    keepGoing = false;
                  }
                }
                
                setIsFullProvidentRunning(false);
                setProvidentResult({
                  processed: totalProcessed,
                  total_docs_inserted: totalDocs,
                  total_images_inserted: totalImages,
                  errors: totalErrors,
                });
              }}
              disabled={isProvidentExtracting}
              className="bg-teal-600 hover:bg-teal-700 text-white w-full font-bold"
            >
              <CloudDownload className="h-4 w-4 mr-2" /> 🚀 FULL Provident Extraction — ALL Projects
            </Button>
          ) : (
            <div className="space-y-2">
              <input type="hidden" id="provident-stop-flag" value={fullProvidentStopRequested ? "stop" : ""} />
              <div className="bg-teal-50 border border-teal-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-teal-800 text-sm flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Provident Extraction Running...
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setFullProvidentStopRequested(true)}
                  >
                    <Pause className="h-3 w-3 mr-1" /> Stop
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div className="bg-white rounded p-2">
                    <p className="text-xl font-bold text-teal-700">{fullProvidentProgress.processed}</p>
                    <p className="text-xs text-zinc-500">Processed</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-xl font-bold text-emerald-600">{fullProvidentProgress.docs}</p>
                    <p className="text-xs text-zinc-500">Docs</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-xl font-bold text-blue-600">{fullProvidentProgress.images}</p>
                    <p className="text-xs text-zinc-500">Images</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-xl font-bold text-red-500">{fullProvidentProgress.errors}</p>
                    <p className="text-xs text-zinc-500">Errors</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {providentResult && !providentResult.error && (
            <div className="space-y-3">
              <Alert className="bg-teal-50 border-teal-300">
                <CheckCircle className="h-4 w-4 text-teal-600" />
                <AlertTitle className="text-teal-700">Provident Extraction Complete</AlertTitle>
                <AlertDescription className="text-teal-600 space-y-1">
                  <p><strong>{providentResult.processed}</strong> projects checked</p>
                  <p>📄 <strong>+{providentResult.total_docs_inserted || 0}</strong> documents inserted</p>
                  <p>📷 <strong>+{providentResult.total_images_inserted || 0}</strong> images inserted</p>
                  {(providentResult.errors || 0) > 0 && (
                    <p className="text-amber-600">⚠️ {providentResult.errors} errors</p>
                  )}
                </AlertDescription>
              </Alert>
              {/* Per-project result cards */}
              {providentProjectResults.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {providentProjectResults.map((r, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                      (r.docs_inserted > 0 || r.images_inserted > 0) ? "border-green-200 bg-green-50" :
                      r.errors.length > 0 ? "border-red-200 bg-red-50" :
                      "border-zinc-200 bg-zinc-50"
                    }`}>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{r.name}</p>
                        <div className="flex gap-3 text-xs text-zinc-600 mt-0.5">
                          <span className={r.pdfs_found > 0 ? "text-blue-600" : ""}>📄 {r.pdfs_found} PDFs found</span>
                          <span className={r.docs_inserted > 0 ? "text-green-600 font-bold" : ""}>+{r.docs_inserted} docs</span>
                          <span className={r.images_found > 0 ? "text-blue-600" : ""}>📷 {r.images_found} imgs found</span>
                          <span className={r.images_inserted > 0 ? "text-green-600 font-bold" : ""}>+{r.images_inserted} imgs</span>
                        </div>
                        {r.errors.length > 0 && (
                          <p className="text-xs text-red-500 mt-0.5 truncate">{r.errors[0]}</p>
                        )}
                      </div>
                      <Badge variant={(r.docs_inserted > 0 || r.images_inserted > 0) ? "default" : r.errors.length > 0 ? "destructive" : "secondary"} className="flex-shrink-0">
                        {(r.docs_inserted > 0 || r.images_inserted > 0) ? "✅" : r.errors.length > 0 ? "⚠️" : "—"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {providentResult?.error && (
            <Alert className="bg-red-50 border-red-300">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-700">Extraction Failed</AlertTitle>
              <AlertDescription className="text-red-600">{providentResult.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ── Bulk Enrichment (Reelly API) - kept as legacy ── */}
      <Card className="bg-white border-2 border-amber-400">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Bulk Enrichment (Reelly API)
          </CardTitle>
          <CardDescription>
            Enrich from Reelly API detail endpoint. Note: API returns limited data (no gallery/docs). 
            Use AI Content Generation and Provident Extraction above for better results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setIsLoadingBulkStats(true);
                try {
                  const { data, error } = await supabase.functions.invoke("reelly-bulk-enrich", {
                    body: { action: "stats" },
                  });
                  if (error) throw error;
                  if (data?.success) {
                    setBulkEnrichStats(data.stats);
                  } else {
                    toast.error(data?.error || "Failed to load stats");
                  }
                } catch (err: any) {
                  toast.error(err.message || "Failed to load stats");
                } finally {
                  setIsLoadingBulkStats(false);
                }
              }}
              disabled={isLoadingBulkStats}
            >
              {isLoadingBulkStats ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Database className="h-4 w-4 mr-1" />}
              Check Status
            </Button>
            {bulkEnrichStats && (
              <div className="text-xs text-zinc-600 space-x-3">
                <span><strong>{bulkEnrichStats.projects_needing_enrichment}</strong> need enrichment</span>
                <span>•</span>
                <span>{bulkEnrichStats.total_images} images</span>
                <span>•</span>
                <span>{bulkEnrichStats.total_documents} docs</span>
              </div>
            )}
          </div>
          <Button
            onClick={async () => {
              setIsBulkEnriching(true);
              setBulkEnrichResult(null);
              toast.info("Starting bulk enrichment...");
              try {
                const { data, error } = await supabase.functions.invoke("reelly-bulk-enrich", {
                  body: { limit: 50 },
                });
                if (error) throw error;
                setBulkEnrichResult(data);
                if (data?.success) {
                  toast.success(`Enriched ${data.processed} projects: +${data.images_added} images, +${data.docs_added} docs, +${data.fields_updated} fields`);
                } else {
                  toast.error(data?.error || "Enrichment failed");
                }
              } catch (err: any) {
                toast.error(err.message || "Bulk enrichment failed");
                setBulkEnrichResult({ success: false, error: err.message });
              } finally {
                setIsBulkEnriching(false);
              }
            }}
            disabled={isBulkEnriching}
            className="bg-amber-600 hover:bg-amber-700 text-white w-full"
          >
            {isBulkEnriching ? (
              <><RefreshCw className="h-4 w-4 animate-spin mr-2" /> Enriching...</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" /> Run Reelly Bulk Enrichment (50 projects)</>
            )}
          </Button>
          {bulkEnrichResult && bulkEnrichResult.success && (
            <div className="space-y-3">
              <Alert className="bg-green-50 border-green-300">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-700">Enrichment Complete</AlertTitle>
                <AlertDescription className="text-green-600 space-y-1">
                  <p><strong>{bulkEnrichResult.processed}</strong> projects processed</p>
                  <p>📷 +{bulkEnrichResult.images_added} images, 📄 +{bulkEnrichResult.docs_added} docs, 📝 +{bulkEnrichResult.fields_updated} fields</p>
                  {(bulkEnrichResult.errors || 0) > 0 && <p className="text-amber-600">⚠️ {bulkEnrichResult.errors} errors</p>}
                </AlertDescription>
              </Alert>
              {/* Per-project result cards */}
              {bulkEnrichResult.results && bulkEnrichResult.results.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {bulkEnrichResult.results.map((r, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                      r.status === "success" ? "border-green-200 bg-green-50" :
                      r.status === "api_empty" ? "border-zinc-200 bg-zinc-50" :
                      "border-red-200 bg-red-50"
                    }`}>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{r.name}</p>
                        <div className="flex gap-3 text-xs text-zinc-600 mt-0.5">
                          <span className={r.images > 0 ? "text-green-600 font-bold" : ""}>📷 +{r.images}</span>
                          <span className={r.docs > 0 ? "text-green-600 font-bold" : ""}>📄 +{r.docs}</span>
                          <span className={r.fields > 0 ? "text-green-600 font-bold" : ""}>📝 +{r.fields}</span>
                        </div>
                      </div>
                      <Badge variant={r.status === "success" ? "default" : r.status === "api_empty" ? "secondary" : "destructive"} className="flex-shrink-0">
                        {r.status === "success" ? "✅" : r.status === "api_empty" ? "Empty API" : r.status === "no_data" ? "No Data" : "Error"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {bulkEnrichResult && !bulkEnrichResult.success && (
            <Alert className="bg-red-50 border-red-300">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-700">Failed</AlertTitle>
              <AlertDescription className="text-red-600">{bulkEnrichResult.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

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
