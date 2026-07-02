import { useEffect, useRef, useState } from "react";
import { Bell, Check, MessageSquare, Target, Handshake, CalendarDays, FileText, type LucideIcon } from "lucide-react";

type Notif = {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  tone: "lead" | "deal" | "meeting" | "task" | "message";
};

const SEED: Notif[] = [
  { id: "n1", icon: Target, tone: "lead", title: "New lead assigned", body: "Amelia Rahman — Dubai Marina · Qualified", time: "2m ago", unread: true },
  { id: "n2", icon: Handshake, tone: "deal", title: "Deal moved to Negotiation", body: "Bugatti Residences PH · AED 18.9M", time: "24m ago", unread: true },
  { id: "n3", icon: CalendarDays, tone: "meeting", title: "Meeting starting soon", body: "Site Visit — Emaar Beachfront · 11:00 GST", time: "1h ago", unread: true },
  { id: "n4", icon: MessageSquare, tone: "message", title: "Fatima Khoury replied", body: '"Confirmed for tomorrow at 3 PM"', time: "3h ago", unread: false },
  { id: "n5", icon: FileText, tone: "task", title: "Task overdue", body: "Send LOI to Damac", time: "Yesterday", unread: false },
];

type Props = { open: boolean; onClose: () => void };

export default function CrmNotificationsPanel({ open, onClose }: Props) {
  const [items, setItems] = useState<Notif[]>(SEED);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const filtered = tab === "unread" ? items.filter((i) => i.unread) : items;
  const unreadCount = items.filter((i) => i.unread).length;

  const markAll = () => setItems((s) => s.map((i) => ({ ...i, unread: false })));
  const mark = (id: string) => setItems((s) => s.map((i) => (i.id === id ? { ...i, unread: false } : i)));

  return (
    <div className="jc-popover jc-popover--notif" ref={ref} role="dialog" aria-label="Notifications">
      <div className="jc-notif__head">
        <div className="jc-notif__title">
          <Bell size={16} />
          Notifications
          {unreadCount > 0 && <span className="jc-notif__count">{unreadCount}</span>}
        </div>
        <button type="button" className="jc-notif__mark" onClick={markAll}>
          <Check size={13} /> Mark all read
        </button>
      </div>
      <div className="jc-notif__tabs">
        <button type="button" className={`jc-notif__tab${tab === "all" ? " is-active" : ""}`} onClick={() => setTab("all")}>All</button>
        <button type="button" className={`jc-notif__tab${tab === "unread" ? " is-active" : ""}`} onClick={() => setTab("unread")}>Unread</button>
      </div>
      <ul className="jc-notif__list">
        {filtered.length === 0 && <li className="jc-notif__empty">You're all caught up.</li>}
        {filtered.map((n) => {
          const Icon = n.icon;
          return (
            <li key={n.id} className={`jc-notif__item${n.unread ? " is-unread" : ""}`}>
              <button type="button" className="jc-notif__row" onClick={() => mark(n.id)}>
                <span className={`jc-notif__icon jc-notif__icon--${n.tone}`}>
                  <Icon size={15} />
                </span>
                <span className="jc-notif__body">
                  <span className="jc-notif__row-title">{n.title}</span>
                  <span className="jc-notif__row-sub">{n.body}</span>
                  <span className="jc-notif__row-time">{n.time}</span>
                </span>
                {n.unread && <span className="jc-notif__dot" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="jc-notif__foot">
        <button type="button" className="jc-notif__view">View all notifications</button>
      </div>
    </div>
  );
}
