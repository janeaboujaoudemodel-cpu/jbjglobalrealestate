import { useState } from "react";
import {
  BarChart3,
  ChevronRight,
  FileBarChart2,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  Users,
} from "lucide-react";

/**
 * JBJ CRM — Reports (Phase 6)
 * Zoho-parity Reports library: folder rail on the left, report list on the right.
 */

type Folder = { key: string; label: string; count: number; icon: typeof FolderOpen };

const FOLDERS: Folder[] = [
  { key: "favourites", label: "Favourite Reports", count: 0, icon: Star },
  { key: "all", label: "All Reports", count: 42, icon: FileBarChart2 },
  { key: "public", label: "Public Reports", count: 18, icon: Users },
  { key: "leads", label: "Lead Reports", count: 8, icon: FolderOpen },
  { key: "deals", label: "Deal Reports", count: 9, icon: FolderOpen },
  { key: "accounts", label: "Account and Contact Reports", count: 6, icon: FolderOpen },
  { key: "activities", label: "Activity Reports", count: 5, icon: FolderOpen },
  { key: "campaigns", label: "Campaign Reports", count: 3, icon: FolderOpen },
  { key: "inventory", label: "Inventory Reports", count: 4, icon: FolderOpen },
  { key: "custom", label: "My Custom Reports", count: 0, icon: FolderOpen },
];

const SAMPLE_REPORTS: Record<string, { name: string; module: string; owner: string; modified: string }[]> = {
  all: [
    { name: "Leads by Source", module: "Leads", owner: "Ban Al Amiri", modified: "Today" },
    { name: "Leads by Owner", module: "Leads", owner: "Ban Al Amiri", modified: "Today" },
    { name: "Deals Pipeline by Stage", module: "Deals", owner: "Ban Al Amiri", modified: "Yesterday" },
    { name: "Deals Closing This Month", module: "Deals", owner: "Ban Al Amiri", modified: "Yesterday" },
    { name: "Sales by Agent (MTD)", module: "Deals", owner: "Ban Al Amiri", modified: "2 days ago" },
    { name: "Tasks Overdue", module: "Tasks", owner: "System", modified: "3 days ago" },
    { name: "Meetings This Week", module: "Meetings", owner: "System", modified: "3 days ago" },
    { name: "Calls Summary by Agent", module: "Calls", owner: "System", modified: "1 week ago" },
    { name: "Invoice Aging Summary", module: "Invoices", owner: "Finance", modified: "1 week ago" },
    { name: "Quotes vs Won", module: "Quotes", owner: "Ban Al Amiri", modified: "2 weeks ago" },
  ],
};

export default function CrmReports() {
  const [active, setActive] = useState<string>("all");
  const rows = SAMPLE_REPORTS[active] ?? [];

  return (
    <div className="jc-reports" data-no-contrast-guard>
      <aside className="jc-reports__rail" aria-label="Report folders">
        <div className="jc-reports__rail-head">
          <h3>Folders</h3>
          <button type="button" aria-label="New folder"><Plus size={14} /></button>
        </div>
        <label className="jc-reports__search">
          <Search size={14} />
          <input placeholder="Search folders" />
        </label>
        <ul className="jc-reports__folders">
          {FOLDERS.map((f) => {
            const Icon = f.icon;
            return (
              <li key={f.key}>
                <button
                  type="button"
                  data-active={active === f.key}
                  onClick={() => setActive(f.key)}
                >
                  <Icon size={15} />
                  <span>{f.label}</span>
                  <em>{f.count}</em>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="jc-reports__main">
        <header className="jc-reports__head">
          <div>
            <div className="jc-crumbs">
              <span>Reports</span>
              <ChevronRight size={12} />
              <strong>{FOLDERS.find((f) => f.key === active)?.label ?? "All"}</strong>
            </div>
            <h2>{FOLDERS.find((f) => f.key === active)?.label}</h2>
          </div>
          <div className="jc-reports__cta">
            <button type="button" className="jc-btn jc-btn--ghost">
              <BarChart3 size={14} /> Analytics
            </button>
            <button type="button" className="jc-btn jc-btn--primary">
              <Plus size={14} /> Create Report
            </button>
            <button type="button" className="jc-btn jc-btn--icon" aria-label="More">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </header>

        <div className="jc-reports__table" role="table" aria-label="Reports">
          <div className="jc-reports__thead" role="row">
            <div role="columnheader">Report Name</div>
            <div role="columnheader">Module</div>
            <div role="columnheader">Owner</div>
            <div role="columnheader">Last Modified</div>
            <div role="columnheader" aria-label="Actions" />
          </div>
          {rows.length === 0 ? (
            <div className="jc-reports__empty">
              <FileBarChart2 size={40} />
              <h3>No reports yet</h3>
              <p>Create your first report to visualize this data.</p>
            </div>
          ) : (
            rows.map((r) => (
              <div key={r.name} className="jc-reports__row" role="row">
                <div><Star size={13} className="jc-reports__star" /> {r.name}</div>
                <div>{r.module}</div>
                <div>{r.owner}</div>
                <div>{r.modified}</div>
                <div><button type="button" aria-label="Row actions"><MoreHorizontal size={15} /></button></div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
