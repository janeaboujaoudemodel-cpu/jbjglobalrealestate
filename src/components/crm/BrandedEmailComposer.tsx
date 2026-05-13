/**
 * BrandedEmailComposer
 *
 * Universal "send a branded email to any recipient" card. AI drafts
 * subject + body, owner edits freely, optionally saves as a template,
 * Test → Live re-use the EXACT same locked payload so what the owner
 * approves is byte-for-byte what the recipient gets.
 *
 * Identity rule (locked):
 *   From  = contact@jbj.ae · "JBJ GLOBAL REAL ESTATE"
 *   Cc    = infoo.jane@gmail.com (default, removable per send)
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel,
} from "@/components/ui/select";
import {
  Sparkles, Send, FlaskConical, Save, Mail, Loader2,
  CalendarPlus, LibraryBig, PenLine, Copy, Download, ExternalLink, Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  useEmailTemplateLibrary, mergeTemplate, useSaveEmailTemplate,
} from "@/hooks/useEmailTemplateLibrary";
import { useEmailSignatures, renderSignatureHtml } from "@/hooks/useEmailSignatures";
import EmailChipInput from "@/components/crm/EmailChipInput";

type Template = {
  id: string; name: string; subject: string; body_html: string; brief: string | null;
};

const LANGUAGES = [
  ["en", "English"], ["ar", "Arabic"], ["fr", "French"],
  ["es", "Spanish"], ["ru", "Russian"], ["zh", "Chinese"], ["de", "German"],
] as const;

const BOOK_URL = "https://www.jbj.ae/book";

// === JBJ Brand identity (locked at the composer level) ============
const JBJ_FROM_EMAIL = "contact@jbj.ae";
const JBJ_FROM_NAME = "JBJ GLOBAL REAL ESTATE";
const JBJ_REPLY_TO = "contact@jbj.ae";
const DEFAULT_CC_EMAIL = "infoo.jane@gmail.com";
const TEST_DEFAULT_TO = ["contact@jbj.ae", "infoo.jane@gmail.com"];

function meetingBlockHtml() {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;width:100%;">
  <tr><td style="padding:20px;border:1px solid #B89555;border-radius:12px;background:#F7F2EA;">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B89555;">Founder Calendar</p>
    <p style="margin:0 0 12px;font-size:18px;color:#1A1A1A;font-weight:600;">Book a private meeting with Jane</p>
    <p style="margin:0 0 16px;font-size:14px;color:#1A1A1A;line-height:1.5;">A 60-minute consultation at our Dubai office or online (Zoom / Google Meet). Monday to Friday, 10:00–17:00 Dubai time.</p>
    <a href="${BOOK_URL}" style="display:inline-block;background:#1A1A1A;color:#FDFBF7;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:500;">Reserve a slot</a>
  </td></tr>
</table>`.trim();
}

function downloadFile(name: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function buildEmlFile(opts: {
  from: string; fromName: string; to: string[]; cc: string[]; subject: string; html: string;
}) {
  const headers = [
    `From: "${opts.fromName}" <${opts.from}>`,
    `To: ${opts.to.join(", ")}`,
    opts.cc.length ? `Cc: ${opts.cc.join(", ")}` : "",
    `Subject: ${opts.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
  ].filter(Boolean).join("\r\n");
  return `${headers}\r\n\r\n${opts.html}`;
}

export function BrandedEmailComposer() {
  // Recipients
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([DEFAULT_CC_EMAIL]);
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [recipientName, setRecipientName] = useState("");

  // Test mode chips
  const [testTo, setTestTo] = useState<string[]>([...TEST_DEFAULT_TO]);

  // Content
  const [brief, setBrief] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [language, setLanguage] = useState<string>("en");

  // Variable context
  const [propertyTitle, setPropertyTitle] = useState("");
  const [propertyPrice, setPropertyPrice] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [propertyOpen, setPropertyOpen] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [saveAsName, setSaveAsName] = useState("");

  const { data: libraryTemplates = [] } = useEmailTemplateLibrary();
  const { data: signatures = [] } = useEmailSignatures();
  const [libraryTemplateId, setLibraryTemplateId] = useState<string>("");
  const [signatureId, setSignatureId] = useState<string>("");
  const [missingVars, setMissingVars] = useState<string[]>([]);
  const saveLib = useSaveEmailTemplate();

  const [busy, setBusy] = useState<"" | "ai" | "test" | "live" | "save">("");
  const [showPreview, setShowPreview] = useState(true);

  // Refs for scroll-to-fill
  const refRecipientName = useRef<HTMLInputElement>(null);
  const refRecipientEmail = useRef<HTMLDivElement>(null);
  const refPropTitle = useRef<HTMLInputElement>(null);
  const refPropPrice = useRef<HTMLInputElement>(null);
  const refPropLoc = useRef<HTMLInputElement>(null);

  const selectedSignature = useMemo(
    () => signatures.find((s) => s.id === signatureId) || signatures.find((s) => s.is_default) || signatures[0],
    [signatures, signatureId],
  );

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("branded_email_templates")
        .select("id, name, subject, body_html, brief")
        .order("updated_at", { ascending: false });
      setTemplates(data ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!signatureId && signatures.length) {
      const def = signatures.find((s) => s.is_default) || signatures[0];
      if (def) setSignatureId(def.id);
    }
  }, [signatures, signatureId]);

  const buildCtx = (): Record<string, string> => {
    const first = recipientName.trim().split(/\s+/)[0] || "";
    return {
      first_name: first,
      full_name: recipientName.trim(),
      email: toEmails[0] || "",
      property_title: propertyTitle,
      price: propertyPrice,
      location: propertyLocation,
      book_meeting_url: BOOK_URL,
      calendar_link: BOOK_URL,
      sender_name: selectedSignature?.name_line || JBJ_FROM_NAME,
      sender_title: selectedSignature?.title_line || "",
      company_legal_name: selectedSignature?.company_line || JBJ_FROM_NAME,
    };
  };

  const onLoadTemplate = (id: string) => {
    setTemplateId(id);
    if (!id) { setSubject(""); setBodyHtml(""); setBrief(""); return; }
    const t = templates.find((x) => x.id === id);
    if (t) { setSubject(t.subject); setBodyHtml(t.body_html); setBrief(t.brief ?? ""); }
  };

  const applyLibraryTemplate = (id: string) => {
    setLibraryTemplateId(id);
    const t = libraryTemplates.find((x) => x.id === id);
    if (!t) return;
    const ctx = buildCtx();
    const sub = mergeTemplate(t.subject, ctx);
    const body = mergeTemplate(t.body_text, ctx);
    setSubject(sub.rendered);
    const html = body.rendered
      .split(/\n{2,}/)
      .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1A1A1A;">${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");
    setBodyHtml(html);
    setMissingVars(Array.from(new Set([...sub.missing, ...body.missing])));
    if (t.signature_preset_id) setSignatureId(t.signature_preset_id);
    toast.success(`Loaded "${t.name}"${body.missing.length ? ` — ${body.missing.length} variable(s) to fill` : ""}`);
  };

  // Re-merge missing vars when context updates
  useEffect(() => {
    if (!libraryTemplateId || !missingVars.length) return;
    const t = libraryTemplates.find((x) => x.id === libraryTemplateId);
    if (!t) return;
    const ctx = buildCtx();
    const sub = mergeTemplate(t.subject, ctx);
    const body = mergeTemplate(t.body_text, ctx);
    const stillMissing = Array.from(new Set([...sub.missing, ...body.missing]));
    if (stillMissing.length !== missingVars.length) {
      setSubject(sub.rendered);
      const html = body.rendered
        .split(/\n{2,}/)
        .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1A1A1A;">${p.replace(/\n/g, "<br/>")}</p>`)
        .join("");
      setBodyHtml(html);
      setMissingVars(stillMissing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientName, propertyTitle, propertyPrice, propertyLocation, toEmails]);

  const focusVarField = (key: string) => {
    const map: Record<string, () => void> = {
      first_name: () => refRecipientName.current?.focus(),
      full_name: () => refRecipientName.current?.focus(),
      email: () => {
        refRecipientEmail.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        const input = refRecipientEmail.current?.querySelector("input");
        (input as HTMLInputElement | null)?.focus();
      },
      property_title: () => { setPropertyOpen(true); setTimeout(() => refPropTitle.current?.focus(), 100); },
      price: () => { setPropertyOpen(true); setTimeout(() => refPropPrice.current?.focus(), 100); },
      location: () => { setPropertyOpen(true); setTimeout(() => refPropLoc.current?.focus(), 100); },
    };
    (map[key] || (() => toast.info(`Edit body to fill {{${key}}}`)))();
  };

  const draftWithAI = async () => {
    if (!brief.trim()) { toast.error("Write a short brief for the AI first."); return; }
    setBusy("ai");
    try {
      const { data, error } = await supabase.functions.invoke("compose-branded-email", {
        body: { brief, recipient_name: recipientName, tone: "warm executive", language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSubject(data.subject); setBodyHtml(data.body_html);
      toast.success("AI draft ready — edit before sending.");
    } catch (e: any) { toast.error(e.message ?? "AI draft failed"); }
    finally { setBusy(""); }
  };

  const saveTemplate = async () => {
    if (!saveAsName.trim()) { toast.error("Give the template a name."); return; }
    if (!subject.trim() || !bodyHtml.trim()) { toast.error("Subject and body required."); return; }
    setBusy("save");
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data, error } = await (supabase as any)
        .from("branded_email_templates")
        .insert({ owner_id: u.user.id, name: saveAsName.trim(), subject, body_html: bodyHtml, brief: brief || null })
        .select().single();
      if (error) throw error;
      setTemplates((t) => [data, ...t]);
      setTemplateId(data.id); setSaveAsName("");
      toast.success("Template saved.");
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
    finally { setBusy(""); }
  };

  const composedHtml = useMemo(() => {
    if (!bodyHtml.trim()) return "";
    const sig = selectedSignature ? renderSignatureHtml(selectedSignature) : "";
    return sig ? `${bodyHtml}\n${sig}` : bodyHtml;
  }, [bodyHtml, selectedSignature]);

  const lockOne = async (to: string, cc: string[], surface: string) => {
    const { data: locked, error } = await supabase.functions.invoke("outreach-lock-payload", {
      body: {
        surface, recipient_email: to, cc_emails: cc,
        from_email: JBJ_FROM_EMAIL, from_name: JBJ_FROM_NAME, reply_to: JBJ_REPLY_TO,
        subject, inner_html: composedHtml,
        metadata: { source: "BrandedEmailComposer", signature_id: signatureId || null, template_id: libraryTemplateId || null, bcc_planned: bccEmails.length },
      },
    });
    if (error) throw error;
    if (locked?.error) throw new Error(locked.error);
    const payloadId = locked?.id || locked?.payload_id || locked?.payload?.id;
    if (!payloadId) throw new Error("Lock function did not return a payload id");
    const { data: sent, error: sendErr } = await supabase.functions.invoke("outreach-send-locked", { body: { payload_id: payloadId } });
    if (sendErr) throw sendErr;
    if (sent?.error) throw new Error(sent.error);
  };

  const lockAndSend = async (target: "test" | "live") => {
    if (!subject.trim() || !bodyHtml.trim()) { toast.error("Subject and body required."); return; }
    const tos = target === "test" ? testTo : toEmails;
    if (!tos.length) { toast.error(target === "test" ? "Add at least one test recipient." : "Add at least one recipient."); return; }
    setBusy(target);
    try {
      const surface = target === "test" ? "branded-composer-test" : "branded-composer-live";
      // Send one email per "To" (so each recipient sees only themselves on the To line)
      for (const to of tos) {
        await lockOne(to, ccEmails, surface);
      }
      // BCC: deliver a separate copy to each BCC, no Cc revealed
      if (target === "live") {
        for (const bcc of bccEmails) {
          await lockOne(bcc, [], surface + "-bcc");
        }
      }
      toast.success(
        target === "test"
          ? `Test sent to ${tos.join(", ")}. What you see in the preview is exactly what each recipient gets.`
          : `Email sent to ${tos.length} recipient${tos.length > 1 ? "s" : ""}.`
      );
    } catch (e: any) { toast.error(e.message ?? "Send failed"); }
    finally { setBusy(""); }
  };

  // ==== Export helpers ===============================================
  const fullStandalone = useMemo(() => {
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject || "JBJ Email Preview"}</title></head><body style="margin:0;padding:24px;background:#FDFBF7;font-family:Inter,sans-serif;color:#1A1A1A;">${composedHtml}</body></html>`;
  }, [composedHtml, subject]);

  const copyHtml = async () => {
    await navigator.clipboard.writeText(composedHtml);
    toast.success("HTML copied");
  };
  const copyText = async () => {
    const tmp = document.createElement("div");
    tmp.innerHTML = composedHtml;
    await navigator.clipboard.writeText(tmp.innerText);
    toast.success("Text copied");
  };
  const downloadHtml = () => downloadFile(`${(subject || "email").replace(/[^\w]+/g, "-")}.html`, "text/html", fullStandalone);
  const downloadEml = () => downloadFile(`${(subject || "email").replace(/[^\w]+/g, "-")}.eml`, "message/rfc822",
    buildEmlFile({ from: JBJ_FROM_EMAIL, fromName: JBJ_FROM_NAME, to: toEmails.length ? toEmails : ["recipient@example.com"], cc: ccEmails, subject: subject || "JBJ Email", html: fullStandalone }),
  );
  const openInTab = () => {
    const w = window.open("", "_blank");
    if (w) { w.document.write(fullStandalone); w.document.close(); }
  };

  // === Rendering =====================================================
  const dropdownClass = ""; // shadcn handles; placeholder for future overrides

  return (
    <Card className="mb-6 border-[#B89555]/30 bg-[#FDFBF7]">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#1A1A1A]" />
            <h3 className="text-base font-semibold text-[#1A1A1A]">Send a branded email</h3>
            <span className="hidden md:inline text-xs text-[#1A1A1A]/60">
              Universal composer — AI drafts, you approve, test = live (byte-for-byte).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button" variant="outline" size="sm"
              onClick={() => setShowPreview((s) => !s)}
              className="border-[#B89555]/40"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              {showPreview ? "Hide preview" : "Show preview"}
            </Button>
            {templates.length > 0 && (
              <div className="min-w-[200px]">
                <Select value={templateId} onValueChange={onLoadTemplate}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Load template…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" disabled>Load template…</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Sender identity (locked badge) */}
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-md border border-[#B89555]/30 bg-[#F7F2EA] text-xs">
          <Badge variant="outline" className="border-[#B89555] bg-[#FDFBF7] text-[#1A1A1A]">JBJ standard</Badge>
          <span className="text-[#1A1A1A]/70">From:</span>
          <span className="font-medium text-[#1A1A1A]">{JBJ_FROM_NAME} &lt;{JBJ_FROM_EMAIL}&gt;</span>
          <span className="text-[#1A1A1A]/40">·</span>
          <span className="text-[#1A1A1A]/70">Reply-To:</span>
          <span className="font-medium text-[#1A1A1A]">{JBJ_REPLY_TO}</span>
        </div>

        {/* Template Library + Signature picker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg border border-[#B89555]/30 bg-[#F7F2EA]">
          <div>
            <Label className="text-xs flex items-center gap-1"><LibraryBig className="w-3 h-3" /> Template library</Label>
            <Select value={libraryTemplateId} onValueChange={applyLibraryTemplate}>
              <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="— Pick a ready-made template —" /></SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {(["sales_leasing", "birthday_lifecycle", "onboarding_newsletter", "operations"] as const).map((cat) => {
                  const items = libraryTemplates.filter((t) => t.category === cat);
                  if (!items.length) return null;
                  const label = cat.replace(/_/g, " & ").replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <SelectGroup key={cat}>
                      <SelectLabel>{label}</SelectLabel>
                      {items.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
                {libraryTemplates.some((t) => !["sales_leasing", "birthday_lifecycle", "onboarding_newsletter", "operations"].includes(t.category)) && (
                  <SelectGroup>
                    <SelectLabel>My templates</SelectLabel>
                    {libraryTemplates
                      .filter((t) => !["sales_leasing", "birthday_lifecycle", "onboarding_newsletter", "operations"].includes(t.category))
                      .map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
            {missingVars.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-[10px] text-[#1A1A1A]/60 self-center mr-1">Click to fill:</span>
                {missingVars.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => focusVarField(v)}
                    className="text-[10px] px-2 py-0.5 rounded border border-[#B89555] bg-[#FDFBF7] hover:bg-[#EFE6D6] text-[#1A1A1A] font-medium"
                    title={`Fill {{${v}}}`}
                  >
                    fill: {v}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><PenLine className="w-3 h-3" /> Signature</Label>
            <Select value={signatureId} onValueChange={setSignatureId}>
              <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Pick a signature" /></SelectTrigger>
              <SelectContent>
                {signatures.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.role_label ? ` — ${s.role_label}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[10px] text-[#1A1A1A]/60">Auto-appended to every send. Test = live.</p>
          </div>
        </div>

        {/* Body grid: left = compose, right = preview */}
        <div className={`grid gap-4 ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {/* LEFT: compose */}
          <div className="space-y-4">
            {/* Recipient name */}
            <div>
              <Label className="text-xs">Recipient full name (used for {`{{first_name}}`} / {`{{full_name}}`})</Label>
              <Input
                ref={refRecipientName}
                placeholder="e.g. Sarah Johnson"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="bg-[#FDFBF7] border-[#B89555]/40"
              />
            </div>

            {/* To / Cc / Bcc chip inputs */}
            <div ref={refRecipientEmail}>
              <EmailChipInput
                label="To"
                values={toEmails}
                onChange={setToEmails}
                placeholder="them@example.com — Enter to add"
                required
              />
              <p className="mt-1 text-[10px] text-[#1A1A1A]/60">
                Multiple recipients allowed. Each gets a separate locked send so they only see themselves on the To line.
              </p>
            </div>
            <EmailChipInput
              label="Cc"
              values={ccEmails}
              onChange={setCcEmails}
              placeholder="cc@example.com"
            />
            <EmailChipInput
              label="Bcc"
              values={bccEmails}
              onChange={setBccEmails}
              placeholder="bcc@example.com"
            />

            {/* Property variables */}
            <details
              className="text-xs"
              open={propertyOpen}
              onToggle={(e) => setPropertyOpen((e.target as HTMLDetailsElement).open)}
            >
              <summary className="cursor-pointer text-[#1A1A1A]/70 hover:text-[#1A1A1A]">
                Property context (optional — for property templates)
              </summary>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input ref={refPropTitle} placeholder="Property title" value={propertyTitle} onChange={(e) => setPropertyTitle(e.target.value)} className="bg-[#FDFBF7] border-[#B89555]/40" />
                <Input ref={refPropPrice} placeholder="Price (e.g. AED 12M)" value={propertyPrice} onChange={(e) => setPropertyPrice(e.target.value)} className="bg-[#FDFBF7] border-[#B89555]/40" />
                <Input ref={refPropLoc} placeholder="Location" value={propertyLocation} onChange={(e) => setPropertyLocation(e.target.value)} className="bg-[#FDFBF7] border-[#B89555]/40" />
              </div>
            </details>

            {/* Brief + AI */}
            <div>
              <Label className="text-xs">Brief for AI (what should this email say?)</Label>
              <Textarea
                placeholder="e.g. Thank Sarah for the meeting yesterday and share three Palm Jumeirah listings under 12M AED."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                className="bg-[#FDFBF7] border-[#B89555]/40 min-h-[70px]"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={draftWithAI} disabled={busy === "ai"} className="border-[#B89555]/40">
                  {busy === "ai" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Draft with AI
                </Button>
                <div className="min-w-[140px]">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(([k, label]) => (
                        <SelectItem key={k} value={k}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button" variant="outline"
                  onClick={() => setBodyHtml((b) => (b ? b + "\n" + meetingBlockHtml() : meetingBlockHtml()))}
                  className="border-[#B89555]/40"
                  title="Append a styled meeting-booking CTA pointing to /book"
                >
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Insert meeting block
                </Button>
              </div>
            </div>

            {/* Subject */}
            <div>
              <Label className="text-xs">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. JBJ GLOBAL REAL ESTATE — A private invitation"
                className="bg-[#FDFBF7] border-[#B89555]/40"
              />
            </div>

            {/* Body HTML editor */}
            <div>
              <Label className="text-xs">Body (HTML — edit freely; what you preview is what's sent)</Label>
              <Textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                placeholder="<p>Hello…</p>"
                className="bg-[#FDFBF7] border-[#B89555]/40 min-h-[180px] font-mono text-xs"
              />
            </div>
          </div>

          {/* RIGHT: live preview */}
          {showPreview && (
            <div className="space-y-2 lg:sticky lg:top-[100px] self-start">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> Live preview (= delivered)</Label>
                <div className="flex items-center gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={copyHtml} disabled={!composedHtml} title="Copy HTML"><Copy className="w-3.5 h-3.5" /></Button>
                  <Button type="button" size="sm" variant="ghost" onClick={copyText} disabled={!composedHtml} title="Copy plain text"><Copy className="w-3.5 h-3.5 opacity-60" /></Button>
                  <Button type="button" size="sm" variant="ghost" onClick={downloadHtml} disabled={!composedHtml} title="Download .html"><Download className="w-3.5 h-3.5" /></Button>
                  <Button type="button" size="sm" variant="ghost" onClick={downloadEml} disabled={!composedHtml} title="Download .eml"><Download className="w-3.5 h-3.5 opacity-60" /></Button>
                  <Button type="button" size="sm" variant="ghost" onClick={openInTab} disabled={!composedHtml} title="Open in new tab"><ExternalLink className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div className="rounded-md border border-[#B89555]/30 bg-[#FDFBF7] overflow-hidden">
                <div className="px-3 py-2 border-b border-[#B89555]/20 bg-[#F7F2EA] text-[11px] text-[#1A1A1A]/80">
                  <div><span className="text-[#1A1A1A]/60">From:</span> <span className="font-medium">{JBJ_FROM_NAME} &lt;{JBJ_FROM_EMAIL}&gt;</span></div>
                  <div><span className="text-[#1A1A1A]/60">To:</span> {toEmails.join(", ") || <span className="text-[#1A1A1A]/40">(no recipient yet)</span>}</div>
                  {ccEmails.length > 0 && <div><span className="text-[#1A1A1A]/60">Cc:</span> {ccEmails.join(", ")}</div>}
                  {bccEmails.length > 0 && <div><span className="text-[#1A1A1A]/60">Bcc:</span> {bccEmails.join(", ")}</div>}
                  <div><span className="text-[#1A1A1A]/60">Subject:</span> <span className="font-medium">{subject || <span className="text-[#1A1A1A]/40">(no subject)</span>}</span></div>
                </div>
                <div
                  className="p-4 max-h-[520px] overflow-auto prose prose-sm max-w-none"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: composedHtml || `<p style="color:#1A1A1A;opacity:0.4;font-style:italic">Compose a body to see the preview…</p>` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Test recipients chip row */}
        <div className="rounded-md border border-[#B89555]/30 bg-[#F7F2EA] p-3 space-y-2">
          <EmailChipInput
            label="Test recipients (where 'Send test to me' delivers)"
            values={testTo}
            onChange={setTestTo}
            placeholder="Add a test address"
          />
          <p className="text-[10px] text-[#1A1A1A]/60">Defaults: {TEST_DEFAULT_TO.join(" + ")}. Remove any with the × on the chip.</p>
        </div>

        {/* Save + Send actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#B89555]/20">
          <Input
            placeholder="Save as new template (name)"
            value={saveAsName}
            onChange={(e) => setSaveAsName(e.target.value)}
            className="max-w-xs bg-[#FDFBF7] border-[#B89555]/40"
          />
          <Button variant="outline" onClick={saveTemplate} disabled={busy === "save" || !saveAsName.trim()} className="border-[#B89555]/40">
            {busy === "save" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save template
          </Button>

          <div className="flex-1" />

          <Button
            variant="outline"
            onClick={() => lockAndSend("test")}
            disabled={busy === "test" || !subject || !bodyHtml || testTo.length === 0}
            className="border-[#B89555]/40"
            title={`Sends to ${testTo.join(", ")} using the exact same locked payload as the live send.`}
          >
            {busy === "test" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FlaskConical className="w-4 h-4 mr-2" />}
            Send test ({testTo.length})
          </Button>
          <Button
            variant="gold"
            onClick={() => lockAndSend("live")}
            disabled={busy === "live" || !subject || !bodyHtml || toEmails.length === 0}
          >
            {busy === "live" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send to {toEmails.length || 0} recipient{toEmails.length === 1 ? "" : "s"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default BrandedEmailComposer;
