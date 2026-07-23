import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BrokerageExcelImportDialog from "@/components/owner/BrokerageExcelImportDialog";
import BrandedEmailsLauncherCard from "@/components/crm/BrandedEmailsLauncherCard";
import BrandedEmailDashboard from "@/components/crm/branded-emails/BrandedEmailDashboard";
import PendingBrokerageImportsSection from "@/components/owner/PendingBrokerageImportsSection";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Building2, Download, FileSpreadsheet, Plus, Trash2, Upload, UserRound, Users, ChevronDown, Database, Inbox as InboxIcon, RefreshCw, CalendarClock, Send } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { statusColor, BROKERAGE_REGISTRATION_STATUS_OPTIONS } from "@/utils/crmStatusPalette";

const GROUP_OPTIONS = [
  { value: "pending_group_status", label: "None" },
  { value: "has_group", label: "Has group" },
  { value: "no_group", label: "No group" },
  { value: "group_not_required", label: "Group not required" },
];

const BRIEFING_STATUS_OPTIONS = [
  { value: "__none__", label: "None" },
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "postponed", label: "Postponed" },
  { value: "briefing_done", label: "Briefing done" },
  { value: "declined", label: "Declined" },
  { value: "rejected", label: "Rejected" },
];

const CONTACT_ROLE_OPTIONS = ["Owner", "Admin", "Sales", "Broker", "Off-plan", "Secondary", "Marketing", "Finance", "Legal", "Other"];

export default function BrokeragePortal() {
  const qc = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"all" | "jbj" | "list">("all");
  const [listId, setListId] = useState<string>("all");
  const [specialty, setSpecialty] = useState<"all" | "secondary" | "off_plan" | "both">("all");
  const [visibleLimit, setVisibleLimit] = useState(60);

  useEffect(() => { setVisibleLimit(60); }, [search, view, listId, specialty]);
  useEffect(() => {
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ["brokerage-portal-brokerages"] });
      qc.invalidateQueries({ queryKey: ["brokerage-portal-stats"] });
      qc.invalidateQueries({ queryKey: ["brokerage-portal-dld-runs"] });
      qc.invalidateQueries({ queryKey: ["brokerage-portal-dld-new-brokerages"] });
    };
    window.addEventListener("brokerage-portal-refresh", refresh);
    return () => window.removeEventListener("brokerage-portal-refresh", refresh);
  }, [qc]);


  const brokeragesQ = useQuery({ queryKey: ["brokerage-portal-brokerages"], queryFn: async () => {
    const { data, error } = await supabase.from("crm_brokerages" as any).select("id,company_name,website,phone,email,emirate,country,office_location,office_address,registration_status,group_status,attended_briefing,briefing_count,briefing_status,database_source,original_filename,list_id,logo_url,source,source_detail,specialty_focus,assigned_to,updated_at").is("deleted_at", null).order("company_name").limit(5000);
    if (error) throw error; return (data ?? []) as any[];
  }});
  const listsQ = useQuery({ queryKey: ["brokerage-portal-lists"], queryFn: async () => {
    const { data, error } = await supabase.from("crm_lead_lists" as any).select("id,name,source_filename,created_at").eq("kind", "brokerages").is("archived_at", null).order("created_at", { ascending: false });
    if (error) throw error; return (data ?? []) as any[];
  }});
  const membersQ = useQuery({ queryKey: ["brokerage-portal-members"], queryFn: async () => {
    const { data, error } = await supabase.from("crm_brokerage_list_members" as any).select("list_id,brokerage_id,merge_to_main").limit(10000);
    if (error) throw error; return (data ?? []) as any[];
  }});
  const jbjQ = useQuery({ queryKey: ["brokerage-portal-jbj-brokers"], queryFn: async () => {
    const { data, error } = await supabase.from("crm_brokers" as any).select("id,full_name,email_lower,personal_email,company_email,phone_e164,personal_phone,company_phone,whatsapp,current_company,position_title,role_title,broker_type,verification_status,registration_status,partnership_status,database_source,original_filename,updated_at,created_at").order("full_name").limit(1000);
    if (error) throw error; return (data ?? []) as any[];
  }});
  const agentsQ = useQuery({ queryKey: ["brokerage-portal-agents"], queryFn: async () => {
    const { data, error } = await supabase.from("crm_brokerage_agents" as any).select("id,brokerage_id,name,role,email,phone,whatsapp,status,broker_id").order("created_at", { ascending: true }).limit(20000);
    if (error) throw error; return (data ?? []) as any[];
  }});
  const statsQ = useQuery({ queryKey: ["brokerage-portal-stats"], queryFn: async () => {
    const [agencies, brokers, uploaded, updated] = await Promise.all([
      supabase.from("crm_brokerages" as any).select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("crm_brokers" as any).select("id", { count: "exact", head: true }),
      supabase.from("crm_brokers" as any).select("id", { count: "exact", head: true }).or("database_source.not.is.null,original_filename.not.is.null,upload_source.not.is.null"),
      // Truthful "updated" count: only rows edited AFTER creation (>5s gap excludes seed/import churn).
      supabase.rpc("count_truly_updated_brokers" as any).then(
        (r: any) => ({ count: typeof r?.data === "number" ? r.data : 0, error: r?.error ?? null }),
        () => ({ count: 0, error: null })
      ),
    ]);
    return { agencies: agencies.count ?? 0, brokers: brokers.count ?? 0, uploaded: uploaded.count ?? 0, updated: (updated as any).count ?? 0 };
  }});

  const visibleBrokerages = useMemo(() => {
    const rows = brokeragesQ.data ?? [];
    const members = membersQ.data ?? [];
    const mergedIds = new Set(members.filter((m) => m.merge_to_main).map((m) => m.brokerage_id));
    const listIds = new Set(members.filter((m) => listId !== "all" && m.list_id === listId).map((m) => m.brokerage_id));
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (view === "all" && r.list_id && !mergedIds.has(r.id)) return false;
      if (view === "list" && listId !== "all" && !listIds.has(r.id)) return false;
      if (specialty !== "all") { const uiSpec = ({ secondary_first: "secondary", offplan_first: "off_plan", equal: "both" } as any)[r.specialty_focus] || "both"; if (uiSpec !== specialty) return false; }
      if (!q) return true;
      return [r.company_name, r.email, r.phone, r.emirate, r.database_source].some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [brokeragesQ.data, membersQ.data, search, view, listId, specialty]);


  const visibleJbj = useMemo(() => (jbjQ.data ?? []).filter((b) => !search || [b.full_name, b.email_lower, b.personal_email, b.company_email, b.phone_e164, b.personal_phone, b.company_phone, b.current_company, b.position_title, b.role_title].some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase()))), [jbjQ.data, search]);
  const visibleBrokerageCards = useMemo(() => visibleBrokerages.slice(0, visibleLimit), [visibleBrokerages, visibleLimit]);
  const agentsByBrokerage = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const a of agentsQ.data ?? []) {
      if (!a.brokerage_id) continue;
      (map[a.brokerage_id] ||= []).push(a);
    }
    return map;
  }, [agentsQ.data]);

  const updateBrokerage = useMutation({ mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
    const { error } = await supabase.from("crm_brokerages" as any).update(patch as any).eq("id", id); if (error) throw error;
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ["brokerage-portal-brokerages"] }), onError: (e: any) => toast.error(e.message || "Could not update brokerage") });
  const addAgent = useMutation({ mutationFn: async (brokerageId: string) => {
    const { error } = await supabase.from("crm_brokerage_agents" as any).insert({ brokerage_id: brokerageId, role: "Admin", status: "active" } as any); if (error) throw error;
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ["brokerage-portal-agents"] }), onError: (e: any) => toast.error(e.message || "Could not add contact") });
  const updateAgent = useMutation({ mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
    const { error } = await supabase.from("crm_brokerage_agents" as any).update(patch as any).eq("id", id); if (error) throw error;
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ["brokerage-portal-agents"] }), onError: (e: any) => toast.error(e.message || "Could not update contact") });
  const deleteAgent = useMutation({ mutationFn: async (id: string) => {
    const { error } = await supabase.from("crm_brokerage_agents" as any).delete().eq("id", id); if (error) throw error;
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ["brokerage-portal-agents"] }), onError: (e: any) => toast.error(e.message || "Could not remove contact") });

  const exportRows = () => {
    const rows = view === "jbj" ? visibleJbj.map((b) => ({ Name: b.full_name, Email: b.email_lower || b.company_email || b.personal_email, Phone: b.phone_e164 || b.company_phone || b.personal_phone, Company: b.current_company, Title: b.position_title || b.role_title, Status: b.registration_status || b.verification_status, Source: b.database_source || b.original_filename })) : visibleBrokerages.map((b) => ({ Brokerage: b.company_name, Email: b.email, Phone: b.phone, Emirate: b.emirate, Registration: b.registration_status ?? "not_registered", Group: b.group_status ?? "pending_group_status", Briefing: b.attended_briefing ? "Yes" : "No", Database: b.database_source ?? b.original_filename ?? "" }));
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" })); a.download = `JBJ-brokerage-portal-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  return <div className="space-y-5 max-w-full overflow-hidden">
    <div className="rounded-[28px] border border-[#B89555]/35 bg-[linear-gradient(135deg,#FDFBF7_0%,#F7F2EA_55%,#EFE6D6_100%)] p-5 md:p-6 shadow-[0_24px_60px_-42px_rgba(26,26,26,0.45)]">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0"><span data-surface="emerald" className="allow-white shrink-0 size-12 rounded-2xl jj-emerald-metallic flex items-center justify-center"><Building2 className="size-5 text-white" /></span><div><p className="text-[11px] uppercase tracking-[0.24em] font-black text-[#B89555]">Owner Backend · Brokers</p><h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Broker Portal</h1><p className="text-sm text-[#1A1A1A]/70 mt-1 max-w-3xl">Owner-only command center for JBJ brokers, external brokerage agencies, uploaded management databases, registration status, group status, briefings and exports.</p></div></div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="gold" className="gap-1"><Plus className="size-4" /> Add <ChevronDown className="size-3.5 opacity-70" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#FDFBF7] border-[#B89555]/40 min-w-[240px]">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.16em] font-black text-[#B89555]">Add to Broker Portal</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#B89555]/20" />
              <DropdownMenuItem onSelect={() => { toast.info("Use Import → Single-row template to add one brokerage. Upload database supports single rows too."); setImportOpen(true); }} className="gap-2 text-[#1A1A1A]"><Building2 className="size-4 text-[#064E3B]" /> Add a brokerage</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast.info("Individual broker intake coming next turn — for now, upload a single-row Excel via 'Upload a database'.")} className="gap-2 text-[#1A1A1A]"><UserRound className="size-4 text-[#064E3B]" /> Add an individual broker</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#B89555]/20" />
              <DropdownMenuItem onSelect={() => setImportOpen(true)} className="gap-2 text-[#1A1A1A]"><Database className="size-4 text-[#064E3B]" /> Upload a database (Excel / CSV)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" onClick={exportRows}><Download className="size-4 mr-1" /> Download</Button>
        </div>
      </div>
    </div>
    <BrokerageExcelImportDialog open={importOpen} onOpenChange={setImportOpen} onDone={() => { qc.invalidateQueries({ queryKey: ["brokerage-portal-brokerages"] }); qc.invalidateQueries({ queryKey: ["brokerage-portal-lists"] }); qc.invalidateQueries({ queryKey: ["brokerage-portal-members"] }); }} />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {([
        ["Total agencies", statsQ.data?.agencies, "all"],
        ["Total brokers", statsQ.data?.brokers, "jbj"],
        ["Uploaded brokers", statsQ.data?.uploaded, "list"],
      ] as const).map(([label, value, target]) => (
        <button
          key={label}
          type="button"
          onClick={() => setView(target as any)}
          className={`p-4 rounded-xl text-left transition bg-[#F7F2EA] border ${view === target ? "border-[#064E3B] ring-1 ring-[#064E3B]/30" : "border-[#B89555]/30 hover:border-[#064E3B]/40"}`}
        >
          <p className="text-[10px] uppercase tracking-[0.16em] font-black text-[#1A1A1A]/55">{label}</p>
          <p className="mt-1 text-2xl font-black text-[#064E3B]">{typeof value === "number" ? value.toLocaleString() : "—"}</p>
        </button>
      ))}
    </div>
    <AutomationsStrip />
    <Tabs defaultValue="new-dld" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-white border border-[#064E3B]/15 p-1 h-auto rounded-lg">
        <TabsTrigger value="new-dld" style={{ ['--tw-text-opacity' as any]: 1 }} className="data-[state=active]:!bg-[#064E3B] data-[state=active]:!text-white data-[state=active]:![-webkit-text-fill-color:#ffffff] text-[#064E3B] font-black">DLD daily additions</TabsTrigger>
        <TabsTrigger value="email-status" className="data-[state=active]:!bg-[#064E3B] data-[state=active]:!text-white data-[state=active]:![-webkit-text-fill-color:#ffffff] text-[#064E3B] font-black">Emails sent + replies</TabsTrigger>
        <TabsTrigger value="approval" className="data-[state=active]:!bg-[#064E3B] data-[state=active]:!text-white data-[state=active]:![-webkit-text-fill-color:#ffffff] text-[#064E3B] font-black">Uploaded approval</TabsTrigger>
      </TabsList>
      <TabsContent value="new-dld" className="mt-4"><DldSyncHistoryPanel /></TabsContent>
      <TabsContent value="email-status" className="mt-4 space-y-4"><BrandedEmailsLauncherCard variant="broker" /><BrandedEmailDashboard kind="brokerages" /></TabsContent>
      <TabsContent value="approval" className="mt-4"><PendingBrokerageImportsSection /></TabsContent>
    </Tabs>


    <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30 flex items-center gap-3 flex-wrap shadow-[0_18px_45px_-34px_rgba(26,26,26,0.35)]">
      <Input placeholder="Search brokerage, broker, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-80 bg-[#FDFBF7] text-[#1A1A1A]" />
      <Button size="sm" variant={view === "all" ? "gold" : "outline"} onClick={() => setView("all")}><Building2 className="size-4 mr-1" /> All brokerages</Button>
      <Button size="sm" variant={view === "jbj" ? "gold" : "outline"} onClick={() => setView("jbj")}><Users className="size-4 mr-1" /> Individual brokers</Button>
      <Button size="sm" variant={view === "list" ? "gold" : "outline"} onClick={() => setView("list")}><FileSpreadsheet className="size-4 mr-1" /> Uploaded database</Button>
      {view === "list" && <Select value={listId} onValueChange={setListId}><SelectTrigger className="w-72 h-9 bg-[#FDFBF7] text-[#1A1A1A]"><SelectValue placeholder="Select database" /></SelectTrigger><SelectContent className="bg-[#FDFBF7] border-[#B89555]/40"><SelectItem value="all">All uploaded databases</SelectItem>{(listsQ.data ?? []).map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>}
      {view !== "jbj" && <div className="flex items-center gap-1 ml-1">
        <span className="text-[10px] uppercase tracking-[0.14em] font-black text-[#1A1A1A]/60 mr-1">Specialty</span>
        {([["all","All"],["secondary","Secondary"],["off_plan","Off-plan"],["both","Both"]] as const).map(([v,label]) => (
          <Button key={v} size="sm" variant={specialty === v ? "gold" : "outline"} onClick={() => setSpecialty(v as any)} className="h-8 px-3">{label}</Button>
        ))}
      </div>}
      <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] ml-auto">
        {(view === "jbj" ? visibleJbj.length : visibleBrokerages.length).toLocaleString()} of {((view === "jbj" ? statsQ.data?.brokers : statsQ.data?.agencies) ?? 0).toLocaleString()} shown
      </Badge>
    </Card>
    {view === "jbj" ? <Card className="bg-[#FDFBF7] border border-[#B89555]/30 overflow-x-auto"><table className="w-full min-w-[1080px] text-sm"><thead className="bg-[#EFE6D6]"><tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#1A1A1A]/70"><th className="px-4 py-3">Broker</th><th className="px-4 py-3">Broker #</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Source</th><th className="px-4 py-3 whitespace-nowrap">Status</th></tr></thead><tbody>{visibleJbj.slice(0, visibleLimit).map((b) => <tr key={b.id} className="border-t border-[#B89555]/15"><td className="px-4 py-3 font-black text-[#1A1A1A]"><span className="inline-flex items-center gap-2"><UserRound className="size-4 text-[#064E3B]" />{b.full_name || "Unnamed broker"}</span></td><td className="px-4 py-3 text-[#1A1A1A] whitespace-nowrap">{b.broker_number || b.rera_number || b.license_number || "—"}</td><td className="px-4 py-3 text-[#1A1A1A]">{b.email_lower || b.company_email || b.personal_email || b.phone_e164 || b.company_phone || b.personal_phone || "—"}</td><td className="px-4 py-3 text-[#1A1A1A]">{b.current_company || "—"}</td><td className="px-4 py-3 text-[#1A1A1A]">{b.broker_type || b.position_title || b.role_title || "—"}</td><td className="px-4 py-3 text-[#1A1A1A]">{b.database_source || b.original_filename || "—"}</td><td className="px-4 py-3 whitespace-nowrap"><span data-label-emerald-only className="jj-pill-emerald-metallic allow-white text-white border-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-[0.12em] whitespace-nowrap">{b.registration_status || b.verification_status || b.partnership_status || "imported"}</span></td></tr>)}</tbody></table></Card> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{visibleBrokerageCards.map((b) => <BrokerageCard key={b.id} row={b} agents={agentsByBrokerage[b.id] ?? []} onPatch={(patch) => updateBrokerage.mutate({ id: b.id, patch })} onAddAgent={() => addAgent.mutate(b.id)} onPatchAgent={(id, patch) => updateAgent.mutate({ id, patch })} onDeleteAgent={(id) => deleteAgent.mutate(id)} />)}</div>}
    {((view === "jbj" ? visibleJbj.length : visibleBrokerages.length) > visibleLimit) && <div className="flex justify-center py-3"><Button variant="outline" onClick={() => setVisibleLimit((n) => n + 60)}>Load {Math.min(60, (view === "jbj" ? visibleJbj.length : visibleBrokerages.length) - visibleLimit)} more</Button></div>}
  </div>;
}

function AutomationsStrip() {
  const [busy, setBusy] = useState<"gmail" | "dld" | "all" | null>(null);
  const dldQ = useQuery({
    queryKey: ["automations-dld-last"],
    queryFn: async () => {
      const { data } = await supabase.from("dld_daily_sync_runs" as any).select("run_started_at,run_finished_at,status,agencies_inserted,brokers_inserted").order("run_started_at", { ascending: false }).limit(1);
      return (data?.[0] as any) ?? null;
    },
  });
  const inboxQ = useQuery({
    queryKey: ["automations-inbox-last"],
    queryFn: async () => {
      const { data } = await supabase.from("owner_comm_messages" as any).select("created_at").order("created_at", { ascending: false }).limit(1);
      return (data?.[0] as any) ?? null;
    },
  });
  const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString() : "Never");
  const runGmail = async () => {
    setBusy("gmail");
    try {
      const { data, error } = await supabase.functions.invoke("gmail-inbox-sync", { body: {} });
      if (error) throw error;
      const synced = Number((data as any)?.synced ?? 0);
      if (synced > 0) toast.success(`Inbox refreshed — ${synced} new message${synced === 1 ? "" : "s"}`);
      else toast.message("Inbox up to date — no new messages");
      inboxQ.refetch();
    } catch (e: any) { toast.error(e?.message || "Inbox sync failed"); } finally { setBusy(null); }
  };
  const runDld = async (mode: "market" | "all") => {
    setBusy(mode === "market" ? "dld" : "all");
    try {
      const snap = await supabase.functions.invoke("dld-daily-ingest", { body: {} });
      if (snap.error) throw snap.error;
      if (mode === "market") {
        const total = Number((snap.data as any)?.total ?? 0);
        if (total > 0) toast.success(`DLD market snapshot pulled — ${total.toLocaleString()} transactions`);
        else toast.warning("DLD market snapshot returned 0 rows — upstream may be unavailable");
      } else {
        const reg = await supabase.functions.invoke("dld-broker-sync", { body: {} });
        if (reg.error) throw reg.error;
        const r = (reg.data as any) || {};
        const a = r.agencies_inserted ?? 0;
        const b = r.brokers_inserted ?? 0;
        if (a === 0 && b === 0) {
          toast.warning(`DLD register returned 0 new rows — upstream (dubaipulse.gov.ae) may be blocked. ${r.error ? `Details: ${r.error}` : ""}`);
        } else {
          toast.success(`DLD sync complete — ${a} agencies · ${b} brokers${r.error ? ` (partial: ${r.error})` : ""}`);
        }
      }
      dldQ.refetch();
      queryClientInvalidateBrokeragePortal();
    } catch (e: any) { toast.error(e?.message || "DLD sync failed"); } finally { setBusy(null); }
  };
  const last = dldQ.data as any;
  const lastCount = last ? `${last.agencies_inserted ?? 0} agencies · ${last.brokers_inserted ?? 0} brokers` : "";
  const lastStatus = last?.status as string | undefined;
  return (
    <Card className="p-0 bg-[#FDFBF7] border border-[#B89555]/30 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
      <div className="flex flex-col justify-between gap-3 p-4 md:border-r border-[#B89555]/25 min-h-[160px]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] font-black text-[#064E3B]">Gmail inbox · infoo.jane@gmail.com</p>
          <p className="text-[10px] uppercase tracking-[0.14em] font-black text-[#064E3B]/70 mt-0.5">Auto · every 5 min</p>
          <p className="text-xs text-[#1A1A1A]/70 mt-2">Last message ingested: <span className="font-black text-[#1A1A1A]">{fmt(inboxQ.data?.created_at)}</span></p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" disabled={busy === "gmail"} onClick={runGmail} title="Refresh now" aria-label="Refresh inbox now">
            <RefreshCw className={`size-4 ${busy === "gmail" ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" variant="gold" asChild>
            <Link to="/owner/inbox"><InboxIcon className="size-4 mr-1" /> Inbox</Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-col justify-between gap-3 p-4 min-h-[160px]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] font-black text-[#064E3B]">DLD daily sync — brokers + brokerages</p>
          <p className="text-[10px] uppercase tracking-[0.14em] font-black text-[#064E3B]/70 mt-0.5">Auto · daily 03:00 UTC</p>
          <p className="text-xs text-[#1A1A1A]/70 mt-2">
            Last run: <span className="font-black text-[#1A1A1A]">{fmt(last?.run_started_at)}</span>{lastCount ? ` · ${lastCount}` : ""}
            {lastStatus && lastStatus !== "success" && <span className="ml-2 text-[#8B1F1F] font-black uppercase">· {lastStatus}</span>}
          </p>
          <p className="text-[10px] text-[#1A1A1A]/55 mt-1">
            <span className="font-black">Market snapshot</span> pulls DLD market data only. <span className="font-black">Sync all</span> also imports brokers &amp; brokerages from the DLD register.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" disabled={busy === "dld"} onClick={() => runDld("market")}>{busy === "dld" ? "Running…" : "Market snapshot"}</Button>
          <Button size="sm" variant="gold" disabled={busy === "all"} onClick={() => runDld("all")}>{busy === "all" ? "Running…" : "Sync all (brokers + brokerages)"}</Button>
        </div>
      </div>
    </Card>
  );
}

function queryClientInvalidateBrokeragePortal() {
  // Custom event lets this isolated strip refresh the parent portal queries
  // without threading callbacks through the existing layout.
  window.dispatchEvent(new CustomEvent("brokerage-portal-refresh"));
}

type DldRun = {
  id: string;
  run_started_at: string | null;
  status: string | null;
  agencies_inserted: number | null;
  agencies_updated: number | null;
  brokers_inserted: number | null;
  brokers_updated: number | null;
  brokerages_new: number | null;
  developers_new: number | null;
  error_message: string | null;
  raw_summary: any;
};

function DldSyncHistoryPanel() {
  const [mode, setMode] = useState<"all" | "daily">("daily");
  const runsQ = useQuery({
    queryKey: ["brokerage-portal-dld-runs"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("dld_daily_sync_runs")
        .select("id,run_started_at,status,agencies_inserted,agencies_updated,brokers_inserted,brokers_updated,brokerages_new,developers_new,error_message,raw_summary")
        .order("run_started_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as DldRun[];
    },
    refetchInterval: 45_000,
  });
  const newBrokeragesQ = useQuery({
    queryKey: ["brokerage-portal-dld-new-brokerages", mode],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let q = (supabase.from as any)("crm_brokerages")
        .select("id,company_name,email,phone,website,office_location,dld_area,dld_office_number,first_seen_at,outreach_stage,last_outreach_at,relationship_status")
        .eq("dld_source", "dld_daily")
        .order("first_seen_at", { ascending: false })
        .limit(mode === "daily" ? 120 : 500);
      if (mode === "daily") q = q.gte("first_seen_at", today.toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
    refetchInterval: 45_000,
  });

  const groupedRuns = useMemo(() => {
    const map = new Map<string, DldRun[]>();
    for (const run of runsQ.data ?? []) {
      const day = run.run_started_at ? new Date(run.run_started_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Unknown date";
      map.set(day, [...(map.get(day) ?? []), run]);
    }
    return [...map.entries()];
  }, [runsQ.data]);

  const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString() : "—");
  const inserted = (run: DldRun) => Number(run.agencies_inserted ?? run.brokerages_new ?? run.raw_summary?.brokerage?.inserted ?? 0);
  const updated = (run: DldRun) => Number(run.agencies_updated ?? run.raw_summary?.brokerage?.flagged ?? 0);

  return (
    <Card className="p-0 bg-white border border-[#B89555]/30 shadow-[0_18px_45px_-34px_rgba(6,78,59,0.35)] overflow-hidden">
      <details className="group">
        <summary className="list-none cursor-pointer flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-5 hover:bg-[#F8FAF9] transition">
          <div className="flex items-start gap-3 min-w-0">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-[#064E3B] text-white transition group-open:rotate-90" aria-hidden="true">
              <CalendarClock className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] font-black text-[#064E3B]">DLD sync history</p>
              <h2 className="text-xl font-black text-[#0F1A16]">Fresh imports and untouched agencies</h2>
              <p className="text-sm text-[#4B5D55] mt-1">Click to expand. New DLD brokerages are labeled untouched until the first outreach email is logged.</p>
            </div>
          </div>
          <div className="flex rounded-md border border-[#064E3B]/20 bg-white p-1 shrink-0" onClick={(e) => e.preventDefault()}>
            {(["daily", "all"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMode(value); }}
                className="inline-flex items-center justify-center rounded px-3 h-8 min-w-[92px] text-xs font-black uppercase tracking-[0.12em] transition"
                style={{
                  background: mode === value ? "#064E3B" : "transparent",
                  color: mode === value ? "#FFFFFF" : "#064E3B",
                  WebkitTextFillColor: mode === value ? "#FFFFFF" : "#064E3B",
                }}
              >
                {value === "daily" ? "Today" : "See all"}
              </button>
            ))}
          </div>
        </summary>
        <div className="px-5 pb-5 grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4">
        <div className="rounded-lg border border-[#064E3B]/15 overflow-hidden bg-[#F8FAF9]">
          <div className="px-3 py-2 bg-white border-b border-[#064E3B]/10 flex items-center gap-2 text-[#064E3B] font-black text-xs uppercase tracking-[0.16em]"><CalendarClock className="size-4" /> Daily log</div>
          <div className="max-h-[360px] overflow-auto divide-y divide-[#064E3B]/10">
            {runsQ.isLoading ? <p className="p-4 text-sm text-[#4B5D55]">Loading sync runs…</p> : groupedRuns.length === 0 ? <p className="p-4 text-sm text-[#4B5D55]">No DLD sync runs logged yet.</p> : groupedRuns.map(([day, runs]) => (
              <div key={day} className="p-3">
                <p className="text-xs font-black text-[#0F1A16]">{day}</p>
                <div className="mt-2 space-y-2">
                  {runs.map((run) => (
                    <div key={run.id} className="rounded-md bg-white border border-[#064E3B]/10 p-2 text-xs text-[#4B5D55]">
                      <div className="flex items-center justify-between gap-2"><span className="font-black text-[#0F1A16]">{fmt(run.run_started_at)}</span><span className="font-black text-[#064E3B] uppercase">{run.status || "unknown"}</span></div>
                      <p className="mt-1">Added {inserted(run).toLocaleString()} agencies · flagged/updated {updated(run).toLocaleString()} · brokers {Number(run.brokers_inserted ?? 0).toLocaleString()}</p>
                      {run.error_message && <p className="mt-1 text-[#8B1F1F] font-semibold">{run.error_message}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[#064E3B]/15 overflow-hidden bg-white">
          <div className="px-3 py-2 bg-[#F8FAF9] border-b border-[#064E3B]/10 flex items-center justify-between gap-2">
            <span className="text-[#064E3B] font-black text-xs uppercase tracking-[0.16em]">{mode === "daily" ? "New today" : "All new DLD brokerages"}</span>
            <Badge variant="outline" className="border-[#064E3B]/35 text-[#064E3B]">{(newBrokeragesQ.data ?? []).length.toLocaleString()} shown</Badge>
          </div>
          <div className="max-h-[360px] overflow-auto">
            {newBrokeragesQ.isLoading ? <p className="p-4 text-sm text-[#4B5D55]">Loading new agencies…</p> : (newBrokeragesQ.data ?? []).length === 0 ? <p className="p-4 text-sm text-[#4B5D55]">No new DLD brokerages for this view.</p> : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white text-left text-[10px] uppercase tracking-[0.14em] text-[#064E3B]"><tr><th className="px-3 py-2">Agency</th><th className="px-3 py-2">Contact</th><th className="px-3 py-2">Status</th></tr></thead>
                <tbody className="divide-y divide-[#064E3B]/10">
                  {(newBrokeragesQ.data ?? []).map((row) => {
                    const untouched = !row.last_outreach_at;
                    return <tr key={row.id} className="text-[#0F1A16]"><td className="px-3 py-2"><p className="font-black">{row.company_name}</p><p className="text-xs text-[#4B5D55]">{row.dld_area || row.office_location || row.dld_office_number || "DLD register"}</p></td><td className="px-3 py-2 text-[#4B5D55]">{row.email || row.website || "—"}</td><td className="px-3 py-2"><span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase" style={{ background: untouched ? "#064E3B" : "#EFE6D6", color: untouched ? "#FFFFFF" : "#0F1A16", WebkitTextFillColor: untouched ? "#FFFFFF" : "#0F1A16" }}>{untouched ? <Send className="size-3" /> : null}{untouched ? "Untouched" : "Outreach sent"}</span></td></tr>;
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        </div>
      </details>
    </Card>
  );
}




function BrokerageCard({ row, agents, onPatch, onAddAgent, onPatchAgent, onDeleteAgent }: { row: any; agents: any[]; onPatch: (patch: Record<string, unknown>) => void; onAddAgent: () => void; onPatchAgent: (id: string, patch: Record<string, unknown>) => void; onDeleteAgent: (id: string) => void }) {
  const reg = row.registration_status || "not_registered";
  const group = row.group_status || "pending_group_status";
  const briefing = row.briefing_status || "__none__";
  const color = statusColor(reg);
  const domain = (() => {
    const raw = row.website || row.email || "";
    const m = String(raw).match(/@?([a-z0-9.-]+\.[a-z]{2,})/i);
    return m ? m[1].replace(/^www\./, "") : "";
  })();
  const logoCandidates = [row.logo_url, domain ? `https://logo.clearbit.com/${domain}` : null].filter(Boolean) as string[];
  return <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl shadow-[0_18px_42px_-34px_rgba(26,26,26,0.42)] flex flex-col h-full">
    <div className="flex items-start gap-3">
      <BrokerageLogo candidates={logoCandidates} name={row.company_name} />
      <div className="min-w-0 flex-1">
        <p className="font-black text-[#1A1A1A] text-[16px] leading-tight line-clamp-2 min-h-[2.5em]">{row.company_name || "Unnamed brokerage"}</p>
        <p className="text-xs text-[#1A1A1A]/60 truncate">{row.emirate || row.country || row.office_location || "UAE brokerage"}</p>
      </div>
    </div>
    <div className="mt-3 flex flex-wrap gap-1.5 min-h-[28px]">
      <Badge style={{ backgroundColor: color.cssBg, color: color.cssFg }} className="border border-[#B89555]/30">{color.label}</Badge>
      <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">{group.replace(/_/g, " ")}</Badge>
      {briefing !== "__none__" && <Badge className="bg-[#064E3B] text-white border-0 capitalize">{String(briefing).replace(/_/g, " ")}</Badge>}
      {(row.database_source || row.original_filename || row.source) && (
        <Badge variant="outline" className="border-[#064E3B]/40 text-[#064E3B] bg-white gap-1"><Database className="size-3" /> {row.database_source || row.original_filename || row.source}</Badge>
      )}
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-1 min-h-[26px]">
      <span className="text-[10px] uppercase tracking-[0.14em] font-black text-[#1A1A1A]/60 mr-1">Specialty</span>
      {(["secondary", "off_plan", "both"] as const).map((s) => {
        const dbVal = ({ secondary: "secondary_first", off_plan: "offplan_first", both: "equal" } as const)[s];
        const active = row.specialty_focus === dbVal;
        return <button key={s} type="button" onClick={() => onPatch({ specialty_focus: active ? null : dbVal })} className={`px-2 py-0.5 rounded-md text-[10px] font-black border transition ${active ? "bg-[#064E3B] text-white border-[#064E3B]" : "bg-white text-[#1A1A1A] border-[#B89555]/40 hover:bg-[#EFE6D6]"}`}>{s === "off_plan" ? "Off-plan" : s === "both" ? "Both" : "Secondary"}</button>;
      })}
    </div>
    <div className="mt-4 text-xs text-[#1A1A1A]">
      <div className="rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] p-2"><p className="font-black uppercase text-[10px] text-[#1A1A1A]/55">Email</p><Input value={row.email || ""} onChange={(e) => onPatch({ email: e.target.value })} className="mt-1 h-8 bg-white border-[#B89555]/25" placeholder="agency@email.com" /></div>
    </div>
    <div className="mt-3 rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] p-3 space-y-2 flex-1">
      <div className="flex items-center justify-between gap-2"><p className="text-[10px] uppercase tracking-[0.16em] font-black text-[#064E3B]">Contacts</p><Button size="sm" variant="outline" onClick={onAddAgent}><Plus className="size-3.5 mr-1" /> Add new</Button></div>
      <datalist id={`brokerage-contact-role-${row.id}`}>{CONTACT_ROLE_OPTIONS.map((o) => <option key={o} value={o} />)}</datalist>
      {agents.length === 0 && <p className="text-xs text-[#1A1A1A]/55">No contact people saved yet.</p>}
      {agents.slice(0, 4).map((agent) => <div key={agent.id} className="rounded-lg border border-[#B89555]/20 bg-white p-2 space-y-2">
        <div className="grid grid-cols-2 gap-2"><Input list={`brokerage-contact-role-${row.id}`} value={agent.role || ""} onChange={(e) => onPatchAgent(agent.id, { role: e.target.value })} className="h-8 border-[#B89555]/25" placeholder="Position" /><Input value={agent.name || ""} onChange={(e) => onPatchAgent(agent.id, { name: e.target.value })} className="h-8 border-[#B89555]/25" placeholder="Name" /></div>
        <div className="grid grid-cols-2 gap-2"><Input value={agent.email || ""} onChange={(e) => onPatchAgent(agent.id, { email: e.target.value })} className="h-8 border-[#B89555]/25" placeholder="Email" /><Input value={agent.phone || ""} onChange={(e) => onPatchAgent(agent.id, { phone: e.target.value })} className="h-8 border-[#B89555]/25" placeholder="Phone" /></div>
        <div className="flex gap-2"><Input value={agent.whatsapp || ""} onChange={(e) => onPatchAgent(agent.id, { whatsapp: e.target.value })} className="h-8 border-[#B89555]/25" placeholder="WhatsApp" /><Button size="sm" variant="outline" onClick={() => onDeleteAgent(agent.id)}><Trash2 className="size-3.5" /></Button></div>
      </div>)}
      {agents.length > 4 && <p className="text-xs text-[#1A1A1A]/60">+{agents.length - 4} more contacts connected to this brokerage</p>}
    </div>
    <div className="mt-3 grid gap-2">
      <Select value={reg} onValueChange={(v) => onPatch({ registration_status: v })}><SelectTrigger className="h-9 bg-[#FDFBF7] text-[#1A1A1A]"><SelectValue /></SelectTrigger><SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">{BROKERAGE_REGISTRATION_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
      <Select value={group} onValueChange={(v) => onPatch({ group_status: v })}><SelectTrigger className="h-9 bg-[#FDFBF7] text-[#1A1A1A]"><SelectValue /></SelectTrigger><SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">{GROUP_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
      <Select value={briefing} onValueChange={(v) => onPatch({ briefing_status: v === "__none__" ? null : v })}><SelectTrigger className="h-9 bg-[#FDFBF7] text-[#1A1A1A]"><SelectValue placeholder="Briefing status" /></SelectTrigger><SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">{BRIEFING_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
    </div>
  </Card>;
}