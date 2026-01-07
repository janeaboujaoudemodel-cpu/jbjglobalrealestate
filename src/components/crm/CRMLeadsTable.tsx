import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Search, Phone, MessageSquare, Mail, Eye, Filter, ChevronDown } from "lucide-react";
import LeadStatusBadge, { PIPELINE_STATUSES, getStatusInfo } from "./LeadStatusBadge";

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
            className="pl-10 bg-card text-foreground border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] bg-card text-foreground border-border">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-80">
            <SelectItem value="all" className="text-foreground">All Statuses</SelectItem>
            <div className="px-2 py-1 text-xs font-semibold text-emerald-400 uppercase">Positive</div>
            {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(status => (
              <SelectItem key={status.value} value={status.value} className="text-foreground">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status.color}`} />
                  {status.label}
                </div>
              </SelectItem>
            ))}
            <div className="px-2 py-1 text-xs font-semibold text-blue-400 uppercase mt-1">Neutral</div>
            {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(status => (
              <SelectItem key={status.value} value={status.value} className="text-foreground">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status.color}`} />
                  {status.label}
                </div>
              </SelectItem>
            ))}
            <div className="px-2 py-1 text-xs font-semibold text-amber-400 uppercase mt-1">Follow-up</div>
            {PIPELINE_STATUSES.filter(s => s.category === 'warning').map(status => (
              <SelectItem key={status.value} value={status.value} className="text-foreground">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status.color}`} />
                  {status.label}
                </div>
              </SelectItem>
            ))}
            <div className="px-2 py-1 text-xs font-semibold text-red-400 uppercase mt-1">Negative</div>
            {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
              <SelectItem key={status.value} value={status.value} className="text-foreground">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status.color}`} />
                  {status.label}
                </div>
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
                      <p className="font-semibold text-foreground">{lead.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.nationality} · {lead.preferred_language?.toUpperCase()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {lead.email_lower && <p className="text-foreground">{lead.email_lower}</p>}
                      {lead.phone_e164 && <p className="text-muted-foreground">{lead.phone_e164}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground">
                      {lead.current_location_country || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {/* Quick Status Badge - Click to change */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="group flex items-center gap-1">
                          <LeadStatusBadge 
                            status={lead.state?.pipeline_status || "new"} 
                            size="sm"
                          />
                          <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 bg-card border-border" align="start">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-emerald-400 px-2 py-1">Positive</p>
                          {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(status => (
                            <button
                              key={status.value}
                              onClick={() => handleStatusChange(lead.id, status.value)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-left transition-colors"
                            >
                              <span className={`w-2 h-2 rounded-full ${status.color}`} />
                              <span className="text-sm text-foreground">{status.label}</span>
                            </button>
                          ))}
                          <p className="text-xs font-semibold text-blue-400 px-2 py-1 mt-2">Neutral</p>
                          {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(status => (
                            <button
                              key={status.value}
                              onClick={() => handleStatusChange(lead.id, status.value)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-left transition-colors"
                            >
                              <span className={`w-2 h-2 rounded-full ${status.color}`} />
                              <span className="text-sm text-foreground">{status.label}</span>
                            </button>
                          ))}
                          <p className="text-xs font-semibold text-amber-400 px-2 py-1 mt-2">Follow-up</p>
                          {PIPELINE_STATUSES.filter(s => s.category === 'warning').map(status => (
                            <button
                              key={status.value}
                              onClick={() => handleStatusChange(lead.id, status.value)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-left transition-colors"
                            >
                              <span className={`w-2 h-2 rounded-full ${status.color}`} />
                              <span className="text-sm text-foreground">{status.label}</span>
                            </button>
                          ))}
                          <p className="text-xs font-semibold text-red-400 px-2 py-1 mt-2">Negative</p>
                          {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
                            <button
                              key={status.value}
                              onClick={() => handleStatusChange(lead.id, status.value)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-left transition-colors"
                            >
                              <span className={`w-2 h-2 rounded-full ${status.color}`} />
                              <span className="text-sm text-foreground">{status.label}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground">
                      {lead.source || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground hover:text-primary"
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
          <span className="text-sm font-semibold text-foreground">{selectedLeads.size} selected</span>
          <Select onValueChange={(value) => {
            selectedLeads.forEach(id => handleStatusChange(id, value));
            setSelectedLeads(new Set());
          }}>
            <SelectTrigger className="w-[180px] bg-card text-foreground border-border">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-80">
              <div className="px-2 py-1 text-xs font-semibold text-emerald-400 uppercase">Positive</div>
              {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(status => (
                <SelectItem key={status.value} value={status.value} className="text-foreground">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-xs font-semibold text-blue-400 uppercase mt-1">Neutral</div>
              {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(status => (
                <SelectItem key={status.value} value={status.value} className="text-foreground">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-xs font-semibold text-amber-400 uppercase mt-1">Follow-up</div>
              {PIPELINE_STATUSES.filter(s => s.category === 'warning').map(status => (
                <SelectItem key={status.value} value={status.value} className="text-foreground">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-xs font-semibold text-red-400 uppercase mt-1">Negative</div>
              {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
                <SelectItem key={status.value} value={status.value} className="text-foreground">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSelectedLeads(new Set())} className="text-foreground">
            Clear
          </Button>
        </div>
      )}
    </div>
  );
};

export default CRMLeadsTable;
