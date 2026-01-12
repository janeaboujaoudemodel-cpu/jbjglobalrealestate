import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Database, AlertTriangle, RefreshCw, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

interface ImportSource {
  id: string;
  source_name: string;
  source_group: string;
  total_rows: number | null;
  created_at: string;
}

interface DeleteImportButtonProps {
  userId: string;
  onSuccess: () => void;
  isAdmin: boolean;
}

const DeleteImportButton = ({ userId, onSuccess, isAdmin }: DeleteImportButtonProps) => {
  const [open, setOpen] = useState(false);
  const [sources, setSources] = useState<ImportSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"source" | "batch">("source");
  
  // Source deletion state
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
  
  // Batch deletion state
  const [batchId, setBatchId] = useState<string>("");
  const [batchLeadCount, setBatchLeadCount] = useState<number | null>(null);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leadCount, setLeadCount] = useState(0);

  useEffect(() => {
    if (open) {
      fetchSources();
    }
  }, [open]);

  useEffect(() => {
    if (selectedSourceId) {
      const source = sources.find(s => s.id === selectedSourceId);
      setSelectedSource(source || null);
      if (source) {
        fetchLeadCount(source.id);
      }
    } else {
      setSelectedSource(null);
      setLeadCount(0);
    }
  }, [selectedSourceId, sources]);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("crm_lead_sources")
        .select("id, source_name, source_group, total_rows, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (err) {
      console.error("Failed to fetch sources:", err);
      toast.error("Failed to load import sources");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadCount = async (sourceId: string) => {
    const { count, error } = await supabase
      .from("crm_leads")
      .select("*", { count: "exact", head: true })
      .eq("source_id", sourceId);

    if (!error && count !== null) {
      setLeadCount(count);
    }
  };

  const fetchBatchLeadCount = async (batch: string) => {
    if (!batch.trim()) {
      setBatchLeadCount(null);
      return;
    }
    const { count, error } = await supabase
      .from("crm_leads")
      .select("*", { count: "exact", head: true })
      .eq("import_batch_id", batch.trim());

    if (!error && count !== null) {
      setBatchLeadCount(count);
    } else {
      setBatchLeadCount(0);
    }
  };

  const handleBatchIdChange = (value: string) => {
    setBatchId(value);
    fetchBatchLeadCount(value);
  };

  const handleDeleteBySource = async () => {
    if (!selectedSource) return;

    setDeleting(true);
    const toastId = toast.loading(`Deleting leads from "${selectedSource.source_name}"...`);
    
    try {
      // Get all lead IDs from this source
      const { data: leads, error: leadsError } = await supabase
        .from("crm_leads")
        .select("id")
        .eq("source_id", selectedSource.id);

      if (leadsError) throw leadsError;

      const leadIds = leads?.map(l => l.id) || [];

      if (leadIds.length > 0) {
        // Delete related records in batches to avoid timeout
        const batchSize = 100;
        for (let i = 0; i < leadIds.length; i += batchSize) {
          const batch = leadIds.slice(i, i + batchSize);
          await Promise.all([
            supabase.from("crm_lead_state_per_user").delete().in("lead_id", batch),
            supabase.from("crm_activities").delete().in("lead_id", batch),
            supabase.from("crm_lead_assignments").delete().in("lead_id", batch),
            supabase.from("crm_ai_drafts").delete().in("lead_id", batch),
            supabase.from("crm_lead_shortlists").delete().in("lead_id", batch),
            supabase.from("crm_lead_reports").delete().in("lead_id", batch),
            supabase.from("crm_calls").delete().in("lead_id", batch),
            supabase.from("crm_notes").delete().in("lead_id", batch),
            supabase.from("crm_campaign_recipients").delete().in("lead_id", batch),
          ]);
        }

        // Delete the leads
        const { error: deleteError } = await supabase
          .from("crm_leads")
          .delete()
          .eq("source_id", selectedSource.id);

        if (deleteError) throw deleteError;
      }

      // Delete the source record
      await supabase
        .from("crm_lead_sources")
        .delete()
        .eq("id", selectedSource.id);

      toast.success(`Deleted ${leadIds.length} leads from "${selectedSource.source_name}"`, { id: toastId });
      
      setShowConfirm(false);
      setOpen(false);
      setSelectedSourceId("");
      onSuccess();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete import", { id: toastId });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteByBatch = async () => {
    if (!batchId.trim()) return;

    setDeleting(true);
    const toastId = toast.loading(`Deleting leads with batch ID...`);
    
    try {
      // Get all lead IDs from this batch
      const { data: leads, error: leadsError } = await supabase
        .from("crm_leads")
        .select("id, source_id")
        .eq("import_batch_id", batchId.trim());

      if (leadsError) throw leadsError;

      const leadIds = leads?.map(l => l.id) || [];
      const sourceIds = [...new Set(leads?.map(l => l.source_id).filter(Boolean) || [])];

      if (leadIds.length > 0) {
        // Delete related records in batches
        const batchSize = 100;
        for (let i = 0; i < leadIds.length; i += batchSize) {
          const batch = leadIds.slice(i, i + batchSize);
          await Promise.all([
            supabase.from("crm_lead_state_per_user").delete().in("lead_id", batch),
            supabase.from("crm_activities").delete().in("lead_id", batch),
            supabase.from("crm_lead_assignments").delete().in("lead_id", batch),
            supabase.from("crm_ai_drafts").delete().in("lead_id", batch),
            supabase.from("crm_lead_shortlists").delete().in("lead_id", batch),
            supabase.from("crm_lead_reports").delete().in("lead_id", batch),
            supabase.from("crm_calls").delete().in("lead_id", batch),
            supabase.from("crm_notes").delete().in("lead_id", batch),
            supabase.from("crm_campaign_recipients").delete().in("lead_id", batch),
          ]);
        }

        // Delete the leads
        const { error: deleteError } = await supabase
          .from("crm_leads")
          .delete()
          .eq("import_batch_id", batchId.trim());

        if (deleteError) throw deleteError;
      }

      // Also delete source records if they exist
      if (sourceIds.length > 0) {
        await supabase
          .from("crm_lead_sources")
          .delete()
          .in("id", sourceIds as string[]);
      }

      toast.success(`Deleted ${leadIds.length} leads`, { id: toastId });
      
      setShowConfirm(false);
      setOpen(false);
      setBatchId("");
      setBatchLeadCount(null);
      onSuccess();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete import", { id: toastId });
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = () => {
    if (deleteMode === "source") {
      handleDeleteBySource();
    } else {
      handleDeleteByBatch();
    }
  };

  // Only show to admins
  if (!isAdmin) return null;

  const canDelete = deleteMode === "source" ? !!selectedSource : (batchLeadCount !== null && batchLeadCount > 0);
  const deleteCount = deleteMode === "source" ? leadCount : (batchLeadCount || 0);
  const deleteName = deleteMode === "source" ? selectedSource?.source_name : `Batch ${batchId}`;

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setOpen(true)}
        className="text-red-400 border-red-500/50 hover:bg-red-500/20"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Import
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Database className="h-5 w-5 text-red-400" />
              Delete Import
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Permanently delete all leads from an import source or batch.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={deleteMode} onValueChange={(v) => setDeleteMode(v as "source" | "batch")}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="source" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                By Source
              </TabsTrigger>
              <TabsTrigger value="batch" className="text-xs">
                <Database className="h-3 w-3 mr-1" />
                By Batch ID
              </TabsTrigger>
            </TabsList>

            <TabsContent value="source" className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : sources.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No import sources found
                </div>
              ) : (
                <>
                  <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder="Select import source..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-64">
                      {sources.map(source => (
                        <SelectItem key={source.id} value={source.id} className="text-foreground">
                          <div className="flex flex-col">
                            <span className="font-medium">{source.source_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {source.source_group.replace(/_/g, ' ')} · {source.total_rows || 0} rows · {format(new Date(source.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedSource && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-semibold">Warning</span>
                      </div>
                      <div className="text-sm text-red-300 space-y-1">
                        <p><strong>Source:</strong> {selectedSource.source_name}</p>
                        <p><strong>Group:</strong> {selectedSource.source_group.replace(/_/g, ' ')}</p>
                        <p><strong>Created:</strong> {format(new Date(selectedSource.created_at), 'PPpp')}</p>
                        <p><strong>Leads to delete:</strong> {leadCount}</p>
                      </div>
                      <p className="text-xs text-red-400/80 mt-2">
                        This will permanently delete all leads and related data.
                      </p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="batch" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Import Batch ID</Label>
                <Input
                  placeholder="Enter batch UUID..."
                  value={batchId}
                  onChange={(e) => handleBatchIdChange(e.target.value)}
                  className="bg-muted border-border text-foreground font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  You can find the batch ID in the database or from the import logs.
                </p>
              </div>

              {batchLeadCount !== null && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">Warning</span>
                  </div>
                  <p className="text-sm text-red-300">
                    Found <strong>{batchLeadCount}</strong> leads with this batch ID.
                  </p>
                  {batchLeadCount === 0 && (
                    <p className="text-xs text-amber-400">
                      No leads found with this batch ID.
                    </p>
                  )}
                  {batchLeadCount > 0 && (
                    <p className="text-xs text-red-400/80">
                      This will permanently delete all leads and related data.
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => setShowConfirm(true)}
              disabled={!canDelete}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Confirm Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You are about to permanently delete <strong className="text-foreground">{deleteCount} leads</strong> from 
              <strong className="text-foreground"> "{deleteName}"</strong>.
              <br /><br />
              This will also delete all related activities, assignments, shortlists, reports, and drafts.
              <br /><br />
              <strong className="text-red-400">This cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground border-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Yes, Delete Everything
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteImportButton;
