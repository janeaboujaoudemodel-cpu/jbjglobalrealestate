import { useMemo, useState } from "react";
import {
  Inbox, Star, Send, FileText, AlertCircle, Trash2, Archive, Tag,
  Search, RefreshCw, Reply, ReplyAll, Forward, MoreHorizontal, Paperclip,
  Plus, ChevronDown, Handshake, Target, UserCircle2, Filter,
} from "lucide-react";

type FolderId = "priority" | "inbox" | "starred" | "sent" | "drafts" | "spam" | "trash";

type Message = {
  id: string;
  from: string;
  initials: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  read?: boolean;
  starred?: boolean;
  hasAttachment?: boolean;
  label?: "Deals" | "Leads" | "Contacts";
  folder: FolderId;
  crmLink?: { module: "deals" | "leads" | "contacts"; name: string; value?: string };
};

const FOLDERS: { id: FolderId; label: string; icon: any; count?: number }[] = [
  { id: "priority", label: "Priority", icon: AlertCircle, count: 3 },
  { id: "inbox", label: "Inbox", icon: Inbox, count: 12 },
  { id: "starred", label: "Starred", icon: Star },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: FileText, count: 2 },
  { id: "spam", label: "Spam", icon: AlertCircle },
  { id: "trash", label: "Trash", icon: Trash2 },
];

const MESSAGES: Message[] = [
  {
    id: "m1", from: "Rania Al Fardan", initials: "RA",
    subject: "Palm Jumeirah penthouse — final terms",
    preview: "Circling back on the Frond L unit — client wants to close before end of month at AED 24.5M…",
    body: "Hi Jane,\n\nCircling back on the Frond L penthouse. The Al Fardan family is prepared to move forward at AED 24.5M with a 20% down payment on signing, balance on handover Q1 2026.\n\nCan we get the SPA out today? They fly to Riyadh on Friday.\n\nRegards,\nRania",
    time: "9:42 AM", read: false, starred: true, hasAttachment: true, label: "Deals", folder: "priority",
    crmLink: { module: "deals", name: "Frond L Penthouse", value: "AED 24.5M" },
  },
  {
    id: "m2", from: "Omar Haddad", initials: "OH",
    subject: "Re: Emaar Beachfront T3 — investor questions",
    preview: "Investor is asking about the rental yield projections and expected handover schedule.",
    body: "Jane — the investor wants a written breakdown of expected NET yield and handover milestones. Attaching the current forecast.\n\nOmar",
    time: "8:15 AM", read: false, hasAttachment: true, label: "Leads", folder: "priority",
    crmLink: { module: "leads", name: "Al-Nassar Family Office" },
  },
  {
    id: "m3", from: "Amanda Clarke", initials: "AC",
    subject: "Weekly pipeline summary",
    preview: "New pipeline value up 18% WoW. 3 deals moved to Negotiation, 1 closed-won.",
    body: "Weekly digest attached. Highlights:\n• Pipeline +18% WoW\n• 3 deals → Negotiation\n• 1 closed-won (AED 6.2M)\n• 2 stalled deals need follow-up\n\nAmanda",
    time: "7:03 AM", read: true, label: "Deals", folder: "priority",
  },
  {
    id: "m4", from: "Bulgari Residences", initials: "BR",
    subject: "Lighthouse — new inventory drop",
    preview: "6 new units released in Tower A · penthouse floors 42-45 · pricing enclosed.",
    body: "Please find attached the new inventory release for Bulgari Lighthouse Tower A, floors 42-45. Full price list and availability enclosed.\n\nBulgari Sales Team",
    time: "Yesterday", read: true, hasAttachment: true, label: "Deals", folder: "inbox",
  },
  {
    id: "m5", from: "Lina Karam", initials: "LK",
    subject: "Riyadh cohort — onboarding wrapped",
    preview: "All 6 investors onboarded. Kickoff call scheduled for Tuesday.",
    body: "All 6 investors from the Riyadh cohort have completed onboarding. Kickoff call is Tuesday 11am UAE.\n\nLina",
    time: "Yesterday", read: true, folder: "inbox",
  },
  {
    id: "m6", from: "Marina Vista Sales", initials: "MV",
    subject: "Handover schedule update — T2 4802",
    preview: "Confirming handover moved to Jan 12, 2026. Punch list attached.",
    body: "Confirming Marina Vista T2 · Unit 4802 handover has been rescheduled to January 12, 2026. Punch list attached for pre-inspection.\n\nMarina Vista Sales",
    time: "2 days ago", read: true, hasAttachment: true, label: "Contacts", folder: "inbox",
  },
  {
    id: "m7", from: "Jane Fernandez", initials: "JF",
    subject: "Re: Proposal — Jumeirah Bay Villa 12",
    preview: "Attached the revised proposal with updated payment terms.",
    body: "Attached the revised proposal for Jumeirah Bay Villa 12 with the updated 60/40 payment plan.\n\nJane",
    time: "3 days ago", read: true, folder: "sent",
  },
];

const LABELS = [
  { name: "Deals", color: "#064E3B", bg: "#FDFBF7", icon: Handshake },
  { name: "Leads", color: "#7A5A1E", bg: "#FFF3D6", icon: Target },
  { name: "Contacts", color: "#1F3A63", bg: "#DDE6F5", icon: UserCircle2 },
];

export default function CrmSalesInbox() {
  const [folder, setFolder] = useState<FolderId>("priority");
  const [selectedId, setSelectedId] = useState<string>("m1");
  const [search, setSearch] = useState("");

  const list = useMemo(() => {
    const filtered = MESSAGES.filter((m) => {
      if (folder === "starred") return m.starred;
      return m.folder === folder;
    });
    if (!search) return filtered;
    const q = search.toLowerCase();
    return filtered.filter((m) =>
      m.subject.toLowerCase().includes(q) ||
      m.from.toLowerCase().includes(q) ||
      m.preview.toLowerCase().includes(q)
    );
  }, [folder, search]);

  const selected = MESSAGES.find((m) => m.id === selectedId) ?? list[0];

  return (
    <div className="jc-mail">
      <aside className="jc-mail__rail">
        <button type="button" className="jc-mail__compose">
          <Plus size={15} /> Compose
        </button>

        <div className="jc-mail__section-title">Folders</div>
        <nav>
          {FOLDERS.map((f) => {
            const Icon = f.icon;
            return (
              <button key={f.id} type="button" className="jc-mail__folder" data-active={folder === f.id} onClick={() => setFolder(f.id)}>
                <Icon size={15} strokeWidth={1.9} />
                <span>{f.label}</span>
                {f.count ? <span className="jc-mail__folder-count">{f.count}</span> : null}
              </button>
            );
          })}
        </nav>

        <div className="jc-mail__section-title">Labels</div>
        {LABELS.map((l) => (
          <button key={l.name} type="button" className="jc-mail__label">
            <span className="jc-mail__label-dot" style={{ background: l.color }} />
            <span>{l.name}</span>
          </button>
        ))}

        <div className="jc-mail__section-title">Views</div>
        <button type="button" className="jc-mail__folder"><Filter size={14} /><span>Waiting for reply</span></button>
        <button type="button" className="jc-mail__folder"><Filter size={14} /><span>Attachments</span></button>
      </aside>

      <section className="jc-mail__list-pane">
        <header className="jc-mail__list-head">
          <div className="jc-mail__list-title">
            <h2>{FOLDERS.find((f) => f.id === folder)?.label ?? "Inbox"}</h2>
            <span className="jc-mail__list-count">{list.length}</span>
          </div>
          <div className="jc-mail__list-tools">
            <button type="button" aria-label="Refresh"><RefreshCw size={15} /></button>
            <button type="button" aria-label="Filter"><Filter size={15} /></button>
          </div>
        </header>
        <div className="jc-mail__search">
          <Search size={14} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search mail" />
        </div>
        <ul className="jc-mail__list">
          {list.map((m) => (
            <li key={m.id} className="jc-mail__row" data-active={selected?.id === m.id} data-unread={!m.read} onClick={() => setSelectedId(m.id)}>
              <div className="jc-mail__row-avatar">{m.initials}</div>
              <div className="jc-mail__row-body">
                <div className="jc-mail__row-line1">
                  <span className="jc-mail__row-from">{m.from}</span>
                  <span className="jc-mail__row-time">{m.time}</span>
                </div>
                <div className="jc-mail__row-subject">{m.subject}</div>
                <div className="jc-mail__row-line3">
                  <span className="jc-mail__row-preview">{m.preview}</span>
                  <span className="jc-mail__row-icons">
                    {m.hasAttachment && <Paperclip size={12} />}
                    {m.starred && <Star size={12} className="jc-mail__row-star" />}
                  </span>
                </div>
                {m.label && (
                  <span className="jc-mail__row-label" style={(() => { const l = LABELS.find((x) => x.name === m.label)!; return { background: l.bg, color: l.color }; })()}>
                    <Tag size={10} /> {m.label}
                  </span>
                )}
              </div>
            </li>
          ))}
          {list.length === 0 && <li className="jc-mail__empty">No messages in this folder.</li>}
        </ul>
      </section>

      <section className="jc-mail__reader">
        {selected ? (
          <>
            <header className="jc-mail__reader-head">
              <div>
                <h1 className="jc-mail__reader-subject">{selected.subject}</h1>
                <div className="jc-mail__reader-meta">
                  <div className="jc-mail__reader-avatar">{selected.initials}</div>
                  <div>
                    <div className="jc-mail__reader-from">{selected.from}</div>
                    <div className="jc-mail__reader-time">to me · {selected.time}</div>
                  </div>
                </div>
              </div>
              <div className="jc-mail__reader-tools">
                <button type="button"><Reply size={14} /> Reply</button>
                <button type="button"><ReplyAll size={14} /> Reply all</button>
                <button type="button"><Forward size={14} /> Forward</button>
                <button type="button" aria-label="Archive"><Archive size={15} /></button>
                <button type="button" aria-label="Delete"><Trash2 size={15} /></button>
                <button type="button" aria-label="More"><MoreHorizontal size={15} /></button>
              </div>
            </header>

            {selected.crmLink && (
              <div className="jc-mail__crm-context">
                <span className="jc-mail__crm-label">Linked CRM record</span>
                <div className="jc-mail__crm-card">
                  <div className="jc-mail__crm-icon">
                    {selected.crmLink.module === "deals" ? <Handshake size={16} /> : selected.crmLink.module === "leads" ? <Target size={16} /> : <UserCircle2 size={16} />}
                  </div>
                  <div>
                    <div className="jc-mail__crm-name">{selected.crmLink.name}</div>
                    <div className="jc-mail__crm-meta">
                      {selected.crmLink.module.charAt(0).toUpperCase() + selected.crmLink.module.slice(1)}
                      {selected.crmLink.value ? ` · ${selected.crmLink.value}` : ""}
                    </div>
                  </div>
                  <button type="button" className="jc-mail__crm-open">Open <ChevronDown size={12} style={{ transform: "rotate(-90deg)" }} /></button>
                </div>
              </div>
            )}

            <article className="jc-mail__reader-body">
              {selected.body.split("\n").map((line, i) => (
                <p key={i}>{line || "\u00a0"}</p>
              ))}
            </article>

            {selected.hasAttachment && (
              <div className="jc-mail__attachments">
                <div className="jc-mail__att-title"><Paperclip size={13} /> 1 attachment</div>
                <div className="jc-mail__att-card">
                  <FileText size={18} />
                  <div>
                    <div className="jc-mail__att-name">Proposal_Terms.pdf</div>
                    <div className="jc-mail__att-meta">248 KB · PDF</div>
                  </div>
                  <button type="button">Download</button>
                </div>
              </div>
            )}

            <div className="jc-mail__quick-reply">
              <textarea placeholder={`Reply to ${selected.from}…`} rows={3} />
              <div className="jc-mail__quick-reply-actions">
                <button type="button" aria-label="Attach"><Paperclip size={15} /></button>
                <button type="button" className="jc-mail__send-btn"><Send size={13} /> Send</button>
              </div>
            </div>
          </>
        ) : (
          <div className="jc-mail__no-selection">Select a message to read.</div>
        )}
      </section>
    </div>
  );
}
