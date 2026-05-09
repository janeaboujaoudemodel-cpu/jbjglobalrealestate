import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import OwnerGuard from "@/components/OwnerGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, ArrowLeft, Plus, Trash2, Save, Upload, Download, Sparkles } from "lucide-react";
import {
  useRegistryRecord, useRegistrySources, useRegistryLog, useAddSource, useUpdateRecord,
  useRegistryAttachments, useUploadAttachment, useDeleteAttachment, getAttachmentUrl,
  sendRegistrationEmail, OUTREACH_STATUSES, EMIRATES, type RegistryRecordType,
} from "@/hooks/useUAERegistry";
import { toast } from "sonner";

const SERVICE_CATEGORIES = ["Sales","Leasing","Off-Plan","Secondary Market","Property Management","Commercial","Luxury","Investment Advisory","Unknown"];
const COMPANY_TYPES = ["Private Developer","Government Developer","Semi-Government Developer","Master Developer","Holding Company","Development Arm","Unknown"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[#1A1A1A]/70">{label}</label>
      {children}
    </div>
  );
}

function ChipInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map((v, i) => (
          <Badge key={i} variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
            {v}
            <button className="ml-1 text-[#1A1A1A]/60" onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-1">
        <Input placeholder={placeholder} value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) { onChange([...value, draft.trim()]); setDraft(""); e.preventDefault(); } }} />
        <Button size="sm" variant="outline" onClick={() => { if (draft.trim()) { onChange([...value, draft.trim()]); setDraft(""); } }}>Add</Button>
      </div>
    </div>
  );
}

function JsonRowEditor({ rows, columns, onChange }: {
  rows: any[]; columns: { key: string; label: string; placeholder?: string }[];
  onChange: (rows: any[]) => void;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, idx) => (
        <div key={idx} className="grid gap-2 p-2 border border-[#B89555]/20 rounded bg-[#F7F2EA]" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr)) auto` }}>
          {columns.map((c) => (
            <Input key={c.key} placeholder={c.placeholder ?? c.label} value={row[c.key] ?? ""}
              onChange={(e) => { const next = [...rows]; next[idx] = { ...row, [c.key]: e.target.value }; onChange(next); }} />
          ))}
          <Button size="sm" variant="outline" onClick={() => onChange(rows.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3" /></Button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...rows, {}])}><Plus className="h-3 w-3 mr-1" />Add row</Button>
    </div>
  );
}

export default function UAERegistryDetailPage({ type }: { type: RegistryRecordType }) {
  const { id } = useParams<{ id: string }>();
  const rec = useRegistryRecord(type, id);
  const sources = useRegistrySources(type, id);
  const log = useRegistryLog(type, id);
  const attachments = useRegistryAttachments(type, id);
  const upload = useUploadAttachment(type);
  const delAtt = useDeleteAttachment(type);
  const addSource = useAddSource(type);
  const update = useUpdateRecord(type);

  const [src, setSrc] = useState({ source_name: "", source_url: "", fields: "" });
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [contact, setContact] = useState("Team");
  const [draft, setDraft] = useState<Record<string, any>>({});

  if (rec.isLoading) return <div className="p-8 bg-[#FDFBF7] min-h-screen">Loading…</div>;
  if (!rec.data) return <div className="p-8 bg-[#FDFBF7] min-h-screen">Not found</div>;

  const r = { ...rec.data, ...draft };
  const recipient = type === "developer" ? r.registration_email : r.outreach_email;
  const backTo = type === "developer" ? "/owner/uae-registry/developers" : "/owner/uae-registry/brokerages";
  const set = (k: string, v: any) => setDraft({ ...draft, [k]: v });
  const dirty = Object.keys(draft).length > 0;

  const handleSave = async () => {
    try { await update.mutateAsync({ id: r.id, patch: draft }); setDraft({}); rec.refetch(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleSend = async (isTest: boolean) => {
    if (!recipient) { toast.error("No recipient email"); return; }
    if (!sources.data?.length) { toast.error("Add at least one verified source first"); return; }
    if (r.verification_status === "Not Verified") { toast.error("Set verification to Partially Verified or Verified first"); return; }
    try {
      await sendRegistrationEmail({ recordType: type, recordId: r.id, language: lang, contactPersonName: contact, recipientEmail: recipient, isTestSend: isTest });
      toast.success(`${isTest ? "Test" : "Registration"} email sent from CONTACT@JBJ.AE`);
      rec.refetch(); log.refetch();
    } catch (e: any) { toast.error(e.message ?? "Send failed"); }
  };

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-[#FDFBF7] px-6 py-8 max-w-6xl mx-auto">
        <Link to={backTo} className="inline-flex items-center gap-1 text-sm mb-4 text-[#1A1A1A]"><ArrowLeft className="h-4 w-4" />Back</Link>
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">{r.brand_name}</h1>
            <p className="text-sm text-[#1A1A1A]/70">{r.legal_company_name} · {r.emirate_section}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">{r.outreach_status}</Badge>
              <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">{r.verification_status}</Badge>
              <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">Priority: {type === "developer" ? r.developer_priority : r.brokerage_priority}</Badge>
            </div>
          </div>
          {dirty && <Button onClick={handleSave} className="bg-[#1A1A1A] text-white"><Save className="h-4 w-4 mr-1" />Save changes</Button>}
        </header>

        <Tabs defaultValue="profile">
          <TabsList className="bg-[#EFE6D6]">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value={type === "developer" ? "projects" : "relationships"}>{type === "developer" ? "Projects" : "Relationships"}</TabsTrigger>
            <TabsTrigger value="sources">Sources ({sources.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="comm">Communication</TabsTrigger>
            <TabsTrigger value="attach">Attachments ({attachments.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="outreach">Outreach</TabsTrigger>
            <TabsTrigger value="relhub">Relational Hub</TabsTrigger>
          </TabsList>

          {/* PROFILE */}
          <TabsContent value="profile" className="mt-4">
            <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Legal company name *"><Input value={r.legal_company_name ?? ""} onChange={(e) => set("legal_company_name", e.target.value)} /></Field>
              <Field label="Brand name *"><Input value={r.brand_name ?? ""} onChange={(e) => set("brand_name", e.target.value)} /></Field>
              <Field label="Emirate">
                <Select value={r.emirate_section} onValueChange={(v) => set("emirate_section", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Website"><Input value={r.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://…" /></Field>
              <Field label="Headquarters address"><Input value={r.headquarters_address ?? ""} onChange={(e) => set("headquarters_address", e.target.value)} /></Field>
              <Field label="Google Maps URL"><Input value={r.office_google_maps_url ?? ""} onChange={(e) => set("office_google_maps_url", e.target.value)} /></Field>
              <Field label="Instagram URL"><Input value={r.instagram_url ?? ""} onChange={(e) => set("instagram_url", e.target.value)} /></Field>
              <Field label="LinkedIn URL"><Input value={r.linkedin_url ?? ""} onChange={(e) => set("linkedin_url", e.target.value)} /></Field>
              <Field label="Last verified date *"><Input type="date" value={r.last_verified_date ?? ""} onChange={(e) => set("last_verified_date", e.target.value)} /></Field>
              <Field label="Verification status">
                <Select value={r.verification_status} onValueChange={(v) => set("verification_status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Verified","Partially Verified","Not Verified"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Priority">
                <Select value={type === "developer" ? r.developer_priority : r.brokerage_priority}
                  onValueChange={(v) => set(type === "developer" ? "developer_priority" : "brokerage_priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["High","Medium","Low","Unknown"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Data source"><Input value={r.data_source ?? ""} onChange={(e) => set("data_source", e.target.value)} /></Field>

              {type === "developer" && (<>
                <Field label="Company type">
                  <Select value={r.company_type ?? "Unknown"} onValueChange={(v) => set("company_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{COMPANY_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Master developer status">
                  <Select value={r.master_developer_status ?? "Unverified"} onValueChange={(v) => set("master_developer_status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Yes","No","Unverified"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                {r.master_developer_status === "Yes" && (
                  <Field label="Master developer evidence (required)"><Input value={r.master_developer_evidence ?? ""} onChange={(e) => set("master_developer_evidence", e.target.value)} /></Field>
                )}
                <Field label="Founded year"><Input type="number" value={r.founded_year ?? ""} onChange={(e) => set("founded_year", parseInt(e.target.value) || null)} /></Field>
                <Field label="Registration email"><Input value={r.registration_email ?? ""} onChange={(e) => set("registration_email", e.target.value)} /></Field>
                <Field label="Registration page URL"><Input value={r.registration_page_url ?? ""} onChange={(e) => set("registration_page_url", e.target.value)} /></Field>
                <div className="md:col-span-2"><Field label="Broker registration process"><Textarea value={r.broker_registration_process ?? ""} onChange={(e) => set("broker_registration_process", e.target.value)} rows={3} /></Field></div>
                <div className="md:col-span-2"><Field label="Required documents for registration">
                  <ChipInput value={r.required_documents_for_registration ?? []} onChange={(v) => set("required_documents_for_registration", v)} placeholder="Trade License, NDA…" />
                </Field></div>
              </>)}

              {type === "brokerage" && (<>
                <Field label="License number"><Input value={r.license_number ?? ""} onChange={(e) => set("license_number", e.target.value)} /></Field>
                <Field label="Regulator / authority"><Input value={r.regulator_or_authority ?? ""} onChange={(e) => set("regulator_or_authority", e.target.value)} /></Field>
                <Field label="RERA ORN / broker number"><Input value={r.rera_orn_or_broker_number ?? ""} onChange={(e) => set("rera_orn_or_broker_number", e.target.value)} /></Field>
                <Field label="Outreach contact person"><Input value={r.outreach_contact_person ?? ""} onChange={(e) => set("outreach_contact_person", e.target.value)} /></Field>
                <Field label="Outreach email"><Input value={r.outreach_email ?? ""} onChange={(e) => set("outreach_email", e.target.value)} /></Field>
                <Field label="Outreach phone"><Input value={r.outreach_phone ?? ""} onChange={(e) => set("outreach_phone", e.target.value)} /></Field>
                <Field label="Company size"><Input value={r.company_size_estimated ?? ""} onChange={(e) => set("company_size_estimated", e.target.value)} /></Field>
                <Field label="Number of brokers"><Input type="number" value={r.number_of_brokers ?? ""} onChange={(e) => set("number_of_brokers", parseInt(e.target.value) || null)} /></Field>
                <Field label="Primary market"><Input value={r.primary_market ?? ""} onChange={(e) => set("primary_market", e.target.value)} /></Field>
                <div className="md:col-span-2"><Field label="Service categories">
                  <ChipInput value={r.service_categories ?? []} onChange={(v) => set("service_categories", v)} placeholder={SERVICE_CATEGORIES.join(", ")} />
                </Field></div>
                <div className="md:col-span-2"><Field label="Specialization">
                  <ChipInput value={r.specialization ?? []} onChange={(v) => set("specialization", v)} placeholder="Luxury, Off-plan…" />
                </Field></div>
              </>)}

              <div className="md:col-span-2"><Field label="Notes"><Textarea value={r.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={3} /></Field></div>
            </Card>
          </TabsContent>

          {/* CONTACTS */}
          <TabsContent value="contacts" className="mt-4 space-y-4">
            <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30">
              <h3 className="font-semibold mb-3 text-[#1A1A1A]">Office locations</h3>
              <JsonRowEditor rows={r.office_locations ?? []}
                columns={[{ key: "emirate", label: "Emirate" }, { key: "full_address", label: "Address" }, { key: "phone", label: "Phone" }, { key: "email", label: "Email" }, { key: "source_url", label: "Source URL *" }]}
                onChange={(v) => set("office_locations", v)} />
            </Card>
            <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30">
              <h3 className="font-semibold mb-3 text-[#1A1A1A]">Main phone numbers</h3>
              <JsonRowEditor rows={r.main_phone_numbers ?? []}
                columns={[{ key: "phone", label: "Phone" }, { key: "source_url", label: "Source URL *" }]}
                onChange={(v) => set("main_phone_numbers", v)} />
            </Card>
            <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30">
              <h3 className="font-semibold mb-3 text-[#1A1A1A]">Main email addresses</h3>
              <JsonRowEditor rows={r.main_email_addresses ?? []}
                columns={[{ key: "email", label: "Email" }, { key: "source_url", label: "Source URL *" }]}
                onChange={(v) => set("main_email_addresses", v)} />
            </Card>
            <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30">
              <h3 className="font-semibold mb-3 text-[#1A1A1A]">Public key contacts</h3>
              <JsonRowEditor rows={r.public_key_contacts ?? []}
                columns={[{ key: "full_name", label: "Name" }, { key: "job_title", label: "Title" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "linkedin_url", label: "LinkedIn" }, { key: "source_url", label: "Source URL *" }]}
                onChange={(v) => set("public_key_contacts", v)} />
            </Card>
          </TabsContent>

          {/* PROJECTS / RELATIONSHIPS */}
          <TabsContent value={type === "developer" ? "projects" : "relationships"} className="mt-4 space-y-4">
            {type === "developer" ? (<>
              <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30">
                <h3 className="font-semibold mb-3 text-[#1A1A1A]">UAE projects</h3>
                <JsonRowEditor rows={r.uae_projects ?? []}
                  columns={[{ key: "project_name", label: "Project" }, { key: "emirate", label: "Emirate" }, { key: "area_or_community", label: "Area" }, { key: "project_type", label: "Type" }, { key: "launch_year", label: "Launch" }, { key: "handover_year", label: "Handover" }, { key: "status", label: "Status" }, { key: "source_url", label: "Source URL *" }]}
                  onChange={(v) => set("uae_projects", v)} />
              </Card>
              <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30">
                <h3 className="font-semibold mb-3 text-[#1A1A1A]">International projects</h3>
                <JsonRowEditor rows={r.international_projects ?? []}
                  columns={[{ key: "country", label: "Country" }, { key: "city", label: "City" }, { key: "project_name", label: "Project" }, { key: "project_type", label: "Type" }, { key: "status", label: "Status" }, { key: "source_url", label: "Source URL *" }]}
                  onChange={(v) => set("international_projects", v)} />
              </Card>
              <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30">
                <h3 className="font-semibold mb-3 text-[#1A1A1A]">Public registration identifiers</h3>
                <JsonRowEditor rows={r.public_registration_identifiers ?? []}
                  columns={[{ key: "identifier_type", label: "Type" }, { key: "identifier_value", label: "Value" }, { key: "issuing_authority", label: "Authority" }, { key: "source_url", label: "Source URL *" }]}
                  onChange={(v) => set("public_registration_identifiers", v)} />
              </Card>
            </>) : (
              <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30">
                <h3 className="font-semibold mb-3 text-[#1A1A1A]">Active developer relationships</h3>
                <JsonRowEditor rows={r.active_developer_relationships ?? []}
                  columns={[{ key: "developer_name", label: "Developer" }, { key: "relationship_type", label: "Type" }, { key: "evidence_source_url", label: "Evidence URL" }]}
                  onChange={(v) => set("active_developer_relationships", v)} />
              </Card>
            )}
          </TabsContent>

          {/* SOURCES */}
          <TabsContent value="sources" className="mt-4">
            <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30">
              <div className="space-y-2 mb-3 max-h-[400px] overflow-auto">
                {sources.data?.map((s: any) => (
                  <div key={s.id} className="text-xs p-2 bg-[#F7F2EA] rounded">
                    <div className="font-medium text-[#1A1A1A]">{s.source_name}</div>
                    <a href={s.source_url} target="_blank" rel="noreferrer" className="underline text-[#1A1A1A]/80">{s.source_url}</a>
                    <div className="text-[#1A1A1A]/70">Fields: {(s.fields_verified ?? []).join(", ") || "—"}</div>
                  </div>
                ))}
                {(!sources.data || sources.data.length === 0) && <div className="text-xs text-[#1A1A1A]/70">No sources yet.</div>}
              </div>
              <div className="space-y-2 border-t pt-3 border-[#B89555]/20">
                <Input placeholder="Source name" value={src.source_name} onChange={(e) => setSrc({ ...src, source_name: e.target.value })} />
                <Input placeholder="Source URL" value={src.source_url} onChange={(e) => setSrc({ ...src, source_url: e.target.value })} />
                <Input placeholder="Fields verified (comma-separated)" value={src.fields} onChange={(e) => setSrc({ ...src, fields: e.target.value })} />
                <Button size="sm" variant="outline" onClick={async () => {
                  if (!src.source_url || !src.source_name) { toast.error("Name + URL required"); return; }
                  await addSource.mutateAsync({ recordId: r.id, source_name: src.source_name, source_url: src.source_url,
                    fields_verified: src.fields.split(",").map(x => x.trim()).filter(Boolean) });
                  setSrc({ source_name: "", source_url: "", fields: "" });
                }}><Plus className="h-3 w-3 mr-1" />Add source</Button>
              </div>
            </Card>
          </TabsContent>

          {/* COMMUNICATION */}
          <TabsContent value="comm" className="mt-4">
            <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30">
              <div className="space-y-3 max-h-[600px] overflow-auto">
                {log.data?.map((l: any) => (
                  <div key={l.id} className="p-3 bg-[#F7F2EA] rounded border border-[#B89555]/30">
                    <div className="flex justify-between text-xs text-[#1A1A1A]/70">
                      <span>{l.channel} · {l.direction} · {l.language}</span>
                      <span>{new Date(l.occurred_at).toLocaleString()}</span>
                    </div>
                    <div className="text-sm mt-1 text-[#1A1A1A]">{l.summary}</div>
                    {l.ai_extracted && l.direction === "Inbound" && typeof l.ai_extracted === "object" && (
                      <div className="mt-2 p-2 bg-white border border-[#B89555]/30 rounded text-xs">
                        <div className="flex items-center gap-1 font-semibold text-[#1A1A1A] mb-1"><Sparkles className="h-3 w-3" />AI extraction</div>
                        {l.ai_extracted.summary && <div><b>Summary:</b> {l.ai_extracted.summary}</div>}
                        {Array.isArray(l.ai_extracted.requested_documents) && l.ai_extracted.requested_documents.length > 0 &&
                          <div><b>Requested documents:</b> {l.ai_extracted.requested_documents.join(", ")}</div>}
                        {l.ai_extracted.contact_person && <div><b>Contact person:</b> {l.ai_extracted.contact_person}</div>}
                        {l.ai_extracted.registration_instructions && <div><b>Instructions:</b> {l.ai_extracted.registration_instructions}</div>}
                        {l.ai_extracted.deadline && <div><b>Deadline:</b> {l.ai_extracted.deadline}</div>}
                        {l.ai_extracted.recommended_next_action && <div><b>Next action:</b> {l.ai_extracted.recommended_next_action}</div>}
                      </div>
                    )}
                  </div>
                ))}
                {(!log.data || log.data.length === 0) && <div className="text-xs text-[#1A1A1A]/70">No activity yet.</div>}
              </div>
            </Card>
          </TabsContent>

          {/* ATTACHMENTS */}
          <TabsContent value="attach" className="mt-4">
            <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30">
              <div className="mb-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-[#B89555]/40 rounded cursor-pointer text-sm text-[#1A1A1A]">
                  <Upload className="h-4 w-4" /> Upload file
                  <input type="file" hidden onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    await upload.mutateAsync({ recordId: r.id, file: f, sentTo: recipient ?? undefined, sentDate: new Date().toISOString().slice(0, 10) });
                    e.target.value = "";
                  }} />
                </label>
              </div>
              <div className="space-y-2">
                {attachments.data?.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-2 bg-[#F7F2EA] rounded">
                    <div className="text-sm text-[#1A1A1A]">
                      <div className="font-medium">{a.file_name}</div>
                      <div className="text-xs text-[#1A1A1A]/70">{a.sent_to ?? "—"} · {a.sent_date ?? new Date(a.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={async () => {
                        const url = await getAttachmentUrl(a.storage_path);
                        if (url) window.open(url, "_blank");
                      }}><Download className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => delAtt.mutate({ id: a.id, storage_path: a.storage_path, recordId: r.id })}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
                {(!attachments.data || attachments.data.length === 0) && <div className="text-xs text-[#1A1A1A]/70">No attachments yet.</div>}
              </div>
            </Card>
          </TabsContent>

          {/* OUTREACH */}
          <TabsContent value="outreach" className="mt-4">
            <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30 space-y-3">
              <div className="text-sm"><span className="text-[#1A1A1A]/70">Recipient:</span> <strong className="text-[#1A1A1A]">{recipient ?? "— add registration email —"}</strong></div>
              <div className="text-sm"><span className="text-[#1A1A1A]/70">Sender (locked):</span> <strong className="text-[#1A1A1A]">CONTACT@JBJ.AE</strong></div>
              <div className="flex gap-2">
                <Select value={lang} onValueChange={(v: any) => setLang(v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="ar">العربية</SelectItem></SelectContent>
                </Select>
                <Input placeholder="Contact person" value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSend(true)}>Test send</Button>
                <Button className="bg-[#1A1A1A] text-white" onClick={() => handleSend(false)} disabled={!r.test_email_completed}>
                  <Send className="h-4 w-4 mr-1" />Send registration
                </Button>
              </div>
              {!r.test_email_completed && <p className="text-xs text-amber-700">Test send required before bulk send.</p>}
              <div>
                <label className="text-xs text-[#1A1A1A]/70">Status</label>
                <Select value={r.outreach_status} onValueChange={(v) => update.mutate({ id: r.id, patch: { outreach_status: v } })}>
                  <SelectTrigger className="w-full mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{OUTREACH_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-[#1A1A1A]/70 pt-3 border-t border-[#B89555]/20">
                <div>First sent: {r.first_email_sent_at ? new Date(r.first_email_sent_at).toLocaleString() : "—"}</div>
                <div>Last sent: {r.last_email_sent_at ? new Date(r.last_email_sent_at).toLocaleString() : "—"}</div>
                <div>Last reply: {r.last_reply_received_at ? new Date(r.last_reply_received_at).toLocaleString() : "—"}</div>
                <div>Next follow-up: {r.next_follow_up_date ?? "—"}</div>
                <div>Follow-ups sent: {r.number_of_follow_ups_sent ?? 0}</div>
                <div>Registration completed: {r.registration_completed_date ?? "—"}</div>
              </div>
              {r.last_response_summary && <div className="text-sm pt-2"><b>Last response summary:</b> {r.last_response_summary}</div>}
              {r.required_next_action && <div className="text-sm"><b>Required next action:</b> {r.required_next_action}</div>}
            </Card>
          </TabsContent>

          {/* RELATIONAL HUB — linked people, scanned cards, source history */}
          <TabsContent value="relhub" className="mt-4">
            <Card className="p-5 bg-[#FDFBF7] border-[#B89555]/30">
              <RelationalHubTabs
                kind={type === "developer" ? "developer" : "brokerage"}
                entityId={r.id}
                name={r.brand_name || r.legal_company_name}
                aliases={[r.legal_company_name, r.brand_name]}
                email={type === "developer" ? r.registration_email : r.outreach_email}
                phone={r.outreach_phone || (Array.isArray(r.main_phone_numbers) ? r.main_phone_numbers[0]?.number ?? r.main_phone_numbers[0] : undefined)}
                sourceHistory={(log.data ?? []).map((row: any) => ({
                  id: row.id,
                  when: row.occurred_at ?? row.created_at,
                  who: row.actor_email ?? row.actor ?? null,
                  what: row.action ?? row.event_type ?? "log entry",
                  detail: row.details ?? row.note ?? row.summary ?? null,
                }))}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OwnerGuard>
  );
}
