import { useEffect, useRef, useState } from "react";
import { Bell, Check, MessageSquare, Target, Handshake, CalendarDays, FileText, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Notif = {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  tone: "lead" | "deal" | "meeting" | "task" | "message";
};

/** Real backend notification_type → panel tone/icon. No demo data is ever shown. */
const TONE: Record<string, { tone: Notif["tone"]; icon: LucideIcon }> = {
  new_lead: { tone: "lead", icon: Target },
  deal: { tone: "deal", icon: Handshake },
  meeting: { tone: "meeting", icon: CalendarDays },
  task: { tone: "task", icon: FileText },
  message: { tone: "message", icon: MessageSquare },
};

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

type Props = { open: boolean; onClose: () => void };

export default function CrmNotificationsPanel({ open, onClose }: Props) {
  const [items, setItems] = useState<Notif[]>([]);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id,title,body,notification_type,is_read,created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (cancelled) return;
      setItems(
        (data || []).map((r: any) => {
          const t = TONE[r.notification_type] ?? { tone: "message" as const, icon: Bell };
          return {
            id: r.id,
            icon: t.icon,
            tone: t.tone,
            title: r.title || "Notification",
            body: r.body || "",
            time: relTime(r.created_at),
            unread: !r.is_read,
          };
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);


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
