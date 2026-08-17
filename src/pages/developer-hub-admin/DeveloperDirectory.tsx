import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, ExternalLink, Zap, CheckSquare, Square, ShieldCheck, Download, FileSpreadsheet, LayoutGrid, Table2, Building2, Plus, CalendarDays, UserPlus, Upload, ChevronDown, MoreHorizontal, ClipboardList, Handshake, PhoneCall, StickyNote, Video, ListChecks } from "lucide-react";
import { DeveloperVisibilitySheet } from "./DeveloperVisibilitySheet";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import DeveloperExcelImportDialog from "@/components/owner/DeveloperExcelImportDialog";
import RegistrationStatusBadge from "@/components/developers-portal/RegistrationStatusBadge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import DeveloperOwnerCampaignDashboard from "@/components/crm/DeveloperOwnerCampaignDashboard";

interface Row {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  last_enriched_at: string | null;
  ceo_name: string | null;
  founded_year: number | null;
  headquarters: string | null;
  completed_projects: number | null;
  offplan_projects: number | null;
  total_units_delivered: number | null;
  upcoming_units: number | null;
  logo_status: string | null;
  project_count: number;
  projects_for_sale: number;
  total_project_units: number;
  avg_price_from: number | null;
  coverage: string[];
  registration_status: string | null;
  group_status: string | null;
  is_hidden: boolean | null;
  drive_enrichment_status: string | null;
  office_phone: string | null;
  admin_email: string | null;
  whatsapp: string | null;
}

interface ProjectStatRow {
  id: string;
  developer_id: string | null;
  emirate: string | null;
  location: string | null;
  is_published: boolean | null;
  is_sold_out: boolean | null;
  sale_status: string | null;
  availability_status: string | null;
  status: string | null;
  price_from: number | null;
  price_to: number | null;
  total_units: number | null;
  available_units: number | null;
}

const PAGE_SIZE = 60;

const DEVELOPER_REGISTRATION_OPTIONS = [
  { value: "not_registered", label: "Not registered" },
  { value: "pending", label: "Pending" },
  { value: "registered", label: "Registered" },
];

const DEVELOPER_GROUP_OPTIONS = [
  { value: "pending_group_status", label: "Pending" },
  { value: "has_group", label: "Group active" },
  { value: "no_group", label: "No group" },
  { value: "group_not_required", label: "Group not required" },
];

const normalizeRegistrationStatus = (status: string | null | undefined) => {
  const key = String(status || "not_registered").toLowerCase();
  return key === "application_pending" || key === "pending_registration" ? "pending" : key;
};

const developerProfilePath = (slug: string) => `/owner/crm/jbj/owner-developers/${slug}`;
const developerPortfolioPath = (slug: string) => `${developerProfilePath(slug)}?tab=projects`;

const normalizeDeveloperKey = (row: Row) => {
  const SUFFIX = /\b(developments?|developers?|development|properties|property|realty|real\s*estate|holdings?|holding|group|llc|l\.?l\.?c|fz-?llc|pjsc|psc|inc|co|company|international|investments?|investment|limited|ltd|sole\s+proprietorship|s\.?p\.?c|plc|corp|corporation|establishment|contracting|construction)\b/gi;
  const nameKey = row.name.replace(SUFFIX, " ").replace(/[^a-z0-9]+/gi, "").trim().toLowerCase();
  const host = (() => {
    if (!row.website_url) return "";
    try {
      return new URL(row.website_url.startsWith("http") ? row.website_url : `https://${row.website_url}`).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return row.website_url.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    }
  })();
  return (host || nameKey || row.slug || row.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
};

const preferRicherDeveloperRow = (a: Row, b: Row) => {
  const aScore = (a.logo_url ? 10 : 0) + (a.website_url ? 4 : 0) + (a.description?.length ?? 0) / 300;
  const bScore = (b.logo_url ? 10 : 0) + (b.website_url ? 4 : 0) + (b.description?.length ?? 0) / 300;
  return bScore > aScore ? b : a;
};

/**
 * Per-developer activity menu — replaces the top-level scattered buttons.
 * Every entry point (task, deal, briefing, meeting, call, note) lives inside the card
 * so the developer context is always attached.
 */
function DeveloperActivityMenu({ slug, name }: { slug: string; name: string }) {
  const navigate = useNavigate();
  const q = encodeURIComponent(name);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="More options" size="sm" variant="outline" className="whitespace-nowrap h-8 px-2.5 rounded-md border-[#B89555]/50 text-[#1A1A1A]">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#FDFBF7] border-[#B89555]/40 min-w-[220px]">
        <DropdownMenuLabel className="text-[#1A1A1A]/60 text-[10px] uppercase tracking-[0.14em]">Log activity — {name}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigate(`/owner/crm/jbj/tasks/new?developer=${q}`)}><ListChecks className="size-4 mr-2" /> Add task</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/owner/crm/jbj/notes/new?developer=${q}`)}><StickyNote className="size-4 mr-2" /> Add note</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/owner/crm/jbj/deals/new?developer=${q}`)}><Handshake className="size-4 mr-2" /> Register deal</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/owner/crm/jbj/owner-developer-profiles?developer=${q}&new=1`)}><ClipboardList className="size-4 mr-2" /> Register briefing</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/owner/crm/jbj/meetings/new?developer=${q}`)}><CalendarDays className="size-4 mr-2" /> Register meeting</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/owner/crm/jbj/calls/new?developer=${q}`)}><PhoneCall className="size-4 mr-2" /> Log call</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`/owner/crm/jbj/owner-meeting-hub?developer=${q}`)}><Video className="size-4 mr-2" /> Open meeting hub</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



export default function DeveloperDirectory() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [onlyBroken, setOnlyBroken] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [brokenImgs, setBrokenImgs] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [accumulated, setAccumulated] = useState<Row[]>([]);
  const [visOpen, setVisOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "excel">("cards");
  const [importOpen, setImportOpen] = useState(false);

  // Reset pagination when filters change
  useEffect(() => { setPage(0); setAccumulated([]); }, [search, onlyBroken]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["dev-hub-directory", search, onlyBroken, page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("developers")
        .select("id, name, slug, logo_url, website_url, description, last_enriched_at, ceo_name, founded_year, headquarters, completed_projects, offplan_projects, total_units_delivered, upcoming_units, logo_status, registration_status, group_status, is_hidden, drive_enrichment_status, office_phone, admin_email, whatsapp, excel_order", { count: "exact" })
        .order("excel_order", { ascending: true, nullsFirst: false })
        .order("name")
        .range(from, to);
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
      if (onlyBroken) q = q.or("logo_url.is.null,logo_url.eq.,description.is.null");
      const { data, error, count } = await q;
      if (error) throw error;
      return {
        rows: (data ?? []).map((row: any) => ({
          ...row,
          project_count: 0,
          projects_for_sale: 0,
          total_project_units: 0,
          avg_price_from: null,
          coverage: [],
        })) as Row[],
        total: count ?? 0,
      };
    },
  });

  useEffect(() => {
    if (!data) return;
    setAccumulated((prev) => {
      if (page === 0) return data.rows;
      const seen = new Set(prev.map((r) => r.id));
      return [...prev, ...data.rows.filter((r) => !seen.has(r.id))];
    });
  }, [data, page]);

  const dedupedRows = useMemo(() => {
    const map = new Map<string, Row>();
    for (const row of accumulated) {
      const key = normalizeDeveloperKey(row) || row.id;
      map.set(key, map.has(key) ? preferRicherDeveloperRow(map.get(key)!, row) : row);
    }
    return Array.from(map.values());
  }, [accumulated]);

  const developerIds = useMemo(() => dedupedRows.map((r) => r.id), [dedupedRows]);

  const { data: projectStats } = useQuery({
    queryKey: ["dev-directory-project-stats", developerIds],
    enabled: developerIds.length > 0,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, developer_id, emirate, location, is_published, is_sold_out, sale_status, availability_status, status, price_from, price_to, total_units, available_units")
        .in("developer_id", developerIds)
        .is("deleted_at", null)
        .limit(5000);
      if (error) throw error;

      const map = new Map<string, {
        project_count: number;
        projects_for_sale: number;
        total_project_units: number;
        avg_price_from: number | null;
        coverage: string[];
      }>();

      for (const project of ((data ?? []) as ProjectStatRow[])) {
        if (!project.developer_id) continue;
        const stat = map.get(project.developer_id) ?? {
          project_count: 0,
          projects_for_sale: 0,
          total_project_units: 0,
          avg_price_from: null,
          coverage: [],
        };
        stat.project_count += 1;
        stat.total_project_units += Number(project.total_units ?? project.available_units ?? 0);
        const statusText = `${project.sale_status ?? ""} ${project.availability_status ?? ""} ${project.status ?? ""}`.toLowerCase();
        const isForSale = project.is_published !== false && !project.is_sold_out && !/sold\s*out|unavailable|inactive|archived/.test(statusText);
        if (isForSale) stat.projects_for_sale += 1;
        if (project.price_from && project.price_from > 0) {
          const previousTotal = (stat.avg_price_from ?? 0) * Math.max(stat.project_count - 1, 0);
          stat.avg_price_from = Math.round((previousTotal + project.price_from) / stat.project_count);
        }
        const place = (project.emirate || project.location || "").trim();
        if (place && !stat.coverage.includes(place)) stat.coverage.push(place);
        map.set(project.developer_id, stat);
      }
      return map;
    },
  });

  const rows = useMemo(() => dedupedRows.map((row) => ({
    ...row,
    ...(projectStats?.get(row.id) ?? {}),
  })), [dedupedRows, projectStats]);
  const total = data?.total ?? rows.length;
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((s) => {
      if (rows.every((r) => s.has(r.id))) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  }
  function clearSelection() { setSelected(new Set()); }

  const rebuild = useMutation({
    mutationFn: async (developerIds: string[]) => {
      let done = 0;
      for (let i = 0; i < developerIds.length; i += 5) {
        const slice = developerIds.slice(i, i + 5);
        const { error } = await supabase.functions.invoke("developer-site-rebuild", {
          body: { developer_ids: slice, preview: true },
        });
        if (error) throw error;
        done += slice.length;
      }
      return { count: done };
    },
    onSuccess: (r) => {
      toast.success(`Staged ${r.count} for review`, {
        action: { label: "Open queue", onClick: () => navigate("/owner/crm/jbj/owner-developer-profiles") },
      });
      clearSelection();
      qc.invalidateQueries({ queryKey: ["dev-enrichment-logs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateDeveloperStatus = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<Row, "registration_status" | "group_status">> }) => {
      const { error } = await supabase.from("developers").update(patch).eq("id", id);
      if (error) throw error;
      return { id, patch };
    },
    onMutate: async ({ id, patch }) => {
      setAccumulated((prev) => prev.map((row) => row.id === id ? { ...row, ...patch } : row));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dev-hub-directory"] });
      qc.invalidateQueries({ queryKey: ["developer-owner-campaign-stats"] });
      qc.invalidateQueries({ queryKey: ["portal-overview"] });
      toast.success("Developer status updated");
    },
    onError: (e: Error) => toast.error(e.message || "Could not update developer status"),
  });

  const selectedList = useMemo(() => Array.from(selected), [selected]);
  const canLoadMore = rows.length < total;

  const exportRows = useMemo(() => rows.map((d) => ({
    "Developer Name": d.name,
    "Founded Date": d.founded_year ?? "",
    "Owner / Founder / CEO": d.ceo_name ?? "",
    "Headquarters": d.headquarters ?? "",
    "Countries / Emirates": d.coverage?.length ? d.coverage.join(", ") : "Dubai / UAE",
    "Units Delivered": d.total_units_delivered ?? "",
    "Total Projects": d.project_count || d.completed_projects || 0,
    "Projects For Sale": d.projects_for_sale || d.offplan_projects || 0,
    "Completed Projects": d.completed_projects ?? "",
    "Upcoming Units": d.upcoming_units ?? "",
    "Total Project Units": d.total_project_units || "",
    "Average Starting Price": d.avg_price_from ?? "",
    "Logo Status": d.logo_url ? "Logo available" : (d.logo_status ?? "missing"),
    "Website": d.website_url ?? "",
    "Profile Slug": d.slug,
    "Last Enriched Dubai Time": d.last_enriched_at ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", dateStyle: "medium", timeStyle: "short" }).format(new Date(d.last_enriched_at)) : "",
    "Registration Status": d.registration_status ?? "not_registered",
    "Group Status": d.group_status ?? "pending_group_status",
    "Hidden / Draft": d.is_hidden ? "Draft" : "Live",
    "Drive Enrichment": d.drive_enrichment_status ?? "",
  })), [rows]);

  const exportFileStem = () => {
    const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    return `JBJ-developer-registry-${stamp}`;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    if (!exportRows.length) return;
    const headers = Object.keys(exportRows[0]);
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(","), ...exportRows.map((row) => headers.map((h) => escape((row as Record<string, unknown>)[h])).join(","))].join("\n");
    downloadBlob(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }), `${exportFileStem()}.csv`);
    toast.success("Developer CSV downloaded");
  };

  const exportExcel = async () => {
    if (!exportRows.length) return;
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet["!cols"] = Object.keys(exportRows[0]).map((key) => ({ wch: Math.max(16, key.length + 4) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Developers");
    const array = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    downloadBlob(new Blob([array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${exportFileStem()}.xlsx`);
    toast.success("Developer Excel downloaded");
  };

  return (
    <div data-developer-directory className="space-y-5 max-w-full overflow-hidden">
      <div className="rounded-lg border border-[#B89555]/35 bg-[linear-gradient(135deg,#FDFBF7_0%,#F7F2EA_55%,#EFE6D6_100%)] p-5 md:p-6 shadow-[0_24px_60px_-42px_rgba(26,26,26,0.45)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <span data-surface="emerald" className="allow-white shrink-0 size-12 rounded-md jj-emerald-metallic flex items-center justify-center shadow-[0_16px_34px_-20px_rgba(6,78,59,0.9)]">
              <Building2 className="size-5 text-white" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.24em] font-black text-[#B89555]">Owner Backend · Developers</p>
              <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Developers Portal</h1>
              <p className="text-sm text-[#1A1A1A]/70 mt-1 max-w-3xl">Owner-only command center for developers, projects, briefing requests, launch events, profile updates, sales reps, logo governance and Excel exports.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Single "New" dropdown consolidates all create actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="whitespace-nowrap bg-[#064E3B] hover:bg-[#053528] !text-white">
                  <Plus className="size-4 mr-1" /> New <ChevronDown className="size-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#FDFBF7] border-[#B89555]/40 min-w-[220px]">
                <DropdownMenuLabel className="text-[#1A1A1A]/60 text-[10px] uppercase tracking-[0.14em]">Create</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("/owner/crm/jbj/owner-developers/add")}><UserPlus className="size-4 mr-2" /> Add Developer</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/owner/crm/jbj/owner-developer-projects/new")}><Plus className="size-4 mr-2" /> Add Project</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/owner/crm/jbj/owner-developer-profiles")}><CalendarDays className="size-4 mr-2" /> Apply Briefing</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View toggle — Cards / Excel */}
            <div className="inline-flex rounded-md border border-[#B89555]/40 overflow-hidden">
              <button type="button" data-surface={viewMode === "cards" ? "emerald" : "champagne"} onClick={() => setViewMode("cards")} className={`px-3 h-9 text-xs whitespace-nowrap flex items-center gap-1 ${viewMode === "cards" ? "jj-emerald-metallic text-white" : "bg-[#FDFBF7] text-[#1A1A1A]"}`}><LayoutGrid className="size-3.5" /> Cards</button>
              <button type="button" data-surface={viewMode === "excel" ? "emerald" : "champagne"} onClick={() => setViewMode("excel")} className={`px-3 h-9 text-xs whitespace-nowrap flex items-center gap-1 border-l border-[#B89555]/40 ${viewMode === "excel" ? "jj-emerald-metallic text-white" : "bg-[#FDFBF7] text-[#1A1A1A]"}`}><Table2 className="size-3.5" /> Excel</button>
            </div>

            {/* Data menu — imports & exports */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="whitespace-nowrap">
                  <FileSpreadsheet className="size-4 mr-1" /> Data <ChevronDown className="size-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#FDFBF7] border-[#B89555]/40 min-w-[220px]">
                <DropdownMenuLabel className="text-[#1A1A1A]/60 text-[10px] uppercase tracking-[0.14em]">Import</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setImportOpen(true)}><Upload className="size-4 mr-2" /> Import Excel</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/owner/crm/jbj/owner-developer-profiles") }><FileSpreadsheet className="size-4 mr-2" /> Import review</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[#1A1A1A]/60 text-[10px] uppercase tracking-[0.14em]">Export</DropdownMenuLabel>
                <DropdownMenuItem onClick={exportCsv} disabled={!rows.length}><Download className="size-4 mr-2" /> Download CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={exportExcel} disabled={!rows.length}><FileSpreadsheet className="size-4 mr-2" /> Download Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>


      <DeveloperExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onDone={() => { setPage(0); setAccumulated([]); qc.invalidateQueries({ queryKey: ["dev-hub-directory"] }); }}
      />

      <Card className="p-5 bg-[#FDFBF7] border border-[#B89555]/30 shadow-[0_18px_45px_-34px_rgba(26,26,26,0.35)]">
        <p className="text-sm text-[#1A1A1A]/80">
          <span className="font-semibold text-[#1A1A1A]">Developers Portal</span> = the live owner-side developer control surface. Click <span className="font-semibold">Open profile</span> for full details (projects, media, sales reps, activity), or <span className="font-semibold">Rebuild from site</span> to scrape their website — every scrape stages in <Link to="/owner/crm/jbj/owner-developer-profiles" className="underline">Profile Rebuild</Link> for your approval before going live. Use <span className="font-semibold">Visibility access</span> to publish or hide contact fields in bulk.
        </p>
      </Card>

      <DeveloperOwnerCampaignDashboard />

      <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30 flex items-center gap-3 flex-wrap shadow-[0_18px_45px_-34px_rgba(26,26,26,0.35)]">
        <Input
          placeholder="Search developer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-72"
        />
        <Button
          variant={onlyBroken ? "gold" : "outline"}
          size="sm"
          onClick={() => setOnlyBroken((v) => !v)}
          className={onlyBroken ? "jj-emerald-metallic text-white" : undefined}
          data-surface={onlyBroken ? "emerald" : undefined}
        >
          {onlyBroken ? "Showing broken only" : "Show broken only"}
        </Button>

        <Button aria-label="Unselect all" size="sm" variant="outline" onClick={toggleAll}>
          {allSelected ? <CheckSquare className="size-4 mr-1" /> : <Square className="size-4 mr-1" />}
          {allSelected ? "Unselect all" : "Select all loaded"}
        </Button>

        <Button size="sm" variant="outline" onClick={() => setVisOpen(true)}>
          <ShieldCheck className="size-4 mr-1" /> Visibility access
        </Button>

        {selected.size > 0 && (
          <>
            <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
              {selected.size} selected
            </Badge>
            <Button
              size="sm"
              className="bg-[#064E3B] hover:bg-[#053528] !text-white"
              disabled={rebuild.isPending}
              onClick={() => rebuild.mutate(selectedList.slice(0, 25))}
            >
              <Zap className="size-3 mr-1" />
              {rebuild.isPending ? "Rebuilding…" : `Rebuild ${Math.min(selected.size, 25)} selected`}
            </Button>
            <Button size="sm" variant="outline" onClick={clearSelection}>Clear</Button>
          </>
        )}

        <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] ml-auto">
          {rows.length} of {total} shown
        </Badge>
      </Card>

      {isLoading && page === 0 && <p className="text-sm text-[#1A1A1A]/70">Loading…</p>}

      {viewMode === "excel" ? (
        <Card className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl overflow-hidden shadow-[0_18px_42px_-34px_rgba(26,26,26,0.42)]">
          <div className="overflow-x-auto jj-scrollbar-gold">
            <table className="w-full min-w-[1320px] text-sm">
              <thead className="bg-[#EFE6D6] border-b border-[#B89555]/35">
                <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#1A1A1A]/70">
                  <th className="px-4 py-3 font-black">Developer</th>
                  <th className="px-4 py-3 font-black">Founded</th>
                  <th className="px-4 py-3 font-black">Owner / Founder</th>
                  <th className="px-4 py-3 font-black">Units Delivered</th>
                  <th className="px-4 py-3 font-black">For Sale</th>
                  <th className="px-4 py-3 font-black">Total Projects</th>
                  <th className="px-4 py-3 font-black">Coverage</th>
                  <th className="px-4 py-3 font-black">Avg. Price</th>
                  <th className="px-4 py-3 font-black">Logo</th>
                  <th className="px-4 py-3 font-black">Status</th>
                  <th className="px-4 py-3 font-black">Website</th>
                  <th className="px-4 py-3 font-black">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-b border-[#B89555]/15 align-middle hover:bg-[#FDFBF7]">
                    <td className="px-4 py-3 min-w-[260px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox checked={selected.has(d.id)} onCheckedChange={() => toggleOne(d.id)} aria-label={`Select ${d.name}`} />
                        <DeveloperLogo
                          src={!brokenImgs.has(d.id) ? d.logo_url : null}
                          alt={`${d.name} logo`}
                          name={d.name}
                          websiteUrl={d.website_url}
                          variant="tile"
                          renderFallback
                          className="size-10 rounded-xl border-[#B89555]/40 bg-[#FDFBF7]"
                          onError={() => setBrokenImgs((s) => new Set(s).add(d.id))}
                        />
                        <div className="min-w-0">
                          <p className="font-black text-[#1A1A1A] truncate">{d.name}</p>
                          <p className="text-xs text-[#1A1A1A]/55 truncate">{d.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]">{d.founded_year ?? "—"}</td>
                    <td className="px-4 py-3 text-[#1A1A1A] max-w-[170px] truncate">{d.ceo_name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#1A1A1A] font-bold">{(d.total_units_delivered ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#1A1A1A] font-bold">
                      <Link to={developerPortfolioPath(d.slug)} className="inline-flex rounded-md px-2 py-1 -mx-2 -my-1 underline decoration-[#B89555]/50 hover:bg-[#EFE6D6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]">
                        {(d.projects_for_sale || d.offplan_projects || 0).toLocaleString()}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A] font-bold">
                      <Link to={developerPortfolioPath(d.slug)} className="inline-flex rounded-md px-2 py-1 -mx-2 -my-1 underline decoration-[#B89555]/50 hover:bg-[#EFE6D6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]">
                        {(d.project_count || d.completed_projects || 0).toLocaleString()}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A] max-w-[180px] truncate">{d.coverage?.length ? d.coverage.slice(0, 4).join(", ") : (d.headquarters ?? "Dubai / UAE")}</td>
                    <td className="px-4 py-3 text-[#1A1A1A]">{d.avg_price_from ? `AED ${d.avg_price_from.toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap min-w-[120px]"><Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 whitespace-nowrap inline-flex min-w-[72px] justify-center">{d.logo_url ? "Ready" : (d.logo_status ?? "Missing")}</Badge></td>
                    <td className="px-4 py-3 min-w-[260px] whitespace-nowrap">
                      <div className="flex flex-row items-center gap-1.5 flex-nowrap">
                        <Select value={normalizeRegistrationStatus(d.registration_status)} onValueChange={(value) => updateDeveloperStatus.mutate({ id: d.id, patch: { registration_status: value } })}>
                          <SelectTrigger className="h-8 bg-[#FDFBF7] text-[#1A1A1A] text-xs min-w-[110px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">{DEVELOPER_REGISTRATION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={d.group_status || "pending_group_status"} onValueChange={(value) => updateDeveloperStatus.mutate({ id: d.id, patch: { group_status: value } })}>
                          <SelectTrigger className="h-8 bg-[#FDFBF7] text-[#1A1A1A] text-xs min-w-[130px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">{DEVELOPER_GROUP_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                        </Select>
                        {d.is_hidden && <Badge className="bg-[#1A1A1A] text-white border-0 w-fit whitespace-nowrap">Draft</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[220px] whitespace-nowrap">
                      {d.website_url ? (
                        <a
                          href={d.website_url.startsWith("http") ? d.website_url : `https://${d.website_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1A1A1A] underline decoration-[#B89555]/60 text-xs whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-[200px] align-middle"
                          title={d.website_url}
                        >
                          {d.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      ) : <span className="text-[#1A1A1A]/45">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap min-w-[190px]">
                      <div className="flex flex-row items-center gap-1.5 flex-nowrap">
                        <Button asChild size="sm" className="whitespace-nowrap h-8 px-3 bg-[#064E3B] hover:bg-[#053528] !text-white">
                          <Link to={developerProfilePath(d.slug)}>Open</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="whitespace-nowrap h-8 px-3 border-[#B89555]/50 text-[#1A1A1A]">
                          <Link to={`${developerProfilePath(d.slug)}?edit=1`}>Edit</Link>
                        </Button>
                        <DeveloperActivityMenu slug={d.slug} name={d.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        {rows.map((d) => {
          const isSel = selected.has(d.id);
          const groupLabel = DEVELOPER_GROUP_OPTIONS.find((o) => o.value === (d.group_status || "pending_group_status"))?.label ?? "Group not created";
          return (
            <Card
              key={d.id}
              className={`p-5 bg-[#F7F2EA] border rounded-lg shadow-[0_18px_42px_-34px_rgba(26,26,26,0.42)] flex flex-col h-full ${isSel ? "border-[#064E3B] ring-1 ring-[#064E3B]" : "border-[#B89555]/30"}`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSel}
                  onCheckedChange={() => toggleOne(d.id)}
                  className="mt-1"
                  aria-label={`Select ${d.name}`}
                />
                <DeveloperLogo
                  src={!brokenImgs.has(d.id) ? d.logo_url : null}
                  alt={`${d.name} logo`}
                  name={d.name}
                  websiteUrl={d.website_url}
                  variant="tile"
                  renderFallback
                  className="size-16 rounded-md border-[#B89555]/40 bg-[#FDFBF7] shadow-[0_10px_24px_-18px_rgba(26,26,26,0.55)]"
                  onError={() => setBrokenImgs((s) => new Set(s).add(d.id))}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-black text-[#1A1A1A] text-[16px] leading-tight truncate">{d.name}</p>
                  <p className="text-xs text-[#1A1A1A]/60 truncate">{d.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <RegistrationStatusBadge status={d.registration_status || "not_registered"} />
                    <Badge className="bg-[#064E3B] !text-white border-0 text-[10px] uppercase tracking-[0.08em]">{groupLabel}</Badge>
                    {d.is_hidden && <Badge className="bg-[#1A1A1A] text-white border-0 text-[10px] uppercase tracking-[0.08em]">Draft</Badge>}
                    {d.drive_enrichment_status && <Badge className="bg-[#FDE68A] text-[#1A1A1A] border border-[#B89555]/30 text-[10px] uppercase tracking-[0.08em]">{d.drive_enrichment_status}</Badge>}
                  </div>
                  {d.website_url && (
                    <a href={d.website_url} target="_blank" rel="noreferrer" className="text-xs text-[#1A1A1A]/70 underline flex items-center gap-1 mt-1">
                      <ExternalLink className="size-3" />
                      {(() => { try { return new URL(d.website_url).hostname; } catch { return d.website_url; } })()}
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Link to={developerPortfolioPath(d.slug)} className="rounded-md border border-[#B89555]/25 bg-[#FDFBF7] p-2 transition hover:bg-[#EFE6D6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]">
                  <p className="text-[10px] uppercase tracking-wide text-[#1A1A1A]/55 font-black">For Sale</p>
                  <p className="text-[#1A1A1A] font-black">{(d.projects_for_sale || d.offplan_projects || 0).toLocaleString()}</p>
                </Link>
                <Link to={developerPortfolioPath(d.slug)} className="rounded-md border border-[#B89555]/25 bg-[#FDFBF7] p-2 transition hover:bg-[#EFE6D6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]">
                  <p className="text-[10px] uppercase tracking-wide text-[#1A1A1A]/55 font-black">Projects</p>
                  <p className="text-[#1A1A1A] font-black">{(d.project_count || d.completed_projects || 0).toLocaleString()}</p>
                </Link>
                <Link to={developerPortfolioPath(d.slug)} className="rounded-md border border-[#B89555]/25 bg-[#FDFBF7] p-2 transition hover:bg-[#EFE6D6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]">
                  <p className="text-[10px] uppercase tracking-wide text-[#1A1A1A]/55 font-black">Units</p>
                  <p className="text-[#1A1A1A] font-black">{(d.total_units_delivered ?? 0).toLocaleString()}</p>
                </Link>
              </div>
              <p className="text-sm text-[#1A1A1A]/75 mt-3 line-clamp-2 leading-relaxed min-h-[2.6em]">
                {d.description ?? <span className="italic text-[#1A1A1A]/40">No description</span>}
              </p>
              <div className="flex-1" />
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-md border border-[#B89555]/25 bg-[#FDFBF7] p-2">
                  <p className="mb-1 text-[10px] uppercase tracking-[0.12em] font-black text-[#1A1A1A]/55">Registration</p>
                  <Select value={normalizeRegistrationStatus(d.registration_status)} onValueChange={(value) => updateDeveloperStatus.mutate({ id: d.id, patch: { registration_status: value } })}>
                  <SelectTrigger className="h-9 bg-white text-[#1A1A1A] w-full"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">{DEVELOPER_REGISTRATION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="rounded-md border border-[#B89555]/25 bg-[#FDFBF7] p-2">
                  <p className="mb-1 text-[10px] uppercase tracking-[0.12em] font-black text-[#1A1A1A]/55">Developer group</p>
                  <Select value={d.group_status || "pending_group_status"} onValueChange={(value) => updateDeveloperStatus.mutate({ id: d.id, patch: { group_status: value } })}>
                  <SelectTrigger className="h-9 bg-white text-[#1A1A1A] w-full"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">{DEVELOPER_GROUP_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap items-center">
                <Button asChild size="sm" className="bg-[#064E3B] hover:bg-[#053528] !text-white">
                  <Link to={developerProfilePath(d.slug)}>
                    <ExternalLink className="size-3 mr-1" /> Open profile
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rebuild.mutate([d.id])}
                  disabled={rebuild.isPending}
                >
                  <Sparkles className="size-3 mr-1" /> Rebuild
                </Button>
                <DeveloperActivityMenu slug={d.slug} name={d.name} />
              </div>
            </Card>
          );
        })}
      </div>
      )}

      {canLoadMore && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            disabled={isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            {isFetching ? "Loading…" : `Load ${Math.min(PAGE_SIZE, total - rows.length)} more`}
          </Button>
        </div>
      )}

      <DeveloperVisibilitySheet
        open={visOpen}
        onOpenChange={setVisOpen}
        selectedIds={selectedList}
        totalVisible={total}
      />
    </div>
  );
}
