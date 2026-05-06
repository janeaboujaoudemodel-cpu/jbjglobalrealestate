import { useState } from "react";
import { useCrmDocuments, useSaveDocument, useSendDocument, type CrmDocument } from "@/hooks/useCrmDocuments";
import { PAA_FIELD_GROUPS, PAA_DEFAULT_VALUES, buildPAAHtml, type PAAFieldKey, JBJ_PAA_TEMPLATE_ID } from "@/templates/jbjPropertyAdvertisingAgreement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageSquare, Link2, Save, Download, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";

type Values = Record<PAAFieldKey, string>;

export default function DocumentsFormsHub() {
  const [tab, setTab] = useState("create");
  const [editing, setEditing] = useState<CrmDocument | null>(null);
  const [values, setValues] = useState<Values>({ ...PAA_DEFAULT_VALUES });
  const [client, setClient] = useState({ name: "", email: "", phone: "" });
  const [title, setTitle] = useState("Property Advertising Agreement");
  const save = useSaveDocument();
  const send = useSendDocument();
  const { data: docs = [] } = useCrmDocuments("all");

  const html = buildPAAHtml(values);

  const setVal = (k: PAAFieldKey, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const reset = () => {
    setEditing(null);
    setValues({ ...PAA_DEFAULT_VALUES });
    setClient({ name: "", email: "", phone: "" });
    setTitle("Property Advertising Agreement");
  };

  const loadDoc = (d: CrmDocument) => {
    setEditing(d);
    setValues({ ...PAA_DEFAULT_VALUES, ...(d.field_values as any) });
    setClient({ name: d.client_name || "", email: d.client_email || "", phone: d.client_phone || "" });
    setTitle(d.title);
    setTab("create");
  };

  const handleSave = async () => {
    const saved = await save.mutateAsync({
      id: editing?.id, template_id: JBJ_PAA_TEMPLATE_ID, title,
      field_values: values,
      client_name: client.name || values.landlord_name || null,
      client_email: client.email || values.email_address || null,
      client_phone: client.phone || values.mobile_number || null,
    });
    setEditing(saved);
    return saved;
  };

  const handleSend = async (channel: "email" | "whatsapp" | "link") => {
    const doc = editing ?? (await handleSave());
    const res = await send.mutateAsync({ document_id: doc.id, channel });
    if (res?.sign_url) navigator.clipboard?.writeText(res.sign_url).catch(() => {});
  };

  const handleExportPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;
    const el = document.getElementById("paa-preview");
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${title || "JBJ-Agreement"}.pdf`);
    toast.success("PDF downloaded");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 lg:p-10">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-6">
          <div className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">Documents</div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <FileText className="w-6 h-6" /> Forms & Agreements
          </h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Branded JBJ document automation — fill, sign, send by email or WhatsApp, and store every signed copy.
          </p>
        </header>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[#F7F2EA] border border-[#B89555]/40">
            <TabsTrigger value="create">Create / Edit</TabsTrigger>
            <TabsTrigger value="sent">Sent ({docs.filter(d => ["sent","opened","filled"].includes(d.status)).length})</TabsTrigger>
            <TabsTrigger value="signed">Signed ({docs.filter(d => ["signed","completed"].includes(d.status)).length})</TabsTrigger>
            <TabsTrigger value="all">All Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: Editor */}
              <div className="bg-white border border-[#B89555]/40 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[#1A1A1A]">Document fields</h2>
                  {editing && (
                    <Button size="sm" variant="outline" onClick={reset}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> New
                    </Button>
                  )}
                </div>

                <div>
                  <Label className="text-xs">Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Client name" value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
                  <Input placeholder="Client email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} />
                  <Input placeholder="Client phone (+971...)" value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
                </div>

                {PAA_FIELD_GROUPS.map((g) => (
                  <div key={g.title}>
                    <div className="text-[11px] uppercase tracking-wider text-[#1A1A1A]/70 mt-3 mb-2 flex items-center gap-2">
                      <span>{g.title}</span>
                      <span className="flex-1 h-px bg-[#B89555]/40" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {g.fields.map((f) => (
                        <div key={f.key} className={f.type === "textarea" ? "col-span-2" : ""}>
                          <Label className="text-xs">{f.label}</Label>
                          {f.type === "textarea" ? (
                            <Textarea rows={3} value={values[f.key]} onChange={(e) => setVal(f.key, e.target.value)} />
                          ) : f.type === "select" ? (
                            <Select value={values[f.key]} onValueChange={(v) => setVal(f.key, v)}>
                              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                              <SelectContent>
                                {f.options!.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                              value={values[f.key]} onChange={(e) => setVal(f.key, e.target.value)} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap gap-2 pt-3 border-t border-[#B89555]/30">
                  <Button onClick={handleSave} disabled={save.isPending} className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90">
                    <Save className="w-4 h-4 mr-1.5" /> Save Draft
                  </Button>
                  <Button onClick={handleExportPdf} variant="outline" className="border-[#B89555]/60">
                    <Download className="w-4 h-4 mr-1.5" /> Export PDF
                  </Button>
                  <Button onClick={() => handleSend("email")} disabled={send.isPending} variant="outline" className="border-[#B89555]/60">
                    <Mail className="w-4 h-4 mr-1.5" /> Send by Email
                  </Button>
                  <Button onClick={() => handleSend("whatsapp")} disabled={send.isPending} variant="outline" className="border-[#B89555]/60">
                    <MessageSquare className="w-4 h-4 mr-1.5" /> Send by WhatsApp
                  </Button>
                  <Button onClick={() => handleSend("link")} disabled={send.isPending} variant="outline" className="border-[#B89555]/60">
                    <Link2 className="w-4 h-4 mr-1.5" /> Copy Sign Link
                  </Button>
                </div>
              </div>

              {/* RIGHT: live preview */}
              <div className="bg-white border border-[#B89555]/40 rounded-lg overflow-auto max-h-[85vh]">
                <div id="paa-preview" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
              </div>
            </div>
          </TabsContent>

          {(["sent", "signed", "all"] as const).map((kind) => (
            <TabsContent key={kind} value={kind} className="mt-4">
              <DocsTable
                docs={docs.filter((d) =>
                  kind === "all" ? true :
                  kind === "sent" ? ["sent","opened","filled"].includes(d.status) :
                  ["signed","completed"].includes(d.status))}
                onOpen={loadDoc}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

function DocsTable({ docs, onOpen }: { docs: CrmDocument[]; onOpen: (d: CrmDocument) => void }) {
  if (!docs.length) return (
    <div className="bg-white border border-[#B89555]/40 rounded-lg p-10 text-center text-[#1A1A1A]/60">
      No documents yet.
    </div>
  );
  return (
    <div className="bg-white border border-[#B89555]/40 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#F7F2EA] text-[#1A1A1A]">
          <tr>
            <th className="text-left px-3 py-2 font-semibold">Title</th>
            <th className="text-left px-3 py-2 font-semibold">Client</th>
            <th className="text-left px-3 py-2 font-semibold">Status</th>
            <th className="text-left px-3 py-2 font-semibold">Updated</th>
            <th className="text-right px-3 py-2 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id} className="border-t border-[#B89555]/20">
              <td className="px-3 py-2 text-[#1A1A1A]">{d.title}</td>
              <td className="px-3 py-2 text-[#1A1A1A]/80">{d.client_name || d.client_email || "—"}</td>
              <td className="px-3 py-2">
                <span className="px-2 py-0.5 rounded-full text-xs bg-[#EFE6D6] border border-[#B89555]/40 text-[#1A1A1A] capitalize">
                  {d.status}
                </span>
              </td>
              <td className="px-3 py-2 text-[#1A1A1A]/70">{new Date(d.updated_at).toLocaleString()}</td>
              <td className="px-3 py-2 text-right">
                <Button size="sm" variant="outline" onClick={() => onOpen(d)}>Open</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
