import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  Bookmark,
  CalendarClock,
  CheckSquare,
  ChevronRight,
  Clock,
  Filter,
  Flag,
  Handshake,
  Inbox,
  Mail,
  MessageSquare,
  Phone,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Target,
  UserCircle2,
  Zap,
} from "lucide-react";

/**
 * Phase 13 — Workqueue + SalesSignals.
 * Zoho-parity three-column: filter rail | signals stream | detail preview.
 */

type Priority = "high" | "medium" | "low";
type SignalType = "email" | "call" | "meeting" | "task" | "web" | "chat" | "deal";

interface Signal {
  id: string;
  type: SignalType;
  title: string;
  who: string;
  record: string;
  recordType: "Lead" | "Contact" | "Deal" | "Account";
  time: string;
  priority: Priority;
  unread?: boolean;
  starred?: boolean;
  snippet: string;
}

const SIGNALS: Signal[] = [
  { id: "s1", type: "email", title: "Reply received — Marina Penthouse offer", who: "Aisha Al Mansoori", record: "Marina Vista PH-1201", recordType: "Deal", time: "2m ago", priority: "high", unread: true, snippet: "Thanks for the revised terms. We're happy to proceed at AED 8.4M subject to inspection…" },
  { id: "s2", type: "web", title: "Visitor returned — viewed 3 pages", who: "Rajesh Kapoor", record: "Rajesh Kapoor", recordType: "Lead", time: "8m ago", priority: "high", unread: true, snippet: "Viewed: Palm Jumeirah Villa · Payment Plans · Contact — session 4:12" },
  { id: "s3", type: "call", title: "Missed call · 3 rings", who: "Sophie Laurent", record: "Sophie Laurent", recordType: "Contact", time: "22m ago", priority: "medium", unread: true, snippet: "Inbound call from +33 6 12 34 56 78 — voicemail available" },
  { id: "s4", type: "meeting", title: "Meeting starts in 25 minutes", who: "Vincent Zhou", record: "Downtown Boulevard Tower", recordType: "Deal", time: "in 25m", priority: "high", snippet: "Site visit — Downtown Boulevard Tower · 4:00 PM · with Vincent Zhou" },
  { id: "s5", type: "task", title: "Follow-up due today — send brochure pack", who: "You", record: "Emirates Hills E-14", recordType: "Deal", time: "Today", priority: "medium", snippet: "Send updated brochure pack + payment schedule PDF" },
  { id: "s6", type: "chat", title: "New WhatsApp — asking about handover", who: "Omar Bin Zayed", record: "Omar Bin Zayed", recordType: "Lead", time: "1h ago", priority: "medium", snippet: "Salaam, when is the expected handover for the Creek Harbour unit?" },
  { id: "s7", type: "deal", title: "Deal stage moved to Negotiation", who: "System", record: "Business Bay Loft B-908", recordType: "Deal", time: "2h ago", priority: "low", snippet: "Stage: Proposal → Negotiation · Amount AED 3.2M · Owner: you" },
  { id: "s8", type: "email", title: "Bounce — invalid mailbox", who: "Mail delivery", record: "Prospect batch #414", recordType: "Lead", time: "3h ago", priority: "low", snippet: "3 addresses failed permanently. Cleanup suggested." },
  { id: "s9", type: "web", title: "New form submission — Investor pack", who: "Hana Ito", record: "Hana Ito", recordType: "Lead", time: "4h ago", priority: "high", unread: true, snippet: "Requested: Off-plan investor pack · Budget AED 5–8M · Preference: Palm/Marina" },
];

const FILTERS: Array<{ id: string; label: string; icon: any; count?: number }> = [
  { id: "all", label: "All Signals", icon: Radio, count: SIGNALS.length },
  { id: "unread", label: "Unread", icon: Inbox, count: SIGNALS.filter((s) => s.unread).length },
  { id: "priority", label: "High Priority", icon: Flag, count: SIGNALS.filter((s) => s.priority === "high").length },
  { id: "email", label: "Email", icon: Mail, count: SIGNALS.filter((s) => s.type === "email").length },
  { id: "call", label: "Calls", icon: Phone, count: SIGNALS.filter((s) => s.type === "call").length },
  { id: "meeting", label: "Meetings", icon: CalendarClock, count: SIGNALS.filter((s) => s.type === "meeting").length },
  { id: "task", label: "Tasks", icon: CheckSquare, count: SIGNALS.filter((s) => s.type === "task").length },
  { id: "web", label: "Website Visits", icon: Activity, count: SIGNALS.filter((s) => s.type === "web").length },
  { id: "chat", label: "Chats", icon: MessageSquare, count: SIGNALS.filter((s) => s.type === "chat").length },
  { id: "starred", label: "Starred", icon: Star },
];

const TYPE_ICON: Record<SignalType, any> = {
  email: Mail, call: Phone, meeting: CalendarClock, task: CheckSquare, web: Activity, chat: MessageSquare, deal: Handshake,
};

const RECORD_ICON = { Lead: Target, Contact: UserCircle2, Deal: Handshake, Account: Bookmark } as const;

export default function CrmWorkqueue() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(SIGNALS[0].id);

  const filtered = useMemo(() => {
    return SIGNALS.filter((s) => {
      if (filter === "unread" && !s.unread) return false;
      if (filter === "priority" && s.priority !== "high") return false;
      if (filter === "starred" && !s.starred) return false;
      if (["email", "call", "meeting", "task", "web", "chat"].includes(filter) && s.type !== filter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return s.title.toLowerCase().includes(q) || s.who.toLowerCase().includes(q) || s.record.toLowerCase().includes(q);
      }
      return true;
    });
  }, [filter, query]);

  const selected = filtered.find((s) => s.id === selectedId) ?? filtered[0];

  return (
    <div className="jc-wq" data-no-contrast-guard>
      {/* Filter rail */}
      <aside className="jc-wq-rail">
        <div className="jc-wq-rail-head">
          <Sparkles size={14} />
          <span>SalesSignals</span>
        </div>
        <button type="button" className="jc-wq-configure">
          <Zap size={13} /> Configure signals
        </button>
        <nav className="jc-wq-filters" aria-label="Signal filters">
          {FILTERS.map((f) => {
            const Icon = f.icon;
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                className={`jc-wq-filter${active ? " is-active" : ""}`}
                onClick={() => setFilter(f.id)}
              >
                <Icon size={14} />
                <span className="jc-wq-filter-label">{f.label}</span>
                {typeof f.count === "number" && (
                  <span className="jc-wq-filter-count">{f.count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="jc-wq-rail-head" style={{ marginTop: 18 }}>
          <Bell size={14} />
          <span>My Alerts</span>
        </div>
        <ul className="jc-wq-alerts">
          <li><AlertCircle size={13} /> 3 deals need follow-up</li>
          <li><Clock size={13} /> 2 tasks overdue</li>
          <li><Flag size={13} /> 1 SLA at risk</li>
        </ul>
      </aside>

      {/* Signals stream */}
      <section className="jc-wq-stream">
        <header className="jc-wq-toolbar">
          <div className="jc-wq-title">
            <h1>Workqueue</h1>
            <span className="jc-wq-sub">Prioritized signals across your customer base</span>
          </div>
          <div className="jc-wq-actions">
            <div className="jc-wq-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search signals"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search signals"
              />
            </div>
            <button type="button" className="jc-wq-icon-btn" aria-label="Filter"><Filter size={15} /></button>
            <button type="button" className="jc-wq-icon-btn" aria-label="Refresh"><RefreshCw size={15} /></button>
          </div>
        </header>

        <ul className="jc-wq-list" role="list">
          {filtered.map((s) => {
            const Icon = TYPE_ICON[s.type];
            const active = selected?.id === s.id;
            return (
              <li
                key={s.id}
                className={`jc-wq-item${active ? " is-active" : ""}${s.unread ? " is-unread" : ""}`}
                onClick={() => setSelectedId(s.id)}
                role="button"
                tabIndex={0}
              >
                <div className={`jc-wq-item-icon jc-wq-icon-${s.type}`}>
                  <Icon size={15} />
                </div>
                <div className="jc-wq-item-body">
                  <div className="jc-wq-item-top">
                    <span className="jc-wq-item-title">{s.title}</span>
                    <span className="jc-wq-item-time">{s.time}</span>
                  </div>
                  <div className="jc-wq-item-mid">
                    <span className="jc-wq-item-who">{s.who}</span>
                    <span className="jc-wq-dot">·</span>
                    <span className="jc-wq-item-record">{s.record}</span>
                    <span className={`jc-wq-prio jc-wq-prio-${s.priority}`}>{s.priority}</span>
                  </div>
                  <p className="jc-wq-item-snippet">{s.snippet}</p>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="jc-wq-empty">No signals match this filter.</li>
          )}
        </ul>
      </section>

      {/* Detail preview */}
      <aside className="jc-wq-detail">
        {selected ? (
          <>
            <header className="jc-wq-detail-head">
              <div className={`jc-wq-item-icon jc-wq-icon-${selected.type}`} style={{ width: 38, height: 38 }}>
                {(() => { const I = TYPE_ICON[selected.type]; return <I size={18} />; })()}
              </div>
              <div>
                <h2>{selected.title}</h2>
                <div className="jc-wq-detail-sub">
                  {selected.who} · <span className="jc-wq-detail-time">{selected.time}</span>
                </div>
              </div>
            </header>

            <div className="jc-wq-record-card">
              <div className="jc-wq-record-label">Linked {selected.recordType}</div>
              <div className="jc-wq-record-name">
                {(() => { const R = RECORD_ICON[selected.recordType]; return <R size={15} />; })()}
                <span>{selected.record}</span>
                <button type="button" className="jc-wq-open" aria-label="Open record">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="jc-wq-detail-body">
              <p>{selected.snippet}</p>
            </div>

            <div className="jc-wq-detail-actions">
              <button type="button" className="jc-wq-primary">
                <ArrowRight size={14} /> Take action
              </button>
              <button type="button" className="jc-wq-secondary">Assign</button>
              <button type="button" className="jc-wq-secondary">Snooze</button>
              <button type="button" className="jc-wq-secondary">Mark done</button>
            </div>

            <div className="jc-wq-timeline">
              <div className="jc-wq-timeline-head">Recent activity on this record</div>
              <ol>
                <li><Mail size={12} /> Email sent · 1d ago</li>
                <li><Phone size={12} /> Call logged · 2d ago</li>
                <li><Handshake size={12} /> Stage: Proposal · 4d ago</li>
                <li><UserCircle2 size={12} /> Owner assigned · 6d ago</li>
              </ol>
            </div>
          </>
        ) : (
          <div className="jc-wq-empty">Select a signal to preview.</div>
        )}
      </aside>
    </div>
  );
}
