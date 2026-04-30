import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import OwnerGuard from "@/components/OwnerGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ExternalLink, Send } from "lucide-react";
import {
  EMIRATES, OUTREACH_STATUSES, useRegistryList, useCreateRecord, useAddSource, sendRegistrationEmail, type RegistryRecordType,
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

export default function UAERegistryListPage({ type }: { type: RegistryRecordType }) {
  const [params] = useSearchParams();
  const initEmirate = params.get("emirate") as any;
  const [emirate, setEmirate] = useState<string>(initEmirate ?? "all");
  const [search, setSearch] = useState("");
  const list = useRegistryList(type, emirate === "all" ? undefined : (emirate as any));
  const create = useCreateRecord(type);
  const addSource = useAddSource(type);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    legal_company_name: "", brand_name: "", emirate_section: "Dubai",
    website: "", registration_email: "",
    source_name: "", source_url: "",
  });

  const filtered = (list.data ?? []).filter((r: any) =>
    !search || r.legal_company_name.toLowerCase().includes(search.toLowerCase()) || r.brand_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.legal_company_name || !form.brand_name) { toast.error("Legal name and brand are required"); return; }
    if (!form.source_url || !form.source_name) { toast.error("At least one source is required"); return; }
    const created = await create.mutateAsync({
      legal_company_name: form.legal_company_name,
      brand_name: form.brand_name,
      emirate_section: form.emirate_section,
      website: form.website || null,
      registration_email: type === "developer" ? form.registration_email || null : undefined,
      outreach_email: type === "brokerage" ? form.registration_email || null : undefined,
      verification_status: "Partially Verified",
      last_verified_date: new Date().toISOString().slice(0, 10),
    });
    await addSource.mutateAsync({
      recordId: created.id,
      source_name: form.source_name,
      source_url: form.source_url,
      fields_verified: ["legal_company_name", "website"],
      priority_tier: 1,
    });
    setOpen(false);
    setForm({ legal_company_name: "", brand_name: "", emirate_section: "Dubai", website: "", registration_email: "", source_name: "", source_url: "" });
  };

  const handleTestSend = async (r: any) => {
    const recipient = type === "developer" ? r.registration_email : r.outreach_email;
    if (!recipient) { toast.error("No recipient email on record"); return; }
    try {
      await sendRegistrationEmail({
        recordType: type, recordId: r.id, language: "en",
        contactPersonName: "Team", recipientEmail: recipient, isTestSend: true,
      });
      toast.success(`Test sent from CONTACT@JBJ.AE`);
    } catch (e: any) { toast.error(e.message ?? "Send failed"); }
  };

  const title = type === "developer" ? "UAE Developers" : "UAE Brokerages";
  const detailBase = type === "developer" ? "/owner/uae-registry/developers" : "/owner/uae-registry/brokerages";

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-[#FDFBF7] px-6 py-8 max-w-7xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#000" }}>{title}</h1>
            <p className="text-sm" style={{ color: "#374151" }}>Sender locked: CONTACT@JBJ.AE</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]"><Plus className="h-4 w-4 mr-1" />Add</Button>
            </DialogTrigger>
            <DialogContent className="bg-[#FDFBF7]">
              <DialogHeader><DialogTitle style={{ color: "#000" }}>New {type}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Legal company name *" value={form.legal_company_name} onChange={(e) => setForm({ ...form, legal_company_name: e.target.value })} />
                <Input placeholder="Brand name *" value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} />
                <Select value={form.emirate_section} onValueChange={(v) => setForm({ ...form, emirate_section: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                <Input placeholder="Registration / outreach email" value={form.registration_email} onChange={(e) => setForm({ ...form, registration_email: e.target.value })} />
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold mb-2" style={{ color: "#000" }}>Required: at least one verified source</p>
                  <Input placeholder="Source name (e.g. Official website)" value={form.source_name} onChange={(e) => setForm({ ...form, source_name: e.target.value })} className="mb-2" />
                  <Input placeholder="Source URL *" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} />
                </div>
                <Button onClick={handleCreate} disabled={create.isPending} className="w-full bg-[#1A1A1A] text-white">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="flex gap-2 mb-4">
          <Input placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={emirate} onValueChange={setEmirate}>
            <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All emirates</SelectItem>
              {EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-[#FDFBF7] border border-[#B89555]/30 overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_140px_140px_120px] gap-2 px-4 py-3 text-xs font-semibold border-b" style={{ color: "#374151" }}>
            <span>Company</span><span>Emirate</span><span>Status</span><span>Verification</span><span>Actions</span>
          </div>
          {list.isLoading && <div className="p-6 text-sm" style={{ color: "#374151" }}>Loading…</div>}
          {!list.isLoading && filtered.length === 0 && <div className="p-6 text-sm" style={{ color: "#374151" }}>No records yet.</div>}
          {filtered.map((r: any) => (
            <div key={r.id} className="grid grid-cols-[1fr_120px_140px_140px_120px] gap-2 px-4 py-3 border-b items-center text-sm hover:bg-[#F7F2EA]">
              <Link to={`${detailBase}/${r.id}`} className="font-medium hover:underline" style={{ color: "#000" }}>
                {r.brand_name} <span className="text-xs" style={{ color: "#6b7280" }}>· {r.legal_company_name}</span>
              </Link>
              <span style={{ color: "#374151" }}>{r.emirate_section}</span>
              <span><Badge className={STATUS_COLOR[r.outreach_status] ?? "bg-[#F7F2EA] text-[#1A1A1A]"}>{r.outreach_status}</Badge></span>
              <span style={{ color: "#374151" }}>{r.verification_status}</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => handleTestSend(r)} title="Test send"><Send className="h-3 w-3" /></Button>
                {r.website && <a href={r.website} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><ExternalLink className="h-3 w-3" /></Button></a>}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </OwnerGuard>
  );
}
