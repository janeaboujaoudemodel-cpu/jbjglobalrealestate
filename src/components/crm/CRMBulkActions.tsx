import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Trash2, UserPlus, RefreshCw, X, Download, CheckSquare, Square } from "lucide-react";
import { PIPELINE_STATUSES } from "./LeadStatusBadge";

interface CRMBulkActionsProps {
  selectedIds: Set<string>;
  onClear: () => void;
  onSuccess: () => void;
  userId: string;
  onSelectAll?: () => void;
  totalCount?: number;
}

interface Broker {
  id: string;
  display_name: string;
}

const CRMBulkActions = ({ 
  selectedIds, 
  onClear, 
  onSuccess, 
  userId,
  onSelectAll,
  totalCount = 0
}: CRMBulkActionsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [brokers, setBrokers] = useState<Broker[]>([]);

  // Fetch brokers for assignment
  useEffect(() => {
    const fetchBrokers = async () => {
      const { data } = await supabase
        .from("crm_users_profile")
        .select("user_id, display_name")
        .eq("is_active", true);
      
      if (data) {
        setBrokers(data.map(b => ({ 
          id: b.user_id, 
          display_name: b.display_name || "Unknown Broker" 
        })));
      }
    };
    
    if (selectedIds.size > 0) {
      fetchBrokers();
    }
  }, [selectedIds.size]);

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    
    setIsUpdating(true);
    try {
      const ids = Array.from(selectedIds);
      
      // Upsert lead states
      const upserts = ids.map(leadId => ({
        lead_id: leadId,
        user_id: userId,
        pipeline_status: newStatus as "new" | "contacted" | "qualified" | "negotiation" | "closed_won" | "closed_lost" | "junk" | "no_answer" | "viewing",
        is_junk: newStatus === "junk",
        last_touch_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from("crm_lead_state_per_user")
        .upsert(upserts, { onConflict: "lead_id,user_id" });

      if (error) throw error;

      toast.success(`Updated ${ids.length} leads to "${newStatus}"`);
      onSuccess();
      onClear();
    } catch (err) {
      console.error("Bulk status update failed:", err);
      toast.error("Failed to update leads");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkAssign = async (brokerId: string) => {
    if (selectedIds.size === 0) return;
    
    setIsUpdating(true);
    try {
      const ids = Array.from(selectedIds);
      
      const { error } = await supabase
        .from("crm_leads")
        .update({ assigned_to_user_id: brokerId })
        .in("id", ids);

      if (error) throw error;

      toast.success(`Assigned ${ids.length} leads`);
      onSuccess();
      onClear();
    } catch (err) {
      console.error("Bulk assign failed:", err);
      toast.error("Failed to assign leads");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    const toastId = toast.loading(`Deleting ${selectedIds.size} leads...`);

    try {
      const ids = Array.from(selectedIds);

      // Server-side hard delete (single RPC) to guarantee ZERO TRACES
      const { data, error } = await supabase.rpc("crm_hard_delete_leads", {
        p_lead_ids: ids,
      });

      if (error) {
        console.error("Bulk delete error:", error);
        toast.error(`Failed to delete leads: ${error.message}`, { id: toastId });
        return;
      }

      const deletedCount =
        (data as { lead_count?: number } | null)?.lead_count ?? ids.length;

      toast.success(`Deleted ${deletedCount} leads`, { id: toastId });
      onSuccess();
      onClear();
    } catch (err: any) {
      console.error("Bulk delete failed:", err);
      toast.error(`Failed to delete leads: ${err.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleExportSelected = async () => {
    if (selectedIds.size === 0) return;
    
    setIsExporting(true);
    try {
      const ids = Array.from(selectedIds);
      
      const { data: leads, error } = await supabase
        .from("crm_leads")
        .select("full_name, phone_e164, email_lower, company_name, nationality, current_location_country, current_location_city, source, created_at")
        .in("id", ids);

      if (error) throw error;

      if (!leads || leads.length === 0) {
        toast.error("No leads to export");
        return;
      }

      // Create CSV
      const headers = ["Name", "Phone", "Email", "Company", "Nationality", "Country", "City", "Source", "Created"];
      const rows = leads.map(lead => [
        lead.full_name || "",
        lead.phone_e164 || "",
        lead.email_lower || "",
        lead.company_name || "",
        lead.nationality || "",
        lead.current_location_country || "",
        lead.current_location_city || "",
        lead.source || "",
        lead.created_at ? new Date(lead.created_at).toLocaleDateString() : ""
      ]);

      const csv = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crm_leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${leads.length} leads`);
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export leads");
    } finally {
      setIsExporting(false);
    }
  };

  if (selectedIds.size === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg shadow-xl p-4 flex items-center gap-3 z-50 flex-wrap max-w-[95vw]">
        <span className="text-sm font-bold text-foreground">{selectedIds.size} selected</span>
        
        {/* Select All */}
        {onSelectAll && totalCount > selectedIds.size && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSelectAll}
            className="text-muted-foreground"
          >
            <CheckSquare className="h-4 w-4 mr-1" />
            Select All ({totalCount})
          </Button>
        )}

        {/* Native select for guaranteed visibility */}
        <select
          onChange={(e) => {
            if (e.target.value) handleBulkStatusChange(e.target.value);
            e.target.value = '';
          }}
          disabled={isUpdating}
          className="w-[150px] h-9 px-3 rounded-md border border-zinc-700 bg-zinc-950 text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
          style={{ backgroundColor: '#09090b', color: '#ffffff' }}
          defaultValue=""
        >
          <option value="" disabled style={{ backgroundColor: '#09090b', color: '#888888' }}>Status</option>
          {PIPELINE_STATUSES.map(status => (
            <option key={status.value} value={status.value} style={{ backgroundColor: '#09090b', color: '#ffffff' }}>
              {status.label}
            </option>
          ))}
        </select>

        {/* Bulk Assign - Native select */}
        {brokers.length > 0 && (
          <select
            onChange={(e) => {
              if (e.target.value) handleBulkAssign(e.target.value);
              e.target.value = '';
            }}
            disabled={isUpdating}
            className="w-[160px] h-9 px-3 rounded-md border border-zinc-700 bg-zinc-950 text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            style={{ backgroundColor: '#09090b', color: '#ffffff' }}
            defaultValue=""
          >
            <option value="" disabled style={{ backgroundColor: '#09090b', color: '#888888' }}>Assign to...</option>
            {brokers.map(broker => (
              <option key={broker.id} value={broker.id} style={{ backgroundColor: '#09090b', color: '#ffffff' }}>
                {broker.display_name}
              </option>
            ))}
          </select>
        )}

        {/* Export Selected */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExportSelected}
          disabled={isExporting}
          className="text-muted-foreground"
        >
          {isExporting ? (
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1" />
          )}
          Export
        </Button>

        {/* Bulk Delete */}
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>

        {/* Unselect All */}
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete {selectedIds.size} Leads?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete {selectedIds.size} leads and all related data 
              (activities, assignments, shortlists, reports, calls, notes). 
              <br /><br />
              <strong className="text-red-400">This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CRMBulkActions;