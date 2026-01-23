import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SyncStats {
  page: number;
  extracted: number;
  created: number;
  updated: number;
  skipped: number;
  images: number;
}

export const ProvidentSyncButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages] = useState(70);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [totalStats, setTotalStats] = useState({ created: 0, updated: 0, images: 0 });
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    loadProjectCount();
  }, []);

  const loadProjectCount = async () => {
    const { count } = await supabase.from("projects").select("*", { count: "exact", head: true });
    setProjectCount(count);
  };

  const syncPage = async (page: number): Promise<SyncStats | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("sync-provident-page", {
        body: { page }
      });

      if (error) {
        console.error(`Page ${page} error:`, error);
        setErrors(prev => [...prev, `Page ${page}: ${error.message}`]);
        return null;
      }

      return data?.stats || null;
    } catch (err) {
      console.error(`Page ${page} failed:`, err);
      setErrors(prev => [...prev, `Page ${page}: Network error`]);
      return null;
    }
  };

  const startFullSync = async () => {
    if (isSyncing) return;
    
    const confirmed = window.confirm(
      "This will sync all 1,324 listings from Provident Estate.\n\n" +
      "This process will:\n" +
      "• Extract projects from 70 pages\n" +
      "• Take approximately 45-60 minutes\n" +
      "• Add/update projects with images and labels\n\n" +
      "Continue?"
    );
    
    if (!confirmed) return;

    setIsSyncing(true);
    setCurrentPage(0);
    setStats(null);
    setErrors([]);
    setTotalStats({ created: 0, updated: 0, images: 0 });

    toast.info("Starting Provident Estate sync...");

    for (let page = 1; page <= totalPages; page++) {
      setCurrentPage(page);
      
      const pageStats = await syncPage(page);
      
      if (pageStats) {
        setStats(pageStats);
        setTotalStats(prev => ({
          created: prev.created + pageStats.created,
          updated: prev.updated + pageStats.updated,
          images: prev.images + pageStats.images
        }));
      }

      // Small delay between pages to avoid rate limits
      if (page < totalPages) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    setIsSyncing(false);
    await loadProjectCount();
    toast.success(`Sync complete! Created: ${totalStats.created}, Updated: ${totalStats.updated}`);
  };

  const syncSinglePage = async (page: number) => {
    setIsSyncing(true);
    setCurrentPage(page);
    
    const pageStats = await syncPage(page);
    
    if (pageStats) {
      setStats(pageStats);
      toast.success(`Page ${page} synced: ${pageStats.created} created, ${pageStats.updated} updated`);
    }
    
    setIsSyncing(false);
    await loadProjectCount();
  };

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <RefreshCw className="w-5 h-5 text-gold" />
          Provident Estate Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current project count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Projects in database:</span>
          <span className="text-white font-semibold">{projectCount ?? "..."}</span>
        </div>

        {/* Sync buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={startFullSync}
            disabled={isSyncing}
            className="bg-gold hover:bg-gold/90 text-black"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing Page {currentPage}/{totalPages}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync All 1,324 Listings
              </>
            )}
          </Button>
          
          {!isSyncing && (
            <Button
              onClick={() => syncSinglePage(1)}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:text-white"
            >
              Test Page 1 Only
            </Button>
          )}
        </div>

        {/* Progress bar */}
        {isSyncing && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-zinc-500 text-center">
              Page {currentPage} of {totalPages} ({Math.round(progress)}%)
            </p>
          </div>
        )}

        {/* Current page stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-zinc-800 rounded p-2">
              <div className="text-lg font-bold text-blue-400">{stats.extracted}</div>
              <div className="text-xs text-zinc-500">Extracted</div>
            </div>
            <div className="bg-zinc-800 rounded p-2">
              <div className="text-lg font-bold text-emerald-400">{stats.created}</div>
              <div className="text-xs text-zinc-500">Created</div>
            </div>
            <div className="bg-zinc-800 rounded p-2">
              <div className="text-lg font-bold text-amber-400">{stats.updated}</div>
              <div className="text-xs text-zinc-500">Updated</div>
            </div>
            <div className="bg-zinc-800 rounded p-2">
              <div className="text-lg font-bold text-purple-400">{stats.images}</div>
              <div className="text-xs text-zinc-500">Images</div>
            </div>
          </div>
        )}

        {/* Total stats during sync */}
        {isSyncing && currentPage > 1 && (
          <div className="border-t border-zinc-800 pt-3">
            <p className="text-xs text-zinc-500 mb-2">Total Progress:</p>
            <div className="flex gap-4 text-sm">
              <span className="text-emerald-400">+{totalStats.created} new</span>
              <span className="text-amber-400">{totalStats.updated} updated</span>
              <span className="text-purple-400">{totalStats.images} images</span>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{errors.length} Errors</span>
            </div>
            <div className="text-xs text-red-300/80 max-h-20 overflow-y-auto">
              {errors.slice(-5).map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          </div>
        )}

        {/* Success state */}
        {!isSyncing && currentPage === totalPages && currentPage > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300">Sync complete!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
