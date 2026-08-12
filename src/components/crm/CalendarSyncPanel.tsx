/**
 * CalendarSyncPanel — owner-only two-way calendar bridge.
 *
 * Connects the owner's Google Calendar and Microsoft Outlook so JBJ events push
 * out and external events pull in. All provider traffic runs server-side in the
 * `owner-calendar-sync` edge function; no credentials touch the browser.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { RefreshCw, CalendarCheck, CalendarX, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

type ProviderId = "google_calendar" | "microsoft_outlook";

interface ProviderStatus {
  provider: ProviderId;
  connected: boolean;
  account: string | null;
  error: string | null;
  state: {
    is_enabled: boolean;
    push_enabled: boolean;
    pull_enabled: boolean;
    last_pull_at: string | null;
    last_push_at: string | null;
    events_pulled: number;
    events_pushed: number;
    last_error: string | null;
  } | null;
}

const LABEL: Record<ProviderId, string> = {
  google_calendar: "Google Calendar",
  microsoft_outlook: "Outlook Calendar",
};

export default function CalendarSyncPanel({ onSynced }: { onSynced?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);

  const call = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("owner-calendar-sync", { body });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as any;
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const data = await call({ action: "status" });
      setProviders(data.providers ?? []);
    } catch (e) {
      console.error("[CalendarSyncPanel] status failed", e);
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const runSync = async (provider?: ProviderId) => {
    setSyncing(provider ?? "all");
    try {
      const data = await call({ action: "sync", ...(provider ? { provider } : {}) });
      const results = (data.results ?? []) as any[];
      const pulled = results.reduce((n, r) => n + (r.pulled ?? 0), 0);
      const pushed = results.reduce((n, r) => n + (r.pushed ?? 0), 0);
      const failed = results.filter((r) => r.error);
      if (failed.length) {
        toast.error(`${LABEL[failed[0].provider as ProviderId]} sync issue: ${String(failed[0].error).slice(0, 120)}`);
      } else {
        const candidates = results.reduce((n, r) => n + (r.push_candidates ?? 0), 0);
        toast.success(`Calendar synced · ${pulled} pulled in, ${pushed} pushed out${pushed === 0 && candidates === 0 ? " · no local events awaiting sync" : ""}`);
      }
      await loadStatus();
      onSynced?.();
    } catch (e) {
      toast.error(`Sync failed: ${(e as Error).message.slice(0, 140)}`);
    } finally {
      setSyncing(null);
    }
  };

  const toggle = async (provider: ProviderId, field: "is_enabled" | "pull_enabled" | "push_enabled", value: boolean) => {
    try {
      await call({ action: "toggle", provider, [field]: value });
      await loadStatus();
    } catch (e) {
      toast.error(`Could not update: ${(e as Error).message.slice(0, 120)}`);
    }
  };

  return (
    <Card className="border-border/60 bg-card overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarCheck className="h-4 w-4" />
          Calendar sync
        </CardTitle>
        <Button size="sm" variant="primary" disabled={!!syncing} onClick={() => runSync()}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync all now"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Checking your connected calendars…</p>
        ) : (
          providers.map((p) => {
            const st = p.state;
            return (
              <div key={p.provider} className="rounded-xl border border-border/60 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      {p.connected ? (
                        <CalendarCheck className="h-4 w-4 text-[color:var(--emerald-1,#064E3B)]" />
                      ) : (
                        <CalendarX className="h-4 w-4 text-destructive" />
                      )}
                      <span>{LABEL[p.provider]}</span>
                      <Badge variant={p.connected ? "default" : "destructive"} className="rounded-full">
                        {p.connected ? "Connected" : "Needs access"}
                      </Badge>
                    </div>
                    {p.account && <p className="text-xs text-muted-foreground mt-1 break-words">{p.account}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!p.connected || !!syncing}
                      onClick={() => runSync(p.provider)}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing === p.provider ? "animate-spin" : ""}`} />
                      Sync
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={st?.is_enabled !== false}
                      onCheckedChange={(v) => toggle(p.provider, "is_enabled", v)}
                    />
                    <span>Enabled</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={st?.pull_enabled !== false}
                      onCheckedChange={(v) => toggle(p.provider, "pull_enabled", v)}
                    />
                    <span className="inline-flex items-center gap-1.5">
                      <ArrowDownToLine className="h-3.5 w-3.5" /> Bring events in
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={st?.push_enabled !== false}
                      onCheckedChange={(v) => toggle(p.provider, "push_enabled", v)}
                    />
                    <span className="inline-flex items-center gap-1.5">
                      <ArrowUpFromLine className="h-3.5 w-3.5" /> Send JBJ events out
                    </span>
                  </label>
                </div>

                {st && (st.last_pull_at || st.last_push_at) && (
                  <p className="text-xs text-muted-foreground">
                    {st.last_pull_at && <>In: {st.events_pulled} · {format(new Date(st.last_pull_at), "MMM d, HH:mm")} </>}
                    {st.last_push_at && <>· Out: {st.events_pushed} · {format(new Date(st.last_push_at), "MMM d, HH:mm")}</>}
                  </p>
                )}

                {(p.error || st?.last_error) && (
                  <p className="text-xs flex items-start gap-1.5 text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="break-words">
                      {p.error === "not_linked"
                        ? "This calendar is not connected yet."
                        : String(p.error ?? st?.last_error).slice(0, 220)}
                    </span>
                  </p>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
