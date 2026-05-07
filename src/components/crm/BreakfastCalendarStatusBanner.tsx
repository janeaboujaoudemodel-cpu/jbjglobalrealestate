import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Status {
  bookingUrl: string | null;
  bookingUrlSafe: boolean;
  bookingUrlIsGoogle: boolean;
  bookingUrlForbidden: boolean;
  calendarConnected: boolean;
  calendarAccount: string | null;
  calendars: Array<{ id: string; name: string; primary: boolean; accessRole: string | null }>;
  message?: string;
}

/**
 * Surfaces the status of the dedicated breakfast Google Calendar:
 *  - whether the Google Calendar connector is linked,
 *  - which Google account is currently authoritative,
 *  - whether the saved booking URL is a Google appointment link (NOT jbj.ae),
 *  - one-click sync that pulls Google bookings into the backend so meetings
 *    are stored without ever sending the brokerage to the website.
 */
export function BreakfastCalendarStatusBanner() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("breakfast-calendar-status");
      if (error) throw error;
      setStatus(data as Status);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not load calendar status";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("breakfast-calendar-sync", {
        body: { calendarId: "primary" },
      });
      if (error) throw error;
      const upserted = (data as { upserted?: number })?.upserted ?? 0;
      toast.success(`Synced ${upserted} booking${upserted === 1 ? "" : "s"} from Google Calendar.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-[#1A1A1A]/10 bg-[#F7F2EA] px-4 py-2 text-sm text-[#1A1A1A]/70">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking dedicated breakfast calendar…
      </div>
    );
  }
  if (!status) return null;

  const allGood = status.calendarConnected && status.bookingUrlSafe && status.bookingUrlIsGoogle;

  if (allGood) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm">
        <div className="flex items-center gap-2 text-emerald-900">
          <CheckCircle2 className="h-4 w-4" />
          <span>
            Breakfast bookings handled by Google Calendar
            {status.calendarAccount ? <> ({status.calendarAccount})</> : null}.
            Brokerages book directly on Google — no website redirect.
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={sync} disabled={syncing}>
            {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
            Sync to backend
          </Button>
          <Button variant="ghost" size="sm" onClick={load}>Recheck</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm">
      <div className="flex items-start gap-2 text-red-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-2 flex-1">
          <p className="font-semibold">Breakfast bookings are not safely routed to Google Calendar yet.</p>
          <ul className="ml-4 list-disc text-red-900/85">
            {!status.calendarConnected && (
              <li>Google Calendar connector is not linked or could not be read.</li>
            )}
            {status.bookingUrlForbidden && (
              <li>
                The saved booking link points to <code>jbj.ae</code>. Replace it with your
                Google Calendar appointment link so brokerages never land on the website.
              </li>
            )}
            {!status.bookingUrl && (
              <li>No Google Calendar appointment link saved. Outgoing breakfast invites will be blocked until one is set.</li>
            )}
            {status.bookingUrl && !status.bookingUrlIsGoogle && !status.bookingUrlForbidden && (
              <li>Saved booking link is not a Google Calendar URL. Use a link starting with <code>https://calendar.app.google/</code>.</li>
            )}
          </ul>
          {status.message && <p className="text-red-900/70">{status.message}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline" size="sm">
              <a href="https://calendar.google.com/calendar/u/0/r/settings/createappointmentschedule" target="_blank" rel="noreferrer">
                <Calendar className="mr-1 h-3 w-3" />
                Create Google appointment schedule
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={sync} disabled={syncing || !status.calendarConnected}>
              {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Sync to backend
            </Button>
            <Button variant="outline" size="sm" onClick={load}>Recheck</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BreakfastCalendarStatusBanner;
