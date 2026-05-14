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
import { useEffect, useMemo, useState } from "react";
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
import { SUPABASE_URL } from "@/config/backend";
import { EmailRecipientChips, isValidEmail } from "./EmailRecipientChips";
import { EmailBodyEditor } from "./EmailBodyEditor";
import { EmailPreviewIframe } from "./EmailPreviewIframe";
import { buildSenderSignatureHtml, escapeHtml } from "@/lib/email/buildEnvelopeEmailHtml";
import { useEmailSignatures, renderSignatureHtml, type EmailSignature } from "@/hooks/useEmailSignatures";

const TEST_RECIPIENT = "infoo.jane@gmail.com";
const DEFAULT_CC = "infoo.jane@gmail.com";
const DISPLAY_FROM = "JBJ Global Real Estate <noreply@jbj.ae>";
const DISPLAY_REPLY_TO = "contact@jbj.ae";

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
  docNumber?: string;
  senderName?: string;
  senderTitle?: string;
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
  return escapeHtml(interpolated).replace(/\n/g, "<br/>").replace(/(<br\s*\/?>\s*)+$/g, "");
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
  docNumber,
  senderName = "Jane Bou Jaoude",
  senderTitle = "Founder & CEO",
  onSent,
}: Props) {
  const [tos, setTos] = useState<string[]>([]);
  const [ccs, setCcs] = useState<string[]>([DEFAULT_CC]);
  const [subject, setSubject] = useState(defaultSubject);
  const [bodyHtml, setBodyHtml] = useState("");
  const [docusignUrl, setDocusignUrl] = useState("");
  const [busy, setBusy] = useState<"" | "test" | "send">("");
  const [selectedSigId, setSelectedSigId] = useState<string>("");

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
    const def = signatures.find((s) => s.is_default) || signatures[0];
    setSelectedSigId(def?.id || "");
  }, [signatures, selectedSigId]);

  useEffect(() => {
    if (!open) return;
    setTos(recipientEmail ? [recipientEmail] : []);
    setCcs([DEFAULT_CC]);
    setSubject(defaultSubject);
    setDocusignUrl("");
    setBodyHtml(
      stripSignature(
        legacyBodyToHtml(stripInlineSignature(defaultBody), {
          clientName: recipientName || "Client",
          docTitle: defaultSubject || "Document",
          senderName,
          senderTitle,
        }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recipientEmail, recipientName, defaultSubject, defaultBody]);

  // Defensive cleanup — if any embedded signature slips into the body,
  // strip it. Real signature is rendered by the email template separately.
  const applySelectedSignature = () => {
    setBodyHtml((prev) => stripSignature(prev));
  };

  const cleanCcs = useMemo(
    () => Array.from(new Set(ccs.filter(isValidEmail).filter((c) => !tos.includes(c)))),
    [ccs, tos],
  );

  const canSend = tos.length > 0 && tos.every(isValidEmail) && subject.trim().length > 0;

  // base64url encoder for safely embedding the signed URL into a /d?u= param.
  const b64url = (s: string): string => {
    try {
      const b64 = btoa(unescape(encodeURIComponent(s)));
      return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    } catch {
      return encodeURIComponent(s);
    }
  };

  // Wrap a signed Supabase URL into our branded /d?u=...&n=... landing page so
  // the visible link in the email stays on jbj.ae (no ad-blocker block, no
  // "From: mdafrewy...supabase.co" mobile blank-page experience).
  const wrapAsBrandedDownload = (signedUrl: string, filename?: string): string => {
    const origin = (typeof window !== "undefined" && window.location?.origin)
      ? window.location.origin
      : "https://www.jbj.ae";
    const u = b64url(signedUrl);
    const n = filename ? `&n=${encodeURIComponent(filename)}` : "";
    return `${origin}/d?u=${u}${n}`;
  };

  // Convert a Supabase storage URL into a 7-day signed URL, then wrap it in
  // the branded /d landing page. Public-bucket URLs and external URLs are
  // wrapped too so the email always shows a jbj.ae link.
  const resolveAttachmentUrl = async (rawUrl?: string): Promise<string | undefined> => {
    if (!rawUrl) return undefined;
    const m = rawUrl.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/?]+)\/([^?]+)/);
    let signed = rawUrl;
    if (m) {
      const bucket = m[1];
      let path = m[2];
      try { path = decodeURIComponent(path); } catch { /* keep raw */ }
      try {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7, {
          download: attachmentName || true,
        });
        if (!error && data?.signedUrl) signed = data.signedUrl;
      } catch { /* keep raw */ }
    }
    return wrapAsBrandedDownload(signed, attachmentName);
  };

  const sendTest = async () => {
    setBusy("test");
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const signedAttachmentUrl = await resolveAttachmentUrl(attachmentUrl);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/esign-send-test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          envelope_id: envelopeId,
          interpolated_subject: subject,
          interpolated_body_html: bodyHtml,
          signature_html: selectedSigHtml,
          docusign_url: docusignUrl.trim() || undefined,
          attachment_name: attachmentName,
          attachment_url: signedAttachmentUrl,
          test_recipient: TEST_RECIPIENT,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Failed to send test");
      toast.success(`Test sent to ${TEST_RECIPIENT}`);
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
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const signedAttachmentUrl = await resolveAttachmentUrl(attachmentUrl);
      // Persist edited subject/body to the envelope so re-opening the dialog
      // shows the user's latest text instead of resetting to the original.
      try {
        await supabase
          .from("esign_envelopes")
          .update({ email_subject: subject, email_message: bodyHtml })
          .eq("id", envelopeId);
      } catch (e) { /* non-fatal */ }
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
          attachment_name: attachmentName,
          attachment_url: signedAttachmentUrl,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Failed to send");
      toast.success(`Sent to ${tos.length} recipient${tos.length > 1 ? "s" : ""}${cleanCcs.length ? ` · CC ${cleanCcs.length}` : ""}`);
      onSent?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to send");
    } finally {
      setBusy("");
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
              {attachmentName && (
                <div className="flex items-center gap-1.5 pt-1">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="opacity-60">Attachment:</span>
                  <strong className="truncate">{attachmentName}</strong>
                </div>
              )}
            </div>

            {/* To */}
            <div className="space-y-1.5">
              <Label className="text-[#1A1A1A] text-xs">To · {tos.length || "no"} recipient{tos.length === 1 ? "" : "s"}</Label>
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
              <Label className="text-[#1A1A1A] text-xs">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-white"
              />
            </div>

            {/* Signature picker */}
            <div className="space-y-1.5">
              <Label className="text-[#1A1A1A] text-xs flex items-center gap-1.5">
                <PenLine className="w-3.5 h-3.5" /> Signature · {signatures.length} available
              </Label>
              <div className="flex gap-2">
                <select
                  value={selectedSigId}
                  onChange={(e) => setSelectedSigId(e.target.value)}
                  className="flex-1 h-9 px-2 rounded-md border border-[#B89555]/40 bg-white text-sm text-[#1A1A1A] outline-none focus:border-[#B89555] focus:ring-2 focus:ring-[#B89555]/30 hover:border-[#B89555]/70 transition-colors"
                  aria-label="Select email signature"
                >
                  {!signatures.length && <option value="">Loading signatures…</option>}
                  {signatures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.is_default ? " · default" : ""}{s.is_system ? " · system" : ""}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applySelectedSignature}
                  disabled={!selectedSigHtml}
                  title="Insert/replace this signature in the message body"
                  className="border-[#B89555]/50"
                >
                  Insert
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

            {/* Body (rich) */}
            <div className="space-y-1.5">
              <Label className="text-[#1A1A1A] text-xs">Message</Label>
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
                attachmentName={attachmentName}
                attachmentUrl={attachmentUrl}
                className="w-full h-full bg-[#FDFBF7]"
              />
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
