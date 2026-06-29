import { useMemo, useState } from "react";
import {
  useBrokerPersonalCalendar, useCreateBrokerEvent, useSoftDeleteBrokerEvent,
  useRestoreBrokerEvent, useDeleteBrokerEvent, type BrokerEvent,
} from "@/hooks/useBrokerPersonalCalendar";
import { Plus, Trash2, MapPin, RotateCcw, Copy, Bell, Bot, Repeat, CalendarDays } from "lucide-react";

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function localDateTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const emptyDraft = {
  title: "", starts_at: "", ends_at: "", location: "", description: "",
  repeat: "none", reminder: "email_30", ai_instruction: "",
};

export default function BrokerCalendar() {
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [tab, setTab] = useState<"active" | "deleted">("active");
  const from = startOfMonth(cursor).toISOString();
  const to = endOfMonth(cursor).toISOString();
  const events = useBrokerPersonalCalendar({ from, to });
  const deleted = useBrokerPersonalCalendar({ deleted: true });
  const create = useCreateBrokerEvent();
  const softDelete = useSoftDeleteBrokerEvent();
  const restore = useRestoreBrokerEvent();
  const hardDelete = useDeleteBrokerEvent();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

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
    const map = new Map<string, BrokerEvent[]>();
    (events.data ?? []).forEach((e) => {
      const k = new Date(e.starts_at).toDateString();
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    });
    return map;
  }, [events.data]);

  const closeModal = () => { setOpen(false); setDraft(emptyDraft); };
  const submit = async () => {
    if (!draft.title || !draft.starts_at || !draft.ends_at) return;
    const description = [
      draft.description && `Notes: ${draft.description}`,
      draft.ai_instruction && `AI: ${draft.ai_instruction}`,
      `Repeat: ${draft.repeat}`,
      `Reminder: ${draft.reminder.replace(/_/g, " ")}`,
    ].filter(Boolean).join("\n");
    await create.mutateAsync({
      title: draft.title,
      starts_at: new Date(draft.starts_at).toISOString(),
      ends_at: new Date(draft.ends_at).toISOString(),
      location: draft.location || null,
      description,
      color: "#064E3B",
    });
    closeModal();
  };

  const duplicate = async (e: BrokerEvent) => {
    await create.mutateAsync({
      title: `${e.title} copy`, starts_at: e.starts_at, ends_at: e.ends_at,
      location: e.location, description: e.description, color: "#064E3B",
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Calendar</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">Emerald calendar with AI notes, repeat intent, reminders, duplicate/restore, and 30-day deleted retention.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-1">
            <Tab active={tab === "active"} onClick={() => setTab("active")}>Active</Tab>
            <Tab active={tab === "deleted"} onClick={() => setTab("deleted")}>Recently Deleted</Tab>
          </div>
          <button onClick={() => setOpen(true)} className="jj-surface-emerald allow-white inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white border border-white/20 hover:-translate-y-0.5 hover:brightness-110 transition-all" data-surface="emerald">
            <Plus className="h-4 w-4" /> New event
          </button>
        </div>
      </header>

      {tab === "active" ? (
        <>
          <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/25 overflow-hidden shadow-[0_24px_70px_-48px_rgba(26,26,26,.65)]">
            <div className="jj-surface-emerald allow-white flex items-center justify-between px-4 py-3 border-b border-white/15 text-white" data-surface="emerald">
              <div className="flex items-center gap-2">
                <button onClick={() => setCursor(addMonths(cursor, -1))} className="allow-white px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/18 text-white">←</button>
                <span className="text-base md:text-lg font-bold min-w-[180px] text-center text-white">{cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}</span>
                <button onClick={() => setCursor(addMonths(cursor, 1))} className="allow-white px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/18 text-white">→</button>
              </div>
              <button onClick={() => setCursor(startOfMonth(new Date()))} className="allow-white text-xs px-3 py-1.5 rounded-lg border border-white/25 bg-white/10 text-white hover:bg-white/18">Today</button>
            </div>
            <div className="grid grid-cols-7 text-[10px] uppercase tracking-wider text-white bg-[#064E3B] border-b border-white/10">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="px-2 py-2.5 text-center font-bold">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {grid.map((d, i) => {
                const todayKey = d?.toDateString();
                const list = (todayKey ? eventsByDay.get(todayKey) : []) ?? [];
                const isToday = d && d.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className={`min-h-[128px] border-r border-b border-[#B89555]/12 p-2 ${isToday ? "bg-[#EAF4EE]" : "bg-white/55"}`}>
                    {d && <>
                      <div className={`mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full text-base font-bold tabular-nums ${isToday ? "jj-surface-emerald allow-white text-white" : "text-[#1A1A1A]"}`}>{d.getDate()}</div>
                      <div className="space-y-1.5">
                        {list.map((e) => (
                          <div key={e.id} className="group jj-surface-emerald allow-white text-white text-[11px] px-2 py-1.5 rounded-lg flex items-center justify-between gap-1 shadow-[0_8px_16px_-12px_rgba(6,78,59,.8)]" data-surface="emerald">
                            <span className="truncate text-white" title={e.title}>{e.title}</span>
                            <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => duplicate(e)} title="Duplicate"><Copy className="h-3 w-3 text-white" /></button>
                              <button onClick={() => softDelete.mutate(e.id)} title="Delete"><Trash2 className="h-3 w-3 text-white" /></button>
                            </span>
                          </div>
                        ))}
                      </div>
                    </>}
                  </div>
                );
              })}
            </div>
          </div>

          <section>
            <h2 className="text-sm font-semibold mb-3 text-[#1A1A1A]">Upcoming this month</h2>
            <EventList events={events.data ?? []} onDelete={(id) => softDelete.mutate(id)} onDuplicate={duplicate} />
          </section>
        </>
      ) : (
        <section className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/25 overflow-hidden">
          {(deleted.data ?? []).length === 0 ? <p className="p-10 text-center text-sm text-[#1A1A1A]/60">Deleted events will stay here for 30 days.</p> :
            (deleted.data ?? []).map((e) => (
              <div key={e.id} className="px-4 py-3 flex items-center gap-3 border-b border-[#B89555]/15 last:border-b-0">
                <CalendarDays className="h-4 w-4 text-[color:var(--emerald-1)]" />
                <div className="min-w-0 flex-1"><div className="text-sm font-semibold text-[#1A1A1A] truncate">{e.title}</div><div className="text-[11px] text-[#1A1A1A]/55">Deleted {e.deleted_at ? new Date(e.deleted_at).toLocaleString() : "recently"}</div></div>
                <button onClick={() => restore.mutate(e.id)} className="text-xs px-3 py-1.5 rounded-lg bg-[#EFE6D6] border border-[#B89555]/35 text-[#1A1A1A] hover:bg-[#E6DAC2] inline-flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Restore</button>
                <button onClick={() => hardDelete.mutate(e.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100">Delete forever</button>
              </div>
            ))}
        </section>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-[#FDFBF7] rounded-2xl border border-[#B89555]/35 p-5 w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto jj-scrollbar-gold shadow-[0_30px_90px_-48px_rgba(0,0,0,.8)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4"><div><h3 className="text-lg font-bold text-[#1A1A1A]">New event</h3><p className="text-xs text-[#1A1A1A]/60">Tell AI what you need, choose date/month/year, repetition and reminders.</p></div><button onClick={closeModal} className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]">✕</button></div>
            <div className="grid md:grid-cols-2 gap-3">
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" className="md:col-span-2 w-full border border-[#B89555]/25 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[color:var(--emerald-1)]" />
              <label className="block text-xs font-semibold text-[#1A1A1A]">Start<input type="datetime-local" value={draft.starts_at} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value, ends_at: draft.ends_at || e.target.value })} className="w-full border border-[#B89555]/25 rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-[color:var(--emerald-1)]" /></label>
              <label className="block text-xs font-semibold text-[#1A1A1A]">End<input type="datetime-local" value={draft.ends_at} onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })} className="w-full border border-[#B89555]/25 rounded-xl px-3 py-2.5 text-sm mt-1 focus:outline-none focus:border-[color:var(--emerald-1)]" /></label>
              <input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="Location (optional)" className="w-full border border-[#B89555]/25 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[color:var(--emerald-1)]" />
              <select value={draft.repeat} onChange={(e) => setDraft({ ...draft, repeat: e.target.value })} className="w-full border border-[#B89555]/25 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[color:var(--emerald-1)]"><option value="none">Does not repeat</option><option value="daily">Repeat daily</option><option value="weekly">Repeat weekly</option><option value="monthly">Repeat monthly</option><option value="yearly">Repeat yearly</option></select>
              <select value={draft.reminder} onChange={(e) => setDraft({ ...draft, reminder: e.target.value })} className="w-full border border-[#B89555]/25 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[color:var(--emerald-1)]"><option value="email_10">Email reminder 10 minutes before</option><option value="email_30">Email reminder 30 minutes before</option><option value="email_60">Email reminder 1 hour before</option><option value="email_1440">Email reminder 1 day before</option></select>
              <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Notes" className="md:col-span-2 w-full min-h-20 border border-[#B89555]/25 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[color:var(--emerald-1)]" />
              <label className="md:col-span-2 block text-xs font-semibold text-[#1A1A1A]"><span className="inline-flex items-center gap-1"><Bot className="h-3.5 w-3.5 text-[color:var(--emerald-1)]" /> AI instruction</span><textarea value={draft.ai_instruction} onChange={(e) => setDraft({ ...draft, ai_instruction: e.target.value })} placeholder="Example: remind me every first Monday to follow up active investors" className="mt-1 w-full min-h-20 border border-[#B89555]/25 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[color:var(--emerald-1)]" /></label>
            </div>
            <div className="flex justify-end gap-2 mt-5"><button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm border border-[#B89555]/30 bg-[#FDFBF7] hover:bg-[#EFE6D6]">Cancel</button><button onClick={submit} className="jj-surface-emerald allow-white px-4 py-2 rounded-xl text-sm font-semibold text-white border border-white/20 hover:-translate-y-0.5 hover:brightness-110" data-surface="emerald"><Bell className="inline h-4 w-4 mr-1" /> Create</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${active ? "jj-surface-emerald allow-white text-white border border-white/20" : "text-[#1A1A1A]/70 hover:bg-[#EFE6D6]"}`}>{children}</button>;
}

function EventList({ events, onDelete, onDuplicate }: { events: BrokerEvent[]; onDelete: (id: string) => void; onDuplicate: (e: BrokerEvent) => void }) {
  return <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 divide-y divide-[#B89555]/15 overflow-hidden">
    {events.length === 0 && <p className="p-6 text-center text-xs text-[#1A1A1A]/60">No events.</p>}
    {events.map((e) => <div key={e.id} className="px-4 py-3 flex items-center gap-4"><div className="text-xs font-medium tabular-nums w-32 text-[#1A1A1A]">{new Date(e.starts_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div><div className="flex-1 min-w-0"><div className="text-sm font-semibold text-[#1A1A1A] truncate">{e.title}</div>{e.location && <div className="text-xs text-[#1A1A1A]/60 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {e.location}</div>}</div><button onClick={() => onDuplicate(e)} className="p-1.5 rounded hover:bg-[#EFE6D6] text-[color:var(--emerald-1)]"><Copy className="h-3.5 w-3.5" /></button><button onClick={() => onDelete(e.id)} className="p-1.5 rounded hover:bg-red-50 text-[#1A1A1A]/60 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></div>)}
  </div>;
}
