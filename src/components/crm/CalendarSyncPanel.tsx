import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { RefreshCw, CalendarCheck, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from "lucide-react";

type ProviderId = "google_calendar" | "microsoft_outlook";
type SyncState = { is_enabled: boolean; push_enabled: boolean; pull_enabled: boolean; last_pull_at: string | null; last_push_at: string | null; events_pulled: number; events_pushed: number; last_error: string | null } | null;
type CalendarTarget = { id: string; name: string; primary: boolean; writable: boolean; state: SyncState };
type AccountStatus = { provider: ProviderId; account_key: string; connected: boolean; account: string | null; calendars: CalendarTarget[]; error?: string };

const LABEL: Record<ProviderId, string> = { google_calendar: "Google Calendar", microsoft_outlook: "Outlook Calendar" };

export default function CalendarSyncPanel({ onSynced }: { onSynced?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountStatus[]>([]);
  const call = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("owner-calendar-sync", { body });
    if (error) throw new Error(error.message);
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data as { accounts?: AccountStatus[]; results?: Array<{ pulled?: number; pushed?: number; error?: string }> };
  }, []);
  const load = useCallback(async () => {
    try { const data = await call({ action: "status" }); setAccounts(data.accounts ?? []); }
    catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }, [call]);
  useEffect(() => { void load(); }, [load]);

  const update = async (account: AccountStatus, calendar: CalendarTarget, patch: Record<string, boolean>) => {
    try {
      await call({ action: "toggle", provider: account.provider, account_key: account.account_key, account_label: account.account, calendar_id: calendar.id, ...patch });
      await load();
    } catch (e) { toast.error(`Could not update calendar: ${(e as Error).message}`); }
  };
  const sync = async (account?: AccountStatus, calendar?: CalendarTarget) => {
    const key = account ? `${account.provider}:${account.account_key}:${calendar?.id ?? "all"}` : "all";
    setSyncing(key);
    try {
      const data = await call({ action: "sync", ...(account ? { provider: account.provider, account_key: account.account_key } : {}), ...(calendar ? { calendar_id: calendar.id } : {}) });
      const results = data.results ?? [];
      const failure = results.find((r) => r.error);
      if (failure) toast.error(`Sync issue: ${failure.error}`);
      else toast.success(`Calendar synced · ${results.reduce((n, r) => n + (r.pulled ?? 0), 0)} in · ${results.reduce((n, r) => n + (r.pushed ?? 0), 0)} out`);
      await load(); onSynced?.();
    } catch (e) { toast.error(`Sync failed: ${(e as Error).message}`); }
    finally { setSyncing(null); }
  };

  return (
    <Card className="border-border/60 bg-card overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div><CardTitle className="text-base flex items-center gap-2"><CalendarCheck className="h-4 w-4" />Calendar connections</CardTitle><p className="mt-1 text-xs text-muted-foreground">Nothing syncs until you select a calendar and direction.</p></div>
        <Button size="sm" variant="primary" disabled={!!syncing || !accounts.some((a) => a.calendars.some((c) => c.state?.is_enabled))} onClick={() => sync()}><RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />Sync selected</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-sm text-muted-foreground">Checking connected accounts…</p> : accounts.length === 0 ? <p className="text-sm text-muted-foreground">No calendar accounts are linked.</p> : accounts.map((account) => (
          <section key={`${account.provider}:${account.account_key}`} className="rounded-md border border-border/60 p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold">{LABEL[account.provider]}</h3><p className="text-xs text-muted-foreground break-words">{account.account ?? "Account access needs attention"}</p></div>{account.connected && <span className="text-xs font-medium text-[color:var(--emerald-1)]">Connected account</span>}</div>
            {account.error && <p className="flex gap-2 text-xs text-destructive"><AlertTriangle className="h-4 w-4 shrink-0" />{account.error}</p>}
            <div className="space-y-2">
              {account.calendars.map((calendar) => {
                const enabled = calendar.state?.is_enabled === true;
                const rowKey = `${account.provider}:${account.account_key}:${calendar.id}`;
                return <div key={calendar.id} className="grid gap-3 rounded-md border border-border/50 p-3 md:grid-cols-[minmax(180px,1fr)_auto_auto_auto] md:items-center">
                  <label className="flex min-w-0 items-center gap-3"><Checkbox checked={enabled} onCheckedChange={(v) => update(account, calendar, { is_enabled: v === true, ...(v === true && !calendar.state ? { pull_enabled: false, push_enabled: false } : {}) })} /><span className="min-w-0"><span className="block font-medium break-words">{calendar.name}</span>{calendar.primary && <span className="text-xs text-muted-foreground">Primary calendar</span>}</span></label>
                  <label className={`flex items-center gap-2 text-sm ${enabled ? "" : "opacity-50"}`}><Checkbox disabled={!enabled} checked={calendar.state?.pull_enabled === true} onCheckedChange={(v) => update(account, calendar, { pull_enabled: v === true })} /><ArrowDownToLine className="h-4 w-4" /><span>Bring in</span></label>
                  <label className={`flex items-center gap-2 text-sm ${enabled && calendar.writable ? "" : "opacity-50"}`}><Checkbox disabled={!enabled || !calendar.writable} checked={calendar.state?.push_enabled === true} onCheckedChange={(v) => update(account, calendar, { push_enabled: v === true })} /><ArrowUpFromLine className="h-4 w-4" /><span>Send out</span></label>
                  <Button size="sm" variant="outline" disabled={!enabled || !!syncing} onClick={() => sync(account, calendar)}><RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing === rowKey ? "animate-spin" : ""}`} />Sync</Button>
                </div>;
              })}
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}