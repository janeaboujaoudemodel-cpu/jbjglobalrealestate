import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Search, Sparkles, Building2, Users, FileSignature, Download, Bell, Trash2, Send, Mail, Settings as SettingsIcon, Link as LinkIcon, Lock, FlaskConical, MapPin, Phone, CheckCircle2, FileEdit, BookOpen, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SEOHead } from "@/components/SEOHead";
import {
  useBrokerages, useUpsertBrokerage, useDeleteBrokerage,
  useClients, useUpsertClient, useDeleteClient,
  useDeveloperRegistry, useSeedDeveloperRegistry, useUpsertDeveloperRegistry, useImportAllDevelopersToRegistry,
  useEnrichDeveloperRegistry,
  useUpsertReminder,
  useOwnerSettings, useUpsertOwnerSettings, useSendDeveloperRegistration,
  useQuickStatusUpdate,
  useEmailTemplate,
} from "@/hooks/useCRMRelationships";
import { TemplateEditorDialog } from "@/components/crm/TemplateEditorDialog";
import { BulkSendDialog } from "@/components/crm/BulkSendDialog";
import { SentHistoryView } from "@/components/crm/SentHistoryView";
import { ArrowLeftRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type FieldSourceMeta = { source: string; url?: string; fetched_at?: string } | undefined;

const SOURCE_LABELS: Record<string, string> = {
  master_catalog: "Master catalog",
  perplexity: "AI web research",
  firecrawl: "Website scrape",
  ai_inference: "AI inferred",
  manual: "Manual",
};

const SOURCE_STYLES: Record<string, string> = {
  master_catalog: "bg-emerald-50 text-emerald-800 border-emerald-200",
  perplexity: "bg-blue-50 text-blue-800 border-blue-200",
  firecrawl: "bg-indigo-50 text-indigo-800 border-indigo-200",
  ai_inference: "bg-amber-50 text-amber-900 border-amber-200",
  manual: "bg-gray-100 text-gray-700 border-gray-200",
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
      <PopoverContent className="text-xs w-64 bg-white border-black/10" onClick={(e) => e.stopPropagation()}>
        <div className="font-semibold text-black">{label}</div>
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
          <div className="text-gray-500 mt-1">
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


const STATUS_BROKERAGE = [
  { v: "prospect", label: "Prospect", cls: "bg-gray-200 text-black" },
  { v: "negotiating", label: "Negotiating", cls: "bg-amber-200 text-black" },
  { v: "active_partner", label: "Active Partner", cls: "bg-emerald-200 text-black" },
  { v: "closed_deals", label: "Closed Deals", cls: "bg-blue-200 text-black" },
  { v: "dormant", label: "Dormant", cls: "bg-zinc-200 text-black" },
  { v: "blacklisted", label: "Blacklisted", cls: "bg-red-200 text-black" },
];
const STATUS_CLIENT = [
  { v: "lead", label: "Lead", cls: "bg-gray-200 text-black" },
  { v: "qualified", label: "Qualified", cls: "bg-blue-200 text-black" },
  { v: "negotiating", label: "Negotiating", cls: "bg-amber-200 text-black" },
  { v: "vip", label: "VIP", cls: "bg-purple-200 text-black" },
  { v: "closed_won", label: "Closed Won", cls: "bg-emerald-200 text-black" },
  { v: "closed_lost", label: "Closed Lost", cls: "bg-red-200 text-black" },
  { v: "dormant", label: "Dormant", cls: "bg-zinc-200 text-black" },
];
const STATUS_DEV = [
  { v: "not_started", label: "Not Started", cls: "bg-gray-200 text-black" },
  { v: "pending_application", label: "Pending Application", cls: "bg-amber-200 text-black" },
  { v: "documents_required", label: "Documents Required", cls: "bg-orange-200 text-black" },
  { v: "under_review", label: "Under Review", cls: "bg-blue-200 text-black" },
  { v: "registered", label: "Registered", cls: "bg-emerald-200 text-black" },
  { v: "rejected", label: "Rejected", cls: "bg-red-200 text-black" },
  { v: "expired", label: "Expired", cls: "bg-zinc-300 text-black" },
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
      <SelectContent className="bg-white border border-black/10 z-50">
        {options.map((s) => (
          <SelectItem key={s.v} value={s.v} className="text-black">
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
   Brokerages
=========================================================== */
const BrokeragesTab = () => {
  const { data = [], isLoading, refetch } = useBrokerages();
  const upsert = useUpsertBrokerage();
  const del = useDeleteBrokerage();
  const upsertReminder = useUpsertReminder();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const filtered = useMemo(() => data.filter((r: any) => {
    const matchesQ = !q || r.company_name?.toLowerCase().includes(q.toLowerCase()) || r.primary_contact?.name?.toLowerCase?.().includes(q.toLowerCase());
    const matchesS = statusFilter === "all" || r.status === statusFilter;
    return matchesQ && matchesS;
  }), [data, q, statusFilter]);

  const openNew = () => { setEditing({ status: "prospect", primary_contact: {}, secondary_contact: {} }); setOpen(true); };
  const openEdit = (r: any) => { setEditing(r); setOpen(true); };

  const save = async () => {
    await upsert.mutateAsync(editing);
    setOpen(false);
  };

  const quickReminder = (b: any) => {
    const due = new Date(); due.setDate(due.getDate() + 7);
    upsertReminder.mutate({
      kind: "follow_up",
      title: `Follow up with ${b.company_name}`,
      body: `Check on partnership status and pending opportunities.`,
      due_at: due.toISOString(),
      brokerage_id: b.id,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brokerage or contact" className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_BROKERAGE.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => exportCSV(filtered, `brokerages-${Date.now()}.csv`, [
          { key: "company_name", label: "Company" }, { key: "rera_license", label: "License" },
          { key: "office_location", label: "Location" }, { key: "status", label: "Status" },
          { key: "deal_count", label: "Deals" }, { key: "primary_contact", label: "Primary Contact" },
          { key: "notes", label: "Notes" },
        ])}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Brokerage</Button>
      </div>

      {isLoading ? <Skeleton className="h-64" /> : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No brokerages yet. Click <b>Add Brokerage</b> to start.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r: any) => (
            <Card key={r.id} className="bg-white text-black border border-black/10 hover:shadow-lg hover:border-black/20 transition rounded-2xl">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base">{r.company_name}</h3>
                      <InlineStatusSelect entityType="brokerage" id={r.id} value={r.status} options={STATUS_BROKERAGE} />
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      {r.rera_license && <div>RERA: {r.rera_license}</div>}
                      {r.office_location && <div>{r.office_location}</div>}
                      {r.primary_contact?.name && (
                        <div className="font-medium text-gray-800">
                          Contact: {r.primary_contact.name} {r.primary_contact.role && `· ${r.primary_contact.role}`}
                          {r.primary_contact.phone && ` · ${r.primary_contact.phone}`}
                        </div>
                      )}
                    </div>
                    {r.ai_next_action && (
                      <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                        <Sparkles className="w-3 h-3 inline mr-1 text-purple-600" />
                        <span className="font-medium text-purple-900">{r.ai_next_action}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => aiRecommend("brokerage", r.id, refetch)}>
                      <Sparkles className="w-3 h-3 mr-1" />AI
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => quickReminder(r)}>
                      <Bell className="w-3 h-3 mr-1" />Remind
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete?")) del.mutate(r.id); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Add"} Brokerage</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Company name *"><Input value={editing.company_name || ""} onChange={(e) => setEditing({ ...editing, company_name: e.target.value })} /></Field>
                <Field label="RERA license"><Input value={editing.rera_license || ""} onChange={(e) => setEditing({ ...editing, rera_license: e.target.value })} /></Field>
                <Field label="Office location"><Input value={editing.office_location || ""} onChange={(e) => setEditing({ ...editing, office_location: e.target.value })} /></Field>
                <Field label="Website"><Input value={editing.website || ""} onChange={(e) => setEditing({ ...editing, website: e.target.value })} /></Field>
                <Field label="Status">
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_BROKERAGE.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Deal count"><Input type="number" value={editing.deal_count || 0} onChange={(e) => setEditing({ ...editing, deal_count: +e.target.value })} /></Field>
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
              <Field label="Notes"><Textarea rows={3} value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!editing?.company_name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client" className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_CLIENT.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => exportCSV(filtered, `clients-${Date.now()}.csv`, [
          { key: "full_name", label: "Name" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" },
          { key: "nationality", label: "Nationality" }, { key: "status", label: "Status" },
          { key: "budget_min", label: "Budget Min" }, { key: "budget_max", label: "Budget Max" },
          { key: "lifetime_value", label: "LTV" }, { key: "notes", label: "Notes" },
        ])}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Client</Button>
      </div>

      {isLoading ? <Skeleton className="h-64" /> : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No clients yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r: any) => (
            <Card key={r.id} className="bg-white text-black border border-black/10 hover:shadow-lg hover:border-black/20 transition rounded-2xl">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{r.full_name}{r.is_company && r.company_name ? ` (${r.company_name})` : ""}</h3>
                      <InlineStatusSelect entityType="client" id={r.id} value={r.status} options={STATUS_CLIENT} />
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5">
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
const DocumentPackPanel = () => {
  const { data: settings, isLoading } = useOwnerSettings();
  const upsert = useUpsertOwnerSettings();
  const [draft, setDraft] = useState<any>(null);
  const s = draft || settings || {};
  const dirty = !!draft;

  const update = (patch: any) => setDraft({ ...(draft || settings || {}), ...patch });
  const save = async () => { await upsert.mutateAsync(draft); setDraft(null); };

  if (isLoading) return <Skeleton className="h-32" />;

  return (
    <Card className="bg-white border border-black/10 rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon className="w-4 h-4 text-black" />
          <h3 className="font-semibold text-black">Document Pack & Outreach Settings</h3>
        </div>
        <p className="text-xs text-gray-700 mb-4">
          Set the Google Drive link to your Trade Licence + RERA + MOU pack once. Every "Send Registration" email will use it automatically.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label className="text-xs text-black mb-1 block">Google Drive document pack URL *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://drive.google.com/drive/folders/..."
                value={s.drive_doc_pack_url || ""}
                onChange={(e) => update({ drive_doc_pack_url: e.target.value })}
              />
              {s.drive_doc_pack_url && /^https?:\/\//i.test(s.drive_doc_pack_url) ? (
                <a
                  href={s.drive_doc_pack_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 rounded-md border border-black/30 text-black text-sm hover:bg-black hover:text-white whitespace-nowrap"
                >
                  Open Pack ↗
                </a>
              ) : null}
            </div>
            {s.drive_doc_pack_url && !/^https?:\/\//i.test(s.drive_doc_pack_url) && (
              <p className="text-xs text-red-600 mt-1">Paste a full https://drive.google.com/… link.</p>
            )}
          </div>
          <div>
            <Label className="text-xs text-black mb-1 block">From name</Label>
            <Input value={s.from_name || ""} onChange={(e) => update({ from_name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-black mb-1 block">Primary sender email (Reply-to)</Label>
            <Input value={s.reply_to_email || ""} onChange={(e) => update({ reply_to_email: e.target.value })} placeholder="contact@jbj.ae" />
          </div>
          <div>
            <Label className="text-xs text-black mb-1 block">CC email</Label>
            <Input value={s.cc_email || ""} onChange={(e) => update({ cc_email: e.target.value })} placeholder="infoo.jane@gmail.com" />
          </div>
          <div className="flex flex-col justify-center gap-2 pt-2">
            <div className="flex items-center gap-3">
              <Switch checked={!!s.cc_jane_enabled} onCheckedChange={(v) => update({ cc_jane_enabled: v })} />
              <span className="text-sm text-black">Always CC this address</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start border-black/30 text-black hover:bg-black hover:text-white"
              onClick={() => update({
                reply_to_email: s.cc_email || "",
                cc_email: s.reply_to_email || "",
              })}
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Reverse Primary ↔ CC
            </Button>
          </div>
        </div>
        {dirty && (
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving…" : "Save settings"}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DeveloperRegistryTab = () => {
  const { data = [], isLoading, refetch } = useDeveloperRegistry();
  const { data: settings } = useOwnerSettings();
  const seed = useSeedDeveloperRegistry();
  const importAll = useImportAllDevelopersToRegistry();
  const upsert = useUpsertDeveloperRegistry();
  const upsertReminder = useUpsertReminder();
  const sendRegistration = useSendDeveloperRegistration();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [emailFilter, setEmailFilter] = useState<"all" | "not_sent" | "sent" | "registered">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [noteEditing, setNoteEditing] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"queue" | "history">("queue");
  const quickStatus = useQuickStatusUpdate();
  const { data: tplMain } = useEmailTemplate("developer_registration");
  const { data: ownerSettings } = useOwnerSettings();

  // Split base data into pools: queue (never contacted) vs history (contacted or registered)
  const queuePool = useMemo(() => data.filter((r: any) => !r.last_outreach_at && r.status !== "registered"), [data]);
  const historyPool = useMemo(() => data.filter((r: any) => !!r.last_outreach_at || r.status === "registered"), [data]);

  const filtered = useMemo(() => queuePool.filter((r: any) => {
    const matchesQ = !q || r.developer_name?.toLowerCase().includes(q.toLowerCase());
    const matchesS = statusFilter === "all" || r.status === statusFilter;
    const matchesE =
      emailFilter === "all" ||
      (emailFilter === "not_sent" && !r.last_outreach_at && r.status !== "registered") ||
      (emailFilter === "sent" && !!r.last_outreach_at && r.status !== "registered") ||
      (emailFilter === "registered" && r.status === "registered");
    return matchesQ && matchesS && matchesE;
  }), [queuePool, q, statusFilter, emailFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    data.forEach((r: any) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [data]);

  const toggleSel = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAllFiltered = () => setSelected(new Set(filtered.map((r: any) => r.id)));
  const clearSelection = () => setSelected(new Set());
  const selectedDevs = data.filter((d: any) => selected.has(d.id));

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

  const sendOne = (d: any) => {
    if (!settings?.drive_doc_pack_url) {
      toast.error("Add a Google Drive link in Document Pack panel first");
      return;
    }
    sendRegistration.mutate({ developerId: d.id });
  };

  const bulkSend = async () => {
    if (!settings?.drive_doc_pack_url) {
      toast.error("Add a Google Drive link in Document Pack panel first");
      return;
    }
    const targets = data.filter((d: any) =>
      d.developer_email && (d.status === "not_started" || d.status === "documents_required")
    );
    if (!targets.length) { toast.error("No eligible developers (need email + not-yet-registered status)"); return; }
    if (!confirm(`Send registration email to ${targets.length} developers?`)) return;
    setBulkRunning(true);
    const t = toast.loading(`Sending 0 / ${targets.length}…`);
    let ok = 0, fail = 0;
    for (let i = 0; i < targets.length; i++) {
      try {
        await sendRegistration.mutateAsync({ developerId: targets[i].id });
        ok++;
      } catch { fail++; }
      toast.loading(`Sending ${i + 1} / ${targets.length}…`, { id: t });
      await new Promise((r) => setTimeout(r, 800));
    }
    toast.success(`Done. Sent: ${ok}, Failed: ${fail}`, { id: t });
    setBulkRunning(false);
    refetch();
  };

  return (
    <div className="space-y-5">
      <DocumentPackPanel />

      {/* Sub-tabs: Outreach Queue vs Sent History */}
      <div className="flex gap-1 p-1 bg-black/5 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSubTab("queue")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            subTab === "queue" ? "bg-white text-black shadow-sm" : "text-black/60 hover:text-black"
          }`}
        >
          Outreach Queue ({queuePool.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab("history")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            subTab === "history" ? "bg-white text-black shadow-sm" : "text-black/60 hover:text-black"
          }`}
        >
          Sent History ({historyPool.length})
        </button>
      </div>

      {subTab === "history" ? (
        <SentHistoryView
          developers={historyPool}
          onResend={(d) => { setSelected(new Set([d.id])); setBulkOpen(true); }}
          onMarkRegistered={(d) => quickStatus.mutate({ entityType: "developer_registry", id: d.id, status: "registered", previousStatus: d.status })}
        />
      ) : (
      <>
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search developer" className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_DEV.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={emailFilter} onValueChange={(v: any) => setEmailFilter(v)}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All emails</SelectItem>
            <SelectItem value="not_sent">Not sent yet</SelectItem>
            <SelectItem value="sent">Email sent</SelectItem>
            <SelectItem value="registered">Confirmed registered</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setTplOpen(true)}>
          <FileEdit className="w-4 h-4 mr-2" />
          {tplMain?.locked_at ? <><Lock className="w-3 h-3 mr-1" />Template</> : "Edit Template"}
        </Button>
        <Button variant="outline" onClick={() => exportCSV(filtered, `developer-registry-${Date.now()}.csv`, [
          { key: "developer_name", label: "Developer" }, { key: "status", label: "Status" },
          { key: "developer_email", label: "Email" }, { key: "phone", label: "Phone" },
          { key: "emirate", label: "Emirate" }, { key: "agency_code", label: "Agency Code" },
          { key: "registration_date", label: "Registered" }, { key: "expiry_date", label: "Expiry" },
          { key: "notes", label: "Notes" },
        ])}><Download className="w-4 h-4 mr-2" />Export</Button>
        <Button variant="outline" onClick={() => seed.mutate()} disabled={seed.isPending}>
          {seed.isPending ? "Seeding…" : "Pre-fill"}
        </Button>
        <Button
          variant="outline"
          onClick={() => importAll.mutate()}
          disabled={importAll.isPending}
          title="Import every developer from the master catalog (no duplicates, never overwrites existing entries)"
        >
          {importAll.isPending ? "Importing…" : "Import all developers"}
        </Button>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add</Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center bg-white border border-black/10 rounded-xl p-3">
        <div className="text-sm text-black"><strong>{selected.size}</strong> of {filtered.length} selected</div>
        <Button size="sm" variant="outline" onClick={selectAllFiltered}>Select all filtered</Button>
        <Button size="sm" variant="outline" onClick={clearSelection} disabled={!selected.size}>Clear</Button>
        <div className="flex-1" />
        <Button
          size="sm"
          className="bg-black text-white hover:bg-gray-800"
          disabled={!selected.size}
          onClick={() => setBulkOpen(true)}
        >
          <Send className="w-3 h-3 mr-1" />Send to Selected ({selected.size})
        </Button>
      </div>

      {data.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
          {STATUS_DEV.map((s) => (
            <Card key={s.v} className={`cursor-pointer ${statusFilter === s.v ? "ring-2 ring-black" : ""}`} onClick={() => setStatusFilter(statusFilter === s.v ? "all" : s.v)}>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold">{counts[s.v] || 0}</div>
                <div className="text-[10px] uppercase text-gray-600 mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? <Skeleton className="h-64" /> : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">
          No developers match. Click <b>Pre-fill</b> to seed UAE developers.
        </CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((r: any) => {
            const sentDays = r.last_outreach_at
              ? Math.floor((Date.now() - new Date(r.last_outreach_at).getTime()) / 86400000)
              : null;
            return (
            <Card key={r.id} className={`bg-white text-black border ${selected.has(r.id) ? "border-black ring-1 ring-black" : "border-black/10"} hover:shadow-lg transition rounded-2xl`}>
              <CardContent className="p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-[260px]">
                    <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleSel(r.id)} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-black">{r.developer_name}</h3>
                        <InlineStatusSelect entityType="developer_registry" id={r.id} value={r.status} options={STATUS_DEV} />
                        {r.status === "registered" && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />Confirmed
                          </span>
                        )}
                        {sentDays !== null && r.status !== "registered" && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <Mail className="w-3 h-3" />Email sent {sentDays === 0 ? "today" : `${sentDays}d ago`}
                          </span>
                        )}
                        {r.outreach_count > 1 && <span className="text-xs text-emerald-700">×{r.outreach_count}</span>}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-gray-800">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Building2 className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="text-gray-500 shrink-0">Company:</span>
                          <span className="font-medium text-black truncate">{r.developer_name || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="text-gray-500 shrink-0">Office:</span>
                          <span className="font-medium text-black truncate">{r.emirate || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Phone className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="text-gray-500 shrink-0">Phone:</span>
                          {r.phone ? (
                            <a href={`tel:${r.phone}`} className="font-medium text-black underline truncate" onClick={(e) => e.stopPropagation()}>{r.phone}</a>
                          ) : (
                            <span className="font-medium text-black">—</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="text-gray-500 shrink-0">Email:</span>
                          {r.developer_email ? (
                            <a href={`mailto:${r.developer_email}`} className="font-medium text-black underline truncate" onClick={(e) => e.stopPropagation()}>{r.developer_email}</a>
                          ) : (
                            <span className="font-medium text-black">—</span>
                          )}
                        </div>
                        {r.website && (
                          <div className="flex items-center gap-1.5 min-w-0 sm:col-span-2">
                            <LinkIcon className="w-3 h-3 text-gray-500 shrink-0" />
                            <span className="text-gray-500 shrink-0">Website:</span>
                            <a href={r.website} target="_blank" rel="noopener noreferrer" className="font-medium text-black underline truncate" onClick={(e) => e.stopPropagation()}>{r.website}</a>
                          </div>
                        )}
                        {r.agency_code && (
                          <div className="flex items-center gap-1.5 min-w-0 sm:col-span-2">
                            <span className="text-gray-500 shrink-0">Agency code:</span>
                            <span className="font-medium text-black">{r.agency_code}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-amber-900 mb-0.5">
                          <Users className="w-3 h-3" />Point of Contact
                        </div>
                        {(r.developer_contact?.name || r.developer_contact?.role || r.developer_contact?.phone || r.developer_contact?.email) ? (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-black">
                            <span className="font-semibold">{r.developer_contact?.name || "—"}</span>
                            {r.developer_contact?.role && <span className="text-gray-700">· {r.developer_contact.role}</span>}
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
                          className="mt-1 text-xs text-left text-gray-600 hover:text-black italic block w-full"
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
                    <Button size="sm" variant="outline" onClick={() => quickReminder(r)}><Bell className="w-3 h-3 mr-1" />Remind</Button>
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
        </div>
      )}
      </>
      )}

      <TemplateEditorDialog open={tplOpen} onOpenChange={setTplOpen} />
      <BulkSendDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        selected={selectedDevs}
        defaultTestEmail={ownerSettings?.cc_email || "infoo.jane@gmail.com"}
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
const CRMRelationships = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("brokerages");

  return (
    <>
      <SEOHead title="CRM Relationships | JBJ Global" description="Manage brokerages, clients and developer registrations" canonicalPath="/crm/relationships" />
      <div className="min-h-screen bg-[#FAF7F2] w-full">
        <div className="w-full px-4 md:px-8 lg:px-12 pt-[112px] pb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-6 border-b border-black/10">
            <Button
              variant="outline"
              onClick={() => navigate("/owner/crm")}
              className="h-11 px-6 bg-white border-2 border-black/10 text-black hover:bg-black hover:text-white hover:border-black rounded-full font-semibold shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />Back to CRM Hub
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight">Relationships Hub</h1>
              <p className="text-sm text-gray-700 mt-2">Brokerages · Clients · Developer Registrations — all in one premium workspace.</p>
            </div>
            <div className="hidden md:block w-[180px]" aria-hidden />
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-6 bg-white border border-black/10 p-1 rounded-xl">
              <TabsTrigger value="brokerages" className="text-gray-700 data-[state=active]:bg-black data-[state=active]:text-white hover:bg-black/5 rounded-lg px-5 font-semibold"><Building2 className="w-4 h-4 mr-2" />Brokerages</TabsTrigger>
              <TabsTrigger value="clients" className="text-gray-700 data-[state=active]:bg-black data-[state=active]:text-white hover:bg-black/5 rounded-lg px-5 font-semibold"><Users className="w-4 h-4 mr-2" />Clients</TabsTrigger>
              <TabsTrigger value="developers" className="text-gray-700 data-[state=active]:bg-black data-[state=active]:text-white hover:bg-black/5 rounded-lg px-5 font-semibold"><FileSignature className="w-4 h-4 mr-2" />Developer Registry</TabsTrigger>
            </TabsList>
            <TabsContent value="brokerages"><BrokeragesTab /></TabsContent>
            <TabsContent value="clients"><ClientsTab /></TabsContent>
            <TabsContent value="developers"><DeveloperRegistryTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default CRMRelationships;
