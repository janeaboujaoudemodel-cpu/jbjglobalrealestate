import { useMemo, useState } from "react";
import {
  useBrokerPersonalCalendar, useCreateBrokerEvent, useDeleteBrokerEvent,
} from "@/hooks/useBrokerPersonalCalendar";
import { Plus, Trash2, MapPin } from "lucide-react";

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }

export default function BrokerCalendar() {
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const from = startOfMonth(cursor).toISOString();
  const to = endOfMonth(cursor).toISOString();
  const events = useBrokerPersonalCalendar({ from, to });
  const create = useCreateBrokerEvent();
  const del = useDeleteBrokerEvent();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", starts_at: "", ends_at: "", location: "" });

  const grid = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const startDay = first.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= last.getDate(); i++) days.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    return days;
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, typeof events.data>();
    (events.data ?? []).forEach((e) => {
      const k = new Date(e.starts_at).toDateString();
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr as any);
    });
    return map;
  }, [events.data]);

  const submit = async () => {
    if (!draft.title || !draft.starts_at || !draft.ends_at) return;
    await create.mutateAsync({
      title: draft.title,
      starts_at: new Date(draft.starts_at).toISOString(),
      ends_at: new Date(draft.ends_at).toISOString(),
      location: draft.location || null,
    });
    setDraft({ title: "", starts_at: "", ends_at: "", location: "" });
    setOpen(false);
  };

  return (
    <div>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">Your personal calendar — private to you and the owner.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="jj-pill-emerald-metallic inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm"
        >
          <Plus className="h-4 w-4" /> New event
        </button>
      </header>

      <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#B89555]/15">
          <div className="flex items-center gap-2">
            <button onClick={() => setCursor(addMonths(cursor, -1))} className="px-2 py-1 rounded hover:bg-[#B89555]/10">←</button>
            <span className="text-sm font-medium">{cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}</span>
            <button onClick={() => setCursor(addMonths(cursor, 1))} className="px-2 py-1 rounded hover:bg-[#B89555]/10">→</button>
          </div>
          <button onClick={() => setCursor(startOfMonth(new Date()))} className="text-xs px-2 py-1 rounded border border-[#B89555]/20">Today</button>
        </div>
        <div className="grid grid-cols-7 text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 border-b border-[#B89555]/15">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} className="px-2 py-2 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((d, i) => {
            const todayKey = d?.toDateString();
            const list = (todayKey ? eventsByDay.get(todayKey) : []) ?? [];
            const isToday = d && d.toDateString() === new Date().toDateString();
            return (
              <div
                key={i}
                className={`min-h-[100px] border-r border-b border-[#B89555]/10 p-2 ${isToday ? "bg-[#EFE6D6]/50" : "bg-white/40"}`}
              >
                {d && (
                  <>
                    <div className="text-[11px] text-[#1A1A1A]/70 mb-1">{d.getDate()}</div>
                    <div className="space-y-1">
                      {list.map((e: any) => (
                        <div key={e.id} className="group bg-[color:var(--emerald-1)] text-white text-[10px] px-1.5 py-0.5 rounded truncate flex items-center justify-between gap-1">
                          <span className="truncate" title={e.title}>{e.title}</span>
                          <button
                            onClick={() => del.mutate(e.id)}
                            className="opacity-0 group-hover:opacity-100"
                          ><Trash2 className="h-2.5 w-2.5" /></button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming list */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold mb-3">Upcoming this month</h2>
        <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 divide-y divide-[#B89555]/15">
          {(events.data ?? []).length === 0 && (
            <p className="p-6 text-center text-xs text-[#1A1A1A]/60">No events.</p>
          )}
          {(events.data ?? []).map((e: any) => (
            <div key={e.id} className="px-4 py-3 flex items-center gap-4">
              <div className="text-xs font-medium tabular-nums w-32">
                {new Date(e.starts_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{e.title}</div>
                {e.location && (
                  <div className="text-xs text-[#1A1A1A]/60 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {e.location}
                  </div>
                )}
              </div>
              <button onClick={() => del.mutate(e.id)} className="p-1.5 rounded hover:bg-[#B89555]/10">
                <Trash2 className="h-3.5 w-3.5 text-[#1A1A1A]/60" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* New event modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-[#FDFBF7] rounded-xl border border-[#B89555]/30 p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-3">New event</h3>
            <div className="space-y-3">
              <input
                value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Title" className="w-full border border-[#B89555]/20 rounded-md px-3 py-2 text-sm"
              />
              <label className="block text-xs">Start
                <input type="datetime-local" value={draft.starts_at}
                  onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
                  className="w-full border border-[#B89555]/20 rounded-md px-3 py-2 text-sm mt-1" />
              </label>
              <label className="block text-xs">End
                <input type="datetime-local" value={draft.ends_at}
                  onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
                  className="w-full border border-[#B89555]/20 rounded-md px-3 py-2 text-sm mt-1" />
              </label>
              <input
                value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                placeholder="Location (optional)" className="w-full border border-[#B89555]/20 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-md text-sm border border-[#B89555]/20">Cancel</button>
              <button onClick={submit} className="px-3 py-1.5 rounded-md text-sm bg-[#1A1A1A] text-[#F7F2EA]">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
