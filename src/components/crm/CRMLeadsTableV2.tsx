import { useEffect, useMemo, useState } from "react";
import { formatDisplayDate } from "@/utils/formatDate";
// useNavigate no longer needed after filter refactor
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
import { FileSignature, Mail, MessageSquare, PhoneCall, Trash2, Flame, Star, CheckCircle2, XCircle, Clock, Ban } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PIPELINE_STATUSES, STATUS_GROUPS } from "./LeadStatusBadge";
import InlineStatusSelect from "./InlineStatusSelect";
import CRMLeadsBulkBar from "./CRMLeadsBulkBar";
import LeadAssignModal from "./LeadAssignModal";
import DeleteLeadDialog from "./DeleteLeadDialog";
import SendAgreementDialog from "./SendAgreementDialog";
import { isRealCRMLead } from "@/utils/crmFakeDataGuard";

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

export default function CRMLeadsTableV2({
  userId,
  filterType,
  onRefresh,
  statusFilters = [],
  sourceFilter,
  isOwner = false,
}: CRMLeadsTableV2Props) {
  // navigate removed; reset clears state in-place

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignedNames, setAssignedNames] = useState<Record<string, string>>({});
  const [leadAssignees, setLeadAssignees] = useState<Record<string, string>>({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLeadIds, setAssignLeadIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [agreementLead, setAgreementLead] = useState<Lead | null>(null);

  // Inline filter dropdowns: Stage / Source / Assignee / Tag
  const [stageFilter, setStageFilter] = useState<string>("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>(""); // "vip" | "unassigned" | ""

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
  }, [userId, filterType, JSON.stringify(statusFilters), sourceFilter]);

  const applySourceFilter = (rows: Lead[]): Lead[] => {
    if (!sourceFilter) return rows;
    if (sourceFilter === "website") return rows.filter((l) => l.lead_source_type === "website");
    if (sourceFilter === "imported") return rows.filter((l) => l.lead_source_type !== "website");
    if (sourceFilter.startsWith("source:")) {
      const id = sourceFilter.replace("source:", "");
      return rows.filter((l) => l.source_id === id);
    }
    return rows.filter((l) => l.lead_source_type === sourceFilter);
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = supabase.from("crm_leads").select(
        `*,
         crm_lead_sources (source_group, source_name)`
      ).is('deleted_at', null);

      if (filterType === "own") {
        query = query.eq("owner_type", "broker_owned").eq("owner_user_id", userId);
      } else if (filterType === "website") {
        query = query.eq("lead_source_type", "website");
      }

      const { data: leadsData, error: leadsError } = await query.order("created_at", { ascending: false });
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

      let rows: Lead[] = (leadsData || [])
        .filter(isRealCRMLead as (l: any) => boolean)
        .map((l: any) => ({
          ...l,
          state: statesMap.get(l.id) || null,
        }));

      if (statusFilters.length > 0) {
        rows = rows.filter((l) => statusFilters.includes(l.state?.pipeline_status || "new"));
      }
      if (filterType === "vip") {
        rows = rows.filter((l) => (l as any).vip === true);
      }
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

      const { data: assignmentRows } = await supabase
        .from("crm_lead_assignments")
        .select("lead_id, assigned_to_user_id")
        .in("lead_id", rows.map((r) => r.id))
        .is("unassigned_at", null);

      const aRows = (assignmentRows || []) as unknown as AssignmentRow[];
      const leadToAssignee = new Map<string, string>();
      aRows.forEach((a) => leadToAssignee.set(a.lead_id, a.assigned_to_user_id));
      setLeadAssignees(Object.fromEntries(leadToAssignee.entries()));

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

      setSelected((prev) => {
        const visible = new Set(rows.map((r) => r.id));
        const next = new Set<string>();
        prev.forEach((id) => { if (visible.has(id)) next.add(id); });
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
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, vip: !currentVIP } : l));
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
        setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, vip: currentVIP } : l));
        toast.error(`VIP update failed: ${error.message}`);
        return;
      }
      toast.success(currentVIP ? "VIP removed" : "VIP added");
    } catch (err: any) {
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, vip: currentVIP } : l));
      toast.error(`VIP update failed: ${err?.message || "Unknown error"}`);
    }
  };

  const handleStatusChange = async (leadId: string, nextStatus: string) => {
    try {
      const { error } = await supabase
        .from("crm_lead_state_per_user")
        .upsert({
          lead_id: leadId,
          user_id: userId,
          pipeline_status: nextStatus as any,
          is_junk: nextStatus === "junk",
          last_touch_at: new Date().toISOString(),
        }, { onConflict: "lead_id,user_id" });

      if (error) {
        toast.error(`Status update failed: ${error.message}`);
        return;
      }
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, state: { pipeline_status: nextStatus } } : l)));
    } catch (err: any) {
      toast.error(`Status update failed: ${err?.message || "Unknown error"}`);
    }
  };

  const handleWhatsApp = async (lead: Lead) => {
    const phone = lead.phone_e164 || (lead as any).phone;
    if (!phone) { toast.error("No phone number available"); return; }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleCall = (lead: Lead) => {
    const phone = lead.phone_e164 || (lead as any).phone;
    if (!phone) { toast.error("No phone number available"); return; }
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (lead: Lead) => {
    const email = lead.email_lower || (lead as any).email;
    if (!email) { toast.error("No email available"); return; }
    const subject = encodeURIComponent("Follow-up from JBJ Global Real Estate");
    const body = encodeURIComponent(`Dear ${lead.full_name || "Valued Client"},\n\nThank you for your interest in JBJ Global Real Estate.\n\nBest regards,\nJBJ Global Real Estate`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const openDeleteDialog = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!leadToDelete) return;
    try {
      // Soft delete instead of hard delete
      const { error } = await supabase.rpc("crm_soft_delete_leads", {
        p_lead_ids: [leadToDelete.id],
      });
      if (error) {
        toast.error(`Delete failed: ${error.message}`);
        return;
      }
      toast.success("Lead moved to Recently Deleted");
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
      await fetchLeads();
      onRefresh();
    } catch (err: any) {
      toast.error(`Delete failed: ${err?.message || "Unknown error"}`);
    }
  };

  const allVisibleSelected = leads.length > 0 && selected.size === leads.length;

  const sourceTypeOptions = useMemo(() => {
    const types = new Set<string>();
    leads.forEach((l) => { if (l.lead_source_type) types.add(l.lead_source_type); });
    return Array.from(types).sort();
  }, [leads]);

  const assigneeOptions = useMemo(() => {
    const ids = new Set<string>();
    Object.values(leadAssignees).forEach((id) => { if (id) ids.add(id); });
    return Array.from(ids).map((id) => ({ id, name: assignedNames[id] || id.slice(0, 8) }));
  }, [leadAssignees, assignedNames]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (q) {
        const hit =
          l.full_name?.toLowerCase().includes(q) ||
          l.phone_e164?.includes(search) ||
          l.email_lower?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (stageFilter && (l.state?.pipeline_status || "new") !== stageFilter) return false;
      if (sourceTypeFilter && (l.lead_source_type || "") !== sourceTypeFilter) return false;
      if (assigneeFilter) {
        if (assigneeFilter === "__unassigned__") {
          if (leadAssignees[l.id]) return false;
        } else if (leadAssignees[l.id] !== assigneeFilter) {
          return false;
        }
      }
      if (tagFilter === "vip" && (l as any).vip !== true) return false;
      if (tagFilter === "unassigned" && leadAssignees[l.id]) return false;
      return true;
    });
  }, [leads, search, stageFilter, sourceTypeFilter, assigneeFilter, tagFilter, leadAssignees]);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const formatSourceLabel = (raw: string): string => {
    if (raw.startsWith("document_download_brochure")) return "Brochure Download";
    if (raw.startsWith("document_download")) return "Document Download";
    const map: Record<string, string> = {
      newsletter: "Newsletter", ai_chat_support: "AI Chat", market_report_download: "Market Report",
      register_interest: "Register Interest", matchmaker: "Matchmaker", contact_form: "Contact Form",
      ai_phone: "AI Phone", referral: "Referral", broker: "Broker", manual: "Manual Entry", website: "Website",
      self_registration: "Account Registration", mode_selection: "Account Registration",
      market_report: "Market Report", homepage: "Homepage", "property-evaluation": "Property Evaluation",
    };
    return map[raw] || raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  const renderSource = (lead: Lead) => {
    if ((lead as any).source) return formatSourceLabel((lead as any).source);
    if (lead.lead_source_type === "manual" || (!lead.lead_source_type && !lead.crm_lead_sources)) return "Manual Entry";
    if (lead.lead_source_type === "website") return "Website";
    const s = lead.crm_lead_sources;
    if (s?.source_group || s?.source_name) return `${s.source_group || "Import"} · ${s.source_name || ""}`.trim();
    return lead.lead_source_type || "Manual Entry";
  };

  // Quick filter chips for one-click status filtering
  const quickChips: { key: string; label: string; icon: typeof Flame; stage?: string; tag?: string }[] = [
    { key: "hot", label: "Hot", icon: Flame, stage: "negotiation" },
    { key: "interested", label: "Interested", icon: CheckCircle2, stage: "interested" },
    { key: "vip", label: "VIP", icon: Star, tag: "vip" },
    { key: "already_bought", label: "Already Bought", icon: CheckCircle2, stage: "already_bought" },
    { key: "closed_won", label: "Deal Closed", icon: CheckCircle2, stage: "closed_won" },
    { key: "no_answer", label: "No Response", icon: Clock, stage: "no_answer" },
    { key: "junk", label: "Junk", icon: Ban, stage: "junk" },
    { key: "closed_lost", label: "Lost", icon: XCircle, stage: "closed_lost" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter card — champagne-themed, no native dropdowns */}
      <div className="rounded-xl border border-gold/30 bg-[#F7F2EA] p-4 space-y-3">
        {/* Quick chips strip */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/60 mr-1">Quick:</span>
          {quickChips.map((c) => {
            const active =
              (c.stage && stageFilter === c.stage) || (c.tag && tagFilter === c.tag);
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => {
                  if (c.stage) setStageFilter(active ? "" : c.stage);
                  if (c.tag) setTagFilter(active ? "" : c.tag);
                }}
                className={
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition-colors " +
                  (active
                    ? "bg-[#EFE6D6] text-[#1A1A1A] border-gold"
                    : "bg-[#FDFBF7] text-[#1A1A1A]/80 border-gold/30 hover:bg-[#EFE6D6]")
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Search row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email…"
              className="h-10 bg-[#FDFBF7] border border-gold/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus-visible:ring-1 focus-visible:ring-gold focus-visible:border-gold"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelected(new Set());
              setSearch("");
              setStageFilter("");
              setSourceTypeFilter("");
              setAssigneeFilter("");
              setTagFilter("");
            }}
            className="h-10 font-semibold border-gold/30 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6]"
          >
            Clear filters
          </Button>
        </div>

        {/* Dropdown row — shadcn Select, evenly spaced, no overlap */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select value={stageFilter || "__all__"} onValueChange={(v) => setStageFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10 bg-[#FDFBF7] border border-gold/30 text-[#1A1A1A] font-semibold">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent className="bg-[#FDFBF7] border border-gold/30 max-h-[360px]">
              <SelectItem value="__all__">All Stages</SelectItem>
              <SelectGroup>
                <SelectLabel className="text-emerald-700 font-bold">Positive</SelectLabel>
                {groupedStatuses.positive.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-blue-700 font-bold">Neutral</SelectLabel>
                {groupedStatuses.neutral.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-red-700 font-bold">Negative</SelectLabel>
                {groupedStatuses.negative.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={sourceTypeFilter || "__all__"} onValueChange={(v) => setSourceTypeFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10 bg-[#FDFBF7] border border-gold/30 text-[#1A1A1A] font-semibold">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent className="bg-[#FDFBF7] border border-gold/30 max-h-[360px]">
              <SelectItem value="__all__">All Sources</SelectItem>
              {sourceTypeOptions.map((t) => (
                <SelectItem key={t} value={t}>{formatSourceLabel(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assigneeFilter || "__all__"} onValueChange={(v) => setAssigneeFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10 bg-[#FDFBF7] border border-gold/30 text-[#1A1A1A] font-semibold">
              <SelectValue placeholder="All Owners" />
            </SelectTrigger>
            <SelectContent className="bg-[#FDFBF7] border border-gold/30 max-h-[360px]">
              <SelectItem value="__all__">All Owners</SelectItem>
              <SelectItem value="__unassigned__">Unassigned</SelectItem>
              {assigneeOptions.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tagFilter || "__all__"} onValueChange={(v) => setTagFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10 bg-[#FDFBF7] border border-gold/30 text-[#1A1A1A] font-semibold">
              <SelectValue placeholder="All Tags" />
            </SelectTrigger>
            <SelectContent className="bg-[#FDFBF7] border border-gold/30">
              <SelectItem value="__all__">All Tags</SelectItem>
              <SelectItem value="vip">★ VIP</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <CRMLeadsBulkBar
        userId={userId}
        isOwner={isOwner}
        selectedIds={selectedIds}
        onClear={() => setSelected(new Set())}
        onSuccess={() => { fetchLeads(); onRefresh(); }}
      />

      <div className="w-full overflow-x-auto rounded-lg border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
        <Table className="min-w-[1300px]">
          <TableHeader>
            <TableRow className="border-gold/20 hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => {
                    if (checked) setSelected(new Set(leads.map((l) => l.id)));
                    else setSelected(new Set());
                  }}
                />
              </TableHead>
              <TableHead className="text-[#1A1A1A]/70 font-bold">Name</TableHead>
              <TableHead className="w-[140px] text-[#1A1A1A]/70 font-bold">Phone</TableHead>
              <TableHead className="min-w-[200px] text-[#1A1A1A]/70 font-bold">Email</TableHead>
              <TableHead className="text-[#1A1A1A]/70 font-bold">Source</TableHead>
              <TableHead className="w-[160px] text-[#1A1A1A]/70 font-bold">Status</TableHead>
              <TableHead className="w-[100px] text-[#1A1A1A]/70 font-bold">Date</TableHead>
              <TableHead className="w-20 text-[#1A1A1A]/70 font-bold">VIP</TableHead>
              <TableHead className="text-[#1A1A1A]/70 font-bold">Assigned Broker</TableHead>
              <TableHead className="text-right text-[#1A1A1A]/70 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-[#1A1A1A]/50">
                  Loading leads…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-[#1A1A1A]/50">
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((lead) => {
                const isSelected = selected.has(lead.id);
                const vip = (lead as any).vip === true;
                const status = lead.state?.pipeline_status || "new";

                return (
                  <TableRow key={lead.id} data-state={isSelected ? "selected" : undefined} className="border-gold/20 hover:bg-gold/5">
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
                    <TableCell className="font-semibold text-[#1A1A1A] whitespace-nowrap">{lead.full_name || "—"}</TableCell>
                    <TableCell className="font-mono text-sm text-[#1A1A1A]/80 whitespace-nowrap">{lead.phone_e164 || "—"}</TableCell>
                    <TableCell>
                      {lead.email_lower ? (
                        <button
                          onClick={() => handleEmail(lead)}
                          className="text-sm text-[#1A1A1A] hover:text-[#1A1A1A] hover:underline decoration-[#B89555]/60 underline-offset-2 font-medium break-all text-left"
                          title="Click to send email"
                        >
                          {lead.email_lower}
                        </button>
                      ) : (
                        <span className="text-[#1A1A1A]/40">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[#1A1A1A]/80 whitespace-nowrap">{renderSource(lead)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <InlineStatusSelect
                        leadId={lead.id}
                        currentStatus={status}
                        onStatusChange={() => fetchLeads()}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-[#1A1A1A]/60 whitespace-nowrap">
                      {formatDisplayDate(lead.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant={vip ? "default" : "outline"}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleVIP(lead.id, vip); }}
                        className={`min-w-[60px] ${vip ? "bg-gold text-[#1A1A1A] hover:bg-gold/90" : "border-gold/30 text-[#1A1A1A]/60 hover:bg-gold/10"}`}
                      >
                        {vip ? "★ VIP" : "—"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        {assignedNames[lead.id] ? (
                          <span className="font-semibold text-[#1A1A1A] whitespace-nowrap">{assignedNames[lead.id]}</span>
                        ) : (
                          <span className="text-[#1A1A1A]/40 italic">Unassigned</span>
                        )}
                        {isOwner && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs bg-gold/10 border-gold/30 text-[#1A1A1A] hover:bg-gold/20 whitespace-nowrap"
                            onClick={(e) => { e.stopPropagation(); setAssignLeadIds([lead.id]); setShowAssignModal(true); }}
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
                          className="h-9 w-9 bg-[#B89555] hover:bg-[#A08047] text-white border-0"
                          onClick={() => setAgreementLead(lead)}
                          title="Send Agreement"
                        >
                          <FileSignature className="h-4 w-4" />
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

      <LeadAssignModal
        open={showAssignModal}
        onClose={() => { setShowAssignModal(false); setAssignLeadIds([]); }}
        leadIds={assignLeadIds}
        currentUserId={userId}
        onSuccess={() => { fetchLeads(); onRefresh(); }}
      />

      <DeleteLeadDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        leadName={leadToDelete?.full_name || "this lead"}
        onConfirm={handleDelete}
      />

      <SendAgreementDialog
        open={!!agreementLead}
        onClose={() => setAgreementLead(null)}
        lead={agreementLead}
      />
    </div>
  );
}
