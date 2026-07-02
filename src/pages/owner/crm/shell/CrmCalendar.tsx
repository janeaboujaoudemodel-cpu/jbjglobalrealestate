import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Plus, Video, Phone, CheckSquare,
  CalendarDays, Users, Filter, MapPin, Clock,
} from "lucide-react";

type ViewMode = "month" | "week" | "day" | "agenda";
type EventKind = "meeting" | "call" | "task";

type CrmEvent = {
  id: string;
  title: string;
  kind: EventKind;
  start: Date;
  end: Date;
  with?: string;
  location?: string;
};

const KIND_META: Record<EventKind, { label: string; icon: any; color: string; bg: string }> = {
  meeting: { label: "Meeting", icon: Video, color: "#FFFFFF", bg: "#064E3B" },
  call:    { label: "Call",    icon: Phone, color: "#FFFFFF", bg: "#064E3B" },
  task:    { label: "Task",    icon: CheckSquare, color: "#FFFFFF", bg: "#064E3B" },
};

const now = new Date();
const at = (dayOffset: number, h: number, m = 0, dur = 60): [Date, Date] => {
  const s = new Date(now); s.setDate(now.getDate() + dayOffset); s.setHours(h, m, 0, 0);
  const e = new Date(s); e.setMinutes(e.getMinutes() + dur);
  return [s, e];
};

const seed: CrmEvent[] = (() => {
  const items: Array<Omit<CrmEvent, "start" | "end"> & { d: number; h: number; m?: number; dur?: number }> = [
    { id: "e1", title: "Palm Jumeirah tour — Al Fardan family", kind: "meeting", with: "Rania Al Fardan", location: "Palm Sales Gallery", d: 0, h: 10 },
    { id: "e2", title: "Follow-up call — Emaar Beachfront lead", kind: "call", with: "Omar Haddad", d: 0, h: 14, dur: 30 },
    { id: "e3", title: "Prepare Bulgari Lighthouse deck", kind: "task", d: 0, h: 16, dur: 90 },
    { id: "e4", title: "Investor briefing — Riyadh cohort", kind: "meeting", with: "Lina Karam", location: "Zoom", d: 1, h: 11 },
    { id: "e5", title: "Handover walkthrough — Vida T2 4802", kind: "meeting", with: "Amanda Clarke", location: "Marina Vista", d: 2, h: 9, dur: 90 },
    { id: "e6", title: "Contract review — Jumeirah Bay Villa 12", kind: "task", d: 2, h: 15 },
    { id: "e7", title: "Weekly pipeline review", kind: "meeting", d: 3, h: 10, dur: 45 },
    { id: "e8", title: "Cold outreach — Q1 investors", kind: "call", d: 4, h: 13, dur: 45 },
    { id: "e9", title: "Emaar quarterly forecast finalize", kind: "task", d: 5, h: 11, dur: 120 },
    { id: "e10", title: "Client tour — Bulgari Lighthouse", kind: "meeting", with: "Rania Al Fardan", location: "Jumeirah Bay", d: 6, h: 10 },
  ];
  return items.map((it) => {
    const [start, end] = at(it.d, it.h, it.m ?? 0, it.dur ?? 60);
    return { id: it.id, title: it.title, kind: it.kind, with: it.with, location: it.location, start, end };
  });
})();

const monthLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
const dayNumber = (d: Date) => d.getDate();
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const timeLabel = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function buildMonthGrid(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startOffset = first.getDay(); // 0 Sun
  const start = new Date(first); start.setDate(first.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d;
  });
}

function buildWeek(anchor: Date): Date[] {
  const start = new Date(anchor); start.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); d.setHours(0, 0, 0, 0); return d;
  });
}

export default function CrmCalendar() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [filter, setFilter] = useState<Record<EventKind, boolean>>({ meeting: true, call: true, task: true });

  const events = useMemo(() => seed.filter((e) => filter[e.kind]), [filter]);

  const step = (dir: number) => {
    const d = new Date(anchor);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setAnchor(d);
  };

  const headerLabel = view === "month"
    ? monthLabel(anchor)
    : view === "week"
      ? (() => { const w = buildWeek(anchor); return `${w[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${w[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`; })()
      : anchor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const eventsOn = (d: Date) => events.filter((e) => sameDay(e.start, d)).sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <div className="jc-cal">
      <aside className="jc-cal__rail">
        <button type="button" className="jc-cal__create" onClick={() => navigate("/owner/crm/jbj/meetings/new")}>
          <Plus size={15} /> Create
        </button>
        <div className="jc-cal__mini">
          <div className="jc-cal__mini-head">
            <button type="button" onClick={() => step(-1)} aria-label="Prev"><ChevronLeft size={14} /></button>
            <span>{monthLabel(anchor)}</span>
            <button type="button" onClick={() => step(1)} aria-label="Next"><ChevronRight size={14} /></button>
          </div>
          <div className="jc-cal__mini-grid">
            {["S","M","T","W","T","F","S"].map((d, i) => <span key={i} className="jc-cal__mini-dow">{d}</span>)}
            {buildMonthGrid(anchor).map((d) => {
              const isMonth = d.getMonth() === anchor.getMonth();
              const isToday = sameDay(d, new Date());
              const hasEvents = eventsOn(d).length > 0;
              return (
                <button key={d.toISOString()} type="button" className="jc-cal__mini-day" data-muted={!isMonth} data-today={isToday} onClick={() => { setAnchor(d); setView("day"); }}>
                  {d.getDate()}
                  {hasEvents && <span className="jc-cal__mini-dot" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="jc-cal__section-title"><Filter size={13} /> Show</div>
        {(Object.keys(KIND_META) as EventKind[]).map((k) => {
          const meta = KIND_META[k];
          const Icon = meta.icon;
          return (
            <label key={k} className="jc-cal__toggle">
              <input type="checkbox" checked={filter[k]} onChange={(e) => setFilter({ ...filter, [k]: e.target.checked })} />
              <span className="jc-cal__swatch" style={{ background: meta.bg, color: meta.color }}><Icon size={12} strokeWidth={2.2} /></span>
              <span>{meta.label}s</span>
            </label>
          );
        })}

        <div className="jc-cal__section-title"><Users size={13} /> Calendars</div>
        <label className="jc-cal__toggle"><input type="checkbox" defaultChecked /><span className="jc-cal__swatch jc-cal__swatch--emerald" /><span>My Calendar</span></label>
        <label className="jc-cal__toggle"><input type="checkbox" defaultChecked /><span className="jc-cal__swatch jc-cal__swatch--gold" /><span>Team · Sales Dubai</span></label>
        <label className="jc-cal__toggle"><input type="checkbox" /><span className="jc-cal__swatch jc-cal__swatch--slate" /><span>Marketing Ops</span></label>
      </aside>

      <section className="jc-cal__main">
        <header className="jc-cal__toolbar">
          <div className="jc-cal__nav">
            <button type="button" className="jc-cal__today" onClick={() => setAnchor(new Date())}>Today</button>
            <button type="button" onClick={() => step(-1)} aria-label="Prev"><ChevronLeft size={16} /></button>
            <button type="button" onClick={() => step(1)} aria-label="Next"><ChevronRight size={16} /></button>
            <h2 className="jc-cal__title"><CalendarDays size={17} /> {headerLabel}</h2>
          </div>
          <div className="jc-cal__view-switch" role="tablist">
            {(["day","week","month","agenda"] as ViewMode[]).map((v) => (
              <button key={v} type="button" data-active={view === v} onClick={() => setView(v)}>{v[0].toUpperCase() + v.slice(1)}</button>
            ))}
          </div>
        </header>

        {view === "month" && <MonthGrid anchor={anchor} eventsOn={eventsOn} />}
        {view === "week"  && <WeekGrid anchor={anchor} eventsOn={eventsOn} />}
        {view === "day"   && <DayList date={anchor} events={eventsOn(anchor)} />}
        {view === "agenda" && <AgendaList events={events} />}
      </section>
    </div>
  );
}

function MonthGrid({ anchor, eventsOn }: { anchor: Date; eventsOn: (d: Date) => CrmEvent[] }) {
  const days = buildMonthGrid(anchor);
  return (
    <div className="jc-cal__month">
      <div className="jc-cal__month-head">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="jc-cal__month-grid">
        {days.map((d) => {
          const isMonth = d.getMonth() === anchor.getMonth();
          const isToday = sameDay(d, new Date());
          const list = eventsOn(d);
          return (
            <div key={d.toISOString()} className="jc-cal__month-cell" data-muted={!isMonth}>
              <div className="jc-cal__month-date" data-today={isToday}>{dayNumber(d)}</div>
              <div className="jc-cal__month-events">
                {list.slice(0, 3).map((e) => {
                  const meta = KIND_META[e.kind];
                  return (
                    <div key={e.id} className="jc-cal__chip" style={{ background: meta.bg, color: meta.color }}>
                      <span className="jc-cal__chip-time">{timeLabel(e.start)}</span>
                      <span className="jc-cal__chip-title">{e.title}</span>
                    </div>
                  );
                })}
                {list.length > 3 && <div className="jc-cal__more">+{list.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({ anchor, eventsOn }: { anchor: Date; eventsOn: (d: Date) => CrmEvent[] }) {
  const week = buildWeek(anchor);
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am–7pm
  return (
    <div className="jc-cal__week">
      <div className="jc-cal__week-head">
        <span />
        {week.map((d) => (
          <div key={d.toISOString()} className="jc-cal__week-dow" data-today={sameDay(d, new Date())}>
            <span>{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
            <b>{d.getDate()}</b>
          </div>
        ))}
      </div>
      <div className="jc-cal__week-body">
        <div className="jc-cal__week-hours">
          {hours.map((h) => <div key={h} className="jc-cal__week-hour">{h > 12 ? h - 12 : h} {h >= 12 ? "PM" : "AM"}</div>)}
        </div>
        {week.map((d) => {
          const list = eventsOn(d);
          return (
            <div key={d.toISOString()} className="jc-cal__week-col">
              {hours.map((h) => <div key={h} className="jc-cal__week-slot" />)}
              {list.map((e) => {
                const meta = KIND_META[e.kind];
                const startMin = (e.start.getHours() - 8) * 60 + e.start.getMinutes();
                const durMin = (e.end.getTime() - e.start.getTime()) / 60000;
                const top = (startMin / 60) * 48;
                const height = Math.max(28, (durMin / 60) * 48 - 2);
                if (startMin < 0 || startMin > 11 * 60) return null;
                return (
                  <div key={e.id} className="jc-cal__week-event" style={{ top, height, background: meta.bg, color: meta.color, borderLeftColor: meta.color }}>
                    <div className="jc-cal__week-event-title">{e.title}</div>
                    <div className="jc-cal__week-event-time">{timeLabel(e.start)} – {timeLabel(e.end)}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayList({ date, events }: { date: Date; events: CrmEvent[] }) {
  return (
    <div className="jc-cal__day">
      <div className="jc-cal__day-head">{date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
      {events.length === 0 ? (
        <div className="jc-cal__empty">Nothing scheduled for this day.</div>
      ) : (
        <ul className="jc-cal__day-list">
          {events.map((e) => {
            const meta = KIND_META[e.kind];
            const Icon = meta.icon;
            return (
              <li key={e.id} className="jc-cal__day-item">
                <div className="jc-cal__day-time"><Clock size={13} /> {timeLabel(e.start)}<br /><span>{timeLabel(e.end)}</span></div>
                <div className="jc-cal__day-badge" style={{ background: meta.bg, color: meta.color }}><Icon size={14} strokeWidth={2.1} /></div>
                <div className="jc-cal__day-body">
                  <div className="jc-cal__day-title">{e.title}</div>
                  <div className="jc-cal__day-meta">
                    {e.with && <><Users size={12} /> {e.with}</>}
                    {e.location && <><MapPin size={12} /> {e.location}</>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AgendaList({ events }: { events: CrmEvent[] }) {
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  return (
    <div className="jc-cal__agenda">
      {sorted.map((e) => {
        const meta = KIND_META[e.kind];
        const Icon = meta.icon;
        return (
          <div key={e.id} className="jc-cal__agenda-row">
            <div className="jc-cal__agenda-date">
              <b>{e.start.toLocaleDateString("en-US", { weekday: "short" })}</b>
              <span>{e.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
            <div className="jc-cal__agenda-badge" style={{ background: meta.bg, color: meta.color }}><Icon size={14} /></div>
            <div className="jc-cal__agenda-body">
              <div className="jc-cal__agenda-title">{e.title}</div>
              <div className="jc-cal__agenda-meta">{timeLabel(e.start)} – {timeLabel(e.end)}{e.with ? ` · ${e.with}` : ""}{e.location ? ` · ${e.location}` : ""}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
