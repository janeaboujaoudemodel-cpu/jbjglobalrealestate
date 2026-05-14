/**
 * SendViaEmailDialog — preview-first, multi-recipient composer for the
 * "Send by email" action on /e-signature/:id. The right pane shows the
 * REAL branded email (header, JBJ monogram, body, footer) byte-for-byte
 * what the recipient receives. Editing the subject/body re-renders live.
 *
 *   • Multi-recipient To + CC chips
 *   • JBJ logo + clickable contact details in header & footer
 *   • No internal "review & sign" link — DocuSign handles signing
 *   • Responsive two-pane layout (single column under lg)
 *   • Wrapping footer that never overflows the dialog
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Send, FileText, Eye, PenLine, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL, PUBLIC_DOMAIN } from "@/config/backend";
import { EmailRecipientChips, isValidEmail } from "./EmailRecipientChips";
import { EmailBodyEditor } from "./EmailBodyEditor";
import { EmailPreviewIframe } from "./EmailPreviewIframe";
import { EmailAttachmentsPicker, type EmailAttachment } from "./EmailAttachmentsPicker";
import { buildSenderSignatureHtml, escapeHtml } from "@/lib/email/buildEnvelopeEmailHtml";
import { useEmailSignatures, renderSignatureHtml, type EmailSignature } from "@/hooks/useEmailSignatures";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";

const TEST_RECIPIENT = "infoo.jane@gmail.com";
const DEFAULT_CC = "infoo.jane@gmail.com";
const DISPLAY_FROM = "JBJ Global Real Estate <noreply@jbj.ae>";
const DISPLAY_REPLY_TO = "contact@jbj.ae";

/** Canonical short body the owner approved. Used when the saved template is
 *  empty or matches a known legacy preset that we want to retire. */
const NEW_DEFAULT_BODY_HTML =
  `<p>Dear {{client_name}},</p>` +
  `<p>Please find the attached PDF document for your review.</p>` +
  `<p>Once reviewed, kindly proceed with signing the document via DocuSign at your earliest convenience and return the signed copy by replying to this email.</p>` +
  `<p>Should you require any clarification, please do not hesitate to contact me.</p>` +
  `<p>Thank you,</p>`;

/** Phrases from the old template that must be scrubbed when hydrating from
 *  any saved body (DB template default OR envelope.email_message). They are
 *  matched case-insensitively, with flexible whitespace, against the
 *  PLAIN-TEXT projection of the body — and the matching paragraphs are
 *  stripped from the HTML. */
const LEGACY_BODY_FRAGMENTS: RegExp[] = [
  /attached is your[\s\S]*?prepared by jbj global real estate\.?/i,
  /kindly review and digitally sign[\s\S]*?secure link below[\s\S]*?\./i,
  /once signed,?\s*a fully executed copy will be returned to you automatically\.?/i,
  /also available via the secure download button below\.?/i,
  /thank you for your continued trust\.?/i,
  /please find attached the signed pdf\.?/i,
  /signature pending[^<\n]*/i,
  /please find the pdf attached to this email[\s\S]*?signed copy attached\.?/i,
];

function normalizeSubject(value: string, fallbackDoc = "Document") {
  const raw = String(value || "").trim();
  const cleaned = raw
    .replace(/^please sign\s*[:—-]?\s*/i, "")
    .replace(/^signature pending\s*[:.·—-]+\s*/i, "")
    .replace(/^signature required\s*[:.·—-]+\s*/i, "")
    .replace(/^signature required\s*:\s*/i, "");
  return `Signature Required: ${cleaned || fallbackDoc}`;
}

const dedupeEmails = (emails: string[]) =>
  Array.from(new Set(emails.map((e) => e.trim().toLowerCase()).filter(isValidEmail)));

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  envelopeId: string;
  recipientName: string;
  recipientEmail: string;
  defaultSubject: string;
  defaultBody: string;          // legacy plain-text default; converted to HTML on first open
  attachmentName?: string;
  attachmentUrl?: string;
  templateKey?: string | null;
  docNumber?: string;
  senderName?: string;
  senderTitle?: string;
  /** Called immediately before each send so the parent can persist edits and
   *  regenerate the PDF. Must resolve to the freshest { url, filename } pair —
   *  this is what gets attached to the email. */
  onBeforeSend?: () => Promise<{ url?: string | null; filename?: string | null } | void>;
  onSent?: () => void;
}

/** Convert legacy plain-text default body (with `{{client_name}}` etc.) into
 *  clean WYSIWYG HTML. Signatures are NEVER embedded in the body — they live
 *  in a separate state slot and are rendered after the CTA stack. */
function legacyBodyToHtml(
  raw: string,
  ctx: { clientName: string; docTitle: string; senderName: string; senderTitle: string },
): string {
  const tokens: Record<string, string> = {
    client_name: ctx.clientName,
    landlord_name: ctx.clientName,
    doc_title: ctx.docTitle,
    owner_name: ctx.senderName,
    sender_title: ctx.senderTitle,
  };
  const interpolated = String(raw || "")
    // Drop any signature tokens / signing link tokens — signature is rendered
    // separately and the signing link belongs in the DocuSign CTA, not body.
    .replace(/\{\{sender_signature\}\}/g, "")
    .replace(/\{\{signing_link\}\}/g, "")
    .replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k] ?? "");
  // If the saved body already contains HTML tags (legacy stored as `<br/>`),
  // do NOT re-escape it — that would render as literal "&lt;br/&gt;" code in
  // the editor and the delivered email. Treat as already-HTML and just trim
  // trailing breaks. Plain text is escaped + newline→<br/> as before.
  const looksLikeHtml = /<[a-z][\s\S]*?>/i.test(interpolated);
  const html = looksLikeHtml
    ? interpolated
    : escapeHtml(interpolated).replace(/\n/g, "<br/>");
  return html.replace(/(<br\s*\/?>\s*)+$/g, "");
}

/** Aggressively strip ANY embedded signature artifact from a body HTML
 *  string — wrapped div, raw signature table, or legacy hard-typed lines. */
function stripSignature(html: string): string {
  return String(html || "")
    .replace(/<div[^>]*data-jbj-sig(?:-final)?="1"[\s\S]*?<\/div>\s*/gi, "")
    .replace(/<table[^>]*data-jbj-sig(?:-table)?="1"[\s\S]*?<\/table>\s*/gi, "")
    .replace(/(<br\s*\/?>\s*){2,}$/g, "");
}

/** Strip any LEGACY hard-typed signature block at the tail of a saved
 *  envelope.email_message — these were authored before the picker existed and
 *  contain raw text like "Founder & CEO\nJBJ GLOBAL REAL ESTATE\nOffice…
 *  www.jbj.ae". Without this, the picker preset gets stacked on top of the
 *  legacy text and the preview shows two signatures. Operates on plain text
 *  (pre-HTML conversion) and is intentionally aggressive about the tail. */
function stripInlineSignature(text: string): string {
  let out = String(text || "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  // Anchors that mark the start of a typed sig block. Anything from the FIRST
  // matching anchor through end-of-string is removed (closing greeting lines
  // like "Best," or "Kind regards," remain).
  const anchors = [
    /\n\s*Founder\s*&\s*CEO\b[\s\S]*$/i,
    /\n\s*Office of the Founder\b[\s\S]*$/i,
    /\n\s*JBJ HR Team\b[\s\S]*$/i,
    /\n\s*Human Resources(?:\s*&\s*Talent)?\b[\s\S]*$/i,
    /\n\s*Front Desk\b[\s\S]*$/i,
    /\n\s*Executive Office\b[\s\S]*$/i,
    /\n\s*JBJ GLOBAL REAL ESTATE\b[\s\S]*$/i,
  ];
  for (const re of anchors) out = out.replace(re, "");
  return out.replace(/\s+$/g, "");
}

/** Walk the HTML's block elements and drop any whose plain-text content
 *  matches a legacy fragment. If everything ends up empty, return the canonical
 *  NEW_DEFAULT_BODY_HTML so the editor never starts blank. */
function scrubLegacyBody(html: string): string {
  if (!html) return NEW_DEFAULT_BODY_HTML;
  let out = html;
  for (const re of LEGACY_BODY_FRAGMENTS) {
    // Strip matching text wherever it appears (inside <p>, raw, etc.).
    out = out.replace(re, "");
  }
  // Remove now-empty paragraph/div wrappers left behind.
  out = out
    .replace(/<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/<div[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/div>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br/><br/>")
    .trim();
  const plain = out.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  if (!plain) return NEW_DEFAULT_BODY_HTML;
  return out;
}

export function SendViaEmailDialog({
  open,
  onOpenChange,
  envelopeId,
  recipientName,
  recipientEmail,
  defaultSubject,
  defaultBody,
  attachmentName,
  attachmentUrl,
  templateKey,
  docNumber,
  senderName = "Jane Bou Jaoude",
  senderTitle = "Founder & CEO",
  onBeforeSend,
  onSent,
}: Props) {
  const [tos, setTos] = useState<string[]>([]);
  const [ccs, setCcs] = useState<string[]>([DEFAULT_CC]);
  const [subject, setSubject] = useState(normalizeSubject(defaultSubject, attachmentName || "Document"));
  const [bodyHtml, setBodyHtml] = useState("");
  const [docusignUrl, setDocusignUrl] = useState("");
  const [busy, setBusy] = useState<"" | "test" | "send">("");
  const [savingField, setSavingField] = useState<"" | "recipients" | "subject" | "signature" | "body">("");
  const [selectedSigId, setSelectedSigId] = useState<string>("");
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [extraAttachments, setExtraAttachments] = useState<EmailAttachment[]>([]);
  const [autoAttachmentRemoved, setAutoAttachmentRemoved] = useState(false);
  const draftKey = `jbj_esign_email_draft_${envelopeId || "__new__"}`;

  // Load all email signature presets so the owner can pick which one
  // appears at the bottom of the body. Signature is rendered SEPARATELY
  // from the body — never embedded — so only one is ever displayed.
  const { data: signatures = [] } = useEmailSignatures();
  const fallbackSigHtml = useMemo(
    () => buildSenderSignatureHtml(senderName, senderTitle),
    [senderName, senderTitle],
  );
  const selectedSig: EmailSignature | undefined = useMemo(
    () => signatures.find((s) => s.id === selectedSigId),
    [signatures, selectedSigId],
  );
  const selectedSigHtml = useMemo(
    () => (selectedSig ? renderSignatureHtml(selectedSig) : fallbackSigHtml),
    [selectedSig, fallbackSigHtml],
  );

  useEffect(() => {
    if (selectedSigId || !signatures.length) return;
    // E-signature client emails always default to JBJ Executive Office —
    // Founder/CEO is reserved for personal correspondence.
    const exec =
      signatures.find((s) => /executive\s*office/i.test(s.name || "")) ||
      signatures.find((s) => /executive\s*office/i.test(s.role_label || ""));
    const def = exec || signatures.find((s) => s.is_default) || signatures[0];
    setSelectedSigId(def?.id || "");
  }, [signatures, selectedSigId]);

  // Hydrate ONCE per open transition. Without this gate the parent's prop
  // identity changes (each render produces fresh `defaultBody`/`attachmentName`
  // strings) re-fired this effect on every keystroke and overwrote the body
  // mid-typing — making the Message field appear unresponsive.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      hydratedRef.current = false;
      return;
    }
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    setTos(recipientEmail ? [recipientEmail] : []);
    setCcs([DEFAULT_CC]);
    setSubject(normalizeSubject(defaultSubject, attachmentName || "Document"));
    setDocusignUrl("");
    setExtraAttachments([]);
    setAutoAttachmentRemoved(false);
    setBodyHtml(
      scrubLegacyBody(
        stripSignature(
          legacyBodyToHtml(stripInlineSignature(defaultBody), {
            clientName: recipientName || "Client",
            docTitle: defaultSubject || "Document",
            senderName,
            senderTitle,
          }),
        ),
      ),
    );
    (async () => {
      const { data } = await (supabase as any)
        .from("esign_email_template_defaults")
        .select("subject, body_html, signature_preset_id, default_to_emails, default_cc_emails")
        .eq("template_key", templateKey || "__global__")
        .maybeSingle();
      if (!data || !open) return;
      if (data.subject) setSubject(normalizeSubject(data.subject, attachmentName || "Document"));
      if (data.body_html) setBodyHtml(scrubLegacyBody(stripSignature(data.body_html)));
      if (data.signature_preset_id) setSelectedSigId(data.signature_preset_id);
      if (Array.isArray(data.default_to_emails) && data.default_to_emails.length) setTos(dedupeEmails(data.default_to_emails));
      if (Array.isArray(data.default_cc_emails)) setCcs(data.default_cc_emails.length ? dedupeEmails(data.default_cc_emails) : [DEFAULT_CC]);
      // After loading the saved template, restore any newer in-progress draft
      // so the owner never loses keystrokes between dialog opens / refreshes.
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const draft = JSON.parse(raw) as { subject?: string; bodyHtml?: string; ts?: number };
          if (draft && (draft.subject || draft.bodyHtml)) {
            if (draft.subject) setSubject(draft.subject);
            if (draft.bodyHtml != null) setBodyHtml(scrubLegacyBody(stripSignature(draft.bodyHtml)));
            if (draft.ts) setDraftSavedAt(draft.ts);
          }
        }
      } catch { /* ignore corrupt draft */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-save subject + body on every keystroke (debounced) to localStorage,
  // scoped per envelope. Cleared on successful send or explicit discard.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      try {
        const hasContent = subject.trim().length > 0 || bodyHtml.replace(/<[^>]+>/g, "").trim().length > 0;
        if (!hasContent) return;
        const ts = Date.now();
        localStorage.setItem(draftKey, JSON.stringify({ subject, bodyHtml, ts }));
        setDraftSavedAt(ts);
      } catch { /* quota / disabled storage — ignore */ }
    }, 400);
    return () => clearTimeout(t);
  }, [open, subject, bodyHtml, draftKey]);

  const clearDraft = () => {
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    setDraftSavedAt(null);
  };

  // Defensive cleanup — if any embedded signature slips into the body,
  // strip it. Real signature is rendered by the email template separately.
  const applySelectedSignature = () => {
    setBodyHtml((prev) => stripSignature(prev));
  };

  const cleanCcs = useMemo(
    () => {
      const cleanTos = dedupeEmails(tos);
      return dedupeEmails(ccs).filter((c) => !cleanTos.includes(c));
    },
    [ccs, tos],
  );

  const canSend = tos.length > 0 && tos.every(isValidEmail) && subject.trim().length > 0;

  // Resolve the envelope's stored document URL into a DIRECT signed URL to
  // the raw PDF bytes. The backend fetches this URL and base64-encodes it
  // for Resend's `attachments` array — so it MUST point at the actual PDF,
  // not at the branded /d landing page (which returns HTML and would be
  // delivered as a broken .pdf that Gmail renders as a blank preview).
  const resolveAttachmentUrl = async (rawUrl?: string): Promise<string | undefined> => {
    if (!rawUrl) return undefined;
    const m = rawUrl.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/?]+)\/([^?]+)/);
    if (m) {
      const bucket = m[1];
      let path = m[2];
      try { path = decodeURIComponent(path); } catch { /* keep raw */ }
      try {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7);
        if (!error && data?.signedUrl) return data.signedUrl;
      } catch { /* fall through */ }
    }
    return rawUrl;
  };

  /** Always pull the freshest envelope row right before sending so the
   *  attachment URL/filename reflect the most recent regenerate — never the
   *  stale value the dialog opened with. */
  const fetchLatestAttachment = async (): Promise<{ url?: string; name?: string }> => {
    try {
      const { data } = await supabase
        .from("esign_envelopes")
        .select("document_url, document_filename")
        .eq("id", envelopeId)
        .maybeSingle();
      if (data?.document_url) {
        return { url: data.document_url as string, name: (data.document_filename as string) || attachmentName };
      }
    } catch { /* fall through */ }
    return { url: attachmentUrl, name: attachmentName };
  };

  /** Combined sync step: parent regenerates if dirty, then we re-pull the
   *  envelope so the attached PDF matches what is on screen byte-for-byte. */
  const resolveFreshAttachment = async (): Promise<{ url?: string; name?: string }> => {
    try {
      const fromParent = onBeforeSend ? await onBeforeSend() : undefined;
      if (fromParent && (fromParent as any).url) {
        const v = fromParent as { url?: string; filename?: string };
        return { url: v.url || undefined, name: v.filename || attachmentName };
      }
    } catch (e) {
      console.warn("onBeforeSend failed; using DB attachment", e);
    }
    return await fetchLatestAttachment();
  };

  const sendTest = async () => {
    setBusy("test");
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const fresh = autoAttachmentRemoved ? { url: undefined, name: undefined } : await resolveFreshAttachment();
      const signedAttachmentUrl = fresh.url ? await resolveAttachmentUrl(fresh.url) : undefined;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/esign-send-test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          envelope_id: envelopeId,
          interpolated_subject: subject,
          interpolated_body_html: bodyHtml,
          signature_html: selectedSigHtml,
          docusign_url: docusignUrl.trim() || undefined,
          attachment_name: fresh.name,
          attachment_url: signedAttachmentUrl,
          extra_attachments: extraAttachments.map((a) => ({ name: a.name, url: a.url, content_type: a.contentType })),
          test_recipient: TEST_RECIPIENT,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Failed to send test");
      toast.success(`Test sent to ${TEST_RECIPIENT}${fresh.name ? ` · ${fresh.name}` : ""}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to send test");
    } finally {
      setBusy("");
    }
  };

  const approveAndSend = async () => {
    if (!canSend) {
      toast.error("Add at least one valid recipient and a subject.");
      return;
    }
    setBusy("send");
    const sendingToast = toast.loading(`Syncing latest document & sending to ${tos.length} recipient${tos.length > 1 ? "s" : ""}…`);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const fresh = autoAttachmentRemoved ? { url: undefined, name: undefined } : await resolveFreshAttachment();
      const signedAttachmentUrl = fresh.url ? await resolveAttachmentUrl(fresh.url) : undefined;
      clearDraft();
      onOpenChange(false);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/esign-send-for-signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          envelope_id: envelopeId,
          channels: ["email"],
          additional_recipients: tos,
          cc_emails: cleanCcs,
          interpolated_subject: subject,
          interpolated_body_html: bodyHtml,
          signature_html: selectedSigHtml,
          docusign_url: docusignUrl.trim() || undefined,
          attachment_name: fresh.name,
          attachment_url: signedAttachmentUrl,
          extra_attachments: extraAttachments.map((a) => ({ name: a.name, url: a.url, content_type: a.contentType })),
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Failed to send");
      const failed = Array.isArray(out.failures) ? out.failures.length : 0;
      toast.dismiss(sendingToast);
      if (failed) {
        toast.warning(`${out.message} — ${failed} failed`, { description: out.failures.map((f: any) => `${f.email}: ${f.error}`).join("\n") });
      } else {
        toast.success(`Sent to ${tos.length} recipient${tos.length > 1 ? "s" : ""}${cleanCcs.length ? ` · CC ${cleanCcs.length}` : ""} · attached ${fresh.name || "document"}`);
      }
      onSent?.();
    } catch (e: any) {
      toast.dismiss(sendingToast);
      toast.error(e.message || "Failed to send");
    } finally {
      setBusy("");
    }
  };

  // Persist current subject + body as the envelope's standard template so
  // future opens of the dialog start from this version. Does NOT send.
  const saveAsTemplate = async () => {
    setBusy("send");
    try {
      const { error } = await supabase
        .from("esign_envelopes")
        .update({ email_subject: subject, email_message: bodyHtml })
        .eq("id", envelopeId);
      if (error) throw error;
      toast.success("Saved as the standard template for future emails");
    } catch (e: any) {
      toast.error(e.message || "Failed to save template");
    } finally {
      setBusy("");
    }
  };

  const saveTemplateField = async (field: "recipients" | "subject" | "signature" | "body") => {
    setSavingField(field);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { data: existing } = await (supabase as any)
        .from("esign_email_template_defaults")
        .select("subject, body, body_html, signature_preset_id, default_to_emails, default_cc_emails")
        .eq("user_id", user.id)
        .eq("template_key", templateKey || "__global__")
        .maybeSingle();
      const nextBody = bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || " ";
      const payload: Record<string, any> = {
        user_id: user.id,
        template_key: templateKey || "__global__",
        subject: field === "subject" ? normalizeSubject(subject, attachmentName || "Document") : (existing?.subject || normalizeSubject(defaultSubject, attachmentName || "Document")),
        body: field === "body" ? nextBody : (existing?.body || nextBody),
        body_html: field === "body" ? stripSignature(bodyHtml) : (existing?.body_html || stripSignature(bodyHtml)),
        signature_preset_id: field === "signature" ? (selectedSigId || null) : (existing?.signature_preset_id || null),
        default_to_emails: field === "recipients" ? dedupeEmails(tos) : (existing?.default_to_emails || []),
        default_cc_emails: field === "recipients" ? cleanCcs : (existing?.default_cc_emails || [DEFAULT_CC]),
        approved_at: new Date().toISOString(),
      };
      const { error } = await (supabase as any)
        .from("esign_email_template_defaults")
        .upsert(payload, { onConflict: "user_id,template_key" });
      if (error) throw error;
      if (field === "subject") setSubject(payload.subject);
      toast.success(`${field === "recipients" ? "Recipients" : field === "subject" ? "Subject" : field === "signature" ? "Signature" : "Message"} saved for future PAA emails`);
    } catch (e: any) {
      toast.error(e.message || "Failed to save standard template");
    } finally {
      setSavingField("");
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[1200px] w-[min(96vw,1200px)] sm:!max-w-[1200px] max-h-[92vh] overflow-y-auto p-0 bg-[#FDFBF7] border-[#B89555]/40"
      >
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#B89555]/30">
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A] text-base">
            <Mail className="w-5 h-5" />
            Preview &amp; send by email
          </DialogTitle>
          <DialogDescription className="text-xs text-[#1A1A1A]/60 mt-1">
            What you see in the preview is byte-for-byte the branded email the recipient receives — including the OPEN IN DOCUSIGN button and App Store / Google Play fallback.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-0">
          {/* Compose pane */}
          <div className="p-5 space-y-4 border-b md:border-b-0 md:border-r border-[#B89555]/30">
            {/* Headers strip */}
            <div className="rounded-md border border-[#B89555]/30 bg-[#F7F2EA] p-2.5 text-[11px] text-[#1A1A1A] space-y-1">
              <div className="flex flex-wrap gap-x-2"><span className="opacity-60">From:</span><strong className="break-all">{DISPLAY_FROM}</strong></div>
              <div className="flex flex-wrap gap-x-2"><span className="opacity-60">Reply-To:</span><strong className="break-all">{DISPLAY_REPLY_TO}</strong></div>
              <div className="flex flex-wrap gap-x-2"><span className="opacity-60">Provider:</span>Resend</div>
              {attachmentName && !autoAttachmentRemoved && (
                <div className="flex items-center gap-1.5 pt-1">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="opacity-60">Auto-attached:</span>
                  <strong className="truncate flex-1">{attachmentName}</strong>
                  {attachmentUrl && (
                    <a
                      href={maybeProxyStorageUrl(attachmentUrl, { filename: attachmentName, disposition: 'inline' })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-1.5 py-0.5 rounded hover:bg-[#EFE6D6] text-[#1A1A1A]/70"
                      title="Preview attached PDF"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setAutoAttachmentRemoved(true)}
                    className="shrink-0 text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 hover:text-[#1A1A1A] underline decoration-[#B89555]/60 underline-offset-2"
                    title="Remove the auto-attached signed PDF from this send"
                  >
                    Remove
                  </button>
                </div>
              )}
              {attachmentName && autoAttachmentRemoved && (
                <div className="flex items-center gap-1.5 pt-1">
                  <FileText className="w-3.5 h-3.5 shrink-0 opacity-40" />
                  <span className="opacity-60 line-through">{attachmentName}</span>
                  <button
                    type="button"
                    onClick={() => setAutoAttachmentRemoved(false)}
                    className="ml-auto text-[10px] uppercase tracking-wider text-[#B89555] hover:text-[#1A1A1A]"
                  >
                    Restore
                  </button>
                </div>
              )}
            </div>

            {/* To */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[#1A1A1A] text-xs">To · {tos.length || "no"} recipient{tos.length === 1 ? "" : "s"}</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => saveTemplateField("recipients")} disabled={!!savingField} className="h-7 px-2 text-[11px] border-[#B89555]/50 hover:bg-[#EFE6D6]">
                  {savingField === "recipients" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Save
                </Button>
              </div>
              <EmailRecipientChips
                value={tos}
                onChange={setTos}
                placeholder="omar@example.com, sara@example.com…"
                ariaLabel="Recipient emails"
              />
              {recipientName && (
                <p className="text-[10px] text-[#1A1A1A]/60">Primary contact on record: {recipientName}</p>
              )}
            </div>

            {/* CC */}
            <div className="space-y-1.5">
              <Label className="text-[#1A1A1A] text-xs">CC · {cleanCcs.length}</Label>
              <EmailRecipientChips
                value={ccs}
                onChange={setCcs}
                placeholder="add CC…"
                ariaLabel="CC emails"
              />
              <p className="text-[10px] text-[#1A1A1A]/60">Default CC is your test inbox — remove the chip if you don't want it.</p>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[#1A1A1A] text-xs">Subject</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => saveTemplateField("subject")} disabled={!!savingField || !subject.trim()} className="h-7 px-2 text-[11px] border-[#B89555]/50 hover:bg-[#EFE6D6]">
                  {savingField === "subject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Save
                </Button>
              </div>
              <Input value={subject} onChange={(e) => setSubject(normalizeSubject(e.target.value, attachmentName || "Document"))} className="bg-white" />
            </div>

            {/* Signature picker — Radix Select with champagne/gold styling, no native blue */}
            <div className="space-y-1.5">
              <Label className="text-[#1A1A1A] text-xs flex items-center gap-1.5">
                <PenLine className="w-3.5 h-3.5" /> Signature · {signatures.length} available
              </Label>
              <div className="flex gap-2">
                <Select
                  value={selectedSigId || undefined}
                  onValueChange={(v) => setSelectedSigId(v)}
                >
                  <SelectTrigger
                    aria-label="Select email signature"
                      className="flex-1 bg-white border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#F7F2EA] hover:border-[#B89555]/70 focus:ring-[#B89555]/30 focus:ring-offset-0 data-[state=open]:bg-[#F7F2EA] data-[state=open]:border-[#B89555]"
                  >
                    <SelectValue placeholder={signatures.length ? "Pick a signature…" : "Loading signatures…"} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">
                    {signatures.map((s) => (
                      <SelectItem
                        key={s.id}
                        value={s.id}
                        className="text-[#1A1A1A] hover:!bg-[#EFE6D6] focus:!bg-[#EFE6D6] focus:text-[#1A1A1A] data-[state=checked]:!bg-[#EFE6D6] data-[highlighted]:!bg-[#EFE6D6] data-[highlighted]:text-[#1A1A1A]"
                      >
                        {s.name}{s.is_default ? " · default" : ""}{s.is_system ? " · system" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => saveTemplateField("signature")}
                  disabled={!selectedSigHtml}
                  title="Save this signature as the standard for future PAA emails"
                  className="border-[#B89555]/50 hover:bg-[#EFE6D6] hover:border-[#B89555]"
                >
                  {savingField === "signature" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Save
                </Button>
              </div>
              <p className="text-[10px] text-[#1A1A1A]/60">
                Pick which signature appears at the bottom of the body — the preview updates instantly.
              </p>
            </div>

            {/* DocuSign URL (optional) */}
            <div className="space-y-1.5">
              <Label className="text-[#1A1A1A] text-xs">
                DocuSign envelope URL <span className="opacity-60 font-normal">(optional)</span>
              </Label>
              <Input
                value={docusignUrl}
                onChange={(e) => setDocusignUrl(e.target.value)}
                placeholder="https://apps.docusign.com/…"
                className="bg-white font-mono text-[12px]"
                type="url"
              />
              <p className="text-[10px] text-[#1A1A1A]/60">
                Empty is fine — the <strong>OPEN IN DOCUSIGN</strong> button always appears and opens the universal DocuSign entry. Paste a specific envelope URL to deep-link directly.
              </p>
            </div>

            {/* Extra attachments */}
            <EmailAttachmentsPicker
              value={extraAttachments}
              onChange={setExtraAttachments}
              disabled={!!busy}
            />

            {/* Body (rich) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[#1A1A1A] text-xs">Message</Label>
                {draftSavedAt && (
                  <span className="text-[10px] text-[#1A1A1A]/50 flex items-center gap-1.5">
                    Draft saved · {new Date(draftSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    <button
                      type="button"
                      onClick={clearDraft}
                      className="underline decoration-[#B89555]/60 underline-offset-2 hover:text-[#1A1A1A]"
                    >
                      Discard
                    </button>
                  </span>
                )}
              </div>
              <EmailBodyEditor
                value={bodyHtml}
                onChange={setBodyHtml}
                placeholder="Write your cover note…"
              />
            </div>
          </div>

          {/* Live preview pane */}
          <div className="bg-[#F7F2EA]/40 p-3 md:p-5 flex flex-col min-h-[520px] min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-[11px] text-[#1A1A1A]/70">
                <Eye className="w-3.5 h-3.5" /> Live preview — exact recipient view
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/50">includes DocuSign CTA</span>
            </div>
            <div className="flex-1 min-h-[520px] md:min-h-[640px] rounded-md border border-[#B89555]/40 overflow-hidden bg-white">
              <EmailPreviewIframe
                subject={subject}
                bodyHtml={bodyHtml}
                signatureHtml={selectedSigHtml}
                docNumber={docNumber}
                docusignUrl={docusignUrl}
                attachmentName={autoAttachmentRemoved ? undefined : attachmentName}
                attachmentUrl={autoAttachmentRemoved ? undefined : attachmentUrl}
                className="w-full h-full bg-[#FDFBF7]"
              />
            </div>

            {/* Attachments the recipient will receive — clickable so the owner
                can open and verify the EXACT file before pressing send. */}
            <div className="mt-3 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]">
                  Attachments the client will receive · {(!autoAttachmentRemoved && attachmentName ? 1 : 0) + extraAttachments.length}
                </div>
                <span className="text-[10px] text-[#1A1A1A]/60">Click to preview each file</span>
              </div>
              <ul className="space-y-1.5">
                {!autoAttachmentRemoved && attachmentName && (
                  <li className="flex items-center gap-2 text-xs text-[#1A1A1A] bg-white border border-[#B89555]/30 rounded px-2 py-1.5">
                    <FileText className="w-3.5 h-3.5 shrink-0 text-[#B89555]" />
                    <span className="truncate flex-1">
                      <strong>{attachmentName}</strong>
                      <span className="ml-1.5 text-[10px] uppercase tracking-wider text-[#1A1A1A]/60">Standard PAA · auto-synced to latest</span>
                    </span>
                    {attachmentUrl && (
                      <a
                        href={maybeProxyStorageUrl(attachmentUrl, { filename: attachmentName, disposition: 'inline' })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-1.5 py-0.5 rounded hover:bg-[#EFE6D6] text-[#1A1A1A]/70 inline-flex items-center gap-1"
                        title="Preview the standard PAA PDF"
                      >
                        <Eye className="w-3.5 h-3.5" /> Open
                      </a>
                    )}
                  </li>
                )}
                {extraAttachments.map((a, i) => (
                  <li key={`${a.name}-${i}`} className="flex items-center gap-2 text-xs text-[#1A1A1A] bg-white border border-[#B89555]/30 rounded px-2 py-1.5">
                    <FileText className="w-3.5 h-3.5 shrink-0 text-[#1A1A1A]/60" />
                    <span className="truncate flex-1">{a.name}<span className="ml-1.5 text-[10px] uppercase tracking-wider text-[#1A1A1A]/60">Uploaded</span></span>
                    {a.url && (
                      <a
                        href={maybeProxyStorageUrl(a.url, { filename: a.name, disposition: 'inline' })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-1.5 py-0.5 rounded hover:bg-[#EFE6D6] text-[#1A1A1A]/70 inline-flex items-center gap-1"
                        title={`Preview ${a.name}`}
                      >
                        <Eye className="w-3.5 h-3.5" /> Open
                      </a>
                    )}
                  </li>
                ))}
                {autoAttachmentRemoved && extraAttachments.length === 0 && (
                  <li className="text-[11px] text-[#1A1A1A]/60 italic">
                    No attachments — recipient will get the email body only. Restore the standard PDF above or upload a file.
                  </li>
                )}
              </ul>
              <p className="text-[10px] text-[#1A1A1A]/55 mt-2">
                The standard PAA file is regenerated from the latest document state right before each send so the client always receives the up-to-date copy.
              </p>
            </div>
          </div>
        </div>

        {/* Footer — wraps; never overflows */}
        <div className="border-t border-[#B89555]/30 px-5 py-3 bg-[#FDFBF7] flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={!!busy}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={sendTest}
            disabled={!!busy}
            className="w-full sm:w-auto"
            title={`Sends a copy to ${TEST_RECIPIENT}`}
          >
            {busy === "test" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            Send test
          </Button>
          <Button
            variant="outline"
            onClick={saveAsTemplate}
            disabled={!!busy || !subject.trim()}
            className="w-full sm:w-auto border-[#B89555]/50 hover:bg-[#EFE6D6]"
            title="Save the current subject + body as the standard template — affects future sends only, not this one"
          >
            <Save className="w-4 h-4 mr-2" /> Save as standard template
          </Button>
          <Button
            variant="gold"
            onClick={approveAndSend}
            disabled={!!busy || !canSend}
            className="w-full sm:w-auto"
          >
            {busy === "send" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Approve &amp; send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
