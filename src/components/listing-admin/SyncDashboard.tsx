import { useState, useEffect, useCallback } from "react";
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
  timestamp?: Date;
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

  // Initialize page statuses
  useEffect(() => {
    const initialStatuses: PageStatus[] = Array.from({ length: totalPages }, (_, i) => ({
      page: i + 1,
      status: 'pending'
    }));
    setPageStatuses(initialStatuses);
    loadProjectCount();
  }, [totalPages]);

  const loadProjectCount = async () => {
    const { count } = await supabase.from("projects").select("*", { count: "exact", head: true });
    setProjectCount(count);
  };

  const updatePageStatus = (page: number, update: Partial<PageStatus>) => {
    setPageStatuses(prev => prev.map(p => 
      p.page === page ? { ...p, ...update } : p
    ));
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
          timestamp: new Date()
        });
        return null;
      }

      const stats = data?.stats || null;
      updatePageStatus(page, { 
        status: 'success', 
        stats,
        timestamp: new Date()
      });
      return stats;
    } catch (err: any) {
      console.error(`Page ${page} failed:`, err);
      updatePageStatus(page, { 
        status: 'failed', 
        error: err.message || 'Network error',
        timestamp: new Date()
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
      "This process takes approximately 45-60 minutes.\n\n" +
      "Continue?"
    );
    
    if (!confirmed) return;

    setIsSyncing(true);
    setIsPaused(false);
    setCurrentPage(0);
    setStartTime(new Date());
    setTotalStats({ created: 0, updated: 0, skipped: 0, images: 0, extracted: 0 });
    
    // Reset all statuses
    setPageStatuses(prev => prev.map(p => ({ ...p, status: 'pending' as const, stats: undefined, error: undefined })));

    toast.info("Sarah is starting the full extraction...");

    for (let page = 1; page <= totalPages; page++) {
      // Check if paused
      if (isPaused) {
        toast.info(`Sync paused at page ${page}`);
        break;
      }
      
      setCurrentPage(page);
      
      const pageStats = await syncPage(page);
      
      if (pageStats) {
        setTotalStats(prev => ({
          created: prev.created + pageStats.created,
          updated: prev.updated + pageStats.updated,
          skipped: prev.skipped + pageStats.skipped,
          images: prev.images + pageStats.images,
          extracted: prev.extracted + pageStats.extracted
        }));
      }

      // Update time estimate
      if (startTime) {
        const elapsed = Date.now() - startTime.getTime();
        setEstimatedTimeRemaining(calculateTimeRemaining(page, elapsed));
      }

      // Small delay between pages to avoid rate limits
      if (page < totalPages && !isPaused) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    setIsSyncing(false);
    await loadProjectCount();
    
    const successCount = pageStatuses.filter(p => p.status === 'success').length;
    const failCount = pageStatuses.filter(p => p.status === 'failed').length;
    
    toast.success(`Sync complete! ${successCount} pages successful, ${failCount} failed`);
  };

  const pauseSync = () => {
    setIsPaused(true);
    toast.info("Pausing after current page completes...");
  };

  const resumeSync = async () => {
    setIsPaused(false);
    const nextPendingPage = pageStatuses.find(p => p.status === 'pending')?.page;
    if (nextPendingPage) {
      setIsSyncing(true);
      toast.info(`Resuming from page ${nextPendingPage}...`);
      
      for (let page = nextPendingPage; page <= totalPages; page++) {
        if (isPaused) break;
        
        setCurrentPage(page);
        const pageStats = await syncPage(page);
        
        if (pageStats) {
          setTotalStats(prev => ({
            created: prev.created + pageStats.created,
            updated: prev.updated + pageStats.updated,
            skipped: prev.skipped + pageStats.skipped,
            images: prev.images + pageStats.images,
            extracted: prev.extracted + pageStats.extracted
          }));
        }

        if (page < totalPages && !isPaused) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      
      setIsSyncing(false);
      await loadProjectCount();
    }
  };

  const retryFailed = async () => {
    const failedPages = pageStatuses.filter(p => p.status === 'failed');
    if (failedPages.length === 0) {
      toast.info("No failed pages to retry");
      return;
    }

    setIsSyncing(true);
    toast.info(`Retrying ${failedPages.length} failed pages...`);

    for (const pageStatus of failedPages) {
      setCurrentPage(pageStatus.page);
      await syncPage(pageStatus.page);
      await new Promise(r => setTimeout(r, 2000));
    }

    setIsSyncing(false);
    await loadProjectCount();
  };

  const syncSinglePage = async (page: number) => {
    setIsSyncing(true);
    setCurrentPage(page);
    
    const pageStats = await syncPage(page);
    
    if (pageStats) {
      toast.success(`Page ${page}: ${pageStats.created} created, ${pageStats.updated} updated, ${pageStats.images} images`);
    }
    
    setIsSyncing(false);
    await loadProjectCount();
  };

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  const successPages = pageStatuses.filter(p => p.status === 'success').length;
  const failedPages = pageStatuses.filter(p => p.status === 'failed').length;
  const pendingPages = pageStatuses.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <Database className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{projectCount ?? "..."}</div>
            <div className="text-xs text-zinc-500">Total Projects</div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-400">{totalStats.created}</div>
            <div className="text-xs text-zinc-500">New Listings</div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <RefreshCw className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-400">{totalStats.updated}</div>
            <div className="text-xs text-zinc-500">Updated</div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <Image className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-400">{totalStats.images}</div>
            <div className="text-xs text-zinc-500">Images</div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 text-gold mx-auto mb-2" />
            <div className="text-2xl font-bold text-gold">{totalStats.extracted}</div>
            <div className="text-xs text-zinc-500">Extracted</div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="w-5 h-5 text-gold" />
            Provident Estate Sync Control
            {isSyncing && (
              <Badge variant="outline" className="ml-auto bg-blue-500/20 text-blue-400 border-blue-500/50">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                In Progress
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {!isSyncing ? (
              <>
                <Button
                  onClick={startFullSync}
                  className="bg-gold hover:bg-gold/90 text-black"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Full Sync (1,324 Listings)
                </Button>
                
                {failedPages > 0 && (
                  <Button
                    onClick={retryFailed}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry {failedPages} Failed Pages
                  </Button>
                )}
                
                <Button
                  onClick={() => syncSinglePage(1)}
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:text-white"
                >
                  Test Page 1
                </Button>
              </>
            ) : (
              <>
                {!isPaused ? (
                  <Button
                    onClick={pauseSync}
                    variant="outline"
                    className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Sync
                  </Button>
                ) : (
                  <Button
                    onClick={resumeSync}
                    className="bg-gold hover:bg-gold/90 text-black"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume Sync
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Progress */}
          {(isSyncing || currentPage > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Progress: Page {currentPage} of {totalPages}</span>
                <span className="text-zinc-400">{Math.round(progress)}%</span>
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
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">{successPages} Success</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400">{failedPages} Failed</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-400">{pendingPages} Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Status Grid */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Page Status (70 Pages × ~19 listings each)</CardTitle>
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
                    transition-all hover:scale-105 disabled:hover:scale-100
                    ${pageStatus.status === 'pending' ? 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700' : ''}
                    ${pageStatus.status === 'in_progress' ? 'bg-blue-500/30 text-blue-400 animate-pulse' : ''}
                    ${pageStatus.status === 'success' ? 'bg-emerald-500/30 text-emerald-400' : ''}
                    ${pageStatus.status === 'failed' ? 'bg-red-500/30 text-red-400' : ''}
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
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {pageStatuses
                .filter(p => p.status !== 'pending' && p.timestamp)
                .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
                .slice(0, 20)
                .map((pageStatus) => (
                  <div 
                    key={`log-${pageStatus.page}`}
                    className={`
                      flex items-center gap-3 p-2 rounded-lg text-sm
                      ${pageStatus.status === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'}
                    `}
                  >
                    {pageStatus.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    <span className="text-white">Page {pageStatus.page}</span>
                    {pageStatus.stats && (
                      <span className="text-zinc-400">
                        +{pageStatus.stats.created} new, {pageStatus.stats.updated} updated, {pageStatus.stats.images} images
                      </span>
                    )}
                    {pageStatus.error && (
                      <span className="text-red-400 text-xs truncate">{pageStatus.error}</span>
                    )}
                    <span className="text-zinc-600 text-xs ml-auto">
                      {pageStatus.timestamp?.toLocaleTimeString()}
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
