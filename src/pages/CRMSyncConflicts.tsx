import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RefreshCw, ScanLine, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Conflict {
  id: string;
  crm_lead_id: string | null;
  jbj_lead_id: string | null;
  zoho_lead_id: string | null;
  field: string;
  jbj_value: string | null;
  crm_value: string | null;
  zoho_value: string | null;
  detected_at: string;
}

/**
 * Phase 3 — Conflict resolution UI.
 * Lists open sync_conflicts, lets an admin pick which system's value wins
 * (or type a manual value) and pushes the choice to JBJ + CRM + Zoho.
 */
export default function CRMSyncConflicts() {
  const [rows, setRows] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("sync_conflicts")
      .select("*")
      .is("resolved_at", null)
      .order("detected_at", { ascending: false })
      .limit(200);
    setRows((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const scan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-sync-conflicts");
      if (error) throw error;
      toast.success(`Scanned ${data?.scanned ?? 0} · New conflicts: ${data?.conflicts_created ?? 0}`);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? String(e));
    } finally {
      setScanning(false);
    }
  };

  const resolve = async (id: string, resolution: string, final_value?: string) => {
    setBusy(id);
    try {
      const { error } = await supabase.functions.invoke("resolve-sync-conflict", {
        body: { conflict_id: id, resolution, final_value },
      });
      if (error) throw error;
      toast.success("Resolved & pushed to all three systems");
      setRows((rs) => rs.filter((r) => r.id !== id));
    } catch (e: any) {
      toast.error(e.message ?? String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <SEOHead
        title="Sync Conflicts | JBJ CRM"
        description="Resolve field-level disagreements between JBJ, CRM and Zoho leads."
        canonicalPath="/owner/crm/sync-conflicts"
      />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Sync Conflicts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Field-level disagreements between JBJ CRM, main CRM and Zoho. Pick the winning value
              and it will be pushed to all three systems.
            </p>
          </div>
          <Button onClick={scan} disabled={scanning}>
            {scanning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <ScanLine className="h-4 w-4 mr-2" />}
            Scan for new conflicts
          </Button>
        </header>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            ✅ No open conflicts. Everything matches across JBJ, CRM and Zoho.
          </Card>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge>{r.field}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Detected {formatDistanceToNow(new Date(r.detected_at), { addSuffix: true })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resolve(r.id, "ignored")}
                    disabled={busy === r.id}
                  >
                    <EyeOff className="h-3.5 w-3.5 mr-1" /> Ignore
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  {(["jbj", "crm", "zoho"] as const).map((src) => {
                    const v = (r as any)[`${src}_value`] as string | null;
                    return (
                      <button
                        key={src}
                        onClick={() => resolve(r.id, src)}
                        disabled={busy === r.id || v == null}
                        className="text-left border rounded-md p-3 hover:border-emerald-600 disabled:opacity-40 transition"
                      >
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{src}</div>
                        <div className="text-sm break-words min-h-[1.5em]">{v ?? <em className="text-muted-foreground">empty</em>}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a manual value…"
                    value={manual[r.id] ?? ""}
                    onChange={(e) => setManual((m) => ({ ...m, [r.id]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    onClick={() => resolve(r.id, "manual", manual[r.id] ?? "")}
                    disabled={busy === r.id || !manual[r.id]}
                  >
                    Use manual value
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
