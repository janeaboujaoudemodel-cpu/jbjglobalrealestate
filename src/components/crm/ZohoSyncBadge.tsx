import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  leadId: string;
  /** which table the id belongs to */
  table?: "crm_leads" | "jbj_leads";
}

/**
 * Phase 4 — Zoho sync status badge + Force sync button.
 * Shows last_synced_at, zoho_lead_id presence, and any sync_error.
 * Clicking "Force sync" calls the sync-lead-tri edge function.
 */
export default function ZohoSyncBadge({ leadId, table = "crm_leads" }: Props) {
  const [state, setState] = useState<{
    zoho_lead_id: string | null;
    last_synced_at: string | null;
    sync_error: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from(table)
      .select("zoho_lead_id, last_synced_at, sync_error")
      .eq("id", leadId)
      .maybeSingle();
    if (data) setState(data as any);
  };

  useEffect(() => {
    void load();
    const channel = supabase
      .channel(`sync-badge-${leadId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table, filter: `id=eq.${leadId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, table]);

  const force = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("sync-lead-tri", {
        body: { source: table === "crm_leads" ? "crm" : "jbj", id: leadId, force: true },
      });
      if (error) throw error;
      toast.success("Sync queued — Zoho, CRM and JBJ updating now");
      setTimeout(() => void load(), 1500);
    } catch (e: any) {
      toast.error(`Sync failed: ${e.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  if (!state) return null;

  const linked = !!state.zoho_lead_id;
  const hasError = !!state.sync_error;
  const synced = state.last_synced_at
    ? formatDistanceToNow(new Date(state.last_synced_at), { addSuffix: true })
    : "never";

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={
          hasError
            ? "border-red-500/50 bg-red-50 text-red-700"
            : linked
              ? "border-emerald-600/40 bg-emerald-50 text-emerald-800"
              : "border-neutral-400/40 bg-neutral-50 text-neutral-700"
        }
        title={hasError ? state.sync_error! : `Zoho ID: ${state.zoho_lead_id ?? "—"}`}
      >
        {hasError ? (
          <AlertCircle className="h-3.5 w-3.5 mr-1" />
        ) : linked ? (
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
        ) : (
          <CloudOff className="h-3.5 w-3.5 mr-1" />
        )}
        Zoho: {hasError ? "error" : linked ? `synced ${synced}` : "not linked"}
      </Badge>
      <Button
        size="sm"
        variant="outline"
        onClick={force}
        disabled={busy}
        className="h-7 gap-1"
      >
        {busy ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Cloud className="h-3.5 w-3.5" />
        )}
        Force sync
      </Button>
    </div>
  );
}
