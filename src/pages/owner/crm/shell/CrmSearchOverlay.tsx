import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, X, Clock, ArrowUpRight, Command } from "lucide-react";
import {
  CRM_PRIMARY_NAV,
  CRM_TEAMSPACE_TOP,
  CRM_TEAMSPACE_FOLDERS,
  type CrmModule,
} from "./modules";

type SampleRecord = {
  id: string;
  module: string;
  moduleLabel: string;
  title: string;
  subtitle: string;
};

const SAMPLE_RECORDS: SampleRecord[] = [
  { id: "L-1041", module: "leads", moduleLabel: "Leads", title: "Amelia Rahman", subtitle: "Emirates NBD · Qualified · Dubai Marina" },
  { id: "L-1042", module: "leads", moduleLabel: "Leads", title: "Yusuf Al Mansoori", subtitle: "Sobha Realty · New · Palm Jumeirah" },
  { id: "D-2210", module: "deals", moduleLabel: "Deals", title: "Palm Jebel Ali Villa — 8BR", subtitle: "AED 42.5M · Proposal · Close Q3" },
  { id: "D-2211", module: "deals", moduleLabel: "Deals", title: "Bugatti Residences PH", subtitle: "AED 18.9M · Negotiation · Close Q4" },
  { id: "C-3315", module: "contacts", moduleLabel: "Contacts", title: "Fatima Khoury", subtitle: "Investor · +971 50 4102 998" },
  { id: "A-4402", module: "accounts", moduleLabel: "Accounts", title: "Meraas Holding", subtitle: "Developer · 214 open opportunities" },
  { id: "T-5501", module: "tasks", moduleLabel: "Tasks", title: "Send LOI to Damac", subtitle: "Due today · High priority" },
  { id: "M-6602", module: "meetings", moduleLabel: "Meetings", title: "Site Visit — Emaar Beachfront", subtitle: "Tomorrow · 11:00 GST" },
  { id: "R-7702", module: "reports", moduleLabel: "Reports", title: "Q2 Pipeline by Owner", subtitle: "Public · Updated 2h ago" },
];

const RECENT_KEY = "jbj_crm_recent_search";

function loadRecents(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecents(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)));
  } catch {}
}

const ALL_MODULES: CrmModule[] = [
  ...CRM_PRIMARY_NAV,
  ...CRM_TEAMSPACE_TOP,
  ...CRM_TEAMSPACE_FOLDERS.flatMap((f) => f.children),
];

type Props = { open: boolean; onClose: () => void };

export default function CrmSearchOverlay({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const [recents, setRecents] = useState<string[]>(loadRecents());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQ("");
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const query = q.trim().toLowerCase();

  const moduleMatches = useMemo(
    () =>
      query
        ? ALL_MODULES.filter((m) => m.label.toLowerCase().includes(query)).slice(0, 6)
        : [],
    [query]
  );

  const recordMatches = useMemo(() => {
    if (!query) return [];
    return SAMPLE_RECORDS.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.subtitle.toLowerCase().includes(query) ||
        r.moduleLabel.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, SampleRecord[]>();
    for (const r of recordMatches) {
      const arr = map.get(r.moduleLabel) || [];
      arr.push(r);
      map.set(r.moduleLabel, arr);
    }
    return Array.from(map.entries());
  }, [recordMatches]);

  const commit = (term: string) => {
    if (!term.trim()) return;
    const next = [term, ...recents.filter((r) => r !== term)];
    setRecents(next);
    saveRecents(next);
  };

  if (!open) return null;

  return (
    <div className="jc-search-overlay" role="dialog" aria-modal="true" aria-label="Search CRM">
      <button className="jc-search-overlay__scrim" aria-label="Close search" onClick={onClose} />
      <div className="jc-search-overlay__panel">
        <div className="jc-search-overlay__bar">
          <Search size={20} strokeWidth={2.2} />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit(q);
            }}
            placeholder="Search Leads, Deals, Contacts, Accounts, Tasks…"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="jc-search-overlay__kbd">
            <Command size={12} /> K
          </kbd>
          <button className="jc-search-overlay__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="jc-search-overlay__body">
          {!query && (
            <>
              <div className="jc-search-overlay__section">
                <div className="jc-search-overlay__section-title">Recent searches</div>
                {recents.length === 0 ? (
                  <div className="jc-search-overlay__empty">No recent searches yet.</div>
                ) : (
                  <ul className="jc-search-overlay__list">
                    {recents.map((r) => (
                      <li key={r}>
                        <button
                          className="jc-search-overlay__row"
                          onClick={() => setQ(r)}
                          type="button"
                        >
                          <Clock size={16} />
                          <span className="jc-search-overlay__row-title">{r}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="jc-search-overlay__section">
                <div className="jc-search-overlay__section-title">Jump to module</div>
                <ul className="jc-search-overlay__grid">
                  {ALL_MODULES.slice(0, 12).map((m) => {
                    const Icon = m.icon;
                    return (
                      <li key={m.slug}>
                        <Link
                          to={`/owner/crm/jbj/${m.slug}`}
                          className="jc-search-overlay__chip"
                          onClick={onClose}
                        >
                          <Icon size={16} />
                          <span>{m.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}

          {query && moduleMatches.length > 0 && (
            <div className="jc-search-overlay__section">
              <div className="jc-search-overlay__section-title">Modules</div>
              <ul className="jc-search-overlay__list">
                {moduleMatches.map((m) => {
                  const Icon = m.icon;
                  return (
                    <li key={m.slug}>
                      <Link
                        to={`/owner/crm/jbj/${m.slug}`}
                        className="jc-search-overlay__row"
                        onClick={() => {
                          commit(q);
                          onClose();
                        }}
                      >
                        <Icon size={16} />
                        <span className="jc-search-overlay__row-title">{m.label}</span>
                        <ArrowUpRight size={14} className="jc-search-overlay__row-arrow" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {query && grouped.length > 0 &&
            grouped.map(([label, rows]) => (
              <div key={label} className="jc-search-overlay__section">
                <div className="jc-search-overlay__section-title">{label}</div>
                <ul className="jc-search-overlay__list">
                  {rows.map((r) => (
                    <li key={r.id}>
                      <Link
                        to={`/owner/crm/jbj/${r.module}`}
                        className="jc-search-overlay__row"
                        onClick={() => {
                          commit(q);
                          onClose();
                        }}
                      >
                        <span className="jc-search-overlay__row-id">{r.id}</span>
                        <span className="jc-search-overlay__row-body">
                          <span className="jc-search-overlay__row-title">{r.title}</span>
                          <span className="jc-search-overlay__row-sub">{r.subtitle}</span>
                        </span>
                        <ArrowUpRight size={14} className="jc-search-overlay__row-arrow" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          {query && moduleMatches.length === 0 && grouped.length === 0 && (
            <div className="jc-search-overlay__empty jc-search-overlay__empty--big">
              No results for "<strong>{q}</strong>".
            </div>
          )}
        </div>

        <div className="jc-search-overlay__footer">
          <span><kbd>↵</kbd> Open</span>
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
