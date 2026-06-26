import React, { useState, useMemo, useEffect, useTransition, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";
import { isInHistoryPool, isInQueuePool } from "@/lib/crm/developerPools";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Search, Sparkles, Building2, Users, FileSignature, Download, Bell, Trash2, Send, Mail, Settings as SettingsIcon, Link as LinkIcon, Lock, FlaskConical, MapPin, Phone, CheckCircle2, FileEdit, BookOpen, Loader2, RotateCcw, Inbox } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { COUNTRIES } from "@/data/countries";
import { Check, ChevronsUpDown } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import {
  useBrokerages, useUpsertBrokerage, useDeleteBrokerage,
  useClients, useUpsertClient, useDeleteClient,
  useDeveloperRegistry, useSeedDeveloperRegistry, useUpsertDeveloperRegistry, useImportAllDevelopersToRegistry,
  useEnrichDeveloperRegistry,
  useUpsertReminder,
  useBrokerageRemind,
  useOwnerSettings, useUpsertOwnerSettings, useSendDeveloperRegistration,
  useQuickStatusUpdate,
  useEmailTemplate,
} from "@/hooks/useCRMRelationships";
import { exportBrokerages, BrokerageExportRow } from "@/utils/exportBrokerages";
import { exportDevelopers, DeveloperExportRow } from "@/utils/exportDevelopers";
import { ExcludeFilterPopover } from "@/components/crm/ExcludeFilterPopover";
import { ExcelGridView } from "@/components/crm/ExcelGridView";
import { AGENCY_STATUS_OPTIONS, BROKERAGE_REGISTRATION_STATUS_OPTIONS, BROKERAGE_STATUS_OPTIONS, CONTRACT_STATUS_OPTIONS, ATTENDANCE_STATUS_OPTIONS, attendanceBucket, STATUS_OPTIONS as DEV_STATUS_OPTIONS } from "@/utils/crmStatusPalette";
import { BrokerageAnalyticsStrip } from "@/components/crm/BrokerageAnalyticsStrip";
import { EmailQuotaCard } from "@/components/owner/EmailQuotaCard";
import ScanCardShortcut from "@/components/business-card/ScanCardShortcut";
import { UnifiedContactsPanel } from "@/components/crm/UnifiedContactsPanel";
import { AgencyAttendancePanel } from "@/components/crm/AgencyAttendancePanel";
import { useAttendanceCounts } from "@/hooks/useBrokerageEvents";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { sortBrokeragesForDirectory, normalizeForSearch } from "@/utils/brokerageRanking";
import { FileSpreadsheet, FileText as FileTextIcon, UserSquare2, Store } from "lucide-react";
import { ExportMenu, type ExportFormat } from "@/components/crm/ExportMenu";
import DevSalesRepsDirectory from "@/components/crm/entity/DevSalesRepsDirectory";
import { Link as RouterLink } from "react-router-dom";
import { BrandedEmailComposer } from "@/components/crm/BrandedEmailComposer";
import { ExportConfigurator } from "@/components/crm/ExportConfigurator";
import { UnifiedCRMExportModal } from "@/components/crm/UnifiedCRMExportModal";
import { BROKERAGE_EXPORT_COLUMNS, BROKERAGE_EXPORT_PRESETS } from "@/utils/exportBrokerages";
import { BrokerageAgentsEditor, type BrokerageAgentDraft } from "@/components/crm/BrokerageAgentsEditor";
import { BrokerageContactPhotoImporter } from "@/components/crm/BrokerageContactPhotoImporter";
import { TemplateEditorDialog } from "@/components/crm/TemplateEditorDialog";
import { TestSendDialog } from "@/components/crm/TestSendDialog";
import { BreakfastBookingsSection } from "@/components/crm/BreakfastBookingsSection";
import { BulkSendDialog } from "@/components/crm/BulkSendDialog";
import { ConfirmRegistrationLauncher } from "@/components/crm/ConfirmRegistrationLauncher";
import { ShieldCheck } from "lucide-react";
import { BulkOutreachPanel } from "@/components/crm/BulkOutreachPanel";
import { BulkUploadDialog } from "@/components/crm/BulkUploadDialog";
import { OutreachActionsMenu } from "@/components/crm/OutreachActionsMenu";
import { OutreachAttachmentsEditor } from "@/components/crm/OutreachAttachmentsEditor";
import { SentHistoryView } from "@/components/crm/SentHistoryView";
import { PrimarySenderEditor, CcListEditor } from "@/components/crm/EmailListEditor";
import { GmailSenderStatusBanner } from "@/components/crm/GmailSenderStatusBanner";
import { BreakfastCalendarStatusBanner } from "@/components/crm/BreakfastCalendarStatusBanner";
import { BrokerageDealModal } from "@/components/crm/BrokerageDealModal";
import { BrokerageLedgerDialog } from "@/components/crm/BrokerageLedgerDialog";
import { DirectoryToolsPanel, BrokerageDirectoryPanel, DeveloperDirectoryPanel } from "@/components/crm/DirectoryToolsPanel";
import { CRMFiltersPopover, type FilterChip } from "@/components/crm/CRMFiltersPopover";
import {
  SourceFilterChips,
  EMPTY_SOURCE_FILTER,
  rowMatchesSourceFilter,
  useSourceFilterContext,
  type SourceFilterValue,
} from "@/components/crm/SourceFilterChips";
import { CRMListSidebar, type CRMListView } from "@/components/crm/CRMListSidebar";
import { CRMBulkActionsBar } from "@/components/crm/CRMBulkActionsBar";
import IndividualBrokersTab from "@/components/crm/IndividualBrokersTab";
import QuickActivityActions from "@/components/crm/QuickActivityActions";
import { useQueryClient } from "@tanstack/react-query";
import { LeadAIStar } from "@/components/crm/LeadAIStar";
import { ArrowLeftRight, Trophy, HelpCircle, MessageCircle, Globe2, Instagram } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseQuotaError, formatRemaining } from "@/lib/email/quotaErrors";
import { useEmailQuota } from "@/hooks/useEmailQuota";

type FieldSourceMeta = { source: string; url?: string; fetched_at?: string } | undefined;

const SOURCE_LABELS: Record<string, string> = {
  master_catalog: "Master catalog",
  perplexity: "AI web research",
  firecrawl: "Website scrape",
  ai_inference: "AI inferred",
  manual: "Manual",
};

const SOURCE_STYLES: Record<string, string> = {
  master_catalog: "jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30",
  perplexity: "bg-blue-50 text-blue-800 border-blue-200",
  firecrawl: "bg-indigo-50 text-indigo-800 border-indigo-200",
  ai_inference: "bg-amber-50 text-amber-900 border-amber-200",
  manual: "bg-[#F7F2EA] text-[#1A1A1A]/70 border-[#B89555]/30",
};

const FieldSource = ({ meta }: { meta: FieldSourceMeta }) => {
  if (!meta || !meta.source) return null;
  const label = SOURCE_LABELS[meta.source] || meta.source.replace(/_/g, " ");
  const cls = SOURCE_STYLES[meta.source] || SOURCE_STYLES.manual;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={`shrink-0 text-[9px] uppercase tracking-wider px-1.5 py-px rounded-full border font-semibold ${cls}`}
          aria-label={`Source: ${label}`}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="text-xs w-64 bg-[#FDFBF7] border-[#1A1A1A]/10" onClick={(e) => e.stopPropagation()}>
        <div className="font-semibold text-[#1A1A1A]">{label}</div>
        {meta.url && (
          <a
            href={meta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 underline text-blue-700 break-all"
          >
            {meta.url}
          </a>
        )}
        {meta.fetched_at && (
          <div className="text-[#1A1A1A]/70 mt-1">
            Fetched {new Date(meta.fetched_at).toLocaleString()}
          </div>
        )}
        {meta.source === "ai_inference" && (
          <div className="mt-2 text-amber-800">
            This value was inferred from the website domain. Verify before using.
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

/** Searchable country combobox with flag emojis + per-country counts. */
const CountryCombobox = ({
  value,
  onChange,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  rows: any[];
}) => {
  const [open, setOpen] = useState(false);
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) {
      const c = String(r?.country || (r?.region === "UAE" ? "United Arab Emirates" : r?.region || "")).trim();
      if (!c) continue;
      m[c.toLowerCase()] = (m[c.toLowerCase()] || 0) + 1;
    }
    return m;
  }, [rows]);
  const selected = COUNTRIES.find((c) => c.name.toLowerCase() === value.toLowerCase());
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal bg-white"
        >
          <span className="truncate">
            {value === "all"
              ? `🌐 All countries · ${rows.length}`
              : selected
              ? `${selected.flag} ${selected.name}`
              : value}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-60 shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[280px] bg-[#FDFBF7] border-[#1A1A1A]/10" align="start">
        <Command>
          <CommandInput placeholder="Search country…" />
          <CommandList className="max-h-72">
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => { onChange("all"); setOpen(false); }}
              >
                <Check className={`mr-2 h-4 w-4 ${value === "all" ? "opacity-100" : "opacity-0"}`} />
                <span className="mr-2">🌐</span>
                <span className="flex-1">All countries</span>
                <span className="text-[#1A1A1A]/60 text-xs">{rows.length}</span>
              </CommandItem>
              {COUNTRIES.map((c) => {
                const n = counts[c.name.toLowerCase()] || 0;
                return (
                  <CommandItem
                    key={c.code}
                    value={`${c.name} ${c.code} ${c.nationality}`}
                    onSelect={() => { onChange(c.name); setOpen(false); }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${value.toLowerCase() === c.name.toLowerCase() ? "opacity-100" : "opacity-0"}`} />
                    <span className="mr-2">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    {n > 0 && <span className="text-[#1A1A1A]/60 text-xs ml-2">{n}</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Verification banner — confirms which table powers the Relationships list and
 * shows live row counts on both sides so we can spot drift between the master
 * catalog (`developers`) and the per-owner registry (`crm_developer_registry`).
 *
 * Visible to the owner only when `?debug=1` is in the URL or the env flag
 * `VITE_REGISTRY_DEBUG` is enabled, so it never leaks into normal operation.
 */
const RegistryDebugBanner = ({ registryRows, isLoading }: { registryRows: number; isLoading: boolean }) => {
  const [counts, setCounts] = useState<{ catalog: number | null; registry: number | null; error?: string }>({
    catalog: null,
    registry: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "1" || params.get("debug") === "true") return true;
    try {
      // @ts-ignore - vite env
      return Boolean(import.meta?.env?.VITE_REGISTRY_DEBUG);
    } catch {
      return false;
    }
  }, []);

  const load = async () => {
    setRefreshing(true);
    try {
      const [cat, reg] = await Promise.all([
        supabase.from("developers").select("id", { count: "exact", head: true }).or("is_hidden.is.null,is_hidden.eq.false"),
        supabase.from("crm_developer_registry").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        catalog: cat.count ?? null,
        registry: reg.count ?? null,
        error: cat.error?.message || reg.error?.message,
      });
    } catch (e: any) {
      setCounts((c) => ({ ...c, error: e?.message || "Count query failed" }));
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-load once when banner mounts.
  useMemo(() => { if (enabled) load(); /* eslint-disable-line */ }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="rounded-xl border border-dashed border-[#1A1A1A]/30 bg-amber-50 p-4 text-sm text-[#1A1A1A]">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="font-semibold flex items-center gap-2">
            <FlaskConical className="w-4 h-4" />
            Registry verification
          </div>
          <div className="text-[#1A1A1A]/80">
            This list reads from <code className="px-1 py-0.5 bg-[#1A1A1A]/10 rounded">crm_developer_registry</code> (per-owner CRM table) — never directly from <code className="px-1 py-0.5 bg-[#1A1A1A]/10 rounded">developers</code> (the public master catalog).
          </div>
          <div className="text-[#1A1A1A]/80 pt-1">
            Rendered rows in this view: <b>{isLoading ? "loading…" : registryRows.toLocaleString()}</b>
            {" · "}
            crm_developer_registry total: <b>{counts.registry === null ? "—" : counts.registry.toLocaleString()}</b>
            {" · "}
            developers catalog (visible): <b>{counts.catalog === null ? "—" : counts.catalog.toLocaleString()}</b>
          </div>
          {counts.error && <div className="text-red-700 pt-1">Count error: {counts.error}</div>}
          {counts.catalog !== null && counts.registry !== null && counts.catalog > counts.registry && (
            <div className="pt-1 text-amber-900">
              {(counts.catalog - counts.registry).toLocaleString()} catalog developers are not yet in your registry — click <b>Import all developers</b> to sync.
            </div>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={refreshing}>
          {refreshing ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
          Refresh counts
        </Button>
      </div>
    </div>
  );
};

const STATUS_BROKERAGE = [
  { v: "prospect", label: "Prospect", cls: "bg-[#EFE6D6] text-[#1A1A1A]" },
  { v: "negotiating", label: "Negotiating", cls: "bg-amber-200 text-[#1A1A1A]" },
  { v: "active_partner", label: "Active Partner", cls: "jj-emerald-soft text-[#1A1A1A]" },
  { v: "closed_deals", label: "Closed Deals", cls: "bg-blue-200 text-[#1A1A1A]" },
  { v: "dormant", label: "Dormant", cls: "bg-[#EFE6D6] text-[#1A1A1A]" },
  { v: "blacklisted", label: "Blacklisted", cls: "bg-red-200 text-[#1A1A1A]" },
];
const STATUS_CLIENT = [
  { v: "lead", label: "Lead", cls: "bg-[#EFE6D6] text-[#1A1A1A]" },
  { v: "qualified", label: "Qualified", cls: "bg-blue-200 text-[#1A1A1A]" },
  { v: "negotiating", label: "Negotiating", cls: "bg-amber-200 text-[#1A1A1A]" },
  { v: "vip", label: "VIP", cls: "bg-purple-200 text-[#1A1A1A]" },
  { v: "closed_won", label: "Closed Won", cls: "jj-emerald-soft text-[#1A1A1A]" },
  { v: "closed_lost", label: "Closed Lost", cls: "bg-red-200 text-[#1A1A1A]" },
  { v: "dormant", label: "Dormant", cls: "bg-[#EFE6D6] text-[#1A1A1A]" },
];
const STATUS_DEV = [
  { v: "not_started", label: "Not Started", cls: "bg-[#EFE6D6] text-[#1A1A1A]" },
  { v: "pending_application", label: "Pending Application", cls: "bg-amber-200 text-[#1A1A1A]" },
  { v: "documents_required", label: "Documents Required", cls: "bg-orange-200 text-[#1A1A1A]" },
  { v: "under_review", label: "Under Review", cls: "bg-blue-200 text-[#1A1A1A]" },
  { v: "registered", label: "Registered", cls: "jj-emerald-soft text-[#1A1A1A]" },
  { v: "rejected", label: "Rejected", cls: "bg-red-200 text-[#1A1A1A]" },
  { v: "expired", label: "Expired", cls: "bg-[#E5D9C4] text-[#1A1A1A]" },
];

type StatusOption = { v: string; label: string; cls: string };

const StatusPill = ({ value, options }: { value: string; options: StatusOption[] }) => {
  const o = options.find((s) => s.v === value) || options[0];
  return <Badge className={`${o.cls} border-0 font-semibold hover:${o.cls}`}>{o.label}</Badge>;
};

const InlineStatusSelect = ({
  entityType, id, value, options,
}: { entityType: "brokerage" | "client" | "developer_registry"; id: string; value: string; options: StatusOption[] }) => {
  const update = useQuickStatusUpdate();
  const current = options.find((s) => s.v === value) || options[0];
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v === value) return;
        update.mutate({ entityType, id, status: v, previousStatus: value });
      }}
    >
      <SelectTrigger className={`h-8 w-auto min-w-[160px] px-3 py-1 border-0 font-semibold rounded-full ${current.cls} focus:ring-2 focus:ring-black/40`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-[#FDFBF7] border border-[#1A1A1A]/10 z-50">
        {options.map((s) => (
          <SelectItem key={s.v} value={s.v} className="text-[#1A1A1A]">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const exportCSV = (rows: any[], filename: string, columns: { key: string; label: string }[]) => {
  if (!rows.length) { toast.error("Nothing to export"); return; }
  const head = columns.map((c) => `"${c.label}"`).join(",");
  const body = rows.map((r) =>
    columns.map((c) => {
      const v = r[c.key];
      const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    }).join(",")
  ).join("\n");
  const blob = new Blob([head + "\n" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success("Exported");
};

const aiRecommend = async (kind: "brokerage" | "client" | "developer_registry", recordId: string, refetch: () => void) => {
  const t = toast.loading("AI analyzing…");
  try {
    const { data, error } = await supabase.functions.invoke("crm-relationship-ai", { body: { kind, recordId } });
    if (error || data?.error) throw new Error(data?.error || error?.message);
    toast.success("AI recommendation ready", { id: t });
    refetch();
  } catch (e: any) {
    toast.error(e.message || "AI failed", { id: t });
  }
};

/* ===========================================================
   Brokerage clickable contact row — robust link normalization
=========================================================== */
function normalizePhoneHref(p: string): string | null {
  const cleaned = p.replace(/[^\d+]/g, "");
  if (!cleaned || cleaned.replace(/\+/g, "").length < 6) return null;
  return `tel:${cleaned}`;
}
function normalizeWhatsApp(p: string): string | null {
  let d = p.replace(/[^\d]/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  // 9-digit UAE local number → prepend country code
  if (d.length === 9 && d.startsWith("5")) d = "971" + d;
  if (d.length < 8) return null;
  return `https://wa.me/${d}`;
}
function normalizeInstagram(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  let handle = s.replace(/^@/, "").replace(/^https?:\/\//i, "");
  handle = handle.replace(/^(www\.)?instagram\.com\//i, "").replace(/^\/+/, "").replace(/\/+$/, "");
  if (!handle) return null;
  return `https://www.instagram.com/${handle}`;
}
function normalizeWebsiteHref(w: string): { href: string; display: string } | null {
  const t = w.trim();
  if (!t) return null;
  const href = /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
  const display = href.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return { href, display };
}
function normalizeEmail(e: string): string | null {
  const t = e.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null;
  return t;
}

const BrokerageContactLinks = ({ r }: { r: any }) => {
  const emailRaw = (r.email || r.primary_contact?.email || "").toString();
  const phoneRaw = (r.phone || r.primary_contact?.phone || "").toString();
  const waRaw = (r.whatsapp_e164 || r.primary_contact?.whatsapp || "").toString();
  const websiteRaw = (r.website || "").toString();
  const igRaw = (r.instagram_url || "").toString();
  const address = (r.office_address || r.office_location || "").toString().trim();

  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  const phoneHref = phoneRaw ? normalizePhoneHref(phoneRaw) : null;
  const waHref = waRaw ? normalizeWhatsApp(waRaw) : (phoneRaw ? normalizeWhatsApp(phoneRaw) : null);
  const ig = igRaw ? normalizeInstagram(igRaw) : null;
  const web = websiteRaw ? normalizeWebsiteHref(websiteRaw) : null;
  const mapQuery = address
    ? address + (r.emirate ? `, ${r.emirate}` : "")
    : "";
  const mapHref = r.office_map_url
    || (mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null);

  if (!email && !phoneHref && !waHref && !web && !ig && !mapHref) return null;

  const link =
    "inline-flex items-center gap-1 text-[11px] font-medium text-[#1A1A1A] border-b border-[#B89555]/50 hover:border-[#B89555] py-0.5 cursor-pointer";
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5" data-no-contrast-guard>
      {email && (
        <a href={`mailto:${email}`} className={link} onClick={stop}>
          <Mail className="w-3 h-3" />{email}
        </a>
      )}
      {phoneHref && (
        <a href={phoneHref} className={link} onClick={stop}>
          <Phone className="w-3 h-3" />{phoneRaw}
        </a>
      )}
      {waHref && (
        <a href={waHref} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className={link} onClick={stop}>
          <MessageCircle className="w-3 h-3" />WhatsApp
        </a>
      )}
      {mapHref && (
        <a href={mapHref} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className={link} onClick={stop}>
          <MapPin className="w-3 h-3" />{address || "Map"}
        </a>
      )}
      {web && (
        <a href={web.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className={`${link} max-w-[240px]`} onClick={stop}>
          <Globe2 className="w-3 h-3 shrink-0" />
          <span className="truncate">{web.display}</span>
        </a>
      )}
      {ig && (
        <a href={ig} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className={link} onClick={stop}>
          <Instagram className="w-3 h-3" />Instagram
        </a>
      )}
    </div>
  );
};

/* ===========================================================
   Top active agents editor
=========================================================== */
type TopAgent = { name: string; role?: string; deals_count?: number };
const TopAgentsEditor = ({ value, onChange }: { value: TopAgent[]; onChange: (v: TopAgent[]) => void }) => {
  const update = (i: number, patch: Partial<TopAgent>) => {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.map((a, i) => (
        <div key={i} className="grid grid-cols-12 gap-2">
          <Input className="col-span-5" placeholder="Agent name" value={a.name || ""} onChange={(e) => update(i, { name: e.target.value })} />
          <Input className="col-span-4" placeholder="Role / specialty" value={a.role || ""} onChange={(e) => update(i, { role: e.target.value })} />
          <Input className="col-span-2" type="number" placeholder="Deals" value={a.deals_count ?? ""} onChange={(e) => update(i, { deals_count: e.target.value ? +e.target.value : undefined })} />
          <Button type="button" variant="outline" size="sm" className="col-span-1" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { name: "" }])}>
        <Plus className="w-3 h-3 mr-1" />Add agent
      </Button>
    </div>
  );
};

/* ===========================================================
   Brokerages
=========================================================== */
const BrokeragesTab = () => {
  const [innerTab, setInnerTab] = useState<"agencies" | "brokers">("agencies");
  return (
    <div className="space-y-4">
      <div className="flex p-1 bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl w-fit">
        {([
          { v: "agencies", label: "Agencies" },
          { v: "brokers", label: "Individual Brokers" },
        ] as const).map((t) => (
          <button
            key={t.v}
            onClick={() => setInnerTab(t.v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors border ${
 innerTab === t.v
 ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60 shadow-sm"
 : "text-[#1A1A1A] border-transparent hover:bg-[#EFE6D6]/60"
 }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {innerTab === "agencies" ? <BrokeragesAgenciesView /> : <IndividualBrokersTab />}
    </div>
  );
};

const BrokeragesAgenciesView = () => {
  const navigate = useNavigate();
  const { data = [], isLoading, refetch } = useBrokerages();
  const upsert = useUpsertBrokerage();
  const del = useDeleteBrokerage();
  const remind = useBrokerageRemind();
  const { data: ownerSettings } = useOwnerSettings();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 220);
    return () => clearTimeout(t);
  }, [q]);
  const [statusFilter, setStatusFilterRaw] = useState("all");
  const [emirateFilter, setEmirateFilterRaw] = useState("all");
  const [sourceTab, setSourceTabRaw] = useState<"all" | "directory" | "owner" | "sent" | "inbox">("all");
  const [countryFilter, setCountryFilterRaw] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>(EMPTY_SOURCE_FILTER);
  const sourceFilterCtx = useSourceFilterContext(sourceFilter);
  const [, startTransition] = useTransition();
  const setStatusFilter = (v: string) => startTransition(() => setStatusFilterRaw(v));
  const setEmirateFilter = (v: string) => startTransition(() => setEmirateFilterRaw(v));
  const setCountryFilter = (v: string) => startTransition(() => setCountryFilterRaw(v));
  const setSourceTab = (v: "all" | "directory" | "owner" | "sent" | "inbox") => startTransition(() => setSourceTabRaw(v));
  const [syncing, setSyncing] = useState(false);
  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-email-sync", { body: { manual: true } });
      if (error) throw error;
      const processed = (data as any)?.processed ?? 0;
      const matched = (data as any)?.matched ?? 0;
      toast.success(`Inbox synced — ${processed} messages scanned, ${matched} matched to CRM`);
      refetch();
    } catch (e: any) {
      toast.error(e?.message || "Sync failed — check Gmail connection");
    } finally {
      setSyncing(false);
    }
  };
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [bulkSel, setBulkSel] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState<{ id: string; name: string } | null>(null);
  const [ledgerOpen, setLedgerOpen] = useState<{ id: string; name: string } | null>(null);
  const [testSendOpen, setTestSendOpen] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);
  const [unifiedExportOpen, setUnifiedExportOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [importingDLD, setImportingDLD] = useState(false);
  const [listView, setListView] = useState<CRMListView>({ kind: "active", listId: null });
  const qc = useQueryClient();
  const dldLoadedCount = useMemo(
    () => (data as any[]).filter((r: any) => r.dld_office_number || r.source === "dld_register").length,
    [data],
  );
  const onListChanged = () => {
    qc.invalidateQueries({ queryKey: ["crm-brokerages"] });
    refetch();
  };

  const handleImportDLD = async (silent = false) => {
    if (importingDLD) return;
    setImportingDLD(true);
    try {
      if (!silent) toast.info("Syncing the full DLD register…", { id: "dld-import" });
      const { data: r, error } = await supabase.functions.invoke("crm-import-dld-brokerages", { body: {} });
      if (error) throw error;
      const message = `DLD sync complete — ${(r?.inserted || 0).toLocaleString()} new, ${(r?.updated || 0).toLocaleString()} preserved/backfilled, ${(r?.skipped || 0).toLocaleString()} already existed`;
      silent ? toast.success(message, { duration: 7000 }) : toast.success(message, { id: "dld-import", duration: 8000 });
      await refetch();
    } catch (e: any) {
      toast.error("DLD sync failed: " + (e?.message || e), { id: "dld-import" });
    } finally {
      setImportingDLD(false);
    }
  };

  // DLD auto-sync removed — DLD register is fully imported. Top-ups are manual via the "Import DLD" button.

  const handleEnrichVisible = async () => {
    const targets = (filtered as any[])
      .filter((r: any) => !r.website || !r.phone || !r.email || !r.office_address)
      .slice(0, 50)
      .map((r: any) => r.id);
    if (!targets.length) { toast.info("No agencies with missing fields in the visible list"); return; }
    toast.info(`Enriching ${targets.length} agencies from Google…`, { id: "enrich" });
    try {
      const { data: r, error } = await supabase.functions.invoke("crm-enrich-brokerage-from-google", { body: { brokerage_ids: targets } });
      if (error) throw error;
      toast.success(`Enriched ${r?.enriched || 0}/${r?.processed || 0}`, { id: "enrich" });
    } catch (e: any) {
      toast.error("Enrichment failed: " + (e?.message || e), { id: "enrich" });
    }
  };

  const [viewMode, setViewMode] = useState<"cards" | "excel">("cards");
  useEffect(() => {
    const openTpl = () => setTplOpen(true);
    const openTest = () => setTestSendOpen(true);
    window.addEventListener("crm:open-brokerage-template", openTpl);
    window.addEventListener("crm:open-brokerage-test", openTest);
    return () => {
      window.removeEventListener("crm:open-brokerage-template", openTpl);
      window.removeEventListener("crm:open-brokerage-test", openTest);
    };
  }, []);

  // DLD batched import — drives a sticky toast with real per-batch progress.
  const [dldProgress, setDldProgress] = useState<{ done: number; total: number } | null>(null);
  const dldCancelRef = useRef(false);
  const handleImportDLDBatched = async () => {
    if (importingDLD) return;
    setImportingDLD(true);
    dldCancelRef.current = false;
    const tId = "dld-import";
    let allRows: any[] = [];
    let inserted = 0, updated = 0, skipped = 0;
    try {
      toast.loading("Loading DLD register…", { id: tId });
      // Fetch the public registry once on the client so we can chunk it.
      const res = await fetch("/dld-broker-offices.json", { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`Could not load /dld-broker-offices.json (${res.status})`);
      const json = await res.json();
      if (!Array.isArray(json)) throw new Error("DLD register is not a list");
      allRows = json;
      const total = allRows.length;
      const CHUNK = 500;
      setDldProgress({ done: 0, total });
      for (let i = 0; i < total; i += CHUNK) {
        if (dldCancelRef.current) {
          toast.error(`Import cancelled at ${i.toLocaleString()} / ${total.toLocaleString()}`, { id: tId });
          break;
        }
        const chunk = allRows.slice(i, i + CHUNK);
        const batchNum = Math.floor(i / CHUNK) + 1;
        const totalBatches = Math.ceil(total / CHUNK);
        toast.loading(
          `Importing DLD batch ${batchNum}/${totalBatches} — ${i.toLocaleString()} / ${total.toLocaleString()} done · ${(total - i).toLocaleString()} pending`,
          {
            id: tId,
            action: { label: "Cancel", onClick: () => { dldCancelRef.current = true; } },
          },
        );
        const { data: r, error } = await supabase.functions.invoke("crm-import-dld-brokerages", {
          body: { rows: chunk },
        });
        if (error) throw error;
        inserted += r?.inserted || 0;
        updated += r?.updated || 0;
        skipped += r?.skipped || 0;
        setDldProgress({ done: Math.min(i + CHUNK, total), total });
      }
      if (!dldCancelRef.current) {
        toast.success(
          `DLD sync complete — ${inserted.toLocaleString()} new · ${updated.toLocaleString()} backfilled · ${skipped.toLocaleString()} already existed`,
          { id: tId, duration: 8000 },
        );
      }
      await refetch();
    } catch (e: any) {
      toast.error("DLD sync failed: " + (e?.message || e), { id: tId });
    } finally {
      setImportingDLD(false);
      setDldProgress(null);
      dldCancelRef.current = false;
    }
  };
  const toggleBulk = (id: string) => setBulkSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Single pass over data — combine source counts and per-emirate counts to avoid 4× iteration on every render.
  const { directoryCount, ownerCount, sentCount, inboxCount, emirateCounts } = useMemo(() => {
    let directory = 0, owner = 0, sent = 0, inbox = 0;
    const emirates: Record<string, number> = {};
    for (const r of data as any[]) {
      if (r.entry_source === "directory") directory++;
      else if (r.entry_source === "owner") owner++;
      if ((r as any).last_outreach_at) sent++;
      if ((r as any).last_inbound_at) inbox++;
      const e = r.emirate || "Unknown";
      emirates[e] = (emirates[e] || 0) + 1;
    }
    return { directoryCount: directory, ownerCount: owner, sentCount: sent, inboxCount: inbox, emirateCounts: emirates };
  }, [data]);

  // Sort the full list once per data change (heavy ranking) — filtering is a cheap pass.
  const sorted = useMemo(() => sortBrokeragesForDirectory(data as any[]), [data]);

  // Precompute a normalized haystack per row — done once per sort change, not per keystroke.
  const indexed = useMemo(
    () =>
      sorted.map((r: any) => ({
        row: r,
        haystack: normalizeForSearch(
          [
            r.company_name,
            r.emirate,
            r.office_location,
            r.office_address,
            r.website,
            r.phone,
            r.email,
            r.instagram_url,
            r.status,
            r.outreach_stage,
            r.represented_developer_name,
            r.primary_contact?.name,
            r.primary_contact?.email,
          ]
            .filter(Boolean)
            .join(" "),
        ),
        emirateLower: (r.emirate || "").toLowerCase(),
      })),
    [sorted],
  );

  const filtered = useMemo(() => {
    const ql = normalizeForSearch(debouncedQ);
    const emirateLower = emirateFilter.toLowerCase();
    const out: any[] = [];
    for (const item of indexed) {
      const r = item.row;
      // List/Junk/Trash filtering — operates on soft-delete + is_junk + list_id columns.
      if (listView.kind === "trash") {
        if (!r.deleted_at) continue;
      } else {
        if (r.deleted_at) continue;
        if (listView.kind === "junk") {
          if (!r.is_junk) continue;
        } else {
          if (r.is_junk) continue;
          if (listView.kind === "list" && r.list_id !== listView.listId) continue;
        }
      }
      if (excludedIds.has(r.id)) continue;
      if (ql && !item.haystack.includes(ql)) continue;
      if (statusFilter !== "all" && r.status !== statusFilter) continue;
      if (emirateFilter !== "all" && item.emirateLower !== emirateLower) continue;
      if (countryFilter !== "all") {
        const rc = String(r.country || (r.region === "UAE" ? "United Arab Emirates" : r.region || "")).toLowerCase();
        if (rc !== countryFilter.toLowerCase()) continue;
      }
      if (sourceTab === "directory" && r.entry_source !== "directory") continue;
      else if (sourceTab === "owner" && r.entry_source !== "owner") continue;
      else if (sourceTab === "sent" && !r.last_outreach_at) continue;
      else if (sourceTab === "inbox" && !r.last_inbound_at) continue;
      if (!rowMatchesSourceFilter(r, sourceFilter, sourceFilterCtx)) continue;
      out.push(r);
    }
    return out;
  }, [indexed, debouncedQ, statusFilter, emirateFilter, countryFilter, sourceTab, excludedIds, listView, sourceFilter, sourceFilterCtx]);

  // Sidebar counts derived from full data set
  const listCounts = useMemo(() => {
    let active = 0, junk = 0, trash = 0;
    const perList: Record<string, number> = {};
    for (const r of data as any[]) {
      if (r.deleted_at) { trash++; continue; }
      if (r.is_junk) { junk++; continue; }
      active++;
      if (r.list_id) perList[r.list_id] = (perList[r.list_id] || 0) + 1;
    }
    return { active, junk, trash, perList };
  }, [data]);

  // Window the long card list — render first N rows, grow on demand. Keeps filter
  // updates and status flips snappy even when the directory has 1000+ agencies.
  const [visibleCount, setVisibleCount] = useState(60);
  useEffect(() => { setVisibleCount(60); }, [debouncedQ, statusFilter, emirateFilter, sourceTab, listView]);
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const [agents, setAgents] = useState<BrokerageAgentDraft[]>([]);
  const attendanceCounts = useAttendanceCounts();

  const openNew = () => {
    setEditing({ status: "prospect", entry_source: "owner", primary_contact: {}, secondary_contact: {}, admin_contact: {} });
    setAgents([]);
    setOpen(true);
  };
  const openEdit = (r: any) => {
    setEditing({ ...r, admin_contact: r.admin_contact || {} });
    setAgents([]);
    setOpen(true);
    if (r.id) {
      // Load agents in the background — never block the dialog.
      (supabase as any)
        .from("crm_brokerage_agents")
        .select("*")
        .eq("brokerage_id", r.id)
        .order("created_at", { ascending: true })
        .then(({ data: rows }: any) => setAgents((rows || []) as BrokerageAgentDraft[]));
    }
  };

  const save = async () => {
    const saved = await upsert.mutateAsync({ ...editing, entry_source: editing.entry_source || "owner" });
    const brokerageId = (saved as any)?.id || editing?.id;
    if (brokerageId) {
      await (supabase as any).from("crm_brokerage_agents").delete().eq("brokerage_id", brokerageId);
      if (agents.length) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const rows = agents.map((a) => ({
            brokerage_id: brokerageId,
            owner_id: user.id,
            name: a.name || "Unknown",
            phone: a.phone || null,
            whatsapp: a.whatsapp || null,
            email: a.email || null,
            role: a.role || null,
            status: a.status || "active",
            source: a.source || "manual",
            photo_path: a.photo_path || null,
          }));
          await (supabase as any).from("crm_brokerage_agents").insert(rows);
        }
      }
    }
    setOpen(false);
    // New / edited agencies always belong to "My Additions" — jump there so the user sees their entry.
    const wasNew = !editing?.id;
    if (wasNew) {
      setSourceTab("owner");
      qc.invalidateQueries({ queryKey: ["crm-individual-brokers"] });
      toast.success("Added to My Additions — ready for outreach");
    }
  };

  const quickReminder = (b: any) => {
    remind.mutate({ brokerageId: b.id, brokerageName: b.company_name, daysFromNow: 7 });
  };

  const buildBrokerageRows = (sourceRows: any[]): BrokerageExportRow[] =>
    sourceRows.map((r: any, i: number) => {
      const regOpt = BROKERAGE_REGISTRATION_STATUS_OPTIONS.find((s) => s.value === r.registration_status);
      const statusLabel = regOpt?.label || (r.registration_status || "Not registered");
      const admin = r.admin_contact || {};
      const broker = r.primary_contact || {};
      return {
        rank: i + 1,
        company_name: r.company_name || "",
        name_arabic: r.name_arabic || "",
        dld_office_number: r.dld_office_number || "",
        emirate: r.emirate || "",
        office_location: r.office_location || r.office_address || "",
        website: r.website || "",
        instagram: r.instagram_url || "",
        phone: r.phone || broker.phone || "",
        whatsapp: r.whatsapp_e164 || broker.whatsapp || "",
        email: r.email || broker.email || "",
        primary_contact_name: broker.name || "",
        admin_contact_name: admin.name || "",
        admin_contact_phone: admin.phone || "",
        admin_contact_email: admin.email || "",
        broker_contact_name: broker.name || "",
        broker_contact_phone: broker.phone || "",
        broker_contact_email: broker.email || "",
        agency_status: statusLabel,
        outreach_status: r.outreach_stage || "not_contacted",
        last_message_at: r.last_outreach_at ? new Date(r.last_outreach_at).toLocaleDateString() : "—",
        next_followup_at: r.next_followup_at
          ? new Date(r.next_followup_at).toLocaleDateString()
          : r.next_action_at
            ? new Date(r.next_action_at).toLocaleDateString()
            : "—",
        attempt_count: r.attempt_count ?? 0,
        deal_count: r.deal_count_cached || r.deal_count || 0,
        estimated_agents: r.estimated_agent_count ?? "—",
        active_brokers: r.active_broker_count ?? r.active_agents ?? "—",
        inquiries: r.inquiry_count ?? 0,
        rating: r.star_rating ? Number(r.star_rating).toFixed(1) : "—",
        notes: (r.notes || "").slice(0, 500),
        ai_summary: r.ai_summary || "",
      };
    });

  const handleExportConfigured = async (opts: { format: "xlsx" | "csv" | "pdf"; scope: "visible" | "selected" | "all"; columns: string[]; statuses?: string[] }) => {
    let source =
      opts.scope === "all" ? (data as any[]) :
      opts.scope === "selected" ? (data as any[]).filter((r: any) => bulkSel.has(r.id)) :
      (filtered as any[]);
    if (opts.statuses && opts.statuses.length) {
      const set = new Set(opts.statuses);
      source = source.filter((r: any) => set.has(String(r.outreach_stage || r.registration_status || r.status || "").toLowerCase()));
    }
    if (!source.length) {
      toast.error("Nothing to export");
      return;
    }
    const rows = buildBrokerageRows(source);
    await exportBrokerages(rows, opts.format, opts.columns);
    toast.success(`Exported ${rows.length} agencies (${opts.columns.length} columns) as ${opts.format.toUpperCase()}`);
  };

  const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];

  return (
    <TooltipProvider>
    <div className="space-y-4 w-full min-w-0">
    <div className="rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] p-2">
      <CRMListSidebar kind="brokerages" value={listView} onChange={setListView} counts={listCounts} orientation="horizontal" />
    </div>
    <CRMBulkActionsBar
      table="crm_brokerages"
      ids={[...bulkSel]}
      view={listView.kind}
      onClear={() => setBulkSel(new Set())}
      onChanged={onListChanged}
      onExport={() => setExportOpen(true)}
    />
      <section aria-labelledby="brokerage-outreach-settings" className="rounded-2xl border-2 border-[#B89555]/40 bg-[#F7F2EA] p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-5 h-5 text-[#1A1A1A]" />
          <h2 id="brokerage-outreach-settings" className="text-base font-bold text-[#1A1A1A] tracking-tight">
            Brokerage Outreach — Document Pack & Senders
          </h2>
        </div>
        <p className="text-xs text-[#1A1A1A]/70 mb-3">
          Same pack used for developer registrations. Edit once here or in the Developer Registry tab — they share one source of truth.
        </p>
        <DocumentPackPanel context="brokerage" />
      </section>
      <BreakfastBookingsSection />
      <BrokerageDirectoryPanel />

      {/* Directory status summary — always reflects actual counts available */}
      <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#1A1A1A]">
          <div className="font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#B89555]" />
            Directory status
          </div>
          <div><span className="text-[#1A1A1A]/70">All:</span> <b>{data.length}</b></div>
          <div><span className="text-[#1A1A1A]/70">UAE Agencies:</span> <b>{directoryCount}</b></div>
          <div><span className="text-[#1A1A1A]/70">My Additions:</span> <b>{ownerCount}</b></div>
          <div><span className="text-[#1A1A1A]/70">Already Sent:</span> <b>{sentCount}</b></div>
          <div><span className="text-[#1A1A1A]/70">New Replies:</span> <b>{inboxCount}</b></div>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#1A1A1A]/70">
          {EMIRATES.map((e) => (
            <span key={e}>
              {e}: <b className="text-[#1A1A1A]">{emirateCounts[e] || 0}</b>
            </span>
          ))}
        </div>
      </div>
      {/* Source sub-tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5 p-1 bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl w-fit">
          {[
            { v: "all", label: `All · ${data.length}` },
            { v: "directory", label: `UAE Agencies · ${directoryCount}` },
            { v: "owner", label: `My Additions · ${ownerCount}` },
            { v: "sent", label: `Already Sent · ${sentCount}` },
            { v: "inbox", label: `New Messages · ${inboxCount}` },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setSourceTab(t.v as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
 sourceTab === t.v
 ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60 shadow-sm"
 : "text-[#1A1A1A] border-transparent hover:bg-[#EFE6D6]/60"
 }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F7F2EA] border border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
              aria-label="What do these tabs mean?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/40">
            <p className="font-semibold mb-1">What's the difference?</p>
            <p className="text-xs">
              <strong>Licensed</strong> = pre-loaded RERA / DMT brokerages (currently {directoryCount}).
              Reference data only — read-only until you contact them.
            </p>
            <p className="text-xs mt-1">
              <strong>My Additions</strong> = brokerages you added yourself.
            </p>
            <p className="text-xs mt-1">
              <strong>Already Sent</strong> = agencies you've previously emailed (any template).
            </p>
            <p className="text-xs mt-1">
              <strong>New Messages</strong> = agencies who've replied — synced from your inbox.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/70" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, location, emirate, or developer" className="pl-10" />
        </div>
        <CRMFiltersPopover
          activeCount={
            (emirateFilter !== "all" ? 1 : 0) +
            (countryFilter !== "all" ? 1 : 0) +
            (statusFilter !== "all" ? 1 : 0) +
            (excludedIds.size > 0 ? 1 : 0)
          }
          chips={[
            ...(emirateFilter !== "all" ? [{ key: "em", label: `Emirate: ${emirateFilter}`, onClear: () => setEmirateFilter("all") }] : []),
            ...(countryFilter !== "all" ? [{ key: "co", label: `Country: ${countryFilter}`, onClear: () => setCountryFilter("all") }] : []),
            ...(statusFilter !== "all" ? [{ key: "st", label: `Status: ${statusFilter}`, onClear: () => setStatusFilter("all") }] : []),
            ...(excludedIds.size > 0 ? [{ key: "ex", label: `Excluded: ${excludedIds.size}`, onClear: () => setExcludedIds(new Set()) }] : []),
          ] as FilterChip[]}
          onResetAll={() => { setEmirateFilter("all"); setCountryFilter("all"); setStatusFilter("all"); setExcludedIds(new Set()); }}
        >
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold mb-1 block">Emirate</Label>
              <Select value={emirateFilter} onValueChange={setEmirateFilter}>
                <SelectTrigger><SelectValue placeholder="Emirate" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All emirates · {data.length}</SelectItem>
                  {EMIRATES.map((e) => (
                    <SelectItem key={e} value={e}>{e} · {emirateCounts[e] || 0}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1 block">Country</Label>
              <CountryCombobox
                value={countryFilter}
                onChange={setCountryFilter}
                rows={data as any[]}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_BROKERAGE.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1 block">Exclude agencies</Label>
              <ExcludeFilterPopover
                scope="brokerage"
                options={(data as any[]).map((r) => ({ id: r.id, name: r.company_name || "Unnamed" }))}
                excludedIds={excludedIds}
                onChange={setExcludedIds}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1 block">View</Label>
              <div className="flex p-1 bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${viewMode === "cards" ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/60" : "text-[#1A1A1A]/70"}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("excel")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${viewMode === "excel" ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/60" : "text-[#1A1A1A]/70"}`}
                >
                  <TableIcon className="w-3.5 h-3.5" /> Excel View
                </button>
              </div>
            </div>
          </div>
        </CRMFiltersPopover>
        <Button
          variant="outline"
          onClick={() => setExportOpen(true)}
          disabled={!filtered.length}
          title="Configure export — pick format, scope, and which columns (admin/broker contacts) to include"
        >
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
        <Button
          variant="outline"
          onClick={() => setUnifiedExportOpen(true)}
          disabled={!filtered.length}
          title="Unified CSV — same columns across every CRM list page"
        >
          <Download className="w-4 h-4 mr-2" /> Unified CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => handleImportDLDBatched()}
          disabled={importingDLD}
          title="Batched import of the official DLD register — shows live progress per 500-row batch."
        >
          {importingDLD ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          {importingDLD && dldProgress
            ? `Importing ${dldProgress.done.toLocaleString()} / ${dldProgress.total.toLocaleString()}`
            : "Import DLD register"}
        </Button>
        <Button
          variant="outline"
          onClick={handleEnrichVisible}
          title="Auto-fill missing website/phone/email/address for visible agencies via Google + AI."
        >
          <Sparkles className="w-4 h-4 mr-2" /> Enrich missing
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const ids = new Set<string>((filtered as any[]).map((r: any) => r.id));
            setBulkSel((cur) => (cur.size === ids.size ? new Set() : ids));
          }}
          title="Select every visible agency (directory + your additions). Agencies missing an email will prompt you to add one before sending."
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {bulkSel.size > 0 ? `${bulkSel.size} selected` : "Select all visible"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setUploadOpen(true)}
          title="Upload Excel/CSV/HTML list — auto-classifies real-estate brokerages vs developers vs mortgage brokers, dedups by name + DLD number, and reroutes mis-categorised rows."
        >
          <Plus className="w-4 h-4 mr-2" />Upload list
        </Button>
        <Button
          variant="gold"
          className="shadow-md"
          onClick={() => {
            if (bulkSel.size === 0) { toast.error("Tick at least one agency first"); return; }
            setBulkOpen(true);
          }}
          title="Open the brokerage outreach send dialog for the ticked agencies"
        >
          <Send className="w-4 h-4 mr-2" />
          Send Selected Agencies
          {bulkSel.size > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[#1A1A1A]/15 text-[10px] font-bold">
              {bulkSel.size}
            </span>
          )}
        </Button>
        <OutreachActionsMenu
          selectedCount={bulkSel.size}
          sendLabel="Email Selected Agencies"
          onSendSelected={() => {
            if (bulkSel.size === 0) { toast.error("Tick at least one agency first"); return; }
            setBulkOpen(true);
          }}
          onEditTemplate={() => setTplOpen(true)}
          onSendTest={() => setTestSendOpen(true)}
          onActivityLog={() => navigate("/owner/crm/relationships/activity")}
        />
        <Button variant="outline" onClick={handleSyncNow} disabled={syncing} title="Pull latest agency replies from your inbox now">
          {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
          {syncing ? "Syncing…" : "Sync Inbox"}
        </Button>
        <Button variant="gold" onClick={openNew} className="shadow-md"><Plus className="w-4 h-4 mr-2" />Add Brokerage</Button>
      </div>

      {/* Source filter chips — upload_source / database_source / country / team / campaign */}
      <SourceFilterChips
        rows={data as any[]}
        axes={["upload_source", "database_source", "country", "team", "campaign"]}
        value={sourceFilter}
        onChange={setSourceFilter}
      />

      <BulkUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} kind="brokerage" onDone={refetch} defaultListId={listView.kind === "list" ? listView.listId : null} />

      {sourceTab === "owner" && (
        <>
          <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-3 text-xs text-[#1A1A1A]/80">
            <b className="text-[#1A1A1A]">My Additions</b> — every agency you add lands here automatically. Card view and Excel view are both shown below.
          </div>
          <ExcelGridView
            rows={filtered as any[]}
            columns={[
              { key: "company_name", label: "Agency", width: 220 },
              { key: "emirate", label: "Emirate / City", width: 140, editable: true },
              { key: "office_location", label: "Office", width: 200, editable: true },
              {
                key: "registration_status", label: "Agency status", width: 200, status: true,
                statusOptions: BROKERAGE_REGISTRATION_STATUS_OPTIONS.map(({ value, label }) => ({ value, label })),
                onStatusChange: (r: any, next) => upsert.mutate({ id: r.id, registration_status: next }),
              },
              {
                key: "outreach_stage", label: "Outreach", width: 170, status: true,
                statusOptions: AGENCY_STATUS_OPTIONS.map(({ value, label }) => ({ value, label })),
                onStatusChange: (r: any, next) => upsert.mutate({ id: r.id, outreach_stage: next }),
              },
              { key: "phone", label: "Phone", width: 150, editable: true },
              { key: "email", label: "Email", width: 220, editable: true },
              { key: "notes", label: "Notes", width: 260, editable: true },
            ]}
            onCellEdit={(r: any, key, value) => upsert.mutate({ id: r.id, [key]: value })}
            emptyLabel="No additions yet — click Add Brokerage."
          />
        </>
      )}

      {viewMode === "excel" && sourceTab !== "owner" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  const res = await fetch(
                    `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/crm-export`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.access_token ?? ""}`,
                      },
                      body: JSON.stringify({ scope: "all", format: "csv" }),
                    }
                  );
                  if (!res.ok) throw new Error(await res.text());
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `crm-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                  toast.success("Exported unified CRM contacts");
                } catch (e: any) {
                  toast.error(e?.message || "Export failed");
                }
              }}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[#B89555]/40 bg-[#EFE6D6] text-[#1A1A1A] text-sm font-medium hover:bg-[#E7DCC7]"
            >
              Export contacts (CSV)
            </button>
            <ScanCardShortcut />
          </div>
          <UnifiedContactsPanel />
          <EmailQuotaCard />
          <BulkOutreachPanel brokerages={(filtered as any[]).map((b) => ({ id: b.id, name: b.company_name || b.name || "", email: b.email }))} />
          <BrokerageAnalyticsStrip rows={filtered as any[]} />
          <ExcelGridView
          rows={filtered as any[]}
          enableSelection
          enableReorder
          defaultFreezeColumns={1}
          onBulkDelete={async (ids) => {
            for (const id of ids) await del.mutateAsync(id);
            await refetch();
          }}
          expandable={{
            isExpandable: () => true,
            render: (r: any) => (
              <div className="grid md:grid-cols-4 gap-3 text-[12px] text-[#1A1A1A]">
                <div className="md:col-span-4 font-semibold text-[#1A1A1A] uppercase tracking-wide text-[11px]">
                  Contract — inline edit (saves immediately)
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-[#1A1A1A]/70">Contract status</span>
                  <select
                    className="h-8 px-2 rounded border border-[#B89555]/40 bg-white text-[#1A1A1A]"
                    value={r.contract_status || "none"}
                    onChange={(e) => upsert.mutate({ id: r.id, contract_status: e.target.value })}
                  >
                    {CONTRACT_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-[#1A1A1A]/70">Signed on</span>
                  <input
                    type="date"
                    className="h-8 px-2 rounded border border-[#B89555]/40 bg-white text-[#1A1A1A]"
                    defaultValue={r.contract_signed_at ? String(r.contract_signed_at).slice(0, 10) : ""}
                    onBlur={(e) => upsert.mutate({ id: r.id, contract_signed_at: e.target.value || null })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-[#1A1A1A]/70">Expires on</span>
                  <input
                    type="date"
                    className="h-8 px-2 rounded border border-[#B89555]/40 bg-white text-[#1A1A1A]"
                    defaultValue={r.contract_expires_at || ""}
                    onBlur={(e) => upsert.mutate({ id: r.id, contract_expires_at: e.target.value || null })}
                  />
                </label>
                <label className="flex flex-col gap-1 md:col-span-1">
                  <span className="text-[11px] text-[#1A1A1A]/70">Document URL</span>
                  <input
                    type="url"
                    placeholder="https://…"
                    className="h-8 px-2 rounded border border-[#B89555]/40 bg-white text-[#1A1A1A]"
                    defaultValue={r.contract_document_url || ""}
                    onBlur={(e) => upsert.mutate({ id: r.id, contract_document_url: e.target.value || null })}
                  />
                </label>
                {r.contract_document_url && (
                  <a
                    href={r.contract_document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="md:col-span-4 inline-block text-[11px] underline decoration-[#B89555] underline-offset-4 text-[#1A1A1A]"
                  >
                    Open contract document ↗
                  </a>
                )}
              </div>
            ),
          }}
          columns={[
            { key: "company_name", label: "Agency", width: 220 },
            { key: "country", label: "Country", width: 150, editable: true, render: (r: any) => r.country || "United Arab Emirates" },
            { key: "emirate", label: "Emirate / City", width: 130, editable: true },
            { key: "office_location", label: "Office", width: 180, editable: true },
            {
              key: "registration_status", label: "Registration", width: 180, status: true,
              statusOptions: BROKERAGE_REGISTRATION_STATUS_OPTIONS.map(({ value, label }) => ({ value, label })),
              onStatusChange: (r: any, next) => upsert.mutate({ id: r.id, registration_status: next }),
            },
            {
              key: "contract_status", label: "Contract", width: 170, status: true,
              statusOptions: CONTRACT_STATUS_OPTIONS.map(({ value, label }) => ({ value, label })),
              onStatusChange: (r: any, next) => upsert.mutate({ id: r.id, contract_status: next }),
            },
            {
              key: "attendance_health", label: "Attendance", width: 140, status: true,
              statusOptions: ATTENDANCE_STATUS_OPTIONS.map(({ value, label }) => ({ value, label })),
              getStatus: (r: any) => attendanceBucket(attendanceCounts.data?.[r.id]?.total_attendance),
              onStatusChange: () => { /* derived; no-op */ },
            },
            {
              key: "outreach_stage", label: "Agency status", width: 170, status: true,
              statusOptions: AGENCY_STATUS_OPTIONS.map(({ value, label }) => ({ value, label })),
              onStatusChange: (r: any, next) => upsert.mutate({ id: r.id, outreach_stage: next }),
            },
            { key: "active_broker_count", label: "Active brokers", width: 120, align: "right", editable: true },
            { key: "primary_contact", label: "Admin name", width: 160, render: (r: any) => r.admin_contact?.name || r.primary_contact?.name || "—" },
            { key: "admin_phone", label: "Admin number", width: 150, render: (r: any) => r.admin_contact?.phone || r.primary_contact?.phone || r.phone || "—" },
            { key: "phone", label: "Phone", width: 140, editable: true },
            { key: "email", label: "Email", width: 220, editable: true },
            { key: "briefings_attended", label: "Briefings attended", width: 130, align: "right", readOnly: true, render: (r: any) => attendanceCounts.data?.[r.id]?.briefing_count ?? 0 },
            { key: "breakfasts_attended", label: "Breakfasts attended", width: 140, align: "right", readOnly: true, render: (r: any) => attendanceCounts.data?.[r.id]?.breakfast_count ?? 0 },
            { key: "total_attendance", label: "Total attendance", width: 130, align: "right", readOnly: true, render: (r: any) => attendanceCounts.data?.[r.id]?.total_attendance ?? 0 },
            { key: "last_briefing_at", label: "Last briefing", width: 130, render: (r: any) => attendanceCounts.data?.[r.id]?.last_briefing_date ? new Date(attendanceCounts.data[r.id].last_briefing_date as string).toLocaleDateString() : "—" },
            { key: "last_breakfast_at", label: "Last breakfast", width: 130, render: (r: any) => attendanceCounts.data?.[r.id]?.last_breakfast_date ? new Date(attendanceCounts.data[r.id].last_breakfast_date as string).toLocaleDateString() : "—" },
            { key: "last_outreach_at", label: "Last contact", width: 130, render: (r: any) => r.last_contact_log_at ? new Date(r.last_contact_log_at).toLocaleDateString() : (r.last_outreach_at ? new Date(r.last_outreach_at).toLocaleDateString() : "—") },
            { key: "deal_count_cached", label: "Deals", width: 80, align: "right" },
            { key: "inquiry_count", label: "Inquiries", width: 90, align: "right" },
            { key: "notes", label: "Notes", width: 280, editable: true },
          ]}
          onCellEdit={(r: any, key, value) => {
            const numericKeys = ["active_broker_count"];
            let v: any = value;
            if (numericKeys.includes(String(key))) v = Number(value) || 0;
            upsert.mutate({ id: r.id, [key]: v });
          }}
          emptyLabel="No agencies match filters."
          />
        </div>
      ) : isLoading ? <Skeleton className="h-64" /> : filtered.length === 0 ? (
        data.length > 0 ? (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-amber-900 font-semibold mb-2">
                {data.length} agencies in your directory — but none match your current filters.
              </div>
              <div className="text-xs text-amber-800 mb-3">
                Active filters: {sourceTab !== "all" ? `Source: ${sourceTab} · ` : ""}{emirateFilter !== "all" ? `Emirate: ${emirateFilter} · ` : ""}{statusFilter !== "all" ? `Status: ${statusFilter} · ` : ""}{debouncedQ ? `Search: "${debouncedQ}"` : ""}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setQ(""); setSourceTab("all"); setEmirateFilter("all"); setCountryFilter("all"); setStatusFilter("all"); }}
              >
                Reset all filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card><CardContent className="p-8 text-center text-[#1A1A1A]/70">No brokerages match these filters. Try clearing filters or click <b className="text-[#1A1A1A]">Add Brokerage</b>.</CardContent></Card>
        )
      ) : (
        <div className="grid gap-3">
          {visible.map((r: any) => {
            const isDirectory = r.entry_source === "directory";
            const isExistingMatch = r.entry_source === "owner" && r.is_existing_match;
            return (
            <Card key={r.id} className={`bg-[#FDFBF7] text-[#1A1A1A] border hover:shadow-lg transition rounded-2xl ${
 isDirectory ? "border-l-4 border-l-[#B89555] border-y-[#1A1A1A]/10 border-r-[#1A1A1A]/10" : "border-[#1A1A1A]/10 hover:border-[#1A1A1A]/20"
 }`}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Checkbox
                    checked={bulkSel.has(r.id)}
                    onCheckedChange={() => {
                      const hasEmail = !!(r.primary_contact?.email || r.email || r.admin_contact?.email);
                      if (!hasEmail && !bulkSel.has(r.id)) {
                        toast.message("Add an email to this agency first", {
                          description: "Open Edit and add an admin email so we know where to send the outreach.",
                        });
                        openEdit(r);
                        return;
                      }
                      toggleBulk(r.id);
                    }}
                    className="mt-1"
                    aria-label={`Select ${r.company_name} for bulk outreach`}
                  />
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setLedgerOpen({ id: r.id, name: r.company_name })}
                        className="font-bold text-base text-[#1A1A1A] hover:underline decoration-[#B89555] underline-offset-4 text-left"
                        title="View deal ledger and revenue"
                      >
                        {r.company_name}
                      </button>
                      {/* "UAE Real Estate Agency" pill removed — the whole tab is brokerages already. */}
                      {isExistingMatch && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]">Verified Match</span>
                      )}
                      {!isDirectory && !isExistingMatch && r.entry_source === "owner" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1A1A1A] text-white">My Addition</span>
                      )}
                      <InlineStatusSelect entityType="brokerage" id={r.id} value={r.status} options={STATUS_BROKERAGE} />
                      {r.attended_briefing && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full jj-emerald-soft text-[color:var(--emerald-1)] border border-[color:var(--emerald-1)]/30 inline-flex items-center gap-1"
                          title={r.briefing_notes || "Attended breakfast briefing"}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Attended {r.attended_briefing_date
                            ? new Date(r.attended_briefing_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                            : ""}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#1A1A1A]/70 space-y-0.5">
                      {r.emirate && <div className="font-medium text-[#1A1A1A]">{r.emirate}</div>}
                      {r.primary_contact?.name && (
                        <div className="font-medium text-[#1A1A1A]">
                          Primary: {r.primary_contact.name}{r.primary_contact.role ? ` · ${r.primary_contact.role}` : ""}
                        </div>
                      )}
                      {r.secondary_contact?.name && (
                        <div className="font-medium text-[#1A1A1A]">
                          Secondary: {r.secondary_contact.name}{r.secondary_contact.role ? ` · ${r.secondary_contact.role}` : ""}
                        </div>
                      )}
                    </div>

                    {/* Clickable contact row */}
                    <BrokerageContactLinks r={r} />

                    {/* KPI strip — Agents (single) + Top Closer + activity */}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-6 gap-2">
                      {[
                        { label: "Rating", value: r.star_rating ? `★ ${Number(r.star_rating).toFixed(1)}` : "—" },
                        { label: "Agents", value: r.estimated_agent_count ? `~${r.estimated_agent_count}` : "—" },
                        { label: "Top Closer", value: (Array.isArray(r.top_active_agents) && r.top_active_agents[0]?.name) ? `${r.top_active_agents[0].name}${r.top_active_agents[0].deals_count ? ` · ${r.top_active_agents[0].deals_count}` : ""}` : "—" },
                        { label: "Inquiries", value: r.inquiry_count || 0 },
                        { label: "Deals", value: r.deal_count_cached || r.deal_count || 0 },
                        { label: "Last Deal", value: r.last_deal_at ? new Date(r.last_deal_at).toLocaleDateString() : "—" },
                      ].map((k) => (
                        <div key={k.label} className="rounded-lg bg-[#F7F2EA] border border-[#B89555]/30 px-2 py-1.5">
                          <div className="text-[9px] uppercase tracking-wider text-[#1A1A1A]/70 font-semibold">{k.label}</div>
                          <div className="text-sm font-bold text-[#1A1A1A] truncate">{k.value}</div>
                        </div>
                      ))}
                    </div>

                    {r.ai_next_action && (
                      <div className="mt-2 p-2 bg-[#F7F2EA] border border-[#B89555]/40 rounded text-xs">
                        <Sparkles className="w-3 h-3 inline mr-1 text-[#B89555]" />
                        <span className="font-medium text-[#1A1A1A]">{r.ai_next_action}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-start">
                    <LeadAIStar entityType="brokerage" entityId={r.id} entityName={r.company_name} />
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={() => { setBulkSel(new Set([r.id])); setBulkOpen(true); }}
                      title="Preview & send outreach to this brokerage (test send to me first)"
                    >
                      <Send className="w-3 h-3 mr-1" />Message
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => aiRecommend("brokerage", r.id, refetch)}>
                      <Sparkles className="w-3 h-3 mr-1" />AI
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => quickReminder(r)}>
                      <Bell className="w-3 h-3 mr-1" />Remind
                    </Button>
                    <QuickActivityActions
                      entityType="brokerage"
                      entityId={r.id}
                      entityName={r.company_name}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setLedgerOpen({ id: r.id, name: r.company_name })}
                      title="View deal history & revenue"
                    >
                      <Trophy className="w-3 h-3 mr-1" />Deals
                    </Button>
                    {!isDirectory && (
                      <>
                        <Button size="sm" variant="gold" onClick={() => setDealOpen({ id: r.id, name: r.company_name })}>
                          <Trophy className="w-3 h-3 mr-1" />Register Deal
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Button>
                        <Button size="sm" variant="secondary" onClick={() => { if (confirm("Delete?")) del.mutate(r.id); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );})}
          {visible.length < filtered.length && (
            <div className="flex items-center justify-center py-4">
              <Button variant="outline" onClick={() => setVisibleCount((n) => n + 60)}>
                Show more · {filtered.length - visible.length} remaining
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Add"} Brokerage</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Company name *"><Input value={editing.company_name || ""} onChange={(e) => setEditing({ ...editing, company_name: e.target.value })} /></Field>
                
                <Field label="Office location"><Input value={editing.office_location || ""} onChange={(e) => setEditing({ ...editing, office_location: e.target.value })} /></Field>
                <Field label="Google Maps URL"><Input placeholder="https://maps.google.com/…" value={editing.office_map_url || ""} onChange={(e) => setEditing({ ...editing, office_map_url: e.target.value })} /></Field>
                <Field label="Website"><Input value={editing.website || ""} onChange={(e) => setEditing({ ...editing, website: e.target.value })} /></Field>
                <Field label="Instagram URL"><Input placeholder="https://instagram.com/…" value={editing.instagram_url || ""} onChange={(e) => setEditing({ ...editing, instagram_url: e.target.value })} /></Field>
                <Field label="Agents (count)"><Input type="number" value={editing.estimated_agent_count || 0} onChange={(e) => setEditing({ ...editing, estimated_agent_count: +e.target.value })} /></Field>
                <Field label="Status">
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_BROKERAGE.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Deal count"><Input type="number" value={editing.deal_count || 0} onChange={(e) => setEditing({ ...editing, deal_count: +e.target.value })} /></Field>
                <Field label="Represented developer (sender)">
                  <Input placeholder="e.g. Emaar, DAMAC, Sobha" value={editing.represented_developer_name || ""} onChange={(e) => setEditing({ ...editing, represented_developer_name: e.target.value })} />
                </Field>
              </div>
              <div className="border-t pt-3">
                <div className="text-sm font-semibold mb-2">Top active agents (closing with us)</div>
                <TopAgentsEditor
                  value={Array.isArray(editing.top_active_agents) ? editing.top_active_agents : []}
                  onChange={(v) => setEditing({ ...editing, top_active_agents: v })}
                />
              </div>
              <div className="border-t pt-3"><div className="text-sm font-semibold mb-2">Primary Contact</div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Name" value={editing.primary_contact?.name || ""} onChange={(e) => setEditing({ ...editing, primary_contact: { ...editing.primary_contact, name: e.target.value } })} />
                  <Input placeholder="Role" value={editing.primary_contact?.role || ""} onChange={(e) => setEditing({ ...editing, primary_contact: { ...editing.primary_contact, role: e.target.value } })} />
                  <Input placeholder="Email" value={editing.primary_contact?.email || ""} onChange={(e) => setEditing({ ...editing, primary_contact: { ...editing.primary_contact, email: e.target.value } })} />
                  <Input placeholder="Phone" value={editing.primary_contact?.phone || ""} onChange={(e) => setEditing({ ...editing, primary_contact: { ...editing.primary_contact, phone: e.target.value } })} />
                  <Input placeholder="WhatsApp" value={editing.primary_contact?.whatsapp || ""} onChange={(e) => setEditing({ ...editing, primary_contact: { ...editing.primary_contact, whatsapp: e.target.value } })} />
                </div>
              </div>
              <div className="border-t pt-3"><div className="text-sm font-semibold mb-2">Admin / Owner contact (always present)</div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Admin name" value={editing.admin_contact?.name || ""} onChange={(e) => setEditing({ ...editing, admin_contact: { ...editing.admin_contact, name: e.target.value } })} />
                  <Input placeholder="Role (default: Managing Director)" value={editing.admin_contact?.role || ""} onChange={(e) => setEditing({ ...editing, admin_contact: { ...editing.admin_contact, role: e.target.value } })} />
                  <Input placeholder="Phone" value={editing.admin_contact?.phone || ""} onChange={(e) => setEditing({ ...editing, admin_contact: { ...editing.admin_contact, phone: e.target.value } })} />
                  <Input placeholder="WhatsApp" value={editing.admin_contact?.whatsapp || ""} onChange={(e) => setEditing({ ...editing, admin_contact: { ...editing.admin_contact, whatsapp: e.target.value } })} />
                  <Input placeholder="Email (optional)" value={editing.admin_contact?.email || ""} onChange={(e) => setEditing({ ...editing, admin_contact: { ...editing.admin_contact, email: e.target.value } })} />
                </div>
              </div>
              <div className="border-t pt-3">
                <BrokerageAgentsEditor value={agents} onChange={setAgents} brokerageId={editing.id} />
                <BrokerageContactPhotoImporter
                  brokerageId={editing.id}
                  brokerageName={editing.company_name}
                  onExtracted={(rows) => setAgents((cur) => [...cur, ...rows])}
                />
              </div>
              {editing.id && (
                <div className="border-t pt-3">
                  <AgencyAttendancePanel brokerageId={editing.id} brokerageName={editing.company_name || "Agency"} agents={agents} />
                </div>
              )}
              <div className="border-t pt-3">
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-[#B89555]" /> Contract
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contract status">
                    <Select
                      value={editing.contract_status || "none"}
                      onValueChange={(v) => setEditing({ ...editing, contract_status: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONTRACT_STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Signed at">
                    <Input type="date" value={editing.contract_signed_at ? String(editing.contract_signed_at).slice(0,10) : ""} onChange={(e) => setEditing({ ...editing, contract_signed_at: e.target.value || null })} />
                  </Field>
                  <Field label="Expires">
                    <Input type="date" value={editing.contract_expires_at || ""} onChange={(e) => setEditing({ ...editing, contract_expires_at: e.target.value || null })} />
                  </Field>
                  <Field label="Document URL">
                    <Input value={editing.contract_document_url || ""} onChange={(e) => setEditing({ ...editing, contract_document_url: e.target.value })} placeholder="https://…" />
                  </Field>
                </div>
              </div>
              <div className="border-t pt-3">
                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#B89555]" /> Breakfast briefing attendance
                </div>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <Field label="Attended briefing">
                    <div className="flex items-center gap-2 h-10">
                      <Switch
                        checked={!!editing.attended_briefing}
                        onCheckedChange={(v) => setEditing({
                          ...editing,
                          attended_briefing: v,
                          attended_briefing_date: v ? (editing.attended_briefing_date || new Date().toISOString().slice(0, 10)) : null,
                        })}
                      />
                      <span className="text-xs text-[#1A1A1A]/70">
                        {editing.attended_briefing ? "Marked as attended" : "Not yet attended"}
                      </span>
                    </div>
                  </Field>
                  <Field label="Date attended">
                    <Input
                      type="date"
                      value={editing.attended_briefing_date || ""}
                      disabled={!editing.attended_briefing}
                      onChange={(e) => setEditing({ ...editing, attended_briefing_date: e.target.value || null })}
                    />
                  </Field>
                </div>
                <Field label="Briefing notes">
                  <Textarea
                    rows={2}
                    placeholder="What was discussed, attendees, next step…"
                    value={editing.briefing_notes || ""}
                    onChange={(e) => setEditing({ ...editing, briefing_notes: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Notes"><Textarea rows={3} value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!editing?.company_name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkSendDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        selected={data.filter((r: any) => bulkSel.has(r.id))}
        defaultTestEmail={ownerSettings?.cc_email || "infoo.jane@gmail.com"}
        entityType="brokerage"
      />

      <TemplateEditorDialog open={tplOpen} onOpenChange={setTplOpen} mode="brokerage" />
      <TestSendDialog open={testSendOpen} onOpenChange={setTestSendOpen} mode="brokerage" variant="brokerage_partnership_intro" />

      {dealOpen && (
        <BrokerageDealModal
          open={!!dealOpen}
          onOpenChange={(v) => !v && setDealOpen(null)}
          brokerageId={dealOpen.id}
          brokerageName={dealOpen.name}
          onSaved={() => refetch()}
        />
      )}
      {ledgerOpen && (
        <BrokerageLedgerDialog
          open={!!ledgerOpen}
          onOpenChange={(v) => !v && setLedgerOpen(null)}
          brokerageId={ledgerOpen.id}
          brokerageName={ledgerOpen.name}
        />
      )}

      <ExportConfigurator
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        totalVisible={(filtered as any[]).length}
        totalSelected={bulkSel.size}
        totalAll={(data as any[]).length}
        columns={BROKERAGE_EXPORT_COLUMNS.map((c) => ({ key: c.key as string, label: c.label, group: c.group, defaultOn: c.defaultOn }))}
        presets={BROKERAGE_EXPORT_PRESETS}
        storageKey="export.brokerages.columns"
        statusFilters={[
          { key: "not_contacted", label: "Not contacted" },
          { key: "attempted", label: "Attempted" },
          { key: "engaged", label: "Engaged" },
          { key: "meeting_booked", label: "Meeting booked" },
          { key: "active_partner", label: "Active partner" },
          { key: "dormant", label: "Dormant" },
          { key: "declined", label: "Declined" },
        ]}
        onExport={handleExportConfigured}
      />

      <UnifiedCRMExportModal
        open={unifiedExportOpen}
        onOpenChange={setUnifiedExportOpen}
        kind="brokerages"
        rows={filtered as any[]}
        filenameStem="crm-brokerages"
      />
    </div>
    </TooltipProvider>
  );
};

/* ===========================================================
   Clients
=========================================================== */
const ClientsTab = () => {
  const { data = [], isLoading, refetch } = useClients();
  const upsert = useUpsertClient();
  const del = useDeleteClient();
  const upsertReminder = useUpsertReminder();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [unifiedExportOpen, setUnifiedExportOpen] = useState(false);

  const filtered = useMemo(() => data.filter((r: any) => {
    const matchesQ = !q || r.full_name?.toLowerCase().includes(q.toLowerCase()) || r.email?.toLowerCase()?.includes(q.toLowerCase());
    const matchesS = statusFilter === "all" || r.status === statusFilter;
    return matchesQ && matchesS;
  }), [data, q, statusFilter]);

  const openNew = () => { setEditing({ status: "lead", is_company: false, currency: "AED" }); setOpen(true); };
  const openEdit = (r: any) => { setEditing(r); setOpen(true); };
  const save = async () => { await upsert.mutateAsync(editing); setOpen(false); };

  const quickReminder = (c: any) => {
    const due = new Date(); due.setDate(due.getDate() + 7);
    upsertReminder.mutate({
      kind: "follow_up", title: `Follow up with ${c.full_name}`,
      body: "Check engagement and next steps.", due_at: due.toISOString(), client_id: c.id,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/70" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client" className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_CLIENT.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setUnifiedExportOpen(true)} disabled={!filtered.length}>
          <Download className="w-4 h-4 mr-2" />Export CSV
        </Button>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Client</Button>
      </div>

      <UnifiedCRMExportModal
        open={unifiedExportOpen}
        onOpenChange={setUnifiedExportOpen}
        kind="leads"
        rows={filtered as any[]}
        filenameStem="crm-clients"
      />

      {isLoading ? <Skeleton className="h-64" /> : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[#1A1A1A]/70">No clients yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r: any) => (
            <Card key={r.id} className="bg-[#FDFBF7] text-[#1A1A1A] border border-[#1A1A1A]/10 hover:shadow-lg hover:border-[#1A1A1A]/20 transition rounded-2xl">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base text-[#1A1A1A]">{r.full_name}{r.is_company && r.company_name ? ` (${r.company_name})` : ""}</h3>
                      <InlineStatusSelect entityType="client" id={r.id} value={r.status} options={STATUS_CLIENT} />
                    </div>
                    <div className="text-xs text-[#1A1A1A]/70 space-y-0.5">
                      {r.email && <div>{r.email}</div>}
                      {r.phone && <div>{r.phone}</div>}
                      {(r.budget_min || r.budget_max) && <div>Budget: {r.currency} {(r.budget_min || 0).toLocaleString()} – {(r.budget_max || 0).toLocaleString()}</div>}
                      {r.nationality && <div>Nationality: {r.nationality}</div>}
                    </div>
                    {r.ai_next_action && (
                      <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                        <Sparkles className="w-3 h-3 inline mr-1 text-purple-600" />
                        <span className="font-medium text-purple-900">{r.ai_next_action}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => aiRecommend("client", r.id, refetch)}><Sparkles className="w-3 h-3 mr-1" />AI</Button>
                    <Button size="sm" variant="outline" onClick={() => quickReminder(r)}><Bell className="w-3 h-3 mr-1" />Remind</Button>
                    <QuickActivityActions entityType="client" entityId={r.id} entityName={r.full_name} />
                    <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete?")) del.mutate(r.id); }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Add"} Client</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full name *"><Input value={editing.full_name || ""} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></Field>
                <Field label="Company name"><Input value={editing.company_name || ""} onChange={(e) => setEditing({ ...editing, company_name: e.target.value, is_company: !!e.target.value })} /></Field>
                <Field label="Email"><Input value={editing.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
                <Field label="Phone"><Input value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
                <Field label="WhatsApp"><Input value={editing.whatsapp || ""} onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })} /></Field>
                <Field label="Nationality"><Input value={editing.nationality || ""} onChange={(e) => setEditing({ ...editing, nationality: e.target.value })} /></Field>
                <Field label="Source"><Input value={editing.source || ""} onChange={(e) => setEditing({ ...editing, source: e.target.value })} placeholder="Referral, IG, broker…" /></Field>
                <Field label="Assigned broker"><Input value={editing.assigned_broker || ""} onChange={(e) => setEditing({ ...editing, assigned_broker: e.target.value })} /></Field>
                <Field label="Status">
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_CLIENT.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Budget min"><Input type="number" value={editing.budget_min || ""} onChange={(e) => setEditing({ ...editing, budget_min: e.target.value ? +e.target.value : null })} /></Field>
                <Field label="Budget max"><Input type="number" value={editing.budget_max || ""} onChange={(e) => setEditing({ ...editing, budget_max: e.target.value ? +e.target.value : null })} /></Field>
                <Field label="Birthday"><Input type="date" value={editing.birthday || ""} onChange={(e) => setEditing({ ...editing, birthday: e.target.value || null })} /></Field>
              </div>
              <Field label="Notes"><Textarea rows={3} value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!editing?.full_name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ===========================================================
   Developer Registry
=========================================================== */
const DocumentPackPanel = React.memo(({ context = "developer" }: { context?: "brokerage" | "developer" } = {}) => {
  const { data: settings, isLoading } = useOwnerSettings();
  const upsert = useUpsertOwnerSettings();
  const [draft, setDraft] = useState<any>(null);
  const s: any = draft || settings || {};
  const dirty = !!draft;

  const update = (patch: any) => setDraft({ ...(draft || settings || {}), ...patch });
  const save = async () => { await upsert.mutateAsync(draft); setDraft(null); };

  // Auto-save sender/CC chip changes (no Save click needed). Other fields
  // (drive URL, from name) keep the explicit Save button.
  const autoSave = React.useCallback(async (patch: any) => {
    try {
      await upsert.mutateAsync(patch);
    } catch (e) {
      console.error("[DocumentPackPanel] auto-save failed", e);
    }
  }, [upsert]);

  // Field aliases — brokerage and developer packs are independent.
  const isBrk = context === "brokerage";
  const F = {
    drive: isBrk ? "brokerage_drive_doc_pack_url" : "drive_doc_pack_url",
    fromName: isBrk ? "brokerage_from_name" : "from_name",
    savedSenders: isBrk ? "brokerage_saved_sender_emails" : "saved_sender_emails",
    replyTo: isBrk ? "brokerage_reply_to_email" : "reply_to_email",
    savedCc: isBrk ? "brokerage_saved_cc_emails" : "saved_cc_emails",
    activeCc: isBrk ? "brokerage_active_cc_emails" : "active_cc_emails",
    attachments: isBrk ? "attachments_brokerage" : "attachments_developer",
    workflows: isBrk ? "workflow_templates_brokerage" : "workflow_templates_developer",
  };
  const attachments: Array<{ label: string; url: string }> = Array.isArray(s[F.attachments]) ? s[F.attachments] : [];
  const workflows: Array<{ label: string; url: string }> = Array.isArray(s[F.workflows]) ? s[F.workflows] : [];

  const driveUrl: string = s[F.drive] || "";
  const savedSenders: string[] = Array.isArray(s[F.savedSenders]) ? s[F.savedSenders] : [];
  const replyTo: string = s[F.replyTo] || "";
  const savedCc: string[] = Array.isArray(s[F.savedCc]) ? s[F.savedCc] : [];
  const activeCc: string[] = Array.isArray(s[F.activeCc]) ? s[F.activeCc] : [];

  const headerTitle = isBrk
    ? "Brokerage Outreach Pack — Amra · CITI Developers"
    : "Developer Registration Pack & Outreach Settings";
  const lead = isBrk
    ? "Independent of the developer pack. This drive link, senders and CCs are used ONLY for brokerage partnership outreach (sent by Amra for CITI Developers)."
    : "Used ONLY for developer registrations. Drop in your Trade Licence + RERA + MOU pack and pick the senders + CCs.";

  const collapseKey = `crm.pack.${context}.collapsed`;
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(collapseKey) === "true";
  });
  useEffect(() => {
    try { localStorage.setItem(collapseKey, String(collapsed)); } catch { /* noop */ }
  }, [collapsed, collapseKey]);

  if (isLoading) return <Skeleton className="h-32" />;

  return (
    <Card className="bg-[#FDFBF7] border border-[#1A1A1A]/10 rounded-2xl">
      <CardContent className="p-5">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="w-full flex items-center justify-between gap-2 mb-3 text-left"
          aria-expanded={!collapsed}
        >
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-[#1A1A1A]" />
            <h3 className="font-semibold text-[#1A1A1A]">{headerTitle}</h3>
          </div>
          <span className="text-[11px] text-[#1A1A1A]/70 underline">
            {collapsed ? "Expand" : "Collapse"}
          </span>
        </button>
        {collapsed ? null : (<>
        <p className="text-xs text-[#1A1A1A]/70 mb-4">{lead}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label className="text-xs text-[#1A1A1A] mb-1 block">
              Google Drive document pack URL *
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={driveUrl}
                  onChange={(e) => update({ [F.drive]: e.target.value })}
                  className="w-full"
                />
              </div>
              {driveUrl && /^https?:\/\//i.test(driveUrl) ? (
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 h-10 rounded-md bg-[#EFE6D6] border border-[#B89555]/60 text-[#1A1A1A] text-sm font-semibold hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] whitespace-nowrap shrink-0"
                >
                  Open Pack ↗
                </a>
              ) : null}
            </div>
            {driveUrl && !/^https?:\/\//i.test(driveUrl) && (
              <p className="text-xs text-red-600 mt-1">Paste a full https://drive.google.com/… link.</p>
            )}
          </div>
          <div>
            <Label className="text-xs text-[#1A1A1A] mb-1 block">From name</Label>
            <Input
              value={s[F.fromName] || ""}
              onChange={(e) => update({ [F.fromName]: e.target.value })}
              placeholder={isBrk ? "Amra · CITI Developers" : "JBJ Global Real Estate"}
            />
          </div>
          {isBrk && (
            <div className="md:col-span-2">
              <Label className="text-xs text-[#1A1A1A] mb-1 block">
                Google Calendar appointment link (required for breakfast invites)
              </Label>
              <Input
                value={s.google_calendar_booking_url || ""}
                onChange={(e) => update({ google_calendar_booking_url: e.target.value })}
                placeholder="https://calendar.app.google/…"
              />
              {s.google_calendar_booking_url && /jbj\.ae|\/breakfast-booking/i.test(String(s.google_calendar_booking_url)) && (
                <p className="text-xs text-red-600 mt-1">
                  This link points to jbj.ae and will be REJECTED on send. Paste your Google Calendar appointment link (https://calendar.app.google/…) instead.
                </p>
              )}
              <p className="text-xs text-[#1A1A1A]/70 mt-1">
                Brokerages book directly on your dedicated breakfast Google Calendar — Google emails the confirmation. Bookings sync into the backend automatically; the brokerage never visits jbj.ae.
              </p>
            </div>
          )}
          <div className="md:col-span-2">
            <Label className="text-xs text-[#1A1A1A] mb-1 block">Primary sender email (Reply-to)</Label>
            <PrimarySenderEditor
              saved={savedSenders}
              active={replyTo}
              onChange={({ saved, active }) => {
                const patch = { [F.savedSenders]: saved, [F.replyTo]: active };
                // Reflect immediately + persist without requiring Save click.
                setDraft({ ...(draft || settings || {}), ...patch });
                autoSave(patch);
              }}
            />
            <p className="text-xs text-[#1A1A1A]/70 mt-1">
              Add as many sender emails as you like — they're saved automatically. Click any chip to use it as the active sender.
            </p>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs text-[#1A1A1A] mb-1 block">CC emails</Label>
            <CcListEditor
              saved={savedCc}
              active={activeCc}
              onChange={({ saved, active }) => {
                const patch: any = { [F.savedCc]: saved, [F.activeCc]: active };
                if (!isBrk) {
                  patch.cc_email = active[0] || s.cc_email || "";
                  patch.cc_jane_enabled = active.length > 0;
                }
                setDraft({ ...(draft || settings || {}), ...patch });
                autoSave(patch);
              }}
            />
            <p className="text-xs text-[#1A1A1A]/70 mt-1">
              CC addresses are saved automatically and will appear here on every send. Click a chip to toggle, or the trash icon to remove permanently.
            </p>
          </div>
          <OutreachAttachmentsEditor
            context={isBrk ? "brokerage" : "developer"}
            attachments={attachments}
            workflows={workflows}
            onChange={(patch) => {
              const next: any = {};
              if (patch.attachments) next[F.attachments] = patch.attachments;
              if (patch.workflows) next[F.workflows] = patch.workflows;
              setDraft({ ...(draft || settings || {}), ...next });
              autoSave(next);
            }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-[#1A1A1A]/10">
          <div className="text-[11px] text-[#1A1A1A]/70">
            {isBrk
              ? "Edit the briefing + breakfast email template, or send yourself a test before launching."
              : "Edit the developer registration template, or send yourself a test before launching."}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent(isBrk ? "crm:open-brokerage-template" : "crm:open-developer-template"))}
              className="border-[#1A1A1A]/20 text-[#1A1A1A] hover:bg-[#EFE6D6]"
            >
              Open template editor
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent(isBrk ? "crm:open-brokerage-test" : "crm:open-developer-test"))}
              className="border-[#1A1A1A]/20 text-[#1A1A1A] hover:bg-[#EFE6D6]"
            >
              Send test email
            </Button>
            {dirty && (
              <>
                <Button variant="outline" size="sm" onClick={() => setDraft(null)}>Cancel</Button>
                <Button size="sm" onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving…" : "Save settings"}</Button>
              </>
            )}
          </div>
        </div>
        </>)}
      </CardContent>
    </Card>
  );
});
DocumentPackPanel.displayName = "DocumentPackPanel";

const DeveloperRegistryTab = () => {
  const navigate = useNavigate();
  const [testSendOpen, setTestSendOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [unifiedExportOpen, setUnifiedExportOpen] = useState(false);
  const [statusView, setStatusView] = useState<"all" | "contracts">("all");
  const { data = [], isLoading, refetch } = useDeveloperRegistry();
  const { data: settings } = useOwnerSettings();
  const seed = useSeedDeveloperRegistry();
  const importAll = useImportAllDevelopersToRegistry();
  const enrich = useEnrichDeveloperRegistry();
  const upsert = useUpsertDeveloperRegistry();
  const upsertReminder = useUpsertReminder();
  const sendRegistration = useSendDeveloperRegistration();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => { const t = setTimeout(() => setDebouncedQ(q), 220); return () => clearTimeout(t); }, [q]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResetting, setBulkResetting] = useState(false);
  const [emailFilter, setEmailFilter] = useState<"all" | "not_sent" | "sent" | "registered">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirmRegOpen, setConfirmRegOpen] = useState(false);
  const [confirmRegBulkOpen, setConfirmRegBulkOpen] = useState(false);
  const [confirmRegSelected, setConfirmRegSelected] = useState<any[]>([]);
  const [tplOpen, setTplOpen] = useState(false);
  const [noteEditing, setNoteEditing] = useState<string | null>(null);
  useEffect(() => {
    const openTpl = () => setTplOpen(true);
    const openTest = () => setTestSendOpen(true);
    window.addEventListener("crm:open-developer-template", openTpl);
    window.addEventListener("crm:open-developer-test", openTest);
    return () => {
      window.removeEventListener("crm:open-developer-template", openTpl);
      window.removeEventListener("crm:open-developer-test", openTest);
    };
  }, []);
  const [subTab, setSubTab] = useState<"queue" | "history" | null>(null);
  const [historyTab, setHistoryTab] = useState<any>(undefined);
  // Smart routing: clicking a status tile/chip routes to the correct sub-tab automatically
  // so the user is never left staring at an empty pool.
  const selectStatus = (v: string) => {
    if (v === "all") { setStatusFilter("all"); setSubTab("queue"); setHistoryTab(undefined); return; }
    if (v === "registered") { setStatusFilter("all"); setSubTab("history"); setHistoryTab("registered"); return; }
    if (v === "contracts") { setStatusView(statusView === "contracts" ? "all" : "contracts"); setSubTab("queue"); return; }
    // queue-pool statuses
    setStatusFilter(statusFilter === v ? "all" : v);
    setSubTab("queue");
    setHistoryTab(undefined);
  };
  const [devExcludedIds, setDevExcludedIds] = useState<Set<string>>(new Set());
  const [devViewMode, setDevViewMode] = useState<"cards" | "excel">("cards");
  const [devListView, setDevListView] = useState<CRMListView>({ kind: "active", listId: null });
  const devQc = useQueryClient();
  const onDevListChanged = () => {
    devQc.invalidateQueries({ queryKey: ["crm-dev-registry"] });
    refetch();
  };
  const devListCounts = useMemo(() => {
    let active = 0, junk = 0, trash = 0;
    const perList: Record<string, number> = {};
    for (const r of data as any[]) {
      if (r.deleted_at) { trash++; continue; }
      if (r.is_junk) { junk++; continue; }
      active++;
      if (r.list_id) perList[r.list_id] = (perList[r.list_id] || 0) + 1;
    }
    return { active, junk, trash, perList };
  }, [data]);
  const [queueCollapsed, setQueueCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("crm.queue.collapsed") !== "false";
  });
  useEffect(() => {
    try { localStorage.setItem("crm.queue.collapsed", String(queueCollapsed)); } catch {}
  }, [queueCollapsed]);
  const quickStatus = useQuickStatusUpdate();
  const { data: tplMain } = useEmailTemplate("developer_registration");
  const { data: ownerSettings } = useOwnerSettings();

  // Outreach Queue = every non-registered developer (Not Started, Pending Application,
  // Documents Required, Under Review, Rejected, Expired). The previous rule used
  // `!last_outreach_at` which incorrectly hid the 24 Pending Application records as
  // soon as a first email had been sent. Sent History keeps everything that has
  // received an email plus all Registered developers.
  // Mutually exclusive pools — a developer never appears in both tabs.
  // See `src/lib/crm/developerPools.ts` for the canonical rules and unit
  // tests that guarantee `pending_application` developers without an email
  // always stay in the Outreach Queue.
  // Single pass: split data into history vs queue pools so we don't iterate twice.
  const { historyPool, queuePool } = useMemo(() => {
    const history: any[] = [], queue: any[] = [];
    for (const r of data as any[]) {
      if (isInHistoryPool(r)) history.push(r);
      if (isInQueuePool(r)) queue.push(r);
    }
    return { historyPool: history, queuePool: queue };
  }, [data]);

  // Pre-lowercase the searchable name once per pool change.
  const queueIndexed = useMemo(
    () => queuePool.map((r: any) => ({ row: r, nameLower: (r.developer_name || "").toLowerCase() })),
    [queuePool],
  );

  const isContractRow = (r: any) =>
    !!r.contract_signed ||
    r.outreach_stage === "contract_signed" ||
    r.outreach_stage === "contract_sent" ||
    r.outreach_stage === "contracted";
  const contractsCount = useMemo(
    () => (data as any[]).filter(isContractRow).length,
    [data],
  );

  const filtered = useMemo(() => {
    const ql = debouncedQ.trim().toLowerCase();
    const out: any[] = [];
    const source = statusView === "contracts" ? (data as any[]) : queueIndexed.map((x) => x.row);
    for (const r of source) {
      // List/Junk/Trash filter
      if (devListView.kind === "trash") {
        if (!r.deleted_at) continue;
      } else {
        if (r.deleted_at) continue;
        if (devListView.kind === "junk") {
          if (!r.is_junk) continue;
        } else {
          if (r.is_junk) continue;
          if (devListView.kind === "list" && r.list_id !== devListView.listId) continue;
        }
      }
      if (devExcludedIds.has(r.id)) continue;
      const nameLower = (r.developer_name || "").toLowerCase();
      if (ql && !nameLower.includes(ql)) continue;
      if (statusView === "contracts" && !isContractRow(r)) continue;
      if (statusView !== "contracts" && statusFilter !== "all" && r.status !== statusFilter) continue;
      if (statusView !== "contracts" && emailFilter !== "all") {
        if (emailFilter === "not_sent" && !(!r.last_outreach_at && r.status !== "registered")) continue;
        else if (emailFilter === "sent" && !(!!r.last_outreach_at && r.status !== "registered")) continue;
        else if (emailFilter === "registered" && r.status !== "registered") continue;
      }
      out.push(r);
    }
    return out;
  }, [queueIndexed, data, debouncedQ, statusFilter, emailFilter, devExcludedIds, statusView, devListView]);

  const [devVisibleCount, setDevVisibleCount] = useState(60);
  useEffect(() => { setDevVisibleCount(60); }, [debouncedQ, statusFilter, emailFilter]);
  const devVisible = useMemo(() => filtered.slice(0, devVisibleCount), [filtered, devVisibleCount]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    data.forEach((r: any) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [data]);

  const toggleSel = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAllFiltered = () => setSelected(new Set(filtered.map((r: any) => r.id)));
  const clearSelection = () => setSelected(new Set());
  const selectedDevs = useMemo(() => data.filter((d: any) => selected.has(d.id)), [data, selected]);

  const openNew = () => { setEditing({ status: "not_started", developer_contact: {}, documents: [] }); setOpen(true); };
  const openEdit = (r: any) => { setEditing(r); setOpen(true); };
  const save = async () => {
    if (editing.developer_name && !editing.developer_slug) {
      editing.developer_slug = editing.developer_name.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-");
    }
    await upsert.mutateAsync(editing);
    setOpen(false);
  };

  const quickReminder = (d: any) => {
    const due = new Date(); due.setDate(due.getDate() + 14);
    upsertReminder.mutate({
      kind: "renewal", title: `Action needed: ${d.developer_name} registration`,
      body: `Status: ${d.status}. Review and progress this registration.`,
      due_at: due.toISOString(), dev_registry_id: d.id,
    });
  };

  const quota = useEmailQuota();

  const showQuotaToast = (err: unknown, fallback: string) => {
    const q = parseQuotaError(err);
    if (q.isQuota) {
      const remaining = formatRemaining(quota.sentToday, quota.dailyLimit);
      toast.error(q.message, {
        description: `${remaining}. Resend free plan: ${quota.dailyLimit}/day, ${quota.monthlyLimit.toLocaleString()}/month.`,
        duration: 8000,
      });
      return true;
    }
    toast.error(fallback);
    return false;
  };

  const sendOne = async (d: any) => {
    if (!settings?.drive_doc_pack_url) {
      toast.error("Add a Google Drive link in Document Pack panel first");
      return;
    }
    if (!quota.unlimited && quota.sentToday >= quota.dailyLimit) {
      toast.error("Daily email cap reached", {
        description: `${formatRemaining(quota.sentToday, quota.dailyLimit)}. Resets after UTC midnight, or upgrade to Pro to remove the cap.`,
        duration: 8000,
      });
      return;
    }
    try {
      await sendRegistration.mutateAsync({ developerId: d.id });
      quota.refresh();
    } catch (e) {
      showQuotaToast(e, "Failed to send registration email");
    }
  };

  const bulkSend = async () => {
    if (!settings?.drive_doc_pack_url) {
      toast.error("Add a Google Drive link in Document Pack panel first");
      return;
    }
    const targets = data.filter((d: any) =>
      d.developer_email && d.status !== "registered"
    );
    if (!targets.length) { toast.error("No eligible developers (need email + not-yet-registered status)"); return; }

    if (quota.unlimited) {
      if (!confirm(`Send registration email to ${targets.length} developers? (Pro plan — no daily cap)`)) return;
    } else {
      const remainingNow = Math.max(0, quota.dailyLimit - quota.sentToday);
      if (remainingNow <= 0) {
        toast.error("Daily email cap reached", {
          description: `0 of ${quota.dailyLimit} left today. Resets after UTC midnight, or upgrade to Pro to remove the cap.`,
          duration: 8000,
        });
        return;
      }
      if (targets.length > remainingNow) {
        if (!confirm(
          `Only ${remainingNow} of ${targets.length} can be sent today (Resend Free cap = ${quota.dailyLimit}/day). Continue and send the first ${remainingNow}?`,
        )) return;
      } else if (!confirm(`Send registration email to ${targets.length} developers? (${remainingNow} left today)`)) {
        return;
      }
    }

    setBulkRunning(true);
    const t = toast.loading(`Sending 0 / ${targets.length}…`);
    let ok = 0, fail = 0, quotaStop = false;
    for (let i = 0; i < targets.length; i++) {
      try {
        await sendRegistration.mutateAsync({ developerId: targets[i].id });
        ok++;
      } catch (e) {
        const q = parseQuotaError(e);
        if (q.isQuota) {
          quotaStop = true;
          toast.error(q.message, {
            id: t,
            description: `Stopped after ${ok} sends. ${formatRemaining(quota.sentToday + ok, quota.dailyLimit)}.`,
            duration: 10000,
          });
          break;
        }
        fail++;
      }
      toast.loading(`Sending ${i + 1} / ${targets.length}…`, { id: t });
      await new Promise((r) => setTimeout(r, 800));
    }
    if (!quotaStop) {
      toast.success(`Done. Sent: ${ok}, Failed: ${fail}`, { id: t });
    }
    quota.refresh();
    setBulkRunning(false);
    refetch();
  };

  const selectAllPending = () => {
    const ids = queuePool
      .filter((r: any) => r.status === "pending_application")
      .map((r: any) => r.id);
    if (!ids.length) {
      toast.info("No developers in Pending Application");
      return;
    }
    setSelected(new Set(ids));
    toast.success(`Selected ${ids.length} pending developer${ids.length === 1 ? "" : "s"}`);
  };

  const bulkResetToNotStarted = async () => {
    if (!selected.size) return;
    if (!confirm(`Reset ${selected.size} developer${selected.size === 1 ? "" : "s"} back to Not Started? They'll reappear in the queue ready to send.`)) return;
    setBulkResetting(true);
    const t = toast.loading(`Resetting 0 / ${selectedDevs.length}…`);
    let ok = 0, fail = 0;
    for (let i = 0; i < selectedDevs.length; i++) {
      const d = selectedDevs[i];
      if (d.status === "not_started") {
        ok++;
      } else {
        try {
          await quickStatus.mutateAsync({
            entityType: "developer_registry",
            id: d.id,
            status: "not_started",
            previousStatus: d.status,
          });
          ok++;
        } catch {
          fail++;
        }
      }
      toast.loading(`Resetting ${i + 1} / ${selectedDevs.length}…`, { id: t });
    }
    toast.success(`Reset: ${ok} · Failed: ${fail}`, { id: t });
    setBulkResetting(false);
    clearSelection();
    refetch();
  };

  return (
    <div className="space-y-5 w-full min-w-0">
      <div className="rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] p-2">
        <CRMListSidebar kind="developers" value={devListView} onChange={setDevListView} counts={devListCounts} orientation="horizontal" />
      </div>
      <CRMBulkActionsBar
        table="crm_developer_registry"
        ids={[...selected]}
        view={devListView.kind}
        onClear={() => setSelected(new Set())}
        onChanged={onDevListChanged}
      />
      <RegistryDebugBanner registryRows={data.length} isLoading={isLoading} />
      <DeveloperDirectoryPanel />
      <DocumentPackPanel />

      {/* Unified status tiles — single source of truth. Each tile auto-routes to the
          correct sub-tab so a click never lands in an empty pool (Registered → History). */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-8 gap-2">
          {STATUS_DEV.map((s) => {
            const n = counts[s.v] || 0;
            const isHistoryTile = s.v === "registered";
            const active = isHistoryTile
              ? subTab === "history" && historyTab === "registered"
              : statusFilter === s.v && subTab === "queue";
            return (
              <Card
                key={s.v}
                className={`cursor-pointer transition ${active ? "ring-2 ring-[#1A1A1A]" : "hover:ring-1 hover:ring-[#1A1A1A]/30"}`}
                onClick={() => selectStatus(s.v)}
                title={isHistoryTile ? "Open Sent History · Registered" : `Filter Outreach Queue by ${s.label}`}
              >
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold">{n}</div>
                  <div className="text-[10px] uppercase text-[#1A1A1A]/70 mt-1">{s.label}</div>
                </CardContent>
              </Card>
            );
          })}
          <Card
            className={`cursor-pointer transition ${statusView === "contracts" ? "ring-2 ring-[#1A1A1A]" : "hover:ring-1 hover:ring-[#1A1A1A]/30"}`}
            onClick={() => selectStatus("contracts")}
            title="Show developers with a contract sent or signed"
          >
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{contractsCount}</div>
              <div className="text-[10px] uppercase text-[#1A1A1A]/70 mt-1 flex items-center justify-center gap-1">
                <FileSignature className="w-3 h-3" />Contracts
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="text-xs text-[#1A1A1A]/70">Click a panel to expand · both start collapsed</div>
      <div className="flex gap-1 p-1 bg-[#F7F2EA] border border-[#1A1A1A]/10 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab(subTab === "queue" ? null : "queue")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
 subTab === "queue"
 ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/60"
 : "text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#FDFBF7]"
 }`}
        >
          Outreach Queue ({queuePool.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab(subTab === "history" ? null : "history")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
 subTab === "history"
 ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/60"
 : "text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#FDFBF7]"
 }`}
        >
          Sent History ({historyPool.length})
        </button>
      </div>

      {/* Both sub-views stay mounted — toggling visibility avoids slow refetch/re-render */}
      <div className={subTab === "history" ? "block" : "hidden"}>
        <SentHistoryView
          developers={historyPool}
          tabOverride={historyTab}
          onResend={(d) => { setSelected(new Set([d.id])); setBulkOpen(true); }}
          onMarkRegistered={(d) => quickStatus.mutate({ entityType: "developer_registry", id: d.id, status: "registered", previousStatus: d.status })}
        />
      </div>
      <div className={subTab === "queue" ? "block space-y-5" : "hidden"}>
      <div className="space-y-5">
        <div
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[#1A1A1A]/10 bg-[#FAF5EA]"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
            <ChevronDown className="w-4 h-4 text-[#B89555]" />
            Outreach Queue
            <span className="ml-1 px-2 py-0.5 rounded-full bg-[#1A1A1A]/10 text-[11px] font-bold text-[#1A1A1A]">
              {queuePool.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSubTab(null)}
            className="text-[11px] text-[#1A1A1A]/70 hover:text-[#1A1A1A] underline"
          >
            Collapse
          </button>
        </div>
        <div className="space-y-5">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/70" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search developer" className="pl-10" />
        </div>
        <Select value={emailFilter} onValueChange={(v: any) => setEmailFilter(v)}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All emails</SelectItem>
            <SelectItem value="not_sent">Not sent yet</SelectItem>
            <SelectItem value="sent">Email sent</SelectItem>
          </SelectContent>
        </Select>
        <OutreachActionsMenu
          selectedCount={selected.size}
          sendLabel="Send to Selected Developers"
          onSendSelected={() => {
            if (selected.size === 0) { toast.error("Select at least one developer first"); return; }
            setBulkOpen(true);
          }}
          onEditTemplate={() => setTplOpen(true)}
          onSendTest={() => setTestSendOpen(true)}
          onActivityLog={() => navigate("/owner/crm/relationships/activity")}
        />
        <Button
          size="sm"
          variant="gold"
          className="shadow-md"
          onClick={() => setConfirmRegOpen(true)}
        >
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
          Confirm Registration Status
        </Button>
        <ExcludeFilterPopover
          scope="developer"
          options={(data as any[]).map((r) => ({ id: r.id, name: r.developer_name || "Unnamed" }))}
          excludedIds={devExcludedIds}
          onChange={setDevExcludedIds}
        />
        <div className="flex p-1 bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl">
          <button
            type="button"
            onClick={() => setDevViewMode("cards")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${devViewMode === "cards" ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/60" : "text-[#1A1A1A]/70"}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Cards
          </button>
          <button
            type="button"
            onClick={() => setDevViewMode("excel")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${devViewMode === "excel" ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/60" : "text-[#1A1A1A]/70"}`}
          >
            <TableIcon className="w-3.5 h-3.5" /> Excel View
          </button>
        </div>
        <ExportMenu
          disabled={!filtered.length}
          onExport={async (f) => {
            const rows: DeveloperExportRow[] = (filtered as any[]).map((r: any, i: number) => ({
              rank: i + 1,
              developer_name: r.developer_name || "",
              status: r.status || "",
              agency_status: r.outreach_stage || "",
              developer_email: r.developer_email || "",
              phone: r.phone || "",
              emirate: r.emirate || "",
              agency_code: r.agency_code || "",
              registration_date: r.registration_date ? new Date(r.registration_date).toLocaleDateString() : "",
              expiry_date: r.expiry_date ? new Date(r.expiry_date).toLocaleDateString() : "",
              attended_briefing: r.attended_briefing ? "attended_briefing" : "",
              briefing_date: r.briefing_date ? new Date(r.briefing_date).toLocaleDateString() : "",
              notes: (r.notes || "").slice(0, 240),
            }));
            await exportDevelopers(rows, f);
            toast.success(`Exported ${rows.length} developers as ${f.toUpperCase()}`);
          }}
        />
        <Button
          variant="outline"
          onClick={() => setUnifiedExportOpen(true)}
          disabled={!filtered.length}
          title="Unified CSV — same columns across every CRM list page"
        >
          <Download className="w-4 h-4 mr-2" /> Unified CSV
        </Button>
        <UnifiedCRMExportModal
          open={unifiedExportOpen}
          onOpenChange={setUnifiedExportOpen}
          kind="developers"
          rows={filtered as any[]}
          filenameStem="crm-developers"
        />
        <Button variant="outline" onClick={() => seed.mutate()} disabled={seed.isPending}>
          {seed.isPending ? "Seeding…" : "Pre-fill"}
        </Button>
        <Button
          variant="outline"
          onClick={() => importAll.mutate({})}
          disabled={importAll.isPending}
          title="Import every developer from the master catalog (no duplicates, never overwrites existing entries)"
        >
          {importAll.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {importAll.isPending ? "Importing…" : "Import all developers"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (window.confirm("Research up to 8 developers per click using master catalog + AI web research. Only fills empty fields. Continue?")) {
              enrich.mutate({ useWeb: true });
            }
          }}
          disabled={enrich.isPending}
          title="Fill missing phone, email, office, website and point of contact via AI web research. Records the source for each field."
        >
          {enrich.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
          {enrich.isPending ? "Researching…" : "Research & enrich"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setUploadOpen(true)}
          title="Upload Excel/CSV/HTML developer list — auto-classifies brokerages vs developers vs mortgage firms and dedups."
        >
          <Plus className="w-4 h-4 mr-2" />Upload list
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const t = toast.loading("Scanning Gmail for signed agreements…");
            try {
              const { data, error } = await supabase.functions.invoke("sync-developer-contracts", { body: {} });
              if (error) throw error;
              if (!data?.ok) throw new Error(data?.error || "Sync failed");
              toast.success(
                `Scanned ${data.scanned}. Matched ${data.matched}. Needs review ${data.needs_review}. Duplicates ${data.duplicates}.`,
                { id: t }
              );
              refetch();
            } catch (e: any) {
              toast.error(`Sync failed: ${e.message || "unknown"}`, { id: t });
            }
          }}
          title="Scan your connected Gmail for signed-agreement / signed-contract emails and attach them to the matching developer automatically."
        >
          <FileSignature className="w-4 h-4 mr-2" />Sync signed agreements
        </Button>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add</Button>
      </div>
      <BulkUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} kind="developer" onDone={refetch} defaultListId={devListView.kind === "list" ? devListView.listId : null} />

      <div className="flex flex-wrap gap-2 items-center bg-[#FDFBF7] border border-[#1A1A1A]/10 rounded-xl p-3">
        <div className="text-sm text-[#1A1A1A]"><strong>{selected.size}</strong> of {filtered.length} selected</div>
        <Button size="sm" variant="outline" onClick={selectAllFiltered}>Select all filtered</Button>
        <Button size="sm" variant="outline" onClick={selectAllPending} title="Select every developer currently in Pending Application">
          Select all Pending ({counts["pending_application"] || 0})
        </Button>
        <Button size="sm" variant="outline" onClick={clearSelection} disabled={!selected.size}>Clear</Button>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="outline"
          disabled={!selected.size || bulkResetting}
          onClick={bulkResetToNotStarted}
          title="Move selected developers back to Not Started so they can be re-emailed"
        >
          {bulkResetting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RotateCcw className="w-3 h-3 mr-1" />}
          Reset to Not Started ({selected.size})
        </Button>
        <Button
          size="sm"
          className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]"
          disabled={!selected.size}
          onClick={() => setBulkOpen(true)}
        >
          <Send className="w-3 h-3 mr-1" />Send to Selected ({selected.size})
        </Button>
      </div>

      {/* Stat tiles + chip row removed from here — moved above the sub-tab toggle so they
          stay visible whether the user is in Outreach Queue or Sent History. */}

      {isLoading ? <Skeleton className="h-64" /> : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[#1A1A1A]/70 space-y-4">
          {data.length === 0 ? (
            <div className="space-y-3">
              <p>No developers in your registry yet.</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => importAll.mutate({})}
                  disabled={importAll.isPending}
                >
                  {importAll.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Import all developers
                </Button>
                <Button variant="outline" onClick={() => seed.mutate()} disabled={seed.isPending}>
                  {seed.isPending ? "Seeding…" : "Pre-fill"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p>
                No developers match the current filters
                {(q || statusFilter !== "all" || emailFilter !== "all") && (
                  <>
                    {" "}(<span className="text-[#1A1A1A] font-semibold">
                      {[
                        q && `search: "${q}"`,
                        statusFilter !== "all" && `status: ${STATUS_DEV.find(s => s.v === statusFilter)?.label || statusFilter}`,
                        emailFilter !== "all" && `email: ${emailFilter.replace("_", " ")}`,
                      ].filter(Boolean).join(" · ")}
                    </span>)
                  </>
                )}.
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => { setQ(""); setStatusFilter("all"); setEmailFilter("all"); }}
                  disabled={!q && statusFilter === "all" && emailFilter === "all"}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />Clear all filters
                </Button>
                <Button
                  className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]"
                  onClick={() => { setQ(""); setStatusFilter("all"); setEmailFilter("all"); setSubTab("queue"); }}
                >
                  Show full queue ({queuePool.length})
                </Button>
              </div>
            </div>
          )}
        </CardContent></Card>
      ) : devViewMode === "excel" ? (
        <ExcelGridView
          rows={filtered as any[]}
          columns={[
            { key: "developer_name", label: "Developer", width: 220 },
            {
              key: "status", label: "Registration status", width: 180, status: true,
              statusOptions: DEV_STATUS_OPTIONS.map(({ value, label }) => ({ value, label })),
              onStatusChange: (r: any, next) => upsert.mutate({ id: r.id, status: next }),
            },
            {
              key: "outreach_stage", label: "Agency status", width: 170, status: true,
              statusOptions: AGENCY_STATUS_OPTIONS.map(({ value, label }) => ({ value, label })),
              onStatusChange: (r: any, next) => upsert.mutate({ id: r.id, outreach_stage: next }),
            },
            { key: "developer_email", label: "Email", width: 200 },
            { key: "phone", label: "Phone", width: 140 },
            { key: "emirate", label: "Emirate", width: 110 },
            { key: "agency_code", label: "Agency code", width: 130 },
            { key: "briefing_date", label: "Briefing date", width: 130, render: (r: any) => r.briefing_date ? new Date(r.briefing_date).toLocaleDateString() : "—" },
            { key: "last_outreach_at", label: "Last contact", width: 130, render: (r: any) => r.last_outreach_at ? new Date(r.last_outreach_at).toLocaleDateString() : "—" },
            { key: "notes", label: "Notes", width: 260, editable: true },
          ]}
          onCellEdit={(r: any, key, value) => upsert.mutate({ id: r.id, [key]: value })}
          emptyLabel="No developers match filters."
        />
      ) : (
        <div className="grid gap-2">
          {devVisible.map((r: any) => {
            const sentDays = r.last_outreach_at
              ? Math.floor((Date.now() - new Date(r.last_outreach_at).getTime()) / 86400000)
              : null;
            return (
            <Card key={r.id} className={`bg-[#FDFBF7] text-[#1A1A1A] border ${selected.has(r.id) ? "border-[#1A1A1A] ring-1 ring-black" : "border-[#1A1A1A]/10"} hover:shadow-lg transition rounded-2xl`}>
              <CardContent className="p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-[260px]">
                    <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleSel(r.id)} className="mt-1" />
                    <DeveloperLogo
                      src={r.logo_url}
                      alt={r.developer_name || "Developer"}
                      className="w-12 h-12"
                      renderFallback
                      loading="lazy"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-[#1A1A1A]">{r.developer_name}</h3>
                        {r.tier && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1A1A1A] text-white">{r.tier}</span>
                        )}
                        {r.star_rating != null && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F7F2EA] border border-[#B89555]/40 text-[#1A1A1A]" title={`Rating ${Number(r.star_rating).toFixed(1)} / 5`}>
                            ★ {Number(r.star_rating).toFixed(1)}
                          </span>
                        )}
                        <InlineStatusSelect entityType="developer_registry" id={r.id} value={r.status} options={STATUS_DEV} />
                        {r.status === "registered" && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />Confirmed
                          </span>
                        )}
                        {sentDays !== null && r.status !== "registered" && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full jj-emerald-soft text-[color:var(--emerald-1)] border border-[color:var(--emerald-1)]/30 flex items-center gap-1">
                            <Mail className="w-3 h-3" />Email sent {sentDays === 0 ? "today" : `${sentDays}d ago`}
                          </span>
                        )}
                        {r.outreach_count > 1 && <span className="text-xs text-[color:var(--emerald-1)]">×{r.outreach_count}</span>}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-[#1A1A1A]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Building2 className="w-3 h-3 text-[#1A1A1A]/70 shrink-0" />
                          <span className="text-[#1A1A1A]/70 shrink-0">Company:</span>
                          <span data-developer-name className="font-medium text-[#1A1A1A] min-w-0 whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">{r.developer_name || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MapPin className="w-3 h-3 text-[#1A1A1A]/70 shrink-0" />
                          <span className="text-[#1A1A1A]/70 shrink-0">Office:</span>
                          {r.office_address ? (
                            <a
                              href={r.office_map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.office_address} ${r.developer_name || ""}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-[#1A1A1A] underline truncate"
                              onClick={(e) => e.stopPropagation()}
                              title="Open in Google Maps"
                            >
                              {r.office_address}{r.emirate ? ` · ${r.emirate}` : ""}
                            </a>
                          ) : (
                            <span className="font-medium text-[#1A1A1A] truncate">{r.emirate || "—"}</span>
                          )}
                          <FieldSource meta={r.field_sources?.emirate} />
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Phone className="w-3 h-3 text-[#1A1A1A]/70 shrink-0" />
                          <span className="text-[#1A1A1A]/70 shrink-0">Phone:</span>
                          {r.phone ? (
                            <a href={`tel:${r.phone}`} className="font-medium text-[#1A1A1A] underline truncate" onClick={(e) => e.stopPropagation()}>{r.phone}</a>
                          ) : (
                            <span className="font-medium text-[#1A1A1A]">—</span>
                          )}
                          <FieldSource meta={r.field_sources?.phone} />
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail className="w-3 h-3 text-[#1A1A1A]/70 shrink-0" />
                          <span className="text-[#1A1A1A]/70 shrink-0">Email:</span>
                          {r.developer_email ? (
                            <a href={`mailto:${r.developer_email}`} className="font-medium text-[#1A1A1A] underline truncate" onClick={(e) => e.stopPropagation()}>{r.developer_email}</a>
                          ) : (
                            <span className="font-medium text-[#1A1A1A]">—</span>
                          )}
                          <FieldSource meta={r.field_sources?.developer_email} />
                        </div>
                        {r.website && (
                          <div className="flex items-center gap-1.5 min-w-0 sm:col-span-2">
                            <LinkIcon className="w-3 h-3 text-[#1A1A1A]/70 shrink-0" />
                            <span className="text-[#1A1A1A]/70 shrink-0">Website:</span>
                            <a href={r.website} target="_blank" rel="noopener noreferrer" className="font-medium text-[#1A1A1A] underline truncate" onClick={(e) => e.stopPropagation()}>{r.website}</a>
                            <FieldSource meta={r.field_sources?.website} />
                          </div>
                        )}
                        {r.instagram_url && (
                          <div className="flex items-center gap-1.5 min-w-0 sm:col-span-2">
                            <span className="text-[#1A1A1A]/70 shrink-0">Instagram:</span>
                            <a href={r.instagram_url} target="_blank" rel="noopener noreferrer" className="font-medium text-[#1A1A1A] underline truncate" onClick={(e) => e.stopPropagation()}>{r.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\//,'@').replace(/\/$/,'')}</a>
                          </div>
                        )}
                        {r.agency_code && (
                          <div className="flex items-center gap-1.5 min-w-0 sm:col-span-2">
                            <span className="text-[#1A1A1A]/70 shrink-0">Agency code:</span>
                            <span className="font-medium text-[#1A1A1A]">{r.agency_code}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-amber-900 mb-0.5">
                          <Users className="w-3 h-3" />Point of Contact
                          <FieldSource meta={r.field_sources?.developer_contact} />
                        </div>
                        {(r.developer_contact?.name || r.developer_contact?.role || r.developer_contact?.phone || r.developer_contact?.email) ? (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#1A1A1A]">
                            <span className="font-semibold">{r.developer_contact?.name || "—"}</span>
                            {r.developer_contact?.role && <span className="text-[#1A1A1A]/70">· {r.developer_contact.role}</span>}
                            {r.developer_contact?.phone && (
                              <a href={`tel:${r.developer_contact.phone}`} className="underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <Phone className="w-3 h-3" />{r.developer_contact.phone}
                              </a>
                            )}
                            {r.developer_contact?.email && (
                              <a href={`mailto:${r.developer_contact.email}`} className="underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <Mail className="w-3 h-3" />{r.developer_contact.email}
                              </a>
                            )}
                          </div>
                        ) : (
                          <button onClick={() => openEdit(r)} className="text-[11px] text-amber-900/70 hover:text-amber-900 italic">+ Add point of contact</button>
                        )}
                      </div>
                      {noteEditing === r.id ? (
                        <div className="mt-2">
                          <Textarea
                            rows={2}
                            defaultValue={r.notes || ""}
                            autoFocus
                            onBlur={async (e) => {
                              if (e.target.value !== (r.notes || "")) {
                                await upsert.mutateAsync({ id: r.id, notes: e.target.value });
                              }
                              setNoteEditing(null);
                            }}
                            className="text-xs"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setNoteEditing(r.id)}
                          className="mt-1 text-xs text-left text-[#1A1A1A]/70 hover:text-[#1A1A1A] italic block w-full"
                        >
                          {r.notes ? `📝 ${r.notes}` : "+ Add note"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => { setSelected(new Set([r.id])); setBulkOpen(true); }}>
                      <Send className="w-3 h-3 mr-1" />Send
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => aiRecommend("developer_registry", r.id, refetch)}><Sparkles className="w-3 h-3 mr-1" />AI</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => enrich.mutate({ ids: [r.id], useWeb: true })}
                      disabled={enrich.isPending}
                      title="Research this developer's missing fields via AI + web sources"
                    >
                      {enrich.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <BookOpen className="w-3 h-3 mr-1" />}
                      Research
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => quickReminder(r)}><Bell className="w-3 h-3 mr-1" />Remind</Button>
                    <QuickActivityActions entityType="developer" entityId={r.id} entityName={r.developer_name || "Developer"} />
                    <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button>
                  </div>
                </div>
                {r.ai_next_action && (
                  <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                    <Sparkles className="w-3 h-3 inline mr-1 text-purple-600" />
                    <span className="font-medium text-purple-900">{r.ai_next_action}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );})}
          {devVisible.length < filtered.length && (
            <div className="flex items-center justify-center py-4">
              <Button variant="outline" onClick={() => setDevVisibleCount((n) => n + 60)}>
                Show more · {filtered.length - devVisible.length} remaining
              </Button>
            </div>
          )}
        </div>
      )}
        </div>
      </div>
      </div>

      <TemplateEditorDialog open={tplOpen} onOpenChange={setTplOpen} />
      <TestSendDialog open={testSendOpen} onOpenChange={setTestSendOpen} mode="developer" variant="developer_registration" />
      <BulkSendDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        selected={selectedDevs}
        defaultTestEmail={ownerSettings?.cc_email || "infoo.jane@gmail.com"}
      />
      <ConfirmRegistrationLauncher
        open={confirmRegOpen}
        onOpenChange={setConfirmRegOpen}
        developers={data as any[]}
        onContinue={(picked) => {
          setConfirmRegSelected(picked);
          setTimeout(() => setConfirmRegOpen(false), 0);
          setTimeout(() => {
            // open the bulk dialog with locked variant for confirmations
            setConfirmRegBulkOpen(true);
          }, 50);
        }}
      />
      <BulkSendDialog
        open={confirmRegBulkOpen}
        onOpenChange={setConfirmRegBulkOpen}
        selected={confirmRegSelected as any}
        defaultTestEmail={ownerSettings?.cc_email || "infoo.jane@gmail.com"}
        initialVariant="developer_confirm_registered"
        title="Confirm Registration Status"
        lockVariant
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Add"} Developer Registration</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Developer name *"><Input value={editing.developer_name || ""} onChange={(e) => setEditing({ ...editing, developer_name: e.target.value })} /></Field>
                <Field label="Status">
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_DEV.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Agency code / Broker ID"><Input value={editing.agency_code || ""} onChange={(e) => setEditing({ ...editing, agency_code: e.target.value })} /></Field>
                <Field label="Commission tier"><Input value={editing.commission_tier || ""} onChange={(e) => setEditing({ ...editing, commission_tier: e.target.value })} placeholder="e.g. Gold 4%" /></Field>
                <Field label="Registration date"><Input type="date" value={editing.registration_date || ""} onChange={(e) => setEditing({ ...editing, registration_date: e.target.value || null })} /></Field>
                <Field label="Expiry date"><Input type="date" value={editing.expiry_date || ""} onChange={(e) => setEditing({ ...editing, expiry_date: e.target.value || null })} /></Field>
                <Field label="Registration email (for outreach)"><Input type="email" placeholder="brokers@developer.ae" value={editing.developer_email || ""} onChange={(e) => setEditing({ ...editing, developer_email: e.target.value })} /></Field>
                <Field label="Registration URL"><Input placeholder="https://…" value={editing.registration_url || ""} onChange={(e) => setEditing({ ...editing, registration_url: e.target.value })} /></Field>
              </div>
              <div className="border-t pt-3"><div className="text-sm font-semibold mb-2">My Contact at Developer</div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Name" value={editing.developer_contact?.name || ""} onChange={(e) => setEditing({ ...editing, developer_contact: { ...editing.developer_contact, name: e.target.value } })} />
                  <Input placeholder="Role" value={editing.developer_contact?.role || ""} onChange={(e) => setEditing({ ...editing, developer_contact: { ...editing.developer_contact, role: e.target.value } })} />
                  <Input placeholder="Email" value={editing.developer_contact?.email || ""} onChange={(e) => setEditing({ ...editing, developer_contact: { ...editing.developer_contact, email: e.target.value } })} />
                  <Input placeholder="Phone" value={editing.developer_contact?.phone || ""} onChange={(e) => setEditing({ ...editing, developer_contact: { ...editing.developer_contact, phone: e.target.value } })} />
                </div>
              </div>
              <Field label="Notes"><Textarea rows={3} value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!editing?.developer_name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

/* ===========================================================
   Page Shell
=========================================================== */
const VALID_TABS = ["developers", "reps", "brokerages", "brokers"] as const;
type TabKey = typeof VALID_TABS[number];

const CRMRelationships = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL is the source of truth for tab. Honour ?tab= or ?sub= (Phase 4 deep-links).
  const initialTab: TabKey = (() => {
    const raw = (searchParams.get("sub") || searchParams.get("tab") || "developers").toLowerCase();
    return (VALID_TABS as readonly string[]).includes(raw) ? (raw as TabKey) : "developers";
  })();
  const [tab, setTabState] = useState<TabKey>(initialTab);

  const setTab = (next: string) => {
    const v = ((VALID_TABS as readonly string[]).includes(next) ? next : "developers") as TabKey;
    setTabState(v);
    const params = new URLSearchParams(searchParams);
    params.set("tab", v);
    params.delete("sub");
    setSearchParams(params, { replace: true });
  };

  // React to back/forward navigation that changes the URL outside our setter.
  useEffect(() => {
    const raw = (searchParams.get("sub") || searchParams.get("tab") || "").toLowerCase();
    if ((VALID_TABS as readonly string[]).includes(raw) && raw !== tab) {
      setTabState(raw as TabKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [mounted, setMounted] = useState<Set<string>>(new Set([initialTab]));
  useEffect(() => {
    setMounted((prev) => prev.has(tab) ? prev : new Set([...prev, tab]));
  }, [tab]);

  return (
    <>
      <SEOHead title="CRM Relationships | JBJ GLOBAL REAL ESTATE" description="Manage brokerages, clients and developer registrations" canonicalPath="/crm/relationships" />
      <div className="min-h-screen bg-[#FDFBF7] w-full">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pt-[96px] pb-12">
          <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-[#1A1A1A]/10">
            <Button
              variant="outline"
              onClick={() => navigate("/owner/crm")}
              className="h-11 px-6 bg-[#FDFBF7] border-2 border-[#1A1A1A]/10 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] rounded-full font-semibold shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />Back to CRM Hub
            </Button>
            <div className="flex-1 min-w-[240px]">
              <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] tracking-tight">Relationships Hub</h1>
              <p className="text-sm text-[#1A1A1A]/70 mt-1">Brokerages &middot; Developer Registrations &mdash; client &amp; lead records live in <span className="font-semibold text-[#1A1A1A]">Leads &amp; Clients</span>.</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-[#1A1A1A]/10 bg-[#FDFBF7] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-[#1A1A1A]/70">
              <span className="font-semibold text-[#1A1A1A]">Looking for Clients?</span> Clients and Leads are now unified in one workspace.
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => navigate("/crm/leads")} className="rounded-full font-semibold">
                <Users className="w-4 h-4 mr-2" />Open Leads &amp; Clients
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/admin/media-ingestion")}
                className="rounded-full font-semibold"
                title="Bulk-upload videos, PDFs and links — AI matches each to the right developer & project"
              >
                <Inbox className="w-4 h-4 mr-2" />Media Ingestion
              </Button>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <GmailSenderStatusBanner />
            <BreakfastCalendarStatusBanner />
          </div>

          {/* ============ BRANDED OUTREACH EMAIL CENTER (sticky) ============ */}
          <section
            className="mb-10 sticky top-[88px] z-30 bg-[#FDFBF7]/95 backdrop-blur-md rounded-2xl border border-[#B89555]/25 shadow-[0_4px_18px_rgba(184,149,85,0.10)] p-4"
            aria-labelledby="branded-outreach-heading"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#B89555]/40 to-transparent" />
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[#B89555]/40 bg-[#F7F2EA]">
                <Mail className="w-3.5 h-3.5 text-[#1A1A1A]" />
                <h2 id="branded-outreach-heading" className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#1A1A1A]">
                  Branded Outreach Email Center
                </h2>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#B89555]/40 to-transparent" />
            </div>
            <BrandedEmailComposer />
          </section>

          <div className="mb-4 flex items-center justify-end">
            <RouterLink to="/owner/crm/relationships/secondary-market">
              <Button variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#F7F2EA]">
                <Store className="w-4 h-4 mr-2" />Secondary Market Hub
              </Button>
            </RouterLink>
          </div>

          {/* ============ MAIN: Developers | Brokerage Agencies ============ */}
          <Tabs
            value={(tab === "reps" || tab === "developers") ? "developers" : "brokerages"}
            onValueChange={(v) => setTab(v === "developers" ? "developers" : "brokerages")}
          >
            <div className="overflow-x-auto -mx-1 px-1 mb-6">
              <TabsList className="bg-[#FDFBF7] border border-[#B89555]/30 p-1.5 rounded-xl inline-flex w-auto gap-2">
                <TabsTrigger value="developers" className="min-w-fit text-[#1A1A1A] data-[state=active]:bg-[#EFE6D6] data-[state=active]:border data-[state=active]:border-[#B89555]/60 data-[state=active]:shadow-sm hover:bg-[#F7F2EA] rounded-lg px-6 py-2.5 font-semibold whitespace-nowrap transition-colors">
                  <FileSignature className="w-4 h-4 mr-2" />Developers
                </TabsTrigger>
                <span aria-hidden className="self-center w-px h-5 bg-[#B89555]/30" />
                <TabsTrigger value="brokerages" className="min-w-fit text-[#1A1A1A] data-[state=active]:bg-[#EFE6D6] data-[state=active]:border data-[state=active]:border-[#B89555]/60 data-[state=active]:shadow-sm hover:bg-[#F7F2EA] rounded-lg px-6 py-2.5 font-semibold whitespace-nowrap transition-colors">
                  <Building2 className="w-4 h-4 mr-2" />Brokerage Agencies
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ===== Developers main → sub-tabs ===== */}
            <TabsContent value="developers">
              <Tabs value={tab === "reps" ? "reps" : "developers"} onValueChange={setTab}>
                <div className="overflow-x-auto -mx-1 px-1 mb-5">
                  <TabsList className="bg-[#F7F2EA] border border-[#B89555]/20 p-1 rounded-lg inline-flex w-auto gap-1">
                    <TabsTrigger value="developers" className="text-[#1A1A1A] data-[state=active]:bg-[#FDFBF7] data-[state=active]:border data-[state=active]:border-[#B89555]/50 data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors">
                      Developers
                    </TabsTrigger>
                    <TabsTrigger value="reps" className="text-[#1A1A1A] data-[state=active]:bg-[#FDFBF7] data-[state=active]:border data-[state=active]:border-[#B89555]/50 data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors">
                      <UserSquare2 className="w-3.5 h-3.5 mr-1.5 inline" />Developer Representatives
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="developers">
                  {mounted.has("developers") && <DeveloperRegistryTab />}
                </TabsContent>
                <TabsContent value="reps">
                  {mounted.has("reps") && <DevSalesRepsDirectory />}
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* ===== Brokerage Agencies main → sub-tabs ===== */}
            <TabsContent value="brokerages">
              <Tabs value={tab === "brokers" ? "brokers" : "brokerages"} onValueChange={setTab}>
                <div className="overflow-x-auto -mx-1 px-1 mb-5">
                  <TabsList className="bg-[#F7F2EA] border border-[#B89555]/20 p-1 rounded-lg inline-flex w-auto gap-1">
                    <TabsTrigger value="brokerages" className="text-[#1A1A1A] data-[state=active]:bg-[#FDFBF7] data-[state=active]:border data-[state=active]:border-[#B89555]/50 data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors">
                      Agencies
                    </TabsTrigger>
                    <TabsTrigger value="brokers" className="text-[#1A1A1A] data-[state=active]:bg-[#FDFBF7] data-[state=active]:border data-[state=active]:border-[#B89555]/50 data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors">
                      <Users className="w-3.5 h-3.5 mr-1.5 inline" />Individual Brokers
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="brokerages">
                  {mounted.has("brokerages") && <BrokeragesTab />}
                </TabsContent>
                <TabsContent value="brokers">
                  {mounted.has("brokers") && <IndividualBrokersTab />}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default CRMRelationships;
