import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Database, AlertTriangle, RefreshCw } from "lucide-react";

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
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<ImportSource | null>(null);
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

  const handleDelete = async () => {
    if (!selectedSource) return;

    setDeleting(true);
    try {
      // Get all lead IDs from this source
      const { data: leads, error: leadsError } = await supabase
        .from("crm_leads")
        .select("id")
        .eq("source_id", selectedSource.id);

      if (leadsError) throw leadsError;

      const leadIds = leads?.map(l => l.id) || [];

      if (leadIds.length > 0) {
        // Delete related records
        await supabase.from("crm_lead_state_per_user").delete().in("lead_id", leadIds);
        await supabase.from("crm_activities").delete().in("lead_id", leadIds);
        await supabase.from("crm_lead_assignments").delete().in("lead_id", leadIds);
        await supabase.from("crm_ai_drafts").delete().in("lead_id", leadIds);
        await supabase.from("crm_lead_shortlists").delete().in("lead_id", leadIds);
        await supabase.from("crm_lead_reports").delete().in("lead_id", leadIds);
        await supabase.from("crm_calls").delete().in("lead_id", leadIds);

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

      toast.success(`Deleted ${leadIds.length} leads from "${selectedSource.source_name}"`);
      
      setShowConfirm(false);
      setOpen(false);
      setSelectedSourceId("");
      onSuccess();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete import");
    } finally {
      setDeleting(false);
    }
  };

  // Only show to admins
  if (!isAdmin) return null;

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
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-red-400" />
              Delete Import Source
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select an import to permanently delete all leads from that source.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : sources.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No import sources found
              </div>
            ) : (
              <>
                <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                  <SelectTrigger className="bg-muted border-border text-white">
                    <SelectValue placeholder="Select import source..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-64">
                    {sources.map(source => (
                      <SelectItem key={source.id} value={source.id} className="text-white">
                        <div className="flex flex-col">
                          <span>{source.source_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {source.source_group.replace(/_/g, ' ')} · {source.total_rows || 0} rows
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
                    <p className="text-sm text-red-300">
                      This will permanently delete <strong>{leadCount}</strong> leads 
                      from "{selectedSource.source_name}" and all related data.
                    </p>
                    <p className="text-xs text-red-400/80">
                      This action cannot be undone.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setShowConfirm(true)}
                disabled={!selectedSource}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Confirm Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You are about to permanently delete <strong className="text-white">{leadCount} leads</strong> from 
              <strong className="text-white"> "{selectedSource?.source_name}"</strong>.
              <br /><br />
              This will also delete all related activities, assignments, shortlists, reports, and drafts.
              <br /><br />
              <strong className="text-red-400">This cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-white border-border">
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
