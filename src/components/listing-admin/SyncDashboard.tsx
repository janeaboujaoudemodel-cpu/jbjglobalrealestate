import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Clock, 
  Image, 
  FileText, 
  Play,
  Pause,
  Database,
  TrendingUp,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

interface SyncStats {
  page: number;
  extracted: number;
  created: number;
  updated: number;
  skipped: number;
  images: number;
}

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
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'failed';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages] = useState(70);
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
  
  const isPausedRef = useRef(false);
  const isSyncingRef = useRef(false);

  // Initialize page statuses and load existing job
  useEffect(() => {
    const initialStatuses: PageStatus[] = Array.from({ length: totalPages }, (_, i) => ({
      page: i + 1,
      status: 'pending'
    }));
    setPageStatuses(initialStatuses);
    loadProjectCount();
    loadActiveJob();
  }, [totalPages]);

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
    // Find any in_progress or paused job
    const { data: jobs, error } = await supabase
      .from("sync_jobs")
      .select("*")
      .in("status", ["in_progress", "paused"])
      .eq("job_type", "provident_sync")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error loading active job:", error);
      return;
    }

    if (jobs && jobs.length > 0) {
      const job = jobs[0] as SyncJob;
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
      } else if (job.status === "in_progress") {
        // Resume automatically
        setIsSyncing(true);
        isSyncingRef.current = true;
        setPageStatuses(prev => prev.map(p => ({
          ...p,
          status: p.page < job.current_page ? 'success' : p.page === job.current_page ? 'in_progress' : 'pending'
        })));
        toast.info(`Resuming sync from page ${job.current_page}...`);
        
        // Continue the sync
        continueSyncFromPage(job.id, job.current_page);
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

  const syncPage = async (page: number): Promise<SyncStats | null> => {
    updatePageStatus(page, { status: 'in_progress' });
    
    try {
      const { data, error } = await supabase.functions.invoke("sync-provident-page", {
        body: { page }
      });

      if (error) {
        console.error(`Page ${page} error:`, error);
        updatePageStatus(page, { 
          status: 'failed', 
          error: error.message,
          timestamp: new Date().toISOString()
        });
        return null;
      }

      const stats = data?.stats || null;
      updatePageStatus(page, { 
        status: 'success', 
        stats,
        timestamp: new Date().toISOString()
      });
      return stats;
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

  const calculateTimeRemaining = useCallback((completedPages: number, elapsedMs: number) => {
    if (completedPages === 0) return "Calculating...";
    
    const avgTimePerPage = elapsedMs / completedPages;
    const remainingPages = totalPages - completedPages;
    const remainingMs = avgTimePerPage * remainingPages;
    
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `~${hours}h ${mins}m remaining`;
    }
    
    return `~${minutes}m ${seconds}s remaining`;
  }, [totalPages]);

  const continueSyncFromPage = async (jobId: string, startPage: number) => {
    const syncStartTime = new Date();
    setStartTime(syncStartTime);
    
    let runningStats = { ...totalStats };
    
    for (let page = startPage; page <= totalPages; page++) {
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
      setEstimatedTimeRemaining(calculateTimeRemaining(pagesCompleted, elapsed));

      // Small delay between pages to avoid rate limits
      if (page < totalPages && !isPausedRef.current) {
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
    
    const confirmed = window.confirm(
      "This will sync all 1,324 listings from Provident Estate.\n\n" +
      "Sarah will extract:\n" +
      "• All project details and descriptions\n" +
      "• High-resolution images\n" +
      "• Developer information\n" +
      "• Status labels (Future Launch, New Phase, etc.)\n" +
      "• Handover dates and payment plans\n\n" +
      "This process takes approximately 45-60 minutes.\n" +
      "You can close this page and Sarah will continue in the background.\n\n" +
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
        status: "in_progress",
        current_page: 1,
        total_pages: totalPages,
        started_at: new Date().toISOString(),
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating sync job:", error);
      toast.error("Failed to start sync job");
      return;
    }

    setCurrentJobId(newJob.id);
    setIsSyncing(true);
    isSyncingRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;
    setCurrentPage(0);
    setTotalStats({ created: 0, updated: 0, skipped: 0, images: 0, extracted: 0 });
    
    // Reset all statuses
    setPageStatuses(prev => prev.map(p => ({ ...p, status: 'pending' as const, stats: undefined, error: undefined })));

    toast.info("Sarah is starting the full extraction...");

    await continueSyncFromPage(newJob.id, 1);
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
      .update({ status: "in_progress", paused_at: null })
      .eq("id", currentJobId);

    toast.info(`Resuming from page ${currentPage + 1}...`);
    
    await continueSyncFromPage(currentJobId, currentPage + 1);
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

  const syncSinglePage = async (page: number) => {
    setIsSyncing(true);
    isSyncingRef.current = true;
    setCurrentPage(page);
    
    const pageStats = await syncPage(page);
    
    if (pageStats) {
      toast.success(`Page ${page}: ${pageStats.created} created, ${pageStats.updated} updated, ${pageStats.images} images`);
    }
    
    setIsSyncing(false);
    isSyncingRef.current = false;
    await loadProjectCount();
  };

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  
  const successCount = pageStatuses.filter(p => p.status === 'success').length;
  const failedCount = pageStatuses.filter(p => p.status === 'failed').length;
  const inProgressCount = pageStatuses.filter(p => p.status === 'in_progress').length;
  const pendingCount = totalPages - successCount - failedCount - inProgressCount;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardContent className="p-4 text-center">
            <Database className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-zinc-900">{projectCount ?? "..."}</div>
            <div className="text-xs text-zinc-600">Total Projects</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-600">{totalStats.created}</div>
            <div className="text-xs text-zinc-600">New Listings</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardContent className="p-4 text-center">
            <RefreshCw className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-600">{totalStats.updated}</div>
            <div className="text-xs text-zinc-600">Updated</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardContent className="p-4 text-center">
            <Image className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{totalStats.images}</div>
            <div className="text-xs text-zinc-600">Images</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 text-gold mx-auto mb-2" />
            <div className="text-2xl font-bold text-zinc-900">{totalStats.extracted}</div>
            <div className="text-xs text-zinc-600">Extracted</div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card className="bg-white border-zinc-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-zinc-900">
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
            <div className="text-xs text-zinc-500 bg-zinc-50 p-2 rounded">
              <strong>✓ Auto-save enabled:</strong> Progress is saved. You can close this page and return later.
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {!isSyncing && !isPaused ? (
              <>
                <Button
                  onClick={startFullSync}
                  className="bg-gold hover:bg-gold/90 text-black"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Full Sync (1,324 Listings)
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
                  onClick={() => syncSinglePage(1)}
                  variant="outline"
                  className="border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                >
                  Test Page 1
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
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
          <CardTitle className="text-lg text-zinc-900">Page Status (70 Pages × ~19 listings each)</CardTitle>
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
                    <CheckCircle2 className="w-4 h-4" />
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
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
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
    </div>
  );
};

export default SyncDashboard;
