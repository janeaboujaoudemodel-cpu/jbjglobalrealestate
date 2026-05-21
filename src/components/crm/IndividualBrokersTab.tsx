/**
 * IndividualBrokersTab — flat directory of every broker (person) in the
 * canonical `crm_brokers` table (≈32k rows). Renders rich card + Excel grid
 * with every column the database has. Server-side search, paginated load.
 */
import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ExcelGridView } from "@/components/crm/ExcelGridView";
import BrokerBulkUploadDialog from "@/components/crm/BrokerBulkUploadDialog";
import BrokerLifecycleActionCenter from "@/components/crm/BrokerLifecycleActionCenter";
import { exportRowsToXlsx } from "@/utils/exportXlsx";
import { UnifiedCRMExportModal } from "@/components/crm/UnifiedCRMExportModal";
import { Link } from "react-router-dom";
import {
  Plus, Search, User, Phone, Mail, MessageCircle, Trash2,
  UploadCloud, FileDown, Linkedin, Globe, ChevronLeft, ChevronRight, Download,
  AlertTriangle,
} from "lucide-react";
import NationalityPicker from "@/components/crm/pickers/NationalityPicker";
import LanguageMultiPicker from "@/components/crm/pickers/LanguageMultiPicker";
import PhoneInputWithCountry from "@/components/crm/pickers/PhoneInputWithCountry";

type Row = {
  id: string;
  created_at: string;
  updated_at?: string | null;
  full_name: string | null;
  email_lower: string | null;
  personal_email: string | null;
  company_email: string | null;
  phone_e164: string | null;
  personal_phone: string | null;
  company_phone: string | null;
  whatsapp: string | null;
  current_company: string | null;
  current_brokerage_id: string | null;
  rera_license: string | null;
  position_title: string | null;
  role_title: string | null;
  department: string | null;
  seniority: string | null;
  position_type: string | null;
  broker_type: string | null;
  experience_years: number | null;
  specialty: string[] | null;
  languages: string[] | null;
  labels: string[] | null;
  nationality: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  birthday: string | null;
  date_of_birth: string | null;
  joined_at: string | null;
  is_global_broker: boolean | null;
  linkedin_url: string | null;
  bayut_url: string | null;
  pf_url: string | null;
  instagram_url: string | null;
  database_source: string | null;
  event_source: string | null;
  upload_source: string | null;
  original_filename: string | null;
  notes: string | null;
  source_history?: any[];
  brokerage?: { company_name: string | null } | null;
};

const PAGE_SIZE = 50;

export default function IndividualBrokersTab() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [actionCenterOpen, setActionCenterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Row> | null>(null);

  // Debounce search → only fire query after user pauses typing
  useEffect(() => {
    const t = setTimeout(() => { setSearchTerm(q.trim()); setPage(0); }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data: totalCount = 0 } = useQuery<number>({
    queryKey: ["crm-brokers-count", searchTerm, agencyFilter, countryFilter],
    queryFn: async () => {
      let qb = (supabase as any).from("crm_brokers").select("id", { count: "exact", head: true });
      if (searchTerm) {
        const like = `%${searchTerm}%`;
        qb = qb.or(
          [
            `full_name.ilike.${like}`,
            `email_lower.ilike.${like}`,
            `personal_email.ilike.${like}`,
            `company_email.ilike.${like}`,
            `phone_e164.ilike.${like}`,
            `whatsapp.ilike.${like}`,
            `current_company.ilike.${like}`,
            `rera_license.ilike.${like}`,
          ].join(","),
        );
      }
      if (agencyFilter === "__none__") qb = qb.is("current_brokerage_id", null);
      else if (agencyFilter !== "all") qb = qb.eq("current_brokerage_id", agencyFilter);
      if (countryFilter !== "all") qb = qb.eq("country", countryFilter);
      const { count, error } = await qb;
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: rows = [], isLoading } = useQuery<Row[]>({
    queryKey: ["crm-brokers", searchTerm, agencyFilter, countryFilter, page],
    queryFn: async () => {
      let qb = (supabase as any)
        .from("crm_brokers")
        .select(
          "id, created_at, updated_at, full_name, email_lower, personal_email, company_email, phone_e164, personal_phone, company_phone, whatsapp, current_company, current_brokerage_id, rera_license, position_title, role_title, department, seniority, position_type, broker_type, experience_years, specialty, languages, labels, nationality, country, city, region, birthday, date_of_birth, joined_at, is_global_broker, linkedin_url, bayut_url, pf_url, instagram_url, database_source, event_source, upload_source, original_filename, notes, source_history, brokerage:crm_brokerages!current_brokerage_id(company_name)",
        )
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (searchTerm) {
        const like = `%${searchTerm}%`;
        qb = qb.or(
          [
            `full_name.ilike.${like}`,
            `email_lower.ilike.${like}`,
            `personal_email.ilike.${like}`,
            `company_email.ilike.${like}`,
            `phone_e164.ilike.${like}`,
            `whatsapp.ilike.${like}`,
            `current_company.ilike.${like}`,
            `rera_license.ilike.${like}`,
          ].join(","),
        );
      }
      if (agencyFilter === "__none__") qb = qb.is("current_brokerage_id", null);
      else if (agencyFilter !== "all") qb = qb.eq("current_brokerage_id", agencyFilter);
      if (countryFilter !== "all") qb = qb.eq("country", countryFilter);
      const { data, error } = await qb;
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const { data: brokerages = [] } = useQuery<{ id: string; company_name: string }[]>({
    queryKey: ["crm-brokerages-min"],
    queryFn: async () => {
      // Cap brokerage dropdown source list to 2 000 rows — used for a combobox,
      // not an export. Avoids the previous 50 000-row sweep on every render.
      const all: any[] = [];
      for (let from = 0; from < 2000; from += 1000) {
        const { data, error } = await (supabase as any)
          .from("crm_brokerages")
          .select("id, company_name")
          .order("company_name")
          .range(from, from + 999);
        if (error) throw error;
        const batch = data ?? [];
        all.push(...batch);
        if (batch.length < 1000) break;
      }
      return all;
    },
    staleTime: 5 * 60_000,
  });

  const { data: countries = [] } = useQuery<string[]>({
    queryKey: ["crm-brokers-countries"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("crm_brokers").select("country").not("country", "is", null).limit(5000);
      const set = new Set<string>();
      (data ?? []).forEach((r: any) => { if (r.country) set.add(r.country); });
      return Array.from(set).sort();
    },
  });

  const upsert = useMutation({
    mutationFn: async (patch: Partial<Row> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const payload: any = { owner_id: user.id, ...patch };
      delete payload.brokerage;
      if (patch.id) {
        const { error } = await (supabase as any).from("crm_brokers").update(payload).eq("id", patch.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("crm_brokers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-brokers"] });
      qc.invalidateQueries({ queryKey: ["crm-brokers-count"] });
      toast.success("Broker saved");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.message || "Could not save"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("crm_brokers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-brokers"] });
      qc.invalidateQueries({ queryKey: ["crm-brokers-count"] });
      toast.success("Broker removed");
    },
  });

  const openNew = () => { setEditing({}); setOpen(true); };

  const exportExcel = () => {
    if (rows.length === 0) { toast.error("Nothing to export on this page"); return; }
    const out = rows.map(r => ({
      "Full name": r.full_name,
      "Agency": r.brokerage?.company_name || r.current_company || "Standalone",
      "Role / Title": r.role_title || r.position_title || "",
      "Department": r.department || "",
      "Seniority": r.seniority || "",
      "Broker type": r.broker_type || "",
      "Specialty": (r.specialty || []).join(", "),
      "Languages": (r.languages || []).join(", "),
      "Years exp.": r.experience_years ?? "",
      "Personal phone": r.personal_phone || r.phone_e164 || "",
      "Company phone": r.company_phone || "",
      "WhatsApp": r.whatsapp || "",
      "Personal email": r.personal_email || r.email_lower || "",
      "Company email": r.company_email || "",
      "RERA": r.rera_license || "",
      "Nationality": r.nationality || "",
      "Country": r.country || "",
      "City": r.city || "",
      "Region": r.region || "",
      "Birthday": r.birthday || r.date_of_birth || "",
      "Joined": r.joined_at || "",
      "Global": r.is_global_broker ? "Yes" : "",
      "LinkedIn": r.linkedin_url || "",
      "Bayut": r.bayut_url || "",
      "PropertyFinder": r.pf_url || "",
      "Instagram": r.instagram_url || "",
      "Database": r.database_source || "",
      "Event": r.event_source || "",
      "Upload": r.upload_source || "",
      "Source file": r.original_filename || "",
      "Notes": r.notes || "",
      "Added": new Date(r.created_at).toLocaleDateString(),
    }));
    exportRowsToXlsx(out, "crm-brokers-page");
    toast.success(`Exported ${out.length} brokers`);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/70" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone, company, RERA…"
            className="pl-10"
          />
        </div>
        <Select value={agencyFilter} onValueChange={(v) => { setAgencyFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[240px]"><SelectValue placeholder="Agency" /></SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">All agencies</SelectItem>
            <SelectItem value="__none__">Standalone (no agency)</SelectItem>
            {brokerages.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">All countries</SelectItem>
            {countries.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportExcel}><FileDown className="w-4 h-4 mr-2" /> Export page</Button>
        <Button variant="outline" onClick={() => setExportOpen(true)}><Download className="w-4 h-4 mr-2" /> Unified export</Button>
        <Button variant="outline" onClick={() => setBulkOpen(true)}><UploadCloud className="w-4 h-4 mr-2" /> Upload database</Button>
        <Button variant="outline" onClick={() => setActionCenterOpen(true)}><AlertTriangle className="w-4 h-4 mr-2" /> Action Centre</Button>
        <Button variant="gold" onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add broker</Button>
      </div>

      <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-3 text-xs text-[#1A1A1A]/80 flex items-center justify-between flex-wrap gap-2">
        <div>
          Showing <b className="text-[#1A1A1A]">{rows.length}</b> of{" "}
          <b className="text-[#1A1A1A]">{totalCount.toLocaleString()}</b> broker{totalCount === 1 ? "" : "s"} matching filters.
          Page <b>{page + 1}</b> / <b>{totalPages}</b>.
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            <ChevronLeft className="w-4 h-4" /> Prev
          </Button>
          <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[#1A1A1A]/70">
          No brokers match these filters.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <Card key={r.id} className="bg-[#FDFBF7] border-[#B89555]/30 hover:shadow-md hover:border-[#B89555]/50 transition rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#1A1A1A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => { setEditing(r); setOpen(true); }}
                      className="font-bold text-[#1A1A1A] hover:underline decoration-[#B89555] underline-offset-4 truncate text-left block w-full"
                    >
                      {r.full_name || "Unknown"}
                    </button>
                    <div className="text-[11px] text-[#1A1A1A]/70 truncate">
                      {r.role_title || r.position_title}
                      {(r.role_title || r.position_title) && (r.brokerage?.company_name || r.current_company) ? " · " : ""}
                      {r.current_brokerage_id && r.brokerage?.company_name ? (
                        <Link
                          to={`/owner/crm/relationship-hub?tab=brokerages&agency=${r.current_brokerage_id}`}
                          className="text-[#1A1A1A] hover:underline decoration-[#B89555] underline-offset-2"
                          title="Open agency in Relationships Hub"
                        >
                          {r.brokerage.company_name}
                        </Link>
                      ) : (
                        <span>{r.current_company || "Standalone"}</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                      {(r.specialty || []).slice(0, 4).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-full border border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] capitalize">{s.replace(/_/g, " ")}</span>
                      ))}
                      {r.broker_type && (
                        <span className="px-2 py-0.5 rounded-full border border-[#B89555]/40 bg-[#EFE6D6] text-[#1A1A1A] capitalize">{r.broker_type}</span>
                      )}
                      {r.is_global_broker && (
                        <span className="px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 inline-flex items-center gap-1"><Globe className="w-3 h-3" />Global</span>
                      )}
                    </div>
                    <div className="mt-1.5 text-[11px] text-[#1A1A1A]/70 truncate">
                      {[r.nationality, r.city, r.country].filter(Boolean).join(" · ")}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                      {(r.personal_phone || r.phone_e164) && <a href={`tel:${r.personal_phone || r.phone_e164}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]"><Phone className="w-3 h-3" />{r.personal_phone || r.phone_e164}</a>}
                      {r.whatsapp && <a href={`https://wa.me/${r.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]"><MessageCircle className="w-3 h-3" />WhatsApp</a>}
                      {(r.personal_email || r.email_lower) && <a href={`mailto:${r.personal_email || r.email_lower}`} title={r.personal_email || r.email_lower || ""} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6] max-w-[220px]"><Mail className="w-3 h-3 flex-shrink-0" /><span className="truncate">{r.personal_email || r.email_lower}</span></a>}
                      {r.linkedin_url && <a href={r.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]"><Linkedin className="w-3 h-3" />LinkedIn</a>}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Remove ${r.full_name || "this broker"}?`)) remove.mutate(r.id); }} aria-label="Remove broker">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Excel grid — every column the database has */}
      <ExcelGridView
        rows={rows as any[]}
        columns={[
          { key: "full_name", label: "Full name", width: 200, editable: true },
          { key: "agency", label: "Agency", width: 220, render: (r: any) => r.brokerage?.company_name || r.current_company || "—" },
          { key: "role_title", label: "Role / Title", width: 180, editable: true },
          { key: "department", label: "Department", width: 140, editable: true },
          { key: "seniority", label: "Seniority", width: 120, editable: true },
          { key: "broker_type", label: "Broker type", width: 140, editable: true },
          { key: "specialty", label: "Specialty", width: 200, render: (r: any) => (r.specialty || []).join(", ") || "—" },
          { key: "languages", label: "Languages", width: 180, render: (r: any) => (r.languages || []).join(", ") || "—" },
          { key: "experience_years", label: "Years", width: 80, editable: true },
          { key: "personal_phone", label: "Personal phone", width: 150, editable: true },
          { key: "company_phone", label: "Company phone", width: 150, editable: true },
          { key: "whatsapp", label: "WhatsApp", width: 150, editable: true },
          { key: "personal_email", label: "Personal email", width: 220, editable: true },
          { key: "company_email", label: "Company email", width: 220, editable: true },
          { key: "rera_license", label: "RERA", width: 130, editable: true },
          { key: "nationality", label: "Nationality", width: 140, editable: true },
          { key: "country", label: "Country", width: 130, editable: true },
          { key: "city", label: "City", width: 130, editable: true },
          { key: "region", label: "Region", width: 130, editable: true },
          { key: "birthday", label: "Birthday", width: 120, render: (r: any) => r.birthday || r.date_of_birth || "—" },
          { key: "joined_at", label: "Joined", width: 120, render: (r: any) => r.joined_at || "—" },
          { key: "linkedin_url", label: "LinkedIn", width: 180, editable: true },
          { key: "bayut_url", label: "Bayut", width: 160, editable: true },
          { key: "pf_url", label: "PropertyFinder", width: 160, editable: true },
          { key: "instagram_url", label: "Instagram", width: 160, editable: true },
          { key: "database_source", label: "Database", width: 160, render: (r: any) => r.database_source || "—" },
          { key: "upload_source", label: "Upload", width: 140, render: (r: any) => r.upload_source || "—" },
          { key: "original_filename", label: "Source file", width: 180, render: (r: any) => r.original_filename || "—" },
          { key: "created_at", label: "Added", width: 130, render: (r: any) => new Date(r.created_at).toLocaleDateString() },
        ]}
        onCellEdit={(r: any, key, value) => upsert.mutate({ id: r.id, [key]: value } as any)}
        emptyLabel="No brokers match these filters."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit broker" : "Add individual broker"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Full name *</Label><Input value={editing?.full_name || ""} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></div>
              <div><Label>Agency</Label>
                <Select value={editing?.current_brokerage_id || "__none__"} onValueChange={(v) => setEditing({ ...editing, current_brokerage_id: v === "__none__" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="__none__">Standalone</SelectItem>
                    {brokerages.map((b) => (<SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Role / Title</Label><Input value={editing?.role_title || ""} onChange={(e) => setEditing({ ...editing, role_title: e.target.value })} /></div>
              <div><Label>Department</Label><Input value={editing?.department || ""} onChange={(e) => setEditing({ ...editing, department: e.target.value })} /></div>
              <div><Label>Seniority</Label><Input value={editing?.seniority || ""} onChange={(e) => setEditing({ ...editing, seniority: e.target.value })} /></div>
              <div><Label>Broker type</Label><Input value={editing?.broker_type || ""} onChange={(e) => setEditing({ ...editing, broker_type: e.target.value })} /></div>
              <div><Label>Personal phone</Label><PhoneInputWithCountry value={editing?.personal_phone || ""} onChange={(v) => setEditing({ ...editing, personal_phone: v })} /></div>
              <div><Label>Company phone</Label><PhoneInputWithCountry value={editing?.company_phone || ""} onChange={(v) => setEditing({ ...editing, company_phone: v })} /></div>
              <div><Label>WhatsApp</Label><PhoneInputWithCountry value={editing?.whatsapp || ""} onChange={(v) => setEditing({ ...editing, whatsapp: v })} /></div>
              <div><Label>Personal email</Label><Input value={editing?.personal_email || ""} onChange={(e) => setEditing({ ...editing, personal_email: e.target.value })} /></div>
              <div><Label>Company email</Label><Input value={editing?.company_email || ""} onChange={(e) => setEditing({ ...editing, company_email: e.target.value })} /></div>
              <div><Label>RERA</Label><Input value={editing?.rera_license || ""} onChange={(e) => setEditing({ ...editing, rera_license: e.target.value })} /></div>
              <div><Label>Nationality</Label><NationalityPicker value={editing?.nationality || ""} onChange={(v) => setEditing({ ...editing, nationality: v })} /></div>
              <div><Label>Country</Label><Input value={editing?.country || ""} onChange={(e) => setEditing({ ...editing, country: e.target.value })} /></div>
              <div><Label>City</Label><Input value={editing?.city || ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></div>
              <div><Label>Birthday</Label><Input type="date" value={editing?.birthday || editing?.date_of_birth || ""} onChange={(e) => setEditing({ ...editing, birthday: e.target.value, date_of_birth: e.target.value })} /></div>
              <div><Label>Joined</Label><Input type="date" value={editing?.joined_at || ""} onChange={(e) => setEditing({ ...editing, joined_at: e.target.value })} /></div>
              <div><Label>LinkedIn</Label><Input value={editing?.linkedin_url || ""} onChange={(e) => setEditing({ ...editing, linkedin_url: e.target.value })} /></div>
              <div><Label>Bayut</Label><Input value={editing?.bayut_url || ""} onChange={(e) => setEditing({ ...editing, bayut_url: e.target.value })} /></div>
              <div><Label>PropertyFinder</Label><Input value={editing?.pf_url || ""} onChange={(e) => setEditing({ ...editing, pf_url: e.target.value })} /></div>
              <div><Label>Instagram</Label><Input value={editing?.instagram_url || ""} onChange={(e) => setEditing({ ...editing, instagram_url: e.target.value })} /></div>
            </div>
            <div><Label>Specialty (comma-separated)</Label>
              <Input value={(editing?.specialty || []).join(", ")} onChange={(e) => setEditing({ ...editing, specialty: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="off-plan, secondary, leasing, sales" />
            </div>
            <div><Label>Languages</Label>
              <LanguageMultiPicker value={editing?.languages || []} onChange={(v) => setEditing({ ...editing, languages: v })} />
            </div>
            <div><Label>Notes</Label>
              <Input value={editing?.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="gold" onClick={() => editing && upsert.mutate(editing)}>{editing?.id ? "Save changes" : "Add broker"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BrokerBulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        brokerages={brokerages}
        onDone={() => {
          qc.invalidateQueries({ queryKey: ["crm-brokers"] });
          qc.invalidateQueries({ queryKey: ["crm-brokers-count"] });
        }}
      />

      <UnifiedCRMExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        kind="brokers"
        rows={rows as any[]}
        filenameStem="crm-brokers-filtered"
      />
    </div>
  );
}
