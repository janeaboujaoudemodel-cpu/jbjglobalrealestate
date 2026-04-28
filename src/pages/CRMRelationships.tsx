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
import { ArrowLeft, Plus, Search, Sparkles, Building2, Users, FileSignature, Download, Bell, Trash2, Send, Mail, Settings as SettingsIcon, Link as LinkIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SEOHead } from "@/components/SEOHead";
import {
  useBrokerages, useUpsertBrokerage, useDeleteBrokerage,
  useClients, useUpsertClient, useDeleteClient,
  useDeveloperRegistry, useSeedDeveloperRegistry, useUpsertDeveloperRegistry,
  useUpsertReminder,
  useOwnerSettings, useUpsertOwnerSettings, useSendDeveloperRegistration,
} from "@/hooks/useCRMRelationships";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const StatusPill = ({ value, options }: { value: string; options: typeof STATUS_BROKERAGE }) => {
  const o = options.find((s) => s.v === value) || options[0];
  return <Badge className={`${o.cls} border-0 font-semibold hover:${o.cls}`}>{o.label}</Badge>;
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
                      <StatusPill value={r.status} options={STATUS_BROKERAGE} />
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
                      <StatusPill value={r.status} options={STATUS_CLIENT} />
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
const DeveloperRegistryTab = () => {
  const { data = [], isLoading, refetch } = useDeveloperRegistry();
  const seed = useSeedDeveloperRegistry();
  const upsert = useUpsertDeveloperRegistry();
  const upsertReminder = useUpsertReminder();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const filtered = useMemo(() => data.filter((r: any) => {
    const matchesQ = !q || r.developer_name?.toLowerCase().includes(q.toLowerCase());
    const matchesS = statusFilter === "all" || r.status === statusFilter;
    return matchesQ && matchesS;
  }), [data, q, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    data.forEach((r: any) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [data]);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search developer" className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_DEV.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => exportCSV(filtered, `developer-registry-${Date.now()}.csv`, [
          { key: "developer_name", label: "Developer" }, { key: "status", label: "Status" },
          { key: "agency_code", label: "Agency Code" }, { key: "registration_date", label: "Registered" },
          { key: "expiry_date", label: "Expiry" }, { key: "developer_contact", label: "Contact" },
          { key: "notes", label: "Notes" },
        ])}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
        <Button variant="outline" onClick={() => seed.mutate()} disabled={seed.isPending}>
          {seed.isPending ? "Seeding…" : "Pre-fill UAE Developers"}
        </Button>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Developer</Button>
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
          No developers in registry. Click <b>Pre-fill UAE Developers</b> to load all major UAE developers.
        </CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((r: any) => (
            <Card key={r.id} className="bg-white text-black border border-black/10 hover:shadow-lg hover:border-black/20 transition rounded-2xl">
              <CardContent className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{r.developer_name}</h3>
                      <StatusPill value={r.status} options={STATUS_DEV} />
                      {r.agency_code && <span className="text-xs text-gray-500">Code: {r.agency_code}</span>}
                      {r.expiry_date && <span className="text-xs text-amber-700">Expires {r.expiry_date}</span>}
                    </div>
                    {r.developer_contact?.name && (
                      <div className="text-xs text-gray-600 mt-1">Contact: {r.developer_contact.name} {r.developer_contact.email && `· ${r.developer_contact.email}`}</div>
                    )}
                    {r.ai_next_action && (
                      <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                        <Sparkles className="w-3 h-3 inline mr-1 text-purple-600" />
                        <span className="font-medium text-purple-900">{r.ai_next_action}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => aiRecommend("developer_registry", r.id, refetch)}><Sparkles className="w-3 h-3 mr-1" />AI</Button>
                    <Button size="sm" variant="outline" onClick={() => quickReminder(r)}><Bell className="w-3 h-3 mr-1" />Remind</Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto p-4 md:p-6 pt-[100px]">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/owner/crm")}>
              <ArrowLeft className="w-4 h-4 mr-1" />Back to CRM
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Relationships Hub</h1>
              <p className="text-sm text-gray-600">Brokerages, clients, and developer registrations — all in one place.</p>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="brokerages"><Building2 className="w-4 h-4 mr-2" />Brokerages</TabsTrigger>
              <TabsTrigger value="clients"><Users className="w-4 h-4 mr-2" />Clients</TabsTrigger>
              <TabsTrigger value="developers"><FileSignature className="w-4 h-4 mr-2" />Developer Registry</TabsTrigger>
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
