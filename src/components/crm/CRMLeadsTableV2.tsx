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
import { FileSignature, Mail, MessageSquare, PhoneCall, Trash2, Flame, Star, CheckCircle2, XCircle, Clock, Ban, Crown, Shield, UserPlus } from "lucide-react";
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
import LeadAccessDialog from "./LeadAccessDialog";
import LogCallDialog from "@/components/broker-crm/LogCallDialog";
import { isRealCRMLead } from "@/utils/crmFakeDataGuard";
import LeadQuickActions from "./LeadQuickActions";
import { BrokerCombobox } from "./BrokerCombobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchableMultiSelect } from "@/components/ui/searchable-multiselect";

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
  const [accessLead, setAccessLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [agreementLead, setAgreementLead] = useState<Lead | null>(null);
  const [callLead, setCallLead] = useState<Lead | null>(null);
  const [savingCall, setSavingCall] = useState(false);

  // Inline filter dropdowns: Stage (multi) / Source / Assignee / Tag
  const [stageMulti, setStageMulti] = useState<string[]>([]);
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>(""); // "vip" | "unassigned" | "investor" | ""

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
      // Projection only — never `select *` on crm_leads (wide encrypted PII columns make it slow).
      // Hard cap at 500 rows; pagination UI can follow.
      let query = supabase.from("crm_leads").select(
        `id, full_name, email_lower, phone_e164, lead_source_type, source_id,
         vip, flagged, is_investor, contact_type, owner_type, owner_user_id,
         assigned_broker_id, assigned_to_user_id, pipeline_stage, created_at,
         crm_lead_sources (source_group, source_name)`
      ).is('deleted_at', null);

      if (filterType === "own") {
        query = query.eq("owner_type", "broker_owned").eq("owner_user_id", userId);
      } else if (filterType === "website") {
        query = query.eq("lead_source_type", "website");
      }

      const { data: leadsData, error: leadsError } = await query
        .order("created_at", { ascending: false })
        .limit(500);
      if (leadsError) throw leadsError;

      const leadIds = (leadsData || []).map((l: any) => l.id as string);
      if (leadIds.length === 0) {
        setLeads([]);
        setAssignedNames({});
        setSelected(new Set());
        return;
      }

      const [{ data: statesData }, { data: allAssignmentRows }] = await Promise.all([
        supabase
          .from("crm_lead_state_per_user")
          .select("lead_id,pipeline_status")
          .eq("user_id", userId)
          .in("lead_id", leadIds),
        supabase
          .from("crm_lead_assignments")
          .select("lead_id, assigned_to_user_id")
          .in("lead_id", leadIds)
          .is("unassigned_at", null),
      ]);

      const statesMap = new Map((statesData || []).map((s: any) => [s.lead_id, s]));

      // Owners must always see what's actually in the database — the
      // isRealCRMLead guard is for public/anonymous surfaces only. For
      // non-owner views we keep the guard so test/legacy/encrypted seed
      // rows never bleed through.
      const ownerView = isOwner === true;
      let rows: Lead[] = (leadsData || [])
        .filter((l: any) => (ownerView ? !l.deleted_at : isRealCRMLead(l)))
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

      const rowIds = new Set(rows.map((r) => r.id));
      const assignmentRows = (allAssignmentRows || []).filter((a: any) => rowIds.has(a.lead_id));

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
      const { error } = await supabase.from("crm_leads").update(updateData as any).eq("id", leadId);
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
    setCallLead(lead);
  };

  const saveCallLog = async (input: {
    leadId?: string | null;
    phoneNumber: string;
    callType: string;
    callStatus: string;
    durationSeconds: number;
    notes?: string | null;
  }) => {
    if (!userId) throw new Error("Please sign in");
    setSavingCall(true);
    try {
      const { data, error } = await supabase
        .from("broker_call_logs")
        .insert({
          user_id: userId,
          lead_id: input.leadId || null,
          phone_number: input.phoneNumber,
          call_type: input.callType,
          call_status: input.callStatus,
          duration_seconds: input.durationSeconds,
          notes: input.notes || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Call log saved");
      return { callLogId: data.id as string };
    } finally {
      setSavingCall(false);
    }
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
      if (stageMulti.length > 0 && !stageMulti.includes(l.state?.pipeline_status || "new")) return false;
      if (sourceTypeFilter && (l.lead_source_type || "") !== sourceTypeFilter) return false;
      if (assigneeFilter) {
        if (assigneeFilter === "__unassigned__") {
          if (leadAssignees[l.id]) return false;
        } else if (assigneeFilter === "__assigned__") {
          if (!leadAssignees[l.id]) return false;
        } else if (assigneeFilter === "__mine__") {
          if (leadAssignees[l.id] !== userId) return false;
        } else if (leadAssignees[l.id] !== assigneeFilter) {
          return false;
        }
      }
      if (tagFilter === "vip" && (l as any).vip !== true) return false;
      if (tagFilter === "unassigned" && leadAssignees[l.id]) return false;
      if (tagFilter === "investor" && (l as any).is_investor !== true) return false;
      return true;
    });
  }, [leads, search, stageMulti, sourceTypeFilter, assigneeFilter, tagFilter, leadAssignees, userId]);

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
      <div className="rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-4 space-y-3">
        {/* Quick chips strip */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/60 mr-1">Quick:</span>
          {quickChips.map((c) => {
            const active =
              (c.stage && stageMulti.length === 1 && stageMulti[0] === c.stage) || (c.tag && tagFilter === c.tag);
            const Icon = c.icon;
            return (
              <Button
                key={c.key}
                type="button"
                variant={active ? "primary" : "outline"}
                size="sm"
                onClick={() => {
                  if (c.stage) setStageMulti(active ? [] : [c.stage]);
                  if (c.tag) setTagFilter(active ? "" : c.tag);
                }}
                className="h-8 rounded-full px-3 text-xs"
              >
                <Icon className="h-3.5 w-3.5" />
                {c.label}
              </Button>
            );
          })}
        </div>

        {/* Search row */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
          <div className="flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email…"
              className="h-10 bg-[#FDFBF7] border border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus-visible:ring-1 focus-visible:ring-gold focus-visible:border-[#B89555]"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelected(new Set());
              setSearch("");
              setStageMulti([]);
              setSourceTypeFilter("");
              setAssigneeFilter("");
              setTagFilter("");
            }}
            className="h-10 font-semibold border-[#B89555]/30 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6]"
          >
            Clear filters
          </Button>
        </div>

        {/* Distribution counts strip */}
        {(() => {
          const total = leads.length;
          const mine = leads.filter((l) => leadAssignees[l.id] === userId).length;
          const pool = leads.filter((l) => !leadAssignees[l.id]).length;
          const assigned = total - pool;
          const perBroker = new Map<string, number>();
          leads.forEach((l) => {
            const a = leadAssignees[l.id];
            if (a) perBroker.set(a, (perBroker.get(a) || 0) + 1);
          });
          const topBrokers = Array.from(perBroker.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);
          return (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#1A1A1A]/80 border-t border-[#B89555]/20 pt-3">
              <span className="font-bold uppercase tracking-wider text-[#1A1A1A]/60">Distribution:</span>
              <span><b className="text-[#1A1A1A]">{total}</b> total</span>
              <span className="text-[#1A1A1A]/30">·</span>
              <span><b className="text-[#064E3B]">{mine}</b> with me</span>
              <span className="text-[#1A1A1A]/30">·</span>
              <span><b className="text-[#1A1A1A]">{assigned}</b> assigned</span>
              <span className="text-[#1A1A1A]/30">·</span>
              <span><b className="text-[#B89555]">{pool}</b> in pool</span>
              {topBrokers.length > 0 && (
                <>
                  <span className="text-[#1A1A1A]/30">|</span>
                  {topBrokers.map(([id, count]) => (
                    <Button
                      key={id}
                      type="button"
                      variant={assigneeFilter === id ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setAssigneeFilter(assigneeFilter === id ? "" : id)}
                      className="h-7 rounded-full px-3 text-[11px]"
                    >
                      {assignedNames[id] || id.slice(0, 6)} · <b>{count}</b>
                    </Button>
                  ))}
                </>
              )}
            </div>
          );
        })()}

        {/* Dropdown row — shadcn Select, evenly spaced, no overlap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <SearchableMultiSelect
            label="All Statuses"
            placeholder="Search statuses…"
            className="h-10 w-full justify-between"
            selected={stageMulti}
            onChange={setStageMulti}
            options={[
              ...groupedStatuses.positive.map((s) => ({
                value: s.value,
                label: s.label,
                dot: s.dotColor,
                group: "Positive",
                count: leads.filter((l) => (l.state?.pipeline_status || "new") === s.value).length,
              })),
              ...groupedStatuses.neutral.map((s) => ({
                value: s.value,
                label: s.label,
                dot: s.dotColor,
                group: "Neutral",
                count: leads.filter((l) => (l.state?.pipeline_status || "new") === s.value).length,
              })),
              ...groupedStatuses.negative.map((s) => ({
                value: s.value,
                label: s.label,
                dot: s.dotColor,
                group: "Negative",
                count: leads.filter((l) => (l.state?.pipeline_status || "new") === s.value).length,
              })),
            ]}
          />

          <Select value={sourceTypeFilter || "__all__"} onValueChange={(v) => setSourceTypeFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10 bg-[#FDFBF7] border border-[#B89555]/30 text-[#1A1A1A] font-semibold min-w-0">
              <SelectValue placeholder="All Sources" className="truncate" />
            </SelectTrigger>
            <SelectContent className="bg-[#FDFBF7] border border-[#B89555]/40 shadow-xl ring-1 ring-[#B89555]/10 max-h-[360px] min-w-[16rem] [&_[data-highlighted]]:bg-[#EFE6D6] [&_[data-highlighted]]:text-[#1A1A1A]">
              <SelectItem value="__all__">All Sources</SelectItem>
              {sourceTypeOptions.map((t) => {
                const count = leads.filter((l) => (l.lead_source_type || "") === t).length;
                return (
                  <SelectItem key={t} value={t}>
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#B89555]/70" aria-hidden />
                      {formatSourceLabel(t)}
                      <span className="text-[#1A1A1A]/50 text-[11px]">· {count}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select value={assigneeFilter || "__all__"} onValueChange={(v) => setAssigneeFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10 bg-[#FDFBF7] border border-[#B89555]/30 text-[#1A1A1A] font-semibold min-w-0">
              <SelectValue placeholder="All Owners" className="truncate" />
            </SelectTrigger>
            <SelectContent className="bg-[#FDFBF7] border border-[#B89555]/40 shadow-xl ring-1 ring-[#B89555]/10 max-h-[360px] min-w-[14rem] [&_[data-highlighted]]:bg-[#EFE6D6] [&_[data-highlighted]]:text-[#1A1A1A]">
              <SelectItem value="__all__">All Owners</SelectItem>
              <SelectItem value="__mine__">With Me</SelectItem>
              <SelectItem value="__assigned__">Assigned to a Broker</SelectItem>
              <SelectItem value="__unassigned__">Pool (no broker)</SelectItem>
              {assigneeOptions.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="text-[#1A1A1A]/70 font-bold bg-[#F7F2EA]">Brokers</SelectLabel>
                  {assigneeOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>

          <Select value={tagFilter || "__all__"} onValueChange={(v) => setTagFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-10 bg-[#FDFBF7] border border-[#B89555]/30 text-[#1A1A1A] font-semibold min-w-0">
              <SelectValue placeholder="All Tags" className="truncate" />
            </SelectTrigger>
            <SelectContent className="bg-[#FDFBF7] border border-[#B89555]/40 shadow-xl ring-1 ring-[#B89555]/10 [&_[data-highlighted]]:bg-[#EFE6D6] [&_[data-highlighted]]:text-[#1A1A1A]">
              <SelectItem value="__all__">All Tags</SelectItem>
              <SelectItem value="vip">★ VIP</SelectItem>
              <SelectItem value="unassigned">Pool (no broker)</SelectItem>
              <SelectItem value="investor">👑 Investor</SelectItem>
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

      <div data-crm-leads-responsive="true" className="w-full max-w-full overflow-hidden rounded-2xl border border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] [&_*]:[overflow-wrap:normal] [&_*]:[word-break:normal]">
        <Table className="w-full min-w-0 table-fixed [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap [&_th]:overflow-hidden [&_td]:overflow-hidden">
          <TableHeader>
            <TableRow className="border-[#B89555]/20 hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => {
                    if (checked) setSelected(new Set(leads.map((l) => l.id)));
                    else setSelected(new Set());
                  }}
                />
              </TableHead>
              <TableHead className="w-[180px] text-[#1A1A1A]/70 font-bold">Name</TableHead>
              <TableHead className="w-[120px] text-[#1A1A1A]/70 font-bold">Phone</TableHead>
              <TableHead className="w-[260px] text-[#1A1A1A]/70 font-bold">Email</TableHead>
              <TableHead className="w-[120px] text-[#1A1A1A]/70 font-bold">Source</TableHead>
              <TableHead className="w-[150px] text-[#1A1A1A]/70 font-bold">Status</TableHead>
              <TableHead className="w-[360px] text-right text-[#1A1A1A]/70 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Skeleton rows so the UI feels instant instead of a single "Loading…" line.
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`sk-${i}`} className="border-[#B89555]/20">
                  <TableCell colSpan={10} className="py-3">
                    <div className="h-4 w-full rounded bg-[#EFE6D6]/60 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-center">
                  {leads.length === 0 ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-[#1A1A1A] font-semibold text-base">No leads yet</div>
                      <div className="text-[#1A1A1A]/60 text-xs">Import a CSV, add a lead manually, or refresh.</div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => fetchLeads()} className="border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6]">Refresh</Button>
                        <Button size="sm" variant="outline" onClick={() => (window.location.href = "/owner/crm/import")} className="border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6]">Import CSV</Button>
                        <Button size="sm" variant="primary" onClick={() => (window.location.href = "/owner/crm/leads/new")}>Add lead</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-[#1A1A1A]/70 text-sm">No leads match your filters.</div>
                      <div className="text-[#1A1A1A]/50 text-xs">{leads.length} lead{leads.length === 1 ? "" : "s"} hidden by filters.</div>
                      <Button size="sm" variant="outline" onClick={() => { setSearch(""); setStageMulti([]); setSourceTypeFilter(""); setAssigneeFilter(""); setTagFilter(""); }} className="border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6] mt-1">Clear filters</Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((lead) => {
                const isSelected = selected.has(lead.id);
                const vip = (lead as any).vip === true;
                const status = lead.state?.pipeline_status || "new";

                return (
                  <TableRow key={lead.id} data-state={isSelected ? "selected" : undefined} className="border-[#B89555]/20 hover:bg-[#EFE6D6]/5">
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
                    <TableCell className={`font-semibold text-[#1A1A1A] whitespace-nowrap min-w-0 ${(lead as any).is_investor ? "border-l-2 border-[#B89555]" : ""}`}>
                      <span className="inline-flex items-center gap-1.5 max-w-full min-w-0">
                        {(lead as any).is_investor && (
                          <span
                            title="Investor"
                            className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#EFE6D6] border border-[#B89555] text-[#B89555] shadow-[0_0_0_2px_rgba(184,149,85,0.18)]"
                          >
                            <Crown className="h-3 w-3 fill-[#B89555]" />
                          </span>
                        )}
                        <a
                          href={`/owner/crm/leads/${lead.id}`}
                          onClick={(e) => e.stopPropagation()}
                            className="block max-w-[170px] truncate hover:underline decoration-[#B89555] underline-offset-2"
                          title="Open lead in CRM"
                        >
                          {lead.full_name || "—"}
                        </a>
                        {(lead as any).is_investor && (
                          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wide bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]">
                            Investor
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-[#1A1A1A]/80 whitespace-nowrap">{lead.phone_e164 || "—"}</TableCell>
                    <TableCell className="w-[290px] min-w-0">
                      {lead.email_lower ? (
                        <Button
                          onClick={() => handleEmail(lead)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-full min-w-0 justify-start rounded-full border-[#B89555]/25 bg-[#FDFBF7] px-3 text-sm font-medium text-[#1A1A1A] overflow-hidden"
                          title={lead.email_lower}
                        >
                          <span className="block min-w-0 max-w-full truncate text-left">{lead.email_lower}</span>
                        </Button>
                      ) : (
                        <span className="text-[#1A1A1A]/40">—</span>
                      )}
                    </TableCell>
                    <TableCell className="w-[190px] text-sm text-[#1A1A1A]/80 min-w-0 leading-snug">
                      <span className="jj-emerald-metallic allow-white inline-flex max-w-full items-center px-2 py-1 rounded-md border-0 text-white text-xs font-semibold truncate [&_*]:!text-white">
                        {renderSource(lead)}
                      </span>
                    </TableCell>
                    <TableCell className="w-[150px] px-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <InlineStatusSelect
                        leadId={lead.id}
                        currentStatus={status}
                        onStatusChange={() => fetchLeads()}
                      />
                    </TableCell>
                    <TableCell className="w-[92px] text-right">
                      <div className="inline-flex items-center justify-end gap-1 whitespace-nowrap max-w-full overflow-hidden">
                        <Button
                          type="button"
                          size="icon"
                          variant={vip ? "default" : "outline"}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleVIP(lead.id, vip); }}
                          className="h-8 w-8 min-w-8 rounded-full"
                          title={vip ? "Unmark VIP" : "Mark VIP"}
                        >
                          <Star className={vip ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5"} />
                        </Button>
                        {isOwner && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button type="button" size="icon" variant="outline" className="h-8 w-8 min-w-8 rounded-full" onClick={(e) => e.stopPropagation()} title="Assign broker">
                                <UserPlus className="h-3.5 w-3.5" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-72 p-3 bg-[#FDFBF7] border border-[#B89555]/35 shadow-lg"
                              align="end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <BrokerCombobox
                                value={assignedNames[lead.id] || ""}
                                brokerId={(lead as any).assigned_broker_id ?? null}
                                label="Assign to broker"
                                onChange={async ({ brokerId, value }) => {
                                  try {
                                    const { error } = await supabase
                                      .from("crm_leads")
                                      .update({ assigned_broker_id: brokerId })
                                      .eq("id", lead.id);
                                    if (error) throw error;
                                    toast.success(brokerId ? `Assigned to ${value}` : "Saved as free text");
                                    fetchLeads();
                                  } catch (err: any) {
                                    toast.error(err?.message || "Failed to assign broker");
                                  }
                                }}
                              />
                              <div className="mt-2 pt-2 border-t border-[#B89555]/20">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-full justify-start rounded-full text-xs"
                                  onClick={() => { setAssignLeadIds([lead.id]); setShowAssignModal(true); }}
                                >
                                  Open full assign modal →
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden">
                        <div className="sr-only"><LeadQuickActions leadId={lead.id} leadName={lead.full_name} leadPhone={lead.phone_e164} leadEmail={lead.email_lower} userId={userId} /></div>
                        <div className="hidden">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleWhatsApp(lead)}
                            title="WhatsApp"
                            aria-label="WhatsApp"
                            className="h-9 w-9 rounded-none border-0 bg-transparent shadow-none"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleCall(lead)}
                            title="Call"
                            aria-label="Call"
                            className="h-9 w-9 rounded-none border-0 bg-transparent shadow-none"
                          >
                            <PhoneCall className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleEmail(lead)}
                            title="Email"
                            aria-label="Email"
                            className="h-9 w-9 rounded-none border-0 bg-transparent shadow-none"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setAgreementLead(lead)}
                            title="Send Agreement"
                            aria-label="Send Agreement"
                            className="h-9 w-9 rounded-none border-0 bg-transparent shadow-none"
                          >
                            <FileSignature className="h-4 w-4" />
                          </Button>
                          {isOwner && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setAccessLead(lead)}
                              title="Manage broker access"
                              aria-label="Manage broker access"
                              className="h-9 w-9 rounded-none border-0 bg-transparent shadow-none"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(lead)}
                            title="Delete"
                            aria-label="Delete"
                            className="h-9 w-9 rounded-none border-0 bg-transparent shadow-none"
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

      <LeadAccessDialog
        open={!!accessLead}
        onOpenChange={(o) => { if (!o) setAccessLead(null); }}
        leadId={accessLead?.id || ""}
        leadName={accessLead?.full_name}
      />
      <LogCallDialog
        open={!!callLead}
        onOpenChange={(o) => { if (!o) setCallLead(null); }}
        leads={leads as any}
        userId={userId}
        initialLeadId={callLead?.id || null}
        submitting={savingCall}
        onSubmit={saveCallLog}
        onSaved={() => { fetchLeads(); onRefresh(); }}
      />
    </div>
  );
}
