import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useSyncJobs } from "@/hooks/useSyncJobs";
import { 
  RefreshCw, Download, CheckCircle, XCircle, 
  ExternalLink, Info, Zap, Database, CloudDownload, Play, ArrowRight, MapPin,
  Trash2, AlertTriangle, RotateCcw, Shield, Clock, AlertCircle, Settings, FileText
} from "lucide-react";

// ── Types ──
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
  document_names?: string[];
  source?: string;
}

interface EnrichmentTestResult {
  success: boolean;
  project?: { id: string; name: string; slug: string; reelly_id: number | null; cover_image_url?: string; developer_name?: string; area_name?: string; price_from?: number; price_to?: number };
  before?: EnrichmentSnapshot;
  after?: EnrichmentSnapshot;
  sources?: {
    reelly: { available: boolean; url?: string; fields_found?: Record<string, number>; reason?: string };
    provident?: { available: boolean; slug_used?: string; fields_found?: Record<string, number>; reason?: string };
    firecrawl?: { available: boolean; fields_found?: Record<string, number>; reason?: string };
  };
  applied?: boolean;
  error?: string;
}

export function ReellyImportPanel() {
  const navigate = useNavigate();
  
  const { 
    activeJob, recentJobs, liveCounts, 
    createJob, updateJobProgress, completeJob, cancelJob,
    setApiTotal, refreshCounts 
  } = useSyncJobs();
  
  // ── Core State ──
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
  
  // Backfill state
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillStats, setBackfillStats] = useState<{
    total_projects: number; missing_floor_plans: number; missing_amenities: number; missing_documents: number; missing_any: number;
  } | null>(null);
  const [backfillResult, setBackfillResult] = useState<{
    success: boolean; processed?: number; updated?: number; failed?: number; remaining?: number; errors?: string[]; message?: string; error?: string;
  } | null>(null);
  const [backfillProjectList, setBackfillProjectList] = useState<Array<{ name: string; slug?: string; status: string; images?: number; docs?: number }>>([]);
  const [isBackfillListOpen, setIsBackfillListOpen] = useState(false);
  const [backfillListFilter, setBackfillListFilter] = useState<"all" | "success" | "failed">("all");
  
  // Developer sync
  const [isSyncingDevs, setIsSyncingDevs] = useState(false);
  const [devSyncResult, setDevSyncResult] = useState<DevSyncResult | null>(null);
  const [totalDevelopers, setTotalDevelopers] = useState<number | null>(null);

  // Areas sync
  const [isSyncingAreas, setIsSyncingAreas] = useState(false);
  const [areasSyncResult, setAreasSyncResult] = useState<AreasSyncResult | null>(null);
  const [totalAreas, setTotalAreas] = useState<number | null>(null);

  // Resume sync
  const [hasResumableJob, setHasResumableJob] = useState(false);
  const [resumableJobInfo, setResumableJobInfo] = useState<{
    id: string; status: string; current_page: number; total_pages: number; next_cursor: string | null;
  } | null>(null);

  // Enrichment test - restore from sessionStorage
  const [enrichTestSlug, setEnrichTestSlug] = useState(() => sessionStorage.getItem('jj_enrichTestSlug') || "binghatti-titania-binghatti-3012");
  const [isEnrichTesting, setIsEnrichTesting] = useState(false);
  const [enrichTestResult, setEnrichTestResult] = useState<EnrichmentTestResult | null>(() => {
    try { const s = sessionStorage.getItem('jj_enrichTestResult'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [isEnrichApplying, setIsEnrichApplying] = useState(false);

  // Provident extraction state - restore from sessionStorage
  const [isProvidentExtracting, setIsProvidentExtracting] = useState(false);
  const [providentResult, setProvidentResult] = useState<{
    processed?: number; total_pdfs_found?: number; total_images_found?: number; total_docs_inserted?: number; total_images_inserted?: number; errors?: number; error?: string;
  } | null>(() => {
    try { const s = sessionStorage.getItem('jj_providentResult'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [isFullProvidentRunning, setIsFullProvidentRunning] = useState(false);
  const [fullProvidentProgress, setFullProvidentProgress] = useState(() => {
    try { const s = sessionStorage.getItem('jj_fullProvidentProgress'); return s ? JSON.parse(s) : { processed: 0, docs: 0, images: 0, errors: 0 }; } catch { return { processed: 0, docs: 0, images: 0, errors: 0 }; }
  });
  const [fullProvidentStopRequested, setFullProvidentStopRequested] = useState(false);

  // Provident page-data enrichment (free, no Firecrawl credits) - restore from sessionStorage
  const [isBulkEnriching, setIsBulkEnriching] = useState(false);
  const [bulkEnrichResult, setBulkEnrichResult] = useState<{
    success: boolean; processed?: number; images_added?: number; docs_added?: number; fields_updated?: number; errors?: number; message?: string; error?: string;
  } | null>(() => {
    try { const s = sessionStorage.getItem('jj_bulkEnrichResult'); return s ? JSON.parse(s) : null; } catch { return null; }
  });

  // Persist enrichment state to sessionStorage on change
  useEffect(() => { sessionStorage.setItem('jj_enrichTestSlug', enrichTestSlug); }, [enrichTestSlug]);
  useEffect(() => { if (enrichTestResult) sessionStorage.setItem('jj_enrichTestResult', JSON.stringify(enrichTestResult)); }, [enrichTestResult]);
  useEffect(() => { if (providentResult) sessionStorage.setItem('jj_providentResult', JSON.stringify(providentResult)); }, [providentResult]);
  useEffect(() => { sessionStorage.setItem('jj_fullProvidentProgress', JSON.stringify(fullProvidentProgress)); }, [fullProvidentProgress]);
  useEffect(() => { if (bulkEnrichResult) sessionStorage.setItem('jj_bulkEnrichResult', JSON.stringify(bulkEnrichResult)); }, [bulkEnrichResult]);
  // Quick Extract by Reelly ID
  const [quickExtractId, setQuickExtractId] = useState("");
  const [isQuickExtracting, setIsQuickExtracting] = useState(false);
  const [quickExtractResult, setQuickExtractResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const handleQuickExtract = async () => {
    const ids = quickExtractId.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (ids.length === 0) { toast.error("Enter at least one valid Reelly ID"); return; }
    setIsQuickExtracting(true);
    setQuickExtractResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("reelly-complete-offline-save", {
        body: { mode: "specific", project_ids: ids, mirror_images: true },
      });
      if (error) throw error;
      if (data?.success) {
        setQuickExtractResult({ success: true, message: data.message || `Extracted data for ${ids.length} project(s)` });
        toast.success(`✅ Extracted Reelly IDs: ${ids.join(", ")}`);
      } else {
        throw new Error(data?.error || "Extraction failed");
      }
    } catch (err: any) {
      setQuickExtractResult({ success: false, error: err.message });
      toast.error(err.message || "Quick extract failed");
    } finally { setIsQuickExtracting(false); }
  };

  const [fullAiProgress, setFullAiProgress] = useState({ processed: 0, enriched: 0, errors: 0 });
  const [fullAiStopRequested, setFullAiStopRequested] = useState(false);

  // Advanced: Clean & Sync
  const [isCleaningAndSyncing, setIsCleaningAndSyncing] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [cleanupStep, setCleanupStep] = useState<string | null>(null);
  const [showDestructiveDialog, setShowDestructiveDialog] = useState(false);
  const [destructiveConfirmed, setDestructiveConfirmed] = useState(false);

  // Advanced: Data Integrity
  const [isLoadingIntegrityStats, setIsLoadingIntegrityStats] = useState(false);
  const [integrityStats, setIntegrityStats] = useState<{
    projects_from_reelly: number; projects_with_provident_enrichments: number; provident_images: number; provident_documents: number; pending_provident_suggestions: number;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{
    success: boolean; restored?: { projects: number; images_deleted: number; documents_deleted: number; pending_deleted: number }; error?: string;
  } | null>(null);

  // ── Derived ──
  const displayTotalProjects = totalProjects ?? liveCounts?.reelly_total_api ?? liveCounts?.reelly_pending_queue ?? null;
  const syncPercent = syncProgress && syncProgress.total > 0 ? Math.min(100, Math.round((syncProgress.fetched / syncProgress.total) * 100)) : undefined;

  // ── Effects ──
  useEffect(() => { refreshCounts(); checkForResumableJob(); loadPersistedBackfillResults(); handleLoadBackfillStats(); }, []);
  
  useEffect(() => {
    const cached = localStorage.getItem('reelly-api-cache');
    if (cached) {
      try {
        const { totalProjects: cp, totalDevelopers: cd, apiConnected: cc, lastTested } = JSON.parse(cached);
        if (lastTested && Date.now() - lastTested < 3600000) {
          if (cp) setTotalProjects(cp);
          if (cd) setTotalDevelopers(cd);
          if (cc !== undefined) setApiConnected(cc);
        }
      } catch { /* ignore */ }
    }
  }, []);

  // ── Handlers ──
  const loadPersistedBackfillResults = async () => {
    try {
      const { data, error } = await supabase.from("sync_jobs").select("*").eq("job_type", "reelly_backfill").order("created_at", { ascending: false }).limit(1).single();
      if (!error && data) {
        const results = (data.error_log as Array<{ name: string; status: string; images?: number; docs?: number }>) || [];
        const updated = data.stats_updated || 0;
        const failed = data.stats_errors || 0;
        setBackfillResult({ success: data.status === "completed" || data.status === "running", processed: updated + failed, updated, failed, remaining: data.stats_skipped || 0, message: data.status === "completed" ? `Backfill complete! Updated ${updated} projects.` : `Backfill in progress...` });
        setBackfillProjectList(results);
      }
    } catch { /* No persisted results yet */ }
  };

  const checkForResumableJob = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("reelly-api-sync", { body: { action: "check_resume" } });
      if (!error && data?.has_active_job && data.job?.next_cursor) {
        setHasResumableJob(true);
        setResumableJobInfo(data.job);
      } else {
        setHasResumableJob(false);
        setResumableJobInfo(null);
      }
    } catch (err) { console.error("Error checking for resumable jobs:", err); }
  };

  const handleClearStuckJobs = async () => {
    try {
      const { data, error } = await supabase.from("sync_jobs").update({ status: 'completed', completed_at: new Date().toISOString() }).eq("status", "paused").is("next_cursor", null).select("id");
      if (error) throw error;
      const clearedCount = data?.length || 0;
      if (clearedCount > 0) { toast.success(`Cleared ${clearedCount} stuck sync jobs`); checkForResumableJob(); refreshCounts(); }
      else { toast.info("No stuck jobs found to clear"); }
    } catch (err: any) { toast.error(err.message || "Failed to clear stuck jobs"); }
  };

  const handleResumeSync = async () => {
    if (!resumableJobInfo?.next_cursor) { toast.error("No resumable job found"); return; }
    toast.info(`Resuming sync from page ${resumableJobInfo.current_page}...`);
    await handleSyncProjects(true, resumableJobInfo.next_cursor, resumableJobInfo.id);
    setHasResumableJob(false);
    setResumableJobInfo(null);
  };

  const handleTestApiConnection = async (): Promise<boolean> => {
    setIsTestingApi(true);
    try {
      const { data, error } = await supabase.functions.invoke("reelly-api-sync", { body: { action: "test" } });
      if (error) throw error;
      if (data?.success) {
        setApiConnected(true);
        const apiTotal = data.total_available || null;
        setTotalProjects(apiTotal);
        if (apiTotal) setApiTotal(apiTotal);
        localStorage.setItem('reelly-api-cache', JSON.stringify({ totalProjects: apiTotal, totalDevelopers, apiConnected: true, lastTested: Date.now() }));
        toast.success(`API connected! ${apiTotal?.toLocaleString()} projects available`);
        refreshCounts();
        return true;
      } else {
        setApiConnected(false);
        toast.error(data?.error || "API connection failed");
        return false;
      }
    } catch (err: any) {
      setApiConnected(false);
      toast.error(err.message || "Failed to test API connection");
      return false;
    } finally { setIsTestingApi(false); }
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
      const pageSize = 100;
      let cursor: string | null = resumeCursor || null;
      let currentJobId: string | null = jobId || null;
      let safety = 0;
      let aggregated: ApiSyncResult = { success: true, total_available: totalProjects ?? undefined, total_fetched: 0, total_published: 0, inserted: 0, updated: 0, skipped: 0, errors: [] };

      do {
        const { data, error } = await supabase.functions.invoke("reelly-api-sync", {
          body: { action: "sync", limit: pageSize, cursor, fullSync, job_id: currentJobId, resume_cursor: cursor, force_overwrite: fullSync },
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
          message: data.message, next_cursor: data.next_cursor, done: data.done,
        };

        setSyncResult(aggregated);
        if (aggregated.total_available && aggregated.total_fetched != null) {
          setSyncProgress({ fetched: aggregated.total_fetched, total: aggregated.total_available });
        }
        cursor = data.next_cursor ?? null;
        if (!fullSync) break;
        safety++;
        if (safety > 200) throw new Error("Sync aborted (too many pages).");
      } while (cursor);

      toast.success(fullSync ? "Full sync completed!" : (aggregated.message || "Sync completed!"));
      setIsRecentLoading(true);
      const { data: recent } = await supabase.from("pending_project_imports").select("id, name, slug, status, created_at, updated_at").ilike("source_url", "%reelly_%").gte("updated_at", startedAt).order("updated_at", { ascending: false }).limit(200);
      setRecentImports((recent || []) as RecentPendingImport[]);
    } catch (err: any) {
      toast.error(err.message || "Failed to sync projects");
      setSyncResult({ success: false, error: err.message });
    } finally { setIsRecentLoading(false); setIsSyncing(false); }
  };

  const handleSyncDevelopers = async (mode: "test" | "quick" | "full") => {
    setIsSyncingDevs(true);
    if (mode !== "test") setDevSyncResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("reelly-developers-sync", { body: { mode } });
      if (error) throw error;
      if (data?.success) {
        setDevSyncResult(data);
        if (data.total_available) {
          setTotalDevelopers(data.total_available);
          const cached = localStorage.getItem('reelly-api-cache');
          const cacheData = cached ? JSON.parse(cached) : {};
          localStorage.setItem('reelly-api-cache', JSON.stringify({ ...cacheData, totalDevelopers: data.total_available, lastTested: Date.now() }));
        }
        if (mode === "test") toast.success(`Developer API connected! ${data.total_available} developers available`);
        else toast.success(`Synced ${data.inserted} new, ${data.updated} updated developers`);
      } else {
        setDevSyncResult({ success: false, error: data?.error });
        toast.error(data?.error || "Developer sync failed");
      }
    } catch (err: any) {
      setDevSyncResult({ success: false, error: err.message });
      toast.error(err.message || "Failed to sync developers");
    } finally { setIsSyncingDevs(false); }
  };

  const handleSyncAreas = async (action: "extract_from_projects") => {
    setIsSyncingAreas(true);
    setAreasSyncResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("reelly-areas-sync", { body: { action } });
      if (error) throw error;
      if (data?.success) {
        setAreasSyncResult(data);
        if (data.unique_areas_found) setTotalAreas(data.unique_areas_found);
        toast.success(`Extracted ${data.inserted} new areas from projects`);
      } else {
        setAreasSyncResult({ success: false, error: data?.error });
        toast.error(data?.error || "Areas sync failed");
      }
    } catch (err: any) {
      setAreasSyncResult({ success: false, error: err.message });
      toast.error(err.message || "Failed to sync areas");
    } finally { setIsSyncingAreas(false); }
  };

  const handleLoadBackfillStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("reelly-backfill-projects", { body: { mode: "stats" } });
      if (error) throw error;
      if (data?.success && data.stats) { setBackfillStats(data.stats); toast.success(`Found ${data.stats.missing_any} projects needing backfill`); }
      else toast.error(data?.error || "Failed to load backfill stats");
    } catch (err: any) { toast.error(err.message || "Failed to load backfill stats"); }
  };

  const handleRunBackfill = async (mode: "batch" | "all" = "batch") => {
    if (mode === "all") {
      if (!confirm("🔄 FULL BACKFILL\n\nThis will fetch detailed data for ALL approved projects from Reelly API.\n\nThis may take 10-20 minutes. Continue?")) return;
    }
    setIsBackfilling(true);
    const backfillStartedAt = new Date().toISOString();

    try {
      const { data: prevJob } = await supabase.from("sync_jobs").select("*").eq("job_type", "reelly_backfill").order("created_at", { ascending: false }).limit(1).maybeSingle();
      const prevUpdated = prevJob?.stats_updated || 0;
      const prevFailed = prevJob?.stats_errors || 0;
      const prevResults = (prevJob?.error_log as Array<{ name: string; slug?: string; status: string; images?: number; docs?: number }>) || [];
      let aggregated = { processed: prevUpdated + prevFailed, updated: prevUpdated, failed: prevFailed, remaining: 999 };
      let allResults = [...prevResults];
      setBackfillResult({ success: true, ...aggregated, message: `Resuming backfill (${prevUpdated} previously updated)...` });
      setBackfillProjectList(allResults);

      let batches = 0;
      const maxBatches = mode === "all" ? 100 : 1;

      let jobId: string | undefined;
      if (prevJob?.id && prevJob?.status !== "completed") {
        jobId = prevJob.id;
        await supabase.from("sync_jobs").update({ status: "running", updated_at: new Date().toISOString() }).eq("id", jobId);
      } else {
        const { data: jobRow } = await supabase.from("sync_jobs").insert({ job_type: "reelly_backfill", status: "running", stats_updated: 0, stats_errors: 0, stats_skipped: 0, error_log: [] as unknown as Json[] }).select("id").single();
        jobId = jobRow?.id;
      }

      while (aggregated.remaining > 0 && batches < maxBatches) {
        const { data, error } = await supabase.functions.invoke("reelly-backfill-projects", { body: { mode: "batch", batch_size: 50, started_at: backfillStartedAt } });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Backfill failed");

        const batchResults = (Array.isArray(data.results) ? data.results : []) as Array<{ name: string; slug?: string; status: string; images?: number; docs?: number }>;
        allResults = [...allResults, ...batchResults];
        aggregated = { processed: aggregated.processed + (data.processed || 0), updated: aggregated.updated + (data.updated || 0), failed: aggregated.failed + (data.failed || 0), remaining: data.remaining || 0 };
        setBackfillResult({ success: true, ...aggregated, message: `Processing batch ${batches + 1}...` });
        setBackfillProjectList(allResults);

        if (jobId) {
          await supabase.from("sync_jobs").update({ stats_updated: aggregated.updated, stats_errors: aggregated.failed, stats_skipped: aggregated.remaining, error_log: allResults.slice(-500) as unknown as Json[], updated_at: new Date().toISOString() }).eq("id", jobId);
        }
        batches++;
        if (aggregated.remaining > 0 && batches < maxBatches) await new Promise(r => setTimeout(r, 500));
      }

      setBackfillResult({ success: true, ...aggregated, message: `Backfill complete! Updated ${aggregated.updated} projects.` });
      if (jobId) {
        await supabase.from("sync_jobs").update({ status: "completed", completed_at: new Date().toISOString(), stats_updated: aggregated.updated, stats_errors: aggregated.failed, stats_skipped: aggregated.remaining, error_log: allResults.slice(-500) as unknown as Json[] }).eq("id", jobId);
      }
      toast.success(`Backfilled ${aggregated.updated} projects with detailed data`);
      await loadPersistedBackfillResults();
      handleLoadBackfillStats();
    } catch (err: any) {
      setBackfillResult({ success: false, error: err.message });
      toast.error(err.message || "Backfill failed");
    } finally { setIsBackfilling(false); }
  };

  // Provident Firecrawl extraction
  const handleProvidentExtract = async () => {
    if (!confirm("🔍 PROVIDENT EXTRACTION\n\nThis uses Firecrawl to scrape Provident project pages for images, PDFs, brochures, and floor plans.\n\nThis uses Firecrawl credits. Continue?")) return;
    setIsProvidentExtracting(true);
    setProvidentResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("provident-batch-extract", { body: { batch_size: 1 } });
      if (error) throw error;
      if (data?.success) {
        setProvidentResult(data);
        toast.success(`Processed ${data.processed} projects, found ${data.total_pdfs_found || 0} PDFs, ${data.total_images_found || 0} images`);
      } else {
        setProvidentResult({ error: data?.error });
        toast.error(data?.error || "Provident extraction failed");
      }
    } catch (err: any) {
      setProvidentResult({ error: err.message });
      toast.error(err.message || "Failed to extract from Provident");
    } finally { setIsProvidentExtracting(false); }
  };

  // Provident full loop extraction
  const handleFullProvidentExtract = async () => {
    if (!confirm("🔍 FULL PROVIDENT EXTRACTION\n\nThis will extract ALL Provident projects using Firecrawl.\n\nThis may use many Firecrawl credits. Continue?")) return;
    setIsFullProvidentRunning(true);
    setFullProvidentStopRequested(false);
    setFullProvidentProgress({ processed: 0, docs: 0, images: 0, errors: 0 });

    try {
      let totalProcessed = 0, totalDocs = 0, totalImages = 0, totalErrors = 0;
      let hasMore = true;
      while (hasMore && !fullProvidentStopRequested) {
        const { data, error } = await supabase.functions.invoke("provident-batch-extract", { body: { batch_size: 10 } });
        if (error) throw error;
        if (!data?.success) break;
        totalProcessed += data.processed || 0;
        totalDocs += data.total_docs_inserted || 0;
        totalImages += data.total_images_inserted || 0;
        totalErrors += data.errors || 0;
        setFullProvidentProgress({ processed: totalProcessed, docs: totalDocs, images: totalImages, errors: totalErrors });
        hasMore = (data.processed || 0) > 0;
        if (hasMore) await new Promise(r => setTimeout(r, 2000));
      }
      setProvidentResult({ processed: totalProcessed, total_docs_inserted: totalDocs, total_images_inserted: totalImages, errors: totalErrors });
      toast.success(`Full extraction complete! ${totalProcessed} projects, ${totalDocs} docs, ${totalImages} images`);
    } catch (err: any) {
      toast.error(err.message || "Full extraction failed");
    } finally { setIsFullProvidentRunning(false); }
  };

  // Provident page-data enrichment (free, no Firecrawl)
  const handleProvidentPageDataEnrich = async () => {
    if (!confirm("📄 PROVIDENT PAGE-DATA ENRICHMENT\n\nThis uses free page-data.json to fill FAQs, descriptions, amenities, and brochure links for Provident-sourced projects.\n\nNo Firecrawl credits used. Continue?")) return;
    setIsBulkEnriching(true);
    setBulkEnrichResult(null);
    setFullAiStopRequested(false);
    setFullAiProgress({ processed: 0, enriched: 0, errors: 0 });

    try {
      let totalProcessed = 0, totalEnriched = 0, totalErrors = 0, totalImages = 0, totalDocs = 0, totalFields = 0;
      let remaining = 1;
      while (remaining > 0 && !fullAiStopRequested) {
        const { data, error } = await supabase.functions.invoke("enrich-project-test", { body: { mode: "batch", batch_size: 10, source: "provident_only" } });
        if (error) throw error;
        if (!data?.success) break;
        totalProcessed += data.processed || 0;
        totalEnriched += data.enriched || 0;
        totalErrors += data.errors || 0;
        totalImages += data.total_images || 0;
        totalDocs += data.total_documents || 0;
        totalFields += data.total_fields || 0;
        remaining = data.remaining || 0;
        setFullAiProgress({ processed: totalProcessed, enriched: totalEnriched, errors: totalErrors });
        if (remaining > 0) await new Promise(r => setTimeout(r, 1000));
      }
      setBulkEnrichResult({ success: true, processed: totalProcessed, images_added: totalImages, docs_added: totalDocs, fields_updated: totalFields, errors: totalErrors, message: `Enriched ${totalEnriched} of ${totalProcessed} projects` });
      toast.success(`Provident enrichment complete! ${totalEnriched} projects enriched.`);
    } catch (err: any) {
      setBulkEnrichResult({ success: false, error: err.message });
      toast.error(err.message || "Enrichment failed");
    } finally { setIsBulkEnriching(false); }
  };

  // Advanced: Clean & Sync Fresh
  const handleCleanAndSyncClick = () => { setDestructiveConfirmed(false); setShowDestructiveDialog(true); };
  const executeCleanAndSync = async () => {
    if (!destructiveConfirmed) { toast.error("Please confirm you understand what will be deleted"); return; }
    setShowDestructiveDialog(false);
    setIsCleaningAndSyncing(true);
    setCleanupResult(null);
    setCleanupStep("cleanup");
    try {
      const { data: wipeData, error: wipeError } = await supabase.functions.invoke("wipe-and-rebuild", { body: { confirm: true, mode: "reelly_only" } });
      if (wipeError) throw wipeError;
      if (!wipeData?.success) throw new Error(wipeData?.error || "Cleanup failed");
      setCleanupResult(wipeData);
      toast.success(`Cleaned ${wipeData.deleted?.non_reelly_areas || 0} areas, ${wipeData.deleted?.non_reelly_queue_items || 0} queue items`);
      setCleanupStep("syncing");
      await handleSyncProjects(true);
      setCleanupStep("areas");
      await handleSyncAreas("extract_from_projects");
      setCleanupStep("done");
      toast.success("✅ Clean & Sync completed!");
    } catch (err: any) {
      toast.error(err.message || "Clean & Sync failed");
      setCleanupResult({ success: false, error: err.message });
    } finally { setIsCleaningAndSyncing(false); }
  };

  // Advanced: Data Integrity
  const handleLoadIntegrityStats = async () => {
    setIsLoadingIntegrityStats(true);
    try {
      const { data, error } = await supabase.functions.invoke("restore-to-reelly", { body: { mode: "stats" } });
      if (error) throw error;
      if (data?.success) setIntegrityStats(data.stats);
      else toast.error(data?.error || "Failed to load integrity stats");
    } catch (err: any) { toast.error(err.message || "Failed to load integrity stats"); }
    finally { setIsLoadingIntegrityStats(false); }
  };

  const handleGlobalRestore = async () => {
    const { data: preview } = await supabase.functions.invoke("restore-to-reelly", { body: { mode: "global", confirm: false } });
    if (!preview?.preview) { toast.error("Failed to preview restore operation"); return; }
    if (!confirm(`⚠️ RESTORE TO REELLY-ONLY\n\nThis will:\n• Restore ${preview.projects_to_restore} projects\n• Delete ${preview.images_to_delete} Provident images\n• Delete ${preview.documents_to_delete} Provident docs\n• Delete ${preview.pending_to_delete} pending suggestions\n\nContinue?`)) return;
    setIsRestoring(true);
    setRestoreResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("restore-to-reelly", { body: { mode: "global", confirm: true } });
      if (error) throw error;
      if (data?.success) { setRestoreResult(data); toast.success(`Restored ${data.restored?.projects || 0} projects`); handleLoadIntegrityStats(); }
      else { setRestoreResult({ success: false, error: data?.error }); toast.error(data?.error || "Restore failed"); }
    } catch (err: any) { setRestoreResult({ success: false, error: err.message }); toast.error(err.message || "Failed to restore"); }
    finally { setIsRestoring(false); }
  };

  const handleClearPendingSuggestions = async () => {
    const { data: preview } = await supabase.functions.invoke("restore-to-reelly", { body: { mode: "pending_only", confirm: false } });
    if (!preview?.preview) { toast.error("Failed to preview operation"); return; }
    if (preview.pending_to_delete === 0) { toast.info("No pending Provident suggestions to delete"); return; }
    if (!confirm(`Delete ${preview.pending_to_delete} pending Provident suggestions?`)) return;
    try {
      const { data, error } = await supabase.functions.invoke("restore-to-reelly", { body: { mode: "pending_only", confirm: true } });
      if (error) throw error;
      if (data?.success) { toast.success(`Deleted ${data.deleted_pending} pending Provident suggestions`); handleLoadIntegrityStats(); }
      else toast.error(data?.error || "Failed to clear suggestions");
    } catch (err: any) { toast.error(err.message || "Failed to clear suggestions"); }
  };

  const goToApprovalQueue = () => { navigate("/listing-admin?view=data-ops&syncTab=approvals", { replace: true }); };

  // ═══════════════════════════════════════════════════════════
  // ██  RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── Live Database Counts ── */}
      {liveCounts && (
        <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Live Database Counts
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {new Date(liveCounts.last_updated).toLocaleTimeString()}
              <Button variant="ghost" size="sm" onClick={refreshCounts} className="h-6 px-2"><RefreshCw className="w-3 h-3" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
              <p className="text-2xl font-bold text-emerald-600">{displayTotalProjects?.toLocaleString() || '—'}</p>
              <p className="text-xs text-slate-500">API Total (Reelly)</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
              <p className="text-2xl font-bold text-blue-600">{liveCounts.reelly_pending_queue.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Pending Queue</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
              <p className="text-2xl font-bold text-green-600">{liveCounts.reelly_approved.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Approved (Live DB)</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Resume Sync Banner ── */}
      {hasResumableJob && resumableJobInfo && (
        <Alert className="border-amber-400 bg-amber-50">
          <RotateCcw className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Interrupted Sync Detected</AlertTitle>
          <AlertDescription className="text-amber-700">
            <div className="flex items-center justify-between gap-4 flex-wrap mt-2">
              <span>Sync was interrupted at page {resumableJobInfo.current_page}. You can resume from where you left off.</span>
              <Button onClick={handleResumeSync} disabled={isSyncing} className="bg-amber-600 hover:bg-amber-700 text-white">
                <RotateCcw className="h-4 w-4 mr-2" /> Resume Sync
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ██  SECTION 1: REELLY ENRICHMENT                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-emerald-900 flex items-center gap-2">
                  Reelly Enrichment
                  {apiConnected === true && <Badge className="bg-emerald-500 text-white">Connected</Badge>}
                  {apiConnected === false && <Badge variant="destructive">Disconnected</Badge>}
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  Full API sync — projects, developers, areas, backfill details
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              {displayTotalProjects && <span className="font-bold">{displayTotalProjects.toLocaleString()} projects</span>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* ── 1. API Connection + Sync ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 rounded-xl p-4 border border-emerald-200">
              <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" /> API Connection
              </h3>
              <Button onClick={handleTestApiConnection} disabled={isTestingApi} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {isTestingApi ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Testing...</> : <><Zap className="h-4 w-4 mr-2" />Test API Connection</>}
              </Button>
              {apiConnected === true && totalProjects && (
                <div className="mt-3 p-3 bg-emerald-100 rounded-lg">
                  <p className="text-emerald-800 text-sm font-medium">✓ Connected</p>
                  <p className="text-emerald-700 text-2xl font-bold">{totalProjects.toLocaleString()} projects</p>
                </div>
              )}
            </div>

            <div className="bg-white/80 rounded-xl p-4 border border-emerald-200">
              <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                <CloudDownload className="w-4 h-4 text-emerald-600" /> Project Sync
              </h3>
              <div className="space-y-2">
                <Button onClick={() => handleSyncProjects(false)} disabled={isSyncing || apiConnected !== true} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {isSyncing ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Syncing...</> : <><Play className="h-4 w-4 mr-2" />Quick Sync (100)</>}
                </Button>
                <Button onClick={() => handleSyncProjects(true)} disabled={isSyncing || apiConnected !== true} variant="outline" className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  <Download className="h-4 w-4 mr-2" /> Full Sync (All)
                </Button>
              </div>
            </div>
          </div>

          {/* Sync progress */}
          {isSyncing && (
            <div className="bg-white/80 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-3 mb-3">
                <RefreshCw className="h-5 w-5 text-emerald-600 animate-spin" />
                <span className="font-medium text-zinc-900">Syncing projects from Reelly API...</span>
              </div>
              <Progress value={syncPercent} className="h-2" />
              {syncProgress && syncStartTime ? (() => {
                const elapsedSec = (Date.now() - syncStartTime) / 1000;
                const pps = elapsedSec > 0 ? syncProgress.fetched / elapsedSec : 0;
                const remaining = syncProgress.total - syncProgress.fetched;
                const eta = pps > 0 ? Math.ceil(remaining / pps) : null;
                return (
                  <p className="text-sm text-zinc-500 mt-2">
                    {syncProgress.fetched.toLocaleString()} / {syncProgress.total.toLocaleString()} ({syncPercent}%)
                    {pps > 0 && <span> • ~{pps.toFixed(0)}/sec{eta != null && eta > 0 && <span> • ~{eta < 60 ? `${eta}s` : `${Math.ceil(eta / 60)}m`} left</span>}</span>}
                  </p>
                );
              })() : <p className="text-sm text-zinc-500 mt-2">Starting sync…</p>}
            </div>
          )}

          {/* Sync results */}
          {syncResult && (
            <div className="bg-white/80 rounded-xl p-4 border border-emerald-200">
              <h3 className="font-semibold text-zinc-900 mb-3">Sync Results</h3>
              {syncResult.success ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-blue-600">{syncResult.total_fetched?.toLocaleString() || 0}</p>
                      <p className="text-xs text-zinc-500">Fetched</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-emerald-600">{syncResult.inserted || 0}</p>
                      <p className="text-xs text-zinc-500">New</p>
                    </div>
                    <div className="bg-cyan-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-cyan-600">{syncResult.updated || 0}</p>
                      <p className="text-xs text-zinc-500">Updated</p>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-zinc-600">{syncResult.skipped || 0}</p>
                      <p className="text-xs text-zinc-500">Skipped</p>
                    </div>
                  </div>
                  {recentImports.length > 0 && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsRecentOpen(true)}>
                      View {recentImports.length} processed projects →
                    </Button>
                  )}
                  <div className="mt-3">
                    <Button onClick={goToApprovalQueue} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <ArrowRight className="h-4 w-4 mr-2" /> Open Approval Queue
                    </Button>
                  </div>
                </>
              ) : (
                <Alert className="border-red-300 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{syncResult.error || "Sync failed"}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* ── Divider ── */}
          <div className="border-t border-emerald-200" />

          {/* ── 2. Backfill Details ── */}
          <div>
            <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4" /> Backfill Missing Details
              {backfillStats?.missing_any === 0 && <CheckCircle className="h-4 w-4 text-emerald-500" />}
            </h3>
            <p className="text-sm text-emerald-700 mb-3">Fetch floor plans, amenities, documents for approved projects from Reelly API detail endpoint.</p>
            
            {backfillStats?.missing_any === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-100 rounded-xl border border-emerald-300 mb-4">
                <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-800">All projects are fully backfilled</p>
                  <p className="text-sm text-emerald-600">{backfillStats.total_projects.toLocaleString()} projects have complete data.</p>
                </div>
                <Button onClick={handleLoadBackfillStats} variant="outline" size="sm" className="ml-auto border-emerald-300 text-emerald-700">
                  <RefreshCw className="h-4 w-4 mr-1" /> Recheck
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mb-4">
                <Button onClick={handleLoadBackfillStats} disabled={isBackfilling} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                  <RefreshCw className="h-4 w-4 mr-2" /> Check Missing
                </Button>
                <Button onClick={() => handleRunBackfill("batch")} disabled={isBackfilling} className="bg-emerald-600 hover:bg-emerald-700">
                  {isBackfilling ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Backfilling...</> : <><Zap className="h-4 w-4 mr-2" />Backfill Batch (50)</>}
                </Button>
                <Button onClick={() => handleRunBackfill("all")} disabled={isBackfilling} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                  <Download className="h-4 w-4 mr-2" /> Backfill All
                </Button>
              </div>
            )}

            {backfillStats && (
              <div className="bg-white/80 rounded-xl p-4 border border-emerald-200 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: "Total", value: backfillStats.total_projects, color: "emerald" },
                    { label: "Missing Floor Plans", value: backfillStats.missing_floor_plans, color: backfillStats.missing_floor_plans > 0 ? "amber" : "emerald" },
                    { label: "Missing Amenities", value: backfillStats.missing_amenities, color: backfillStats.missing_amenities > 0 ? "amber" : "emerald" },
                    { label: "Missing Docs", value: backfillStats.missing_documents, color: backfillStats.missing_documents > 0 ? "amber" : "emerald" },
                    { label: "Not Fetched", value: backfillStats.missing_any, color: backfillStats.missing_any > 0 ? "red" : "emerald" },
                  ].map((s, i) => (
                    <div key={i} className={`bg-${s.color}-50 rounded-lg p-3 text-center`}>
                      <p className={`text-xl font-bold text-${s.color}-700`}>{s.value.toLocaleString()}</p>
                      <p className="text-xs text-zinc-600">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {backfillResult && (
              <div className={`bg-white/80 rounded-xl p-4 border ${backfillResult.success ? 'border-emerald-200' : 'border-red-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-zinc-900">Backfill Results</h4>
                  {backfillProjectList.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => { setBackfillResult(null); setBackfillProjectList([]); supabase.from("sync_jobs").delete().eq("job_type", "reelly_backfill").then(() => {}); }} className="text-xs text-zinc-500 hover:text-red-600">
                      <Trash2 className="h-3 w-3 mr-1" /> Clear
                    </Button>
                  )}
                </div>
                {backfillResult.success ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button type="button" className="bg-blue-50 rounded-lg p-3 text-center hover:shadow-md transition cursor-pointer" onClick={() => { setBackfillListFilter("all"); setIsBackfillListOpen(true); }}>
                      <p className="text-xl font-bold text-blue-600">{backfillResult.processed || 0}</p>
                      <p className="text-xs text-zinc-500">Processed</p>
                    </button>
                    <button type="button" className="bg-emerald-50 rounded-lg p-3 text-center hover:shadow-md transition cursor-pointer" onClick={() => { setBackfillListFilter("success"); setIsBackfillListOpen(true); }}>
                      <p className="text-xl font-bold text-emerald-600">{backfillResult.updated || 0}</p>
                      <p className="text-xs text-zinc-500">Updated</p>
                    </button>
                    <button type="button" className="bg-red-50 rounded-lg p-3 text-center hover:shadow-md transition cursor-pointer" onClick={() => { setBackfillListFilter("failed"); setIsBackfillListOpen(true); }}>
                      <p className="text-xl font-bold text-red-600">{backfillResult.failed || 0}</p>
                      <p className="text-xs text-zinc-500">Failed</p>
                    </button>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-amber-600">{backfillResult.remaining || 0}</p>
                      <p className="text-xs text-zinc-500">Remaining</p>
                    </div>
                  </div>
                ) : (
                  <Alert className="border-red-300 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{backfillResult.error || "Backfill failed"}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-emerald-200" />

          {/* ── Quick Extract by Reelly ID ── */}
          <div>
            <h3 className="font-semibold text-emerald-900 mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Quick Extract by Reelly ID
            </h3>
            <p className="text-xs text-emerald-700 mb-3">
              Enter one or more Reelly IDs (comma-separated) to extract full project data, images, bedrooms, prices, and amenities immediately.
              <strong className="ml-1">Example: 3003, 1261</strong>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={quickExtractId}
                onChange={e => setQuickExtractId(e.target.value)}
                placeholder="e.g. 3003, 1261, 2945"
                className="flex-1 rounded-lg border border-emerald-300 px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                onKeyDown={e => { if (e.key === "Enter") handleQuickExtract(); }}
              />
              <Button
                onClick={handleQuickExtract}
                disabled={isQuickExtracting || !quickExtractId.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
              >
                {isQuickExtracting ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Extracting...</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" />Extract Now</>
                )}
              </Button>
            </div>
            {quickExtractResult && (
              <div className={`mt-3 p-3 rounded-lg border text-sm ${quickExtractResult.success ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50 border-red-300 text-red-700"}`}>
                {quickExtractResult.success ? `✅ ${quickExtractResult.message}` : `❌ ${quickExtractResult.error}`}
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-emerald-200" />

          <div>
            <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4" /> Developer Sync
              {totalDevelopers && <Badge variant="outline" className="border-emerald-300 text-emerald-700">{totalDevelopers} devs</Badge>}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Button onClick={() => handleSyncDevelopers("test")} disabled={isSyncingDevs} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                {isSyncingDevs ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Testing...</> : <><Zap className="h-4 w-4 mr-2" />Test</>}
              </Button>
              <Button onClick={() => handleSyncDevelopers("quick")} disabled={isSyncingDevs} className="bg-emerald-600 hover:bg-emerald-700">
                <Play className="h-4 w-4 mr-2" /> Quick Sync (50)
              </Button>
              <Button onClick={() => handleSyncDevelopers("full")} disabled={isSyncingDevs} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                <Download className="h-4 w-4 mr-2" /> Full Sync
              </Button>
            </div>
            {devSyncResult && devSyncResult.success && devSyncResult.mode !== "test" && (
              <div className="bg-white/80 rounded-xl p-4 border border-emerald-200">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-emerald-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-emerald-900">{devSyncResult.processed || 0}</p><p className="text-xs text-emerald-600">Processed</p></div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-emerald-700">{devSyncResult.inserted || 0}</p><p className="text-xs text-emerald-600">New</p></div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-blue-700">{devSyncResult.updated || 0}</p><p className="text-xs text-blue-600">Updated</p></div>
                  <div className="bg-zinc-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-zinc-700">{devSyncResult.skipped || 0}</p><p className="text-xs text-zinc-600">Skipped</p></div>
                  <div className={`rounded-lg p-3 text-center ${(devSyncResult.errors || 0) > 0 ? 'bg-red-50' : 'bg-zinc-50'}`}><p className={`text-xl font-bold ${(devSyncResult.errors || 0) > 0 ? 'text-red-600' : 'text-zinc-400'}`}>{devSyncResult.errors || 0}</p><p className="text-xs text-zinc-500">Errors</p></div>
                </div>
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-emerald-200" />

          {/* ── 4. Areas Sync ── */}
          <div>
            <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Areas Sync
              {totalAreas && <Badge variant="outline" className="border-emerald-300 text-emerald-700">{totalAreas} areas</Badge>}
            </h3>
            <Button onClick={() => handleSyncAreas("extract_from_projects")} disabled={isSyncingAreas} className="w-full bg-emerald-600 hover:bg-emerald-700 mb-4">
              {isSyncingAreas ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Extracting...</> : <><Download className="h-4 w-4 mr-2" />Extract Areas from Projects</>}
            </Button>
            {areasSyncResult && areasSyncResult.success && (
              <div className="bg-white/80 rounded-xl p-4 border border-emerald-200">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-emerald-900">{areasSyncResult.total_available || 0}</p><p className="text-xs text-emerald-600">Found</p></div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-emerald-700">{areasSyncResult.inserted || 0}</p><p className="text-xs text-emerald-600">New</p></div>
                  <div className="bg-zinc-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-zinc-700">{areasSyncResult.skipped || 0}</p><p className="text-xs text-zinc-600">Existing</p></div>
                </div>
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-emerald-200" />

          {/* ── 5. Test Project Enrichment + Provident Extraction ── */}
          <div>
            <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Project Enrichment (Test → Bulk)
            </h3>
            <p className="text-sm text-emerald-700 mb-3">Step 1: Test a single project enrichment. Step 2: Run bulk extraction after confirming quality.</p>
            <div className="flex gap-2 mb-2">
              <input type="text" placeholder="Enter project slug" value={enrichTestSlug} onChange={(e) => setEnrichTestSlug(e.target.value)} className="flex-1 px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <Button variant="outline" size="sm" className="text-xs whitespace-nowrap" onClick={async () => {
                try {
                  const { data } = await supabase.from("projects").select("slug").not("reelly_id", "is", null).not("cover_image_url", "is", null).limit(50);
                  if (data?.length) { const r = data[Math.floor(Math.random() * data.length)]; setEnrichTestSlug(r.slug); toast.success(`Selected: ${r.slug}`); }
                } catch (err: any) { toast.error(err.message); }
              }}>🎲 Random</Button>
              <Button onClick={async () => {
                if (!enrichTestSlug.trim()) { toast.error("Enter a project slug"); return; }
                setIsEnrichTesting(true); setEnrichTestResult(null);
                try {
                  const { data, error } = await supabase.functions.invoke("enrich-project-test", { body: { slug: enrichTestSlug.trim() } });
                  if (error) throw error;
                  setEnrichTestResult(data);
                } catch (err: any) { toast.error(err.message); setEnrichTestResult({ success: false, error: err.message }); }
                finally { setIsEnrichTesting(false); }
              }} disabled={isEnrichTesting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isEnrichTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>

            {/* Enrichment test results */}
            {enrichTestResult && enrichTestResult.success && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold text-sm">
                  <button onClick={() => navigate(`/project/${enrichTestResult.project?.slug}`)} className="hover:text-blue-600 hover:underline text-left">
                    {enrichTestResult.project?.name}
                  </button>
                  <span className="text-xs text-zinc-500 ml-2">(Reelly ID: {enrichTestResult.project?.reelly_id || "none"})</span>
                </h4>
                <div className="flex gap-3 text-xs flex-wrap">
                  {enrichTestResult.sources?.reelly?.available ? (
                    <button onClick={() => navigate(`/project/${enrichTestResult.project?.slug}`)} className="text-blue-600 underline flex items-center gap-1"><ExternalLink className="h-3 w-3" /> View Project</button>
                  ) : <span className="text-zinc-400">Reelly: {enrichTestResult.sources?.reelly?.reason}</span>}
                  {enrichTestResult.sources?.provident?.available && (
                    <span className="text-orange-600">Provident: {enrichTestResult.sources.provident.slug_used}</span>
                  )}
                  {enrichTestResult.sources?.firecrawl?.available && (
                    <Badge variant="outline" className="border-purple-300 text-purple-700 text-[10px]">🔥 Source: Firecrawl</Badge>
                  )}
                </div>

                {/* Before / After cards */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "BEFORE", data: enrichTestResult.before, borderColor: "border-red-200", bgColor: "bg-red-50", textColor: "text-red-700" },
                    { label: "AFTER ENRICHMENT", data: enrichTestResult.after, borderColor: "border-green-200", bgColor: "bg-green-50", textColor: "text-green-700" },
                  ].map(({ label, data, borderColor, bgColor, textColor }) => (
                    <div key={label} className={`border ${borderColor} rounded-xl overflow-hidden bg-white`}>
                      <div className={`${bgColor} px-3 py-1.5 border-b ${borderColor}`}>
                        <h5 className={`text-xs font-bold ${textColor}`}>{label}</h5>
                      </div>
                      {enrichTestResult.project?.cover_image_url && (
                        <button onClick={() => navigate(`/project/${enrichTestResult.project?.slug}`)} className="w-full">
                          <img src={enrichTestResult.project.cover_image_url} alt="" className="w-full h-32 object-cover hover:opacity-80 transition-opacity cursor-pointer" />
                        </button>
                      )}
                      <div className="p-3 space-y-1">
                        <button onClick={() => navigate(`/project/${enrichTestResult.project?.slug}`)} className="font-semibold text-sm truncate block hover:text-blue-600 hover:underline text-left w-full">
                          {enrichTestResult.project?.name}
                        </button>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          {[
                            { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Images", value: data?.images_count || 0, extra: (data?.new_images || 0) > 0 ? `+${data!.new_images}` : null },
                            { icon: <FileText className="w-3.5 h-3.5" />, label: "Documents", value: data?.documents_count || 0, extra: (data?.new_documents || 0) > 0 ? `+${data!.new_documents}` : null },
                            { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Amenities", value: data?.amenities_count || 0 },
                            { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "FAQs", value: data?.faqs_count || 0 },
                            { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Floor Plans", value: data?.floor_plans_count || 0 },
                            { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Unit Types", value: data?.unit_types_count || 0 },
                            { icon: data?.has_description ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />, label: "Description", value: data?.has_description ? "Yes" : "No", ok: data?.has_description },
                            { icon: data?.has_payment_plan ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />, label: "Payment Plan", value: data?.has_payment_plan ? "Yes" : "No", ok: data?.has_payment_plan },
                            { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "USPs", value: data?.usp_count || 0 },
                            { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Distances", value: data?.distances_count || 0 },
                            { icon: data?.has_video ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />, label: "Video", value: data?.has_video ? "Yes" : "No", ok: data?.has_video },
                            { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Highlights", value: data?.highlights_count || 0 },
                            { icon: data?.has_service_charge ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />, label: "Svc Charge", value: data?.has_service_charge ? "Yes" : "No", ok: data?.has_service_charge },
                            { icon: data?.has_roi_estimate ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />, label: "ROI", value: data?.has_roi_estimate ? "Yes" : "No", ok: data?.has_roi_estimate },
                          ].map((item, idx) => {
                            const isOk = item.ok !== undefined ? item.ok : (typeof item.value === 'number' ? item.value > 0 : item.value === "Yes");
                            return (
                              <div key={idx} className={`flex items-center gap-2 p-1.5 rounded-md text-xs ${isOk ? 'text-emerald-700 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                                {item.icon}
                                <span className="font-medium">{item.label}</span>
                                <span className="ml-auto font-bold">{item.value}{item.extra && <span className="text-emerald-600 ml-0.5">{item.extra}</span>}</span>
                              </div>
                            );
                          })}
                        </div>
                        {/* Gallery thumbnails */}
                        {data?.gallery_preview && data.gallery_preview.length > 0 && (
                          <div className="pt-1 border-t">
                            <p className="text-[9px] text-zinc-400 mb-1">Gallery Preview:</p>
                            <div className="grid grid-cols-4 gap-1">
                              {data.gallery_preview.map((url, i) => (
                                <img key={i} src={url} alt={`Preview ${i+1}`} className="w-full h-10 object-cover rounded" />
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Document names */}
                        {data?.document_names && data.document_names.length > 0 && (
                          <div className="pt-1 border-t">
                            <p className="text-[9px] text-zinc-400 mb-0.5">Documents:</p>
                            {data.document_names.map((name, i) => (
                              <span key={i} className="text-[9px] text-zinc-600 block">📎 {name}</span>
                            ))}
                          </div>
                        )}
                        {/* Source indicator */}
                        {data?.source && label === "AFTER ENRICHMENT" && (
                          <div className="pt-1 border-t">
                            <Badge variant="outline" className="text-[9px] border-purple-200 text-purple-600">
                              Source: {data.source}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {!enrichTestResult.applied && (
                    <Button onClick={async () => {
                      setIsEnrichApplying(true);
                      try {
                        const { data, error } = await supabase.functions.invoke("enrich-project-test", { body: { slug: enrichTestSlug.trim(), action: "apply" } });
                        if (error) throw error;
                        if (data?.success) { toast.success(`Applied! +${data.new_images} images, +${data.new_documents} docs`); setEnrichTestResult(prev => prev ? { ...prev, applied: true } : prev); }
                        else toast.error(data?.error || "Apply failed");
                      } catch (err: any) { toast.error(err.message); }
                      finally { setIsEnrichApplying(false); }
                    }} disabled={isEnrichApplying} className="bg-green-600 hover:bg-green-700 text-white flex-1">
                      {isEnrichApplying ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />} Apply Enrichment
                    </Button>
                  )}
                  <button onClick={() => navigate(`/project/${enrichTestResult.project?.slug}`)} className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                    <ExternalLink className="h-3 w-3" /> View Live
                  </button>
                </div>
                {enrichTestResult.applied && (
                  <Alert className="bg-green-50 border-green-300">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-700">Applied</AlertTitle>
                    <AlertDescription className="text-green-600">Data written to database.</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            {enrichTestResult && !enrichTestResult.success && (
              <Alert className="bg-red-50 border-red-300 mt-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {/* Suppress Reelly-specific errors when showing Provident extraction results */}
                  {(enrichTestResult.error || "").replace(/Reelly API error:?\s*\d*/gi, "Source API unavailable").replace(/reelly/gi, "Source")}
                </AlertDescription>
              </Alert>
            )}

            {/* ── Provident Firecrawl Extraction (inside test flow) ── */}
            <div className="border-t border-emerald-200 pt-4 mt-4">
              <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2 text-sm">
                <CloudDownload className="w-4 h-4" /> Provident Firecrawl Extraction
              </h4>
              <p className="text-xs text-emerald-600 mb-3">After confirming single-project enrichment works, use these to extract from Provident pages.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <Button onClick={() => handleProvidentExtract()} disabled={isProvidentExtracting || isFullProvidentRunning} className="bg-emerald-600 hover:bg-emerald-700">
                  {isProvidentExtracting ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Extracting...</> : <><Zap className="h-4 w-4 mr-2" />Extract Single (1)</>}
                </Button>
                <Button onClick={handleFullProvidentExtract} disabled={isProvidentExtracting || isFullProvidentRunning} variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                  {isFullProvidentRunning ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Running Full...</> : <><Download className="h-4 w-4 mr-2" />Full Extraction (All)</>}
                </Button>
              </div>

              {isFullProvidentRunning && (
                <div className="bg-white/80 rounded-xl p-4 border border-emerald-200 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-5 w-5 text-emerald-600 animate-spin" />
                      <span className="font-medium text-sm">Running full extraction...</span>
                    </div>
                    <Button variant="outline" size="sm" className="border-red-300 text-red-600" onClick={() => setFullProvidentStopRequested(true)}>Stop</Button>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    <div className="text-center"><p className="text-xl font-bold text-emerald-700">{fullProvidentProgress.processed}</p><p className="text-xs text-zinc-500">Processed</p></div>
                    <div className="text-center"><p className="text-xl font-bold text-blue-600">{fullProvidentProgress.docs}</p><p className="text-xs text-zinc-500">Docs</p></div>
                    <div className="text-center"><p className="text-xl font-bold text-emerald-600">{fullProvidentProgress.images}</p><p className="text-xs text-zinc-500">Images</p></div>
                    <div className="text-center"><p className="text-xl font-bold text-red-600">{fullProvidentProgress.errors}</p><p className="text-xs text-zinc-500">Errors</p></div>
                  </div>
                </div>
              )}

              {providentResult && !isFullProvidentRunning && (
                <div className="bg-white/80 rounded-xl p-4 border border-emerald-200 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-emerald-700">{providentResult.processed || 0}</p><p className="text-xs text-zinc-500">Processed</p></div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-blue-700">{providentResult.total_pdfs_found || 0}</p><p className="text-xs text-zinc-500">PDFs Found</p></div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-emerald-700">{providentResult.total_images_found || providentResult.total_images_inserted || 0}</p><p className="text-xs text-zinc-500">Images</p></div>
                    <div className="bg-cyan-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-cyan-700">{providentResult.total_docs_inserted || 0}</p><p className="text-xs text-zinc-500">Docs Inserted</p></div>
                    <div className={`rounded-lg p-3 text-center ${(providentResult.errors || 0) > 0 ? 'bg-red-50' : 'bg-zinc-50'}`}><p className={`text-xl font-bold ${(providentResult.errors || 0) > 0 ? 'text-red-600' : 'text-zinc-400'}`}>{providentResult.errors || 0}</p><p className="text-xs text-zinc-500">Errors</p></div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Page-Data Enrichment (Free) ── */}
            <div className="border-t border-emerald-200 pt-4 mt-4">
              <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" /> Page-Data Enrichment (Free)
              </h4>
              <p className="text-xs text-emerald-600 mb-3">
                Uses free page-data.json to fill FAQs, descriptions, amenities — no Firecrawl credits.
              </p>
              <Button onClick={handleProvidentPageDataEnrich} disabled={isBulkEnriching} className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold py-3">
                {isBulkEnriching ? <><RefreshCw className="h-5 w-5 mr-2 animate-spin" />Enriching...</> : <><Zap className="h-5 w-5 mr-2" />Enrich All (Free)</>}
              </Button>

              {isBulkEnriching && (
                <div className="bg-white/80 rounded-xl p-4 border border-emerald-200 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-5 w-5 text-emerald-600 animate-spin" />
                      <span className="font-medium text-sm">Running enrichment...</span>
                    </div>
                    <Button variant="outline" size="sm" className="border-red-300 text-red-600" onClick={() => setFullAiStopRequested(true)}>Stop</Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="text-center"><p className="text-xl font-bold text-emerald-700">{fullAiProgress.processed}</p><p className="text-xs text-zinc-500">Processed</p></div>
                    <div className="text-center"><p className="text-xl font-bold text-emerald-600">{fullAiProgress.enriched}</p><p className="text-xs text-zinc-500">Enriched</p></div>
                    <div className="text-center"><p className="text-xl font-bold text-red-600">{fullAiProgress.errors}</p><p className="text-xs text-zinc-500">Errors</p></div>
                  </div>
                </div>
              )}

              {bulkEnrichResult && !isBulkEnriching && (
                <div className="mt-4">
                  {bulkEnrichResult.success ? (
                    <Alert className="bg-emerald-50 border-emerald-300">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <AlertTitle className="text-emerald-700">Enrichment Complete</AlertTitle>
                      <AlertDescription className="text-emerald-600">
                        <strong>{bulkEnrichResult.processed}</strong> processed, <strong>{bulkEnrichResult.images_added || 0}</strong> images, <strong>{bulkEnrichResult.docs_added || 0}</strong> docs, <strong>{bulkEnrichResult.fields_updated || 0}</strong> fields updated
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-red-50 border-red-300">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">{bulkEnrichResult.error || "Failed"}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ██  ADVANCED TOOLS (Collapsible)                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="advanced" className="border rounded-lg bg-slate-50">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-700">Advanced Tools</span>
              <Badge variant="outline" className="text-xs text-slate-500">Maintenance</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 space-y-6">

            {/* Clear Stuck Jobs */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div>
                <h4 className="font-medium text-zinc-900">Clear Stuck Jobs</h4>
                <p className="text-sm text-zinc-500">Remove paused sync jobs that cannot be resumed</p>
              </div>
              <Button onClick={handleClearStuckJobs} variant="outline" size="sm" className="text-amber-700 border-amber-300 hover:bg-amber-50">
                <Trash2 className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>

            {/* Clean & Sync Fresh */}
            <div className="p-4 bg-white rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Clean & Sync Fresh
              </h4>
              <p className="text-sm text-red-700 mb-3">⚠️ Destructive: Deletes non-Reelly data, then full syncs everything fresh from API.</p>
              <Button onClick={handleCleanAndSyncClick} disabled={isCleaningAndSyncing} className="bg-red-600 hover:bg-red-700 text-white">
                {isCleaningAndSyncing ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />{cleanupStep || "Processing"}...</> : <><Trash2 className="h-4 w-4 mr-2" />Clean & Sync Fresh</>}
              </Button>
              {cleanupResult && cleanupResult.success && (
                <div className="mt-3 text-sm text-emerald-700">
                  ✅ Cleaned {cleanupResult.deleted?.non_reelly_areas || 0} areas, {cleanupResult.deleted?.non_reelly_queue_items || 0} queue items
                </div>
              )}
            </div>

            {/* Data Integrity / Restore */}
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-medium text-zinc-900 flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-slate-500" /> Data Integrity / Restore to Reelly-Only
              </h4>
              <p className="text-sm text-zinc-500 mb-3">View Provident enrichment stats and optionally restore to Reelly-only state.</p>

              <Button onClick={handleLoadIntegrityStats} disabled={isLoadingIntegrityStats} variant="outline" className="w-full mb-3">
                {isLoadingIntegrityStats ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Loading...</> : <><RefreshCw className="h-4 w-4 mr-2" />Load Integrity Stats</>}
              </Button>

              {integrityStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <div className="bg-emerald-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-emerald-700">{integrityStats.projects_from_reelly}</p><p className="text-xs text-emerald-600">From Reelly</p></div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-amber-700">{integrityStats.projects_with_provident_enrichments}</p><p className="text-xs text-amber-600">Provident Enriched</p></div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-amber-700">{integrityStats.provident_images}</p><p className="text-xs text-amber-600">Provident Images</p></div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-amber-700">{integrityStats.provident_documents}</p><p className="text-xs text-amber-600">Provident Docs</p></div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-blue-700">{integrityStats.pending_provident_suggestions}</p><p className="text-xs text-blue-600">Pending</p></div>
                </div>
              )}

              {restoreResult && restoreResult.success && restoreResult.restored && (
                <Alert className="border-emerald-300 bg-emerald-50 mb-3">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-700">
                    Restored {restoreResult.restored.projects} projects, deleted {restoreResult.restored.images_deleted} images, {restoreResult.restored.documents_deleted} docs
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button onClick={handleGlobalRestore} disabled={isRestoring} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {isRestoring ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Restoring...</> : <><RotateCcw className="h-4 w-4 mr-2" />Restore All to Reelly-Only</>}
                </Button>
                <Button onClick={handleClearPendingSuggestions} disabled={isRestoring} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                  <Trash2 className="h-4 w-4 mr-2" /> Clear Pending Suggestions
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* ── Dialogs ── */}
      <Dialog open={isRecentOpen} onOpenChange={setIsRecentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reelly projects processed in this sync</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-zinc-600">
            {isRecentLoading ? (
              <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Loading…</div>
            ) : recentImports.length === 0 ? <div>No items found for this run.</div> : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
                {recentImports.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 border rounded-lg p-2">
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-900 truncate">{p.name}</div>
                      <div className="text-xs text-zinc-500 truncate">{p.slug}</div>
                    </div>
                    <Badge variant="outline">{p.status || "pending"}</Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button variant="outline" onClick={() => setIsRecentOpen(false)}>Close</Button>
              <Button onClick={() => { setIsRecentOpen(false); goToApprovalQueue(); }} className="bg-blue-600 hover:bg-blue-700 text-white">Open Approval Queue <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBackfillListOpen} onOpenChange={setIsBackfillListOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Backfill Results — {backfillListFilter === "all" ? "All" : backfillListFilter === "success" ? "Updated" : "Failed"} Projects</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-3">
            {(["all", "success", "failed"] as const).map(f => (
              <Button key={f} variant={backfillListFilter === f ? "default" : "outline"} size="sm" onClick={() => setBackfillListFilter(f)}>
                {f === "all" ? `All (${backfillProjectList.length})` : f === "success" ? `Updated (${backfillProjectList.filter(p => p.status === "success").length})` : `Failed (${backfillProjectList.filter(p => p.status !== "success").length})`}
              </Button>
            ))}
          </div>
          <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-2">
            {backfillProjectList
              .filter(p => backfillListFilter === "all" ? true : backfillListFilter === "success" ? p.status === "success" : p.status !== "success")
              .map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border rounded-lg p-2 hover:bg-zinc-50">
                  <div className="min-w-0">
                    {p.slug ? (
                      <a href={`/project/${p.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-zinc-900 truncate text-sm hover:text-blue-600 hover:underline flex items-center gap-1">
                        {p.name} <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-50" />
                      </a>
                    ) : <div className="font-medium text-zinc-900 truncate text-sm">{p.name}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.status === "success" ? (
                      <>
                        {(p.images ?? 0) > 0 && <Badge variant="outline" className="text-xs">{p.images} imgs</Badge>}
                        {(p.docs ?? 0) > 0 && <Badge variant="outline" className="text-xs">{p.docs} docs</Badge>}
                        <Badge className="bg-emerald-500 text-xs">✓</Badge>
                      </>
                    ) : <Badge variant="destructive" className="text-xs">{p.status}</Badge>}
                  </div>
                </div>
              ))}
          </div>
          <div className="flex justify-end mt-2"><Button variant="outline" onClick={() => setIsBackfillListOpen(false)}>Close</Button></div>
        </DialogContent>
      </Dialog>

      {/* Destructive Action Confirmation */}
      <Dialog open={showDestructiveDialog} onOpenChange={setShowDestructiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Destructive Operation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-red-300 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                This will <strong>permanently delete</strong> all non-Reelly data (areas, queue items) and re-sync from the Reelly API.
              </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2">
              <Checkbox id="confirm-destructive" checked={destructiveConfirmed} onCheckedChange={(checked) => setDestructiveConfirmed(checked === true)} />
              <label htmlFor="confirm-destructive" className="text-sm text-zinc-700">I understand this will delete data and cannot be undone</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDestructiveDialog(false)}>Cancel</Button>
            <Button onClick={executeCleanAndSync} disabled={!destructiveConfirmed} className="bg-red-600 hover:bg-red-700 text-white">
              <Trash2 className="h-4 w-4 mr-2" /> Execute Clean & Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
