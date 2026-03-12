import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

export interface Lead {
  id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  source: string | null;
  pipeline_stage: string;
  created_at: string;
  updated_at: string;
  last_activity?: string | null;
  tags: string[] | null;
  deleted_at?: string | null;
}

export const PAGE_SIZE = 25;

export const SOURCE_OPTIONS = [
  { value: "all", label: "All Sources" },
  { value: "website", label: "Website" },
  { value: "import", label: "Database Import" },
  { value: "broker", label: "Broker" },
  { value: "referral", label: "Referral" },
  { value: "campaign", label: "Campaign" },
  { value: "manual", label: "Manual Entry" },
  { value: "third_party", label: "Third-party Platform" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "social", label: "Social Media" },
];

export default function useCRMLeadsInbox() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [sourceFilter, setSourceFilter] = useState(searchParams.get("source") || "all");
  const [dateStart, setDateStart] = useState(searchParams.get("date_start") || "");
  const [dateEnd, setDateEnd] = useState(searchParams.get("date_end") || "");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [activeView, setActiveView] = useState<"active" | "deleted">("active");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (dateStart) params.set("date_start", dateStart);
    if (dateEnd) params.set("date_end", dateEnd);
    setSearchParams(params, { replace: true });
  }, [search, statusFilter, sourceFilter, dateStart, dateEnd, setSearchParams]);

  const { data: leadsData, isLoading, isFetching } = useQuery({
    queryKey: ["crm-leads-inbox", debouncedSearch, statusFilter, sourceFilter, dateStart, dateEnd, page, activeView],
    queryFn: async () => {
      const selectFields = "id, full_name, email_lower, phone_e164, source, pipeline_stage, created_at, updated_at, tags, deleted_at";
      let query = supabase.from("crm_leads").select(selectFields, { count: "exact" });

      if (activeView === "deleted") {
        query = query.not("deleted_at", "is", null);
      } else {
        query = query.is("deleted_at", null);
      }

      if (debouncedSearch) {
        query = query.or(`full_name.ilike.%${debouncedSearch}%,email_lower.ilike.%${debouncedSearch}%,phone_e164.ilike.%${debouncedSearch}%`);
      }
      if (statusFilter !== "all") query = query.eq("pipeline_stage", statusFilter);
      if (sourceFilter !== "all") query = query.ilike("source", `%${sourceFilter}%`);
      if (dateStart) query = query.gte("created_at", new Date(dateStart + "T00:00:00").toISOString());
      if (dateEnd) query = query.lte("created_at", new Date(dateEnd + "T23:59:59.999").toISOString());

      const from = (page - 1) * PAGE_SIZE;
      query = query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await query;
      if (error) throw error;
      return { leads: data || [], total: count || 0 };
    },
    enabled: !!user,
  });

  const leads = (leadsData?.leads || []) as Lead[];
  const totalLeads = leadsData?.total || 0;
  const totalPages = Math.ceil(totalLeads / PAGE_SIZE);
  const hasActiveFilters = !!(search || statusFilter !== "all" || sourceFilter !== "all" || dateStart || dateEnd);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSourceFilter("all");
    setDateStart("");
    setDateEnd("");
    setPage(1);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["crm-leads-inbox"] });
    toast.success("Refreshed");
  };

  const handleExport = async () => {
    try {
      let query = supabase
        .from("crm_leads")
        .select("full_name, email_lower, phone_e164, source, pipeline_stage, created_at, updated_at, tags")
        .is("deleted_at", null);

      if (debouncedSearch) query = query.or(`full_name.ilike.%${debouncedSearch}%,email_lower.ilike.%${debouncedSearch}%,phone_e164.ilike.%${debouncedSearch}%`);
      if (statusFilter !== "all") query = query.eq("pipeline_stage", statusFilter);
      if (sourceFilter !== "all") query = query.ilike("source", `%${sourceFilter}%`);
      if (dateStart) query = query.gte("created_at", new Date(dateStart + "T00:00:00").toISOString());
      if (dateEnd) query = query.lte("created_at", new Date(dateEnd + "T23:59:59.999").toISOString());

      const { data } = await query.order("created_at", { ascending: false });
      if (!data || data.length === 0) { toast.error("No leads to export"); return; }

      const headers = ["Name", "Email", "Phone", "Source", "Status", "Created", "Last Activity", "Tags"];
      const csvRows = [
        headers.join(","),
        ...data.map((lead) =>
          [
            `"${(lead.full_name || "").replace(/"/g, '""')}"`,
            lead.email_lower || "",
            lead.phone_e164 || "",
            lead.source || "",
            lead.pipeline_stage || "",
            lead.created_at ? format(new Date(lead.created_at), "yyyy-MM-dd") : "",
            lead.updated_at ? format(new Date(lead.updated_at), "yyyy-MM-dd") : "",
            `"${(lead.tags || []).join(", ")}"`,
          ].join(",")
        ),
      ];

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.length} leads`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export");
    }
  };

  const openWhatsApp = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://wa.me/${phone.replace("+", "")}`, "_blank");
  };

  const openCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const openEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `mailto:${email}`;
  };

  const handleSoftDelete = async () => {
    if (!leadToDelete) return;
    try {
      const { error } = await supabase.rpc("crm_soft_delete_leads", { p_lead_ids: [leadToDelete.id] });
      if (error) throw error;
      toast.success("Lead moved to Recently Deleted");
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["crm-leads-inbox"] });
    } catch (err: any) {
      toast.error(`Delete failed: ${err?.message || "Unknown error"}`);
    }
  };

  const handleRestore = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.rpc("crm_restore_leads", { p_lead_ids: [leadId] });
      if (error) throw error;
      toast.success("Lead restored");
      queryClient.invalidateQueries({ queryKey: ["crm-leads-inbox"] });
    } catch (err: any) {
      toast.error(`Restore failed: ${err?.message || "Unknown error"}`);
    }
  };

  const handlePermanentDelete = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.rpc("crm_hard_delete_leads", { p_lead_ids: [leadId] });
      if (error) throw error;
      toast.success("Lead permanently deleted");
      queryClient.invalidateQueries({ queryKey: ["crm-leads-inbox"] });
    } catch (err: any) {
      toast.error(`Delete failed: ${err?.message || "Unknown error"}`);
    }
  };

  const getLastActivity = (lead: Lead): string => {
    const activityDate = lead.last_activity || lead.updated_at;
    if (!activityDate) return "—";
    return formatDistanceToNow(new Date(activityDate), { addSuffix: true });
  };

  return {
    // State
    search, statusFilter, sourceFilter, dateStart, dateEnd, page,
    activeView, deleteDialogOpen, leadToDelete,
    leads, totalLeads, totalPages, isLoading, isFetching, hasActiveFilters,
    // Setters
    setSearch, setStatusFilter, setSourceFilter, setDateStart, setDateEnd,
    setPage, setActiveView, setDeleteDialogOpen, setLeadToDelete,
    // Actions
    clearFilters, handleRefresh, handleExport,
    openWhatsApp, openCall, openEmail,
    handleSoftDelete, handleRestore, handlePermanentDelete,
    getLastActivity, navigate,
  };
}
