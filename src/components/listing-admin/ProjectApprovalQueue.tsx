import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, X, Clock, RefreshCw, Building2, MapPin, Calendar, 
  DollarSign, Bed, Ruler, FileText,
  ChevronLeft, ChevronRight, Merge, Plus, CheckSquare
} from "lucide-react";
import { format } from "date-fns";
import type { Json } from "@/integrations/supabase/types";
import { PendingImportCard } from "@/components/listing-admin/PendingImportCard";
import { ApprovalConfirmDialog } from "@/components/listing-admin/ApprovalConfirmDialog";
import { NewProjectDetector } from "@/components/listing-admin/NewProjectDetector";

interface ImageData {
  url: string;
  alt?: string;
}

interface DocumentData {
  url: string;
  type: string;
  name?: string;
}

interface PendingImport {
  id: string;
  name: string;
  slug: string | null;
  developer_name: string | null;
  developer_id: string | null;
  community_name: string | null;
  location: string | null;
  emirate: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  size_min: number | null;
  size_max: number | null;
  handover_date: string | null;
  payment_plan: string | null;
  property_type_label: string | null;
  status_label: string | null;
  images: ImageData[];
  documents: DocumentData[];
  matched_project_id: string | null;
  match_confidence: number;
  is_new_project: boolean;
  status: string;
  source_url: string | null;
  created_at: string;
}

interface ProjectApprovalQueueProps {
  onRefresh?: () => void;
  jobId?: string | null;
}

const parseJsonArray = <T,>(json: Json | null, defaultVal: T[] = []): T[] => {
  if (!json) return defaultVal;
  if (Array.isArray(json)) return json as T[];
  return defaultVal;
};

export function ProjectApprovalQueue({ onRefresh, jobId }: ProjectApprovalQueueProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [imports, setImports] = useState<PendingImport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [totalCompleteCount, setTotalCompleteCount] = useState<number | null>(null);
  const [totalNeedsWorkCount, setTotalNeedsWorkCount] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  // Default to a single inventory view (not job-filtered) to avoid confusing partial counts.
  const [showAll, setShowAll] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedImport, setSelectedImport] = useState<PendingImport | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | "repair" | null>(null);
  const [bulkDone, setBulkDone] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [incompleteCount, setIncompleteCount] = useState(0);
  // Filter: "all" | "complete" | "needs_work"
  const [statusFilter, setStatusFilter] = useState<"all" | "complete" | "needs_work">("all");
  // Source filter: "all" | "reelly" | "manual" | "provident"
  const [sourceFilter, setSourceFilter] = useState<"all" | "reelly" | "manual" | "provident">("all");
  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogMode, setConfirmDialogMode] = useState<"all" | "selected">("all");
  const [confirmDialogCount, setConfirmDialogCount] = useState(0);
  const { toast } = useToast();

  const PAGE_SIZE = 60;

  useEffect(() => {
    // Even when routed from a job preview page, default to showing ALL pending imports.
    // (User can still toggle to "this sync only" if needed.)
    setShowAll(true);
  }, [jobId]);

  // Fetch global inventory stats (independent of pagination)
  const fetchInventoryStats = async () => {
    try {
      // IMPORTANT: Use COUNT queries only (no row limits) so the numbers match the real queue.
      // Needs Work must include BOTH explicit flags (review_notes) AND missing core fields.
      // NOTE: Documents are optional (Reelly imports don't have them) - removed from requirements
      const needsWorkOr = [
        "review_notes.ilike.%PENDING_SCRAPE%",
        "review_notes.eq.INCOMPLETE",
        "review_notes.ilike.ERROR:%",
        "images.eq.[]",
        "images.is.null",
        "description.is.null",
        "developer_name.is.null",
        "developer_name.ilike.unknown",
        "developer_name.eq.Unknown",
      ].join(",");

      // Build base queries with source filter
      let totalQuery = supabase
        .from("pending_project_imports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      
      let needsWorkQuery = supabase
        .from("pending_project_imports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .or(needsWorkOr);

      // Apply source filter to stats
      if (sourceFilter === "reelly") {
        totalQuery = totalQuery.ilike("source_url", "%reelly%");
        needsWorkQuery = needsWorkQuery.ilike("source_url", "%reelly%");
      } else if (sourceFilter === "manual") {
        totalQuery = totalQuery.not("source_url", "ilike", "%reelly%").not("source_url", "ilike", "%provident%");
        needsWorkQuery = needsWorkQuery.not("source_url", "ilike", "%reelly%").not("source_url", "ilike", "%provident%");
      } else if (sourceFilter === "provident") {
        totalQuery = totalQuery.ilike("source_url", "%provident%");
        needsWorkQuery = needsWorkQuery.ilike("source_url", "%provident%");
      }

      const [totalRes, needsWorkRes] = await Promise.all([totalQuery, needsWorkQuery]);

      const total = totalRes.count ?? 0;
      const needsWork = needsWorkRes.count ?? 0;
      const complete = Math.max(0, total - needsWork);

      setTotalCount(total);
      setTotalCompleteCount(complete);
      setTotalNeedsWorkCount(needsWork);
    } catch (error) {
      console.error("Error fetching inventory stats:", error);
    }
  };

  const fetchPendingImports = async (opts?: { reset?: boolean }) => {
    const reset = opts?.reset ?? true;
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      // IMPORTANT: PostgREST hard-limits at 1000 rows per request.
      // We use range pagination to support 1,336+.
      const offset = reset ? 0 : imports.length;

      let query = supabase
        .from("pending_project_imports")
        .select("*, review_notes", { count: "exact" })
        .eq("status", "pending")
        // Stable ordering (matches discovery / queue creation order)
        .order("created_at", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (jobId && !showAll) {
        query = query.eq("job_id", jobId);
      }

      // Apply source filter
      if (sourceFilter === "reelly") {
        query = query.ilike("source_url", "%reelly%");
      } else if (sourceFilter === "manual") {
        query = query.not("source_url", "ilike", "%reelly%").not("source_url", "ilike", "%provident%");
      } else if (sourceFilter === "provident") {
        query = query.ilike("source_url", "%provident%");
      }

      // Apply status filter for complete vs needs_work
      // NOTE: Documents are optional (Reelly API doesn't provide them)
      // Complete = has description, images, valid developer
      if (statusFilter === "complete") {
        query = query
          .is("review_notes", null)
          .not("description", "is", null)
          .neq("description", "")
          .not("developer_name", "is", null)
          .neq("developer_name", "")
          .not("developer_name", "ilike", "unknown")
          .not("images", "is", null)
          .not("images", "eq", "[]");
        // NOTE: documents requirement removed - Reelly imports don't have documents
      } else if (statusFilter === "needs_work") {
        // Needs work = flagged OR missing CORE fields (images, description, developer)
        // Documents are optional and excluded from this check
        query = query.or(
          [
            "review_notes.ilike.%PENDING_SCRAPE%",
            "review_notes.eq.INCOMPLETE",
            "review_notes.ilike.ERROR:%",
            "images.eq.[]",
            "images.is.null",
            "description.is.null",
            "developer_name.is.null",
            "developer_name.ilike.unknown",
            "developer_name.eq.Unknown",
          ].join(","),
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      const parsed: PendingImport[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        developer_name: item.developer_name,
        developer_id: item.developer_id,
        community_name: item.community_name,
        location: item.location,
        emirate: item.emirate || 'Dubai',
        description: item.description,
        price_from: item.price_from,
        price_to: item.price_to,
        bedrooms_min: item.bedrooms_min,
        bedrooms_max: item.bedrooms_max,
        size_min: item.size_min,
        size_max: item.size_max,
        handover_date: item.handover_date,
        payment_plan: item.payment_plan,
        property_type_label: item.property_type_label,
        status_label: item.status_label,
        images: parseJsonArray<ImageData>(item.images),
        documents: parseJsonArray<DocumentData>(item.documents),
        matched_project_id: item.matched_project_id,
        match_confidence: item.match_confidence || 0,
        is_new_project: item.is_new_project ?? true,
        status: item.status || 'pending',
        source_url: item.source_url,
        created_at: item.created_at
      }));

      const base = reset ? [] : imports;
      const byId = new Map<string, PendingImport>();
      for (const p of base) byId.set(p.id, p);
      for (const p of parsed) byId.set(p.id, p);
      const next = Array.from(byId.values());

      setTotalCount(count ?? null);
      setHasMore(count != null ? next.length < count : parsed.length === PAGE_SIZE);

      // Count incomplete (for loaded set)
      const incomplete = next.filter(p => 
        p.images.length === 0 || 
        !p.description || 
        p.developer_name?.toLowerCase() === 'unknown'
      ).length;
      setIncompleteCount(incomplete);

      setImports(next);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error fetching pending imports:", error);
      toast({
        title: "Error",
        description: "Failed to load pending imports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPendingImports();
    fetchInventoryStats();
  }, [jobId, showAll, statusFilter, sourceFilter]);

  // Debounce ref for realtime subscription
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time subscription to auto-refresh when extraction adds/updates data
  useEffect(() => {
    const channel = supabase
      .channel('pending_imports_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_project_imports',
          filter: 'status=eq.pending'
        },
        () => {
          // Clear previous timer to properly debounce
          if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
          }
          // Debounce rapid updates (1.5s delay)
          refreshTimerRef.current = setTimeout(() => {
            fetchPendingImports();
            fetchInventoryStats();
          }, 1500);
        }
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [jobId, showAll]);

  // Check for duplicates before approving
  const checkForDuplicates = async (importData: PendingImport): Promise<{ isDuplicate: boolean; existingProject?: any }> => {
    // Check by name similarity
    const normalizedName = importData.name.toLowerCase().trim();
    
    const { data: existingProjects } = await supabase
      .from("projects")
      .select("id, name, slug, location, developer_id")
      .or(`name.ilike.%${normalizedName}%,slug.ilike.%${importData.slug || normalizedName}%`);
    
    if (existingProjects && existingProjects.length > 0) {
      // Check for exact or very similar match
      const exactMatch = existingProjects.find(p => 
        p.name.toLowerCase().trim() === normalizedName ||
        (p.slug && importData.slug && p.slug === importData.slug)
      );
      
      if (exactMatch) {
        return { isDuplicate: true, existingProject: exactMatch };
      }
    }
    
    return { isDuplicate: false };
  };

  const approveImportInDb = async (importData: PendingImport, skipDuplicateCheck = false) => {
    // Check for duplicates unless explicitly skipped
    if (!skipDuplicateCheck) {
      const { isDuplicate, existingProject } = await checkForDuplicates(importData);
      
      if (isDuplicate && existingProject) {
        // Mark this import as having a duplicate and update matched_project_id
        await supabase
          .from("pending_project_imports")
          .update({
            matched_project_id: existingProject.id,
            is_new_project: false,
            match_confidence: 100
          })
          .eq("id", importData.id);
        
        throw new Error(`DUPLICATE: Project "${existingProject.name}" already exists. Use "Merge Updates" to update the existing project instead.`);
      }
    }

    // Create the project
    const projectData = {
      name: importData.name,
      slug: importData.slug || importData.name.toLowerCase().replace(/\s+/g, '-'),
      developer_id: importData.developer_id,
      community_id: null,
      location: importData.location,
      emirate: importData.emirate,
      description: (importData.description || '').replace(/^#{1,6}\s*/gm, '').replace(/\n{3,}/g, '\n\n').trim() || null,
      price_from: importData.price_from,
      price_to: importData.price_to,
      bedrooms_min: importData.bedrooms_min,
      bedrooms_max: importData.bedrooms_max,
      size_min: importData.size_min,
      size_max: importData.size_max,
      handover_date: importData.handover_date,
      payment_plan: importData.payment_plan,
      property_type_label: importData.property_type_label,
      status_label: importData.status_label,
      source_url: importData.source_url,
      is_offplan: true,
      status: 'active'
    };

    const { data: newProject, error: projectError } = await supabase
      .from("projects")
      .upsert(projectData, { onConflict: 'slug' })
      .select()
      .single();

    if (projectError) throw projectError;

    // Insert images (delete old ones first to avoid duplicates)
    if (importData.images.length > 0 && newProject) {
      await supabase.from("project_images").delete().eq("project_id", newProject.id);
      const imageInserts = importData.images.map((img, index) => ({
        project_id: newProject.id,
        image_url: img.url,
        alt_text: img.alt || importData.name,
        display_order: index
      }));

      const { error: imgError } = await supabase
        .from("project_images")
        .insert(imageInserts);

      if (imgError) console.error("Error inserting images:", imgError);
    }

    // Insert documents (delete old ones first to avoid duplicates)
    if (importData.documents.length > 0 && newProject) {
      await supabase.from("project_documents").delete().eq("project_id", newProject.id);
      const docInserts = importData.documents.map((doc, idx) => ({
        project_id: newProject.id,
        file_url: doc.url,
        document_type: doc.type,
        file_name: doc.name || `${doc.type}-${idx + 1}`,
        display_order: idx
      }));

      const { error: docError } = await supabase
        .from("project_documents")
        .insert(docInserts);

      if (docError) console.error("Error inserting documents:", docError);
    }

    // Mark import as approved with reviewer tracking
    const { error: approveErr } = await supabase
      .from("pending_project_imports")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id || null,
      })
      .eq("id", importData.id);

    if (approveErr) throw approveErr;

    return newProject;
  };

  const rejectAllPendingInDb = async () => {
    const { error } = await supabase
      .from("pending_project_imports")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        review_notes: "Rejected by admin (bulk action)"
      })
      .eq("status", "pending");

    if (error) throw error;
  };

  const handleApprove = async (importData: PendingImport, forceCreate = false) => {
    setProcessingId(importData.id);
    try {
      await approveImportInDb(importData, forceCreate);

      toast({
        title: "Project Approved",
        description: `"${importData.name}" has been added to your listings`,
      });

      setSelectedImport(null);
      fetchPendingImports();
      onRefresh?.();
    } catch (error: any) {
      console.error("Error approving import:", error);
      
      // Check if it's a duplicate error
      if (error.message?.startsWith('DUPLICATE:')) {
        toast({
          title: "Duplicate Detected",
          description: error.message.replace('DUPLICATE: ', ''),
          variant: "destructive",
        });
        // Refresh to show the updated duplicate flag
        fetchPendingImports();
      } else {
        toast({
          title: "Error",
          description: "Failed to approve project",
          variant: "destructive",
        });
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Show confirmation dialog for approving selected
  const showApproveSelectedConfirmation = () => {
    if (isBulkProcessing || selectedIds.size === 0) return;
    setConfirmDialogMode("selected");
    setConfirmDialogCount(selectedIds.size);
    setConfirmDialogOpen(true);
  };

  // Show confirmation dialog for approving ALL pending (entire queue via edge function)
  const showApproveAllConfirmation = () => {
    if (isBulkProcessing) return;
    const count = totalCount ?? imports.length;
    if (count === 0) return;
    setConfirmDialogMode("all");
    setConfirmDialogCount(count);
    setConfirmDialogOpen(true);
  };

  // Handle confirmed approval (called from dialog)
  const handleConfirmedApproval = async () => {
    setConfirmDialogOpen(false);

    // "all" mode: call edge function in batches until queue is empty
    if (confirmDialogMode === "all") {
      setIsBulkProcessing(true);
      setBulkAction("approve");
      setBulkDone(0);
      const estimatedTotal = totalCount ?? 0;
      setBulkTotal(estimatedTotal);

      let totalApproved = 0;
      let consecutiveErrors = 0;

      try {
        while (true) {
          const { data, error } = await supabase.functions.invoke("bulk-approve-imports", {
            body: { limit: 50 },
          });

          if (error) {
            consecutiveErrors++;
            console.error("Bulk approve batch error:", error);
            if (consecutiveErrors >= 3) {
              toast({ title: "Error", description: "Too many consecutive errors. Stopping.", variant: "destructive" });
              break;
            }
            continue;
          }

          consecutiveErrors = 0;
          const approved = data?.stats?.approved ?? 0;
          totalApproved += approved;
          setBulkDone(totalApproved);

          if (approved === 0) break;
        }

        toast({
          title: "Bulk approve finished",
          description: `${totalApproved.toLocaleString()} projects approved`,
        });
      } finally {
        setIsBulkProcessing(false);
        setBulkAction(null);
        setSelectedIds(new Set());
        await fetchPendingImports();
        await fetchInventoryStats();
        onRefresh?.();
      }
      return;
    }

    // "selected" mode: approve selected items one by one
    const itemsToApprove = imports.filter(i => selectedIds.has(i.id));
    if (itemsToApprove.length === 0) return;

    setIsBulkProcessing(true);
    setBulkAction("approve");
    setBulkDone(0);
    setBulkTotal(itemsToApprove.length);

    let ok = 0;
    let failed = 0;

    try {
      for (const item of itemsToApprove) {
        try {
          await approveImportInDb(item, true);
          ok++;
        } catch (e) {
          failed++;
          console.error("Bulk approve failed for", item.id, e);
        } finally {
          setBulkDone(ok + failed);
        }
      }

      toast({
        title: "Bulk approve finished",
        description: failed > 0 ? `${ok} approved, ${failed} failed` : `${ok} approved`,
      });
    } finally {
      setIsBulkProcessing(false);
      setBulkAction(null);
      setSelectedIds(new Set());
      await fetchPendingImports();
      onRefresh?.();
    }
  };

  const deleteSelectedPending = async () => {
    if (selectedIds.size === 0) {
      toast({ title: "No items selected", description: "Select items to delete using the checkboxes." });
      return;
    }

    const isFilteredView = Boolean(jobId && !showAll);
    const totalShown = imports.length;
    const selectedCount = selectedIds.size;

    // Only do a full queue clear when the user is not filtering by job.
    // In filtered mode, they usually only want to affect the selected subset.
    const totalAvailable = totalCount ?? totalShown;
    const hasLoadedAll = !hasMore && (totalCount === null || imports.length >= totalCount);
    const isEssentiallyAllAvailable = totalAvailable > 0 && selectedCount >= Math.ceil(totalAvailable * 0.98);
    const shouldClearEntireQueueFast = !isFilteredView && hasLoadedAll && isEssentiallyAllAvailable;

    const confirmed = window.confirm(
      shouldClearEntireQueueFast
        ? `Delete ALL pending items from the queue now? (Fast)`
        : `Delete ${selectedCount} selected items from the queue?`
    );
    if (!confirmed) return;

    setIsBulkProcessing(true);
    setBulkAction("reject");

    try {
      // FAST PATH: clear the entire queue with ONE backend call.
      if (shouldClearEntireQueueFast) {
        setBulkDone(0);
        setBulkTotal(1);

        const { data, error } = await supabase.functions.invoke("reset-project-import-queue", {
          body: { preserveApproved: true },
        });
        if (error) throw error;

        setBulkDone(1);
        toast({
          title: "Queue cleared",
          description: `Removed ${data?.deleted ?? "all"} items from the queue.`,
        });

        setSelectedIds(new Set());
        await fetchPendingImports();
        return;
      }

      // SAFE PATH: bulk-update selected items in chunks (no per-row requests).
      const ids = Array.from(selectedIds);
      const chunkSize = 200;

      setBulkDone(0);
      setBulkTotal(ids.length);

      let done = 0;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);

        const { error } = await supabase
          .from("pending_project_imports")
          .update({
            status: "rejected",
            reviewed_at: new Date().toISOString(),
            review_notes: "Deleted by admin (selected)"
          })
          .in("id", chunk);

        if (error) throw error;

        done += chunk.length;
        setBulkDone(done);
      }

      toast({ title: "Deletion complete", description: `${done} items removed from queue.` });
      setSelectedIds(new Set());
      await fetchPendingImports();
    } catch (e) {
      console.error("Bulk delete failed:", e);
      toast({
        title: "Error",
        description: "Failed to delete selected items",
        variant: "destructive",
      });
    } finally {
      setIsBulkProcessing(false);
      setBulkAction(null);
    }
  };

  const repairAllIncomplete = async () => {
    const confirmed = window.confirm(
      `Extract missing data for ALL pending listings now?\n\n` +
        `This will run in batches until the queue is processed and may take several minutes.`
    );
    if (!confirmed) return;

    setIsBulkProcessing(true);
    setBulkAction("repair");
    setBulkDone(0);
    setBulkTotal(totalNeedsWorkCount ?? totalCount ?? 0);

    let ok = 0;
    let failed = 0;

    try {
      // Keep calling the backend batch extractor until it reports nothing left to process.
      // NOTE: This extracts from the full pending queue, not just the currently loaded page.
      // IMPORTANT: Keep each call under client timeouts; loop until processed=0.
      const limit = 5;
      while (true) {
        const { data, error } = await supabase.functions.invoke("batch-extract-pending", {
          body: {
            limit,
            throttleMs: 2500,
            concurrency: 1,
            maxDurationMs: 50_000,
          },
        });

        if (error) throw error;

        const processed = Number(data?.stats?.processed ?? 0);
        const success = Number(data?.stats?.success ?? 0);
        const errors = Number(data?.stats?.errors ?? 0);

        ok += success;
        failed += errors;
        setBulkDone((prev) => prev + processed);

        // Refresh headline stats so the dashboard doesn't show stale counts.
        await fetchInventoryStats();

        // Done when this cycle finds nothing left to process.
        if (processed === 0) break;
      }

      toast({
        title: "Extraction complete",
        description: failed > 0 ? `${ok} updated, ${failed} failed` : `${ok} updated successfully`,
      });
    } catch (e) {
      console.error("Batch extraction failed:", e);
      toast({
        title: "Error",
        description: "Batch extraction failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkProcessing(false);
      setBulkAction(null);
      await fetchPendingImports();
      await fetchInventoryStats();
      onRefresh?.();
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === imports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(imports.map(i => i.id)));
    }
  };

  const handleMerge = async (importData: PendingImport) => {
    if (!importData.matched_project_id) return;
    
    setProcessingId(importData.id);
    try {
      // Update existing project with new data
      const updateData: Record<string, any> = {};
      
      if (importData.description) updateData.description = importData.description;
      if (importData.price_from) updateData.price_from = importData.price_from;
      if (importData.price_to) updateData.price_to = importData.price_to;
      if (importData.handover_date) updateData.handover_date = importData.handover_date;
      if (importData.payment_plan) updateData.payment_plan = importData.payment_plan;
      if (importData.property_type_label) updateData.property_type_label = importData.property_type_label;
      if (importData.status_label) updateData.status_label = importData.status_label;

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from("projects")
          .update(updateData)
          .eq("id", importData.matched_project_id);
      }

      // Add new images
      if (importData.images.length > 0) {
        const { data: existingImages } = await supabase
          .from("project_images")
          .select("image_url")
          .eq("project_id", importData.matched_project_id);

        const existingUrls = new Set(existingImages?.map(i => i.image_url) || []);
        const newImages = importData.images.filter(img => !existingUrls.has(img.url));

        if (newImages.length > 0) {
          const imageInserts = newImages.map((img, index) => ({
            project_id: importData.matched_project_id,
            image_url: img.url,
            alt_text: img.alt || importData.name,
            display_order: (existingImages?.length || 0) + index
          }));

          await supabase.from("project_images").insert(imageInserts);
        }
      }

      // Mark as merged
      await supabase
        .from("pending_project_imports")
        .update({
          status: "merged",
          reviewed_at: new Date().toISOString()
        })
        .eq("id", importData.id);

      toast({
        title: "Project Merged",
        description: `Updates merged into existing "${importData.name}"`,
      });

      setSelectedImport(null);
      fetchPendingImports();
      onRefresh?.();
    } catch (error) {
      console.error("Error merging import:", error);
      toast({
        title: "Error",
        description: "Failed to merge project",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (importData: PendingImport, reason?: string) => {
    setProcessingId(importData.id);
    try {
      await supabase
        .from("pending_project_imports")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          review_notes: reason || "Rejected by admin"
        })
        .eq("id", importData.id);

      toast({
        title: "Project Rejected",
        description: "The import has been rejected",
      });

      setSelectedImport(null);
      fetchPendingImports();
    } catch (error) {
      console.error("Error rejecting import:", error);
      toast({
        title: "Error",
        description: "Failed to reject import",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (isLoading) {
    return (
      <Card className="bg-card border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="h-5 w-5 text-foreground" />
            Listing Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate extraction status
  const completeCount = imports.filter(p => 
    p.description && 
    p.images.length > 0 && 
    p.documents.length > 0 &&
    p.developer_name?.toLowerCase() !== 'unknown'
  ).length;
  const needsWorkCount = imports.length - completeCount;

  return (
    <>
      <Card className="bg-card border border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5 text-foreground" />
              Listing Inventory
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium">Showing {imports.length.toLocaleString()}</span> of <span className="font-bold text-foreground">{(totalCount ?? imports.length).toLocaleString()}</span> pending
              {sourceFilter !== "all" && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {sourceFilter === "provident" ? "🏢 Provident" : sourceFilter === "reelly" ? "🔄 Reelly" : "📤 My Uploads"}
                </Badge>
              )}
              {(totalCount ?? 0) > imports.length && (
                <span className="text-amber-600 ml-2">• Scroll down for "Load More"</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {jobId && !showAll && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                Filtered by sync job
              </Badge>
            )}
            {jobId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? "Show this sync only" : "Show all pending"}
              </Button>
            )}
            {imports.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAll}
                  className="border-zinc-300 text-zinc-700"
                >
                  {selectedIds.size === imports.length ? "Deselect All" : "Select All"}
                </Button>
                {selectedIds.size > 0 && (
                  <Button
                    size="sm"
                    onClick={showApproveSelectedConfirmation}
                    disabled={isBulkProcessing || isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Approve Selected ({selectedIds.size})
                  </Button>
                 )}
                 {/* Approve ALL Pending button - calls edge function in batches */}
                 {(totalCount ?? 0) > 0 && (
                   <Button
                     size="sm"
                     onClick={showApproveAllConfirmation}
                     disabled={isBulkProcessing || isLoading}
                     className="bg-emerald-600 hover:bg-emerald-700 text-white"
                   >
                     <Check className="h-4 w-4 mr-2" />
                     Approve ALL ({(totalCount ?? 0).toLocaleString()})
                   </Button>
                 )}
                 {(totalNeedsWorkCount ?? needsWorkCount) > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={repairAllIncomplete}
                    disabled={isBulkProcessing || isLoading}
                    className="border-primary/40 text-foreground hover:bg-muted"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Fix All Listings
                  </Button>
                )}
                {selectedIds.size > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={deleteSelectedPending}
                    disabled={isBulkProcessing || isLoading}
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedIds.size})
                  </Button>
                )}
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchPendingImports({ reset: true });
                fetchInventoryStats();
              }}
              disabled={isBulkProcessing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Active filter indicator */}
          {statusFilter !== "all" && (
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                Showing: {statusFilter === "complete" ? "Complete" : "Needs Work"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="text-xs h-6"
              >
                Clear Filter
              </Button>
            </div>
          )}
          
          {/* New Project Detector */}
          <NewProjectDetector />

          {/* Source filter dropdown */}
          <div className="flex items-center gap-2 p-2 bg-muted/50 border border-border rounded-lg mb-4">
            <span className="text-sm font-medium text-foreground">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as "all" | "reelly" | "manual" | "provident")}
              className="text-sm border border-border rounded px-2 py-1 bg-background text-foreground"
            >
              <option value="all">All Sources</option>
              <option value="manual">📤 My Uploads</option>
              <option value="reelly">🔄 Auto-Imported (Reelly)</option>
              <option value="provident">🏢 Provident</option>
            </select>
          </div>

          {/* Inventory status cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {/* Total Pending */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{(totalCount ?? 0).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {sourceFilter === "provident" ? "Provident Queue" : sourceFilter === "reelly" ? "Reelly Queue" : "Total Pending"}
              </div>
            </div>
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg border p-3 text-center transition-all hover:scale-105 cursor-pointer ${
                statusFilter === "all" 
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30" 
                  : "border-border bg-muted/50 hover:bg-muted"
              }`}
            >
              <div className="text-2xl font-bold text-foreground">{totalCount ?? "…"}</div>
              <div className="text-xs text-muted-foreground">In Queue</div>
            </button>
            <button
              onClick={() => setStatusFilter("complete")}
              className={`rounded-lg border p-3 text-center transition-all hover:scale-105 cursor-pointer ${
                statusFilter === "complete" 
                  ? "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-300" 
                  : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
              }`}
            >
              <div className="text-2xl font-bold text-emerald-700">{totalCompleteCount ?? completeCount}</div>
              <div className="text-xs text-emerald-600">Complete ✓</div>
            </button>
            {/* Needs Work card - hide for Reelly (API data is complete) */}
            {sourceFilter !== "reelly" ? (
            <button
              onClick={() => setStatusFilter("needs_work")}
              className={`rounded-lg border p-3 text-center transition-all hover:scale-105 cursor-pointer ${
                statusFilter === "needs_work" 
                  ? "border-amber-500 bg-amber-100 ring-2 ring-amber-300" 
                  : "border-amber-200 bg-amber-50 hover:bg-amber-100"
              }`}
            >
              <div className="text-2xl font-bold text-amber-700">{totalNeedsWorkCount ?? needsWorkCount}</div>
              <div className="text-xs text-amber-600">Needs Work</div>
            </button>
            ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
              <div className="text-2xl font-bold text-emerald-700">✓</div>
              <div className="text-xs text-emerald-600">API Ready</div>
            </div>
            )}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
              <div className="text-2xl font-bold text-blue-700">{selectedIds.size}</div>
              <div className="text-xs text-blue-600">Selected</div>
            </div>
          </div>

          {isBulkProcessing && (bulkAction === "approve" || bulkAction === "reject" || bulkAction === "repair") && bulkTotal > 0 && (
            <div className="mb-4 rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{bulkAction === "approve" ? "Approving" : bulkAction === "repair" ? "Repairing" : "Deleting"}… {bulkDone}/{bulkTotal}</span>
                <span>{Math.min(100, Math.round((bulkDone / bulkTotal) * 100))}%</span>
              </div>
              <Progress value={Math.min(100, (bulkDone / bulkTotal) * 100)} className="h-2" />
            </div>
          )}
          {imports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Check className="h-16 w-16 mb-4 text-muted-foreground" />
              <p className="text-xl font-medium text-foreground">
                {statusFilter === "all" 
                  ? "All caught up!" 
                  : statusFilter === "complete" 
                    ? "No complete listings found" 
                    : "No listings need work"}
              </p>
              <p className="text-sm">
                {statusFilter === "all" 
                  ? "No projects awaiting approval" 
                  : "Try clicking another filter above"}
              </p>
              {statusFilter !== "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setStatusFilter("all")}
                >
                  Show All
                </Button>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-border bg-muted/10 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {imports.map((item) => (
                  <div key={item.id} className="relative">
                    {/* Selection checkbox */}
                    <div className="absolute top-2 left-2 z-20">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded border-2 border-primary/40 accent-primary cursor-pointer"
                      />
                    </div>
                    <PendingImportCard
                      item={{
                        ...item,
                        slug: item.slug,
                        review_notes: !item.description || item.images.length === 0 || item.developer_name?.toLowerCase() === 'unknown' ? 'INCOMPLETE' : null
                      }}
                      formatPrice={formatPrice}
                      onReview={() => {
                        navigate(`/listing-admin/preview/${item.id}?from=approvals&statusFilter=${statusFilter}&sourceFilter=${sourceFilter}`);
                      }}
                      onRepaired={() => {
                        fetchPendingImports();
                        fetchInventoryStats();
                      }}
                      onApproved={() => {
                        fetchPendingImports();
                        fetchInventoryStats();
                        onRefresh?.();
                      }}
                      onRejected={() => {
                        fetchPendingImports();
                        fetchInventoryStats();
                        onRefresh?.();
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Enhanced Load More section */}
              {hasMore && (
                <div className="mt-8 flex flex-col items-center justify-center gap-2 py-4 border-t border-border">
                  <div className="text-sm text-muted-foreground font-medium">
                    Showing {imports.length.toLocaleString()} of {(totalCount ?? imports.length).toLocaleString()} listings
                  </div>
                  <Button
                    size="lg"
                    onClick={() => fetchPendingImports({ reset: false })}
                    disabled={isLoadingMore || isBulkProcessing}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                  >
                    {isLoadingMore ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading more…
                      </>
                    ) : (
                      <>
                        Load More ({Math.min(PAGE_SIZE, (totalCount ?? 0) - imports.length).toLocaleString()} more)
                      </>
                    )}
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    {((totalCount ?? 0) - imports.length).toLocaleString()} remaining
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedImport} onOpenChange={() => setSelectedImport(null)}>
        <DialogContent className="sm:max-w-4xl">
          {selectedImport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedImport.is_new_project ? (
                    <Badge className="bg-emerald-500">New Project</Badge>
                  ) : (
                    <Badge className="bg-blue-500">Update Existing</Badge>
                  )}
                  {selectedImport.name}
                </DialogTitle>
              </DialogHeader>

              {/* Image Gallery */}
              {selectedImport.images.length > 0 && (
                <div className="relative">
                  <div className="aspect-video bg-zinc-100 rounded-lg overflow-hidden">
                    <img
                      src={selectedImport.images[currentImageIndex]?.url}
                      alt={selectedImport.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  
                  {selectedImport.images.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80"
                        onClick={() => setCurrentImageIndex(i => 
                          i === 0 ? selectedImport.images.length - 1 : i - 1
                        )}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80"
                        onClick={() => setCurrentImageIndex(i => 
                          i === selectedImport.images.length - 1 ? 0 : i + 1
                        )}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                        {selectedImport.images.slice(0, 5).map((_, idx) => (
                          <span
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              idx === currentImageIndex ? 'bg-overlay' : 'bg-overlay/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Thumbnail Strip */}
              {selectedImport.images.length > 1 && (
                <ScrollArea className="w-full">
                  <div className="flex gap-2 py-2">
                    {selectedImport.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-colors ${
                          idx === currentImageIndex ? 'border-gold' : 'border-transparent'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt=""
                          className="w-full h-full object-cover"
                           referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <Separator />

              {/* Project Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  {selectedImport.developer_name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">
                        <span className="text-zinc-500">Developer:</span>{' '}
                        <span className="font-medium">{selectedImport.developer_name}</span>
                      </span>
                    </div>
                  )}
                  
                  {selectedImport.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">
                        <span className="text-zinc-500">Location:</span>{' '}
                        <span className="font-medium">{selectedImport.location}</span>
                      </span>
                    </div>
                  )}

                  {selectedImport.handover_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">
                        <span className="text-zinc-500">Handover:</span>{' '}
                        <span className="font-medium">{selectedImport.handover_date}</span>
                      </span>
                    </div>
                  )}

                  {(selectedImport.bedrooms_min || selectedImport.bedrooms_max) && (
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">
                        <span className="text-zinc-500">Bedrooms:</span>{' '}
                        <span className="font-medium">
                          {selectedImport.bedrooms_min === selectedImport.bedrooms_max
                            ? selectedImport.bedrooms_min
                            : `${selectedImport.bedrooms_min || '?'} - ${selectedImport.bedrooms_max || '?'}`}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {selectedImport.price_from && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">
                        <span className="text-zinc-500">Price From:</span>{' '}
                        <span className="font-medium">{formatPrice(selectedImport.price_from)}</span>
                      </span>
                    </div>
                  )}

                  {selectedImport.size_min && (
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm">
                        <span className="text-zinc-500">Size:</span>{' '}
                        <span className="font-medium">
                          {selectedImport.size_min?.toLocaleString()} - {selectedImport.size_max?.toLocaleString()} sq ft
                        </span>
                      </span>
                    </div>
                  )}

                  {selectedImport.property_type_label && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedImport.property_type_label}</Badge>
                    </div>
                  )}

                  {selectedImport.status_label && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gold/20 text-gold-dark">{selectedImport.status_label}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {selectedImport.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-zinc-600 line-clamp-4">
                    {selectedImport.description}
                  </p>
                </div>
              )}

              {selectedImport.payment_plan && (
                <div>
                  <h4 className="font-medium mb-2">Payment Plan</h4>
                  <p className="text-sm text-zinc-600">{selectedImport.payment_plan}</p>
                </div>
              )}

              {/* Documents */}
              {selectedImport.documents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents ({selectedImport.documents.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedImport.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-100 rounded hover:bg-zinc-200 transition-colors text-sm"
                      >
                        <FileText className="h-4 w-4 text-zinc-500" />
                        {doc.name || doc.type}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Actions */}
               <div className="flex items-center justify-end">
                 <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedImport)}
                    disabled={processingId === selectedImport.id}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  
                  {!selectedImport.is_new_project && selectedImport.matched_project_id && (
                    <Button
                      variant="outline"
                      onClick={() => handleMerge(selectedImport)}
                      disabled={processingId === selectedImport.id}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Merge className="h-4 w-4 mr-2" />
                      Merge Updates
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => handleApprove(selectedImport)}
                    disabled={processingId === selectedImport.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {selectedImport.is_new_project ? 'Approve & Create' : 'Approve as New'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval confirmation dialog */}
      <ApprovalConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        count={confirmDialogCount}
        approverEmail={user?.email || null}
        onConfirm={handleConfirmedApproval}
        mode={confirmDialogMode}
      />
    </>
  );
}