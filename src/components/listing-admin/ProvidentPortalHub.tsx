import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Database, RefreshCw, Zap, Download, CloudDownload,
  CheckCircle, Clock, AlertTriangle, TrendingUp,
  FileText, Image, Building2, Calendar, ShieldCheck, Trash2, Upload
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { HandoverRepairPanel } from "./HandoverRepairPanel";

interface EnrichmentStats {
  total: number;
  fullyEnriched: number;
  partiallyEnriched: number;
  unenriched: number;
}

export function ProvidentPortalHub() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, pending: 0 });
  const [enrichmentStats, setEnrichmentStats] = useState<EnrichmentStats>({ total: 0, fullyEnriched: 0, partiallyEnriched: 0, unenriched: 0 });
  const [scrapeTimestamps, setScrapeTimestamps] = useState<string[]>([]);

  // Auto-publish state
  const [autoPublishCount, setAutoPublishCount] = useState<number | null>(null);
  const [isAutoPublishing, setIsAutoPublishing] = useState(false);
  // Data integrity state
  const [integrityResult, setIntegrityResult] = useState<{ ghosts: number; duplicates: number } | null>(null);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);

  // Provident extraction state
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

  useEffect(() => { if (providentResult) sessionStorage.setItem('jj_providentResult', JSON.stringify(providentResult)); }, [providentResult]);
  useEffect(() => { sessionStorage.setItem('jj_fullProvidentProgress', JSON.stringify(fullProvidentProgress)); }, [fullProvidentProgress]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Get project counts
      const [publishedRes, allRes, pendingRes] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const total = allRes.count || 0;
      const published = publishedRes.count || 0;
      const pending = pendingRes.count || 0;
      setStats({ total, published, drafts: total - published - pending, pending });

      // Get enrichment coverage
      const { data: projects } = await supabase
        .from("projects")
        .select("id, amenities, description, handover_date, developer_name, floor_plan_types")
        .limit(1000);

      if (projects) {
        let fully = 0, partial = 0, un = 0;
        for (const p of projects) {
          const fields = [
            !!(p.amenities && (Array.isArray(p.amenities) ? p.amenities.length > 0 : true)),
            !!(p.description && p.description.length > 50),
            !!p.handover_date,
            !!p.developer_name,
            !!(p.floor_plan_types && (Array.isArray(p.floor_plan_types) ? p.floor_plan_types.length > 0 : true)),
          ];
          const filled = fields.filter(Boolean).length;
          if (filled >= 4) fully++;
          else if (filled >= 1) partial++;
          else un++;
        }
        setEnrichmentStats({ total: projects.length, fullyEnriched: fully, partiallyEnriched: partial, unenriched: un });
      }

      // Get scrape timestamps from extraction_job_logs
      const { data: jobs } = await supabase
        .from("extraction_job_logs")
        .select("started_at")
        .order("started_at", { ascending: false })
        .limit(5);

      if (jobs) {
        setScrapeTimestamps(jobs.map(j => j.started_at));
      }
    } catch (err) {
      console.error("Error fetching Provident stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  // === AUTO-PUBLISH COMPLETE PROJECTS ===
  const checkAutoPublishCount = async () => {
    try {
      // Count unpublished projects with complete core data
      const { count } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", false)
        .not("description", "is", null)
        .not("developer_name", "is", null)
        .not("handover_date", "is", null);
      setAutoPublishCount(count ?? 0);
    } catch { /* non-critical */ }
  };

  const handleAutoPublish = async () => {
    if (!confirm(`Auto-publish ${autoPublishCount} complete projects?\n\nThis will set is_published=true for all projects with description, developer, and handover date.`)) return;
    setIsAutoPublishing(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .update({ is_published: true, updated_at: new Date().toISOString() })
        .eq("is_published", false)
        .not("description", "is", null)
        .not("developer_name", "is", null)
        .not("handover_date", "is", null)
        .not("cover_image_url", "is", null)
        .gte("description", "a".repeat(50))
        .select("id");
      if (error) throw error;
      toast.success(`Auto-published ${data?.length ?? 0} projects!`);
      fetchStats();
      checkAutoPublishCount();
    } catch (err: any) {
      toast.error("Auto-publish failed: " + err.message);
    } finally {
      setIsAutoPublishing(false);
    }
  };

  // === DATA INTEGRITY CHECK ===
  const handleIntegrityCheck = async () => {
    setIsCheckingIntegrity(true);
    try {
      // Ghost entries: no images AND no description
      const { count: ghostCount } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .is("description", null)
        .eq("is_published", true);

      // Duplicate slugs
      const { data: allSlugs } = await supabase
        .from("projects")
        .select("slug")
        .limit(5000);
      const slugCounts: Record<string, number> = {};
      (allSlugs || []).forEach(p => { slugCounts[p.slug] = (slugCounts[p.slug] || 0) + 1; });
      const duplicateCount = Object.values(slugCounts).filter(c => c > 1).length;

      setIntegrityResult({ ghosts: ghostCount ?? 0, duplicates: duplicateCount });
      toast.info(`Integrity check: ${ghostCount ?? 0} ghost entries, ${duplicateCount} duplicate slugs`);
    } catch (err: any) {
      toast.error("Integrity check failed: " + err.message);
    } finally {
      setIsCheckingIntegrity(false);
    }
  };

  useEffect(() => { checkAutoPublishCount(); }, []);

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

  // Full loop extraction
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

  const enrichPercent = enrichmentStats.total > 0
    ? Math.round(((enrichmentStats.fullyEnriched + enrichmentStats.partiallyEnriched * 0.5) / enrichmentStats.total) * 100)
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FDFBF7] to-[#EFE6D6] border-2 border-[#B89555]/30 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-foreground font-bold text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-[#1A1A1A]" />
              PROVIDENT PORTAL
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Central hub for Provident data scraping, enrichment, and project synchronization.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats} className="border-[#B89555]/30 hover:bg-[#EFE6D6]/10 whitespace-nowrap min-w-[120px]">
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-[#B89555]/20">
          <CardContent className="p-4 text-center">
            <Building2 className="w-5 h-5 text-[#1A1A1A] mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-[11px] text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card className="border-[#B89555]/20">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-5 h-5 text-[color:var(--emerald-1)] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[color:var(--emerald-1)]">{stats.published}</p>
            <p className="text-[11px] text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card className="border-[#B89555]/20">
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
            <p className="text-[11px] text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-[#B89555]/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-700">{enrichmentStats.fullyEnriched}</p>
            <p className="text-[11px] text-muted-foreground">Fully Enriched</p>
          </CardContent>
        </Card>
        <Card className="border-[#B89555]/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-orange-600">{enrichmentStats.unenriched}</p>
            <p className="text-[11px] text-muted-foreground">Unenriched</p>
          </CardContent>
        </Card>
      </div>

      {/* Handover date repair */}
      <HandoverRepairPanel />

      {/* Enrichment Status */}
      <Card className="border-[#B89555]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#1A1A1A]" />
            Provident Enrichment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Enrichment Coverage</span>
            <span className="font-semibold text-foreground">{enrichPercent}%</span>
          </div>
          <Progress value={enrichPercent} className="h-3" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-sm">
            <div data-surface="emerald" className="rounded-lg p-3 border border-white/20" style={{ background: "linear-gradient(135deg,#064E3B 0%,#042c1c 58%,#000000 100%)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
              <p className="text-lg font-extrabold" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>{enrichmentStats.fullyEnriched}</p>
              <p className="text-[11px] font-semibold" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Fully Enriched</p>
            </div>
            <div className="rounded-lg p-3 border" style={{ background: "#FFF7E6", borderColor: "#F0C674" }}>
              <p className="text-lg font-extrabold" style={{ color: "#8A5A00", WebkitTextFillColor: "#8A5A00" }}>{enrichmentStats.partiallyEnriched}</p>
              <p className="text-[11px] font-semibold" style={{ color: "#8A5A00", WebkitTextFillColor: "#8A5A00" }}>Partially Enriched</p>
            </div>
            <div className="rounded-lg p-3 border" style={{ background: "#FEF2F2", borderColor: "#FCA5A5" }}>
              <p className="text-lg font-extrabold" style={{ color: "#B91C1C", WebkitTextFillColor: "#B91C1C" }}>{enrichmentStats.unenriched}</p>
              <p className="text-[11px] font-semibold" style={{ color: "#B91C1C", WebkitTextFillColor: "#B91C1C" }}>Unenriched</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Fields tracked: amenities, description, handover date, developer, floor plans
          </p>
        </CardContent>
      </Card>

      {/* Scrape Timestamps */}
      <Card className="border-[#B89555]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#1A1A1A]" />
            Scraping History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scrapeTimestamps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No scraping runs recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {scrapeTimestamps.map((ts, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground">
                    {i === 0 ? "Last scrape" : `Previous scrape #${i}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(ts), "h:mm a")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(ts), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Publish & Data Integrity */}
      <Card className="border-[#B89555]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1A1A1A]" />
            Data Quality & Auto-Publish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleAutoPublish}
              disabled={isAutoPublishing || (autoPublishCount ?? 0) === 0}
              className="jj-surface-emerald hover:jj-surface-emerald text-white"
            >
              {isAutoPublishing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Auto-Publish Complete ({autoPublishCount ?? '…'})
            </Button>
            <Button
              onClick={handleIntegrityCheck}
              disabled={isCheckingIntegrity}
              variant="outline"
              className="border-[#B89555]/30"
            >
              {isCheckingIntegrity ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Data Integrity Check
            </Button>
          </div>
          {integrityResult && (
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg p-3 text-center border ${integrityResult.ghosts > 0 ? 'bg-red-50 border-red-200' : 'jj-emerald-soft border-[color:var(--emerald-1)]/30'}`}>
                <p className={`text-xl font-bold ${integrityResult.ghosts > 0 ? 'text-red-700' : 'text-[color:var(--emerald-1)]'}`}>{integrityResult.ghosts}</p>
                <p className="text-xs text-muted-foreground">Ghost Entries (no description)</p>
              </div>
              <div className={`rounded-lg p-3 text-center border ${integrityResult.duplicates > 0 ? 'bg-amber-50 border-amber-200' : 'jj-emerald-soft border-[color:var(--emerald-1)]/30'}`}>
                <p className={`text-xl font-bold ${integrityResult.duplicates > 0 ? 'text-amber-700' : 'text-[color:var(--emerald-1)]'}`}>{integrityResult.duplicates}</p>
                <p className="text-xs text-muted-foreground">Duplicate Slugs</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provident Firecrawl Extraction Tools */}
      <Card className="border-[#B89555]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CloudDownload className="w-5 h-5 text-[#1A1A1A]" />
            Provident Firecrawl Extraction
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Scrape Provident project pages for images, PDFs, brochures, and floor plans using Firecrawl.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleProvidentExtract}
              disabled={isProvidentExtracting || isFullProvidentRunning}
              className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-white"
            >
              {isProvidentExtracting ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Extracting...</>
              ) : (
                <><Zap className="h-4 w-4 mr-2" />Extract Single (1)</>
              )}
            </Button>
            <Button
              onClick={handleFullProvidentExtract}
              disabled={isProvidentExtracting || isFullProvidentRunning}
              variant="outline"
              className="border-[#B89555]/30 text-foreground hover:bg-[#EFE6D6]/10"
            >
              {isFullProvidentRunning ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Running Full...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" />Full Extraction (All)</>
              )}
            </Button>
          </div>

          {isFullProvidentRunning && (
            <div className="bg-muted/30 rounded-xl p-4 border border-[#B89555]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-[#1A1A1A] animate-spin" />
                  <span className="font-medium text-sm">Running full extraction...</span>
                </div>
                <Button variant="outline" size="sm" className="border-destructive/30 text-destructive" onClick={() => setFullProvidentStopRequested(true)}>Stop</Button>
              </div>
              <div className="grid grid-cols-4 gap-3 mt-3">
                <div className="text-center"><p className="text-xl font-bold text-foreground">{fullProvidentProgress.processed}</p><p className="text-xs text-muted-foreground">Processed</p></div>
                <div className="text-center"><p className="text-xl font-bold text-blue-600">{fullProvidentProgress.docs}</p><p className="text-xs text-muted-foreground">Docs</p></div>
                <div className="text-center"><p className="text-xl font-bold text-[color:var(--emerald-1)]">{fullProvidentProgress.images}</p><p className="text-xs text-muted-foreground">Images</p></div>
                <div className="text-center"><p className="text-xl font-bold text-destructive">{fullProvidentProgress.errors}</p><p className="text-xs text-muted-foreground">Errors</p></div>
              </div>
            </div>
          )}

          {providentResult && !isFullProvidentRunning && (
            <div className="bg-muted/30 rounded-xl p-4 border border-[#B89555]/20">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="jj-emerald-soft rounded-lg p-3 text-center"><p className="text-xl font-bold text-[color:var(--emerald-1)]">{providentResult.processed || 0}</p><p className="text-xs text-muted-foreground">Processed</p></div>
                <div className="bg-blue-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-blue-700">{providentResult.total_pdfs_found || 0}</p><p className="text-xs text-muted-foreground">PDFs Found</p></div>
                <div className="jj-emerald-soft rounded-lg p-3 text-center"><p className="text-xl font-bold text-[color:var(--emerald-1)]">{providentResult.total_images_found || providentResult.total_images_inserted || 0}</p><p className="text-xs text-muted-foreground">Images</p></div>
                <div className="bg-cyan-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-cyan-700">{providentResult.total_docs_inserted || 0}</p><p className="text-xs text-muted-foreground">Docs Inserted</p></div>
                <div className={`rounded-lg p-3 text-center ${(providentResult.errors || 0) > 0 ? 'bg-red-50' : 'bg-muted/50'}`}><p className={`text-xl font-bold ${(providentResult.errors || 0) > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{providentResult.errors || 0}</p><p className="text-xs text-muted-foreground">Errors</p></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProvidentPortalHub;
