import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Search, Phone, MessageSquare, Mail, Eye, Filter, ChevronDown, Calendar, Lock, PhoneCall, Trash2, MoreHorizontal, FileText, Building2, Sparkles, Calculator, TrendingUp, BarChart3, Palette, FileSignature, Flame, Thermometer, Snowflake, Crown, Pencil } from "lucide-react";
import LeadStatusBadge, { PIPELINE_STATUSES, getStatusInfo } from "./LeadStatusBadge";
import FollowUpScheduler from "./FollowUpScheduler";
import CRMBulkActions from "./CRMBulkActions";
import InlineEditCell from "./InlineEditCell";
import { useActiveLead } from "@/contexts/ActiveLeadContext";
import { Badge } from "@/components/ui/badge";

interface LeadSource {
  source_group: string;
  source_name: string;
}

interface Lead {
  id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  nationality: string | null;
  preferred_language: string | null;
  current_location_country: string | null;
  source: string | null; // Legacy field - not used for display
  source_id: string | null;
  lead_source_type: string | null;
  tags: string[] | null;
  created_at: string;
  owner_type: string;
  vip?: boolean;
  // Joined from crm_lead_sources
  crm_lead_sources?: LeadSource | null;
  state?: {
    pipeline_status: string;
    is_junk: boolean;
    is_hidden: boolean;
    last_touch_at: string | null;
    next_followup_at: string | null;
  };
}

// Helper to mask contact details for company-assigned leads
const maskPhone = (phone: string | null): string => {
  if (!phone) return "-";
  return phone.slice(0, 4) + "****" + phone.slice(-2);
};

const maskEmail = (email: string | null): string => {
  if (!email) return "-";
  const [local, domain] = email.split("@");
  if (!domain) return "****@****";
  return local.slice(0, 2) + "****@" + domain;
};

const getFirstName = (fullName: string): string => {
  return fullName.split(" ")[0];
};

/**
 * Lead Temperature - ONLY calculate for leads with actual engagement
 * Imported leads with no touch should NOT have auto-temperature
 */
const getLeadTemperature = (lead: { created_at: string; lead_source_type?: string | null; state?: { last_touch_at: string | null; pipeline_status: string } }): { label: string; color: string; icon: any; bgColor: string } | null => {
  // For imported leads without engagement, return null (no temperature shown)
  const hasEngagement = lead.state?.last_touch_at != null;
  const isWebsiteLead = lead.lead_source_type === 'website';
  
  // Only calculate temperature if:
  // 1. Lead has been touched/engaged, OR
  // 2. Lead is from website (has intent)
  if (!hasEngagement && !isWebsiteLead) {
    return null; // No temperature for imported leads without engagement
  }
  
  const now = Date.now();
  const createdAt = new Date(lead.created_at).getTime();
  const lastTouch = lead.state?.last_touch_at ? new Date(lead.state.last_touch_at).getTime() : createdAt;
  const daysSinceTouch = Math.floor((now - lastTouch) / (1000 * 60 * 60 * 24));
  const status = lead.state?.pipeline_status || 'new';
  
  // Hot leads: contacted within 3 days OR positive status
  const positiveStatuses = ['qualified', 'negotiating', 'won', 'meeting_scheduled', 'viewing_done'];
  if (positiveStatuses.includes(status) || daysSinceTouch <= 3) {
    return { label: 'Hot', color: 'text-red-500', icon: Flame, bgColor: 'bg-red-500/20 border-red-500/30' };
  }
  
  // Warm leads: contacted within 7 days
  if (daysSinceTouch <= 7) {
    return { label: 'Warm', color: 'text-orange-400', icon: Thermometer, bgColor: 'bg-orange-500/20 border-orange-500/30' };
  }
  
  // Cold leads: not contacted for more than 7 days
  return { label: 'Cold', color: 'text-blue-400', icon: Snowflake, bgColor: 'bg-blue-500/20 border-blue-500/30' };
};
interface CRMLeadsTableProps {
  userId: string;
  filterType: "assigned" | "own" | "all" | "website" | "vip" | "flagged";
  onRefresh: () => void;
  statusFilters?: string[];
  sourceFilter?: string;
  hasOwnerAccess?: boolean;
}

const CRMLeadsTable = ({ userId, filterType, onRefresh, statusFilters = [], sourceFilter, hasOwnerAccess = false }: CRMLeadsTableProps) => {
  const navigate = useNavigate();
  const { setActiveLead } = useActiveLead();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);

  // Set active lead and navigate to a tool
  const handleSelectForTool = (lead: Lead, toolPath: string) => {
    setActiveLead({
      id: lead.id,
      full_name: lead.full_name,
      email: lead.email_lower,
      phone: lead.phone_e164,
      nationality: lead.nationality,
      language: lead.preferred_language,
    });
    toast.success(`Selected ${lead.full_name} for action`);
    navigate(toolPath);
  };

  // Contact details are visible when:
  // 1. "assigned" tab = leads assigned TO this broker (they need full access)
  // 2. "own" tab = broker's own uploaded leads
  // Masking applies only for other views where broker hasn't been granted access
  const isCompanyAssigned = false; // Assigned & own leads show full contact info

  useEffect(() => {
    fetchLeads();
  }, [userId, filterType, statusFilter, statusFilters, sourceFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Join with crm_lead_sources to get source_group and source_name
      let query = supabase.from("crm_leads").select(`
        *,
        crm_lead_sources (
          source_group,
          source_name
        )
      `);

      if (filterType === "own") {
        query = query.eq("owner_type", "broker_owned").eq("owner_user_id", userId);
      } else if (filterType === "website") {
        // Website leads - leads from website forms
        query = query.eq("lead_source_type", "website");
      }
      // For "all", "assigned", and "vip", fetch all and filter client-side for VIP
      // (is_vip column may not be in types yet)

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

        // Apply status filter from quick filters or dropdown
        let filteredLeads = leadsWithState;
        
        // Apply quick filter statuses
        if (statusFilters.length > 0) {
          filteredLeads = leadsWithState.filter(
            l => statusFilters.includes(l.state?.pipeline_status || "new")
          );
        } else if (statusFilter !== "all") {
          filteredLeads = leadsWithState.filter(
            l => l.state?.pipeline_status === statusFilter
          );
        }
        
        // Apply source filter
        if (sourceFilter) {
          filteredLeads = filteredLeads.filter(
            l => (l as any).lead_source_type === sourceFilter
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

        // For VIP tab, filter to only VIP leads
        if (filterType === "vip") {
          filteredLeads = filteredLeads.filter(l => (l as any).vip === true);
        }

        setLeads(filteredLeads as Lead[]);
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

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc("crm_hard_delete_leads", {
        p_lead_ids: [leadId],
      });

      if (error) {
        console.error("Delete lead error:", error);
        toast.error(`Failed to delete lead: ${error.message}`);
        return;
      }

      const deletedCount =
        (data as { lead_count?: number } | null)?.lead_count ?? 1;

      toast.success(`Lead deleted (${deletedCount})`);
      fetchLeads();
      onRefresh();
    } catch (err: any) {
      console.error("Failed to delete lead:", err);
      toast.error(`Failed to delete lead: ${err.message || 'Unknown error'}`);
    }
  };

  const handleToggleVIP = async (leadId: string, currentVIP: boolean) => {
    try {
      const updateData: Record<string, any> = { 
        vip: !currentVIP
      };
      
      // If marking as VIP, set tagged_at and tagged_by
      if (!currentVIP) {
        updateData.vip_tagged_at = new Date().toISOString();
        updateData.vip_tagged_by = userId;
      } else {
        // Removing VIP - clear the fields
        updateData.vip_tagged_at = null;
        updateData.vip_tagged_by = null;
      }

      const { error } = await supabase
        .from("crm_leads")
        .update(updateData)
        .eq("id", leadId);

      if (error) {
        console.error("VIP toggle error:", error);
        toast.error(`Failed to update VIP: ${error.message}`);
        return;
      }

      toast.success(currentVIP ? "Removed from VIP list" : "Added to VIP list");
      fetchLeads();
      onRefresh();
    } catch (err: any) {
      console.error("Failed to toggle VIP status:", err);
      toast.error(`Failed to update VIP status: ${err.message || 'Unknown error'}`);
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

      if (error) {
        console.error("Status change error:", error);
        toast.error(`Failed to update status: ${error.message}`);
        return;
      }

      // Log activity
      await supabase.from("crm_activities").insert({
        lead_id: leadId,
        user_id: userId,
        activity_type: "status_change",
        metadata: { new_status: newStatus }
      });

      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      fetchLeads();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast.error(`Failed to update status: ${err.message || 'Unknown error'}`);
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
        {/* Native select for guaranteed visibility */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[200px] h-10 px-3 rounded-md border border-zinc-700 bg-zinc-950 text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
          style={{ backgroundColor: '#09090b', color: '#ffffff' }}
        >
          <option value="all" style={{ backgroundColor: '#09090b', color: '#ffffff' }}>All Statuses</option>
          <optgroup label="Positive" style={{ backgroundColor: '#09090b', color: '#10b981' }}>
            {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(status => (
              <option key={status.value} value={status.value} style={{ backgroundColor: '#09090b', color: '#ffffff' }}>
                {status.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="🔵 Neutral" style={{ backgroundColor: '#09090b', color: '#3b82f6' }}>
            {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(status => (
              <option key={status.value} value={status.value} style={{ backgroundColor: '#09090b', color: '#ffffff' }}>
                {status.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Negative" style={{ backgroundColor: '#09090b', color: '#ef4444' }}>
            {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
              <option key={status.value} value={status.value} style={{ backgroundColor: '#09090b', color: '#ffffff' }}>
                {status.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card/50">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-b border-border">
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
              <TableHead className="text-white font-bold">Name</TableHead>
              <TableHead className="text-white font-bold">Contact</TableHead>
              <TableHead className="text-white font-bold">Location</TableHead>
              <TableHead className="text-white font-bold">Status</TableHead>
              <TableHead className="text-white font-bold">Source</TableHead>
              <TableHead className="text-white font-bold">Actions</TableHead>
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
                <TableRow key={lead.id} className={cn("border-b border-border/50 hover:bg-muted/30", lead.state?.is_hidden && "opacity-50")}>
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
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {isCompanyAssigned ? getFirstName(lead.full_name) : lead.full_name}
                          {isCompanyAssigned && (
                            <span title="Contact details protected">
                              <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />
                            </span>
                          )}
                        </p>
                    {/* Lead Temperature Badge - Only show if lead has engagement */}
                        {(() => {
                          const temp = getLeadTemperature(lead);
                          if (!temp) return null; // No temperature for unengaged imported leads
                          const TempIcon = temp.icon;
                          return (
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-1.5 py-0 h-5 ${temp.bgColor} ${temp.color} font-semibold`}
                              title={`${temp.label} Lead - Based on engagement recency`}
                            >
                              <TempIcon className="h-3 w-3 mr-0.5" />
                              {temp.label}
                            </Badge>
                          );
                        })()}
                        {/* VIP Badge */}
                        {(lead as any).vip && (
                          <Badge 
                            variant="outline" 
                            className="text-[10px] px-1.5 py-0 h-5 bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold"
                            title="VIP Lead"
                          >
                            <Crown className="h-3 w-3 mr-0.5" />
                            VIP
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <InlineEditCell
                          leadId={lead.id}
                          field="nationality"
                          value={lead.nationality}
                          placeholder="—"
                          onSuccess={fetchLeads}
                          hasOwnerAccess={hasOwnerAccess}
                        />
                        <span>·</span>
                        <InlineEditCell
                          leadId={lead.id}
                          field="preferred_language"
                          value={lead.preferred_language?.toUpperCase() || null}
                          placeholder="—"
                          onSuccess={fetchLeads}
                          hasOwnerAccess={hasOwnerAccess}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {isCompanyAssigned ? (
                        <>
                          <p className="text-muted-foreground italic text-xs">{maskEmail(lead.email_lower)}</p>
                          <p className="text-muted-foreground italic text-xs">{maskPhone(lead.phone_e164)}</p>
                        </>
                      ) : (
                        <>
                          {/* Email Row - Editable if missing */}
                          {lead.email_lower ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="h-7 px-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEmailClick(lead);
                                }}
                                title="Send Email"
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                Email
                              </Button>
                              <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={lead.email_lower}>
                                {lead.email_lower}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <InlineEditCell
                                leadId={lead.id}
                                field="email_lower"
                                value={null}
                                placeholder="Add email"
                                onSuccess={fetchLeads}
                                hasOwnerAccess={hasOwnerAccess}
                              />
                            </div>
                          )}
                          
                          {/* Phone Row - Editable if missing */}
                          {lead.phone_e164 ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="h-7 px-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`tel:${lead.phone_e164}`, '_self');
                                }}
                                title="Call"
                              >
                                <PhoneCall className="h-3 w-3 mr-1" />
                                Call
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 px-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWhatsAppClick(lead);
                                }}
                                title="WhatsApp"
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                WhatsApp
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                {lead.phone_e164}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <InlineEditCell
                                leadId={lead.id}
                                field="phone_e164"
                                value={null}
                                placeholder="Add phone"
                                onSuccess={fetchLeads}
                                hasOwnerAccess={hasOwnerAccess}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <InlineEditCell
                      leadId={lead.id}
                      field="current_location_country"
                      value={lead.current_location_country}
                      placeholder="—"
                      onSuccess={fetchLeads}
                      hasOwnerAccess={hasOwnerAccess}
                      className="text-sm text-foreground"
                    />
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
                          <p className="text-xs font-semibold text-blue-400 px-2 py-1 mt-2">🔵 Neutral</p>
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
                    <div className="text-sm space-y-1">
                      {/* Source: show "source_group · source_name" format from joined data */}
                      <div className="font-medium text-foreground">
                        {lead.lead_source_type === 'website' && !lead.source_id ? (
                          <span className="text-emerald-400 font-semibold">website · Web Form</span>
                        ) : lead.crm_lead_sources ? (
                          <span>
                            {lead.crm_lead_sources.source_group} · {lead.crm_lead_sources.source_name}
                          </span>
                        ) : lead.source_id ? (
                          <span className="text-muted-foreground">imported · Unknown</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      {lead.tags && lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lead.tags
                            .filter((tag: string) => tag.startsWith('subsource-') || tag.startsWith('page-'))
                            .slice(0, 2)
                            .map((tag: string, idx: number) => {
                              const label = tag
                                .replace('subsource-', '')
                                .replace('page-', 'Page: ')
                                .replace(/-/g, ' ')
                                .replace(/\b\w/g, l => l.toUpperCase());
                              return (
                                <span 
                                  key={idx}
                                  className="px-1.5 py-0.5 text-[10px] bg-gold/20 text-gold rounded"
                                >
                                  {label}
                                </span>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5 flex-wrap">
                      <Button
                        size="sm"
                        className="h-8 px-3 bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20"
                        onClick={() => navigate(`/crm/leads/${lead.id}`)}
                        title="View Lead Details"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md"
                        onClick={() => setFollowUpLead(lead)}
                        title="Schedule Follow-up"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      
                      {/* AI Tools & Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            className="h-8 px-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 font-semibold"
                            title="Actions & AI Tools"
                          >
                            <Sparkles className="h-4 w-4 mr-1" />
                            AI Tools
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 bg-card border-border max-h-[400px] overflow-y-auto">
                          <div className="px-2 py-1.5 text-xs font-semibold text-gold uppercase tracking-wide">Communication</div>
                          <DropdownMenuItem 
                            onClick={() => handleSelectForTool(lead, `/crm/leads/${lead.id}?tab=email`)}
                            className="cursor-pointer"
                          >
                            <Mail className="h-4 w-4 mr-2 text-blue-400" />
                            AI Email Composer
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleSelectForTool(lead, `/crm/leads/${lead.id}?tab=whatsapp`)}
                            className="cursor-pointer"
                          >
                            <MessageSquare className="h-4 w-4 mr-2 text-green-400" />
                            AI WhatsApp Message
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1.5 text-xs font-semibold text-purple-400 uppercase tracking-wide">Property Tools</div>
                          <DropdownMenuItem 
                            onClick={() => handleSelectForTool(lead, '/properties')}
                            className="cursor-pointer"
                          >
                            <Building2 className="h-4 w-4 mr-2 text-blue-400" />
                            Select Properties
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleSelectForTool(lead, '/compare')}
                            className="cursor-pointer"
                          >
                            <FileText className="h-4 w-4 mr-2 text-purple-400" />
                            Property Comparison PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleSelectForTool(lead, '/mortgage-calculator')}
                            className="cursor-pointer"
                          >
                            <Calculator className="h-4 w-4 mr-2 text-cyan-400" />
                            Mortgage Calculator
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleSelectForTool(lead, '/rental-index')}
                            className="cursor-pointer"
                          >
                            <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
                            Rental Yield Analysis
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wide">AI Analysis</div>
                          <DropdownMenuItem 
                            onClick={() => handleSelectForTool(lead, '/ai-hub')}
                            className="cursor-pointer"
                          >
                            <Sparkles className="h-4 w-4 mr-2 text-gold" />
                            AI Tools Hub (All Tools)
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleSelectForTool(lead, '/property-evaluator')}
                            className="cursor-pointer"
                          >
                            <BarChart3 className="h-4 w-4 mr-2 text-amber-400" />
                            Property Evaluator
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleSelectForTool(lead, '/interior-design-ai')}
                            className="cursor-pointer"
                          >
                            <Palette className="h-4 w-4 mr-2 text-pink-400" />
                            Interior Design AI
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1.5 text-xs font-semibold text-amber-500 uppercase tracking-wide">VIP Status</div>
                          <DropdownMenuItem 
                            onClick={() => handleToggleVIP(lead.id, !!(lead as any).vip)}
                            className="cursor-pointer"
                          >
                            <Crown className={`h-4 w-4 mr-2 ${(lead as any).vip ? 'text-amber-400' : 'text-muted-foreground'}`} />
                            {(lead as any).vip ? 'Remove from VIP' : 'Mark as VIP'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wide">Documents</div>
                          <DropdownMenuItem 
                            onClick={() => handleSelectForTool(lead, '/documents')}
                            className="cursor-pointer"
                          >
                            <FileText className="h-4 w-4 mr-2 text-orange-400" />
                            Document Generator
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleSelectForTool(lead, '/scan-sign-documents')}
                            className="cursor-pointer"
                          >
                            <FileSignature className="h-4 w-4 mr-2 text-indigo-400" />
                            Scan & Sign Documents
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteLead(lead.id)}
                            className="cursor-pointer text-red-400 focus:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Follow-up Scheduler Modal */}
      {followUpLead && (
        <FollowUpScheduler
          open={!!followUpLead}
          onClose={() => setFollowUpLead(null)}
          onSuccess={() => {
            fetchLeads();
            onRefresh();
          }}
          leadId={followUpLead.id}
          userId={userId}
          leadName={followUpLead.full_name}
        />
      )}

      {/* Bulk Actions - Full Component with Delete, Assign, Status Change */}
      <CRMBulkActions
        selectedIds={selectedLeads}
        onClear={() => setSelectedLeads(new Set())}
        onSuccess={() => {
          fetchLeads();
          onRefresh();
        }}
        userId={userId}
        onSelectAll={() => setSelectedLeads(new Set(filteredLeads.map((l) => l.id)))}
        totalCount={filteredLeads.length}
      />
    </div>
  );
};

export default CRMLeadsTable;
