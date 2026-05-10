/**
 * BrandedEmailComposer
 *
 * Universal "send a branded email to any recipient" card at the top of the
 * Relationship Hub. Owner enters a brief, AI drafts subject + body, owner
 * edits freely, optionally saves as a template, then Test-sends to self
 * and finally sends to the recipient. Test and Live re-use the EXACT
 * same `inner_html` + `subject` strings via the existing
 * outreach-lock-payload / outreach-send-locked pipeline — so what the
 * owner approves in the test is byte-for-byte what the recipient gets.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Send, FlaskConical, Save, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  PRIMARY_SENDER,
  PRIMARY_SENDER_NAME,
  DEFAULT_REPLY_TO,
} from "@/config/outreachIdentity";

type Template = {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  brief: string | null;
};

export function BrandedEmailComposer() {
  const [recipient, setRecipient] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [brief, setBrief] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [saveAsName, setSaveAsName] = useState("");

  const [busy, setBusy] = useState<"" | "ai" | "test" | "live" | "save">("");
  const [ownerEmail, setOwnerEmail] = useState<string>("");

  // Load templates + owner email
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setOwnerEmail(u.user?.email ?? "");
      const { data } = await (supabase as any)
        .from("branded_email_templates")
        .select("id, name, subject, body_html, brief")
        .order("updated_at", { ascending: false });
      setTemplates(data ?? []);
    })();
  }, []);

  const onLoadTemplate = (id: string) => {
    setTemplateId(id);
    if (!id) {
      setSubject("");
      setBodyHtml("");
      setBrief("");
      return;
    }
    const t = templates.find((x) => x.id === id);
    if (t) {
      setSubject(t.subject);
      setBodyHtml(t.body_html);
      setBrief(t.brief ?? "");
    }
  };

  const draftWithAI = async () => {
    if (!brief.trim()) {
      toast.error("Write a short brief for the AI first.");
      return;
    }
    setBusy("ai");
    try {
      const { data, error } = await supabase.functions.invoke("compose-branded-email", {
        body: { brief, recipient_name: recipientName, tone: "warm executive" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSubject(data.subject);
      setBodyHtml(data.body_html);
      toast.success("AI draft ready — edit before sending.");
    } catch (e: any) {
      toast.error(e.message ?? "AI draft failed");
    } finally {
      setBusy("");
    }
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
        .insert({
          owner_id: u.user.id,
          name: saveAsName.trim(),
          subject,
          body_html: bodyHtml,
          brief: brief || null,
        })
        .select()
        .single();
      if (error) throw error;
      setTemplates((t) => [data, ...t]);
      setTemplateId(data.id);
      setSaveAsName("");
      toast.success("Template saved.");
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setBusy("");
    }
  };

  const lockAndSend = async (target: "test" | "live") => {
    if (!subject.trim() || !bodyHtml.trim()) { toast.error("Subject and body required."); return; }
    const to = target === "test" ? ownerEmail : recipient.trim();
    if (!to || !to.includes("@")) {
      toast.error(target === "test" ? "Couldn't find your account email." : "Enter a valid recipient email.");
      return;
    }
    setBusy(target);
    try {
      // 1. Lock the payload — produces an immutable locked row
      const { data: locked, error: lockErr } = await supabase.functions.invoke(
        "outreach-lock-payload",
        {
          body: {
            surface: target === "test" ? "branded-composer-test" : "branded-composer-live",
            recipient_email: to,
            from_email: PRIMARY_SENDER,
            from_name: PRIMARY_SENDER_NAME,
            reply_to: DEFAULT_REPLY_TO,
            subject,
            inner_html: bodyHtml,
            metadata: { source: "BrandedEmailComposer", target },
          },
        }
      );
      if (lockErr) throw lockErr;
      if (locked?.error) throw new Error(locked.error);
      const payloadId = locked?.id || locked?.payload_id;
      if (!payloadId) throw new Error("Lock function did not return a payload id");

      // 2. Send the locked payload byte-for-byte
      const { data: sent, error: sendErr } = await supabase.functions.invoke(
        "outreach-send-locked",
        { body: { payload_id: payloadId } }
      );
      if (sendErr) throw sendErr;
      if (sent?.error) throw new Error(sent.error);

      toast.success(
        target === "test"
          ? `Test sent to ${to}. What you see there is exactly what the recipient will get.`
          : `Email sent to ${to}.`
      );
    } catch (e: any) {
      toast.error(e.message ?? "Send failed");
    } finally {
      setBusy("");
    }
  };

  return (
    <Card className="mb-6 border-[#B89555]/30 bg-[#FDFBF7]">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#1A1A1A]" />
            <h3 className="text-base font-semibold text-[#1A1A1A]">Send a branded email</h3>
            <span className="text-xs text-[#1A1A1A]/60">
              Universal composer — AI drafts, you approve, test = live (byte-for-byte).
            </span>
          </div>
          {templates.length > 0 && (
            <select
              value={templateId}
              onChange={(e) => onLoadTemplate(e.target.value)}
              className="px-2 py-1.5 text-sm border border-[#B89555]/40 rounded bg-white text-[#1A1A1A]"
            >
              <option value="">Load template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Recipient email</Label>
            <Input
              type="email"
              placeholder="them@example.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="bg-white"
            />
          </div>
          <div>
            <Label className="text-xs">Recipient first name (optional)</Label>
            <Input
              placeholder="e.g. Sarah"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="bg-white"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Brief for AI (what should this email say?)</Label>
          <Textarea
            placeholder="e.g. Thank Sarah for the meeting yesterday and share three Palm Jumeirah listings under 12M AED."
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            className="bg-white min-h-[70px]"
          />
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={draftWithAI}
              disabled={busy === "ai"}
              className="border-[#B89555]/40"
            >
              {busy === "ai" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Draft with AI
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs">Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject line"
            className="bg-white"
          />
        </div>

        <div>
          <Label className="text-xs">Body (HTML — edit freely; test and live use this exact text)</Label>
          <Textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            placeholder="<p>Hello…</p>"
            className="bg-white min-h-[180px] font-mono text-xs"
          />
        </div>

        {bodyHtml && (
          <details className="text-xs">
            <summary className="cursor-pointer text-[#1A1A1A]/70 hover:text-[#1A1A1A]">
              Preview (what will be sent)
            </summary>
            <div
              className="mt-2 p-4 bg-white border border-[#B89555]/30 rounded prose prose-sm max-w-none"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </details>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#B89555]/20">
          <Input
            placeholder="Save as new template (name)"
            value={saveAsName}
            onChange={(e) => setSaveAsName(e.target.value)}
            className="max-w-xs bg-white"
          />
          <Button
            variant="outline"
            onClick={saveTemplate}
            disabled={busy === "save" || !saveAsName.trim()}
            className="border-[#B89555]/40"
          >
            {busy === "save" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save template
          </Button>

          <div className="flex-1" />

          <Button
            variant="outline"
            onClick={() => lockAndSend("test")}
            disabled={busy === "test" || !subject || !bodyHtml}
            className="border-[#B89555]/40"
            title={`Sends to your account email (${ownerEmail || "—"}) using the exact same locked payload as the live send.`}
          >
            {busy === "test" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FlaskConical className="w-4 h-4 mr-2" />}
            Send test to me
          </Button>
          <Button
            variant="gold"
            onClick={() => lockAndSend("live")}
            disabled={busy === "live" || !subject || !bodyHtml || !recipient}
          >
            {busy === "live" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send to recipient
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default BrandedEmailComposer;
