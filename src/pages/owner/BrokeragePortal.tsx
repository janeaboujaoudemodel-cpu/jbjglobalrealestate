import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BrokerageExcelImportDialog from "@/components/owner/BrokerageExcelImportDialog";
import { Building2, Download, FileSpreadsheet, Upload, Users } from "lucide-react";
import { toast } from "sonner";
import { statusColor, BROKERAGE_REGISTRATION_STATUS_OPTIONS } from "@/utils/crmStatusPalette";

const GROUP_OPTIONS = [
  { value: "pending_group_status", label: "Pending group status" },
  { value: "has_group", label: "Has group" },
  { value: "no_group", label: "No group" },
  { value: "group_not_required", label: "Group not required" },
];

export default function BrokeragePortal() {
  const qc = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"all" | "jbj" | "list">("all");
  const [listId, setListId] = useState<string>("all");

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
    const { data, error } = await supabase.from("broker_profiles" as any).select("id,display_name,email,phone,title,is_active,verification_status,current_tier,created_at").order("display_name").limit(1000);
    if (error) throw error; return (data ?? []) as any[];
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

  const visibleJbj = useMemo(() => (jbjQ.data ?? []).filter((b) => !search || [b.display_name, b.email, b.phone, b.title].some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase()))), [jbjQ.data, search]);

  const updateBrokerage = useMutation({ mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
    const { error } = await supabase.from("crm_brokerages" as any).update(patch as any).eq("id", id); if (error) throw error;
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ["brokerage-portal-brokerages"] }), onError: (e: any) => toast.error(e.message || "Could not update brokerage") });

  const exportRows = () => {
    const rows = view === "jbj" ? visibleJbj.map((b) => ({ Name: b.display_name, Email: b.email, Phone: b.phone, Title: b.title, Status: b.verification_status, Tier: b.current_tier })) : visibleBrokerages.map((b) => ({ Brokerage: b.company_name, Email: b.email, Phone: b.phone, Emirate: b.emirate, Registration: b.registration_status ?? "not_registered", Group: b.group_status ?? "pending_group_status", Briefing: b.attended_briefing ? "Yes" : "No", Database: b.database_source ?? b.original_filename ?? "" }));
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" })); a.download = `JBJ-brokerage-portal-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  return <div className="space-y-5 max-w-full overflow-hidden">
    <div className="rounded-[28px] border border-[#B89555]/35 bg-[linear-gradient(135deg,#FDFBF7_0%,#F7F2EA_55%,#EFE6D6_100%)] p-5 md:p-6 shadow-[0_24px_60px_-42px_rgba(26,26,26,0.45)]">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0"><span data-surface="emerald" className="allow-white shrink-0 size-12 rounded-2xl jj-emerald-metallic flex items-center justify-center"><Building2 className="size-5 text-white" /></span><div><p className="text-[11px] uppercase tracking-[0.24em] font-black text-[#B89555]">Owner Backend · Brokers</p><h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">Broker Portal</h1><p className="text-sm text-[#1A1A1A]/70 mt-1 max-w-3xl">Owner-only command center for JBJ brokers, external brokerage agencies, uploaded management databases, registration status, group status, briefings and exports.</p></div></div>
        <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload className="size-4 mr-1" /> Import Brokerage</Button><Button size="sm" variant="gold" onClick={exportRows}><Download className="size-4 mr-1" /> Download</Button></div>
      </div>
    </div>
    <BrokerageExcelImportDialog open={importOpen} onOpenChange={setImportOpen} onDone={() => { qc.invalidateQueries({ queryKey: ["brokerage-portal-brokerages"] }); qc.invalidateQueries({ queryKey: ["brokerage-portal-lists"] }); qc.invalidateQueries({ queryKey: ["brokerage-portal-members"] }); }} />
    <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30 flex items-center gap-3 flex-wrap shadow-[0_18px_45px_-34px_rgba(26,26,26,0.35)]">
      <Input placeholder="Search brokerage, broker, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-80 bg-[#FDFBF7] text-[#1A1A1A]" />
      <Button size="sm" variant={view === "all" ? "gold" : "outline"} onClick={() => setView("all")}><Building2 className="size-4 mr-1" /> All brokerages</Button>
      <Button size="sm" variant={view === "jbj" ? "gold" : "outline"} onClick={() => setView("jbj")}><Users className="size-4 mr-1" /> JBJ brokers</Button>
      <Button size="sm" variant={view === "list" ? "gold" : "outline"} onClick={() => setView("list")}><FileSpreadsheet className="size-4 mr-1" /> Uploaded database</Button>
      {view === "list" && <Select value={listId} onValueChange={setListId}><SelectTrigger className="w-72 h-9 bg-[#FDFBF7] text-[#1A1A1A]"><SelectValue placeholder="Select database" /></SelectTrigger><SelectContent className="bg-[#FDFBF7] border-[#B89555]/40"><SelectItem value="all">All uploaded databases</SelectItem>{(listsQ.data ?? []).map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>}
      <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] ml-auto">{view === "jbj" ? visibleJbj.length : visibleBrokerages.length} shown</Badge>
    </Card>
    {view === "jbj" ? <Card className="bg-[#FDFBF7] border border-[#B89555]/30 overflow-hidden"><table className="w-full min-w-[900px] text-sm"><thead className="bg-[#EFE6D6]"><tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#1A1A1A]/70"><th className="px-4 py-3">JBJ Broker</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{visibleJbj.map((b) => <tr key={b.id} className="border-t border-[#B89555]/15"><td className="px-4 py-3 font-black text-[#1A1A1A]">{b.display_name || "Unnamed broker"}</td><td className="px-4 py-3 text-[#1A1A1A]">{b.email || b.phone || "—"}</td><td className="px-4 py-3 text-[#1A1A1A]">{b.title || "—"}</td><td className="px-4 py-3"><Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">{b.verification_status || (b.is_active ? "active" : "inactive")}</Badge></td></tr>)}</tbody></table></Card> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{visibleBrokerages.map((b) => <BrokerageCard key={b.id} row={b} onPatch={(patch) => updateBrokerage.mutate({ id: b.id, patch })} />)}</div>}
  </div>;
}

function BrokerageCard({ row, onPatch }: { row: any; onPatch: (patch: Record<string, unknown>) => void }) {
  const reg = row.registration_status || "not_registered";
  const group = row.group_status || "pending_group_status";
  const color = statusColor(reg);
  return <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl shadow-[0_18px_42px_-34px_rgba(26,26,26,0.42)]">
    <div className="flex items-start gap-3"><div className="size-12 rounded-xl jj-emerald-metallic flex items-center justify-center text-white font-black">{String(row.company_name || "B").slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="font-black text-[#1A1A1A] text-[16px] leading-tight truncate">{row.company_name || "Unnamed brokerage"}</p><p className="text-xs text-[#1A1A1A]/60 truncate">{row.emirate || row.country || row.office_location || "UAE brokerage"}</p><div className="mt-2 flex flex-wrap gap-1.5"><Badge style={{ backgroundColor: color.cssBg, color: color.cssFg }} className="border border-[#B89555]/30">{color.label}</Badge><Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">{group.replace(/_/g, " ")}</Badge>{row.attended_briefing && <Badge className="bg-[#064E3B] text-white border-0">Briefed</Badge>}</div></div></div>
    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#1A1A1A]"><div className="rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] p-2"><p className="font-black uppercase text-[10px] text-[#1A1A1A]/55">Email</p><p className="truncate">{row.email || "—"}</p></div><div className="rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] p-2"><p className="font-black uppercase text-[10px] text-[#1A1A1A]/55">Phone</p><p className="truncate">{row.phone || "—"}</p></div></div>
    <div className="mt-3 grid gap-2"><Select value={reg} onValueChange={(v) => onPatch({ registration_status: v })}><SelectTrigger className="h-9 bg-[#FDFBF7] text-[#1A1A1A]"><SelectValue /></SelectTrigger><SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">{BROKERAGE_REGISTRATION_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><Select value={group} onValueChange={(v) => onPatch({ group_status: v })}><SelectTrigger className="h-9 bg-[#FDFBF7] text-[#1A1A1A]"><SelectValue /></SelectTrigger><SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">{GROUP_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select><Button variant={row.attended_briefing ? "gold" : "outline"} size="sm" onClick={() => onPatch({ attended_briefing: !row.attended_briefing, briefing_count: row.attended_briefing ? row.briefing_count : Number(row.briefing_count ?? 0) + 1 })}>{row.attended_briefing ? "Briefing done" : "Mark briefing done"}</Button></div>
  </Card>;
}