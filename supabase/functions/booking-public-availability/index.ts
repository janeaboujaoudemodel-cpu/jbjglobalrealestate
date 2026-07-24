// JBJ Bookings — public availability endpoint
// Returns available start times for a given booking page slug and date.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type Range = { start: string; end: string };
type Weekly = Record<string, Range[]>;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Compute available start times (as ISO strings) for a given local date in the workspace tz. */
function computeSlots(opts: {
  date: string; // YYYY-MM-DD (local to tz)
  tz: string;
  weekly: Weekly;
  overrides: Array<{ date: string; blocked?: boolean; ranges?: Range[] }>;
  durationMin: number;
  intervalMin: number;
  minNoticeHours: number;
  busy: Array<{ startMin: number; endMin: number }>; // relative to date's midnight in tz
  nowUtc: Date;
}): string[] {
  const { date, tz, weekly, overrides, durationMin, intervalMin, minNoticeHours, busy, nowUtc } = opts;

  // Day of week in tz
  const localMidnight = new Date(`${date}T00:00:00`);
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(new Date(`${date}T12:00:00Z`));
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = wdMap[wd] ?? 0;

  // Override handling
  let ranges: Range[] = weekly[String(dow)] ?? [];
  const ov = overrides.find((o) => o.date === date);
  if (ov) {
    if (ov.blocked) return [];
    if (ov.ranges) ranges = ov.ranges;
  }
  if (ranges.length === 0) return [];

  // Minimum notice cutoff (absolute UTC)
  const noticeCutoff = new Date(nowUtc.getTime() + minNoticeHours * 3600_000);

  const slots: string[] = [];
  for (const r of ranges) {
    const startMin = toMinutes(r.start);
    const endMin = toMinutes(r.end);
    for (let m = startMin; m + durationMin <= endMin; m += intervalMin) {
      // Build UTC instant for this local time in tz
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      // Compute UTC by asking Intl for the offset — simpler: build a Date from a string interpreted as tz.
      const localStr = `${date}T${hh}:${mm}:00`;
      const utcInstant = zonedTimeToUtc(localStr, tz);
      const utcEnd = new Date(utcInstant.getTime() + durationMin * 60_000);

      if (utcInstant < noticeCutoff) continue;

      // Busy check: convert busy minutes to absolute UTC instants for same day
      const overlaps = busy.some((b) => {
        // busy is stored as UTC ISO in our conflict list, so check directly
        return b.startMin < m + durationMin && b.endMin > m;
      });
      if (overlaps) continue;

      slots.push(utcInstant.toISOString());
    }
  }
  return slots;
}

/** Interpret a "YYYY-MM-DDTHH:mm:ss" as a wall-clock time in tz and return the UTC Date. */
function zonedTimeToUtc(local: string, tz: string): Date {
  // Iterative offset resolution using Intl
  const guess = new Date(local + 'Z'); // start as if UTC
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = dtf.formatToParts(guess);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asIfUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  const offset = asIfUtc - guess.getTime();
  return new Date(guess.getTime() - offset);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const date = url.searchParams.get('date'); // YYYY-MM-DD in workspace tz
    if (!slug || !date) {
      return new Response(JSON.stringify({ error: 'slug and date required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: page } = await sb
      .from('jbj_booking_pages')
      .select('id, event_type_id, is_active, jbj_booking_event_types!inner(id, workspace_id, duration_minutes, interval_minutes, min_notice_hours, max_advance_days, weekly_availability, date_overrides, is_active, jbj_booking_workspaces!inner(timezone, is_active))')
      .eq('slug', slug)
      .maybeSingle();

    if (!page || !page.is_active) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const evt: any = (page as any).jbj_booking_event_types;
    const ws: any = evt.jbj_booking_workspaces;
    if (!evt.is_active || !ws.is_active) {
      return new Response(JSON.stringify({ error: 'inactive' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load same-day conflicts (widen window by 1 day either side to be safe)
    const dayStart = zonedTimeToUtc(`${date}T00:00:00`, ws.timezone);
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600_000);
    const { data: conflicts } = await sb
      .from('jbj_booking_appointments')
      .select('starts_at, ends_at')
      .eq('event_type_id', evt.id)
      .in('status', ['pending','awaiting_email_verification','awaiting_approval','accepted','confirmed','rescheduled'])
      .lt('starts_at', dayEnd.toISOString())
      .gt('ends_at', dayStart.toISOString());

    // Convert conflicts to minutes-relative-to-local-midnight in tz
    const busy = (conflicts ?? []).map((c: any) => {
      const s = new Date(c.starts_at).getTime();
      const e = new Date(c.ends_at).getTime();
      return { startMin: Math.max(0, (s - dayStart.getTime()) / 60000), endMin: (e - dayStart.getTime()) / 60000 };
    });

    const slots = computeSlots({
      date, tz: ws.timezone,
      weekly: evt.weekly_availability ?? {},
      overrides: evt.date_overrides ?? [],
      durationMin: evt.duration_minutes,
      intervalMin: evt.interval_minutes,
      minNoticeHours: evt.min_notice_hours,
      busy,
      nowUtc: new Date(),
    });

    return new Response(JSON.stringify({
      slots,
      duration_minutes: evt.duration_minutes,
      timezone: ws.timezone,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('availability error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
