import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Filter,
  Megaphone,
  Phone,
  Plus,
  RefreshCw,
  Settings2,
  SlidersHorizontal,
  UserRound,
  type LucideIcon,
  Users,
  Wallet,
} from "lucide-react";

/**
 * JBJ CRM — Workqueue (two-pane).
 * Left: My Open Activity (Tasks/Meetings/Calls) + My Workqueue grouped by
 * Campaigns / Contacts / Leads / Deals. Right: selected queue table.
 * Structural parity with Zoho's Workqueue; JBJ palette + tokens only.
 */

type QueueKey =
  | "tasks"
  | "meetings"
  | "calls"
  | "campaigns:active"
  | "contacts:assigned"
  | "contacts:my"
  | "leads:assigned"
  | "leads:my"
  | "deals:closing"
  | "deals:my";

type QueueDef = {
  id: QueueKey;
  label: string;
  icon: LucideIcon;
  count: number;
  columns: string[];
};

const OPEN_ACTIVITY: QueueDef[] = [
  { id: "tasks",    label: "Tasks",    icon: CheckSquare,  count: 0, columns: ["Subject", "Due Date", "Status", "Priority"] },
  { id: "meetings", label: "Meetings", icon: CalendarDays, count: 0, columns: ["Title", "From", "To", "Location"] },
  { id: "calls",    label: "Calls",    icon: Phone,        count: 0, columns: ["Subject", "Call Type", "Start Time", "Duration"] },
];

const WORKQUEUE_GROUPS: { title: string; items: QueueDef[] }[] = [
  {
    title: "Campaigns",
    items: [
      { id: "campaigns:active", label: "My Active Campaigns", icon: Megaphone, count: 0, columns: ["Campaign", "Status", "Start", "End"] },
    ],
  },
  {
    title: "Contacts",
    items: [
      { id: "contacts:assigned", label: "Contacts assigned in last 3 hours", icon: UserRound, count: 0, columns: ["Name", "Account", "Email", "Phone"] },
      { id: "contacts:my",       label: "My Contacts",                        icon: UserRound, count: 0, columns: ["Name", "Account", "Email", "Phone"] },
    ],
  },
  {
    title: "Leads",
    items: [
      { id: "leads:assigned", label: "Leads assigned in last 3 hours", icon: Users, count: 0, columns: ["Name", "Company", "Email", "Phone"] },
      { id: "leads:my",       label: "My Leads",                        icon: Users, count: 0, columns: ["Name", "Company", "Email", "Phone"] },
    ],
  },
  {
    title: "Deals",
    items: [
      { id: "deals:closing", label: "Deals Closing This Month", icon: Wallet, count: 0, columns: ["Deal Name", "Amount", "Stage", "Closing Date"] },
      { id: "deals:my",      label: "My Deals",                  icon: Wallet, count: 0, columns: ["Deal Name", "Amount", "Stage", "Closing Date"] },
    ],
  },
];

const ALL_QUEUES: QueueDef[] = [
  ...OPEN_ACTIVITY,
  ...WORKQUEUE_GROUPS.flatMap((g) => g.items),
];

const RANGES = ["Today & Overdue", "Today", "Tomorrow", "This Week", "This Month", "All"];

export default function CrmWorkqueue() {
  const [range, setRange] = useState(RANGES[0]);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [active, setActive] = useState<QueueKey>("tasks");

  const current = useMemo(() => ALL_QUEUES.find((q) => q.id === active) ?? OPEN_ACTIVITY[0], [active]);

  return (
    <div className="jc-wq" data-no-contrast-guard>
      {/* Page title bar */}
      <div className="jc-wq__title">
        <h1>Workqueue</h1>
        <div className="jc-wq__title-tabs">
          <button type="button" className="jc-wq__tab jc-wq__tab--active">
            <span className="jc-wq__tab-avatar" aria-hidden="true">JBJ</span>
            <div className="jc-wq__tab-text">
              <strong>JBJ GLOBAL REAL EST…</strong>
              <span>CEO</span>
            </div>
          </button>
          <button type="button" className="jc-wq__tab-add" aria-label="Add view"><Plus size={15} /></button>
        </div>
      </div>

      <div className="jc-wq__grid">
        {/* Left rail */}
        <aside className="jc-wq__rail" aria-label="Workqueue navigation">
          <div className="jc-wq__section">
            <div className="jc-wq__section-head">
              <h3>My Open Activity</h3>
            </div>
            <div className="jc-wq__range">
              <button
                type="button"
                className="jc-wq__range-btn"
                aria-haspopup="listbox"
                aria-expanded={rangeOpen}
                onClick={() => setRangeOpen((v) => !v)}
              >
                <span>{range}</span>
                <ChevronDown size={14} />
              </button>
              {rangeOpen && (
                <ul className="jc-wq__range-menu" role="listbox">
                  {RANGES.map((r) => (
                    <li key={r}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={r === range}
                        data-active={r === range}
                        onClick={() => { setRange(r); setRangeOpen(false); }}
                      >
                        {r}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <ul className="jc-wq__list">
              {OPEN_ACTIVITY.map((q) => {
                const Icon = q.icon;
                const isActive = active === q.id;
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      className="jc-wq__row"
                      data-active={isActive}
                      onClick={() => setActive(q.id)}
                    >
                      <span className="jc-wq__row-icon"><Icon size={14} /></span>
                      <span className="jc-wq__row-label">{q.label}</span>
                      <span className="jc-wq__row-count">{q.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="jc-wq__section">
            <div className="jc-wq__section-head jc-wq__section-head--split">
              <h3>My Workqueue</h3>
              <div className="jc-wq__section-tools">
                <button type="button" className="jc-wq__icon-btn" aria-label="Configure workqueue"><Settings2 size={14} /></button>
                <button type="button" className="jc-wq__icon-btn" aria-label="Add workqueue"><Plus size={14} /></button>
              </div>
            </div>
            {WORKQUEUE_GROUPS.map((group) => (
              <div key={group.title} className="jc-wq__group">
                <div className="jc-wq__group-title">{group.title}</div>
                <ul className="jc-wq__list">
                  {group.items.map((q) => {
                    const Icon = q.icon;
                    const isActive = active === q.id;
                    return (
                      <li key={q.id}>
                        <button
                          type="button"
                          className="jc-wq__row"
                          data-active={isActive}
                          onClick={() => setActive(q.id)}
                        >
                          <span className="jc-wq__row-icon"><Icon size={14} /></span>
                          <span className="jc-wq__row-label" title={q.label}>{q.label}</span>
                          <span className="jc-wq__row-count">{q.count}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Right pane */}
        <section className="jc-wq__pane" aria-label={`${current.label} queue`}>
          <header className="jc-wq__pane-head">
            <div className="jc-wq__pane-title">
              <h2>{current.label}</h2>
              <button type="button" className="jc-wq__icon-btn" aria-label="Refresh"><RefreshCw size={14} /></button>
            </div>
            <button type="button" className="jc-wq__filter"><Filter size={13} /> Filter</button>
          </header>

          <div className="jc-wq__table" role="table">
            <div className="jc-wq__thead" role="row">
              {current.columns.map((c) => (
                <div key={c} className="jc-wq__th" role="columnheader">{c}</div>
              ))}
              <div className="jc-wq__th jc-wq__th--tools" role="columnheader">
                <SlidersHorizontal size={13} />
              </div>
            </div>
            <div className="jc-wq__empty">
              No {current.label} found.
            </div>
          </div>

          <footer className="jc-wq__pane-foot">
            <span>Total Records <strong>{current.count}</strong></span>
          </footer>
        </section>
      </div>
    </div>
  );
}
