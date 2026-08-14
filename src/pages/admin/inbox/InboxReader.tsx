import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Reply, ReplyAll, Forward, Star, Trash2, Archive, MailOpen, Mail,
  Sparkles, Send, Loader2, ShieldAlert,
} from "lucide-react";
import { callInbox, type InboxEmail } from "./useInboxData";
import DOMPurify from "dompurify";

interface Props {
  email: InboxEmail | null;
  onChanged: () => void;
}

const InboxReader: React.FC<Props> = ({ email, onChanged }) => {
  const [body, setBody] = React.useState<{ html?: string; text?: string } | null>(null);
  const [loadingBody, setLoadingBody] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [replyAll, setReplyAll] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  React.useEffect(() => {
    setBody(null);
    setDraft("");
    setReplyAll(false);
    if (!email) return;
    let cancelled = false;
    setLoadingBody(true);
    callInbox<{ html?: string; text?: string }>("inbox-message", { emailId: email.id })
      .then((res) => {
        if (!cancelled) setBody(res);
      })
      .catch((err) => {
        if (!cancelled) toast.error(`Could not load message: ${err.message}`);
      })
      .finally(() => {
        if (!cancelled) setLoadingBody(false);
      });
    return () => {
      cancelled = true;
    };
  }, [email?.id]);

  const run = async (label: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(label);
    try {
      await fn();
      toast.success(success);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  if (!email) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
        <Mail className="h-8 w-8 text-[#064E3B]" />
        <p className="text-sm font-semibold text-[#0F172A]">Select a message</p>
        <p className="max-w-xs text-xs text-[#0F172A]/70">
          Every action you take here is mirrored to the real mailbox.
        </p>
      </div>
    );
  }

  const mirror = (action: string, success: string) =>
    run(action, () => callInbox("inbox-mirror", { emailIds: [email.id], action }), success);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-black/10 px-5 py-4">
        <div className="flex flex-wrap items-start gap-2">
          <h2 className="min-w-0 flex-1 text-base font-bold leading-snug text-[#0F172A]">
            {email.subject || "(no subject)"}
          </h2>
          <Badge className="whitespace-nowrap border-transparent bg-[#064E3B] text-white">
            {email.provider}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-[#0F172A]/75">
          {email.from_name ? `${email.from_name} · ` : ""}
          {email.from_email} · {format(new Date(email.received_at), "d MMM yyyy, HH:mm")}
        </p>
        {email.ai_summary && (
          <p className="mt-2 flex items-start gap-2 rounded-md bg-[#064E3B]/8 px-3 py-2 text-xs text-[#0F172A]">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B8860B]" />
            <span>{email.ai_summary}</span>
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => setReplyAll(false)}>
            <Reply className="mr-1.5 h-3.5 w-3.5" /> Reply
          </Button>
          <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => setReplyAll(true)}>
            <ReplyAll className="mr-1.5 h-3.5 w-3.5" /> Reply all
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="whitespace-nowrap"
            disabled={busy !== null}
            onClick={() => {
              const to = window.prompt("Forward to which email address?");
              if (to) void run("forward", () => callInbox("inbox-forward", { emailId: email.id, to, html: body?.html }), `Forwarded to ${to}`);
            }}
          >
            <Forward className="mr-1.5 h-3.5 w-3.5" /> Forward
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="whitespace-nowrap"
            disabled={busy !== null}
            onClick={() => mirror(email.is_starred ? "unstar" : "star", email.is_starred ? "Star removed" : "Starred")}
          >
            <Star className={`mr-1.5 h-3.5 w-3.5 ${email.is_starred ? "fill-[#B8860B] text-[#B8860B]" : ""}`} />
            {email.is_starred ? "Unstar" : "Star"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="whitespace-nowrap"
            disabled={busy !== null}
            onClick={() => mirror(email.is_unread ? "read" : "unread", email.is_unread ? "Marked read" : "Marked unread")}
          >
            <MailOpen className="mr-1.5 h-3.5 w-3.5" />
            {email.is_unread ? "Mark read" : "Mark unread"}
          </Button>
          <Button size="sm" variant="outline" className="whitespace-nowrap" disabled={busy !== null} onClick={() => mirror("archive", "Archived in the mailbox")}>
            <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive
          </Button>
          <Button size="sm" variant="outline" className="whitespace-nowrap" disabled={busy !== null} onClick={() => mirror("trash", "Moved to trash")}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Trash
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="whitespace-nowrap"
            disabled={busy !== null}
            onClick={() => run("analyze", () => callInbox("inbox-ai-analyze", { emailId: email.id }), "AI triage complete")}
          >
            {busy === "analyze" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />}
            Triage
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {loadingBody ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-black/5" />
            ))}
          </div>
        ) : body?.html ? (
          <div
            className="jbj-inbox-body text-sm leading-relaxed text-[#0F172A] [&_a]:text-[#064E3B] [&_img]:max-w-full"
            // SECURITY: inbound provider HTML is untrusted — sanitize before render.
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(body.html, {
                USE_PROFILES: { html: true },
                FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "base", "meta", "link"],
                FORBID_ATTR: [
                  "onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur",
                  "formaction", "srcdoc", "ping",
                ],
              }),
            }}
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#0F172A]">
            {body?.text || email.snippet || "No content available."}
          </p>
        )}
      </div>

      <Separator />

      <div className="shrink-0 space-y-2 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0F172A]/70">
            {replyAll ? "Reply all" : "Reply"} to {email.from_email}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="whitespace-nowrap"
            disabled={busy !== null}
            onClick={() =>
              run(
                "ai-draft",
                async () => {
                  const res = await callInbox<{ html: string }>("inbox-ai-reply", { emailId: email.id });
                  setDraft(res.html.replace(/<[^>]+>/g, (m) => (m === "<br>" || m === "<br/>" ? "\n" : "")).trim());
                },
                "AI draft ready for your review",
              )
            }
          >
            {busy === "ai-draft" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            AI draft
          </Button>
        </div>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write your reply — nothing is sent until you press Send."
          className="min-h-[110px]"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            className="whitespace-nowrap bg-[#064E3B] text-white hover:bg-[#053f30]"
            disabled={busy !== null || !draft.trim()}
            onClick={() =>
              run(
                "send",
                () =>
                  callInbox("inbox-send-reply", {
                    emailId: email.id,
                    replyAll,
                    html: draft
                      .split(/\n{2,}/)
                      .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
                      .join(""),
                  }),
                "Reply sent",
              ).then(() => setDraft(""))
            }
          >
            {busy === "send" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
            Send reply
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InboxReader;
