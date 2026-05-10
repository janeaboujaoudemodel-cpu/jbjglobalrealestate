import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Search, UserPlus, Loader2, Users, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Broker {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  capacity: number;
  active_leads: number;
  status: string;
}

interface ExistingLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  assigned_broker_id: string | null;
}

interface AssignLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brokers: Broker[];
  onAssigned: () => void;
}

export function AssignLeadModal({ open, onOpenChange, brokers, onAssigned }: AssignLeadModalProps) {
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");
  
  // Existing lead state
  const [existingLeads, setExistingLeads] = useState<ExistingLead[]>([]);
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [selectedExistingLead, setSelectedExistingLead] = useState<ExistingLead | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(false);
  
  // New lead state
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadInterest, setLeadInterest] = useState("");
  
  // Common state
  const [selectedBroker, setSelectedBroker] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeBrokers = brokers.filter(b => b.status === "active");

  // Fetch existing unassigned leads
  useEffect(() => {
    if (open && activeTab === "existing") {
      fetchExistingLeads();
    }
  }, [open, activeTab]);

  const fetchExistingLeads = async () => {
    setLoadingLeads(true);
    try {
      const { data, error } = await supabase
        .from("jbj_leads")
        .select("id, name, email, phone, status, assigned_broker_id")
        .is("assigned_broker_id", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setExistingLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to load existing leads");
    } finally {
      setLoadingLeads(false);
    }
  };

  const filteredExistingLeads = existingLeads.filter(lead =>
    lead.name.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
    (lead.email && lead.email.toLowerCase().includes(leadSearchQuery.toLowerCase())) ||
    (lead.phone && lead.phone.includes(leadSearchQuery))
  );

  const handleAssignExisting = async () => {
    if (!selectedExistingLead || !selectedBroker) {
      toast.error("Please select a lead and a broker");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("jbj_leads")
        .update({ assigned_broker_id: selectedBroker })
        .eq("id", selectedExistingLead.id);

      if (error) throw error;

      toast.success(`${selectedExistingLead.name} assigned successfully`);
      onOpenChange(false);
      resetForm();
      onAssigned();
    } catch (error) {
      console.error("Error assigning lead:", error);
      toast.error("Failed to assign lead");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAndAssign = async () => {
    if (!leadName.trim() || !selectedBroker) {
      toast.error("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("jbj_leads").insert({
        name: leadName.trim(),
        email: leadEmail.trim() || null,
        phone: leadPhone.trim() || null,
        property_interest: leadInterest.trim() || null,
        assigned_broker_id: selectedBroker,
        status: "new",
      });

      if (error) throw error;

      toast.success("Lead created and assigned successfully");
      onOpenChange(false);
      resetForm();
      onAssigned();
    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error("Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setLeadName("");
    setLeadEmail("");
    setLeadPhone("");
    setLeadInterest("");
    setSelectedBroker("");
    setSelectedExistingLead(null);
    setLeadSearchQuery("");
    setActiveTab("existing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <UserPlus className="h-5 w-5 text-[#1A1A1A]" />
            Assign Lead to Broker
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "existing" | "new")}>
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6]">
            <TabsTrigger value="existing" className="flex items-center gap-2 data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A]">
              <Users className="h-4 w-4" />
              Existing Lead
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2 data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A]">
              <PlusCircle className="h-4 w-4" />
              New Lead
            </TabsTrigger>
          </TabsList>

          {/* Existing Lead Tab */}
          <TabsContent value="existing" className="space-y-4 mt-4">
            <p className="text-sm text-[#1A1A1A]/70">
              Select an unassigned lead from your database to assign to a broker.
            </p>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/50" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={leadSearchQuery}
                onChange={(e) => setLeadSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Leads List */}
            <ScrollArea className="h-48 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7]/50">
              {loadingLeads ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1A1A1A]" />
                </div>
              ) : filteredExistingLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-[#1A1A1A]/60">
                  <Users className="h-8 w-8 mb-2" />
                  <p className="text-sm">No unassigned leads found</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredExistingLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedExistingLead(lead)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedExistingLead?.id === lead.id
                          ? "bg-[#EFE6D6]/20 border-2 border-[#B89555]"
                          : "hover:bg-[#EFE6D6]/10 border border-transparent"
                      }`}
                    >
                      <p className="font-medium text-[#1A1A1A]">{lead.name}</p>
                      <p className="text-xs text-[#1A1A1A]/60">
                        {lead.email || lead.phone || "No contact info"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Broker Selection */}
            <div>
              <label className="text-sm text-[#1A1A1A]/70 mb-2 block">Assign to Broker *</label>
              <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a broker" />
                </SelectTrigger>
                <SelectContent>
                  {activeBrokers.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id}>
                      <div className="flex items-center gap-2">
                        <span>{broker.name}</span>
                        <span className="text-[#1A1A1A]/50 text-xs">
                          ({broker.active_leads}/{broker.capacity})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAssignExisting}
                disabled={submitting || !selectedExistingLead || !selectedBroker}
                className="flex-1"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign Lead"}
              </Button>
            </div>
          </TabsContent>

          {/* New Lead Tab */}
          <TabsContent value="new" className="space-y-4 mt-4">
            <p className="text-sm text-[#1A1A1A]/70">
              Create a new lead and assign them directly to a broker.
            </p>

            <div>
              <label className="text-sm text-[#1A1A1A]/70 mb-2 block">Lead Name *</label>
              <Input
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Enter lead name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-[#1A1A1A]/70 mb-2 block">Email</label>
                <Input
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-sm text-[#1A1A1A]/70 mb-2 block">Phone</label>
                <Input
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="+971..."
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-[#1A1A1A]/70 mb-2 block">Property Interest</label>
              <Input
                value={leadInterest}
                onChange={(e) => setLeadInterest(e.target.value)}
                placeholder="e.g., 2BR apartment in Downtown"
              />
            </div>
            <div>
              <label className="text-sm text-[#1A1A1A]/70 mb-2 block">Assign to Broker *</label>
              <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a broker" />
                </SelectTrigger>
                <SelectContent>
                  {activeBrokers.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id}>
                      <div className="flex items-center gap-2">
                        <span>{broker.name}</span>
                        <span className="text-[#1A1A1A]/50 text-xs">
                          ({broker.active_leads}/{broker.capacity})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateAndAssign}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & Assign"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
