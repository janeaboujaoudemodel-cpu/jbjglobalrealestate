import { useEffect, useMemo, useState } from "react";
import { formatDisplayDate } from "@/utils/formatDate";
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
import { toast } from "sonner";
import { Mail, MessageSquare, PhoneCall, Trash2 } from "lucide-react";
import { PIPELINE_STATUSES, STATUS_GROUPS } from "./LeadStatusBadge";
import CRMLeadsBulkBar from "./CRMLeadsBulkBar";
import LeadAssignModal from "./LeadAssignModal";
import DeleteLeadDialog from "./DeleteLeadDialog";

interface LeadSource {
  source_group: string;
  source_name: string;
}

interface Lead {
  id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  lead_source_type: string | null;
  source_id: string | null;
  vip?: boolean;
  created_at: string;
  crm_lead_sources?: LeadSource | null;
  state?: {
    pipeline_status: string | null;
  };
}

interface AssignmentRow {
  lead_id: string;
  assigned_to_user_id: string;
}

interface CRMLeadsTableV2Props {
  userId: string;
  filterType: "assigned" | "own" | "all" | "website" | "vip" | "flagged";
  onRefresh: () => void;
  statusFilters?: string[];
  sourceFilter?: string;
  isOwner?: boolean;
}

// Removed unused tokenStyle

export default function CRMLeadsTableV2({
  userId,
  filterType,
  onRefresh,
  statusFilters = [],
  sourceFilter,
  isOwner = false,
}: CRMLeadsTableV2Props) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignedNames, setAssignedNames] = useState<Record<string, string>>({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLeadIds, setAssignLeadIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // Group statuses by category for the dropdown
  const groupedStatuses = useMemo(() => {
    const groups: Record<string, typeof PIPELINE_STATUSES> = {
      positive: PIPELINE_STATUSES.filter(s => s.category === 'positive'),
      neutral: PIPELINE_STATUSES.filter(s => s.category === 'neutral'),
      negative: PIPELINE_STATUSES.filter(s => s.category === 'negative'),
    };
    return groups;
  }, []);

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filterType, JSON.stringify(statusFilters), sourceFilter]);

  const applySourceFilter = (rows: Lead[]): Lead[] => {
    if (!sourceFilter) return rows;

    if (sourceFilter === "website") {
      return rows.filter((l) => l.lead_source_type === "website");
    }

    if (sourceFilter === "imported") {
      return rows.filter((l) => l.lead_source_type !== "website");
    }

    if (sourceFilter.startsWith("source:")) {
      const id = sourceFilter.replace("source:", "");
      return rows.filter((l) => l.source_id === id);
    }

    // fallback: treat as lead_source_type
    return rows.filter((l) => l.lead_source_type === sourceFilter);
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = supabase.from("crm_leads").select(
        `*,
         crm_lead_sources (source_group, source_name)`
      );

      if (filterType === "own") {
        query = query.eq("owner_type", "broker_owned").eq("owner_user_id", userId);
      } else if (filterType === "website") {
        query = query.eq("lead_source_type", "website");
      }

      const { data: leadsData, error: leadsError } = await query.order("created_at", {
        ascending: false,
      });

      if (leadsError) throw leadsError;

      const leadIds = (leadsData || []).map((l: any) => l.id as string);
      if (leadIds.length === 0) {
        setLeads([]);
        setAssignedNames({});
        setSelected(new Set());
        return;
      }

      const { data: statesData } = await supabase
        .from("crm_lead_state_per_user")
        .select("lead_id,pipeline_status")
        .eq("user_id", userId)
        .in("lead_id", leadIds);

      const statesMap = new Map((statesData || []).map((s: any) => [s.lead_id, s]));

      let rows: Lead[] = (leadsData || []).map((l: any) => ({
        ...l,
        state: statesMap.get(l.id) || null,
      }));

      // Quick filter statuses
      if (statusFilters.length > 0) {
        rows = rows.filter((l) => statusFilters.includes(l.state?.pipeline_status || "new"));
      }

      // VIP tab
      if (filterType === "vip") {
        rows = rows.filter((l) => (l as any).vip === true);
      }

      // Assigned tab
      if (filterType === "assigned") {
        const { data: assignments } = await supabase
          .from("crm_lead_assignments")
          .select("lead_id")
          .eq("assigned_to_user_id", userId)
          .is("unassigned_at", null);

        const assignedIds = new Set((assignments || []).map((a: any) => a.lead_id));
        rows = rows.filter((l) => assignedIds.has(l.id));
      }

      rows = applySourceFilter(rows);

      setLeads(rows);

      // Load assignees for Assigned Broker column
      const { data: assignmentRows } = await supabase
        .from("crm_lead_assignments")
        .select("lead_id, assigned_to_user_id")
        .in("lead_id", rows.map((r) => r.id))
        .is("unassigned_at", null);

      const aRows = (assignmentRows || []) as unknown as AssignmentRow[];
      const leadToAssignee = new Map<string, string>();
      aRows.forEach((a) => {
        leadToAssignee.set(a.lead_id, a.assigned_to_user_id);
      });

      const uniqueAssignees = Array.from(new Set(aRows.map((a) => a.assigned_to_user_id)));
      if (uniqueAssignees.length === 0) {
        setAssignedNames({});
      } else {
        const { data: users } = await supabase
          .from("crm_users_profile")
          .select("user_id, display_name")
          .in("user_id", uniqueAssignees);

        const userMap = new Map(
          (users || []).map((u: any) => [u.user_id as string, (u.display_name as string | null) || u.user_id])
        );

        const next: Record<string, string> = {};
        for (const [leadId, assignee] of leadToAssignee.entries()) {
          next[leadId] = userMap.get(assignee) || assignee;
        }
        setAssignedNames(next);
      }

      // Keep selection only for visible rows
      setSelected((prev) => {
        const visible = new Set(rows.map((r) => r.id));
        const next = new Set<string>();
        prev.forEach((id) => {
          if (visible.has(id)) next.add(id);
        });
        return next;
      });
    } catch (err: any) {
      console.error("Failed to fetch leads:", err);
      toast.error(`Failed to load leads: ${err?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVIP = async (leadId: string, currentVIP: boolean) => {
    // Optimistic update - update UI immediately without re-fetching
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, vip: !currentVIP }
          : l
      )
    );

    try {
      const updateData: Record<string, any> = { vip: !currentVIP };
      if (!currentVIP) {
        updateData.vip_tagged_at = new Date().toISOString();
        updateData.vip_tagged_by = userId;
      } else {
        updateData.vip_tagged_at = null;
        updateData.vip_tagged_by = null;
      }

      const { error } = await supabase.from("crm_leads").update(updateData).eq("id", leadId);
      if (error) {
        // Revert on error
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, vip: currentVIP }
              : l
          )
        );
        toast.error(`VIP update failed: ${error.message}`);
        return;
      }
      // Silent success - no page shake, no reload
      toast.success(currentVIP ? "VIP removed" : "VIP added");
    } catch (err: any) {
      // Revert on error
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? { ...l, vip: currentVIP }
            : l
        )
      );
      toast.error(`VIP update failed: ${err?.message || "Unknown error"}`);
    }
  };

  const handleStatusChange = async (leadId: string, nextStatus: string) => {
    try {
      const { error } = await supabase
        .from("crm_lead_state_per_user")
        .upsert(
          {
            lead_id: leadId,
            user_id: userId,
            pipeline_status: nextStatus as any,
            is_junk: nextStatus === "junk",
            last_touch_at: new Date().toISOString(),
          },
          { onConflict: "lead_id,user_id" }
        );

      if (error) {
        toast.error(`Status update failed: ${error.message}`);
        return;
      }

      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, state: { pipeline_status: nextStatus } } : l))
      );
    } catch (err: any) {
      toast.error(`Status update failed: ${err?.message || "Unknown error"}`);
    }
  };

  const handleWhatsApp = async (lead: Lead) => {
    if (!lead.phone_e164) {
      toast.error("No phone number available for this lead");
      return;
    }
    const phone = lead.phone_e164.replace("+", "");
    // Use direct location.href for reliable WhatsApp redirect
    window.location.href = `https://wa.me/${phone}`;
  };

  const handleCall = (lead: Lead) => {
    if (!lead.phone_e164) {
      toast.error("No phone number available for this lead");
      return;
    }
    // Use direct location.href for reliable phone redirect (shows native call options)
    window.location.href = `tel:${lead.phone_e164}`;
  };

  const handleEmail = (lead: Lead) => {
    if (!lead.email_lower) {
      toast.error("No email available for this lead");
      return;
    }
    // Open mailbox with signature - use location.href for reliable redirect
    const subject = encodeURIComponent("Follow-up from JBJ Global Real Estate");
    const signature = `

Best regards,

JBJ Global Real Estate
Your Trusted Partner in UAE Property

📞 +971 XX XXX XXXX
✉️ Contact@JBJ.ae
🌐 www.jbj.ae

━━━━━━━━━━━━━━━━━━━━━━
JBJ Global Real Estate
Your Trusted Partner in UAE Property
━━━━━━━━━━━━━━━━━━━━━━`;
    const body = encodeURIComponent(`Dear ${lead.full_name || "Valued Client"},

Thank you for your interest in JBJ Global Real Estate. I wanted to personally follow up regarding your property inquiry.

${signature}`);
    // Use direct location.href for reliable mail client redirect
    window.location.href = `mailto:${lead.email_lower}?subject=${subject}&body=${body}`;
  };

  const openDeleteDialog = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!leadToDelete) return;

    const { error } = await supabase.rpc("crm_hard_delete_leads", {
      p_lead_ids: [leadToDelete.id],
    });

    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }

    toast.success("Lead moved to deleted");
    setDeleteDialogOpen(false);
    setLeadToDelete(null);
    await fetchLeads();
    onRefresh();
  };

  const allVisibleSelected = leads.length > 0 && selected.size === leads.length;

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter((l) => {
      return (
        l.full_name?.toLowerCase().includes(q) ||
        l.phone_e164?.includes(search) ||
        l.email_lower?.toLowerCase().includes(q)
      );
    });
  }, [leads, search]);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const formatSourceLabel = (raw: string): string => {
    if (raw.startsWith("document_download_brochure")) return "Brochure Download";
    if (raw.startsWith("document_download")) return "Document Download";
    const map: Record<string, string> = {
      newsletter: "Newsletter",
      ai_chat_support: "AI Chat",
      market_report_download: "Market Report",
      register_interest: "Register Interest",
      matchmaker: "Matchmaker",
      contact_form: "Contact Form",
      ai_phone: "AI Phone",
      referral: "Referral",
      broker: "Broker",
      manual: "Manual Entry",
      website: "Website",
    };
    return map[raw] || raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  const renderSource = (lead: Lead) => {
    // Use the specific `source` field first for accurate labelling
    if ((lead as any).source) {
      return formatSourceLabel((lead as any).source);
    }
    if (lead.lead_source_type === "manual" || (!lead.lead_source_type && !lead.crm_lead_sources)) {
      return "Manual Entry";
    }
    if (lead.lead_source_type === "website") return "Website";
    const s = lead.crm_lead_sources;
    if (s?.source_group || s?.source_name) {
      return `${s.source_group || "Import"} · ${s.source_name || ""}`.trim();
    }
    return lead.lead_source_type || "Manual Entry";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email…"
            className="bg-card border-border"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelected(new Set());
              setSearch("");
              navigate(0);
            }}
            className="font-semibold"
          >
            Reset
          </Button>
        </div>
      </div>

      <CRMLeadsBulkBar
        userId={userId}
        isOwner={isOwner}
        selectedIds={selectedIds}
        onClear={() => setSelected(new Set())}
        onSuccess={() => {
          fetchLeads();
          onRefresh();
        }}
      />

      <div className="w-full overflow-x-auto rounded-lg border border-border bg-card">
        <Table className="min-w-[1300px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelected(new Set(leads.map((l) => l.id)));
                    } else {
                      setSelected(new Set());
                    }
                  }}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[140px]">Phone</TableHead>
              <TableHead className="min-w-[200px]">Email</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="w-[160px]">Status</TableHead>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead className="w-20">VIP</TableHead>
              <TableHead>Assigned Broker</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                  Loading leads…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((lead) => {
                const isSelected = selected.has(lead.id);
                const vip = (lead as any).vip === true;
                const status = lead.state?.pipeline_status || "new";

                return (
                  <TableRow key={lead.id} data-state={isSelected ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (checked) next.add(lead.id);
                            else next.delete(lead.id);
                            return next;
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-foreground whitespace-nowrap">{lead.full_name || "—"}</TableCell>
                    <TableCell className="font-mono text-sm text-foreground whitespace-nowrap">{lead.phone_e164 || "—"}</TableCell>
                    <TableCell>
                      {lead.email_lower ? (
                        <button
                          onClick={() => handleEmail(lead)}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium break-all text-left"
                          title="Click to send email"
                        >
                          {lead.email_lower}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-foreground whitespace-nowrap">{renderSource(lead)}</TableCell>
                    <TableCell>
                      <select
                        value={status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="h-8 w-full min-w-[140px] max-w-[160px] rounded-full border px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
                        style={{
                          backgroundColor: groupedStatuses.positive.some(s => s.value === status) 
                            ? 'rgba(34, 197, 94, 0.15)' 
                            : groupedStatuses.neutral.some(s => s.value === status) 
                              ? 'rgba(245, 158, 11, 0.15)' 
                              : 'rgba(239, 68, 68, 0.15)',
                          color: groupedStatuses.positive.some(s => s.value === status) 
                            ? '#16a34a' 
                            : groupedStatuses.neutral.some(s => s.value === status) 
                              ? '#d97706' 
                              : '#dc2626',
                          borderColor: groupedStatuses.positive.some(s => s.value === status) 
                            ? 'rgba(34, 197, 94, 0.4)' 
                            : groupedStatuses.neutral.some(s => s.value === status) 
                              ? 'rgba(245, 158, 11, 0.4)' 
                              : 'rgba(239, 68, 68, 0.4)',
                        }}
                      >
                        <optgroup label="🟢 POSITIVE">
                          {groupedStatuses.positive.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="🟡 NEUTRAL">
                          {groupedStatuses.neutral.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="🔴 NEGATIVE">
                          {groupedStatuses.negative.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDisplayDate(lead.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant={vip ? "default" : "outline"}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleVIP(lead.id, vip);
                        }}
                        className={`min-w-[60px] ${vip ? "bg-gold text-black hover:bg-gold/90" : "border-border text-muted-foreground hover:bg-muted"}`}
                      >
                        {vip ? "★ VIP" : "—"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        {assignedNames[lead.id] ? (
                          <span className="font-semibold text-foreground whitespace-nowrap">{assignedNames[lead.id]}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                        {isOwner && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs bg-gold/10 border-gold/30 text-gold hover:bg-gold/20 hover:text-gold whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignLeadIds([lead.id]);
                              setShowAssignModal(true);
                            }}
                            title="Assign broker"
                          >
                            Assign
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          size="icon"
                          className="h-9 w-9 bg-green-600 hover:bg-green-700 text-white border-0"
                          onClick={() => handleWhatsApp(lead)}
                          title="WhatsApp"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white border-0"
                          onClick={() => handleCall(lead)}
                          title="Call"
                        >
                          <PhoneCall className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          className="h-9 w-9 bg-purple-600 hover:bg-purple-700 text-white border-0"
                          onClick={() => handleEmail(lead)}
                          title="Email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="h-9 w-9"
                          onClick={() => openDeleteDialog(lead)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Lead Assign Modal */}
      <LeadAssignModal
        open={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setAssignLeadIds([]);
        }}
        leadIds={assignLeadIds}
        currentUserId={userId}
        onSuccess={() => {
          fetchLeads();
          onRefresh();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteLeadDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        leadName={leadToDelete?.full_name || "this lead"}
        onConfirm={handleDelete}
      />
    </div>
  );
}
