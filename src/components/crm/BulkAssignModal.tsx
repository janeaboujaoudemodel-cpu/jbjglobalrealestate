import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Shuffle, Check, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BrokerOption {
  user_id: string;
  display_name: string;
  photo_url: string | null;
  is_active: boolean;
}

interface BulkAssignModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedLeadIds: string[];
  filterStatus?: string; // e.g., "junk", "no_answer" for quick assign
  totalAvailable?: number;
}

const BulkAssignModal = ({ 
  open, 
  onClose, 
  onSuccess, 
  selectedLeadIds,
  filterStatus,
  totalAvailable = 0
}: BulkAssignModalProps) => {
  const [brokers, setBrokers] = useState<BrokerOption[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<string>("");
  const [assignCount, setAssignCount] = useState<number>(selectedLeadIds.length || 100);
  const [loading, setLoading] = useState(false);
  const [fetchingBrokers, setFetchingBrokers] = useState(true);

  useEffect(() => {
    if (open) {
      fetchBrokers();
      setAssignCount(selectedLeadIds.length || Math.min(100, totalAvailable));
    }
  }, [open, selectedLeadIds.length, totalAvailable]);

  const fetchBrokers = async () => {
    setFetchingBrokers(true);
    try {
      // Get brokers from crm_users_profile
      const { data, error } = await supabase
        .from("crm_users_profile")
        .select("user_id, display_name, is_active")
        .eq("is_active", true)
        .in("crm_role", ["broker_member", "admin", "owner_admin"]);

      if (error) throw error;

      // Get broker photos if available
      const userIds = data?.map(b => b.user_id) || [];
      let brokerPhotos: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("broker_profiles")
          .select("user_id, photo_url")
          .in("user_id", userIds);
        
        profiles?.forEach(p => {
          if (p.photo_url) brokerPhotos[p.user_id] = p.photo_url;
        });
      }

      setBrokers(data?.map(b => ({
        user_id: b.user_id,
        display_name: b.display_name || "Broker",
        photo_url: brokerPhotos[b.user_id] || null,
        is_active: b.is_active
      })) || []);
    } catch (err) {
      console.error("Failed to fetch brokers:", err);
      toast.error("Failed to load brokers");
    } finally {
      setFetchingBrokers(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedBroker) {
      toast.error("Please select a broker");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let leadsToAssign = selectedLeadIds;
      
      // If no specific leads selected, fetch leads based on filter
      if (leadsToAssign.length === 0 && filterStatus) {
        const { data: stateData } = await supabase
          .from("crm_lead_state_per_user")
          .select("lead_id")
          .eq("pipeline_status", filterStatus as any)
          .limit(assignCount);
        
        leadsToAssign = stateData?.map(s => s.lead_id) || [];
      } else if (leadsToAssign.length === 0) {
        // Get unassigned leads
        const { data: unassigned } = await supabase
          .from("crm_leads")
          .select("id")
          .eq("owner_type", "company_assigned")
          .limit(assignCount);
        
        leadsToAssign = unassigned?.map(l => l.id) || [];
      }

      if (leadsToAssign.length === 0) {
        toast.error("No leads available to assign");
        return;
      }

      // Call the bulk assign function
      const { data, error } = await supabase.rpc("bulk_assign_leads", {
        p_lead_ids: leadsToAssign,
        p_assignee_user_id: selectedBroker,
        p_assigned_by_user_id: user.id
      });

      if (error) throw error;

      toast.success(`Successfully assigned ${data || leadsToAssign.length} leads`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to assign leads:", err);
      toast.error(err.message || "Failed to assign leads");
    } finally {
      setLoading(false);
    }
  };

  const brokerName = brokers.find(b => b.user_id === selectedBroker)?.display_name;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Shuffle className="h-5 w-5 text-primary" />
            Bulk Assign Leads
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {selectedLeadIds.length > 0 
              ? `Assign ${selectedLeadIds.length} selected leads to a broker`
              : `Select leads to distribute to a broker`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Number of leads to assign */}
          {selectedLeadIds.length === 0 && (
            <div className="space-y-2">
              <Label className="text-white font-semibold">Number of Leads</Label>
              <div className="flex gap-2">
                {[50, 100, 250, 500, 1000].map((num) => (
                  <Button
                    key={num}
                    variant={assignCount === num ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAssignCount(num)}
                    className={assignCount === num ? "bg-primary" : ""}
                  >
                    {num}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={assignCount}
                onChange={(e) => setAssignCount(parseInt(e.target.value) || 0)}
                min={1}
                max={totalAvailable || 10000}
                className="mt-2 bg-muted border-border text-white"
                placeholder="Custom amount"
              />
              <p className="text-xs text-muted-foreground">
                {totalAvailable > 0 && `${totalAvailable} leads available`}
              </p>
            </div>
          )}

          {/* Select Broker */}
          <div className="space-y-2">
            <Label className="text-white font-semibold">Assign To</Label>
            {fetchingBrokers ? (
              <div className="text-muted-foreground text-sm">Loading brokers...</div>
            ) : brokers.length === 0 ? (
              <div className="flex items-center gap-2 text-[#1A1A1A] text-sm">
                <AlertCircle className="h-4 w-4" />
                No active brokers found
              </div>
            ) : (
              <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                <SelectTrigger className="bg-muted border-border text-white">
                  <SelectValue placeholder="Select a broker" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {brokers.map((broker) => (
                    <SelectItem key={broker.user_id} value={broker.user_id} className="text-white">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={broker.photo_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {broker.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{broker.display_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Preview */}
          {selectedBroker && (
            <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="h-4 w-4" />
                <span className="font-semibold">Ready to assign</span>
              </div>
              <p className="text-sm text-emerald-300 mt-1">
                {selectedLeadIds.length || assignCount} leads will be assigned to <strong>{brokerName}</strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={loading || !selectedBroker || brokers.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>Assigning...</>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Assign Leads
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkAssignModal;
