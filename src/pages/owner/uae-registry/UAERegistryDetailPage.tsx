import { useParams, Link } from "react-router-dom";
import OwnerGuard from "@/components/OwnerGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Send, ArrowLeft, Plus } from "lucide-react";
import {
  useRegistryRecord, useRegistrySources, useRegistryLog, useAddSource, useUpdateRecord,
  sendRegistrationEmail, OUTREACH_STATUSES, type RegistryRecordType,
} from "@/hooks/useUAERegistry";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function UAERegistryDetailPage({ type }: { type: RegistryRecordType }) {
  const { id } = useParams<{ id: string }>();
  const rec = useRegistryRecord(type, id);
  const sources = useRegistrySources(type, id);
  const log = useRegistryLog(type, id);
  const addSource = useAddSource(type);
  const update = useUpdateRecord(type);

  const [src, setSrc] = useState({ source_name: "", source_url: "", fields: "" });
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [contact, setContact] = useState("Team");
  const r = rec.data;

  if (rec.isLoading) return <div className="p-8 bg-[#FDFBF7] min-h-screen">Loading…</div>;
  if (!r) return <div className="p-8 bg-[#FDFBF7] min-h-screen">Not found</div>;

  const recipient = type === "developer" ? r.registration_email : r.outreach_email;
  const backTo = type === "developer" ? "/owner/uae-registry/developers" : "/owner/uae-registry/brokerages";

  const handleSend = async (isTest: boolean) => {
    if (!recipient) { toast.error("No recipient email"); return; }
    if (!sources.data?.length) { toast.error("Add at least one verified source first"); return; }
    if (r.verification_status === "Not Verified") { toast.error("Set verification to Partially Verified or Verified first"); return; }
    try {
      await sendRegistrationEmail({
        recordType: type, recordId: r.id, language: lang,
        contactPersonName: contact, recipientEmail: recipient, isTestSend: isTest,
      });
      toast.success(`${isTest ? "Test" : "Registration"} email sent from CONTACT@JBJ.AE`);
      rec.refetch(); log.refetch();
    } catch (e: any) { toast.error(e.message ?? "Send failed"); }
  };

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-[#FDFBF7] px-6 py-8 max-w-6xl mx-auto">
        <Link to={backTo} className="inline-flex items-center gap-1 text-sm mb-4" style={{ color: "#000" }}>
          <ArrowLeft className="h-4 w-4" />Back
        </Link>
        <header className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "#000" }}>{r.brand_name}</h1>
          <p className="text-sm" style={{ color: "#374151" }}>{r.legal_company_name} · {r.emirate_section}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="border-[#1A1A1A] text-[#1A1A1A]">{r.outreach_status}</Badge>
            <Badge variant="outline" className="border-[#1A1A1A] text-[#1A1A1A]">{r.verification_status}</Badge>
            <Badge variant="outline" className="border-[#1A1A1A] text-[#1A1A1A]">Priority: {type === "developer" ? r.developer_priority : r.brokerage_priority}</Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30">
            <h2 className="font-semibold mb-3" style={{ color: "#000" }}>Outreach</h2>
            <div className="space-y-3 text-sm">
              <div><span style={{ color: "#6b7280" }}>Recipient:</span> <strong style={{ color: "#000" }}>{recipient ?? "— add registration email —"}</strong></div>
              <div><span style={{ color: "#6b7280" }}>Sender (locked):</span> <strong style={{ color: "#000" }}>CONTACT@JBJ.AE</strong></div>
              <div className="flex gap-2">
                <Select value={lang} onValueChange={(v: any) => setLang(v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Contact person" value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSend(true)}>Test send</Button>
                <Button className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]" onClick={() => handleSend(false)} disabled={!r.test_email_completed}>
                  <Send className="h-4 w-4 mr-1" />Send registration
                </Button>
              </div>
              {!r.test_email_completed && <p className="text-xs" style={{ color: "#b45309" }}>Test send required before bulk send.</p>}
              <div>
                <span className="text-xs" style={{ color: "#6b7280" }}>Status:</span>
                <Select value={r.outreach_status} onValueChange={(v) => update.mutate({ id: r.id, patch: { outreach_status: v } })}>
                  <SelectTrigger className="w-full mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{OUTREACH_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30">
            <h2 className="font-semibold mb-3" style={{ color: "#000" }}>Sources ({sources.data?.length ?? 0})</h2>
            <div className="space-y-2 mb-3 max-h-48 overflow-auto">
              {sources.data?.map((s: any) => (
                <div key={s.id} className="text-xs p-2 bg-[#F7F2EA] rounded">
                  <div style={{ color: "#000" }} className="font-medium">{s.source_name}</div>
                  <a href={s.source_url} target="_blank" rel="noreferrer" className="underline" style={{ color: "#374151" }}>{s.source_url}</a>
                  <div style={{ color: "#6b7280" }}>Fields: {(s.fields_verified ?? []).join(", ") || "—"}</div>
                </div>
              ))}
              {(!sources.data || sources.data.length === 0) && <div className="text-xs" style={{ color: "#6b7280" }}>No sources yet.</div>}
            </div>
            <div className="space-y-2 border-t pt-3">
              <Input placeholder="Source name" value={src.source_name} onChange={(e) => setSrc({ ...src, source_name: e.target.value })} />
              <Input placeholder="Source URL" value={src.source_url} onChange={(e) => setSrc({ ...src, source_url: e.target.value })} />
              <Input placeholder="Fields verified (comma-separated)" value={src.fields} onChange={(e) => setSrc({ ...src, fields: e.target.value })} />
              <Button size="sm" variant="outline" onClick={async () => {
                if (!src.source_url || !src.source_name) { toast.error("Name + URL required"); return; }
                await addSource.mutateAsync({
                  recordId: r.id, source_name: src.source_name, source_url: src.source_url,
                  fields_verified: src.fields.split(",").map(x => x.trim()).filter(Boolean),
                });
                setSrc({ source_name: "", source_url: "", fields: "" });
              }}><Plus className="h-3 w-3 mr-1" />Add source</Button>
            </div>
          </Card>

          <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30 lg:col-span-2">
            <h2 className="font-semibold mb-3" style={{ color: "#000" }}>Communication history</h2>
            <div className="space-y-2 max-h-96 overflow-auto">
              {log.data?.map((l: any) => (
                <div key={l.id} className="p-3 bg-[#F7F2EA] rounded border border-[#B89555]/30">
                  <div className="flex justify-between text-xs" style={{ color: "#6b7280" }}>
                    <span>{l.channel} · {l.direction} · {l.language}</span>
                    <span>{new Date(l.occurred_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm mt-1" style={{ color: "#000" }}>{l.summary}</div>
                </div>
              ))}
              {(!log.data || log.data.length === 0) && <div className="text-xs" style={{ color: "#6b7280" }}>No activity yet.</div>}
            </div>
          </Card>
        </div>
      </div>
    </OwnerGuard>
  );
}
