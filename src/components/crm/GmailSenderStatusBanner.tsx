import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Status {
  ok: boolean;
  connected?: boolean;
  connectedEmail?: string;
  requiredAlias?: string;
  present?: boolean;
  verified?: boolean;
  verificationStatus?: string | null;
  message?: string;
}

/**
 * Small banner shown above the CRM Relationships page that confirms whether
 * jane@citideveloper.com is a verified Gmail Send-As alias on the connected
 * mailbox. Without that alias verified, Gmail rewrites the From: header back
 * to the connected mailbox (e.g. janeaboujaoudemodel@gmail.com) regardless
 * of what the edge function sets.
 */
export function GmailSenderStatusBanner() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-gmail-sender-status");
      if (error) throw error;
      setStatus(data as Status);
    } catch (e: any) {
      setStatus({ ok: false, message: e?.message || "Could not check sender status." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-[#1A1A1A]/10 bg-[#F7F2EA] px-4 py-2 text-sm text-[#1A1A1A]/70">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking outbound sender alias…
      </div>
    );
  }

  if (!status) return null;

  if (status.ok) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm">
        <div className="flex items-center gap-2 text-emerald-900">
          <CheckCircle2 className="h-4 w-4" />
          <span>
            Outbound sender verified — emails will arrive from{" "}
            <strong>{status.requiredAlias}</strong>
            {status.connectedEmail ? <> via {status.connectedEmail}</> : null}.
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={load}>Recheck</Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm">
      <div className="flex items-start gap-2 text-red-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold">
            Action required — emails are being sent from{" "}
            <span className="underline">
              {status.connectedEmail || "the connected Gmail mailbox"}
            </span>
            , not <strong>{status.requiredAlias || "jane@citideveloper.com"}</strong>.
          </p>
          <p className="text-red-900/85">
            Gmail will keep rewriting the <code>From:</code> header until{" "}
            <strong>{status.requiredAlias || "jane@citideveloper.com"}</strong> is
            added as a verified <em>Send mail as</em> alias on{" "}
            {status.connectedEmail || "the connected mailbox"}.
          </p>
          <ol className="ml-4 list-decimal text-red-900/85">
            <li>
              Open Gmail Settings (on the connected mailbox) → <em>Accounts and Import</em> →{" "}
              <em>Send mail as</em> → <em>Add another email address</em>.
            </li>
            <li>
              Enter <strong>{status.requiredAlias || "jane@citideveloper.com"}</strong>,
              uncheck "Treat as alias", and use the Citi Developer SMTP server.
            </li>
            <li>
              Click the verification link Gmail emails to{" "}
              <strong>{status.requiredAlias || "jane@citideveloper.com"}</strong>.
            </li>
            <li>Recheck below — sends are blocked until verification is "accepted".</li>
          </ol>
          {status.verificationStatus && status.verificationStatus !== "accepted" && (
            <p className="text-red-900/70">
              Current alias status:{" "}
              <code>{status.verificationStatus}</code>.
            </p>
          )}
          {status.message && (
            <p className="text-red-900/70">{status.message}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <a
                href="https://mail.google.com/mail/u/0/#settings/accounts"
                target="_blank"
                rel="noreferrer"
              >
                Open Gmail Send-As settings <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={load}>
              Recheck
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GmailSenderStatusBanner;
