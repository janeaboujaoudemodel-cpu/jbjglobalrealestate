import { useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import OwnerGuard from "@/components/OwnerGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ExternalLink, Send, Phone, Mail, MessageCircle, Upload, Instagram, Linkedin, MapPin } from "lucide-react";
import {
  EMIRATES, useRegistryList, useCreateRecord, useAddSource, sendRegistrationEmail,
  useImportRegistryCsv, type RegistryRecordType,
} from "@/hooks/useUAERegistry";
import { toast } from "sonner";

const STATUS_COLOR: Record<string, string> = {
  "Not Contacted": "bg-[#F7F2EA] text-[#1A1A1A]",
  "Test Sent": "bg-blue-100 text-blue-800",
  "Contacted": "bg-blue-100 text-blue-800",
  "Replied": "bg-emerald-100 text-emerald-800",
  "Follow-up Needed": "bg-amber-100 text-amber-800",
  "Documents Requested": "bg-amber-100 text-amber-800",
  "Documents Sent": "bg-blue-100 text-blue-800",
  "Registered": "bg-emerald-100 text-emerald-900",
  "Declined": "bg-red-100 text-red-800",
  "No Response": "bg-[#EFE6D6] text-[#1A1A1A]",
};

const PAGE_SIZE = 50;

function digitsOnly(s?: string | null): string { return (s ?? "").replace(/[^0-9]/g, ""); }
function firstString(arr: any): string | null {
  if (!arr) return null;
  if (Array.isArray(arr) && arr.length) return typeof arr[0] === "string" ? arr[0] : (arr[0]?.phone ?? arr[0]?.email ?? null);
  return null;
}

export default function UAERegistryListPage({ type }: { type: RegistryRecordType }) {
  const [params] = useSearchParams();
  const initEmirate = params.get("emirate") as any;
  const [emirate, setEmirate] = useState<string>(initEmirate ?? "all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const list = useRegistryList(type, emirate === "all" ? undefined : (emirate as any));
  const create = useCreateRecord(type);
  const addSource = useAddSource(type);
  const importCsv = useImportRegistryCsv(type);
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    legal_company_name: "", brand_name: "", emirate_section: "Dubai",
    website: "", registration_email: "", phone: "",
    source_name: "", source_url: "",
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = list.data ?? [];
    if (!q) return all;
    return all.filter((r: any) =>
      (r.legal_company_name ?? "").toLowerCase().includes(q) ||
      (r.brand_name ?? "").toLowerCase().includes(q) ||
      digitsOnly(firstString(r.main_phone_numbers)).includes(digitsOnly(q)) ||
      (firstString(r.main_email_addresses) ?? "").toLowerCase().includes(q)
    );
  }, [list.data, search]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const handleCreate = async () => {
    if (!form.legal_company_name || !form.brand_name) { toast.error("Legal name and brand are required"); return; }
    if (!form.source_url || !form.source_name) { toast.error("At least one source is required"); return; }
    const created = await create.mutateAsync({
      legal_company_name: form.legal_company_name,
      brand_name: form.brand_name,
      emirate_section: form.emirate_section,
      website: form.website || null,
      main_phone_numbers: form.phone ? [form.phone] : [],
      main_email_addresses: form.registration_email ? [form.registration_email] : [],
      registration_email: type === "developer" ? form.registration_email || null : undefined,
      outreach_email: type === "brokerage" ? form.registration_email || null : undefined,
      outreach_phone: type === "brokerage" ? form.phone || null : undefined,
      verification_status: "Partially Verified",
      last_verified_date: new Date().toISOString().slice(0, 10),
    });
    if (!(created as any).__merged) {
      await addSource.mutateAsync({
        recordId: created.id,
        source_name: form.source_name,
        source_url: form.source_url,
        fields_verified: ["legal_company_name", "website"],
        priority_tier: 1,
      });
    }
    setOpen(false);
    setForm({ legal_company_name: "", brand_name: "", emirate_section: "Dubai", website: "", registration_email: "", phone: "", source_name: "", source_url: "" });
  };

  const handleTestSend = async (r: any) => {
    const recipient = type === "developer" ? r.registration_email : r.outreach_email;
    if (!recipient) { toast.error("No recipient email on record"); return; }
    try {
      await sendRegistrationEmail({
        recordType: type, recordId: r.id, language: "en",
        contactPersonName: "Team", recipientEmail: recipient, isTestSend: true,
      });
      toast.success("Test sent");
    } catch (e: any) { toast.error(e.message ?? "Send failed"); }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await importCsv.mutateAsync(f);
    if (fileRef.current) fileRef.current.value = "";
  };

  const title = type === "developer" ? "UAE Developers" : "UAE Brokerages";
  const detailBase = type === "developer" ? "/owner/uae-registry/developers" : "/owner/uae-registry/brokerages";

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-[#FDFBF7] px-6 py-8 max-w-[1400px] mx-auto">
        <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>{title}</h1>
            <p className="text-sm" style={{ color: "#1A1A1A" }}>
              {type === "brokerage" ? "Brokerage outreach: jane@citideveloper.com" : "Developer registration: contact@jbj.ae"}
              {" · "}
              <span style={{ color: "#1A1A1A" }}>{filtered.length} records</span>
            </p>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleFile} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importCsv.isPending} className="border-[#B89555]/40 text-[#1A1A1A]">
              <Upload className="h-4 w-4 mr-1" /> {importCsv.isPending ? "Importing…" : "Import CSV"}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]"><Plus className="h-4 w-4 mr-1" />Add</Button>
              </DialogTrigger>
              <DialogContent className="bg-[#FDFBF7]">
                <DialogHeader><DialogTitle style={{ color: "#1A1A1A" }}>New {type}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Legal company name *" value={form.legal_company_name} onChange={(e) => setForm({ ...form, legal_company_name: e.target.value })} />
                  <Input placeholder="Brand name *" value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} />
                  <Select value={form.emirate_section} onValueChange={(v) => setForm({ ...form, emirate_section: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Website (https://…)" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                  <Input placeholder="Phone (+971…)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <Input placeholder="Email" value={form.registration_email} onChange={(e) => setForm({ ...form, registration_email: e.target.value })} />
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold mb-2" style={{ color: "#1A1A1A" }}>Required: at least one verified source</p>
                    <Input placeholder="Source name (e.g. Official website)" value={form.source_name} onChange={(e) => setForm({ ...form, source_name: e.target.value })} className="mb-2" />
                    <Input placeholder="Source URL *" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} />
                  </div>
                  <p className="text-xs" style={{ color: "#1A1A1A" }}>Duplicate-protected: same name, website domain or phone will merge into the existing record.</p>
                  <Button onClick={handleCreate} disabled={create.isPending} className="w-full bg-[#1A1A1A] text-white">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="flex gap-2 mb-4 flex-wrap">
          <Input placeholder="Search by name, phone, email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="max-w-xs" />
          <Select value={emirate} onValueChange={(v) => { setEmirate(v); setPage(0); }}>
            <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All emirates</SelectItem>
              {EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-[#FDFBF7] border border-[#B89555]/30 overflow-hidden">
          <div className="grid grid-cols-[1.4fr_110px_1fr_140px_120px_180px] gap-2 px-4 py-3 text-xs font-semibold border-b border-[#B89555]/20" style={{ color: "#1A1A1A" }}>
            <span>Company</span><span>Emirate</span><span>Contact</span><span>Status</span><span>Verification</span><span>Actions</span>
          </div>
          {list.isLoading && <div className="p-6 text-sm" style={{ color: "#1A1A1A" }}>Loading…</div>}
          {!list.isLoading && filtered.length === 0 && <div className="p-6 text-sm" style={{ color: "#1A1A1A" }}>No records yet.</div>}
          {paged.map((r: any) => {
            const phone = r.outreach_phone ?? firstString(r.main_phone_numbers);
            const email = r.outreach_email ?? r.registration_email ?? firstString(r.main_email_addresses);
            const phoneDigits = digitsOnly(phone);
            return (
              <div key={r.id} className="grid grid-cols-[1.4fr_110px_1fr_140px_120px_180px] gap-2 px-4 py-3 border-b border-[#B89555]/10 items-center text-sm hover:bg-[#F7F2EA]">
                <Link to={`${detailBase}/${r.id}`} className="font-medium hover:underline" style={{ color: "#1A1A1A" }}>
                  {r.brand_name} <span className="text-xs" style={{ color: "#1A1A1A", opacity: 0.7 }}>· {r.legal_company_name}</span>
                </Link>
                <span style={{ color: "#1A1A1A" }}>{r.emirate_section}</span>
                <div className="flex flex-col text-xs gap-0.5" style={{ color: "#1A1A1A" }}>
                  {phone && <a href={`tel:${phoneDigits}`} className="hover:underline">{phone}</a>}
                  {email && <a href={`mailto:${email}`} className="hover:underline truncate">{email}</a>}
                  {!phone && !email && <span style={{ opacity: 0.5 }}>—</span>}
                </div>
                <span><Badge className={STATUS_COLOR[r.outreach_status] ?? "bg-[#F7F2EA] text-[#1A1A1A]"}>{r.outreach_status}</Badge></span>
                <span style={{ color: "#1A1A1A" }}>{r.verification_status}</span>
                <div className="flex gap-1 flex-wrap">
                  {phoneDigits && <a href={`tel:${phoneDigits}`} title="Call"><Button size="sm" variant="outline" className="h-7 w-7 p-0"><Phone className="h-3 w-3" /></Button></a>}
                  {email && <a href={`mailto:${email}`} title="Email"><Button size="sm" variant="outline" className="h-7 w-7 p-0"><Mail className="h-3 w-3" /></Button></a>}
                  {phoneDigits && <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer" title="WhatsApp"><Button size="sm" variant="outline" className="h-7 w-7 p-0"><MessageCircle className="h-3 w-3" /></Button></a>}
                  {r.website && <a href={r.website} target="_blank" rel="noreferrer" title="Website"><Button size="sm" variant="outline" className="h-7 w-7 p-0"><ExternalLink className="h-3 w-3" /></Button></a>}
                  {r.instagram_url && <a href={r.instagram_url} target="_blank" rel="noreferrer" title="Instagram"><Button size="sm" variant="outline" className="h-7 w-7 p-0"><Instagram className="h-3 w-3" /></Button></a>}
                  {r.linkedin_url && <a href={r.linkedin_url} target="_blank" rel="noreferrer" title="LinkedIn"><Button size="sm" variant="outline" className="h-7 w-7 p-0"><Linkedin className="h-3 w-3" /></Button></a>}
                  {r.office_google_maps_url && <a href={r.office_google_maps_url} target="_blank" rel="noreferrer" title="Maps"><Button size="sm" variant="outline" className="h-7 w-7 p-0"><MapPin className="h-3 w-3" /></Button></a>}
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleTestSend(r)} title="Test send"><Send className="h-3 w-3" /></Button>
                </div>
              </div>
            );
          })}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 text-xs" style={{ color: "#1A1A1A" }}>
              <span>Page {page + 1} / {totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</Button>
                <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </OwnerGuard>
  );
}
