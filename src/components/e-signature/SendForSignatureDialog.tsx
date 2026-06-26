import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, LinkIcon, Send, X, Plus, RotateCcw, Copy, Loader2, FlaskConical, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL, PUBLIC_DOMAIN } from "@/config/backend";
import { openWhatsApp } from "@/utils/contactActions";
import { EmailPreviewIframe } from "./EmailPreviewIframe";
import { buildSenderSignatureHtml, escapeHtml } from "@/lib/email/buildEnvelopeEmailHtml";

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// Reference number lives in the subject ONCE — no doc title repetition,
// no "Reference: …" sub-line in the body. Keep it lean.
const DEFAULT_SUBJECT = "Signature Required: {{doc_number}}";
// {{sender_signature}} is the signature block at the bottom of the email — it is
// always YOUR brand (Jane Bou Jaoude · JBJ GLOBAL REAL ESTATE), never the client.
const DEFAULT_BODY = `Dear {{client_name}},

Please find the attached PDF document for your review.

Once reviewed, kindly proceed with signing the document via DocuSign at your earliest convenience and return the signed copy by replying to this email.

Should you require any clarification, please do not hesitate to contact me.

Thank you,`;

const MERGE_TAGS = [
  { tag: "{{client_name}}", help: "Recipient (client) name" },
  { tag: "{{doc_number}}", help: "Document number" },
  { tag: "{{doc_title}}", help: "Document title" },
  { tag: "{{signing_link}}", help: "jbj.ae signing link" },
  { tag: "{{sender_signature}}", help: "Your brand signature (Jane · JBJ GLOBAL REAL ESTATE)" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  envelope: any;
  primaryRecipient: any;
  onSent?: () => void;
}

export function SendForSignatureDialog({ open, onOpenChange, envelope, primaryRecipient, onSent }: Props) {
  const meta = (envelope?.metadata as any) || {};
  const docNumber = meta.doc_number || (envelope?.template_field_values as any)?.doc_number || "";
  const docTitle = envelope?.name || "Property Advertising Agreement";

  const [to, setTo] = useState<string[]>([]);
  const [toInput, setToInput] = useState("");
  const [ccs, setCcs] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [bccs, setBccs] = useState<string[]>([]);
  const [bccInput, setBccInput] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [channels, setChannels] = useState<{ email: boolean; whatsapp: boolean; copyLink: boolean }>({
    email: true, whatsapp: false, copyLink: false,
  });
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [lockedAt, setLockedAt] = useState<string | null>(null);
  const [lastTestId, setLastTestId] = useState<string | null>(null);
  const [docusignUrl, setDocusignUrl] = useState("");
  // Filing metadata — persisted to envelope so Contract Vault filters work.
  const [developerId, setDeveloperId] = useState<string | null>(null);
  const [developerNameInput, setDeveloperNameInput] = useState<string>("");
  const [devOptions, setDevOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [contractType, setContractType] = useState<string>("");
  const [emirate, setEmirate] = useState<string>("");
  const [area, setArea] = useState<string>("");

  // Hydrate from envelope + load owner's locked default template if present
  useEffect(() => {
    if (!envelope || !open) return;
    setTo(primaryRecipient?.email ? [primaryRecipient.email] : []);
    setCcs(Array.isArray(meta.cc_emails) ? meta.cc_emails : []);
    setBccs(Array.isArray(meta.bcc_emails) ? meta.bcc_emails : []);
    setWhatsapp(primaryRecipient?.phone || "");
    // Hydrate filing metadata from envelope (so re-opening shows previously-saved values)
    setDeveloperId((envelope as any).developer_id || meta.developer_id || null);
    setDeveloperNameInput(meta.developer_name || "");
    setContractType(meta.contract_type || "");
    setEmirate(meta.emirate || "");
    setArea(meta.area || "");
    setDevOptions([]);

    // Priority: envelope-specific > owner locked default > built-in default
    (async () => {
      const envSubject = envelope.email_subject;
      const envBody = envelope.email_message;
      if (envSubject && envBody) {
        setSubject(envSubject);
        setBody(envBody);
        return;
      }
      const { data: locked } = await supabase
        .from("esign_email_template_defaults")
        .select("subject, body, approved_at")
        .maybeSingle();
      if (locked?.subject && locked?.body) {
        setSubject(locked.subject);
        setBody(locked.body);
        setLockedAt(locked.approved_at);
      } else {
        setSubject(envSubject || DEFAULT_SUBJECT);
        setBody(envBody || DEFAULT_BODY);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envelope?.id, open]);

  const senderName = envelope?.sender_name || "Jane Bou Jaoude";
  const senderTitle = envelope?.sender_title || "Founder & CEO";

  const tokens = useMemo(() => ({
    // Recipient (client) merge tags — both names are accepted for back-compat.
    client_name: primaryRecipient?.name || (envelope?.template_field_values as any)?.landlord_name || "Client",
    landlord_name: primaryRecipient?.name || (envelope?.template_field_values as any)?.landlord_name || "Client",
    doc_number: docNumber,
    doc_title: docTitle,
    // Plain-text preview of the premium signature (delivered email renders this as styled HTML)
    sender_signature: `— ${senderName}\n${senderTitle}\nJBJ GLOBAL REAL ESTATE`,
    sender_title: senderTitle,
    owner_name: senderName,
    signing_link: primaryRecipient?.signing_token ? `${PUBLIC_DOMAIN}/sign/${primaryRecipient.signing_token}` : `${PUBLIC_DOMAIN}/sign/...`,
  }), [primaryRecipient, envelope, docNumber, docTitle, senderName, senderTitle]);

  const interpolate = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (_, k) => (tokens as any)[k] ?? `{{${k}}}`);

  const previewSubject = interpolate(subject);
  const previewBody = interpolate(body);

  // Build the recipient-ready HTML body (escape, <br/>, swap signature sentinel for styled HTML).
  const SIG_SENTINEL = "@@JBJ_SIG@@";
  const previewBodyHtml = useMemo(() => {
    const sig = buildSenderSignatureHtml(senderName, senderTitle);
    const interpWithSentinel = body
      .replace(/\{\{sender_signature\}\}/g, SIG_SENTINEL)
      .replace(/\{\{signing_link\}\}/g, "")
      .replace(/\{\{(\w+)\}\}/g, (_, k) => (tokens as any)[k] ?? "");
    return escapeHtml(interpWithSentinel).replace(/\n/g, "<br/>").replace(SIG_SENTINEL, sig);
  }, [body, tokens, senderName, senderTitle]);

  const addChip = (raw: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) => {
    const v = raw.trim();
    if (!v) return;
    // bulk paste support
    const parts = v.split(/[\s,;]+/).filter(Boolean);
    const valid: string[] = []; let invalid = 0;
    parts.forEach((p) => isValidEmail(p) ? valid.push(p) : invalid++);
    if (!valid.length) { toast.error("No valid emails"); return; }
    setList(Array.from(new Set([...list, ...valid])));
    setInput("");
    if (invalid) toast.message(`Added ${valid.length}, skipped ${invalid}`);
  };

  const handleSend = async () => {
    if (!envelope) return;
    if (channels.email && to.length === 0) { toast.error("Add at least one recipient"); return; }
    if (channels.whatsapp && !whatsapp) { toast.error("Add a WhatsApp number"); return; }
    if (!channels.email && !channels.whatsapp && !channels.copyLink) { toast.error("Pick at least one channel"); return; }

    setSending(true);
    try {
      // Current composer edits are sent only for this email. Future defaults are
      // changed only when the owner clicks Approve & Lock / Save.
      await supabase
        .from("esign_envelopes")
        .update({ metadata: { ...meta, cc_emails: ccs, bcc_emails: bccs } })
        .eq("id", envelope.id);

      // Update primary recipient phone if provided
      if (primaryRecipient && whatsapp && whatsapp !== primaryRecipient.phone) {
        await supabase.from("esign_recipients").update({ phone: whatsapp }).eq("id", primaryRecipient.id);
      }

      // Email send via edge function (uses persisted subject+body).
      // Pass envelope.document_url/document_filename explicitly so this path
      // mirrors SendViaEmailDialog and the recipient always receives the
      // latest synced PDF, not an attachment-less email.
      if (channels.email) {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const res = await fetch(`${SUPABASE_URL}/functions/v1/esign-send-for-signature`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            envelope_id: envelope.id,
            channels: ["email"],
            cc_emails: ccs,
            bcc_emails: bccs,
            interpolated_subject: previewSubject,
            interpolated_body: previewBody,
            interpolated_body_html: previewBodyHtml,
            docusign_url: docusignUrl.trim() || undefined,
            attachment_name: envelope?.document_filename || undefined,
            attachment_url: envelope?.document_url || undefined,
            // Filing metadata so signed contracts show up under the right
            // developer / type / location in Contract Vault.
            developer_id: developerId || undefined,
            developer_name: developerNameInput?.trim() || undefined,
            contract_type: contractType?.trim() || undefined,
            emirate: emirate?.trim() || undefined,
            area: area?.trim() || undefined,
          }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(out.error || "Failed to send email");
        toast.success(`Emailed to ${to.length}${ccs.length ? ` · CC ${ccs.length}` : ""}${bccs.length ? ` · BCC ${bccs.length}` : ""}`);
      }

      // WhatsApp — open via universal helper (never api.whatsapp.com, popup-safe)
      if (channels.whatsapp && whatsapp) {
        openWhatsApp(whatsapp, `${previewBody}\n\n${tokens.signing_link}`);
        toast.success("WhatsApp opened");
      }

      // Copy link
      if (channels.copyLink) {
        await navigator.clipboard.writeText(tokens.signing_link);
        toast.success("Signing link copied");
      }

      onSent?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleSendTest = async () => {
    if (!envelope) return;
    setTesting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/esign-send-test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          envelope_id: envelope.id,
          interpolated_subject: previewSubject,
          interpolated_body: previewBody,
          interpolated_body_html: previewBodyHtml,
          docusign_url: docusignUrl.trim() || undefined,
          attachment_name: envelope?.document_filename || undefined,
          attachment_url: envelope?.document_url || undefined,
          test_recipient: "infoo.jane@gmail.com",
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Failed to send test");
      setLastTestId(out.message_id || "sent");
      toast.success("Test sent to infoo.jane@gmail.com — check your inbox", { duration: 6000 });
    } catch (e: any) {
      toast.error(e.message || "Failed to send test");
    } finally {
      setTesting(false);
    }
  };

  const handleApproveLock = async () => {
    setApproving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("esign_email_template_defaults")
        .upsert(
          { user_id: user.id, subject, body, approved_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (error) throw error;
      setLockedAt(new Date().toISOString());
      toast.success("Template approved & locked — this is now the default for every Send-for-Signature");
    } catch (e: any) {
      toast.error(e.message || "Failed to lock template");
    } finally {
      setApproving(false);
    }
  };

  const Chip = ({ value, onRemove }: { value: string; onRemove: () => void }) => (
    <Badge variant="outline" className="border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] gap-1 pl-2 pr-1">
      {value}
      <button onClick={onRemove} className="ml-1 hover:bg-[#EFE6D6] rounded-sm p-0.5"><X className="w-3 h-3" /></button>
    </Badge>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#FDFBF7]">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Send className="w-5 h-5" /> Send for Signature
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Channels */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">Channels</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { key: "email" as const, icon: <Mail className="w-4 h-4" />, label: "Email" },
                { key: "whatsapp" as const, icon: <MessageCircle className="w-4 h-4" />, label: "WhatsApp" },
                { key: "copyLink" as const, icon: <LinkIcon className="w-4 h-4" />, label: "Copy link" },
              ].map((c) => {
                const active = channels[c.key];
                return (
                  <button
                    key={c.key}
                    onClick={() => setChannels((p) => ({ ...p, [c.key]: !p[c.key] }))}
                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-sm transition ${
 active
 ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A]"
 : "bg-white border-[#B89555]/30 text-[#1A1A1A]/70 hover:border-[#B89555]"
 }`}
                  >{c.icon}{c.label}</button>
                );
              })}
            </div>
          </div>

          {/* Recipients */}
          {channels.email && (
            <div className="space-y-3 p-4 rounded-xl bg-white border border-[#B89555]/30">
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">To</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1.5 min-h-[28px]">
                  {to.map((e) => <Chip key={e} value={e} onRemove={() => setTo((p) => p.filter((x) => x !== e))} />)}
                </div>
                <div className="flex gap-2">
                  <Input value={toInput} onChange={(e) => setToInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addChip(toInput, to, setTo, setToInput); } }}
                    placeholder="client@example.com" />
                  <Button type="button" variant="outline" size="sm" onClick={() => addChip(toInput, to, setTo, setToInput)}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">CC</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1.5 min-h-[28px]">
                  {ccs.map((e) => <Chip key={e} value={e} onRemove={() => setCcs((p) => p.filter((x) => x !== e))} />)}
                </div>
                <div className="flex gap-2">
                  <Input value={ccInput} onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addChip(ccInput, ccs, setCcs, setCcInput); } }}
                    placeholder="cc1@example.com, cc2@example.com" />
                  <Button type="button" variant="outline" size="sm" onClick={() => addChip(ccInput, ccs, setCcs, setCcInput)}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">BCC</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1.5 min-h-[28px]">
                  {bccs.map((e) => <Chip key={e} value={e} onRemove={() => setBccs((p) => p.filter((x) => x !== e))} />)}
                </div>
                <div className="flex gap-2">
                  <Input value={bccInput} onChange={(e) => setBccInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addChip(bccInput, bccs, setBccs, setBccInput); } }}
                    placeholder="bcc@example.com" />
                  <Button type="button" variant="outline" size="sm" onClick={() => addChip(bccInput, bccs, setBccs, setBccInput)}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          )}

          {channels.whatsapp && (
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">WhatsApp number</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+971 50 123 4567" className="mt-1.5" />
            </div>
          )}

          {/* TEST EMAIL BANNER — impossible to miss */}
          <div className="p-4 rounded-xl border border-[#B89555] bg-[#FBE9C8]/40">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-[#B89555] flex items-center justify-center shrink-0">
                <FlaskConical className="w-4 h-4 text-[#1A1A1A]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#1A1A1A]">Preview before you send</div>
                <div className="text-[11px] text-[#1A1A1A]/70 mt-0.5">
                  Send a test copy to <strong>infoo.jane@gmail.com</strong> first — same template, same signature, no client impact.
                </div>
                {lockedAt && <div className="text-[11px] text-[color:var(--emerald-1)] mt-1 inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Template locked as your default</div>}
                {lastTestId && !lockedAt && <div className="text-[11px] text-[#1A1A1A]/80 mt-1">Test sent — check your inbox, then click <strong>Approve & Lock</strong> below.</div>}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Button size="sm" variant="outline" onClick={handleSendTest} disabled={sending || testing || approving} className="border-[#B89555] bg-white">
                  {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <FlaskConical className="w-3.5 h-3.5 mr-1.5" />}
                  Send Test to Me
                </Button>
                <Button size="sm" variant="outline" onClick={handleApproveLock} disabled={sending || testing || approving || !lastTestId} className="border-[color:var(--emerald-1)]/30/50 text-[color:var(--emerald-1)] bg-white" title={!lastTestId ? "Send a test first" : "Lock as default"}>
                  {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Lock className="w-3.5 h-3.5 mr-1.5" />}
                  Approve & Lock
                </Button>
              </div>
            </div>
          </div>

          {/* Filing details — persisted to the envelope so Contract Vault
              filters this signed contract under the correct developer /
              type / location automatically. */}
          <div className="rounded-xl border border-[#B89555]/30 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">File this contract under</Label>
              <span className="text-[10px] text-[#1A1A1A]/50">Saved when you send</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-[#1A1A1A]/70">Developer</Label>
                <Input
                  value={developerNameInput}
                  onChange={async (e) => {
                    const term = e.target.value;
                    setDeveloperNameInput(term);
                    setDeveloperId(null);
                    if (term.length < 2) { setDevOptions([]); return; }
                    const { data } = await supabase
                      .from("developers")
                      .select("id, name")
                      .ilike("name", `%${term}%`)
                      .limit(8);
                    setDevOptions(data ?? []);
                  }}
                  placeholder="Search developer…"
                  className="mt-1"
                />
                {devOptions.length > 0 && (
                  <div className="border border-[#B89555]/20 rounded-md bg-[#FDFBF7] max-h-40 overflow-auto mt-1">
                    {devOptions.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        data-developer-option
                        onClick={() => { setDeveloperId(d.id); setDeveloperNameInput(d.name); setDevOptions([]); }}
                        className="flex w-full items-start text-left px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#F7F2EA] overflow-visible"
                      >
                        <span data-developer-name className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">{d.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {developerId && (
                  <p className="text-[10px] text-[color:var(--emerald-1)] mt-1">Linked to canonical developer</p>
                )}
              </div>
              <div>
                <Label className="text-[11px] text-[#1A1A1A]/70">Contract type</Label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm text-[#1A1A1A]"
                >
                  <option value="">— Select —</option>
                  <option>Developer Registration</option>
                  <option>Developer ↔ Agency (A2A)</option>
                  <option>Client Sales (SPA)</option>
                  <option>Client Reservation / Booking</option>
                  <option>Leasing / Ejari</option>
                  <option>Property Advertising</option>
                  <option>NDA</option>
                  <option>Service / Consulting</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <Label className="text-[11px] text-[#1A1A1A]/70">Emirate</Label>
                <select
                  value={emirate}
                  onChange={(e) => setEmirate(e.target.value)}
                  className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm text-[#1A1A1A]"
                >
                  <option value="">— Select —</option>
                  {["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Umm Al Quwain","Fujairah"].map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[11px] text-[#1A1A1A]/70">Area / Community</Label>
                <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Dubai Marina" className="mt-1" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">Subject (editable)</Label>
              <button onClick={() => setSubject(DEFAULT_SUBJECT)} className="text-[11px] text-[#1A1A1A]/60 hover:text-[#1A1A1A] flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1.5" />
            <div className="text-[11px] text-[#1A1A1A]/60 mt-1">Preview: <span className="text-[#1A1A1A]">{previewSubject}</span></div>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">Message body (editable)</Label>
              <button onClick={() => setBody(DEFAULT_BODY)} className="text-[11px] text-[#1A1A1A]/60 hover:text-[#1A1A1A] flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Reset to JBJ default
              </button>
            </div>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={9} className="mt-1.5 font-mono text-sm" />
            <div className="flex flex-wrap gap-1 mt-2">
              {MERGE_TAGS.map((m) => (
                <button key={m.tag} onClick={() => setBody((b) => b + " " + m.tag)}
                  className="px-2 py-1 text-[11px] rounded-md bg-[#F7F2EA] border border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]"
                  title={m.help}>{m.tag}</button>
              ))}
            </div>
          </div>

          {/* DocuSign envelope URL (optional — empty falls back to DocuSign web entry) */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">
              DocuSign envelope URL <span className="opacity-60 normal-case font-normal">(optional)</span>
            </Label>
            <Input
              value={docusignUrl}
              onChange={(e) => setDocusignUrl(e.target.value)}
              placeholder="https://apps.docusign.com/…"
              className="mt-1.5 font-mono text-[12px]"
              type="url"
            />
            <div className="text-[11px] text-[#1A1A1A]/60 mt-1">
              Paste it to deep-link the <strong>OPEN IN DOCUSIGN</strong> button straight to the envelope. Leave empty for the universal DocuSign entry.
            </div>
          </div>

          {/* Live preview — byte-for-byte the email the recipient receives */}
          <div className="rounded-xl border border-[#B89555]/30 bg-white overflow-hidden">
            <div className="px-4 pt-3 pb-2 text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 border-b border-[#B89555]/20">
              Live preview · what the recipient will see (incl. OPEN IN DOCUSIGN button)
            </div>
            <div className="h-[640px]">
              <EmailPreviewIframe
                subject={previewSubject}
                bodyHtml={previewBodyHtml}
                docNumber={docNumber}
                docusignUrl={docusignUrl}
                attachmentName={`${docTitle}.pdf`}
                className="w-full h-full bg-[#FDFBF7]"
              />
            </div>
            <div className="px-4 py-3 border-t border-[#B89555]/20">
              <button onClick={() => { navigator.clipboard.writeText(tokens.signing_link); toast.success("Link copied"); }}
                className="text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A] flex items-center gap-1.5">
                <Copy className="w-3 h-3" /> {tokens.signing_link}
              </button>
            </div>
          </div>

        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[11px] text-[#1A1A1A]/70">
            {lockedAt ? (
              <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-[color:var(--emerald-1)]" /> Locked default · approved {new Date(lockedAt).toLocaleDateString()}</span>
            ) : lastTestId ? (
              <span className="inline-flex items-center gap-1"><FlaskConical className="w-3.5 h-3.5" /> Test sent — review your inbox, then Approve & Lock</span>
            ) : (
              <span className="inline-flex items-center gap-1"><FlaskConical className="w-3.5 h-3.5" /> Send a test to infoo.jane@gmail.com first</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending || testing || approving}>Cancel</Button>
            <Button variant="outline" onClick={handleSendTest} disabled={sending || testing || approving} className="border-[#B89555]/50">
              {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FlaskConical className="w-4 h-4 mr-2" />}
              Send Test to Me
            </Button>
            <Button variant="outline" onClick={handleApproveLock} disabled={sending || testing || approving || !lastTestId} className="border-[color:var(--emerald-1)]/30/50 text-[color:var(--emerald-1)]" title={!lastTestId ? "Send a test first" : "Lock this template as your default"}>
              {approving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Approve & Lock
            </Button>
            <Button variant="gold" onClick={handleSend} disabled={sending || testing || approving}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send for Signature
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SendForSignatureDialog;
