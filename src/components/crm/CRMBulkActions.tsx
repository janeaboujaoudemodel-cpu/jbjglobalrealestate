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
import { Trash2, UserPlus, RefreshCw, X } from "lucide-react";
import { PIPELINE_STATUSES } from "./LeadStatusBadge";

interface CRMBulkActionsProps {
  selectedIds: Set<string>;
  onClear: () => void;
  onSuccess: () => void;
  userId: string;
}

interface Broker {
  id: string;
  display_name: string;
}

const CRMBulkActions = ({ selectedIds, onClear, onSuccess, userId }: CRMBulkActionsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
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
    try {
      const ids = Array.from(selectedIds);
      
      // Delete related records first (including all child tables)
      await Promise.all([
        supabase.from("crm_lead_state_per_user").delete().in("lead_id", ids),
        supabase.from("crm_activities").delete().in("lead_id", ids),
        supabase.from("crm_lead_assignments").delete().in("lead_id", ids),
        supabase.from("crm_ai_drafts").delete().in("lead_id", ids),
        supabase.from("crm_lead_shortlists").delete().in("lead_id", ids),
        supabase.from("crm_lead_reports").delete().in("lead_id", ids),
        supabase.from("crm_calls").delete().in("lead_id", ids),
        supabase.from("crm_notes").delete().in("lead_id", ids),
        supabase.from("crm_campaign_recipients").delete().in("lead_id", ids),
      ]);
      
      // Delete leads
      const { error } = await supabase
        .from("crm_leads")
        .delete()
        .in("id", ids);

      if (error) throw error;

      toast.success(`Deleted ${ids.length} leads`);
      onSuccess();
      onClear();
    } catch (err) {
      console.error("Bulk delete failed:", err);
      toast.error("Failed to delete leads");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (selectedIds.size === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg shadow-xl p-4 flex items-center gap-4 z-50 flex-wrap max-w-[95vw]">
        <span className="text-sm font-bold text-foreground">{selectedIds.size} selected</span>
        
        {/* Bulk Status Change */}
        <Select onValueChange={handleBulkStatusChange} disabled={isUpdating}>
          <SelectTrigger className="w-[160px] bg-muted border-border text-foreground h-9">
            <SelectValue placeholder="Change Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-64 overflow-y-auto">
            {PIPELINE_STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value} className="text-foreground">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status.color}`} />
                  {status.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Bulk Assign */}
        {brokers.length > 0 && (
          <Select onValueChange={handleBulkAssign} disabled={isUpdating}>
            <SelectTrigger className="w-[180px] bg-muted border-border text-foreground h-9">
              <UserPlus className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Assign to..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {brokers.map(broker => (
                <SelectItem key={broker.id} value={broker.id} className="text-foreground">
                  {broker.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Bulk Delete */}
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>

        {/* Unselect All */}
        <Button variant="outline" size="sm" onClick={onClear} className="text-muted-foreground">
          <X className="h-4 w-4 mr-1" />
          Unselect All
        </Button>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete {selectedIds.size} Leads?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete {selectedIds.size} leads and all related data 
              (activities, assignments, shortlists, reports). This action cannot be undone.
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
