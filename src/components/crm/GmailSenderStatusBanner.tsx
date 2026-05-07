import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Status {
  ok: boolean;
  connected?: boolean;
  connectedEmail?: string;
  requiredAlias?: string;
  verified?: boolean;
  message?: string;
}

/**
 * Banner above the CRM Relationships page that confirms the connected Gmail
 * mailbox matches the required outbound sender (infoo.jane@gmail.com).
 * Sends go directly from the connected mailbox — no Send-As alias required.
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
        <Loader2 className="h-4 w-4 animate-spin" /> Checking outbound sender…
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
            Outbound sender ready — emails will be sent directly from{" "}
            <strong>{status.requiredAlias}</strong>.
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
            Wrong Gmail mailbox connected.
          </p>
          <p className="text-red-900/85">
            The connected mailbox is{" "}
            <strong>{status.connectedEmail || "unknown"}</strong>, but brokerage
            outreach requires <strong>{status.requiredAlias || "infoo.jane@gmail.com"}</strong>.
            Reconnect Gmail using the correct account in Connectors.
          </p>
          {status.message && (
            <p className="text-red-900/70">{status.message}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
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
