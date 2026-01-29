import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  // UI estimate only (the source website fluctuates)
  const [listingsEstimate, setListingsEstimate] = useState<number>(1334);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(70);
  const [detectedTotalPages, setDetectedTotalPages] = useState<number | null>(null);
  const [isDetectingPages, setIsDetectingPages] = useState(false);
  const [pageStatuses, setPageStatuses] = useState<PageStatus[]>([]);
  const [totalStats, setTotalStats] = useState({ 
    created: 0, 
    updated: 0, 
    skipped: 0,
    images: 0,
    extracted: 0 
  });
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>("");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  // We keep this always enabled: the admin decides what to approve in the queue.
  const [isTestApproved] = useState(true);
  const [activeTab, setActiveTab] = useState("approvals");
  
  const isPausedRef = useRef(false);
  const isSyncingRef = useRef(false);

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

  // Initialize page statuses when totalPages changes (but don't wipe while syncing).
  useEffect(() => {
    if (isSyncingRef.current) return;
    const initialStatuses: PageStatus[] = Array.from({ length: totalPages }, (_, i) => ({
      page: i + 1,
      status: "pending",
    }));
    setPageStatuses(initialStatuses);
  }, [totalPages]);

  // On mount: load counts + detect current page count + resume any active job.
  useEffect(() => {
    loadProjectCount();
    refreshPageCount({ silent: true });
    loadActiveJob();
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
    const { count } = await supabase.from("projects").select("*", { count: "exact", head: true });
    setProjectCount(count);
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
        // Resume automatically
        setIsSyncing(true);
        isSyncingRef.current = true;
        setPageStatuses(prev => prev.map(p => ({
          ...p,
          status: p.page < job.current_page ? 'success' : p.page === job.current_page ? 'in_progress' : 'pending'
        })));
        toast.info(`Resuming sync from page ${job.current_page}...`);
        
        // Continue the sync
        continueSyncFromPage(job.id, job.current_page, jobTotalPages);
      }

      // If source pages increased since this job started, inform the admin.
      if (detectedTotalPages && detectedTotalPages > jobTotalPages) {
        toast.info(
          `Provident now has ${detectedTotalPages} pages. Your current job is ${jobTotalPages} pages. Start a new full sync later to capture the new pages.`
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

  const syncPage = async (page: number, options?: SyncPageOptions): Promise<SyncStats | null> => {
    updatePageStatus(page, { status: 'in_progress' });
    
    try {
      // Batch the page so we actually process ALL listings on the page.
      // The backend returns remaining_urls + next_start_index so we can loop safely.
      const batchSize = options?.testMode ? 1 : 3;
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

        const { data, error } = await supabase.functions.invoke("sync-provident-page", {
          body: { page, startIndex, batchSize, ...(options || {}) }
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

        // Light delay between batches to avoid rate limits.
        if (remaining > 0) {
          await new Promise((r) => setTimeout(r, 600));
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
      
      const pageStats = await syncPage(page);
      
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
        await new Promise(r => setTimeout(r, 2000));
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
      `This will sync all ~${listingsEstimate.toLocaleString()} listings from Provident Estate.\n\n` +
      "Sarah will extract:\n" +
      "• All project details and descriptions\n" +
      "• High-resolution images\n" +
      "• Developer information\n" +
      "• Status labels (Future Launch, New Phase, etc.)\n" +
      "• Handover dates and payment plans\n\n" +
      "This process takes approximately 45-60 minutes.\n" +
      "Progress is auto-saved; if you leave this page, you can return and resume.\n\n" +
      "Continue?"
    );
    
    if (!confirmed) return;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Create a new sync job in the database (use in_progress for consistency)
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
      // Show detailed error for debugging
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
      await new Promise(r => setTimeout(r, 2000));
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <FilledCheckCircle size="sm" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="developers" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Developers
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4" />
            Test Extraction
          </TabsTrigger>
          <TabsTrigger 
            value="sync" 
            className="flex items-center gap-2"
          >
            {!isTestApproved && !currentJobId && <Lock className="w-4 h-4" />}
            <RefreshCw className="w-4 h-4" />
            Full Sync
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="mt-6">
          <ProjectApprovalQueue onRefresh={loadProjectCount} />
        </TabsContent>

        <TabsContent value="developers" className="mt-6">
          <DeveloperApprovalQueue />
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <Database className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{projectCount ?? "..."}</div>
                <div className="text-xs text-muted-foreground">Total Projects</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-600">{totalStats.created}</div>
                <div className="text-xs text-muted-foreground">New Listings</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <RefreshCw className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-600">{totalStats.updated}</div>
                <div className="text-xs text-muted-foreground">Updated</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <Image className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{totalStats.images}</div>
                <div className="text-xs text-muted-foreground">Images</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 text-center">
                <FileText className="w-6 h-6 text-gold mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{totalStats.extracted}</div>
                <div className="text-xs text-muted-foreground">Extracted</div>
              </CardContent>
            </Card>
          </div>

          {/* Control Panel */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <RefreshCw className="w-5 h-5 text-gold" />
                Provident Estate Sync Control
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
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {!isSyncing && !isPaused ? (
                  <>
                    <Button
                      onClick={startFullSync}
                      disabled={!isTestApproved && !currentJobId}
                      className="bg-gold hover:bg-gold/90 text-black disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Full Sync (~{listingsEstimate.toLocaleString()} Listings)
                    </Button>
                
                {failedCount > 0 && (
                  <Button
                    onClick={retryFailed}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry {failedCount} Failed Pages
                  </Button>
                )}
                
                <Button
                  onClick={runTestPageOne}
                  variant="outline"
                  className="border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                >
                  Test Page 1 Only
                </Button>
              </>
            ) : isPaused ? (
              <Button
                onClick={resumeSync}
                className="bg-gold hover:bg-gold/90 text-black"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume Sync from Page {currentPage + 1}
              </Button>
            ) : (
              <Button
                onClick={pauseSync}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause Sync
              </Button>
            )}
          </div>

          {/* Progress */}
          {(isSyncing || currentPage > 0 || isPaused) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Progress: Page {currentPage} of {totalPages}</span>
                <span className="text-zinc-600">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              {estimatedTimeRemaining && isSyncing && (
                <p className="text-xs text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {estimatedTimeRemaining}
                </p>
              )}
            </div>
          )}

          {/* Status summary */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <FilledCheckCircle size="sm" />
              <span className="text-emerald-700 font-medium">{successCount} Success</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-700 font-medium">{failedCount} Failed</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-600 font-medium">{pendingCount} Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Status Grid */}
      <Card className="bg-white border-zinc-200 shadow-sm">
        <CardHeader className="pb-3">
        <CardTitle className="text-lg text-zinc-900">Page Status ({totalPages} Pages × ~19 listings each)</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-7 md:grid-cols-10 gap-2">
              {pageStatuses.map((pageStatus) => (
                <button
                  key={pageStatus.page}
                  onClick={() => !isSyncing && syncSinglePage(pageStatus.page)}
                  disabled={isSyncing}
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium
                    transition-all hover:scale-105 disabled:hover:scale-100 border
                    ${pageStatus.status === 'pending' ? 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200' : ''}
                    ${pageStatus.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-300 animate-pulse' : ''}
                    ${pageStatus.status === 'success' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : ''}
                    ${pageStatus.status === 'failed' ? 'bg-red-100 text-red-700 border-red-300' : ''}
                  `}
                  title={`Page ${pageStatus.page}: ${pageStatus.status}${pageStatus.error ? ` - ${pageStatus.error}` : ''}${pageStatus.stats ? ` (${pageStatus.stats.created} new, ${pageStatus.stats.updated} updated)` : ''}`}
                >
                  {pageStatus.status === 'in_progress' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : pageStatus.status === 'success' ? (
                    <FilledCheckCircle size="sm" />
                  ) : pageStatus.status === 'failed' ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    pageStatus.page
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Activity Log */}
      <Card className="bg-white border-zinc-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-zinc-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {pageStatuses
                .filter(p => p.status !== 'pending' && p.timestamp)
                .sort((a, b) => (new Date(b.timestamp || 0).getTime()) - (new Date(a.timestamp || 0).getTime()))
                .slice(0, 20)
                .map((pageStatus) => (
                  <div 
                    key={`log-${pageStatus.page}`}
                    className={`
                      flex items-center gap-3 p-2 rounded-lg text-sm border
                      ${pageStatus.status === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}
                    `}
                  >
                    {pageStatus.status === 'success' ? (
                      <FilledCheckCircle size="sm" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    <span className="text-zinc-900 font-medium">Page {pageStatus.page}</span>
                    {pageStatus.stats && (
                      <span className="text-zinc-600">
                        +{pageStatus.stats.created} new, {pageStatus.stats.updated} updated, {pageStatus.stats.images} images
                      </span>
                    )}
                    {pageStatus.error && (
                      <span className="text-red-600 text-xs truncate">{pageStatus.error}</span>
                    )}
                    <span className="text-zinc-500 text-xs ml-auto">
                      {pageStatus.timestamp ? new Date(pageStatus.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>
                ))}
              {pageStatuses.filter(p => p.status !== 'pending').length === 0 && (
                <p className="text-zinc-500 text-center py-8">No activity yet. Start a sync to see progress.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SyncDashboard;
