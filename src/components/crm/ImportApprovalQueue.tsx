import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Users, Briefcase, Building, TrendingUp, Loader2 } from "lucide-react";

interface PendingLead {
  id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  company_name: string | null;
  contact_type: string;
  auto_detected_type: boolean;
  detection_keywords: string[] | null;
  gender: string | null;
}

interface ImportApprovalQueueProps {
  open: boolean;
  onClose: () => void;
  onApproved: () => void;
  userId: string;
}

const CONTACT_TYPE_ICONS: Record<string, React.ReactNode> = {
  client: <Users className="h-4 w-4 text-blue-600" />,
  broker: <Briefcase className="h-4 w-4 text-purple-600" />,
  developer: <Building className="h-4 w-4 text-orange-600" />,
  investor: <TrendingUp className="h-4 w-4 text-emerald-600" />,
};

const ImportApprovalQueue = ({ open, onClose, onApproved, userId }: ImportApprovalQueueProps) => {
  const [pendingLeads, setPendingLeads] = useState<PendingLead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPendingLeads();
    }
  }, [open]);

  const fetchPendingLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_leads")
      .select("id, full_name, email_lower, phone_e164, company_name, contact_type, auto_detected_type, detection_keywords, gender")
      .eq("import_approval_status", "pending")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast.error("Failed to load pending leads");
    } else {
      setPendingLeads(data || []);
    }
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === pendingLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingLeads.map(l => l.id)));
    }
  };

  const updateContactType = async (leadId: string, contactType: string) => {
    await supabase
      .from("crm_leads")
      .update({ contact_type: contactType as any })
      .eq("id", leadId);
    
    setPendingLeads(prev => prev.map(l => 
      l.id === leadId ? { ...l, contact_type: contactType } : l
    ));
  };

  const approveSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one contact");
      return;
    }

    setProcessing(true);
    const { error } = await supabase
      .from("crm_leads")
      .update({ import_approval_status: "approved" as any })
      .in("id", Array.from(selectedIds));

    if (error) {
      toast.error("Failed to approve contacts");
    } else {
      toast.success(`Approved ${selectedIds.size} contacts`);
      setPendingLeads(prev => prev.filter(l => !selectedIds.has(l.id)));
      setSelectedIds(new Set());
      onApproved();
    }
    setProcessing(false);
  };

  const rejectSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one contact");
      return;
    }

    setProcessing(true);
    const { error } = await supabase
      .from("crm_leads")
      .update({ import_approval_status: "rejected" as any })
      .in("id", Array.from(selectedIds));

    if (error) {
      toast.error("Failed to reject contacts");
    } else {
      toast.success(`Rejected ${selectedIds.size} contacts`);
      setPendingLeads(prev => prev.filter(l => !selectedIds.has(l.id)));
      setSelectedIds(new Set());
    }
    setProcessing(false);
  };

  // Group leads by company or contact type
  const groupedLeads = pendingLeads.reduce((acc, lead) => {
    const key = lead.company_name || lead.contact_type || 'ungrouped';
    if (!acc[key]) acc[key] = [];
    acc[key].push(lead);
    return acc;
  }, {} as Record<string, PendingLead[]>);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Import Approval Queue
            <Badge variant="secondary">{pendingLeads.length} pending</Badge>
          </DialogTitle>
          <DialogDescription>
            Review and approve imported contacts. AI has auto-detected contact types.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pendingLeads.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-muted-foreground">No pending contacts to review</p>
          </div>
        ) : (
          <>
            {/* Actions bar */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedIds.size === pendingLeads.length}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={rejectSelected}
                  disabled={selectedIds.size === 0 || processing}
                >
                  <XCircle className="h-4 w-4 mr-1 text-destructive" />
                  Reject
                </Button>
                <Button 
                  size="sm" 
                  onClick={approveSelected}
                  disabled={selectedIds.size === 0 || processing}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>

            {/* Grouped leads */}
            <div className="flex-1 overflow-auto space-y-4 py-2">
              {Object.entries(groupedLeads).map(([group, leads]) => (
                <div key={group} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {CONTACT_TYPE_ICONS[group] || <Users className="h-4 w-4" />}
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                    <Badge variant="outline" className="text-xs">{leads.length}</Badge>
                  </h4>
                  <div className="border rounded-lg divide-y">
                    {leads.map((lead) => (
                      <div key={lead.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                        <Checkbox
                          checked={selectedIds.has(lead.id)}
                          onCheckedChange={() => toggleSelect(lead.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{lead.full_name}</p>
                            {lead.auto_detected_type && (
                              <Badge variant="secondary" className="text-xs">AI detected</Badge>
                            )}
                            {lead.gender && (
                              <Badge variant="outline" className="text-xs capitalize">{lead.gender}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {lead.email_lower || lead.phone_e164 || 'No contact info'}
                          </p>
                          {lead.detection_keywords && lead.detection_keywords.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Keywords: {lead.detection_keywords.join(', ')}
                            </p>
                          )}
                        </div>
                        <Select
                          value={lead.contact_type}
                          onValueChange={(val) => updateContactType(lead.id, val)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="broker">Broker</SelectItem>
                            <SelectItem value="developer">Developer</SelectItem>
                            <SelectItem value="investor">Investor</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportApprovalQueue;
