import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BrokerageExcelImportDialog from "@/components/owner/BrokerageExcelImportDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Building2, Download, FileSpreadsheet, Plus, Trash2, Upload, UserRound, Users, ChevronDown, Database } from "lucide-react";
import { toast } from "sonner";
import { statusColor, BROKERAGE_REGISTRATION_STATUS_OPTIONS } from "@/utils/crmStatusPalette";

const GROUP_OPTIONS = [
  { value: "pending_group_status", label: "Pending group status" },
  { value: "has_group", label: "Has group" },
  { value: "no_group", label: "No group" },
  { value: "group_not_required", label: "Group not required" },
];

const CONTACT_ROLE_OPTIONS = ["Owner", "Admin", "Sales", "Broker", "Off-plan", "Secondary", "Marketing", "Finance", "Legal", "Other"];

export default function BrokeragePortal() {
  const qc = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"all" | "jbj" | "list">("all");
  const [listId, setListId] = useState<string>("all");
  const [visibleLimit, setVisibleLimit] = useState(60);

  useEffect(() => { setVisibleLimit(60); }, [search, view, listId]);

  const brokeragesQ = useQuery({ queryKey: ["brokerage-portal-brokerages"], queryFn: async () => {
    const { data, error } = await supabase.from("crm_brokerages" as any).select("id,company_name,website,phone,email,emirate,country,office_location,office_address,registration_status,group_status,attended_briefing,briefing_count,database_source,original_filename,list_id,updated_at").is("deleted_at", null).order("company_name").limit(5000);
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
      supabase.from("crm_brokers" as any).select("id", { count: "exact", head: true }).not("updated_at", "is", null),
    ]);
    return { agencies: agencies.count ?? 0, brokers: brokers.count ?? 0, uploaded: uploaded.count ?? 0, updated: updated.count ?? 0 };
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
      if (!q) return true;
      return [r.company_name, r.email, r.phone, r.emirate, r.database_source].some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [brokeragesQ.data, membersQ.data, search, view, listId]);

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        ["Total agencies", statsQ.data?.agencies],
        ["Total brokers", statsQ.data?.brokers],
        ["Uploaded brokers", statsQ.data?.uploaded],
        ["Updated brokers", statsQ.data?.updated],
      ].map(([label, value]) => <Card key={label as string} className="p-4 bg-[#F7F2EA] border border-[#B89555]/30"><p className="text-[10px] uppercase tracking-[0.16em] font-black text-[#1A1A1A]/55">{label}</p><p className="mt-1 text-2xl font-black text-[#064E3B]">{typeof value === "number" ? value.toLocaleString() : "—"}</p></Card>)}
    </div>
    <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30 flex items-center gap-3 flex-wrap shadow-[0_18px_45px_-34px_rgba(26,26,26,0.35)]">
      <Input placeholder="Search brokerage, broker, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-80 bg-[#FDFBF7] text-[#1A1A1A]" />
      <Button size="sm" variant={view === "all" ? "gold" : "outline"} onClick={() => setView("all")}><Building2 className="size-4 mr-1" /> All brokerages</Button>
      <Button size="sm" variant={view === "jbj" ? "gold" : "outline"} onClick={() => setView("jbj")}><Users className="size-4 mr-1" /> Individual brokers</Button>
      <Button size="sm" variant={view === "list" ? "gold" : "outline"} onClick={() => setView("list")}><FileSpreadsheet className="size-4 mr-1" /> Uploaded database</Button>
      {view === "list" && <Select value={listId} onValueChange={setListId}><SelectTrigger className="w-72 h-9 bg-[#FDFBF7] text-[#1A1A1A]"><SelectValue placeholder="Select database" /></SelectTrigger><SelectContent className="bg-[#FDFBF7] border-[#B89555]/40"><SelectItem value="all">All uploaded databases</SelectItem>{(listsQ.data ?? []).map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>}
      <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] ml-auto">
        {(view === "jbj" ? visibleJbj.length : visibleBrokerages.length).toLocaleString()} of {((view === "jbj" ? statsQ.data?.brokers : statsQ.data?.agencies) ?? 0).toLocaleString()} shown
      </Badge>
    </Card>
    {view === "jbj" ? <Card className="bg-[#FDFBF7] border border-[#B89555]/30 overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead className="bg-[#EFE6D6]"><tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#1A1A1A]/70"><th className="px-4 py-3">Broker</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{visibleJbj.slice(0, visibleLimit).map((b) => <tr key={b.id} className="border-t border-[#B89555]/15"><td className="px-4 py-3 font-black text-[#1A1A1A]"><span className="inline-flex items-center gap-2"><UserRound className="size-4 text-[#064E3B]" />{b.full_name || "Unnamed broker"}</span></td><td className="px-4 py-3 text-[#1A1A1A]">{b.email_lower || b.company_email || b.personal_email || b.phone_e164 || b.company_phone || b.personal_phone || "—"}</td><td className="px-4 py-3 text-[#1A1A1A]">{b.current_company || "—"}</td><td className="px-4 py-3 text-[#1A1A1A]">{b.broker_type || b.position_title || b.role_title || "—"}</td><td className="px-4 py-3 text-[#1A1A1A]">{b.database_source || b.original_filename || "—"}</td><td className="px-4 py-3"><Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">{b.registration_status || b.verification_status || b.partnership_status || "imported"}</Badge></td></tr>)}</tbody></table></Card> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{visibleBrokerageCards.map((b) => <BrokerageCard key={b.id} row={b} agents={agentsByBrokerage[b.id] ?? []} onPatch={(patch) => updateBrokerage.mutate({ id: b.id, patch })} onAddAgent={() => addAgent.mutate(b.id)} onPatchAgent={(id, patch) => updateAgent.mutate({ id, patch })} onDeleteAgent={(id) => deleteAgent.mutate(id)} />)}</div>}
    {((view === "jbj" ? visibleJbj.length : visibleBrokerages.length) > visibleLimit) && <div className="flex justify-center py-3"><Button variant="outline" onClick={() => setVisibleLimit((n) => n + 60)}>Load {Math.min(60, (view === "jbj" ? visibleJbj.length : visibleBrokerages.length) - visibleLimit)} more</Button></div>}
  </div>;
}

function BrokerageCard({ row, agents, onPatch, onAddAgent, onPatchAgent, onDeleteAgent }: { row: any; agents: any[]; onPatch: (patch: Record<string, unknown>) => void; onAddAgent: () => void; onPatchAgent: (id: string, patch: Record<string, unknown>) => void; onDeleteAgent: (id: string) => void }) {
  const reg = row.registration_status || "not_registered";
  const group = row.group_status || "pending_group_status";
  const color = statusColor(reg);
  return <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl shadow-[0_18px_42px_-34px_rgba(26,26,26,0.42)]">
    <div className="flex items-start gap-3"><div className="size-12 rounded-xl jj-emerald-metallic flex items-center justify-center text-white font-black">{String(row.company_name || "B").slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="font-black text-[#1A1A1A] text-[16px] leading-tight truncate">{row.company_name || "Unnamed brokerage"}</p><p className="text-xs text-[#1A1A1A]/60 truncate">{row.emirate || row.country || row.office_location || "UAE brokerage"}</p><div className="mt-2 flex flex-wrap gap-1.5"><Badge style={{ backgroundColor: color.cssBg, color: color.cssFg }} className="border border-[#B89555]/30">{color.label}</Badge><Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">{group.replace(/_/g, " ")}</Badge>{row.attended_briefing && <Badge className="bg-[#064E3B] text-white border-0">Briefed</Badge>}</div></div></div>
    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#1A1A1A]"><div className="rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] p-2"><p className="font-black uppercase text-[10px] text-[#1A1A1A]/55">Email</p><Input value={row.email || ""} onChange={(e) => onPatch({ email: e.target.value })} className="mt-1 h-8 bg-white border-[#B89555]/25" placeholder="agency@email.com" /></div><div className="rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] p-2"><p className="font-black uppercase text-[10px] text-[#1A1A1A]/55">Phone</p><Input value={row.phone || ""} onChange={(e) => onPatch({ phone: e.target.value })} className="mt-1 h-8 bg-white border-[#B89555]/25" placeholder="+971 …" /></div></div>
    <div className="mt-3 rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] p-3 space-y-2">
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
    <div className="mt-3 grid gap-2"><Select value={reg} onValueChange={(v) => onPatch({ registration_status: v })}><SelectTrigger className="h-9 bg-[#FDFBF7] text-[#1A1A1A]"><SelectValue /></SelectTrigger><SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">{BROKERAGE_REGISTRATION_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><Select value={group} onValueChange={(v) => onPatch({ group_status: v })}><SelectTrigger className="h-9 bg-[#FDFBF7] text-[#1A1A1A]"><SelectValue /></SelectTrigger><SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">{GROUP_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><Button variant={row.attended_briefing ? "gold" : "outline"} size="sm" onClick={() => onPatch({ attended_briefing: !row.attended_briefing, briefing_count: row.attended_briefing ? row.briefing_count : Number(row.briefing_count ?? 0) + 1 })}>{row.attended_briefing ? "Briefing done" : "Mark briefing done"}</Button></div>
  </Card>;
}