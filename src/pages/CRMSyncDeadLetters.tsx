import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { RefreshCw, AlertCircle, PlayCircle, Link as LinkIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface Row {
  id: string;
  name: string;
  email: string | null;
  sync_error: string;
  last_synced_at: string | null;
  zoho_lead_id: string | null;
  source_table: "crm_leads" | "jbj_leads";
}

/**
 * Phase 6 — Dead-letter queue for the tri-directional Zoho sync.
 * Lists every JBJ or CRM lead with a non-null sync_error and offers one-click
 * re-sync via the sync-lead-tri edge function.
 */
export default function CRMSyncDeadLetters() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingAll, setRetryingAll] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [crmRes, jbjRes] = await Promise.all([
      supabase
        .from("crm_leads")
        .select("id, full_name, email_lower, sync_error, last_synced_at, zoho_lead_id")
        .not("sync_error", "is", null)
        .order("last_synced_at", { ascending: false, nullsFirst: false })
        .limit(200),
      supabase
        .from("jbj_leads")
        .select("id, name, email, sync_error, last_synced_at, zoho_lead_id")
        .not("sync_error", "is", null)
        .order("last_synced_at", { ascending: false, nullsFirst: false })
        .limit(200),
    ]);
    const merged: Row[] = [
      ...(crmRes.data ?? []).map((r: any) => ({
        id: r.id,
        name: r.full_name ?? "Unnamed",
        email: r.email_lower,
        sync_error: r.sync_error,
        last_synced_at: r.last_synced_at,
        zoho_lead_id: r.zoho_lead_id,
        source_table: "crm_leads" as const,
      })),
      ...(jbjRes.data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name ?? "Unnamed",
        email: r.email,
        sync_error: r.sync_error,
        last_synced_at: r.last_synced_at,
        zoho_lead_id: r.zoho_lead_id,
        source_table: "jbj_leads" as const,
      })),
    ];
    setRows(merged);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const retryOne = async (r: Row) => {
    setBusyId(r.id);
    try {
      const { error } = await supabase.functions.invoke("sync-lead-tri", {
        body: {
          source: r.source_table === "crm_leads" ? "crm" : "jbj",
          id: r.id,
          force: true,
        },
      });
      if (error) throw error;
      toast.success(`Retry queued for ${r.name}`);
      setTimeout(() => void load(), 1500);
    } catch (e: any) {
      toast.error(`Retry failed: ${e.message ?? e}`);
    } finally {
      setBusyId(null);
    }
  };

  const retryAll = async () => {
    setRetryingAll(true);
    try {
      let ok = 0, fail = 0;
      for (const r of rows) {
        try {
          await supabase.functions.invoke("sync-lead-tri", {
            body: {
              source: r.source_table === "crm_leads" ? "crm" : "jbj",
              id: r.id,
              force: true,
            },
          });
          ok++;
        } catch { fail++; }
      }
      toast.success(`Retried ${ok} · Failed ${fail}`);
      await load();
    } finally {
      setRetryingAll(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Sync Dead-Letter Queue | JBJ CRM"
        description="Retry failed Zoho ↔ CRM ↔ JBJ lead sync operations."
        canonicalPath="/owner/crm/sync-errors"
      />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Sync Dead-Letter Queue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Leads with a non-null sync_error. Retry propagates them across JBJ ↔ CRM ↔ Zoho.
            </p>
          </div>
          <Button onClick={retryAll} disabled={retryingAll || rows.length === 0}>
            {retryingAll ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
            Retry all ({rows.length})
          </Button>
        </header>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            🎉 No sync failures. All leads are up to date.
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Card key={`${r.source_table}-${r.id}`} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{r.source_table === "crm_leads" ? "CRM" : "JBJ"}</Badge>
                      <span className="font-medium">{r.name}</span>
                      {r.email && <span className="text-xs text-muted-foreground">{r.email}</span>}
                      {r.zoho_lead_id && (
                        <Badge variant="outline" className="text-xs">
                          <LinkIcon className="h-3 w-3 mr-1" />Zoho {r.zoho_lead_id.slice(-6)}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex items-start gap-2 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <pre className="whitespace-pre-wrap break-all text-xs font-mono">{r.sync_error}</pre>
                    </div>
                    {r.last_synced_at && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Last attempted {formatDistanceToNow(new Date(r.last_synced_at), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => retryOne(r)} disabled={busyId === r.id}>
                      {busyId === r.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <PlayCircle className="h-3.5 w-3.5 mr-1" />
                      )}
                      Retry
                    </Button>
                    {r.source_table === "crm_leads" && (
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/owner/crm/leads/${r.id}`}>Open</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
