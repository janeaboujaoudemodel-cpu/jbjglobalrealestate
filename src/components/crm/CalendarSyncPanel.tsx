import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, CalendarCheck, AlertTriangle, Mail, CheckCircle2, XCircle } from "lucide-react";

type ProviderId = "google_calendar" | "microsoft_outlook";
type SyncState = { is_enabled: boolean; push_enabled: boolean; pull_enabled: boolean; last_pull_at: string | null; last_push_at: string | null; events_pulled: number; events_pushed: number; last_error: string | null } | null;
type CalendarTarget = { id: string; name: string; primary: boolean; writable: boolean; state: SyncState };
type AccountStatus = { provider: ProviderId; account_key: string; slot?: string; connected: boolean; account: string | null; email?: string | null; calendars: CalendarTarget[]; error?: string };
type Mailbox = { email_address: string; provider: string; status: string; last_synced_at: string | null; last_sync_status: string | null };

const LABEL: Record<ProviderId, string> = { google_calendar: "Google Calendar", microsoft_outlook: "Outlook Calendar" };
const EXPECTED_MAILBOXES = ["contact@jbj.ae", "helpdesk@jbj.ae"];

export default function CalendarSyncPanel({ onSynced }: { onSynced?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountStatus[]>([]);
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const call = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("owner-calendar-sync", { body });
    if (error) throw new Error(error.message);
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data as { accounts?: AccountStatus[]; mailboxes?: Mailbox[]; results?: Array<{ pulled?: number; pushed?: number; error?: string }> };
  }, []);
  const load = useCallback(async () => {
    try { const data = await call({ action: "status" }); setAccounts(data.accounts ?? []); setMailboxes(data.mailboxes ?? []); }
    catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }, [call]);
  useEffect(() => { void load(); }, [load]);


  const sync = async (account?: AccountStatus) => {
    const key = account ? `${account.provider}:${account.account_key}` : "all";
    setSyncing(key);
    try {
      const data = await call({ action: "sync", ...(account ? { provider: account.provider, account_key: account.account_key } : {}) });
      const results = data.results ?? [];
      const failure = results.find((r) => r.error);
      if (failure) toast.error(`Sync issue: ${failure.error}`);
      else toast.success("All connected calendars are up to date");
      await load(); onSynced?.();
    } catch (e) { toast.error(`Sync failed: ${(e as Error).message}`); }
    finally { setSyncing(null); }
  };

  return (
    <Card className="border-border/60 bg-card overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div><CardTitle className="text-base flex items-center gap-2"><CalendarCheck className="h-4 w-4" />Calendar connections</CardTitle><p className="mt-1 text-xs text-muted-foreground">Primary calendars stay synchronized automatically.</p></div>
        <Button size="sm" variant="primary" disabled={!!syncing || !accounts.some((a) => a.connected)} onClick={() => sync()}><RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />Sync now</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p className="text-sm text-muted-foreground">Checking connected accounts…</p> : accounts.length === 0 ? <p className="text-sm text-muted-foreground">No calendar accounts are linked.</p> : accounts.map((account) => (
          <section key={`${account.provider}:${account.account_key}`} className="rounded-md border border-border/60 p-4 space-y-3">
             <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold break-words">{account.email ?? account.account ?? `${LABEL[account.provider]} — account not identified`}</h3><p className="text-xs text-muted-foreground break-words">{LABEL[account.provider]}{account.slot ? ` · ${account.slot}` : ""}</p></div><span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${account.connected ? "text-[color:var(--emerald-1)]" : "text-destructive"}`}>{account.connected ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{account.connected ? "Connected · automatic sync on" : "Not connected"}</span></div>
            {account.error && <p className="flex gap-2 text-xs text-destructive"><AlertTriangle className="h-4 w-4 shrink-0" />{account.error}</p>}
             {account.connected && <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/50 p-3"><div><p className="text-sm font-medium">Primary calendar</p><p className="text-xs text-muted-foreground">Meetings update both here and in {LABEL[account.provider]} automatically. Holiday calendars are ignored.</p></div><Button size="sm" variant="outline" disabled={!!syncing} onClick={() => sync(account)}><RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing === `${account.provider}:${account.account_key}` ? "animate-spin" : ""}`} />Check now</Button></div>}
          </section>
        ))}
        {!loading && (
          <section className="rounded-md border border-border/60 p-4 space-y-2">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><h3 className="font-semibold text-sm">Mailboxes</h3></div>
            <p className="text-xs text-muted-foreground">Which inbox is connected, and which is still missing.</p>
            {EXPECTED_MAILBOXES.map((address) => {
              const box = mailboxes.find((m) => m.email_address.toLowerCase() === address);
              return <div key={address} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 p-2.5">
                <span className="min-w-0 break-words text-sm font-medium">{address}</span>
                <span className={`text-xs font-medium ${box ? "text-[color:var(--emerald-1)]" : "text-destructive"}`}>{box ? `Connected · ${box.provider}${box.last_synced_at ? ` · last sync ${new Date(box.last_synced_at).toLocaleString()}` : " · never synced"}` : "Not connected yet"}</span>
              </div>;
            })}
            {mailboxes.filter((m) => !EXPECTED_MAILBOXES.includes(m.email_address.toLowerCase())).map((m) => (
              <div key={m.email_address} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 p-2.5"><span className="min-w-0 break-words text-sm font-medium">{m.email_address}</span><span className="text-xs font-medium text-[color:var(--emerald-1)]">Connected · {m.provider}</span></div>
            ))}
          </section>
        )}
      </CardContent>

    </Card>
  );
}