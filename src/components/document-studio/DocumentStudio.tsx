/**
 * DocumentStudio
 * --------------
 * The unified document-generation engine used by both:
 *   - Careers Portal → Contracts & Templates (catalog="staff")
 *   - Forms & Contracts hub (catalog="client")
 *
 * Premium header + footer are LOCKED (see `jbjLockedChrome.ts`) and
 * always wrap the editable body for preview, print, PDF export and
 * branded-email attachment.
 *
 * No new edge functions: reuses `letter-ai-generate` for generation
 * and the existing branded-email pipeline for sending.
 */

import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Wand2, Printer, Mail, FlaskConical, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DOMPurify from "dompurify";

import {
  DOCUMENT_CATALOG, getCatalogByAudience, getTemplateById,
  DocumentAudience, DocumentTemplate,
} from "@/config/documentCatalog";
import { DEPARTMENTS } from "@/hooks/useHRJobOffers";
import {
  jbjHeaderHtml, jbjFooterHtml, wrapWithJbjChrome, stripChromeArtifacts,
} from "@/templates/jbjLockedChrome";
import AiEditChatPanel from "./AiEditChatPanel";

interface Props {
  catalog: DocumentAudience;
  trigger?: React.ReactNode;
  /** Pre-select a template (used by ContractForms quick-pick). */
  presetTemplateId?: string;
}

const OWNER_TEST_EMAIL = "infoo.jane@gmail.com";

export default function DocumentStudio({ catalog, trigger, presetTemplateId }: Props) {
  const [open, setOpen] = useState(false);
  const templates = useMemo(() => getCatalogByAudience(catalog), [catalog]);
  const [templateId, setTemplateId] = useState<string>(
    presetTemplateId && getTemplateById(presetTemplateId)?.audience === catalog
      ? presetTemplateId
      : templates[0]?.id || ""
  );
  const template = useMemo(() => getTemplateById(templateId), [templateId]);

  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [bodyHtml, setBodyHtml] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const [emailTo, setEmailTo] = useState("");
  const [sending, setSending] = useState(false);

  const setField = (k: string, v: string) =>
    setFields((p) => ({ ...p, [k]: v }));

  const buildPrompt = (t: DocumentTemplate): string => {
    const filled = t.fields
      .map((f) => `${f.label}: ${fields[f.key] || "(not provided)"}`)
      .join("\n");
    const positionLine =
      t.needsPosition ? `Department: ${department}` : "";
    return [
      t.aiInstructions,
      "",
      "Render the body as 2–6 short paragraphs separated by blank lines.",
      "Do NOT include company letterhead, address, phone, signature block, or any header/footer — those are appended automatically.",
      "",
      "Details supplied by the owner:",
      positionLine,
      filled,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const handleGenerate = async () => {
    if (!template) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("letter-ai-generate", {
        body: {
          prompt: buildPrompt(template),
          tone: "formal",
          language: "English",
          recipient: fields.recipientName || "",
        },
      });
      if (error) throw error;
      const text: string = (data?.body_text || "").trim();
      if (!text) throw new Error("Empty AI response");

      const html = text
        .split(/\n{2,}/)
        .map((p) => `<p style="margin:0 0 14px;line-height:1.65;">${p.replace(/\n/g, "<br/>")}</p>`)
        .join("");
      setBodyHtml(html);
      toast.success("Document generated");
    } catch (e: any) {
      toast.error(e?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!bodyHtml) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(wrapWithJbjChrome(DOMPurify.sanitize(bodyHtml)));
    w.document.close();
    w.print();
  };

  const handleSend = async (recipientOverride?: string) => {
    if (!bodyHtml || !template) return;
    const to = (recipientOverride || emailTo).trim();
    if (!to) {
      toast.error("Enter a recipient email");
      return;
    }
    setSending(true);
    try {
      const fullHtml = wrapWithJbjChrome(DOMPurify.sanitize(bodyHtml));
      // Reuse the existing branded-email pipeline.
      const { error } = await supabase.functions.invoke("compose-branded-email", {
        body: {
          to,
          subject: template.emailSubject,
          body_html: fullHtml,
          // Surface to the universal sender if available.
          send: true,
          source: "document-studio",
          documentType: template.id,
          audience: catalog,
        },
      });
      if (error) throw error;
      toast.success(
        recipientOverride
          ? `Test sent to ${recipientOverride}`
          : `Sent to ${to}`
      );
    } catch (e: any) {
      toast.error(e?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="primary">
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[1400px] w-[96vw] h-[92vh] p-0 overflow-hidden flex flex-col bg-[#FDFBF7]">
        <DialogHeader className="px-6 py-3 border-b border-[#B89555]/25 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <Sparkles className="w-4 h-4" />
            Document Studio
            <span className="text-xs font-normal text-[#1A1A1A]/60 ml-2">
              {catalog === "staff" ? "Careers · staff documents" : "Client · real-estate documents"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-4 p-4 flex-1 overflow-hidden">
          {/* LEFT: Template + fields */}
          <aside className="col-span-3 overflow-y-auto pr-2 space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[320px]">
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {template && (
                <p className="text-xs text-[#1A1A1A]/65 mt-1.5">{template.description}</p>
              )}
            </div>

            {template?.needsPosition && (
              <div>
                <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {template?.fields.map((f) => (
              <div key={f.key}>
                <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">
                  {f.label}{f.required && <span className="text-red-600 ml-1">*</span>}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    value={fields[f.key] || ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={3}
                    className="mt-1"
                  />
                ) : f.type === "select" ? (
                  <Select value={fields[f.key] || ""} onValueChange={(v) => setField(f.key, v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                    value={fields[f.key] || ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="mt-1"
                  />
                )}
              </div>
            ))}

            <Button
              onClick={handleGenerate}
              disabled={generating || !template}
              className="w-full"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" /> {bodyHtml ? "Regenerate" : "Generate"}</>
              )}
            </Button>
          </aside>

          {/* CENTER: Locked-chrome preview with editable body */}
          <section className="col-span-6 overflow-y-auto bg-[#F7F2EA] rounded-xl border border-[#B89555]/25">
            <div className="bg-white shadow-sm m-4 rounded-lg overflow-hidden">
              {/* LOCKED HEADER */}
              <div
                className="relative"
                dangerouslySetInnerHTML={{ __html: jbjHeaderHtml() }}
              />
              <div className="absolute mt-[-28px] ml-3 text-[10px] text-[#1A1A1A]/60 flex items-center gap-1 pointer-events-none">
                <Lock className="w-3 h-3" /> Locked
              </div>

              {/* EDITABLE BODY */}
              <div className="px-10 py-8 min-h-[420px] bg-[#FDFBF7]">
                {bodyHtml ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setBodyHtml(stripChromeArtifacts(e.currentTarget.innerHTML))}
                    className="prose prose-sm max-w-none text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#B89555]/30 rounded-md p-2 -m-2"
                    style={{ fontFamily: "Inter, system-ui, sans-serif", lineHeight: 1.65 }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml) }}
                  />
                ) : (
                  <div className="text-center py-16 text-[#1A1A1A]/55">
                    <Wand2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Fill in the details on the left and click Generate.</p>
                    <p className="text-xs mt-1">The locked premium header + footer are added automatically.</p>
                  </div>
                )}
              </div>

              {/* LOCKED FOOTER */}
              <div dangerouslySetInnerHTML={{ __html: jbjFooterHtml() }} />
            </div>

            {/* Actions */}
            {bodyHtml && (
              <div className="px-4 pb-4 flex flex-wrap gap-2 items-center">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" /> Print / PDF
                </Button>
                <div className="flex-1 min-w-[200px]">
                  <Input
                    type="email"
                    placeholder="recipient@example.com"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                  />
                </div>
                <Button size="sm" onClick={() => handleSend()} disabled={sending || !emailTo}>
                  {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Send via Branded Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(OWNER_TEST_EMAIL)}
                  disabled={sending}
                  title={`Send a test copy to ${OWNER_TEST_EMAIL}`}
                >
                  <FlaskConical className="w-4 h-4 mr-2" /> Send Test
                </Button>
              </div>
            )}
          </section>

          {/* RIGHT: AI chat editor */}
          <aside className="col-span-3 overflow-hidden">
            <AiEditChatPanel
              currentBody={bodyHtml}
              aiInstructions={template?.aiInstructions || ""}
              onApply={(next) => setBodyHtml(next)}
            />
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
