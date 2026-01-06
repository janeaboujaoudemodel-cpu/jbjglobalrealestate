import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Phone, MessageSquare, Mail, Eye, Trash2, Filter } from "lucide-react";

interface Lead {
  id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  nationality: string | null;
  preferred_language: string | null;
  current_location_country: string | null;
  source: string | null;
  created_at: string;
  owner_type: string;
  state?: {
    pipeline_status: string;
    is_junk: boolean;
    is_hidden: boolean;
    last_touch_at: string | null;
    next_followup_at: string | null;
  };
}

interface CRMLeadsTableProps {
  userId: string;
  filterType: "assigned" | "own";
  onRefresh: () => void;
}

const PIPELINE_STATUSES = [
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { value: "qualified", label: "Qualified", color: "bg-green-500" },
  { value: "viewing", label: "Viewing", color: "bg-purple-500" },
  { value: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { value: "closed_won", label: "Closed Won", color: "bg-emerald-600" },
  { value: "closed_lost", label: "Closed Lost", color: "bg-red-500" },
  { value: "no_answer", label: "No Answer", color: "bg-gray-500" },
  { value: "junk", label: "Junk", color: "bg-gray-400" },
];

const CRMLeadsTable = ({ userId, filterType, onRefresh }: CRMLeadsTableProps) => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLeads();
  }, [userId, filterType, statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = supabase.from("crm_leads").select("*");

      if (filterType === "own") {
        query = query.eq("owner_type", "broker_owned").eq("owner_user_id", userId);
      }
      // For "assigned", RLS will handle filtering

      const { data: leadsData, error: leadsError } = await query.order("created_at", { ascending: false });

      if (leadsError) throw leadsError;

      // Fetch lead states for this user
      const leadIds = (leadsData || []).map(l => l.id);
      if (leadIds.length > 0) {
        const { data: statesData } = await supabase
          .from("crm_lead_state_per_user")
          .select("*")
          .eq("user_id", userId)
          .in("lead_id", leadIds);

        const statesMap = new Map(statesData?.map(s => [s.lead_id, s]) || []);

        const leadsWithState = leadsData?.map(lead => ({
          ...lead,
          state: statesMap.get(lead.id)
        })) || [];

        // Apply status filter
        let filteredLeads = leadsWithState;
        if (statusFilter !== "all") {
          filteredLeads = leadsWithState.filter(
            l => l.state?.pipeline_status === statusFilter
          );
        }

        // For assigned tab, only show leads that have an active assignment
        if (filterType === "assigned") {
          const { data: assignments } = await supabase
            .from("crm_lead_assignments")
            .select("lead_id")
            .eq("assigned_to_user_id", userId)
            .is("unassigned_at", null);

          const assignedIds = new Set(assignments?.map(a => a.lead_id) || []);
          filteredLeads = filteredLeads.filter(l => assignedIds.has(l.id));
        }

        setLeads(filteredLeads);
      } else {
        setLeads([]);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      // Upsert lead state - use insert with onConflict update
      const { error } = await supabase
        .from("crm_lead_state_per_user")
        .upsert(
          {
            lead_id: leadId,
            user_id: userId,
            pipeline_status: newStatus as any,
            is_junk: newStatus === "junk",
            last_touch_at: new Date().toISOString()
          },
          { onConflict: "lead_id,user_id" }
        );

      if (error) throw error;

      // Log activity
      await supabase.from("crm_activities").insert({
        lead_id: leadId,
        user_id: userId,
        activity_type: "status_change",
        metadata: { new_status: newStatus }
      });

      toast.success(`Status updated to ${newStatus}`);
      fetchLeads();
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status");
    }
  };

  const handleWhatsAppClick = async (lead: Lead) => {
    if (!lead.phone_e164) {
      toast.error("No phone number available");
      return;
    }

    // Log activity
    await supabase.from("crm_activities").insert({
      lead_id: lead.id,
      user_id: userId,
      activity_type: "whatsapp_click",
      metadata: { phone: lead.phone_e164 }
    });

    // Update last touch
    await supabase
      .from("crm_lead_state_per_user")
      .upsert({
        lead_id: lead.id,
        user_id: userId,
        last_touch_at: new Date().toISOString()
      }, { onConflict: "lead_id,user_id" });

    // Open WhatsApp
    const phone = lead.phone_e164.replace("+", "");
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  const handleEmailClick = async (lead: Lead) => {
    if (!lead.email_lower) {
      toast.error("No email available");
      return;
    }

    // Log activity
    await supabase.from("crm_activities").insert({
      lead_id: lead.id,
      user_id: userId,
      activity_type: "email_click",
      metadata: { email: lead.email_lower }
    });

    window.open(`mailto:${lead.email_lower}`, "_blank");
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.full_name.toLowerCase().includes(query) ||
      lead.email_lower?.toLowerCase().includes(query) ||
      lead.phone_e164?.includes(query) ||
      lead.nationality?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string | undefined) => {
    const statusInfo = PIPELINE_STATUSES.find(s => s.value === status) || PIPELINE_STATUSES[0];
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, nationality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PIPELINE_STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
                    } else {
                      setSelectedLeads(new Set());
                    }
                  }}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id} className={lead.state?.is_hidden ? "opacity-50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLeads.has(lead.id)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedLeads);
                        if (checked) {
                          newSelected.add(lead.id);
                        } else {
                          newSelected.delete(lead.id);
                        }
                        setSelectedLeads(newSelected);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{lead.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.nationality} · {lead.preferred_language?.toUpperCase()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {lead.email_lower && <p>{lead.email_lower}</p>}
                      {lead.phone_e164 && <p className="text-muted-foreground">{lead.phone_e164}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {lead.current_location_country || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.state?.pipeline_status || "new"}
                      onValueChange={(value) => handleStatusChange(lead.id, value)}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STATUSES.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {lead.source || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/crm/leads/${lead.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600"
                        onClick={() => handleWhatsAppClick(lead)}
                        disabled={!lead.phone_e164}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600"
                        onClick={() => handleEmailClick(lead)}
                        disabled={!lead.email_lower}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Actions */}
      {selectedLeads.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border rounded-lg shadow-lg p-4 flex items-center gap-4">
          <span className="text-sm font-medium">{selectedLeads.size} selected</span>
          <Select onValueChange={(value) => {
            selectedLeads.forEach(id => handleStatusChange(id, value));
            setSelectedLeads(new Set());
          }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_STATUSES.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSelectedLeads(new Set())}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
};

export default CRMLeadsTable;
