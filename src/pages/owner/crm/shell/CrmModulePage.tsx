import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { CRM_DEFAULT_SECTION, CRM_MODULE_MAP } from "./modules";

/**
 * JBJ CRM — Module views (Phase 3 + Phase 5).
 * Phase 5 adds: List/Kanban view switcher, Kanban board (grouped by stage),
 * and a bulk-action bar that appears when rows are selected.
 * Data-agnostic: renders empty placeholders until per-module data lands.
 */

type ColumnDef = { key: string; label: string; width?: string };
type ViewMode = "list" | "kanban";

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "owner", label: "Record Owner" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "created", label: "Created Time" },
];

const MODULE_COLUMNS: Record<string, ColumnDef[]> = {
  leads: [
    { key: "name", label: "Lead Name" },
    { key: "company", label: "Company" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "source", label: "Lead Source" },
    { key: "owner", label: "Lead Owner" },
  ],
  contacts: [
    { key: "name", label: "Contact Name" },
    { key: "account", label: "Account Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "owner", label: "Contact Owner" },
  ],
  accounts: [
    { key: "name", label: "Account Name" },
    { key: "phone", label: "Phone" },
    { key: "website", label: "Website" },
    { key: "type", label: "Account Type" },
    { key: "owner", label: "Account Owner" },
  ],
  deals: [
    { key: "name", label: "Deal Name" },
    { key: "amount", label: "Amount" },
    { key: "stage", label: "Stage" },
    { key: "close", label: "Closing Date" },
    { key: "owner", label: "Deal Owner" },
  ],
  tasks: [
    { key: "subject", label: "Subject" },
    { key: "due", label: "Due Date" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
    { key: "owner", label: "Task Owner" },
  ],
  meetings: [
    { key: "title", label: "Title" },
    { key: "from", label: "From" },
    { key: "to", label: "To" },
    { key: "location", label: "Location" },
    { key: "owner", label: "Host" },
  ],
  calls: [
    { key: "subject", label: "Subject" },
    { key: "type", label: "Call Type" },
    { key: "start", label: "Call Start Time" },
    { key: "duration", label: "Duration" },
    { key: "owner", label: "Call Owner" },
  ],
  products: [
    { key: "name", label: "Product Name" },
    { key: "code", label: "Product Code" },
    { key: "category", label: "Category" },
    { key: "price", label: "Unit Price" },
    { key: "active", label: "Active" },
  ],
  quotes: [
    { key: "subject", label: "Quote Subject" },
    { key: "account", label: "Account Name" },
    { key: "stage", label: "Quote Stage" },
    { key: "total", label: "Grand Total" },
    { key: "owner", label: "Quote Owner" },
  ],
  invoices: [
    { key: "subject", label: "Invoice Subject" },
    { key: "account", label: "Account Name" },
    { key: "status", label: "Status" },
    { key: "total", label: "Grand Total" },
    { key: "due", label: "Due Date" },
  ],
};

const KANBAN_STAGES: Record<string, string[]> = {
  leads: ["Not Contacted", "Attempted", "Contacted", "Junk Lead", "Lost Lead"],
  deals: [
    "Qualification",
    "Needs Analysis",
    "Proposal",
    "Negotiation",
    "Closed Won",
    "Closed Lost",
  ],
  tasks: ["Not Started", "In Progress", "Waiting", "Deferred", "Completed"],
  cases: ["New", "On Hold", "Escalated", "Closed"],
  quotes: ["Draft", "Negotiation", "Delivered", "On Hold", "Confirmed", "Closed"],
  "sales-orders": ["Created", "Approved", "Delivered", "Cancelled"],
  "purchase-orders": ["Created", "Approved", "Delivered", "Cancelled"],
  invoices: ["Created", "Sent", "Paid", "Cancelled"],
};

const columnsFor = (slug: string): ColumnDef[] => MODULE_COLUMNS[slug] ?? DEFAULT_COLUMNS;
const canKanban = (slug: string) => Boolean(KANBAN_STAGES[slug]);

function BulkActionBar({ count, onClear }: { count: number; onClear: () => void }) {
  return (
    <div className="jc-bulk" role="region" aria-label="Bulk actions">
      <span className="jc-bulk__count">{count} selected</span>
      <div className="jc-bulk__sep" />
      <button type="button" className="jc-bulk__btn"><Mail size={14} /> Mass Email</button>
      <button type="button" className="jc-bulk__btn"><UserPlus size={14} /> Change Owner</button>
      <button type="button" className="jc-bulk__btn"><Tag size={14} /> Add Tags</button>
      <button type="button" className="jc-bulk__btn jc-bulk__btn--danger"><Trash2 size={14} /> Delete</button>
      <div className="jc-bulk__spacer" />
      <button type="button" className="jc-bulk__close" onClick={onClear} aria-label="Clear selection">
        <X size={14} />
      </button>
    </div>
  );
}

function FilterGroup({
  title, items, defaultOpen = false, withWithout = false,
}: { title: string; items: string[]; defaultOpen?: boolean; withWithout?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<Record<string, "with" | "without">>({});
  return (
    <div className="jc-flt__group" data-open={open}>
      <button type="button" className="jc-flt__group-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <ChevronRight size={12} className="jc-flt__caret" data-open={open} />
        <span>{title}</span>
      </button>
      {open && (
        <ul className="jc-flt__items">
          {items.map((it) => {
            const on = !!checked[it];
            return (
              <li key={it} className="jc-flt__item" data-on={on}>
                <label className="jc-flt__check">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => setChecked((p) => ({ ...p, [it]: e.target.checked }))}
                  />
                  <span>{it}</span>
                </label>
                {withWithout && on && (
                  <div className="jc-flt__ww">
                    <button
                      type="button"
                      data-active={(mode[it] ?? "with") === "with"}
                      onClick={() => setMode((p) => ({ ...p, [it]: "with" }))}
                    >with</button>
                    <button
                      type="button"
                      data-active={mode[it] === "without"}
                      onClick={() => setMode((p) => ({ ...p, [it]: "without" }))}
                    >without</button>
                    <span className="jc-flt__any">Any</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function KanbanView({ slug, label }: { slug: string; label: string }) {
  const stages = KANBAN_STAGES[slug] ?? [];
  return (
    <div className="jc-kanban" role="list" aria-label={`${label} kanban`}>
      {stages.map((stage) => (
        <section key={stage} className="jc-kanban__col" role="listitem">
          <header className="jc-kanban__head">
            <div className="jc-kanban__title">
              <span className="jc-kanban__dot" aria-hidden="true" />
              <h4>{stage}</h4>
            </div>
            <span className="jc-kanban__count">0</span>
          </header>
          <div className="jc-kanban__meta">USD 0.00 · 0 Record(s)</div>
          <div className="jc-kanban__body">
            <div className="jc-kanban__empty">Drop {label.toLowerCase()} here</div>
          </div>
        </section>
      ))}
    </div>
  );
}

function ModuleListView({ slug, label, section }: { slug: string; label: string; section: string }) {
  const columns = useMemo(() => columnsFor(slug), [slug]);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const plural = /s$/.test(label) ? label : `${label}s`;
  const navigate = useNavigate();
  const goCreate = () => navigate(`/owner/crm/jbj/${section}/new`);
  const kanbanAvailable = canKanban(slug);
  const showKanban = view === "kanban" && kanbanAvailable;

  return (
    <div className="jc-list" data-no-contrast-guard>
      <div className="jc-list__toolbar">
        <button type="button" className="jc-view-picker">
          <span>All {plural}</span>
          <ChevronDown size={15} />
        </button>
        <span className="jc-list__count">0 Records</span>
        {kanbanAvailable && (
          <div className="jc-view-switch" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              data-active={view === "list"}
              onClick={() => setView("list")}
              title="List View"
            >
              <ListIcon size={15} />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "kanban"}
              data-active={view === "kanban"}
              onClick={() => setView("kanban")}
              title="Kanban View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        )}
        <div className="jc-list__spacer" />
        <button type="button" className="jc-list__icon" aria-label="Search"><Search size={16} /></button>
        <button type="button" className="jc-list__icon" aria-label="Refresh"><RefreshCw size={16} /></button>
        <button type="button" className="jc-list__actions">
          Actions <ChevronDown size={13} />
        </button>
        <button type="button" className="jc-list__cta" onClick={goCreate}>
          <Plus size={15} /> Create {label}
        </button>
        <button type="button" className="jc-list__icon" aria-label="More"><MoreHorizontal size={18} /></button>
      </div>

      {selected.size > 0 && (
        <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())} />
      )}

      {showKanban ? (
        <KanbanView slug={slug} label={label} />
      ) : (
        <div className="jc-list__body" data-filters={filtersOpen ? "open" : "closed"}>
          <aside className="jc-list__filters jc-flt" aria-label="Filters">
            <header className="jc-flt__head">
              <button
                type="button"
                className="jc-flt__toggle"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
              >
                <Filter size={13} /> Filter {plural} by
                <ChevronRight size={13} className="jc-list__filters-caret" data-open={filtersOpen} />
              </button>
              <input className="jc-flt__search" placeholder="Search" />
            </header>

            <FilterGroup title="System Defined Filters" defaultOpen items={[
              "Activities","Campaigns","Latest Email Status","Locked","Record Action",
              "Related Records Action","Touched Records","Untouched Records","Cadences",
            ]} />

            <FilterGroup title="Filter By Fields" defaultOpen items={[
              "Address","Address - City","Address - Country / Region",
              "Address - Flat / House No. / Building / Apartment Name",
              "Address - State / Province","Address - Street",
              "Owner","Created Time","Modified Time","Tag","Website",
            ]} />

            <FilterGroup title="Filter By Related Modules" defaultOpen withWithout items={[
              "Accounts (Connected Records)","Calls","Campaigns (Connected Records)",
              "Cases (Connected Records)","Contacts (Connected Records)",
              "Deals (Connected Records)","Emails","Invitees (Invited Meetings)",
              "Invoices (Connected Records)","Lead Product Relation (Products)",
              "Meetings","Notes","Products (Connected Records)",
              "Purchase Orders (Connected Records)","Quotes (Connected Records)",
              "Sales Orders (Connected Records)","Tasks",
            ]} />

            <div className="jc-flt__foot">
              <button type="button" className="jc-flt__apply">Apply Filter</button>
              <button type="button" className="jc-flt__clear">Clear</button>
            </div>
          </aside>

          <section className="jc-list__table" role="table" aria-label={`${plural} table`}>
            <div className="jc-list__thead" role="row">
              <div className="jc-list__th jc-list__th--check" role="columnheader">
                <input type="checkbox" aria-label={`Select all ${plural}`} />
              </div>
              {columns.map((c) => (
                <div key={c.key} className="jc-list__th" role="columnheader">
                  {c.label}
                </div>
              ))}
              <div className="jc-list__th jc-list__th--tools" role="columnheader">
                <SlidersHorizontal size={14} />
              </div>
            </div>

            <div className="jc-list__empty" role="row">
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
                <rect x="10" y="16" width="52" height="40" rx="4" stroke="#CBD2E1" strokeWidth="1.6" />
                <path d="M18 28h36M18 36h36M18 44h24" stroke="#CBD2E1" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <h3>No {plural} found</h3>
              <p>Create your first {label.toLowerCase()} to get started.</p>
              <button type="button" className="jc-list__cta" onClick={goCreate}>
                <Plus size={15} /> Create {label}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ProjectIllustration({ variant }: { variant: "connect" | "track" | "deliver" }) {
  if (variant === "connect") {
    return (
      <svg viewBox="0 0 360 170" aria-hidden="true" className="jc-project-illo">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
          <rect x="31" y="12" width="126" height="70" rx="18" />
          <path d="M53 54c28 16 35-17 54-7 15 8 28-11 50-17" />
          <circle cx="203" cy="78" r="33" />
          <rect x="256" y="13" width="103" height="72" rx="16" />
          <path d="M280 35h42m-42 17h42m-42 17h32" />
          <path d="M313 30v-9h28v13" />
          <circle cx="331" cy="57" r="8" />
          <path d="M316 80c5-18 29-18 34 0" />
        </g>
      </svg>
    );
  }
  if (variant === "track") {
    return (
      <svg viewBox="0 0 360 170" aria-hidden="true" className="jc-project-illo">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
          <circle cx="80" cy="54" r="31" />
          <path d="M60 91h40c12 0 20 9 20 21v48H40v-48c0-12 8-21 20-21z" />
          <rect x="243" y="14" width="80" height="55" rx="11" />
          <rect x="259" y="82" width="55" height="56" rx="9" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 360 170" aria-hidden="true" className="jc-project-illo">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
        <circle cx="180" cy="65" r="54" />
        <path d="M148 58l30 28 51-50" stroke="var(--jbjcrm-emerald-line)" strokeWidth="5" />
      </g>
    </svg>
  );
}

function ProjectsIntro() {
  return (
    <section className="jc-projects-screen" aria-label="Projects introduction">
      <div className="jc-projects-copy">
        <h2>Unified Sales and Project Management</h2>
        <p>A smarter way to bridge the gap between sales and<br />project tracking. <button type="button">Learn More</button></p>
      </div>
      <div className="jc-projects-grid">
        <article className="jc-project-step"><ProjectIllustration variant="connect" /><h3>Connect</h3><p>Integrate JBJ Projects to create and associate<br />projects in JBJ CRM.</p></article>
        <article className="jc-project-step"><ProjectIllustration variant="track" /><h3>Track</h3><p>Stay on top of your tasks and milestones.</p></article>
        <article className="jc-project-step"><ProjectIllustration variant="deliver" /><h3>Deliver</h3><p>Execute customer projects on time, every time.</p></article>
      </div>
      <div className="jc-projects-cta">
        <button type="button" className="jc-get-started">Get Started</button>
        <button type="button" className="jc-hide-tab">Don't show this tab again.</button>
      </div>
    </section>
  );
}

export default function CrmModulePage() {
  const { section = CRM_DEFAULT_SECTION } = useParams();
  const mod = CRM_MODULE_MAP[section];
  const slug = mod?.slug ?? section;

  if (slug === "projects") return <ProjectsIntro />;

  return <ModuleListView slug={slug} label={mod?.label ?? section} section={section} />;
}
