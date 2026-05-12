/**
 * SendViaEmailDialog — preview-first composer for the "Send via Email"
 * action on /e-signature/:id.
 *
 * Flow:
 *   • Opens with the exact email the recipient will receive (subject, body,
 *     CC, From / Reply-To, attached PDF info).
 *   • Owner can edit Subject, Body, To, and the CC chips
 *     (defaults to infoo.jane@gmail.com — removable).
 *   • Three actions:
 *       - Send test    → only to infoo.jane@gmail.com
 *       - Approve & Send → real recipient via esign-send-for-signature
 *       - Cancel
 *   • Headers strip is read-only:
 *       From: noreply@jbj.ae   Reply-To: contact@jbj.ae   Provider: Resend
 */
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Send, X, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL } from "@/config/backend";

const DEFAULT_CC = "infoo.jane@gmail.com";
const DISPLAY_FROM = "JBJ Global Real Estate <noreply@jbj.ae>";
const DISPLAY_REPLY_TO = "contact@jbj.ae";
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  envelopeId: string;
  recipientName: string;
  recipientEmail: string;
  defaultSubject: string;
  defaultBody: string;
  signingUrl?: string;
  attachmentName?: string;
  onSent?: () => void;
}

export function SendViaEmailDialog({
  open, onOpenChange, envelopeId, recipientName, recipientEmail,
  defaultSubject, defaultBody, signingUrl, attachmentName, onSent,
}: Props) {
  const [to, setTo] = useState(recipientEmail);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [ccs, setCcs] = useState<string[]>([DEFAULT_CC]);
  const [ccInput, setCcInput] = useState("");
  const [busy, setBusy] = useState<"" | "test" | "send">("");

  useEffect(() => {
    if (open) {
      setTo(recipientEmail);
      setSubject(defaultSubject);
      setBody(defaultBody);
      setCcs([DEFAULT_CC]);
      setCcInput("");
    }
  }, [open, recipientEmail, defaultSubject, defaultBody]);

  const cleanCcs = useMemo(
    () => Array.from(new Set(ccs.map((c) => c.trim()).filter(isValidEmail))),
    [ccs],
  );

  const addCc = () => {
    const v = ccInput.trim();
    if (!v) return;
    if (!isValidEmail(v)) { toast.error("Invalid email"); return; }
    setCcs((prev) => Array.from(new Set([...prev, v])));
    setCcInput("");
  };

  const sendTest = async () => {
    setBusy("test");
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/esign-send-test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          envelope_id: envelopeId,
          interpolated_subject: subject,
          interpolated_body: body,
          test_recipient: DEFAULT_CC,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Failed to send test");
      toast.success(`Test sent to ${DEFAULT_CC}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to send test");
    } finally {
      setBusy("");
    }
  };

  const approveAndSend = async () => {
    if (!isValidEmail(to)) { toast.error("Invalid recipient email"); return; }
    setBusy("send");
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/esign-send-for-signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          envelope_id: envelopeId,
          channels: ["email"],
          cc_emails: cleanCcs,
          override_subject: subject,
          override_body: body,
          override_to: to,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Failed to send");
      toast.success(`Sent to ${recipientName}${cleanCcs.length ? ` · CC ${cleanCcs.length}` : ""}`);
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
      <DialogContent className="max-w-2xl bg-[#FDFBF7] border-[#B89555]/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <Mail className="w-5 h-5" /> Preview & send by email
          </DialogTitle>
        </DialogHeader>

        {/* Headers strip */}
        <div className="rounded-md border border-[#B89555]/30 bg-[#F7F2EA] p-3 text-xs text-[#1A1A1A] space-y-1">
          <div><span className="opacity-60 mr-2">From:</span><strong>{DISPLAY_FROM}</strong></div>
          <div><span className="opacity-60 mr-2">Reply-To:</span><strong>{DISPLAY_REPLY_TO}</strong></div>
          <div><span className="opacity-60 mr-2">Provider:</span>Resend</div>
          {attachmentName && (
            <div className="flex items-center gap-1.5 pt-1">
              <FileText className="w-3.5 h-3.5" />
              <span className="opacity-60">Attachment:</span>
              <strong className="truncate">{attachmentName}</strong>
            </div>
          )}
        </div>

        {/* To */}
        <div className="space-y-1.5">
          <Label className="text-[#1A1A1A] text-xs">To</Label>
          <Input value={to} onChange={(e) => setTo(e.target.value)} className="bg-white" />
          <p className="text-[10px] text-[#1A1A1A]/60">Recipient: {recipientName}</p>
        </div>

        {/* CC chips */}
        <div className="space-y-1.5">
          <Label className="text-[#1A1A1A] text-xs">CC (default: infoo.jane@gmail.com — remove if not wanted)</Label>
          <div className="flex flex-wrap gap-1.5">
            {ccs.map((c) => (
              <Badge key={c} variant="secondary" className="gap-1 bg-white border border-[#B89555]/30 text-[#1A1A1A]">
                {c}
                <button onClick={() => setCcs(ccs.filter((x) => x !== c))} className="ml-1 hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            <div className="flex gap-1">
              <Input
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCc(); } }}
                placeholder="add@example.com"
                className="h-7 text-xs w-44 bg-white"
              />
              <Button size="sm" variant="outline" className="h-7" onClick={addCc}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <Label className="text-[#1A1A1A] text-xs">Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-white" />
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <Label className="text-[#1A1A1A] text-xs">Body</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="bg-white font-mono text-xs"
          />
          {signingUrl && (
            <p className="text-[10px] text-[#1A1A1A]/60">
              Signing link will be inserted in the branded email: <span className="underline">{signingUrl}</span>
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={!!busy}>
            Cancel
          </Button>
          <Button variant="outline" onClick={sendTest} disabled={!!busy}>
            {busy === "test" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            Send test → {DEFAULT_CC}
          </Button>
          <Button variant="gold" onClick={approveAndSend} disabled={!!busy}>
            {busy === "send" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Approve & Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
