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
import { Trash2, Database, AlertTriangle, RefreshCw, FileText, Shield } from "lucide-react";
import { format } from "date-fns";

interface ImportSource {
  id: string;
  source_name: string;
  source_group: string;
  total_rows: number | null;
  created_at: string;
  broker_name_snapshot?: string | null;
}

interface DeleteImportButtonProps {
  userId: string;
  onSuccess: () => void;
  hasOwnerAccess: boolean;
}

const DeleteImportButton = ({ userId, onSuccess, hasOwnerAccess }: DeleteImportButtonProps) => {
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
        .select("id, source_name, source_group, total_rows, created_at, broker_name_snapshot")
        .neq("source_group", "website") // Filter out website sources
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (err: any) {
      console.error("Failed to fetch sources:", err);
      toast.error(`Failed to load import sources: ${err?.message || 'Unknown error'}`);
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

    // Double-check not a website source
    if (selectedSource.source_group === "website") {
      toast.error("Cannot delete website sources");
      return;
    }

    setDeleting(true);
    const toastId = toast.loading(`Deleting import "${selectedSource.source_name}"...`);

    try {
      const { data, error } = await supabase.rpc("crm_hard_delete_import", {
        p_source_id: selectedSource.id,
        p_import_batch_id: null,
      });

      if (error) throw error;

      const result = data as { lead_count?: number; status?: string } | null;
      const deletedLeadCount = result?.lead_count ?? leadCount;

      toast.success(`Deleted ${deletedLeadCount} leads from "${selectedSource.source_name}"`, {
        id: toastId,
      });

      setShowConfirm(false);
      setOpen(false);
      setSelectedSourceId("");
      onSuccess();
    } catch (err: any) {
      console.error("Delete failed:", err);
      toast.error(err.message || "Failed to delete import", { id: toastId });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteByBatch = async () => {
    const trimmed = batchId.trim();
    if (!trimmed) return;

    setDeleting(true);
    const toastId = toast.loading(`Deleting import batch...`);

    try {
      const { data, error } = await supabase.rpc("crm_hard_delete_import", {
        p_source_id: null,
        p_import_batch_id: trimmed,
      });

      if (error) throw error;

      const result = data as { lead_count?: number; status?: string } | null;
      const deletedLeadCount = result?.lead_count ?? (batchLeadCount ?? 0);

      toast.success(`Deleted ${deletedLeadCount} leads (batch ${trimmed.slice(0, 8)}...)`, { id: toastId });

      setShowConfirm(false);
      setOpen(false);
      setBatchId("");
      setBatchLeadCount(null);
      onSuccess();
    } catch (err: any) {
      console.error("Delete failed:", err);
      toast.error(err.message || "Failed to delete import", { id: toastId });
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = () => {
    if (deleteMode === "source") {
      handleDeleteBySource();
      return;
    }
    handleDeleteByBatch();
  };

  // Only show to owner
  if (!hasOwnerAccess) return null;

  const canDelete = deleteMode === "source" ? !!selectedSource : (batchLeadCount !== null && batchLeadCount > 0);
  const deleteCount = deleteMode === "source" ? leadCount : (batchLeadCount || 0);
  const deleteName = deleteMode === "source" ? selectedSource?.source_name : `Batch ${batchId.slice(0, 8)}...`;

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
              Delete Import (Owner Only)
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Permanently delete all leads from an import source or batch.
              Website leads cannot be deleted here.
            </DialogDescription>
          </DialogHeader>

          {/* Owner Badge */}
          <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Shield className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-amber-400">Owner-only action: Hard delete with cascading removal</span>
          </div>

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
                  No deletable import sources found
                </div>
              ) : (
                <>
                  {/* Native select for guaranteed visibility */}
                  <select
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    className="w-full h-11 px-3 rounded-md border border-[#1A1A1A] bg-[#FDFBF7] text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ backgroundColor: '#09090b', color: '#ffffff' }}
                  >
                    <option value="" disabled style={{ backgroundColor: '#09090b', color: '#888888' }}>
                      Select import source...
                    </option>
                    {sources.map(source => (
                      <option 
                        key={source.id} 
                        value={source.id}
                        style={{ backgroundColor: '#09090b', color: '#ffffff' }}
                      >
                        {source.source_name} — {source.source_group.replace(/_/g, ' ')} ({source.total_rows || 0} rows)
                      </option>
                    ))}
                  </select>

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
                        {selectedSource.broker_name_snapshot && (
                          <p><strong>Broker:</strong> {selectedSource.broker_name_snapshot}</p>
                        )}
                        <p><strong>Leads to delete:</strong> {leadCount}</p>
                      </div>
                      <p className="text-xs text-red-400/80 mt-2">
                        This will permanently delete all leads, activities, assignments, reports, and the source record.
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
                  You can find the batch ID in the import logs or database.
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
              This will also delete all related:
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Activities and call logs</li>
                <li>Assignments and assignments history</li>
                <li>AI drafts and shortlists</li>
                <li>Reports and notes</li>
                <li>Campaign recipients</li>
                <li>The source/import record</li>
              </ul>
              <br />
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