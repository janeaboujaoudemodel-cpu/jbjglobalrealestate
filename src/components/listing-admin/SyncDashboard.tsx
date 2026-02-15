import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Loader2, 
  Clock, 
  Image, 
  FileText, 
  Play,
  Pause,
  Database,
  TrendingUp,
  XCircle,
  FlaskConical,
  Lock
} from "lucide-react";

// Filled check circle component for better visibility
const FilledCheckCircle = ({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) => (
  <div className={`rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 ${size === "sm" ? "w-4 h-4" : "w-5 h-5"} ${className || ""}`}>
    <Check className={`text-white ${size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"}`} />
  </div>
);
import { toast } from "sonner";
import { SarahTestPanel } from "./SarahTestPanel";
import { ProjectApprovalQueue } from "./ProjectApprovalQueue";
import { DeveloperApprovalQueue } from "./DeveloperApprovalQueue";
import { TestOneListingPanel } from "./TestOneListingPanel";
import { SyncHistoryLog } from "./SyncHistoryLog";
import { ImageFinderPanel } from "./ImageFinderPanel";

interface SyncStats {
  page: number;
  extracted: number;
  created: number;
  updated: number;
  skipped: number;
  images: number;
}

type SyncPageOptions = {
  testMode?: boolean;
  force?: boolean;
};

interface PageStatus {
  page: number;
  status: 'pending' | 'in_progress' | 'success' | 'failed';
  stats?: SyncStats;
  error?: string;
  timestamp?: string;
}

interface SyncJob {
  id: string;
  job_type: string;
  // Must match DB constraint: pending | running | paused | completed | failed
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  current_page: number;
  total_pages: number;
  stats_created: number;
  stats_updated: number;
  stats_skipped: number;
  stats_images: number;
  stats_extracted: number;
  started_at: string | null;
  paused_at: string | null;
  completed_at: string | null;
}

interface SyncDashboardProps {
  onClose?: () => void;
}

export const SyncDashboard = ({ onClose }: SyncDashboardProps) => {
  const [searchParams] = useSearchParams();
  // UI estimate only (the source website fluctuates)
  const [listingsEstimate, setListingsEstimate] = useState<number>(1336);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearingPending, setIsClearingPending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(89);
  const [detectedTotalPages, setDetectedTotalPages] = useState<number | null>(89);
  const [isDetectingPages, setIsDetectingPages] = useState(false);
  
  // Initialize pageStatuses from sessionStorage if available
  const [pageStatuses, setPageStatuses] = useState<PageStatus[]>(() => {
    try {
      const saved = sessionStorage.getItem("sync_page_statuses");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch { /* ignore */ }
    return Array.from({ length: 89 }, (_, i) => ({
      page: i + 1,
      status: "pending" as const,
    }));
  });
  
  const [totalStats, setTotalStats] = useState(() => {
    try {
      const saved = sessionStorage.getItem("sync_total_stats");
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return { created: 0, updated: 0, skipped: 0, images: 0, extracted: 0 };
  });
  
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [pendingQueueCount, setPendingQueueCount] = useState<number | null>(null);
  const [queueBreakdown, setQueueBreakdown] = useState<{
    // All queue rows (all statuses)
    total: number | null;
    pending: number | null;
    approved: number | null;
    rejected: number | null;
    merged: number | null;
    // Sub-breakdown of ONLY pending queue rows
    ready_pending: number | null;
    needs_extraction_pending: number | null;
    incomplete_pending: number | null;
    errors_pending: number | null;
  }>({
    total: null,
    pending: null,
    approved: null,
    rejected: null,
    merged: null,
    ready_pending: null,
    needs_extraction_pending: null,
    incomplete_pending: null,
    errors_pending: null,
  });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>("");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);
  // CRITICAL: Bulk extraction is locked until user approves a test extraction
  const [isTestApproved, setIsTestApproved] = useState(() => {
    try {
      return sessionStorage.getItem("bulk_extraction_approved") === "true";
    } catch {
      return false;
    }
  });
  const syncTabFromUrl = searchParams.get("syncTab");
  const initialTab =
    syncTabFromUrl && ["sync", "approvals", "developers", "test", "history", "images"].includes(syncTabFromUrl)
      ? syncTabFromUrl
      : "sync";

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
    // Only react to URL changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncTabFromUrl]);
  // Turbo removes UI delays and backend per-project throttling.
  const [turboMode, setTurboMode] = useState(true);

  // Bulk extract runner (processes pending queue placeholders / incomplete entries)
  const [isBulkExtractRunning, setIsBulkExtractRunning] = useState(false);
  const bulkStopRef = useRef(false);
  const [bulkLastRun, setBulkLastRun] = useState<{
    processed: number;
    success: number;
    errors: number;
    images: number;
    documents: number;
    duration_ms: number;
  } | null>(null);
  const [bulkTotals, setBulkTotals] = useState({ processed: 0, success: 0, errors: 0 });

  // CRITICAL: Credits exhausted flag - shown as a banner and disables extraction
  // Persisted so we don't keep re-trying credit-burning calls after navigation/refresh.
  const [creditsExhausted, setCreditsExhausted] = useState(() => {
    try {
      return sessionStorage.getItem("firecrawl_credits_exhausted") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (creditsExhausted) sessionStorage.setItem("firecrawl_credits_exhausted", "true");
      else sessionStorage.removeItem("firecrawl_credits_exhausted");
    } catch {
      /* ignore */
    }
  }, [creditsExhausted]);

  // Fix All runner - both pending extraction AND approved project image repairs
  const [isFixAllRunning, setIsFixAllRunning] = useState(() => {
    try {
      return sessionStorage.getItem("fix_all_running") === "true";
    } catch {
      return false;
    }
  });
  const fixAllStopRef = useRef(false);
  const [fixAllStats, setFixAllStats] = useState<{
    pending_processed: number;
    pending_success: number;
    pending_errors: number;
    approved_repaired: number;
    approved_errors: number;
    metadata_repaired?: number;
    images_repaired?: number;
    documents_repaired?: number;
  } | null>(null);

  const [isRebuildingQueue, setIsRebuildingQueue] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [rebuildResult, setRebuildResult] = useState<{
    discovered_urls?: number;
    queued_for_scraping?: number;
    new_urls?: number;
    existing_urls?: number;
  } | null>(null);
  
  const isPausedRef = useRef(false);
  const isSyncingRef = useRef(false);

  // Derived UI metrics (avoid confusing “0 extracted” states)
  const pendingInQueue = queueBreakdown.pending ?? 0;
  const discoveredTotal = queueBreakdown.total ?? pendingInQueue;
  const needsExtraction = queueBreakdown.needs_extraction_pending ?? 0;
  const extractedCore = Math.max(0, pendingInQueue - needsExtraction);
  const needsWorkTotal =
    (queueBreakdown.needs_extraction_pending ?? 0) +
    (queueBreakdown.incomplete_pending ?? 0) +
    (queueBreakdown.errors_pending ?? 0);
  const estimateGap = Math.max(0, (listingsEstimate ?? 0) - (discoveredTotal ?? 0));

  const refreshPageCount = useCallback(
    async (opts?: { silent?: boolean }): Promise<number | null> => {
      setIsDetectingPages(true);
      try {
        const { data, error } = await supabase.functions.invoke("provident-page-count", {
          body: {},
        });

        if (error) throw error;

        const pages = Number(data?.total_pages ?? 0);
        if (!pages || pages < 1) throw new Error("Could not detect total pages");

        const estListings = Number(data?.estimated_listings ?? 0);
        if (estListings && estListings > 1000 && estListings < 10000) {
          setListingsEstimate(estListings);
        }

        setDetectedTotalPages(pages);

        // Only overwrite the working total when there's no active job running.
        if (!currentJobId && !isSyncingRef.current) {
          setTotalPages(pages);
        }

        if (!opts?.silent) {
          toast.success(`Updated page count: ${pages} pages detected`);
        }

        return pages;
      } catch (e: any) {
        if (!opts?.silent) toast.error(e?.message || "Failed to detect page count");
        return null;
      } finally {
        setIsDetectingPages(false);
      }
    },
    [currentJobId]
  );

  // Initialize page statuses when totalPages changes (but don't wipe while syncing or if already loaded from sessionStorage).
  useEffect(() => {
    if (isSyncingRef.current) return;
    // Only reset if the current array doesn't already have entries for the right number of pages
    setPageStatuses((prev) => {
      if (prev.length === totalPages) return prev;
      return Array.from({ length: totalPages }, (_, i) => ({
        page: i + 1,
        status: "pending" as const,
      }));
    });
  }, [totalPages]);

  // Persist pageStatuses + totalStats to sessionStorage whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem("sync_page_statuses", JSON.stringify(pageStatuses));
    } catch { /* ignore */ }
  }, [pageStatuses]);

  useEffect(() => {
    try {
      sessionStorage.setItem("sync_total_stats", JSON.stringify(totalStats));
    } catch { /* ignore */ }
  }, [totalStats]);

  // On mount: load counts + detect current page count + resume any active job.
  // CRITICAL: Clear stale sessionStorage to fix count mismatch issues
  useEffect(() => {
    // Clear potentially stale cached stats on mount
    try {
      sessionStorage.removeItem("sync_page_statuses");
      sessionStorage.removeItem("sync_total_stats");
    } catch { /* ignore */ }
    
    loadProjectCount();
    refreshPageCount({ silent: true });
    loadActiveJob();

    // AUTO-RESUME: If Fix All was running when user navigated away, resume it now.
    if (sessionStorage.getItem("fix_all_running") === "true") {
      console.log("[SyncDashboard] Auto-resuming Fix All from previous session...");
      setTimeout(() => {
        startFixAllRunner(true); // true = silent resume (no confirm dialog)
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to realtime updates on sync_jobs
  useEffect(() => {
    const channel = supabase
      .channel('sync_jobs_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_jobs'
        },
        (payload) => {
          if (payload.new && (payload.new as SyncJob).id === currentJobId) {
            const job = payload.new as SyncJob;
            setCurrentPage(job.current_page);
            setTotalStats({
              created: job.stats_created || 0,
              updated: job.stats_updated || 0,
              skipped: job.stats_skipped || 0,
              images: job.stats_images || 0,
              extracted: job.stats_extracted || 0
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentJobId]);

  const loadProjectCount = async () => {
    const [
      projectsRes,
      pendingRes,
      approvedRes,
      rejectedRes,
      mergedRes,
      needsRes,
      incompleteRes,
      errorsRes,
      // NEW: strictly ready = has images + docs + description + valid developer
      strictlyReadyRes,
    ] = await Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("pending_project_imports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("pending_project_imports").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("pending_project_imports").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      supabase.from("pending_project_imports").select("id", { count: "exact", head: true }).eq("status", "merged"),
      supabase
        .from("pending_project_imports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .ilike("review_notes", "%PENDING_SCRAPE%"),
      supabase
        .from("pending_project_imports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("review_notes", "INCOMPLETE"),
      supabase
        .from("pending_project_imports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .ilike("review_notes", "ERROR:%"),
      // Strict completeness: images + description + developer (documents optional for Reelly imports)
      supabase
        .from("pending_project_imports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .is("review_notes", null)
        .not("description", "is", null)
        .neq("description", "")
        .not("developer_name", "is", null)
        .neq("developer_name", "")
        .not("developer_name", "ilike", "unknown")
        .not("images", "is", null)
        .not("images", "eq", "[]"),
    ]);

    const pending = pendingRes.count ?? null;
    const approved = approvedRes.count ?? null;
    const rejected = rejectedRes.count ?? null;
    const merged = mergedRes.count ?? null;
    const total =
      pending === null || approved === null || rejected === null || merged === null
        ? null
        : pending + approved + rejected + merged;

    const needs = needsRes.count ?? 0;
    const incomplete = incompleteRes.count ?? 0;
    const errors = errorsRes.count ?? 0;
    // Now use strict completeness from DB
    const readyPending = strictlyReadyRes.count ?? 0;

    setProjectCount(projectsRes.count);
    setPendingQueueCount(pending);
    setQueueBreakdown({
      total,
      pending,
      approved,
      rejected,
      merged,
      ready_pending: readyPending,
      needs_extraction_pending: needs,
      incomplete_pending: incomplete,
      errors_pending: errors,
    });
  };

  const loadActiveJob = async () => {
    // Find any running (in_progress) or paused job
    const { data: jobs, error } = await supabase
      .from("sync_jobs")
      .select("*")
      .in("status", ["running", "paused"])
      .eq("job_type", "provident_sync")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error loading active job:", error);
      return;
    }

    if (jobs && jobs.length > 0) {
      const job = jobs[0] as SyncJob;
      const jobTotalPages = job.total_pages || totalPages;
      setTotalPages(jobTotalPages);
      setCurrentJobId(job.id);
      setCurrentPage(job.current_page);
      setTotalStats({
        created: job.stats_created || 0,
        updated: job.stats_updated || 0,
        skipped: job.stats_skipped || 0,
        images: job.stats_images || 0,
        extracted: job.stats_extracted || 0
      });
      
      if (job.status === "paused") {
        setIsPaused(true);
        // Mark completed pages as success
        setPageStatuses(prev => prev.map(p => ({
          ...p,
          status: p.page <= job.current_page ? 'success' : 'pending'
        })));
        toast.info(`Found paused sync at page ${job.current_page}. Click Resume to continue.`);
      } else if (job.status === "running") {
        // IMPORTANT: Do NOT auto-resume a running job when the admin opens the dashboard.
        // This was making the dashboard feel "stuck" (other actions disable while syncing)
        // and it immediately starts syncing old pages.
        // Instead, we pause it and let the admin explicitly click Resume.

        setIsPaused(true);
        isPausedRef.current = true;
        setIsSyncing(false);
        isSyncingRef.current = false;

        setPageStatuses((prev) =>
          prev.map((p) => ({
            ...p,
            status: p.page <= job.current_page ? "success" : "pending",
          })),
        );

        // Keep DB state consistent so other screens don't show a phantom "running" job.
        const { error: pauseErr } = await supabase
          .from("sync_jobs")
          .update({ status: "paused", paused_at: new Date().toISOString() })
          .eq("id", job.id);

        if (pauseErr) {
          console.error("Error pausing active job:", pauseErr);
        }

        toast.info(
          `Found an in-progress sync at page ${job.current_page}. It has been paused so you can run Queue actions. Click Resume when ready.`,
        );
      }

      // If source pages increased since this job started, inform the admin.
      if (detectedTotalPages && detectedTotalPages > jobTotalPages) {
        toast.info(
          `Source portal now has ${detectedTotalPages} pages. Your current job is ${jobTotalPages} pages. Start a new full sync later to capture the new pages.`
        );
      }
    }
  };

  const updatePageStatus = (page: number, update: Partial<PageStatus>) => {
    setPageStatuses(prev => prev.map(p => 
      p.page === page ? { ...p, ...update } : p
    ));
  };

  const updateJobProgress = async (jobId: string, page: number, stats: { created: number; updated: number; skipped: number; images: number; extracted: number }) => {
    await supabase
      .from("sync_jobs")
      .update({
        current_page: page,
        stats_created: stats.created,
        stats_updated: stats.updated,
        stats_skipped: stats.skipped,
        stats_images: stats.images,
        stats_extracted: stats.extracted,
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId);
  };

  const syncPage = async (page: number, options?: SyncPageOptions, jobIdOverride?: string): Promise<SyncStats | null> => {
    updatePageStatus(page, { status: 'in_progress' });
    
    // Use the provided jobId or current active job
    const jobIdToUse = jobIdOverride || currentJobId;
    
    try {
      // Batch the page so we actually process ALL listings on the page.
      // The backend returns remaining_urls + next_start_index so we can loop safely.
      const batchSize = options?.testMode ? 1 : (turboMode ? 10 : 3);
      let startIndex = 0;
      let remaining = 1;
      let guard = 0;

      const aggregated: SyncStats = {
        page,
        extracted: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        images: 0,
      };

      while (remaining > 0 && guard < 999) {
        guard++;

        // CRITICAL: freshStart must ONLY be true once at the beginning of a full run.
        // Sending freshStart=true for every batch causes repeated re-processing / queue churn.
        const isFirstBatchOfFullRun = page === 1 && startIndex === 0 && guard === 1;

        const { data, error } = await supabase.functions.invoke("sync-provident-page", {
          body: {
            page,
            startIndex,
            batchSize,
            throttleMs: turboMode ? 0 : 800,
            jobId: jobIdToUse,
            freshStart: isFirstBatchOfFullRun,
            ...(options || {}),
          }
        });

        if (error) throw error;

        const stats = data?.stats;
        if (stats) {
          aggregated.extracted += stats.extracted || 0;
          aggregated.created += stats.created || 0;
          aggregated.updated += stats.updated || 0;
          aggregated.skipped += stats.skipped || 0;
          aggregated.images += stats.images || 0;
        }

        const nextStart = Number(data?.next_start_index ?? startIndex + batchSize);
        remaining = Number(data?.remaining_urls ?? 0);

        // Safety: if the backend didn't advance, stop to prevent infinite loops.
        if (nextStart <= startIndex && remaining > 0) {
          console.warn(`Page ${page}: batching stalled at startIndex=${startIndex}`);
          break;
        }

        startIndex = nextStart;

        // Delay between batches (disabled in Turbo).
        const batchDelayMs = turboMode ? 0 : 600;
        if (remaining > 0 && batchDelayMs > 0) {
          await new Promise((r) => setTimeout(r, batchDelayMs));
        }
      }

      updatePageStatus(page, {
        status: 'success',
        stats: aggregated,
        timestamp: new Date().toISOString(),
      });

      return aggregated;
    } catch (err: any) {
      console.error(`Page ${page} failed:`, err);
      updatePageStatus(page, { 
        status: 'failed', 
        error: err.message || 'Network error',
        timestamp: new Date().toISOString()
      });
      return null;
    }
  };

  const calculateTimeRemaining = useCallback((completedPages: number, elapsedMs: number, pagesTotal: number) => {
    if (completedPages === 0) return "Calculating...";
    
    const avgTimePerPage = elapsedMs / completedPages;
    const remainingPages = pagesTotal - completedPages;
    const remainingMs = avgTimePerPage * remainingPages;
    
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `~${hours}h ${mins}m remaining`;
    }
    
    return `~${minutes}m ${seconds}s remaining`;
  }, []);

  // Clear pending queue (mark as rejected) and start fresh
  const clearPendingAndStartFresh = async () => {
    if (isSyncing || isClearingPending) return;

    // Guardrail: this flow triggers a full sync after clearing, which requires credits.
    if (creditsExhausted) {
      toast.error("Credits are exhausted — clear/start-fresh is disabled to avoid burning credits.");
      return;
    }

    const confirmed = window.confirm(
      "This will:\n" +
      "1. Delete ALL pending + rejected imports (clean rebuild)\n" +
      "2. Start a new full sync from page 1\n\n" +
      "Your already-approved projects will NOT be affected.\n\n" +
      "Continue?"
    );
    if (!confirmed) return;

    setIsClearingPending(true);

    // 1. Hard-reset queue (prevents duplicate slugs across runs)
    const { data, error: resetError } = await supabase.functions.invoke("reset-project-import-queue", {
      body: { preserveApproved: true },
    });

    if (resetError) {
      console.error("Failed to reset import queue:", resetError);
      toast.error("Failed to reset import queue");
      setIsClearingPending(false);
      return;
    }

    toast.success(`Queue reset (${data?.deleted ?? 0} removed)`);
    await loadProjectCount();
    setIsClearingPending(false);

    // 2. Start a new sync from page 1
    await startFullSync();
  };

  // FULL WIPE & REBUILD - Complete database reset and rediscovery of all 1336 listings
  const fullWipeAndRebuild = async () => {
    if (isSyncing || isWiping || isBulkExtractRunning) return;

    // Guardrail: this flow uses Firecrawl MAP + extraction and will burn credits.
    if (creditsExhausted) {
      toast.error("Credits are exhausted — full wipe & rebuild is disabled to avoid burning credits.");
      return;
    }

    const confirmed = window.confirm(
      "⚠️ FULL WIPE & REBUILD ⚠️\n\n" +
      "This will:\n" +
      "1) DELETE ALL projects, images, and documents from the database\n" +
      "2) CLEAR the entire queue\n" +
      "3) RE-DISCOVER all 1,336 project URLs from the source portal\n" +
      "4) Queue them all for fresh extraction\n\n" +
      "Manual projects (without source_url) will be PRESERVED.\n\n" +
      "This is a destructive operation. Continue?"
    );
    if (!confirmed) return;

    setIsWiping(true);
    toast.info("Starting full wipe and rebuild...");

    try {
      // Step 1: Wipe everything
      const { data: wipeData, error: wipeErr } = await supabase.functions.invoke("wipe-and-rebuild", {
        body: { confirm: true, preserveManual: true },
      });

      if (wipeErr) throw wipeErr;
      
      toast.success(`Wiped: ${wipeData?.deleted?.projects ?? 0} projects, ${wipeData?.deleted?.queue_items ?? 0} queue items`);

      // Step 2: Use chunked queue rebuild (more reliable than single long call)
      const TARGET = 1336;
      const getPendingCount = async () => {
        const { count } = await supabase
          .from("pending_project_imports")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        return count ?? 0;
      };

      // Fast MAP discovery first
      toast.info("Discovering all 1,336 project URLs (MAP pass)...");
      const { data: mapData, error: mapErr } = await supabase.functions.invoke("discover-all-projects", {
        body: {
          freshStart: true,
          expectedTotal: TARGET,
          disableAutoFallback: true,
          skipPostInsertStats: true,
        },
      });

      // CRITICAL: Check for credits exhausted (402 error)
      if (mapErr) {
        // Parse the error message to detect 402
        const errMsg = mapErr?.message || "";
        if (errMsg.includes("402") || errMsg.toLowerCase().includes("credit")) {
          setCreditsExhausted(true);
          toast.error("Firecrawl credits exhausted. Please top up at firecrawl.dev/pricing");
          return;
        }
        throw mapErr;
      }
      
      // Also check the response body for credits_exhausted flag
      if (mapData?.credits_exhausted) {
        setCreditsExhausted(true);
        toast.error("Firecrawl credits exhausted. Stopping discovery.");
        return;
      }
      
      // Check for insert failures from the discover function
      if (mapData?.success === false) {
        // Also check for 402 in the error message
        if (mapData?.error?.includes("402") || mapData?.error?.toLowerCase().includes("credit")) {
          setCreditsExhausted(true);
          toast.error("Firecrawl credits exhausted. Please top up at firecrawl.dev/pricing");
          return;
        }
        throw new Error(mapData?.error || "Discovery failed - check database constraints");
      }
      
      let pending = await getPendingCount();
      toast.info(`MAP discovered ${mapData?.discovered_urls ?? 0} URLs, inserted ${mapData?.inserted_count ?? 0}. Queue: ${pending}`);

      // Chunked discovery passes if still short
      let stuckCounter = 0;
      let lastPending = pending;
      
      if (pending < TARGET) {
        toast.info(`Filling missing URLs (${TARGET - pending} needed)...`);
        
        const CHUNK = 10;
        for (let start = 1; start <= 89 && pending < TARGET; start += CHUNK) {
          const end = Math.min(89, start + CHUNK - 1);
          const { data: rangeData, error: rangeErr } = await supabase.functions.invoke("discover-all-projects", {
            body: {
              expectedTotal: TARGET,
              skipMap: true,
              listingPageStart: start,
              listingPageEnd: end,
              listingUseFirecrawl: true,
              disableAutoFallback: true,
              skipPostInsertStats: true,
            },
          });
          
          if (rangeErr || rangeData?.success === false) {
            console.warn(`Discovery range ${start}-${end} failed:`, rangeErr?.message || rangeData?.error);
          }
          
          pending = await getPendingCount();
          
          // STUCK DETECTION: if pending count doesn't increase after 3 consecutive chunks, stop
          if (pending <= lastPending) {
            stuckCounter++;
            if (stuckCounter >= 3) {
              toast.error(`Discovery stuck at ${pending} items. Check backend logs for constraint errors.`);
              break;
            }
          } else {
            stuckCounter = 0;
          }
          lastPending = pending;
        }
      }

      setRebuildResult({
        discovered_urls: mapData?.discovered_urls ?? 0,
        queued_for_scraping: pending,
        new_urls: mapData?.new_urls ?? 0,
        existing_urls: mapData?.existing_urls ?? 0,
      });
      
      toast.success(`Discovered and queued ${pending.toLocaleString()} URLs`);
      await loadProjectCount();

      // Step 3: Only start extraction if we have items in queue
      if (pending > 0) {
        toast.info("Starting bulk extraction of all listings...");
        setTimeout(() => {
          startBulkExtractRunner();
        }, 1000);
      } else {
        toast.warning("Queue is empty - no extraction needed. Check backend logs for issues.");
      }

    } catch (e: any) {
      console.error("Full wipe and rebuild failed:", e);
      toast.error(e?.message || "Wipe and rebuild failed");
    } finally {
      setIsWiping(false);
    }
  };

  const rebuildQueueFromMap = async () => {
    if (isSyncing || isRebuildingQueue || isBulkExtractRunning) return;

    const confirmed = window.confirm(
      "Rebuild Queue (non-destructive)\n\n" +
        "This will scan the 89 listing pages and ADD any missing items to the queue.\n" +
        "It will NOT delete your existing queue entries.\n\n" +
        "Continue?"
    );
    if (!confirmed) return;

    setIsRebuildingQueue(true);
    setRebuildResult(null);

    try {
      const TARGET = 1336;
      const getPendingCount = async () => {
        const { count } = await supabase
          .from("pending_project_imports")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        return count ?? 0;
      };

      // CREDIT-SAFE DISCOVERY ONLY:
      // We intentionally avoid Firecrawl MAP/links here so clicking “Rebuild Queue” never burns credits.
      let pending = await getPendingCount();
      toast.info(
        pending > 0
          ? `Rebuilding queue: adding missing items (currently ${pending.toLocaleString()} pending)…`
          : "Rebuilding queue: discovering listings…"
      );

      const CHUNK = 10;
      let stuckCounter = 0;
      let lastPending = pending;

      for (let start = 1; start <= 89 && pending < TARGET; start += CHUNK) {
        const end = Math.min(89, start + CHUNK - 1);
        const { data: rangeData, error: rangeErr } = await supabase.functions.invoke("discover-all-projects", {
          body: {
            expectedTotal: TARGET,
            skipMap: true,
            listingPageStart: start,
            listingPageEnd: end,
            listingUseFirecrawl: false,
            disableAutoFallback: true,
            skipPostInsertStats: true,
          },
        });

          // Robust 402 detection (Supabase invoke reports non-2xx as `error`, often with `data=null`).
          if (rangeErr) {
            const msg = String(rangeErr.message || "");
            if (msg.includes("402") || msg.toLowerCase().includes("credit")) {
              setCreditsExhausted(true);
              toast.error("Firecrawl credits exhausted detected. Extraction is disabled until you top up.");
              break;
            }
          }

        // If the backend reports credit exhaustion anyway, lock the UI and stop further actions.
        // (Shouldn't happen in HTML mode, but this keeps us safe.)
        if (rangeData?.credits_exhausted || rangeData?.success === false && String(rangeData?.error || "").includes("402")) {
          setCreditsExhausted(true);
          toast.error("Credits exhausted detected. Extraction is disabled until you top up.");
          break;
        }

        if (rangeErr || rangeData?.success === false) {
          console.warn(`Discovery range ${start}-${end} failed`, rangeErr?.message || rangeData?.error);
        }

        pending = await getPendingCount();

        // STUCK DETECTION: if pending count doesn't increase after 3 consecutive chunks, stop
        if (pending <= lastPending) {
          stuckCounter++;
          if (stuckCounter >= 3) {
            toast.error(`Discovery appears stuck at ${pending.toLocaleString()} pending. Check constraints/logs.`);
            break;
          }
        } else {
          stuckCounter = 0;
        }
        lastPending = pending;
      }

      const finalPending = await getPendingCount();
      const totalDiscovered = rebuildResult?.discovered_urls ?? finalPending;
      
      setRebuildResult({ 
        discovered_urls: totalDiscovered,
        queued_for_scraping: finalPending,
        new_urls: finalPending - pending, // How many were actually added
        existing_urls: totalDiscovered - (finalPending - pending),
      });
      
      // Clear, unambiguous toast - never say "cleared"
      toast.success(
        `Rebuild complete: ${finalPending.toLocaleString()} items now in queue` +
        (finalPending > pending ? ` (+${(finalPending - pending).toLocaleString()} new)` : "")
      );
    } catch (e: any) {
      console.error("Rebuild queue failed:", e);
      toast.error(e?.message || "Failed to rebuild queue");
    } finally {
      setIsRebuildingQueue(false);
      await loadProjectCount();
    }
  };

  const startBulkExtractRunner = async () => {
    if (isBulkExtractRunning || isRebuildingQueue) return;
    
    // GUARDRAIL: Check if queue has items before starting
    const { count: pendingCount } = await supabase
      .from("pending_project_imports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    
    if (!pendingCount || pendingCount === 0) {
      toast.warning("Queue is empty — rebuild queue first before starting extraction.");
      return;
    }
    
    bulkStopRef.current = false;
    setIsBulkExtractRunning(true);
    setBulkLastRun(null);
    setBulkTotals({ processed: 0, success: 0, errors: 0 });

    toast.info(`Bulk extraction started — ${pendingCount.toLocaleString()} items in queue.`);

    try {
      // Keep looping until no more work or user stops
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (bulkStopRef.current) break;

        // Keep each call short to avoid client timeouts; UI will loop until done.
        const limit = turboMode ? 25 : 10;
        const throttleMs = turboMode ? 0 : 2500;
        const concurrency = turboMode ? 2 : 1;

        const { data, error } = await supabase.functions.invoke("batch-extract-pending", {
          // Shorter time budget in Turbo makes the UI update more frequently (feels less “stuck”)
          body: { limit, throttleMs, concurrency, maxDurationMs: turboMode ? 35_000 : 50_000 },
        });
        if (error) throw error;

        const processed = Number(data?.stats?.processed ?? 0);
        const success = Number(data?.stats?.success ?? 0);
        const errors = Number(data?.stats?.errors ?? 0);
        const images = Number(data?.stats?.images ?? 0);
        const documents = Number(data?.stats?.documents ?? 0);
        const duration_ms = Number(data?.duration_ms ?? 0);

        // CRITICAL: Check if credits are exhausted — stop immediately and show banner.
        if (data?.credits_exhausted) {
          console.error("[SyncDashboard] Firecrawl credits exhausted — stopping extraction.");
          setCreditsExhausted(true);
          toast.error("Firecrawl credits exhausted. Extraction stopped.");
          break;
        }

        setBulkLastRun({ processed, success, errors, images, documents, duration_ms });
        setBulkTotals((prev) => ({
          processed: prev.processed + processed,
          success: prev.success + success,
          errors: prev.errors + errors,
        }));

        await loadProjectCount();

        // Done when this cycle finds nothing left to process
        if (processed <= 0) {
          // Check if there are still items needing extraction but not "strictly ready"
          const { count: needsExtraction } = await supabase
            .from("pending_project_imports")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending")
            .ilike("review_notes", "%PENDING_SCRAPE%");
          
          const { count: remaining } = await supabase
            .from("pending_project_imports")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending");
          
          if ((needsExtraction ?? 0) > 0) {
            toast.warning(`Extraction paused: ${needsExtraction} items still need extraction but may be blocked. Check review_notes.`);
          } else if ((remaining ?? 0) > 0) {
            toast.success(`Extraction complete. ${remaining} items remain in pending state (ready for review).`);
          } else {
            toast.success("Bulk extraction complete: queue is empty.");
          }
          break;
        }

        // Small breather between cycles (keeps UI responsive)
        if (!turboMode) {
          await new Promise((r) => setTimeout(r, 800));
        }
      }
    } catch (e: any) {
      console.error("Bulk extraction runner failed:", e);
      toast.error(e?.message || "Bulk extraction failed");
    } finally {
      setIsBulkExtractRunning(false);
      bulkStopRef.current = false;
    }
  };

  const stopBulkExtractRunner = () => {
    bulkStopRef.current = true;
    toast.info("Stopping after current batch finishes...");
  };

  // FIX ALL RUNNER - 3-phase repair pipeline:
  // Phase 1: Extract pending queue (missing images/docs/description)
  // Phase 2: Repair approved projects (metadata, USPs, location, amenities)
  // Phase 3: Repair approved project images and documents
  const startFixAllRunner = async (silentResume = false) => {
    if (isFixAllRunning || isBulkExtractRunning || isRebuildingQueue || isSyncing) return;
    
    if (!silentResume) {
      const confirmed = window.confirm(
        "⚡ FIX ALL LISTINGS ⚡\n\n" +
        "This will run a 3-phase repair pipeline:\n\n" +
        "Phase 1: Extract missing data for ALL pending queue items\n" +
        "Phase 2: Repair approved projects (metadata, USPs, location, amenities, documents)\n" +
        "Phase 3: Repair approved project images\n\n" +
        "This may take several minutes. Continue?"
      );
      if (!confirmed) return;
    }

    fixAllStopRef.current = false;
    setIsFixAllRunning(true);
    // Persist so we can auto-resume after navigation/refresh
    try { sessionStorage.setItem("fix_all_running", "true"); } catch { /* ignore */ }

    setFixAllStats({ 
      pending_processed: 0, 
      pending_success: 0, 
      pending_errors: 0, 
      approved_repaired: 0, 
      approved_errors: 0,
      metadata_repaired: 0,
      images_repaired: 0,
      documents_repaired: 0
    });

    toast.info(silentResume ? "Resuming Fix All pipeline..." : "Fix All started — running 3-phase repair pipeline...");

    try {
      // Phase 1: Extract all pending queue items
      toast.info("Phase 1: Extracting pending queue items...");
      let pendingStats = { processed: 0, success: 0, errors: 0 };
      while (!fixAllStopRef.current) {
        const { data, error } = await supabase.functions.invoke("batch-extract-pending", {
          body: { limit: 10, throttleMs: 2500, concurrency: 1, maxDurationMs: 50_000 },
        });
        if (error) throw error;

        // CRITICAL: Stop if credits exhausted
        if (data?.credits_exhausted) {
          console.error("[FixAll] Credits exhausted — aborting.");
          setCreditsExhausted(true);
          toast.error("Firecrawl credits exhausted. Fix All stopped.");
          break;
        }

        const processed = Number(data?.stats?.processed ?? 0);
        const success = Number(data?.stats?.success ?? 0);
        const errors = Number(data?.stats?.errors ?? 0);

        pendingStats = {
          processed: pendingStats.processed + processed,
          success: pendingStats.success + success,
          errors: pendingStats.errors + errors,
        };

        setFixAllStats(prev => ({
          ...prev!,
          pending_processed: pendingStats.processed,
          pending_success: pendingStats.success,
          pending_errors: pendingStats.errors,
        }));

        await loadProjectCount();

        if (processed === 0) break; // No more pending items
      }

      toast.success(`Phase 1 complete: ${pendingStats.success} extracted, ${pendingStats.errors} errors`);

      // Phase 2: Repair approved projects (full metadata including USPs, location, docs)
      if (!fixAllStopRef.current) {
        toast.info("Phase 2: Repairing approved project metadata...");
        
        const { data: repairData, error: repairError } = await supabase.functions.invoke("repair-approved-projects", {
          body: { limit: 500, dryRun: false },
        });

        if (repairError) throw repairError;

        const repaired = repairData?.stats?.repaired ?? 0;
        const metadataRepaired = repairData?.stats?.metadataRepaired ?? 0;
        const imagesRepaired = repairData?.stats?.imagesRepaired ?? 0;
        const documentsRepaired = repairData?.stats?.documentsRepaired ?? 0;
        const repairErrors = repairData?.stats?.errors ?? 0;

        setFixAllStats(prev => ({
          ...prev!,
          approved_repaired: repaired,
          approved_errors: repairErrors,
          metadata_repaired: metadataRepaired,
          images_repaired: imagesRepaired,
          documents_repaired: documentsRepaired,
        }));

        toast.success(`Phase 2 complete: ${repaired} projects repaired (${metadataRepaired} metadata, ${imagesRepaired} images, ${documentsRepaired} docs)`);
      }

      // Phase 3: Additional image repair pass (for any remaining)
      if (!fixAllStopRef.current) {
        toast.info("Phase 3: Final image repair pass...");
        
        const { data: imgRepairData, error: imgRepairError } = await supabase.functions.invoke("repair-project-images", {
          body: { limit: 500, dryRun: false },
        });

        if (imgRepairError) throw imgRepairError;

        const additionalImages = imgRepairData?.stats?.repaired ?? 0;

        if (additionalImages > 0) {
          setFixAllStats(prev => ({
            ...prev!,
            images_repaired: (prev?.images_repaired || 0) + additionalImages,
          }));
          toast.success(`Phase 3 complete: ${additionalImages} additional images repaired`);
        } else {
          toast.success("Phase 3 complete: All images already repaired");
        }
      }

      toast.success("🎉 Fix All complete! All 3 phases finished.");
      await loadProjectCount();

    } catch (e: any) {
      console.error("Fix All runner failed:", e);
      toast.error(e?.message || "Fix All failed");
    } finally {
      setIsFixAllRunning(false);
      fixAllStopRef.current = false;
      try { sessionStorage.removeItem("fix_all_running"); } catch { /* ignore */ }
    }
  };

  const stopFixAllRunner = () => {
    fixAllStopRef.current = true;
    try { sessionStorage.removeItem("fix_all_running"); } catch { /* ignore */ }
    toast.info("Stopping Fix All after current batch...");
  };

  const continueSyncFromPage = async (jobId: string, startPage: number, pagesTotal: number) => {
    const syncStartTime = new Date();
    setStartTime(syncStartTime);
    
    let runningStats = { ...totalStats };
    
    for (let page = startPage; page <= pagesTotal; page++) {
      // Check if paused using ref (immediate value)
      if (isPausedRef.current) {
        await supabase
          .from("sync_jobs")
          .update({ status: "paused", paused_at: new Date().toISOString() })
          .eq("id", jobId);
        toast.info(`Sync paused at page ${page}`);
        break;
      }
      
      setCurrentPage(page);
      
      const pageStats = await syncPage(page, undefined, jobId);
      
      if (pageStats) {
        runningStats = {
          created: runningStats.created + pageStats.created,
          updated: runningStats.updated + pageStats.updated,
          skipped: runningStats.skipped + pageStats.skipped,
          images: runningStats.images + pageStats.images,
          extracted: runningStats.extracted + pageStats.extracted
        };
        setTotalStats(runningStats);
        
        // Update job progress in database
        await updateJobProgress(jobId, page, runningStats);
      }

      // Update time estimate
      const elapsed = Date.now() - syncStartTime.getTime();
      const pagesCompleted = page - startPage + 1;
      setEstimatedTimeRemaining(calculateTimeRemaining(pagesCompleted, elapsed, pagesTotal));

      // Small delay between pages to avoid rate limits
      if (page < pagesTotal && !isPausedRef.current) {
        const pageDelayMs = turboMode ? 0 : 2000;
        if (pageDelayMs > 0) {
          await new Promise(r => setTimeout(r, pageDelayMs));
        }
      }
    }

    // If completed all pages
    if (!isPausedRef.current) {
      await supabase
        .from("sync_jobs")
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString() 
        })
        .eq("id", jobId);
      
      const successCount = pageStatuses.filter(p => p.status === 'success').length;
      const failCount = pageStatuses.filter(p => p.status === 'failed').length;
      toast.success(`Sync complete! ${successCount} pages successful, ${failCount} failed`);
    }

    setIsSyncing(false);
    isSyncingRef.current = false;
    await loadProjectCount();
  };

  const startFullSync = async () => {
    if (isSyncing) return;

    // Always refresh page count before starting a new job (keeps it in sync with the source website).
    const detectedPages = await refreshPageCount({ silent: true });
    const pagesForJob = detectedPages ?? totalPages;
    
    const confirmed = window.confirm(
      `This will sync all ~${listingsEstimate.toLocaleString()} listings from Provident Estate (${pagesForJob} pages).\n\n` +
      "Sarah will extract:\n" +
      "• All project details and descriptions\n" +
      "• High-resolution images\n" +
      "• Developer information\n" +
      "• Status labels (Future Launch, New Phase, etc.)\n" +
      "• Handover dates and payment plans\n" +
      "• Documents (brochures, floor plans, payment plans)\n\n" +
      "This process takes approximately 45-60 minutes.\n" +
      "Progress is auto-saved; if you leave this page, you can return and resume.\n\n" +
      "Continue?"
    );
    
    if (!confirmed) return;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Create a new sync job in the database
    const { data: newJob, error } = await supabase
      .from("sync_jobs")
      .insert({
        job_type: "provident_sync",
        status: "running",
        current_page: 1,
        total_pages: pagesForJob,
        started_at: new Date().toISOString(),
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating sync job:", error);
      const msg = error.message || error.details || "Unknown error";
      if (msg.includes("row-level security") || error.code === "42501") {
        toast.error("Permission denied: You must be logged in as an admin or listing admin to start a sync job.");
      } else {
        toast.error(`Failed to start sync job: ${msg}`);
      }
      return;
    }

    setCurrentJobId(newJob.id);
    setIsSyncing(true);
    isSyncingRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;
    setCurrentPage(0);
    setTotalStats({ created: 0, updated: 0, skipped: 0, images: 0, extracted: 0 });
    setTotalPages(pagesForJob);
    
    // Reset all statuses
    setPageStatuses(prev => prev.map(p => ({ ...p, status: 'pending' as const, stats: undefined, error: undefined })));

    toast.info("Sarah is starting the full extraction...");

    await continueSyncFromPage(newJob.id, 1, pagesForJob);
  };

  const pauseSync = async () => {
    setIsPaused(true);
    isPausedRef.current = true;
    toast.info("Pausing after current page completes...");
  };

  const resumeSync = async () => {
    if (!currentJobId) {
      toast.error("No active job to resume");
      return;
    }

    setIsPaused(false);
    isPausedRef.current = false;
    setIsSyncing(true);
    isSyncingRef.current = true;

    // Update job status
    await supabase
      .from("sync_jobs")
      .update({ status: "running", paused_at: null })
      .eq("id", currentJobId);

    toast.info(`Resuming from page ${currentPage + 1}...`);
    
    await continueSyncFromPage(currentJobId, currentPage + 1, totalPages);
  };

  const retryFailed = async () => {
    const failedPages = pageStatuses.filter(p => p.status === 'failed');
    if (failedPages.length === 0) {
      toast.info("No failed pages to retry");
      return;
    }

    setIsSyncing(true);
    isSyncingRef.current = true;
    toast.info(`Retrying ${failedPages.length} failed pages...`);

    for (const pageStatus of failedPages) {
      if (isPausedRef.current) break;
      
      setCurrentPage(pageStatus.page);
      await syncPage(pageStatus.page);
      const retryDelayMs = turboMode ? 0 : 2000;
      if (retryDelayMs > 0) {
        await new Promise(r => setTimeout(r, retryDelayMs));
      }
    }

    setIsSyncing(false);
    isSyncingRef.current = false;
    await loadProjectCount();
  };

  const syncSinglePage = async (page: number, options?: SyncPageOptions) => {
    setIsSyncing(true);
    isSyncingRef.current = true;
    setCurrentPage(page);
    
    const pageStats = await syncPage(page, options);
    
    if (pageStats) {
      toast.success(`Page ${page}: +${pageStats.created} new, ${pageStats.updated} updated, ${pageStats.skipped} skipped, ${pageStats.images} images`);
    }
    
    setIsSyncing(false);
    isSyncingRef.current = false;
    await loadProjectCount();
  };

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  
  const successCount = pageStatuses.filter(p => p.status === 'success').length;
  const failedCount = pageStatuses.filter(p => p.status === 'failed').length;
  const inProgressCount = pageStatuses.filter(p => p.status === 'in_progress').length;
  const pendingCount = pageStatuses.filter(p => p.status === 'pending').length;

  const goToFullSync = () => setActiveTab("sync");

  const runTestPageOne = async () => {
    setActiveTab("sync");
    // Run the real pipeline (approval queue) and then jump to the Projects tab so you can review.
    await syncSinglePage(1, { force: true });
    setActiveTab("approvals");
  };

  return (
    <div className="space-y-6">
      {/* Tabs: Test vs Full Sync */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <FilledCheckCircle size="sm" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="developers" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Developers
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Image Finder
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Sync History
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4" />
            Test Extraction
          </TabsTrigger>
          <TabsTrigger 
            value="sync" 
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Full Sync
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="mt-6">
          <ProjectApprovalQueue onRefresh={loadProjectCount} jobId={viewingJobId} />
        </TabsContent>

        <TabsContent value="developers" className="mt-6">
          <DeveloperApprovalQueue />
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <ImageFinderPanel />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <SyncHistoryLog />
        </TabsContent>
        
        <TabsContent value="test" className="mt-6">
          <SarahTestPanel
            onGoToFullSync={goToFullSync}
            onRunPageOneTest={runTestPageOne}
            onGoToApprovals={() => setActiveTab("approvals")}
          />
        </TabsContent>
        
        <TabsContent value="sync" className="mt-6 space-y-6">
          {/* Warning if not approved */}
          {!isTestApproved && !currentJobId && (
            <Card className="bg-amber-50 border-amber-300">
              <CardContent className="py-4 flex items-center gap-3">
                <Lock className="w-6 h-6 text-amber-600" />
                <div>
                  <h3 className="font-medium text-amber-800">Full Sync Locked</h3>
                  <p className="text-sm text-amber-700">
                    Run a test extraction first to validate Sarah's capabilities before starting the full sync.
                    You can still run <strong>Test Page 1 Only</strong> below to verify the pipeline and refresh page-1 data.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Overview Stats */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Expected {listingsEstimate}</Badge>
            <Badge variant="outline">Total {queueBreakdown.total ?? "…"}</Badge>
            <Badge variant="outline">Pending {queueBreakdown.pending ?? "…"}</Badge>
            <Badge variant="outline">Approved {queueBreakdown.approved ?? "…"}</Badge>
            <Badge variant="outline">Rejected {queueBreakdown.rejected ?? "…"}</Badge>
            <Badge variant="outline">Merged {queueBreakdown.merged ?? "…"}</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <Database className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{projectCount ?? "..."}</div>
                <div className="text-xs text-muted-foreground">Approved Projects</div>
                {pendingQueueCount !== null && pendingQueueCount > 0 && (
                  <div className="text-xs text-amber-600 mt-1">+{pendingQueueCount} pending</div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-600">{totalStats.created}</div>
                <div className="text-xs text-muted-foreground">Created (this run)</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <RefreshCw className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-600">{totalStats.updated}</div>
                <div className="text-xs text-muted-foreground">Updated (this run)</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <Image className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{totalStats.images}</div>
                <div className="text-xs text-muted-foreground">Images (this run)</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <Check className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{totalStats.extracted}</div>
                <div className="text-xs text-muted-foreground">Listings processed (this run)</div>
              </CardContent>
            </Card>
          </div>

          {/* Control Panel */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <RefreshCw className="w-5 h-5 text-gold" />
                Source Portal Sync Control
                {isSyncing && !isPaused && (
                  <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-700 border-blue-300">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    In Progress
                  </Badge>
                )}
                {isPaused && (
                  <Badge variant="outline" className="ml-auto bg-amber-100 text-amber-700 border-amber-300">
                    <Pause className="w-3 h-3 mr-1" />
                    Paused at Page {currentPage}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Persistence info */}
              {currentJobId && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  <strong>✓ Auto-save enabled:</strong> Progress is saved. If you leave this page, return and press Resume.
                </div>
              )}

              {/* Page count */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Detected pages: <strong className="text-foreground">{detectedTotalPages ?? totalPages}</strong>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDetectingPages || isSyncing}
                  onClick={async () => {
                    await refreshPageCount();
                  }}
                >
                  <RefreshCw className={`w-3 h-3 mr-2 ${isDetectingPages ? 'animate-spin' : ''}`} />
                  Refresh Pages
                </Button>
              </div>

              {/* Turbo mode */}
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
                <div>
                  <div className="text-sm font-medium text-foreground">Turbo mode</div>
                  <div className="text-xs text-muted-foreground">
                    Runs back-to-back batches/pages (fastest). If rate limits happen, retry failed pages.
                  </div>
                </div>
                <Switch checked={turboMode} onCheckedChange={setTurboMode} />
              </div>
              
               {/* Action buttons */}
               <div className="flex flex-wrap gap-2">
                 {!isPaused ? (
                   isSyncing ? (
                     <Button
                       onClick={pauseSync}
                       variant="outline"
                       className="border-amber-300 text-amber-700 hover:bg-amber-50"
                     >
                       <Pause className="w-4 h-4 mr-2" />
                       Pause Sync
                     </Button>
                   ) : (
                     <Button
                       onClick={startFullSync}
                       disabled={!isTestApproved && !currentJobId}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                     >
                       <Play className="w-4 h-4 mr-2" />
                        Start Full Sync{turboMode ? " (Turbo)" : ""} (~{listingsEstimate.toLocaleString()} Listings)
                     </Button>
                   )
                  ) : (
                    <Button onClick={resumeSync} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                     <Play className="w-4 h-4 mr-2" />
                     Resume Sync from Page {currentPage + 1}
                   </Button>
                 )}

                 {/* Keep Fresh Restart button always visible so it can't “disappear”. */}
                 <Button
                   onClick={clearPendingAndStartFresh}
                    disabled={isClearingPending || isSyncing || creditsExhausted}
                   variant="outline"
                   className="border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60"
                    title={
                      isSyncing
                        ? "Pause sync first, then you can start fresh."
                        : creditsExhausted
                          ? "Disabled while credits are exhausted (this action triggers a full sync)."
                          : undefined
                    }
                 >
                   <RefreshCw className={`w-4 h-4 mr-2 ${isClearingPending ? 'animate-spin' : ''}`} />
                    Delete Queue & Start Fresh
                 </Button>

                 {/* FULL WIPE & REBUILD - Deletes everything and rediscovers all 1336 */}
                 <Button
                   onClick={fullWipeAndRebuild}
                    disabled={isWiping || isSyncing || isBulkExtractRunning || creditsExhausted}
                   variant="outline"
                   className="border-red-600 text-red-800 bg-red-50 hover:bg-red-100 disabled:opacity-60"
                 >
                   <XCircle className={`w-4 h-4 mr-2 ${isWiping ? 'animate-spin' : ''}`} />
                   {isWiping ? "Wiping..." : "⚠️ FULL WIPE & REBUILD"}
                 </Button>

                  <Button
                    onClick={rebuildQueueFromMap}
                    disabled={isSyncing || isRebuildingQueue || isBulkExtractRunning}
                    variant="outline"
                  >
                    <Database className={`w-4 h-4 mr-2 ${isRebuildingQueue ? "animate-pulse" : ""}`} />
                    Rebuild Queue (Add Missing)
                  </Button>

                 {failedCount > 0 && !isSyncing && (
                   <Button
                     onClick={retryFailed}
                     variant="outline"
                     className="border-red-300 text-red-700 hover:bg-red-50"
                   >
                     <RefreshCw className="w-4 h-4 mr-2" />
                     Retry {failedCount} Failed Pages
                   </Button>
                 )}

                 {!isSyncing && !isPaused && (
                   <Button onClick={runTestPageOne} variant="outline" className="border-zinc-300 text-zinc-700 hover:bg-zinc-50">
                     Test Page 1 Only
                   </Button>
                 )}
               </div>

                {/* Credits exhausted banner */}
                {creditsExhausted && (
                  <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4 flex items-center gap-4">
                    <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-destructive">Firecrawl Credits Exhausted</div>
                      <div className="text-xs text-muted-foreground">
                        Extraction has stopped because your Firecrawl API credits have run out.
                        Please top up your plan at <a href="https://firecrawl.dev/pricing" target="_blank" rel="noopener noreferrer" className="underline text-primary">firecrawl.dev/pricing</a> or wait for credits to reset.
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setCreditsExhausted(false)}
                      >
                        Dismiss & Retry
                      </Button>
                    </div>
                  </div>
                )}

                {/* TEST BEFORE BULK - Show test panel if not approved */}
                {!isTestApproved && (
                  <TestOneListingPanel
                    onApproved={() => {
                      setIsTestApproved(true);
                      try { sessionStorage.setItem("bulk_extraction_approved", "true"); } catch { /* ignore */ }
                    }}
                    bulkExtractDisabled={isSyncing || isRebuildingQueue || creditsExhausted}
                  />
                )}

                {/* Queue rebuild + Bulk extraction runner - only show after test approved */}
                {isTestApproved && (
                  <div className="rounded-md border border-border bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">Bulk Extract Runner</div>
                        <div className="text-xs text-muted-foreground">
                          Extracts missing details for the entire pending queue (placeholders + incomplete entries).
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {!isBulkExtractRunning ? (
                          <Button
                            onClick={startBulkExtractRunner}
                            disabled={isSyncing || isRebuildingQueue || isFixAllRunning || creditsExhausted}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Bulk Extract{turboMode ? " (Turbo)" : ""}
                          </Button>
                        ) : (
                          <Button onClick={stopBulkExtractRunner} variant="outline">
                            <Pause className="w-4 h-4 mr-2" />
                            Stop Bulk Extract
                          </Button>
                        )}

                        {/* FIX ALL BUTTON - runs extraction + repairs approved projects */}
                        {!isFixAllRunning ? (
                          <Button
                            onClick={() => startFixAllRunner(false)}
                            disabled={isSyncing || isRebuildingQueue || isBulkExtractRunning || creditsExhausted}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            ⚡ Fix All Listings
                          </Button>
                        ) : (
                          <Button onClick={stopFixAllRunner} variant="outline" className="border-amber-400 text-amber-700">
                            <Pause className="w-4 h-4 mr-2" />
                            Stop Fix All
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("approvals")}
                        >
                          View Queue
                        </Button>
                      </div>
                    </div>

                  {/* Fix All stats display */}
                  {isBulkExtractRunning && (
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1">
                      <div className="font-medium text-foreground">Bulk extraction running…</div>
                      <div className="text-muted-foreground">
                        Total processed: {bulkTotals.processed.toLocaleString()} (ok {bulkTotals.success.toLocaleString()}, errors {bulkTotals.errors.toLocaleString()})
                      </div>
                      {bulkLastRun && (
                        <div className="text-muted-foreground">
                          Last batch: {bulkLastRun.processed.toLocaleString()} processed in {Math.max(1, Math.round(bulkLastRun.duration_ms / 1000))}s ({bulkLastRun.images.toLocaleString()} imgs, {bulkLastRun.documents.toLocaleString()} docs)
                        </div>
                      )}
                    </div>
                  )}

                  {isFixAllRunning && fixAllStats && (
                    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs space-y-1">
                      <div className="font-medium text-emerald-800">Fix All in progress...</div>
                      <div className="text-emerald-700">
                        Pending: {fixAllStats.pending_success} fixed, {fixAllStats.pending_errors} errors
                      </div>
                      <div className="text-emerald-700">
                        Approved: {fixAllStats.approved_repaired} repaired, {fixAllStats.approved_errors} errors
                      </div>
                    </div>
                  )}

                  {/* Unified inventory summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                      <div className="text-2xl font-bold text-foreground">{listingsEstimate.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Source estimate</div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                      <div className="text-2xl font-bold text-foreground">{(discoveredTotal ?? 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Discovered</div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                      <div className="text-2xl font-bold text-foreground">{pendingInQueue.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Pending (queue)</div>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                      <div className="text-2xl font-bold text-amber-700">{needsWorkTotal.toLocaleString()}</div>
                      <div className="text-xs text-amber-600">Needs work</div>
                    </div>
                  </div>

                  {/* Secondary metrics */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Extracted (core):</span>
                    <span className="font-medium text-foreground">{extractedCore.toLocaleString()}</span>
                    <span className="mx-1">•</span>
                    <span>Strict complete:</span>
                    <span className="font-medium text-foreground">{(queueBreakdown.ready_pending ?? 0).toLocaleString()}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Extraction progress (core)</span>
                      <span className="text-foreground font-medium">
                        {extractedCore.toLocaleString()} / {pendingInQueue.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={
                        pendingInQueue
                          ? (extractedCore / pendingInQueue) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>

                  {/* Gap alert – only show when we’re below the current source estimate */}
                  {estimateGap > 0 && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                      <strong>Gap detected:</strong> {estimateGap.toLocaleString()} listings missing vs the current source estimate. Click “Rebuild Queue (Add Missing)” to attempt full discovery.
                    </div>
                  )}

                    {rebuildResult && (
                      <div className="text-xs text-muted-foreground">
                        Rebuild: {rebuildResult.queued_for_scraping ?? rebuildResult.new_urls ?? 0} queued (discovered {rebuildResult.discovered_urls ?? "?"}).
                      </div>
                    )}
                  </div>
                )}

        </CardContent>
      </Card>

        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SyncDashboard;
